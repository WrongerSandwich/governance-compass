import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const GROUP_ID = "22222222-2222-4222-8222-222222222222";
const CREATOR = "33333333-3333-4333-8333-333333333333";
const MEMBER = "44444444-4444-4444-8444-444444444444";
const STRANGER = "55555555-5555-4555-8555-555555555555";

const sessionUserId = { current: MEMBER as string | null };

vi.mock("@/lib/auth", () => ({
  auth: async () =>
    sessionUserId.current ? { user: { id: sessionUserId.current } } : null,
}));

const findUniqueGroup = vi.fn();
const updateGroup = vi.fn();
const deleteGroup = vi.fn();
const deleteMember = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    group: {
      findUnique: (args: unknown) => findUniqueGroup(args),
      update: (args: unknown) => updateGroup(args),
      delete: (args: unknown) => deleteGroup(args),
    },
    groupMember: { delete: (args: unknown) => deleteMember(args) },
  },
}));

const { PATCH, DELETE } = await import("@/app/api/groups/[groupId]/route");

const params = Promise.resolve({ groupId: GROUP_ID });

function patch(body: unknown) {
  return PATCH({ json: async () => body } as unknown as NextRequest, { params });
}

const recordNotFound = () =>
  Object.assign(new Error("Record to delete does not exist."), { code: "P2025" });

beforeEach(() => {
  sessionUserId.current = MEMBER;
  findUniqueGroup.mockReset().mockResolvedValue({ id: GROUP_ID, creatorId: CREATOR });
  updateGroup.mockReset().mockResolvedValue({});
  deleteGroup.mockReset().mockResolvedValue({});
  deleteMember.mockReset().mockResolvedValue({});
});

describe("PATCH /api/groups/[groupId]", () => {
  it("reports 404 when removing someone who is not in the group", async () => {
    sessionUserId.current = CREATOR;
    deleteMember.mockRejectedValue(recordNotFound());

    const res = await patch({ removeMemberId: STRANGER });

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Member not found in this group" });
  });

  it("answers a malformed body with 400", async () => {
    const res = await PATCH(
      {
        json: async () => {
          throw new SyntaxError("Unexpected end of JSON input");
        },
      } as unknown as NextRequest,
      { params }
    );

    expect(res.status).toBe(400);
    expect(findUniqueGroup).not.toHaveBeenCalled();
  });

  it("still removes a real member", async () => {
    sessionUserId.current = CREATOR;

    const res = await patch({ removeMemberId: MEMBER });

    expect(res.status).toBe(200);
    expect(deleteMember).toHaveBeenCalledWith({
      where: { groupId_userId: { groupId: GROUP_ID, userId: MEMBER } },
    });
  });
});

describe("DELETE /api/groups/[groupId]", () => {
  function del() {
    return DELETE({} as unknown as NextRequest, { params });
  }

  it("dissolves the group when the creator calls it", async () => {
    sessionUserId.current = CREATOR;

    const res = await del();

    expect(res.status).toBe(200);
    expect(deleteGroup).toHaveBeenCalledWith({ where: { id: GROUP_ID } });
    expect(deleteMember).not.toHaveBeenCalled();
  });

  it("removes only the caller's membership when a member leaves", async () => {
    const res = await del();

    expect(res.status).toBe(200);
    expect(deleteMember).toHaveBeenCalledWith({
      where: { groupId_userId: { groupId: GROUP_ID, userId: MEMBER } },
    });
    expect(deleteGroup).not.toHaveBeenCalled();
  });

  it("reports 404 when a non-member tries to leave", async () => {
    sessionUserId.current = STRANGER;
    deleteMember.mockRejectedValue(recordNotFound());

    const res = await del();

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "You are not a member of this group" });
  });

  it("still reports 404 for a group that does not exist", async () => {
    findUniqueGroup.mockResolvedValue(null);

    const res = await del();

    expect(res.status).toBe(404);
    expect(deleteGroup).not.toHaveBeenCalled();
    expect(deleteMember).not.toHaveBeenCalled();
  });

  it("still refuses an unauthenticated caller", async () => {
    sessionUserId.current = null;

    expect((await del()).status).toBe(401);
  });
});
