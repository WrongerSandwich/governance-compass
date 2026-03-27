import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { compareProfiles } from "@/lib/comparison";
import { ComparisonRadar } from "@/components/comparison/ComparisonRadar";
import { ComparisonSpectrum } from "@/components/comparison/ComparisonSpectrum";
import { AlignmentScore } from "@/components/comparison/AlignmentScore";

export default async function ComparePage({
  params,
}: {
  params: Promise<{ profileId1: string; profileId2: string }>;
}) {
  const { profileId1, profileId2 } = await params;

  const [profileA, profileB] = await Promise.all([
    db.userProfile.findUnique({
      where: { id: profileId1 },
      include: {
        topicScores: { include: { topic: true } },
        user: { select: { name: true } },
      },
    }),
    db.userProfile.findUnique({
      where: { id: profileId2 },
      include: {
        topicScores: { include: { topic: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  if (!profileA || !profileB) notFound();

  // Gather hidden topics for both users
  const hiddenTopicIds = new Set<string>();
  if (profileA.userId) {
    const visA = await db.topicVisibility.findMany({
      where: { userId: profileA.userId, hidden: true },
    });
    visA.forEach((v) => hiddenTopicIds.add(v.topicId));
  }
  if (profileB.userId) {
    const visB = await db.topicVisibility.findMany({
      where: { userId: profileB.userId, hidden: true },
    });
    visB.forEach((v) => hiddenTopicIds.add(v.topicId));
  }

  const scoresA = profileA.topicScores.map((ts) => ({
    topicId: ts.topicId,
    score: ts.score,
    answeredCount: ts.answeredCount,
    insufficientData: ts.insufficientData,
  }));

  const scoresB = profileB.topicScores.map((ts) => ({
    topicId: ts.topicId,
    score: ts.score,
    answeredCount: ts.answeredCount,
    insufficientData: ts.insufficientData,
  }));

  const comparison = compareProfiles(scoresA, scoresB, hiddenTopicIds);

  const topicMap = new Map(
    [...profileA.topicScores, ...profileB.topicScores].map((ts) => [
      ts.topicId,
      ts.topic,
    ])
  );

  const labelA = profileA.user?.name || "Profile A";
  const labelB = profileB.user?.name || "Profile B";

  const radarData = comparison.perTopicDeltas.map((d) => ({
    topic: topicMap.get(d.topicId)?.name || d.topicId,
    scoreA: d.scoreA,
    scoreB: d.scoreB,
  }));

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Comparison
        </h1>
        <p className="text-gray-500 mb-6">
          <span className="text-indigo-600 font-medium">{labelA}</span>
          {" vs "}
          <span className="text-rose-500 font-medium">{labelB}</span>
        </p>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <AlignmentScore score={comparison.alignmentScore} />
          <ComparisonRadar
            data={radarData}
            labelA={labelA}
            labelB={labelB}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            By Topic
          </h2>
          {comparison.perTopicDeltas
            .sort((a, b) => {
              const topicA = topicMap.get(a.topicId);
              const topicB = topicMap.get(b.topicId);
              return (topicA?.order || 0) - (topicB?.order || 0);
            })
            .map((d) => {
              const topic = topicMap.get(d.topicId)!;
              return (
                <ComparisonSpectrum
                  key={d.topicId}
                  topicName={topic.name}
                  scoreA={d.scoreA}
                  scoreB={d.scoreB}
                  labelLeft={topic.spectrumLabelLeft}
                  labelRight={topic.spectrumLabelRight}
                  delta={d.delta}
                />
              );
            })}
        </div>

        {comparison.closestTopics.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-green-700 mb-3">
                Most Aligned
              </h3>
              {comparison.closestTopics.map((d) => (
                <div key={d.topicId} className="text-sm text-gray-700 mb-1">
                  {topicMap.get(d.topicId)?.name} —{" "}
                  <span className="text-green-600">
                    {Math.round(d.delta)} pts apart
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-red-700 mb-3">
                Most Divergent
              </h3>
              {comparison.furthestTopics.map((d) => (
                <div key={d.topicId} className="text-sm text-gray-700 mb-1">
                  {topicMap.get(d.topicId)?.name} —{" "}
                  <span className="text-red-600">
                    {Math.round(d.delta)} pts apart
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
