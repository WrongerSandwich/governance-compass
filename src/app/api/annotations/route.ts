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

  const { axisScoreId, text } = parsed.data;

  // Verify the axis score exists and belongs to the user's profile
  const axisScore = await db.axisScore.findUnique({
    where: { id: axisScoreId },
    include: { profile: true },
  });

  if (!axisScore) {
    return NextResponse.json(
      { error: "Axis score not found" },
      { status: 404 }
    );
  }

  if (axisScore.profile.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Upsert annotation (one per user per axis score)
  const existing = await db.annotation.findFirst({
    where: { axisScoreId, userId: session.user.id },
  });

  const annotation = existing
    ? await db.annotation.update({
        where: { id: existing.id },
        data: { text },
      })
    : await db.annotation.create({
        data: { axisScoreId, userId: session.user.id, text },
      });

  return NextResponse.json(annotation, { status: existing ? 200 : 201 });
}
