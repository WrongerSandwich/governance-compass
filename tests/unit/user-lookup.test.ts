import { describe, it, expect, vi, beforeEach } from "vitest";

const findUnique = vi.fn();

vi.mock("@/lib/db", () => ({ db: { user: { findUnique: (args: unknown) => findUnique(args) } } }));

// `pool: "vmForks"` shares one module registry per worker, so a file that ran
// earlier can leave `@/lib/user-lookup` bound to *its* `@/lib/db` mock. Reset
// so the import below picks up the mock registered in this file.
vi.resetModules();
const { findUserByEmail, normalizeEmail } = await import("@/lib/user-lookup");

describe("normalizeEmail", () => {
  it("lowercases the address", () => {
    expect(normalizeEmail("Foo@Example.COM")).toBe("foo@example.com");
  });

  it("strips surrounding whitespace", () => {
    expect(normalizeEmail("  foo@example.com \n")).toBe("foo@example.com");
  });

  it("leaves an already-normal address alone", () => {
    expect(normalizeEmail("foo@example.com")).toBe("foo@example.com");
  });
});

describe("findUserByEmail", () => {
  beforeEach(() => {
    findUnique.mockReset().mockResolvedValue(null);
  });

  it("matches the stored address exactly, on the unique index", async () => {
    await findUserByEmail("FOO@Example.com");

    expect(findUnique).toHaveBeenCalledWith({ where: { email: "foo@example.com" } });
  });

  it("treats a LIKE wildcard in the address as an ordinary character", async () => {
    // A pattern match (Prisma's `mode: "insensitive"` compiles to ILIKE) would
    // let `foo_bar@example.com` resolve to a *different* user's `fooxbar@…`
    // account: signup would wrongly 409 and login would check the password
    // against the wrong hash.
    await findUserByEmail("foo_bar@example.com");
    await findUserByEmail("100%@example.com");

    for (const [args] of findUnique.mock.calls) {
      expect(args).toEqual({ where: { email: expect.any(String) } });
    }
    expect(findUnique).toHaveBeenNthCalledWith(1, { where: { email: "foo_bar@example.com" } });
    expect(findUnique).toHaveBeenNthCalledWith(2, { where: { email: "100%@example.com" } });
  });

  it("returns the matched user", async () => {
    findUnique.mockResolvedValue({ id: "u1", email: "foo@example.com" });

    await expect(findUserByEmail("Foo@example.com")).resolves.toEqual({
      id: "u1",
      email: "foo@example.com",
    });
  });

  it("returns null when nobody has that address", async () => {
    await expect(findUserByEmail("nobody@example.com")).resolves.toBeNull();
  });
});
