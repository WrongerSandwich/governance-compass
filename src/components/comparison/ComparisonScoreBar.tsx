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
            className="absolute text-[10px] font-mono text-text-primary bg-surface-1 border border-border-secondary rounded px-1.5 py-0.5 -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${leftA}%` }}
          >
            {labelA}: {formatScore(scoreA)} {poleName(scoreA)}
          </span>
        )}
        {hovered === "B" && (
          <span
            className="absolute text-[10px] font-mono text-text-primary bg-surface-1 border border-border-secondary rounded px-1.5 py-0.5 -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${leftB}%` }}
          >
            {labelB}: {formatScore(scoreB)} {poleName(scoreB)}
          </span>
        )}
      </div>

      {/* Track with overflow wrapper */}
      <div className="relative w-full overflow-x-clip">
        <div
          className="relative h-[6px] w-full rounded-[3px] overflow-visible"
          style={{ backgroundColor: 'var(--border-tertiary)' }}
        >
          {/* Center marker */}
          <div
            className="absolute left-1/2 -translate-x-px"
            style={{
              top: -3,
              width: 0.5,
              height: 12,
              backgroundColor: 'var(--border-secondary)',
            }}
          />
          {/* Profile A marker (ring) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full z-10 cursor-default"
            style={{
              left: `${leftA}%`,
              width: hovered === "A" ? 14 : 12,
              height: hovered === "A" ? 14 : 12,
              border: `2px solid ${domainColor}`,
              backgroundColor: 'var(--surface-1)',
              transition: 'width 150ms, height 150ms',
            }}
            onMouseEnter={() => setHovered("A")}
            onMouseLeave={() => setHovered(null)}
          />
          {/* Profile B marker (filled dot) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full z-10 cursor-default"
            style={{
              left: `${leftB}%`,
              width: hovered === "B" ? 12 : 10,
              height: hovered === "B" ? 12 : 10,
              backgroundColor: domainColor,
              opacity: 0.55,
              transition: 'width 150ms, height 150ms',
            }}
            onMouseEnter={() => setHovered("B")}
            onMouseLeave={() => setHovered(null)}
          />
        </div>
      </div>

      <div className="flex justify-between text-xs text-text-tertiary mt-1.5">
        <span>{poleALabel}</span>
        <span className="text-right">{poleBLabel}</span>
      </div>
    </div>
  );
}
