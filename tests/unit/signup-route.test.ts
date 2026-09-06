import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const findFirst = vi.fn();
const create = vi.fn();

vi.mock("@/lib/db", () => ({
  db: { user: { findFirst: (args: unknown) => findFirst(args), create: (args: unknown) => create(args) } },
}));

vi.mock("bcryptjs", () => ({
  default: { hash: async (password: string) => `hashed:${password}` },
}));

const { POST } = await import("@/app/api/auth/signup/route");

function post(body: unknown) {
  return POST({ json: async () => body } as unknown as NextRequest);
}

function postRaw(json: () => Promise<unknown>) {
  return POST({ json } as unknown as NextRequest);
}

const VALID = { email: "Foo@Example.com", password: "correct horse", name: "Foo" };

beforeEach(() => {
  findFirst.mockReset().mockResolvedValue(null);
  create.mockReset().mockResolvedValue({ id: "u1" });
});

describe("POST /api/auth/signup", () => {
  it("stores the email lowercased", async () => {
    const res = await post(VALID);

    expect(res.status).toBe(201);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ email: "foo@example.com" }) })
    );
  });

  it("rejects an address that already exists in different casing", async () => {
    findFirst.mockResolvedValue({ id: "existing", email: "foo@example.com" });

    const res = await post(VALID);

    expect(res.status).toBe(409);
    expect(create).not.toHaveBeenCalled();
  });

  it("answers the losing side of a concurrent signup with 409, not 500", async () => {
    // Both requests pass the existence check; Postgres rejects the second write.
    create.mockRejectedValue(Object.assign(new Error("Unique constraint failed"), { code: "P2002" }));

    const res = await post(VALID);

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({ error: "Email already registered" });
  });

  it("does not swallow unexpected database failures", async () => {
    create.mockRejectedValue(new Error("connection terminated"));

    await expect(post(VALID)).rejects.toThrow("connection terminated");
  });

  it("answers a malformed body with 400", async () => {
    const res = await postRaw(async () => {
      throw new SyntaxError("Unexpected end of JSON input");
    });

    expect(res.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it("still rejects input that fails the schema", async () => {
    const res = await post({ email: "not-an-email", password: "short" });

    expect(res.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
});
