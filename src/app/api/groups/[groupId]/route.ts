import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { RECORD_NOT_FOUND, prismaErrorCode, readJsonBody } from "@/lib/api-errors";
import { z } from "zod";

const updateGroupSchema = z.object({
  showNames: z.boolean().optional(),
  removeMemberId: z.string().uuid().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const { groupId } = await params;
  const parsed = updateGroupSchema.safeParse(body.data);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const group = await db.group.findUnique({ where: { id: groupId } });
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Only creator can update settings or remove members
  if (group.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Only the group creator can manage settings" }, { status: 403 });
  }

  if (parsed.data.showNames !== undefined) {
    await db.group.update({
      where: { id: groupId },
      data: { showNames: parsed.data.showNames },
    });
  }

  if (parsed.data.removeMemberId) {
    if (parsed.data.removeMemberId === group.creatorId) {
      return NextResponse.json({ error: "Cannot remove the creator" }, { status: 400 });
    }
    try {
      await db.groupMember.delete({
        where: {
          groupId_userId: { groupId, userId: parsed.data.removeMemberId },
        },
      });
    } catch (err) {
      // Already gone — a stale member list, or two removals of the same person.
      if (prismaErrorCode(err) === RECORD_NOT_FOUND) {
        return NextResponse.json(
          { error: "Member not found in this group" },
          { status: 404 }
        );
      }
      throw err;
    }
  }

  return NextResponse.json({ success: true });
}

/**
 * Leave the group — or, with `?dissolve=true`, delete it outright.
 *
 * The creator cannot leave, and without a dissolve path the group, its invite
 * code, and every member's scores would outlive any interest in them. But
 * dissolving is not what a "Leave" button means, so it takes an explicit flag:
 * a client that only ever sends a plain DELETE cannot destroy a group by
 * accident just because the caller happens to be its creator.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dissolve = new URL(request.url).searchParams.get("dissolve") === "true";

  const { groupId } = await params;

  const group = await db.group.findUnique({ where: { id: groupId } });
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const isCreator = group.creatorId === session.user.id;

  if (dissolve) {
    if (!isCreator) {
      return NextResponse.json(
        { error: "Only the group creator can dissolve the group" },
        { status: 403 }
      );
    }
    // Memberships cascade with the group; nothing else references it.
    await db.group.delete({ where: { id: groupId } });
    return NextResponse.json({ success: true, deleted: true });
  }

  if (isCreator) {
    return NextResponse.json(
      { error: "Creator cannot leave. Dissolve the group with ?dissolve=true." },
      { status: 400 }
    );
  }

  try {
    await db.groupMember.delete({
      where: {
        groupId_userId: { groupId, userId: session.user.id },
      },
    });
  } catch (err) {
    // Leaving a group you were never in is a caller mistake, not a server fault.
    if (prismaErrorCode(err) === RECORD_NOT_FOUND) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 404 }
      );
    }
    throw err;
  }

  return NextResponse.json({ success: true });
}
