import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateInsights } from "@/lib/insights";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params;

  const profile = await db.userProfile.findUnique({
    where: { id: profileId },
    include: {
      topicScores: {
        include: {
          topic: true,
          annotations: true,
        },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const topics = profile.topicScores.map((ts) => ({
    id: ts.topic.id,
    name: ts.topic.name,
    spectrumLabelLeft: ts.topic.spectrumLabelLeft,
    spectrumLabelRight: ts.topic.spectrumLabelRight,
    spectrumLabelCenter: ts.topic.spectrumLabelCenter,
  }));

  const scores = profile.topicScores.map((ts) => ({
    topicId: ts.topicId,
    score: ts.score,
    answeredCount: ts.answeredCount,
    insufficientData: ts.insufficientData,
  }));

  const insights = generateInsights(scores, topics);

  return NextResponse.json({
    profileId: profile.id,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    scores: profile.topicScores.map((ts) => ({
      topicId: ts.topicId,
      topicName: ts.topic.name,
      topicIcon: ts.topic.icon,
      spectrumLabelLeft: ts.topic.spectrumLabelLeft,
      spectrumLabelRight: ts.topic.spectrumLabelRight,
      spectrumLabelCenter: ts.topic.spectrumLabelCenter,
      score: ts.score,
      answeredCount: ts.answeredCount,
      insufficientData: ts.insufficientData,
      annotations: ts.annotations,
    })),
    insights,
  });
}
