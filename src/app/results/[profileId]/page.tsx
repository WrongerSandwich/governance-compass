import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { archetypes } from "@/data/archetypes";
import { CompassPlot } from "@/components/results/CompassPlot";
import { ArchetypeCard } from "@/components/results/ArchetypeCard";
import { RadarChart } from "@/components/results/RadarChart";
import { AxisBreakdownCard } from "@/components/results/AxisBreakdownCard";
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

  // Group axes by domain for breakdown section
  const domains = [
    {
      name: "Economic Organization",
      axes: axisData.filter((a) => a.domain === "Economic Organization"),
    },
    {
      name: "Power and Authority",
      axes: axisData.filter((a) => a.domain === "Power and Authority"),
    },
    {
      name: "Society and Identity",
      axes: axisData.filter((a) => a.domain === "Society and Identity"),
    },
    {
      name: "The State in the World",
      axes: axisData.filter((a) => a.domain === "The State in the World"),
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 text-center">
          Your Governance Compass
        </h1>

        {/* Layer 1: Compass Plot */}
        <section className="flex justify-center">
          <CompassPlot
            economic={profile.compassScore.economic}
            cultural={profile.compassScore.cultural}
          />
        </section>

        {/* Layer 2: Archetype Card */}
        <section>
          <ArchetypeCard
            primary={{
              name: primaryArchetype?.name ?? "Unknown",
              matchPercentage: profile.archetypeResult.primaryMatchPct,
              summary: primaryArchetype?.summary ?? "",
              description: primaryArchetype?.description ?? "",
              tension: primaryArchetype?.characteristicTension ?? "",
            }}
            secondary={{
              name: secondaryArchetype?.name ?? "Unknown",
              matchPercentage: profile.archetypeResult.secondaryMatchPct,
              summary: secondaryArchetype?.summary ?? "",
            }}
            isBlended={profile.archetypeResult.isBlended}
          />
        </section>

        {/* Layer 3: Radar Chart */}
        <section>
          <RadarChart
            axisScores={axisData}
            archetypePrototype={primaryArchetype?.prototype}
          />
        </section>

        {/* Layer 4: Axis Breakdown by Domain */}
        <section className="space-y-6">
          {domains.map((domain) => (
            <div key={domain.name}>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {domain.name}
              </h2>
              <div className="space-y-4">
                {domain.axes.map((axis) => (
                  <AxisBreakdownCard key={axis.axisId} {...axis} />
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Compare Button */}
        <CompareButton profileId={profileId} />
      </div>
    </main>
  );
}
