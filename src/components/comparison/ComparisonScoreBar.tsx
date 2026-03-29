"use client";

import { useState } from "react";
import { getDomainColor600 } from "@/lib/design-tokens";

interface ComparisonScoreBarProps {
  axisId: number;
  axisName: string;
  tagline: string;
  scoreA: number;
  scoreB: number;
  poleALabel: string;
  poleBLabel: string;
  delta: number;
  labelA: string;
  labelB: string;
}

export function ComparisonScoreBar({
  axisId,
  axisName,
  tagline,
  scoreA,
  scoreB,
  poleALabel,
  poleBLabel,
  delta,
  labelA,
  labelB,
}: ComparisonScoreBarProps) {
  const [hovered, setHovered] = useState<"A" | "B" | null>(null);

  const toPercent = (score: number) =>
    ((Math.max(-1, Math.min(1, score)) + 1) / 2) * 100;

  const leftA = toPercent(scoreA);
  const leftB = toPercent(scoreB);
  const domainColor = getDomainColor600(axisId);

  const formatScore = (score: number) =>
    Math.abs(score).toFixed(2);
  const poleName = (score: number) =>
    score >= 0 ? poleBLabel : poleALabel;

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-sm font-medium text-text-primary">{axisName}</span>
        <span className="text-[10px] font-mono text-text-tertiary bg-surface-2 px-2 py-0.5 rounded-[8px]">
          {delta.toFixed(2)} apart
        </span>
      </div>
      <p className="text-[11px] text-text-tertiary mb-2">{tagline}</p>

      {/* Tooltip area */}
      <div className="relative mb-1" style={{ height: 16 }}>
        {hovered === "A" && (
          <span
            className="absolute text-[10px] font-mono text-text-primary bg-surface-1 border border-border-secondary rounded px-1.5 py-0.5 -translate-x-1/2 whitespace-nowrap z-20"
            style={{ left: `${leftA}%` }}
          >
            {labelA}: {formatScore(scoreA)} {poleName(scoreA)}
          </span>
        )}
        {hovered === "B" && (
          <span
            className="absolute text-[10px] font-mono text-text-primary bg-surface-1 border border-border-secondary rounded px-1.5 py-0.5 -translate-x-1/2 whitespace-nowrap z-20"
            style={{ left: `${leftB}%` }}
          >
            {labelB}: {formatScore(scoreB)} {poleName(scoreB)}
          </span>
        )}
      </div>

      {/* Track — using SVG so dots render cleanly without overflow issues */}
      <svg viewBox="0 0 200 20" className="w-full" style={{ height: 20 }} aria-hidden="true">
        {/* Track background */}
        <rect x="0" y="7" width="200" height="6" rx="3" style={{ fill: 'var(--border-tertiary)' }} />

        {/* Center marker */}
        <line x1="100" y1="4" x2="100" y2="16" style={{ stroke: 'var(--border-secondary)' }} strokeWidth="0.5" />

        {/* Profile A marker (ring) */}
        <circle
          cx={leftA * 2}
          cy="10"
          r={hovered === "A" ? 7 : 6}
          fill="var(--surface-1)"
          stroke={domainColor}
          strokeWidth="2"
          style={{ cursor: "default", transition: "r 150ms" }}
          onMouseEnter={() => setHovered("A")}
          onMouseLeave={() => setHovered(null)}
        />

        {/* Profile B marker (filled dot) */}
        <circle
          cx={leftB * 2}
          cy="10"
          r={hovered === "B" ? 6 : 5}
          fill={domainColor}
          opacity={0.55}
          style={{ cursor: "default", transition: "r 150ms" }}
          onMouseEnter={() => setHovered("B")}
          onMouseLeave={() => setHovered(null)}
        />
      </svg>

      <div className="flex justify-between text-xs text-text-tertiary mt-1">
        <span>{poleALabel}</span>
        <span className="text-right">{poleBLabel}</span>
      </div>
    </div>
  );
}
