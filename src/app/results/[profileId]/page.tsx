import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { archetypes } from "@/data/archetypes";
import { DISTINCTIVE_MATCH_CEILING, DISTINCTIVE_STDDEV_FLOOR } from "@/lib/scoring-types";
import { ResultsView } from "@/components/results/ResultsView";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;

  const profile = await db.userProfile.findUnique({
    where: { id: profileId },
    include: {
      axisScores: {
        include: { axis: true },
        orderBy: { axis: { order: "asc" } },
      },
      compassScore: true,
      archetypeResult: true,
    },
  });

  if (!profile || !profile.compassScore || !profile.archetypeResult) {
    notFound();
  }

  // Look up archetype details
  const primaryArchetype = archetypes.find(
    (a) => a.id === profile.archetypeResult!.primaryArchetypeId
  );
  const secondaryArchetype = archetypes.find(
    (a) => a.id === profile.archetypeResult!.secondaryArchetypeId
  );

  // Prepare axis data
  const axisData = profile.axisScores.map((s) => ({
    axisId: s.axisId,
    name: s.axis.name,
    poleALabel: s.axis.poleALabel,
    poleBLabel: s.axis.poleBLabel,
    domain: s.axis.domain,
    finalScore: s.finalScore,
    confidence: s.confidence,
    tension: {
      detected: s.tensionLevel !== "none",
      level: s.tensionLevel,
      direction: s.tensionDirection,
      narrative: s.tensionNarrative,
    },
    components: {
      fc: s.fcScore,
      sc: s.scScore,
      bg: s.bgScore,
    },
  }));

  return (
    <ResultsView
      axisData={axisData}
      compass={{
        economic: profile.compassScore.economic,
        cultural: profile.compassScore.cultural,
      }}
      archetype={{
        primary: {
          name: primaryArchetype?.name ?? "Unknown",
          matchPercentage: profile.archetypeResult.primaryMatchPct,
          summary: primaryArchetype?.summary ?? "",
          description: primaryArchetype?.description ?? "",
          tension: primaryArchetype?.characteristicTension ?? "",
          prototype: primaryArchetype?.prototype ?? [],
        },
        secondary: {
          name: secondaryArchetype?.name ?? "Unknown",
          matchPercentage: profile.archetypeResult.secondaryMatchPct,
          summary: secondaryArchetype?.summary ?? "",
        },
        isBlended: profile.archetypeResult.isBlended,
        isDistinctive: (() => {
          const scores = axisData.map(a => a.finalScore);
          const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
          const stddev = Math.sqrt(scores.reduce((s, v) => s + (v - mean) ** 2, 0) / scores.length);
          return profile.archetypeResult.primaryMatchPct < DISTINCTIVE_MATCH_CEILING && stddev > DISTINCTIVE_STDDEV_FLOOR;
        })(),
      }}
      profileId={profileId}
    />
  );
}
