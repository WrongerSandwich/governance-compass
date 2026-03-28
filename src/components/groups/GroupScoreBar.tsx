"use client";

import { ScoreBar } from "@/components/results/ScoreBar";

interface GroupScoreBarProps {
  axisName: string;
  poleALabel: string;
  poleBLabel: string;
  memberScores: number[];
  average: number | null;
}

export function GroupScoreBar({
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
      </div>

      {/* Member dots bar */}
      <div
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
          const left = ((Math.max(-1, Math.min(1, score)) + 1) / 2) * 100;
          return (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full"
              style={{
                left: `${left}%`,
                width: 10,
                height: 10,
                border: '2px solid var(--stone-600)',
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
              left: `${((Math.max(-1, Math.min(1, average)) + 1) / 2) * 100}%`,
              width: 1.5,
              height: 16,
              backgroundColor: 'var(--stone-600)',
              opacity: 0.6,
            }}
            title={`Group avg: ${average.toFixed(2)}`}
          />
        )}
      </div>

      {/* ScoreBar for the group average */}
      {average !== null && (
        <ScoreBar
          score={average}
          poleALabel={poleALabel}
          poleBLabel={poleBLabel}
          height={6}
        />
      )}
      {average === null && (
        <div className="flex justify-between text-xs text-text-tertiary mt-1">
          <span>{poleALabel}</span>
          <span>No data</span>
          <span>{poleBLabel}</span>
        </div>
      )}
    </div>
  );
}
