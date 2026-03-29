"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { CompassPlot } from "./CompassPlot";
import { ArchetypeCard } from "./ArchetypeCard";
import { RadarChart } from "./RadarChart";
import { AxisBreakdownCard } from "./AxisBreakdownCard";
import { CompareButton } from "./CompareButton";
import { DOMAIN_COLORS, type DomainKey } from "@/lib/design-tokens";
import { STATED_FC_WEIGHT, STATED_SC_WEIGHT } from "@/lib/scoring-types";
import { FadeInSection } from "@/components/FadeInSection";

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
      id: string;
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
    isDistinctive: boolean;
  };
  profileId?: string;
  encoded?: string;
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
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
    <button
      onClick={handleCopy}
      className="text-xs border border-border-secondary bg-surface-1 text-text-secondary rounded-[8px] px-3.5 py-1.5 hover:bg-surface-2 hover:text-text-primary transition-colors duration-150 focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
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
      // Full reload so the server page fetches the materialized profile
      window.location.href = `/results/${data.profileId}`;
    } else {
      setStatus("error");
    }
  };

  if (status === "saved") {
    return (
      <p className="text-xs text-text-tertiary">
        Results saved to your account.
      </p>
    );
  }

  return (
    <span>
      <button
        onClick={handleSave}
        disabled={status === "saving"}
        className="text-xs border border-border-secondary bg-surface-1 text-text-secondary rounded-[8px] px-3.5 py-1.5 hover:bg-surface-2 hover:text-text-primary transition-colors duration-150 disabled:opacity-50"
      >
        {status === "saving" ? "Saving..." : "Save to account"}
      </button>
      {status === "error" && (
        <span className="text-xs ml-2 text-warning-text">
          Failed to save. Please try again.
        </span>
      )}
    </span>
  );
}

const SECTION_IDS = {
  compass: "compass",
  tensions: "tensions",
  radar: "radar",
  breakdown: "breakdown",
};

