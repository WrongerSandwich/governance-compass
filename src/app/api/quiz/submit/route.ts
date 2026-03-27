import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quizSubmitSchema } from "@/lib/validation";
import { calculateAllScores } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = quizSubmitSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { answers, anonymousToken } = parsed.data;

  // Verify all questionIds exist
  const questionIds = answers.map((a) => a.questionId);
  const questions = await db.question.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, topicId: true, polarity: true },
  });

  if (questions.length !== questionIds.length) {
    return NextResponse.json(
      { error: "One or more question IDs are invalid" },
      { status: 400 }
    );
  }

  // Create profile and answers in a transaction
  const profile = await db.$transaction(async (tx) => {
    const newProfile = await tx.userProfile.create({
      data: {
        anonymousToken: anonymousToken || crypto.randomUUID(),
      },
    });

    await tx.answer.createMany({
      data: answers.map((a) => ({
        profileId: newProfile.id,
        questionId: a.questionId,
        value: a.value,
        skipped: a.skipped,
      })),
    });

    // Calculate and store topic scores
    const topicIds = [...new Set(questions.map((q) => q.topicId))];
    const scores = calculateAllScores(
      answers,
      questions.map((q) => ({
        id: q.id,
        topicId: q.topicId,
        polarity: q.polarity,
      })),
      topicIds
    );

    await tx.topicScore.createMany({
      data: scores.map((s) => ({
        profileId: newProfile.id,
        topicId: s.topicId,
        score: s.score,
        answeredCount: s.answeredCount,
        insufficientData: s.insufficientData,
      })),
    });

    return newProfile;
  });

  return NextResponse.json(
    { profileId: profile.id, anonymousToken: profile.anonymousToken },
    { status: 201 }
  );
}
