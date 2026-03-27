import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createGroupSchema } from "@/lib/validation";
import crypto from "crypto";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part1 = Array.from({ length: 4 }, () =>
    chars[crypto.randomInt(chars.length)]
  ).join("");
  const part2 = Array.from({ length: 4 }, () =>
    chars[crypto.randomInt(chars.length)]
  ).join("");
  return `${part1}-${part2}`;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createGroupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const group = await db.group.create({
    data: {
      name: parsed.data.name,
      inviteCode: generateInviteCode(),
      creatorId: session.user.id,
      members: {
        create: { userId: session.user.id },
      },
    },
  });

  return NextResponse.json(
    { id: group.id, inviteCode: group.inviteCode },
    { status: 201 }
  );
}
