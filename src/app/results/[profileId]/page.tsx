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

  // Collect axes with detected tensions for tension cards
  const tensionAxes = axisData.filter((a) => a.tension.detected);

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Section label + page title */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary mb-1">
            Assessment results
          </p>
          <h1 className="text-[22px] font-serif font-medium text-text-primary">
            Your governance compass
          </h1>
          <p className="text-xs font-serif italic text-text-tertiary mt-1">
            A simplified two-dimensional view. Scroll for your complete 12-axis profile.
          </p>
        </div>

        {/* Hero region: Compass + Archetype side by side */}
        <section className="bg-surface-2 rounded-[12px] p-6">
          <div className="grid grid-cols-1 min-[560px]:grid-cols-2 gap-5">
            <CompassPlot
              economic={profile.compassScore.economic}
              cultural={profile.compassScore.cultural}
            />
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
          </div>

          {/* Share + compare actions */}
          <div className="flex flex-wrap items-center gap-2 mt-5">
            <CompareButton profileId={profileId} />
            <button className="text-xs border border-border-secondary bg-surface-1 text-text-secondary rounded-[8px] px-3.5 py-1.5 hover:bg-surface-2 hover:text-text-primary transition-colors duration-150 focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2">
              Copy image
            </button>
            <button className="text-xs border border-border-secondary bg-surface-1 text-text-secondary rounded-[8px] px-3.5 py-1.5 hover:bg-surface-2 hover:text-text-primary transition-colors duration-150 focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2">
              Copy link
            </button>
            <button className="text-xs border border-border-secondary bg-surface-1 text-text-secondary rounded-[8px] px-3.5 py-1.5 hover:bg-surface-2 hover:text-text-primary transition-colors duration-150 focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2">
              Download raw data
            </button>
          </div>
        </section>

        {/* Tension cards (between hero and radar) */}
        {tensionAxes.length > 0 && (
          <section className="space-y-3">
            {tensionAxes.map((axis) => (
              <div
                key={axis.axisId}
                className="bg-surface-1 rounded-[12px] border border-border-secondary p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-medium"
                    style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)' }}
                  >
                    !
                  </span>
                  <span
                    className="text-xs font-medium capitalize"
                    style={{ color: 'var(--warning-text)' }}
                  >
                    {axis.tension.level} tension — Axis {axis.axisId}: {axis.name}
                  </span>
                </div>
                {axis.tension.narrative && (
                  <p className="text-[13px] text-text-secondary leading-relaxed mb-2">
                    {axis.tension.narrative}
                  </p>
                )}
                <div className="flex gap-6 text-xs font-mono text-text-tertiary">
                  <span>Stated: {axis.components.fc >= 0 ? "+" : ""}{((axis.components.fc * 0.55 + axis.components.sc * 0.45)).toFixed(2)}</span>
                  <span>Budget: {axis.components.bg != null ? ((axis.components.bg >= 0 ? "+" : "") + axis.components.bg.toFixed(2)) : "N/A"}</span>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Radar section */}
        <section>
          <h2 className="text-[18px] font-serif font-medium text-text-primary mb-4">
            Your 12-axis profile
          </h2>
          <div className="bg-surface-2 rounded-[12px] p-6">
            <RadarChart
              axisScores={axisData}
              archetypePrototype={primaryArchetype?.prototype}
              showArchetypeOverlay={!!primaryArchetype?.prototype}
            />
          </div>
        </section>

        {/* Axis breakdown by domain */}
        <section>
          <h2 className="text-[18px] font-serif font-medium text-text-primary mb-1">
            Axis breakdown
          </h2>
          <p className="text-xs font-serif italic text-text-tertiary mb-6">
            Each axis scored from -1.0 (Pole A) to +1.0 (Pole B), weighted across three modalities.
          </p>

          <div className="space-y-5">
            {domains.map((domain) => (
              <div key={domain.name}>
                <div className="text-[11px] uppercase tracking-[0.08em] text-stone-800 font-medium border-b border-border-secondary pb-1.5 mb-2 mt-5 first:mt-0">
                  {domain.name}
                </div>
                <div className="space-y-0">
                  {domain.axes.map((axis, i) => (
                    <AxisBreakdownCard
                      key={axis.axisId}
                      {...axis}
                      alternateRow={i % 2 === 1}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
