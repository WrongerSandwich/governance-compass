"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { decodeResponses } from "@/lib/response-codec";
import { computeFullResults } from "@/lib/scoring";
import { axes } from "@/data/axes";
import { archetypes } from "@/data/archetypes";
import { ResultsView } from "@/components/results/ResultsView";

function EncodedResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const encoded = searchParams.get("r");

  // Redirect to /quiz if no ?r= param
  useEffect(() => {
    if (!encoded) {
      router.replace("/quiz");
    }
  }, [encoded, router]);

  // Store encoded string in localStorage for the nav Results link
  useEffect(() => {
    if (encoded) {
      localStorage.setItem("lastResults", encoded);
    }
  }, [encoded]);

  // Decode and score — memoized so it only recomputes when the param changes
  const result = useMemo(() => {
    if (!encoded) return null;
    try {
      const responses = decodeResponses(encoded);
      const quizResults = computeFullResults(responses);
      return { quizResults, error: null };
    } catch (e) {
      return {
        quizResults: null,
        error: e instanceof Error ? e.message : "Failed to decode results",
      };
    }
  }, [encoded]);

  // No param — will redirect, render nothing while that happens
  if (!encoded) return null;

  // Decoding or scoring failed
  if (result?.error) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <h1 className="font-serif text-2xl text-text-primary mb-4">
          Unable to load results
        </h1>
        <p className="text-sm text-text-secondary mb-8">{result.error}</p>
        <a
          href="/quiz"
          className="text-sm text-accent hover:underline"
        >
          Start a new assessment
        </a>
      </div>
    );
  }

  const { quizResults } = result!;
  if (!quizResults) return null;

  // Look up archetype details
  const primaryArchetype = archetypes.find(
    (a) => a.id === quizResults.archetype.primaryId
  );
  const secondaryArchetype = archetypes.find(
    (a) => a.id === quizResults.archetype.secondaryId
  );

  // Join axis scores with static axis data
  const axisData = quizResults.axisScores.map((score) => {
    const axis = axes.find((a) => a.id === score.axisId);
    return {
      axisId: score.axisId,
      name: axis?.name ?? `Axis ${score.axisId}`,
      poleALabel: axis?.poleALabel ?? "Pole A",
      poleBLabel: axis?.poleBLabel ?? "Pole B",
      domain: axis?.domain ?? "Unknown",
      finalScore: score.finalScore,
      confidence: score.confidence,
      tension: {
        detected: score.tension.detected,
        level: score.tension.level,
        direction: score.tension.direction,
        narrative: null, // Only DB profiles have narratives
      },
      components: {
        fc: score.fcScore,
        sc: score.scScore,
        bg: score.bgScore,
      },
    };
  });

  return (
    <ResultsView
      axisData={axisData}
      compass={{
        economic: quizResults.compass.economic,
        cultural: quizResults.compass.cultural,
      }}
      archetype={{
        primary: {
          name: primaryArchetype?.name ?? "Unknown",
          matchPercentage: quizResults.archetype.primaryMatchPct,
          summary: primaryArchetype?.summary ?? "",
          description: primaryArchetype?.description ?? "",
          tension: primaryArchetype?.characteristicTension ?? "",
          prototype: primaryArchetype?.prototype ?? [],
        },
        secondary: {
          name: secondaryArchetype?.name ?? "Unknown",
          matchPercentage: quizResults.archetype.secondaryMatchPct,
          summary: secondaryArchetype?.summary ?? "",
        },
        isBlended: quizResults.archetype.isBlended,
      }}
      encoded={encoded}
    />
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <p className="text-sm text-text-secondary">Loading results...</p>
        </div>
      }
    >
      <EncodedResults />
    </Suspense>
  );
}
