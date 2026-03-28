import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { compareProfiles } from "@/lib/comparison";
import { ComparisonRadar } from "@/components/comparison/ComparisonRadar";
import { ComparisonScoreBar } from "@/components/comparison/ComparisonScoreBar";
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
        axisScores: { include: { axis: true } },
        user: { select: { name: true } },
      },
    }),
    db.userProfile.findUnique({
      where: { id: profileId2 },
      include: {
        axisScores: { include: { axis: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  if (!profileA || !profileB) notFound();

  // Gather hidden axis IDs for both users
  const hiddenAxisIds = new Set<number>();
  if (profileA.userId) {
    const visA = await db.axisVisibility.findMany({
      where: { userId: profileA.userId, hidden: true },
    });
    visA.forEach((v) => hiddenAxisIds.add(v.axisId));
  }
  if (profileB.userId) {
    const visB = await db.axisVisibility.findMany({
      where: { userId: profileB.userId, hidden: true },
    });
    visB.forEach((v) => hiddenAxisIds.add(v.axisId));
  }

  const scoresA = profileA.axisScores.map((as) => ({
    axisId: as.axisId,
    finalScore: as.finalScore,
  }));

  const scoresB = profileB.axisScores.map((as) => ({
    axisId: as.axisId,
    finalScore: as.finalScore,
  }));

  const comparison = compareProfiles(scoresA, scoresB, hiddenAxisIds);

  // Build axis metadata map from both profiles
  const axisMap = new Map(
    [...profileA.axisScores, ...profileB.axisScores].map((as) => [
      as.axisId,
      as.axis,
    ])
  );

  const labelA = profileA.user?.name || "Profile A";
  const labelB = profileB.user?.name || "Profile B";

  // Build radar data: enrich with axis names
  const axisScoresA = profileA.axisScores.map((as) => ({
    axisId: as.axisId,
    name: as.axis.name,
    finalScore: as.finalScore,
  }));
  const axisScoresB = profileB.axisScores.map((as) => ({
    axisId: as.axisId,
    name: as.axis.name,
    finalScore: as.finalScore,
  }));

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Comparison</h1>
        <p className="text-gray-500 mb-6">
          <span className="text-indigo-600 font-medium">{labelA}</span>
          {" vs "}
          <span className="text-rose-500 font-medium">{labelB}</span>
        </p>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <AlignmentScore score={comparison.alignmentScore} />
          <ComparisonRadar
            axisScoresA={axisScoresA}
            axisScoresB={axisScoresB}
            labelA={labelA}
            labelB={labelB}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">By Axis</h2>
          {comparison.perAxisDeltas
            .sort((a, b) => {
              const axisA = axisMap.get(a.axisId);
              const axisB = axisMap.get(b.axisId);
              return (axisA?.order ?? 0) - (axisB?.order ?? 0);
            })
            .map((d) => {
              const axis = axisMap.get(d.axisId)!;
              return (
                <ComparisonScoreBar
                  key={d.axisId}
                  axisName={axis.name}
                  scoreA={d.scoreA}
                  scoreB={d.scoreB}
                  poleALabel={axis.poleALabel}
                  poleBLabel={axis.poleBLabel}
                  delta={d.delta}
                  labelA={labelA}
                  labelB={labelB}
                />
              );
            })}
        </div>

        {comparison.closestAxes.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-green-700 mb-3">
                Most Aligned
              </h3>
              {comparison.closestAxes.map((d) => (
                <div key={d.axisId} className="text-sm text-gray-700 mb-1">
                  {axisMap.get(d.axisId)?.name} —{" "}
                  <span className="text-green-600">
                    {d.delta.toFixed(2)} apart
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-red-700 mb-3">
                Most Divergent
              </h3>
              {comparison.furthestAxes.map((d) => (
                <div key={d.axisId} className="text-sm text-gray-700 mb-1">
                  {axisMap.get(d.axisId)?.name} —{" "}
                  <span className="text-red-600">{d.delta.toFixed(2)} apart</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
