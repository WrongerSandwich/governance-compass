"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { decodeResponses } from "@/lib/response-codec";
import { computeFullResults } from "@/lib/scoring";
import { compareProfiles } from "@/lib/comparison";
import { axes } from "@/data/axes";
import { ComparisonRadar } from "@/components/comparison/ComparisonRadar";
import { ComparisonScoreBar } from "@/components/comparison/ComparisonScoreBar";
import { AlignmentScore } from "@/components/comparison/AlignmentScore";
import { FadeInSection } from "@/components/FadeInSection";

function CompareResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const encodedA = searchParams.get("a");
  const encodedB = searchParams.get("b");

  const data = useMemo(() => {
    if (!encodedA || !encodedB) return null;

    try {
      const responsesA = decodeResponses(encodedA);
      const responsesB = decodeResponses(encodedB);
      const resultsA = computeFullResults(responsesA);
      const resultsB = computeFullResults(responsesB);

      const scoresA = resultsA.axisScores.map((s) => ({
        axisId: s.axisId,
        finalScore: s.finalScore,
      }));
      const scoresB = resultsB.axisScores.map((s) => ({
        axisId: s.axisId,
        finalScore: s.finalScore,
      }));

      const comparison = compareProfiles(scoresA, scoresB);

      const axisScoresA = resultsA.axisScores.map((s) => {
        const axis = axes.find((a) => a.id === s.axisId)!;
        return { axisId: s.axisId, name: axis.name, finalScore: s.finalScore };
      });
      const axisScoresB = resultsB.axisScores.map((s) => {
        const axis = axes.find((a) => a.id === s.axisId)!;
        return { axisId: s.axisId, name: axis.name, finalScore: s.finalScore };
      });

      // Build axis map for rendering
      const axisMap = new Map(
        axes.map((a) => [a.id, a])
      );

      return { comparison, axisScoresA, axisScoresB, axisMap, encodedA, encodedB };
    } catch {
      return null;
    }
  }, [encodedA, encodedB]);

  if (!encodedA || !encodedB) {
    router.replace("/");
    return null;
  }

  if (!data) {
    return (
      <main className="min-h-screen px-4 py-24 text-center">
        <p className="text-text-tertiary text-sm">Invalid comparison data.</p>
      </main>
    );
  }

  const { comparison, axisScoresA, axisScoresB, axisMap } = data;

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <FadeInSection>
          <div className="mb-6">
            <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium mb-1">
              Comparison
            </p>
            <h1 className="text-[28px] font-serif font-medium text-text-primary leading-tight">
              How your views compare
            </h1>
          </div>
        </FadeInSection>

        <FadeInSection delay={100}>
          <div className="bg-surface-2 rounded-[12px] p-6 mb-8">
            <AlignmentScore score={comparison.alignmentScore} />
            <ComparisonRadar
              axisScoresA={axisScoresA}
              axisScoresB={axisScoresB}
              labelA="You"
              labelB="Them"
            />
          </div>
        </FadeInSection>

        <FadeInSection delay={200}>
          <div className="bg-surface-1 rounded-[12px] border border-border-secondary p-6 mb-8">
            <h2 className="text-[11px] uppercase tracking-[0.08em] text-text-secondary font-medium border-b border-border-secondary pb-1.5 mb-4">
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
                    axisName={axis.name}
                    scoreA={d.scoreA}
                    scoreB={d.scoreB}
                    poleALabel={axis.poleALabel}
                    poleBLabel={axis.poleBLabel}
                    delta={d.delta}
                    labelA="You"
                    labelB="Them"
                  />
                );
              })}
          </div>
        </FadeInSection>

        {comparison.closestAxes.length > 0 && (
          <FadeInSection>
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
          </FadeInSection>
        )}
      </div>
    </main>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<main className="min-h-screen px-4 py-24 text-center"><p className="text-text-tertiary text-sm">Loading comparison...</p></main>}>
      <CompareResults />
    </Suspense>
  );
}
