import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { answerUpdateSchema } from "@/lib/validation";
import { calculateAllScores } from "@/lib/scoring";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params;
  const body = await request.json();
  const parsed = answerUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { answers, anonymousToken } = parsed.data;

  // Verify ownership
  const profile = await db.userProfile.findUnique({
    where: { id: profileId },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const session = await auth();
  const isOwner =
    (session?.user?.id && profile.userId === session.user.id) ||
    (anonymousToken && profile.anonymousToken === anonymousToken);

  if (!isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Update answers and recalculate scores
  await db.$transaction(async (tx) => {
    for (const answer of answers) {
      await tx.answer.upsert({
        where: {
          profileId_questionId: {
            profileId,
            questionId: answer.questionId,
          },
        },
        update: {
          value: answer.value,
          skipped: answer.skipped,
          answeredAt: new Date(),
        },
        create: {
          profileId,
          questionId: answer.questionId,
          value: answer.value,
          skipped: answer.skipped,
        },
      });
    }

    // Recalculate all topic scores
    const allAnswers = await tx.answer.findMany({
      where: { profileId },
    });
    const allQuestions = await tx.question.findMany({
      select: { id: true, topicId: true, polarity: true },
    });
    const topicIds = [...new Set(allQuestions.map((q) => q.topicId))];

    const scores = calculateAllScores(
      allAnswers.map((a) => ({
        questionId: a.questionId,
        value: a.value,
        skipped: a.skipped,
      })),
      allQuestions.map((q) => ({
        id: q.id,
        topicId: q.topicId,
        polarity: q.polarity,
      })),
      topicIds
    );

    for (const score of scores) {
      await tx.topicScore.upsert({
        where: {
          profileId_topicId: { profileId, topicId: score.topicId },
        },
        update: {
          score: score.score,
          answeredCount: score.answeredCount,
          insufficientData: score.insufficientData,
        },
        create: {
          profileId,
          topicId: score.topicId,
          score: score.score,
          answeredCount: score.answeredCount,
          insufficientData: score.insufficientData,
        },
      });
    }
  });

  return NextResponse.json({ success: true });
}
