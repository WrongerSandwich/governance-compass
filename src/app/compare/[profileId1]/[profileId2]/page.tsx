import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { axes as axesDef } from "@/data/axes";
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
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-[22px] font-serif font-medium text-text-primary mb-1">Comparison</h1>
        <p className="text-text-secondary text-sm mb-6">
          <span className="font-medium text-text-primary">{labelA}</span>
          {" vs "}
          <span className="font-medium text-text-primary">{labelB}</span>
        </p>

        <div className="bg-surface-1 rounded-[12px] border border-border-secondary p-6 mb-8">
          <AlignmentScore score={comparison.alignmentScore} />
          <ComparisonRadar
            axisScoresA={axisScoresA}
            axisScoresB={axisScoresB}
            labelA={labelA}
            labelB={labelB}
          />
        </div>

        <div className="bg-surface-1 rounded-[12px] border border-border-secondary p-6 mb-8">
          <h2 className="text-[11px] uppercase tracking-[0.08em] text-stone-800 font-medium border-b border-border-secondary pb-1.5 mb-4">
            By axis
          </h2>
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
                  axisId={d.axisId}
                  axisName={axis.name}
                  tagline={axesDef.find((a) => a.id === d.axisId)?.tagline ?? ""}
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
          <div className="grid min-[560px]:grid-cols-2 gap-4 mb-8">
            <div className="bg-surface-1 rounded-[12px] border border-border-secondary p-6">
              <h3 className="font-medium text-text-primary mb-3 text-sm">
                Most aligned
              </h3>
              {comparison.closestAxes.map((d) => (
                <div key={d.axisId} className="text-sm text-text-secondary mb-1">
                  {axisMap.get(d.axisId)?.name} —{" "}
                  <span className="font-mono text-xs text-text-tertiary">
                    {d.delta.toFixed(2)} apart
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-surface-1 rounded-[12px] border border-border-secondary p-6">
              <h3 className="font-medium text-text-primary mb-3 text-sm">
                Most divergent
              </h3>
              {comparison.furthestAxes.map((d) => (
                <div key={d.axisId} className="text-sm text-text-secondary mb-1">
                  {axisMap.get(d.axisId)?.name} —{" "}
                  <span className="font-mono text-xs text-text-tertiary">
                    {d.delta.toFixed(2)} apart
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
