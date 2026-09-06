import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const CREATOR = "user-creator";
const VIEWER = "user-viewer";
const THIRD = "user-third";

const sessionUserId = { current: VIEWER };

vi.mock("@/lib/auth", () => ({
  auth: async () => ({ user: { id: sessionUserId.current } }),
}));

const findUniqueGroup = vi.fn();
const findManyVisibility = vi.fn();
const findManyAxis = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    group: { findUnique: (args: unknown) => findUniqueGroup(args) },
    axisVisibility: { findMany: (args: unknown) => findManyVisibility(args) },
    axis: { findMany: (args: unknown) => findManyAxis(args) },
  },
}));

const { GET } = await import("@/app/api/groups/[groupId]/compare/route");

function member(userId: string, score: number) {
  return {
    userId,
    user: {
      name: `Name of ${userId}`,
      profiles: [
        {
          axisScores: [
            { axisId: 1, finalScore: score, axis: { name: "Economic model" } },
          ],
        },
      ],
    },
  };
}

/** Members in join order: the creator joined first, as they always do. */
function joinOrderedMembers() {
  return [member(CREATOR, 0.5), member(VIEWER, -0.25), member(THIRD, 0.1)];
}

function serveGroup(overrides: { showNames?: boolean; members?: unknown[] } = {}) {
  findUniqueGroup.mockResolvedValue({
    id: "group-1",
    name: "Book club",
    inviteCode: "ABC123",
    showNames: overrides.showNames ?? false,
    creatorId: CREATOR,
    members: overrides.members ?? joinOrderedMembers(),
  });
}

async function compare() {
  const res = await GET({} as NextRequest, {
    params: Promise.resolve({ groupId: "group-1" }),
  });
  return res.json();
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionUserId.current = VIEWER;
  findManyVisibility.mockResolvedValue([]);
  findManyAxis.mockResolvedValue([
    {
      id: 1,
      name: "Economic model",
      poleALabel: "Market",
      poleBLabel: "State",
      domain: "economic",
      order: 1,
    },
  ]);
  serveGroup();
});

describe("GET /api/groups/[groupId]/compare privacy", () => {
  it("never exposes raw user ids", async () => {
    const body = await compare();
    const payload = JSON.stringify(body);

    for (const userId of [CREATOR, VIEWER, THIRD]) {
      expect(payload).not.toContain(userId);
    }
  });

  it("does not name the creator", async () => {
    const body = await compare();

    expect(body.group.creatorId).toBeUndefined();
    expect(body.group.isCreator).toBe(false);
  });

  it("tells the creator that they own the group", async () => {
    sessionUserId.current = CREATOR;

    const body = await compare();

    expect(body.group.isCreator).toBe(true);
  });

  it("gives each member an opaque handle the requester can key rows by", async () => {
    const body = await compare();
    const handles = body.members.map((m: { id: string }) => m.id);

    expect(handles).toHaveLength(3);
    expect(new Set(handles).size).toBe(3);
    expect(handles.every((h: string) => typeof h === "string" && h.length > 0)).toBe(true);
  });

  it("marks exactly the requesting member as themselves", async () => {
    const body = await compare();
    const mine = body.members.filter((m: { isSelf: boolean }) => m.isSelf);

    expect(mine).toHaveLength(1);
    expect(mine[0].scores[0].score).toBe(-0.25);
  });

  it("orders members independently of the order they joined", async () => {
    const inJoinOrder = await compare();

    const reversed = joinOrderedMembers().reverse();
    serveGroup({ members: reversed });
    const inReverseOrder = await compare();

    expect(inReverseOrder.members).toEqual(inJoinOrder.members);
  });

  it("still reveals names in a named group", async () => {
    serveGroup({ showNames: true });

    const body = await compare();

    expect(body.members.map((m: { name: string }) => m.name).sort()).toEqual([
      `Name of ${CREATOR}`,
      `Name of ${THIRD}`,
      `Name of ${VIEWER}`,
    ]);
  });
});
