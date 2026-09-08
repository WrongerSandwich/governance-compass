import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { PrismaClient, PrismaPg } = vi.hoisted(() => ({
  PrismaClient: vi.fn(),
  PrismaPg: vi.fn(),
}));

vi.mock("@/generated/prisma/client", () => ({ PrismaClient }));
vi.mock("@prisma/adapter-pg", () => ({ PrismaPg }));

describe("db", () => {
  const databaseUrl = "postgresql://user:pass@localhost:5432/app";
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.resetModules();
    PrismaClient.mockReset().mockImplementation(function PrismaClientMock() {
      return { client: true };
    });
    PrismaPg.mockReset().mockImplementation(function PrismaPgMock() {
      return { adapter: true };
    });
    process.env.DATABASE_URL = databaseUrl;
    delete (globalThis as { prisma?: unknown }).prisma;
  });

  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
    delete (globalThis as { prisma?: unknown }).prisma;
  });

  it("creates the shared client with a PostgreSQL adapter", async () => {
    const { db } = await import("@/lib/db");

    expect(PrismaPg).toHaveBeenCalledWith({ connectionString: databaseUrl });
    expect(PrismaClient).toHaveBeenCalledWith({ adapter: expect.anything() });
    expect(db).toBe(PrismaClient.mock.results[0].value);
  });
});
