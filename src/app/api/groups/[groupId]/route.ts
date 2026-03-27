import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
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

  const { groupId } = await params;
  const body = await request.json();
  const parsed = updateGroupSchema.safeParse(body);

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
    await db.groupMember.delete({
      where: {
        groupId_userId: { groupId, userId: parsed.data.removeMemberId },
      },
    });
  }

  return NextResponse.json({ success: true });
}

// Leave group
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;

  const group = await db.group.findUnique({ where: { id: groupId } });
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (group.creatorId === session.user.id) {
    return NextResponse.json(
      { error: "Creator cannot leave. Delete the group instead." },
      { status: 400 }
    );
  }

  await db.groupMember.delete({
    where: {
      groupId_userId: { groupId, userId: session.user.id },
    },
  });

  return NextResponse.json({ success: true });
}
