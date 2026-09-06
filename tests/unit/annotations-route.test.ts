import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const AXIS_SCORE_ID = "11111111-1111-4111-8111-111111111111";
const OWNER = "user-owner";

const sessionUserId = { current: OWNER as string | null };

vi.mock("@/lib/auth", () => ({
  auth: async () =>
    sessionUserId.current ? { user: { id: sessionUserId.current } } : null,
}));

const findUniqueAxisScore = vi.fn();
const findUniqueAnnotation = vi.fn();
const upsertAnnotation = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    axisScore: { findUnique: (args: unknown) => findUniqueAxisScore(args) },
    annotation: {
      findUnique: (args: unknown) => findUniqueAnnotation(args),
      upsert: (args: unknown) => upsertAnnotation(args),
    },
  },
}));

const { POST } = await import("@/app/api/annotations/route");

function post(body: unknown) {
  return POST({ json: async () => body } as unknown as NextRequest);
}

const VALID = { axisScoreId: AXIS_SCORE_ID, text: "Worth revisiting." };

beforeEach(() => {
  sessionUserId.current = OWNER;
  findUniqueAxisScore.mockReset().mockResolvedValue({
    id: AXIS_SCORE_ID,
    profile: { userId: OWNER },
  });
  findUniqueAnnotation.mockReset().mockResolvedValue(null);
  upsertAnnotation.mockReset().mockResolvedValue({ id: "a1", text: VALID.text });
});

describe("POST /api/annotations", () => {
  it("upserts on the one-per-user-per-axis-score key rather than racing a create", async () => {
    const res = await post(VALID);

    expect(res.status).toBe(201);
    expect(upsertAnnotation).toHaveBeenCalledWith({
      where: { axisScoreId_userId: { axisScoreId: AXIS_SCORE_ID, userId: OWNER } },
      update: { text: VALID.text },
      create: { axisScoreId: AXIS_SCORE_ID, userId: OWNER, text: VALID.text },
    });
  });

  it("reports 200 when the note already existed", async () => {
    findUniqueAnnotation.mockResolvedValue({ id: "a1" });

    const res = await post(VALID);

    expect(res.status).toBe(200);
  });

  it("answers a malformed body with 400", async () => {
    const res = await POST({
      json: async () => {
        throw new SyntaxError("Unexpected end of JSON input");
      },
    } as unknown as NextRequest);

    expect(res.status).toBe(400);
    expect(upsertAnnotation).not.toHaveBeenCalled();
  });

  it("still refuses an axis score owned by someone else", async () => {
    findUniqueAxisScore.mockResolvedValue({ id: AXIS_SCORE_ID, profile: { userId: "someone-else" } });

    const res = await post(VALID);

    expect(res.status).toBe(403);
    expect(upsertAnnotation).not.toHaveBeenCalled();
  });

  it("still refuses an unauthenticated caller", async () => {
    sessionUserId.current = null;

    const res = await post(VALID);

    expect(res.status).toBe(401);
  });
});
