"use client";

import { useState } from "react";
import { PairedAxisScale } from "@/components/PairedAxisScale";
import { AXIS_WEIGHT_PROFILES } from "@/lib/scoring-types";

export interface AxisBreakdownCardProps {
  axisId: number;
  name: string;
  poleALabel: string;
  poleBLabel: string;
  tagline: string;
  domain: string;
  finalScore: number;
  confidence: string;
  tension: {
    detected: boolean;
    level: string;
    direction: string | null;
    narrative: string | null;
  };
  components: {
    fc: number;
    sc: number;
    bg: number | null;
  };
  showScoring?: boolean;
}

function formatScore(val: number | null): string {
  if (val === null) return "N/A";
  const clamped = Math.max(-1, Math.min(1, val));
  return (clamped > 0 ? "+" : "") + clamped.toFixed(2);
}

export function AxisBreakdownCard({
  axisId,
  name,
  poleALabel,
  poleBLabel,
  tagline,
  finalScore,
  confidence,
  tension,
  components,
  showScoring = false,
}: AxisBreakdownCardProps) {
  const weights = AXIS_WEIGHT_PROFILES[axisId] ?? { fc: 0.40, sc: 0.35, bg: 0.25 };
  const [expanded, setExpanded] = useState(false);

  const confidenceText =
    confidence === "high"
      ? "High confidence"
      : confidence === "moderate"
        ? "Moderate confidence"
        : confidence === "conflicted"
          ? "Conflicted"
          : "Low confidence";

  return (
    <div className="border-b border-border-secondary">
      {/* `items-start`, not the mock's `align-items:center`: the mock's
          fabricated taglines are one line, so centre and start look
          identical there, but every real tagline in src/data/axes.ts wraps
          in a 210px column, and centre detaches the axis number from the
          name it labels by 11-15px. Deliberate divergence from a static
          prototype, not an oversight. */}
      <div
        data-axis-row
        className="grid grid-cols-[24px_minmax(0,1fr)] min-[560px]:grid-cols-[24px_minmax(0,1fr)_210px] items-start gap-4 py-3"
      >
        <p data-axis-index className="mono-meta text-text-label pt-1">
          {String(axisId).padStart(2, "0")}
        </p>

        <div>
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <p className="body-s text-text-primary">{name}</p>
            <p data-axis-score className="mono-meta text-text-secondary tabular-nums">
              {formatScore(finalScore)}
            </p>
          </div>
          <PairedAxisScale
            axisId={axisId}
            poleALabel={poleALabel}
            poleBLabel={poleBLabel}
            scoreA={finalScore}
            endpoints="below"
            axisName={name}
          />
        </div>

        {/* Third cell on desktop, second on mobile — it drops beneath the
            scale rather than squeezing a 210px column onto a 320px screen. */}
        <div data-axis-meta className="col-start-2 min-[560px]:col-start-3">
          <p data-axis-confidence className="mono-meta text-text-label">{confidenceText}</p>
          {tension.detected && (
            <p data-axis-tension className="mono-meta text-warning-text mt-1">Tension detected</p>
          )}
          <p className="body-xs text-text-label mt-1">{tagline}</p>
        </div>
      </div>

      {/* Scoring breakdown — only reachable when the section-level toggle is on */}
      {showScoring && (
        <div className="pb-3 pl-10">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="label-nav text-text-secondary hover:text-text-primary transition-colors duration-150 focus-ring"
            aria-expanded={expanded}
            aria-label={expanded ? `Hide scoring breakdown for ${name}` : `Show scoring breakdown for ${name}`}
          >
            {expanded ? "▾ Hide scoring breakdown" : "▸ See how this was scored"}
          </button>

          {expanded && (
            <div className="mt-2.5 border-t border-rule-hairline pt-3 space-y-2">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="mono-meta text-text-label mb-0.5">Forced choice</p>
                  <p className="mono-meta text-text-primary tabular-nums">
                    {formatScore(components.fc)}
                  </p>
                </div>
                <div>
                  <p className="mono-meta text-text-label mb-0.5">Calibrated scale</p>
                  <p className="mono-meta text-text-primary tabular-nums">
                    {formatScore(components.sc)}
                  </p>
                </div>
                <div>
                  <p className="mono-meta text-text-label mb-0.5">Budget</p>
                  <p className="mono-meta text-text-primary tabular-nums">
                    {formatScore(components.bg)}
                  </p>
                </div>
              </div>
              <p className="mono-meta text-text-label">
                ({weights.fc.toFixed(2)} &times; {formatScore(components.fc)}) + ({weights.sc.toFixed(2)} &times; {formatScore(components.sc)}){weights.bg > 0 ? ` + (${weights.bg.toFixed(2)} × ${formatScore(components.bg)})` : ""} = {formatScore(finalScore)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
