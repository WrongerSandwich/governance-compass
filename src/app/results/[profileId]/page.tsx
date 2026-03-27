import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { generateInsights } from "@/lib/insights";
import { RadarChart } from "@/components/results/RadarChart";
import { SpectrumBar } from "@/components/results/SpectrumBar";
import { InsightCard } from "@/components/results/InsightCard";
import { CompareButton } from "@/components/results/CompareButton";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;

  const profile = await db.userProfile.findUnique({
    where: { id: profileId },
    include: {
      topicScores: {
        include: { topic: true },
        orderBy: { topic: { order: "asc" } },
      },
    },
  });

  if (!profile) notFound();

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

  const radarData = profile.topicScores
    .filter((ts) => !ts.insufficientData)
    .map((ts) => ({
      topicName: ts.topic.name,
      score: ts.score,
    }));

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Your Political Profile
            </h1>
            <p className="text-gray-500 mt-1">
              Based on your responses across {profile.topicScores.length} topics
            </p>
          </div>
          <CompareButton profileId={profileId} />
        </div>

        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Overview
          </h2>
          <RadarChart scores={radarData} />
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            By Topic
          </h2>
          {profile.topicScores.map((ts) => (
            <SpectrumBar
              key={ts.topicId}
              topicName={ts.topic.name}
              score={ts.score}
              labelLeft={ts.topic.spectrumLabelLeft}
              labelRight={ts.topic.spectrumLabelRight}
              insufficientData={ts.insufficientData}
            />
          ))}
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Insights
          </h2>
          <div className="grid gap-3">
            {insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
