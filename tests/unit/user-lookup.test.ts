import { describe, it, expect, vi, beforeEach } from "vitest";

const findFirst = vi.fn();

vi.mock("@/lib/db", () => ({ db: { user: { findFirst: (args: unknown) => findFirst(args) } } }));

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
    findFirst.mockReset();
    findFirst.mockResolvedValue(null);
  });

  it("matches regardless of the casing stored at signup", async () => {
    await findUserByEmail("FOO@Example.com");

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: { equals: "foo@example.com", mode: "insensitive" } },
      })
    );
  });

  it("resolves the oldest account when legacy rows differ only by casing", async () => {
    await findUserByEmail("foo@example.com");

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "asc" } })
    );
  });

  it("returns the matched user", async () => {
    findFirst.mockResolvedValue({ id: "u1", email: "foo@example.com" });

    await expect(findUserByEmail("Foo@example.com")).resolves.toEqual({
      id: "u1",
      email: "foo@example.com",
    });
  });
});
