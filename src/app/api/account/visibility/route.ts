import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  topicId: z.string(),
  hidden: z.boolean(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { topicId, hidden } = parsed.data;

  if (hidden) {
    await db.topicVisibility.upsert({
      where: {
        userId_topicId: { userId: session.user.id, topicId },
      },
      update: { hidden: true },
      create: { userId: session.user.id, topicId, hidden: true },
    });
  } else {
    await db.topicVisibility.deleteMany({
      where: { userId: session.user.id, topicId },
    });
  }

  return NextResponse.json({ success: true });
}
