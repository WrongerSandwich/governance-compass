"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { CompassPlot } from "./CompassPlot";
import { ArchetypeCard } from "./ArchetypeCard";
import { RadarChart } from "./RadarChart";
import { AxisBreakdownCard } from "./AxisBreakdownCard";
import { CompareButton } from "./CompareButton";

export interface AxisDisplayData {
  axisId: number;
  name: string;
  poleALabel: string;
  poleBLabel: string;
  domain: string;
  finalScore: number;
  confidence: string;
  tension: {
    detected: boolean;
    level: string;
    direction: string | null;
    narrative: string | null;
  };
  components: { fc: number; sc: number; bg: number | null };
}

export interface ResultsViewProps {
  axisData: AxisDisplayData[];
  compass: { economic: number; cultural: number };
  archetype: {
    primary: {
      name: string;
      matchPercentage: number;
      summary: string;
      description: string;
      tension: string;
      prototype: number[];
    };
    secondary: {
      name: string;
      matchPercentage: number;
      summary: string;
    };
    isBlended: boolean;
  };
  profileId?: string;
  encoded?: string;
}

function SaveToAccountButton({ encoded }: { encoded: string }) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  if (!session?.user) return null;

  const handleSave = async () => {
    setStatus("saving");
    const res = await fetch("/api/profile/materialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encoded }),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("lastResults", `id:${data.profileId}`);
      setStatus("saved");
      window.location.href = `/results/${data.profileId}`;
    } else {
      setStatus("error");
    }
  };

  if (status === "saved") {
    return (
      <p className="text-xs text-text-tertiary text-center">
        Results saved to your account.
      </p>
    );
  }

  return (
    <div className="text-center">
      <button
        onClick={handleSave}
        disabled={status === "saving"}
        className="border border-stone-600 text-stone-600 px-4 py-2 rounded-[8px] text-sm font-medium hover:bg-stone-100 transition-colors duration-150 disabled:opacity-50"
      >
        {status === "saving" ? "Saving..." : "Save to account"}
      </button>
      {status === "error" && (
        <p className="text-xs mt-2" style={{ color: "var(--warning-text)" }}>
          Failed to save. Please try again.
        </p>
      )}
    </div>
  );
}

export function ResultsView({
  axisData,
  compass,
  archetype,
  profileId,
  encoded,
}: ResultsViewProps) {
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
            A simplified two-dimensional view. Scroll for your complete 12-axis
            profile.
          </p>
        </div>

        {/* Hero region: Compass + Archetype side by side */}
        <section className="bg-surface-2 rounded-[12px] p-6">
          <div className="grid grid-cols-1 min-[560px]:grid-cols-2 gap-5">
            <CompassPlot
              economic={compass.economic}
              cultural={compass.cultural}
            />
            <ArchetypeCard
              primary={{
                name: archetype.primary.name,
                matchPercentage: archetype.primary.matchPercentage,
                summary: archetype.primary.summary,
                description: archetype.primary.description,
                tension: archetype.primary.tension,
              }}
              secondary={{
                name: archetype.secondary.name,
                matchPercentage: archetype.secondary.matchPercentage,
                summary: archetype.secondary.summary,
              }}
              isBlended={archetype.isBlended}
            />
          </div>

          {/* Share buttons -- spec order: image, link, data */}
          <div className="flex gap-2 mt-5">
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
                    style={{
                      backgroundColor: "var(--warning-bg)",
                      color: "var(--warning-text)",
                    }}
                  >
                    !
                  </span>
                  <span
                    className="text-xs font-medium capitalize"
                    style={{ color: "var(--warning-text)" }}
                  >
                    {axis.tension.level} tension — Axis {axis.axisId}:{" "}
                    {axis.name}
                  </span>
                </div>
                {axis.tension.narrative && (
                  <p className="text-[13px] text-text-secondary leading-relaxed mb-2">
                    {axis.tension.narrative}
                  </p>
                )}
                <div className="flex gap-6 text-xs font-mono text-text-tertiary">
                  <span>
                    Stated:{" "}
                    {axis.components.fc >= 0 ? "+" : ""}
                    {(
                      axis.components.fc * 0.55 +
                      axis.components.sc * 0.45
                    ).toFixed(2)}
                  </span>
                  <span>
                    Budget:{" "}
                    {axis.components.bg != null
                      ? (axis.components.bg >= 0 ? "+" : "") +
                        axis.components.bg.toFixed(2)
                      : "N/A"}
                  </span>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Radar section */}
        <section>
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary mb-1">
            Full profile
          </p>
          <h2 className="text-[18px] font-serif font-medium text-text-primary mb-4">
            Radar
          </h2>
          <div className="bg-surface-2 rounded-[12px] p-6">
            <RadarChart
              axisScores={axisData}
              archetypePrototype={archetype.primary.prototype}
              showArchetypeOverlay={archetype.primary.prototype.length > 0}
            />
          </div>
        </section>

        {/* Axis breakdown by domain */}
        <section>
          <h2 className="text-[18px] font-serif font-medium text-text-primary mb-1">
            Axis breakdown
          </h2>
          <p className="text-xs font-serif italic text-text-tertiary mb-6">
            Each axis scored from -1.0 (Pole A) to +1.0 (Pole B), weighted
            across three modalities.
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

        {/* Compare Button -- only for materialized profiles */}
        {profileId && <CompareButton profileId={profileId} />}

        {/* Save to account -- only for URL-encoded (non-materialized) results */}
        {encoded && !profileId && <SaveToAccountButton encoded={encoded} />}
      </div>
    </main>
  );
}
