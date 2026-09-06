import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { readJsonBody } from "@/lib/api-errors";
import { joinGroupSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = joinGroupSchema.safeParse(body.data);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const group = await db.group.findUnique({
    where: { inviteCode: parsed.data.inviteCode },
  });

  if (!group) {
    return NextResponse.json(
      { error: "Invalid invite code" },
      { status: 404 }
    );
  }

  const existing = await db.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: group.id, userId: session.user.id },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Already a member" }, { status: 409 });
  }

  await db.groupMember.create({
    data: { groupId: group.id, userId: session.user.id },
  });

  return NextResponse.json(
    { groupId: group.id, name: group.name },
    { status: 201 }
  );
}
