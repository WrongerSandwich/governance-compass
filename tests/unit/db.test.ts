import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { PrismaClient } = vi.hoisted(() => ({ PrismaClient: vi.fn() }));

vi.mock("@/generated/prisma/client", () => ({ PrismaClient }));

describe("db", () => {
  const databaseUrl = "postgresql://user:pass@localhost:5432/app";
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.resetModules();
    PrismaClient.mockReset().mockImplementation(function PrismaClientMock() {
      return { client: true };
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

    expect(PrismaClient).toHaveBeenCalledWith({
      adapter: expect.objectContaining({
        config: { connectionString: databaseUrl },
        provider: "postgres",
      }),
    });
    expect(db).toBe(PrismaClient.mock.results[0].value);
  });

  it("fails fast when the database URL is missing", async () => {
    delete process.env.DATABASE_URL;

    await expect(import("@/lib/db")).rejects.toThrow("DATABASE_URL");
  });
});
