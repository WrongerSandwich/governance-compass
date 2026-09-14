"use client";

import React, { Suspense, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { decodeResponses } from "@/lib/response-codec";
import { computeFullResults } from "@/lib/scoring";
import { compareProfiles } from "@/lib/comparison";
import { axes } from "@/data/axes";
import { describeGap } from "@/components/PairedAxisScale";
import { ComparisonRadar } from "@/components/comparison/ComparisonRadar";
import { ComparisonScoreBar } from "@/components/comparison/ComparisonScoreBar";
import { AlignmentScore } from "@/components/comparison/AlignmentScore";
import { BudgetComparison } from "@/components/comparison/BudgetComparison";
import { FadeInSection } from "@/components/FadeInSection";
import { DOMAIN_COLORS, DOMAIN_MARK_VARS, type DomainKey } from "@/lib/design-tokens";
import { Button } from "@/components/Button";
import Link from "next/link";

function CopyLinkButton() {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <Button variant="secondary" onClick={handleCopy}>
      {copied ? "Copied!" : "Copy comparison link"}
    </Button>
  );
}

const DOMAIN_KEYS: DomainKey[] = ["economic", "power", "society", "world"];

function CompareResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const encodedA = searchParams.get("a");
  const encodedB = searchParams.get("b");

  useEffect(() => {
    if (!encodedA || !encodedB) router.replace("/");
  }, [encodedA, encodedB, router]);

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

      return { comparison, axisScoresA, axisScoresB, axisMap, encodedA, encodedB, budgetA: responsesA.budget, budgetB: responsesB.budget };
    } catch {
      return null;
    }
  }, [encodedA, encodedB]);

  if (!encodedA || !encodedB) {
    return null;
  }

  if (!data) {
    return (
      <main className="min-h-screen px-4 py-24 text-center">
        <p className="text-text-secondary text-sm">Invalid comparison data.</p>
      </main>
    );
  }

  const { comparison, axisScoresA, axisScoresB, axisMap, budgetA, budgetB } = data;

  return (
    <main className="min-h-screen px-4 py-8 overflow-x-hidden">
      <div className="max-w-results mx-auto">
        <FadeInSection>
          <div className="mb-6">
            <Link
              href={`/results?r=${encodedA}`}
              className="label-nav text-text-label no-underline hover:text-text-secondary transition-colors duration-150 mb-3 inline-block focus-ring"
            >
              &larr; Back to your results
            </Link>
            <p className="label-eyebrow text-text-label mb-1.5">
              Comparison
            </p>
            <h1 className="display-page text-text-primary">
              How your views compare
            </h1>
          </div>
        </FadeInSection>

        <FadeInSection delay={100}>
          <div className="bg-surface-2 rounded-sharp p-6 mb-8">
            <AlignmentScore score={comparison.alignmentScore} />
            <ComparisonRadar
              axisScoresA={axisScoresA}
              axisScoresB={axisScoresB}
              labelA="You"
              labelB="Them"
            />
            <div className="flex justify-center mt-4">
              <CopyLinkButton />
            </div>
          </div>
        </FadeInSection>

        {/* Aligned / Divergent summary — inline, not cards */}
        {comparison.closestAxes.length > 0 && (
          <FadeInSection delay={150}>
            <div className="grid min-[560px]:grid-cols-2 gap-6 mb-8">
              <div>
                <p className="label-eyebrow text-text-label mb-2">Most aligned</p>
                {comparison.closestAxes.map((d) => (
                  <div key={d.axisId} className="body-s text-text-secondary mb-1">
                    {axisMap.get(d.axisId)?.name} —{" "}
                    <span className="mono-meta text-text-label">{describeGap(d.delta)}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="label-eyebrow text-text-label mb-2">Most divergent</p>
                {comparison.furthestAxes.map((d) => (
                  <div key={d.axisId} className="body-s text-text-secondary mb-1">
                    {axisMap.get(d.axisId)?.name} —{" "}
                    <span className="mono-meta text-text-label">{describeGap(d.delta)}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeInSection>
        )}

        {/* Axis breakdown by domain — flat, matching results page pattern */}
        <FadeInSection delay={200}>
          <section>
            <h2 className="display-m text-text-primary mb-1.5">
              Axis breakdown
            </h2>
            <p className="caption-italic max-w-[60ch] mb-6">
              Each bar shows both profiles.
            </p>

            <div className="space-y-5">
              {DOMAIN_KEYS.map((domainKey) => {
                const domain = DOMAIN_COLORS[domainKey];
                const domainDeltas = comparison.perAxisDeltas
                  .filter((d) => domain.axes.includes(d.axisId))
                  .sort((a, b) => (axisMap.get(a.axisId)?.order ?? 0) - (axisMap.get(b.axisId)?.order ?? 0));
                if (domainDeltas.length === 0) return null;
                return (
                  <div key={domainKey}>
                    <div
                      className="label font-medium border-b border-border-secondary pb-2 mb-2 mt-5 first:mt-0"
                      style={{ color: DOMAIN_MARK_VARS[domainKey] }}
                    >
                      {domain.name}
                    </div>
                    <div className="space-y-0">
                      {domainDeltas.map((d, i) => {
                        const axis = axisMap.get(d.axisId)!;
                        return (
                          <ComparisonScoreBar
                            key={d.axisId}
                            axisId={d.axisId}
                            axisName={axis.name}
                            tagline={axis.tagline}
                            scoreA={d.scoreA}
                            scoreB={d.scoreB}
                            poleALabel={axis.poleALabel}
                            poleBLabel={axis.poleBLabel}
                            labelA="You"
                            labelB="Them"
                            alternateRow={i % 2 === 1}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </FadeInSection>

        {/* Budget comparison */}
        <FadeInSection delay={250}>
          <section className="mt-10">
            <h2 className="display-m text-text-primary mb-1.5">
              Budget allocation
            </h2>
            <p className="caption-italic max-w-[60ch] mb-6">
              How each of you funded the seven ministries out of 50 points.
            </p>
            <BudgetComparison
              budgetA={budgetA}
              budgetB={budgetB}
              labelA="You"
              labelB="Them"
            />
          </section>
        </FadeInSection>
      </div>
    </main>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<main className="min-h-screen px-4 py-24 text-center"><p className="text-text-secondary text-sm">Loading comparison...</p></main>}>
      <CompareResults />
    </Suspense>
  );
}
