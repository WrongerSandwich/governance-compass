import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const USER = "66666666-6666-4666-8666-666666666666";

vi.mock("@/lib/auth", () => ({ auth: async () => ({ user: { id: USER } }) }));

const upsertVisibility = vi.fn();
const deleteManyVisibility = vi.fn();
const touched = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    axisVisibility: {
      upsert: (args: unknown) => upsertVisibility(args),
      deleteMany: (args: unknown) => deleteManyVisibility(args),
    },
    group: { create: touched, findUnique: touched },
    groupMember: { create: touched, findUnique: touched },
    userProfile: { count: touched, create: touched },
  },
}));

const [groups, join, materialize, visibility] = await Promise.all([
  import("@/app/api/groups/route"),
  import("@/app/api/groups/join/route"),
  import("@/app/api/profile/materialize/route"),
  import("@/app/api/account/visibility/route"),
]);

function malformed() {
  return {
    json: async () => {
      throw new SyntaxError("Unexpected end of JSON input");
    },
  } as unknown as NextRequest;
}

beforeEach(() => {
  upsertVisibility.mockReset().mockResolvedValue({});
  deleteManyVisibility.mockReset().mockResolvedValue({});
  touched.mockReset();
});

describe("malformed JSON bodies", () => {
  const routes: [string, (r: NextRequest) => Promise<Response>][] = [
    ["POST /api/groups", groups.POST],
    ["POST /api/groups/join", join.POST],
    ["POST /api/profile/materialize", materialize.POST],
    ["POST /api/account/visibility", visibility.POST],
  ];

  for (const [name, handler] of routes) {
    it(`${name} answers 400, not 500`, async () => {
      const res = await handler(malformed());

      expect(res.status).toBe(400);
      expect(touched).not.toHaveBeenCalled();
    });
  }
});

describe("POST /api/account/visibility", () => {
  function post(body: unknown) {
    return visibility.POST({ json: async () => body } as unknown as NextRequest);
  }

  it("reports 400 for an axis that does not exist", async () => {
    upsertVisibility.mockRejectedValue(
      Object.assign(new Error("Foreign key constraint failed"), { code: "P2003" })
    );

    const res = await post({ axisId: 999, hidden: true });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Unknown axis" });
  });

  it("still hides a real axis", async () => {
    const res = await post({ axisId: 3, hidden: true });

    expect(res.status).toBe(200);
    expect(upsertVisibility).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_axisId: { userId: USER, axisId: 3 } },
      })
    );
  });

  it("does not swallow unexpected database failures", async () => {
    upsertVisibility.mockRejectedValue(new Error("connection terminated"));

    await expect(post({ axisId: 3, hidden: true })).rejects.toThrow("connection terminated");
  });
});
