import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { readJsonBody } from "@/lib/api-errors";
import { annotationSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = annotationSchema.safeParse(body.data);

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

  // One note per user per axis score is a schema constraint, so the upsert is
  // the invariant — concurrent POSTs collapse onto the same row instead of
  // leaving a duplicate the axis page would keep rendering. The prior read is
  // only there to distinguish "created" from "updated" in the status.
  const where = { axisScoreId_userId: { axisScoreId, userId: session.user.id } };
  const existing = await db.annotation.findUnique({ where, select: { id: true } });

  const annotation = await db.annotation.upsert({
    where,
    update: { text },
    create: { axisScoreId, userId: session.user.id, text },
  });

  return NextResponse.json(annotation, { status: existing ? 200 : 201 });
}