export function ResultsView({
  axisData,
  compass,
  archetype,
  profileId,
  encoded,
}: ResultsViewProps) {
  const domainKeys: DomainKey[] = ["economic", "power", "society", "world"];
  const domains = domainKeys.map((key) => ({
    key,
    name: DOMAIN_COLORS[key].name,
    color600: DOMAIN_COLORS[key][600],
    axes: axisData.filter((a) => a.domain === DOMAIN_COLORS[key].name),
  }));

  const tensionAxes = axisData.filter((a) => a.tension.detected);
  const [showScoring, setShowScoring] = useState(false);

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Page header with archetype identity */}
        <FadeInSection>
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary mb-1">
              Assessment results
            </p>
            {archetype.isDistinctive ? (
              <>
                <h1 className="text-[28px] font-serif font-medium text-text-primary leading-tight">
                  A distinctive profile
                </h1>
                <p className="text-sm text-text-secondary mt-1">
                  Your positions don&apos;t map to a single governance philosophy — nearest match is {archetype.primary.name} at {archetype.primary.matchPercentage}%
                </p>
              </>
            ) : (
              <>
                <h1 className="text-[28px] font-serif font-medium text-text-primary leading-tight">
                  {archetype.primary.name}
                </h1>
                <p className="text-sm text-text-secondary mt-1">
                  {archetype.primary.matchPercentage}% match — your Governance Compass across 12 axes
                </p>
              </>
            )}
          </div>
        </FadeInSection>

        {/* Section jump links */}
        <FadeInSection delay={100}>
        <nav className="flex gap-4 text-xs text-text-tertiary" aria-label="Page sections">
          <a href={`#${SECTION_IDS.compass}`} className="hover:text-text-secondary transition-colors duration-150">Compass</a>
          {tensionAxes.length > 0 && (
            <a href={`#${SECTION_IDS.tensions}`} className="hover:text-text-secondary transition-colors duration-150">Tensions</a>
          )}
          <a href={`#${SECTION_IDS.radar}`} className="hover:text-text-secondary transition-colors duration-150">Radar</a>
          <a href={`#${SECTION_IDS.breakdown}`} className="hover:text-text-secondary transition-colors duration-150">Breakdown</a>
        </nav>
        </FadeInSection>

        {/* Hero region: Compass + Archetype side by side */}
        <FadeInSection delay={200}>
        <section id={SECTION_IDS.compass} className="bg-surface-2 rounded-[12px] p-6">
          <div className="grid grid-cols-1 min-[560px]:grid-cols-2 gap-5">
            <CompassPlot
              economic={compass.economic}
              cultural={compass.cultural}
              primaryArchetypeId={archetype.isDistinctive ? undefined : archetype.primary.id}
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
              isDistinctive={archetype.isDistinctive}
            />
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-2 mt-5">
            <CopyLinkButton />
            {encoded && !profileId && <SaveToAccountButton encoded={encoded} />}
            {profileId && <CompareButton profileId={profileId} />}
          </div>
        </section>
        </FadeInSection>

        {/* Tension cards (between hero and radar) */}
        {tensionAxes.length > 0 && (
          <FadeInSection>
          <section id={SECTION_IDS.tensions} className="space-y-3">
            {tensionAxes.map((axis) => (
              <div
                key={axis.axisId}
                className="bg-surface-1 rounded-[12px] border border-border-secondary p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-medium bg-warning-bg text-warning-text">
                    !
                  </span>
                  <span className="text-xs font-medium capitalize text-warning-text">
                    {axis.tension.level} tension — {axis.name}
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
                    {(axis.components.fc * STATED_FC_WEIGHT + axis.components.sc * STATED_SC_WEIGHT).toFixed(2)}
                  </span>
                  <span>
                    Budget:{" "}
                    {axis.components.bg != null
                      ? (axis.components.bg >= 0 ? "+" : "") + axis.components.bg.toFixed(2)
                      : "N/A"}
                  </span>
                </div>
              </div>
            ))}
          </section>
          </FadeInSection>
        )}

        {/* Radar section */}
        <FadeInSection>
        <section id={SECTION_IDS.radar}>
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary mb-1">
            Full profile
          </p>
          <h2 className="text-[18px] font-serif font-medium text-text-primary mb-1">
            12-axis radar
          </h2>
          <p className="text-xs font-serif italic text-text-tertiary mb-4">
            Each spoke runs from one governance pole (center) to its counterpart (perimeter). The midpoint ring is neutral. Colors group axes by domain.
          </p>
          <div className="bg-surface-2 rounded-[12px] p-6">
            <RadarChart axisScores={axisData} />
          </div>
        </section>
        </FadeInSection>

        {/* Axis breakdown by domain */}
        <FadeInSection>
        <section id={SECTION_IDS.breakdown}>
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="text-[18px] font-serif font-medium text-text-primary">
              Axis breakdown
            </h2>
            <button
              type="button"
              onClick={() => setShowScoring((prev) => !prev)}
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors duration-150"
            >
              {showScoring ? "Hide scoring details" : "Show scoring details"}
            </button>
          </div>
          <p className="text-xs font-serif italic text-text-tertiary mb-6">
            Each axis scored from -1.0 to +1.0 between its two endpoints, weighted across your dilemma choices, scale responses, and budget allocation.
          </p>

          <div className="space-y-5">
            {domains.map((domain) => (
              <div key={domain.key}>
                <div
                  className="text-[11px] uppercase tracking-[0.08em] font-medium border-b border-border-secondary pb-1.5 mb-2 mt-5 first:mt-0"
                  style={{ color: domain.color600 }}
                >
                  {domain.name}
                </div>
                <div className="space-y-0">
                  {domain.axes.map((axis, i) => (
                    <AxisBreakdownCard
                      key={axis.axisId}
                      {...axis}
                      alternateRow={i % 2 === 1}
                      showScoring={showScoring}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
        </FadeInSection>
      </div>
    </main>
  );
}
