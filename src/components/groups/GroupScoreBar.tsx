"use client";

import { PairedAxisScale, scoreToTrackPercent } from "@/components/PairedAxisScale";

interface GroupScoreBarProps {
  /** 1-12; selects the domain colour for the average marker. */
  axisId: number;
  axisName: string;
  poleALabel: string;
  poleBLabel: string;
  memberScores: number[];
  average: number | null;
}

export function GroupScoreBar({
  axisId,
  axisName,
  poleALabel,
  poleBLabel,
  memberScores,
  average,
}: GroupScoreBarProps) {
  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-text-primary">{axisName}</span>
        {average !== null && (
          <span className="text-xs font-mono tabular-nums text-text-secondary">
            {average >= 0 ? "+" : ""}
            {average.toFixed(2)}
          </span>
        )}
      </div>

      {/* Member dots bar. Purely illustrative — the accessible position and
          value both live in the PairedAxisScale below and the readout above. */}
      <div
        aria-hidden="true"
        className="relative h-[6px] rounded-[3px] overflow-visible mb-3"
        style={{ backgroundColor: 'var(--border-tertiary)' }}
      >
        {/* Center line */}
        <div
          className="absolute left-1/2 -translate-x-px"
          style={{
            top: -3,
            width: 0.5,
            height: 12,
            backgroundColor: 'var(--border-secondary)',
          }}
        />

        {/* Member score dots */}
        {memberScores.map((score, i) => {
          const left = scoreToTrackPercent(score);
          return (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full"
              style={{
                left: `${left}%`,
                width: 10,
                height: 10,
                border: '2px solid var(--mark-primary)',
                backgroundColor: 'var(--surface-1)',
              }}
              title={score.toFixed(2)}
            />
          );
        })}

        {/* Group average marker */}
        {average !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-px"
            style={{
              left: `${scoreToTrackPercent(average)}%`,
              width: 1.5,
              height: 16,
              backgroundColor: 'var(--mark-primary)',
              opacity: 0.6,
            }}
            title={`Group avg: ${average.toFixed(2)}`}
          />
        )}
      </div>

      {/* PairedAxisScale for the group average */}
      {average !== null && (
        <PairedAxisScale
          axisId={axisId}
          poleALabel={poleALabel}
          poleBLabel={poleBLabel}
          scoreA={average}
          endpoints="below"
          axisName={`${axisName}, group average`}
        />
      )}
      {average === null && (
        <div className="flex justify-between text-xs text-text-label mt-1">
          <span>{poleALabel}</span>
          <span>No data</span>
          <span>{poleBLabel}</span>
        </div>
      )}
    </div>
  );
}
