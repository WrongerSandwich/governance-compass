import { describe, it, expect, vi, beforeEach } from "vitest";

const findUserByEmail = vi.fn();

vi.mock("@/lib/user-lookup", () => ({
  findUserByEmail: (email: string) => findUserByEmail(email),
  normalizeEmail: (email: string) => email.trim().toLowerCase(),
}));

vi.mock("bcryptjs", () => ({
  default: { compare: async (password: string, hash: string) => hash === `hashed:${password}` },
}));

const { authorizeCredentials } = await import("@/lib/credentials");

const USER = {
  id: "u1",
  email: "foo@example.com",
  name: "Foo",
  passwordHash: "hashed:correct horse",
};

beforeEach(() => {
  findUserByEmail.mockReset().mockResolvedValue(USER);
});

describe("authorizeCredentials", () => {
  it("signs in an account registered with different email casing", async () => {
    const result = await authorizeCredentials({
      email: "FOO@Example.com",
      password: "correct horse",
    });

    expect(findUserByEmail).toHaveBeenCalledWith("FOO@Example.com");
    expect(result).toEqual({ id: "u1", email: "foo@example.com", name: "Foo" });
  });

  it("rejects a wrong password", async () => {
    await expect(
      authorizeCredentials({ email: "foo@example.com", password: "wrong" })
    ).resolves.toBeNull();
  });

  it("rejects an unknown address", async () => {
    findUserByEmail.mockResolvedValue(null);

    await expect(
      authorizeCredentials({ email: "nobody@example.com", password: "correct horse" })
    ).resolves.toBeNull();
  });

  it("rejects an OAuth-only account that has no password", async () => {
    findUserByEmail.mockResolvedValue({ ...USER, passwordHash: null });

    await expect(
      authorizeCredentials({ email: "foo@example.com", password: "correct horse" })
    ).resolves.toBeNull();
  });

  it("rejects missing credentials without touching the database", async () => {
    await expect(authorizeCredentials({ password: "correct horse" })).resolves.toBeNull();
    await expect(authorizeCredentials({ email: "foo@example.com" })).resolves.toBeNull();
    await expect(authorizeCredentials(undefined)).resolves.toBeNull();
    expect(findUserByEmail).not.toHaveBeenCalled();
  });
});
