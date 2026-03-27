import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { annotationSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = annotationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { topicScoreId, text } = parsed.data;

  // Verify the topic score exists and belongs to the user's profile
  const topicScore = await db.topicScore.findUnique({
    where: { id: topicScoreId },
    include: { profile: true },
  });

  if (!topicScore) {
    return NextResponse.json(
      { error: "Topic score not found" },
      { status: 404 }
    );
  }

  if (topicScore.profile.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Upsert annotation (one per user per topic score)
  const existing = await db.annotation.findFirst({
    where: { topicScoreId, userId: session.user.id },
  });

  const annotation = existing
    ? await db.annotation.update({
        where: { id: existing.id },
        data: { text },
      })
    : await db.annotation.create({
        data: { topicScoreId, userId: session.user.id, text },
      });

  return NextResponse.json(annotation, { status: existing ? 200 : 201 });
}
