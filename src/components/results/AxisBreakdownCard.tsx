"use client";

import { useState } from "react";
import { ScoreBar } from "./ScoreBar";
import { AXIS_WEIGHT_PROFILES } from "@/lib/scoring-types";
import { getDomainColor600 } from "@/lib/design-tokens";

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
  alternateRow?: boolean;
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
  alternateRow = false,
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
    <div
      className={`rounded-[8px] px-3 py-[9px] ${alternateRow ? "bg-surface-2" : ""}`}
    >
      {/* Axis name row */}
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-sm font-medium text-text-primary">{name}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-tertiary">{confidenceText}</span>
          {tension.detected && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-[8px] bg-warning-bg text-warning-text">
              tension
            </span>
          )}
        </div>
      </div>
      <p className="text-[11px] text-text-tertiary mb-2">{tagline}</p>

      {/* Score bar with 3-column layout */}
      <ScoreBar
        score={finalScore}
        poleALabel={poleALabel}
        poleBLabel={poleBLabel}
        accentColor={getDomainColor600(axisId)}
      />

      {/* Scoring breakdown — only visible when section-level toggle is on */}
      {showScoring && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-2 text-[13px] text-text-secondary hover:text-text-primary transition-colors duration-150"
            aria-expanded={expanded}
            aria-label={expanded ? `Hide scoring breakdown for ${name}` : `Show scoring breakdown for ${name}`}
          >
            {expanded ? "\u25BE Hide scoring breakdown" : "\u25B8 See how this was scored"}
          </button>

          {expanded && (
            <div className="mt-2 bg-surface-2 rounded-[8px] p-3 space-y-2">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-surface-1 rounded-[8px] p-2">
                  <p className="text-[11px] text-text-tertiary mb-0.5">Forced choice</p>
                  <p className="text-xs font-mono font-medium text-text-primary tabular-nums">
                    {formatScore(components.fc)}
                  </p>
                </div>
                <div className="bg-surface-1 rounded-[8px] p-2">
                  <p className="text-[11px] text-text-tertiary mb-0.5">Calibrated scale</p>
                  <p className="text-xs font-mono font-medium text-text-primary tabular-nums">
                    {formatScore(components.sc)}
                  </p>
                </div>
                <div className="bg-surface-1 rounded-[8px] p-2">
                  <p className="text-[11px] text-text-tertiary mb-0.5">Budget</p>
                  <p className="text-xs font-mono font-medium text-text-primary tabular-nums">
                    {formatScore(components.bg)}
                  </p>
                </div>
              </div>
              <p className="text-[11px] font-mono text-text-tertiary text-center border-t border-border-secondary pt-2">
                ({weights.fc.toFixed(2)} &times; {formatScore(components.fc)}) + ({weights.sc.toFixed(2)} &times; {formatScore(components.sc)}){weights.bg > 0 ? ` + (${weights.bg.toFixed(2)} \u00d7 ${formatScore(components.bg)})` : ""} = {formatScore(finalScore)}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
