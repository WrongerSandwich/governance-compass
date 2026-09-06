import { describe, it, expect, vi, beforeEach } from "vitest";

const createUser = vi.fn();
const getUserByEmail = vi.fn();
const getUserByAccount = vi.fn();

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: () => ({ createUser, getUserByEmail, getUserByAccount }),
}));

vi.resetModules();
const { normalizingPrismaAdapter } = await import("@/lib/auth-adapter");

beforeEach(() => {
  createUser.mockReset().mockImplementation(async (user) => user);
  getUserByEmail.mockReset().mockResolvedValue(null);
  getUserByAccount.mockReset().mockResolvedValue(null);
});

describe("normalizingPrismaAdapter", () => {
  it("lowercases the address on an OAuth account it creates", async () => {
    await normalizingPrismaAdapter().createUser!({
      id: "u1",
      email: "Foo@Example.com",
      emailVerified: null,
    });

    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: "u1", email: "foo@example.com" })
    );
  });

  it("lowercases the address when linking an OAuth account to an existing user", async () => {
    await normalizingPrismaAdapter().getUserByEmail!("Foo@Example.com");

    expect(getUserByEmail).toHaveBeenCalledWith("foo@example.com");
  });

  it("passes the rest of the adapter through untouched", async () => {
    const adapter = normalizingPrismaAdapter();

    await adapter.getUserByAccount!({ provider: "google", providerAccountId: "123" });

    expect(getUserByAccount).toHaveBeenCalledWith({
      provider: "google",
      providerAccountId: "123",
    });
  });
});
