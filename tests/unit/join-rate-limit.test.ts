import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const findGroup = vi.fn();
const findMember = vi.fn();
const createMember = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: async () => ({ user: { id: "user-1" } }) }));
vi.mock("@/lib/db", () => ({
  db: {
    group: { findUnique: (args: unknown) => findGroup(args) },
    groupMember: {
      findUnique: (args: unknown) => findMember(args),
      create: (args: unknown) => createMember(args),
    },
  },
}));

const { POST } = await import("@/app/api/groups/join/route");

function post(ip: string) {
  return POST({
    headers: new Headers({ "x-forwarded-for": ip }),
    json: async () => ({ inviteCode: "ABCD-EFGH" }),
  } as unknown as NextRequest);
}

beforeEach(() => {
  findGroup.mockReset().mockResolvedValue({ id: "group-1", name: "Civics" });
  findMember.mockReset().mockResolvedValue(null);
  createMember.mockReset().mockResolvedValue({});
});

describe("POST /api/groups/join", () => {
  it("throttles repeated invite-code attempts from one address", async () => {
    const ip = "203.0.113.57";

    for (let count = 0; count < 10; count += 1) {
      expect((await post(ip)).status).toBe(201);
    }

    const res = await post(ip);
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("900");
  });
});
