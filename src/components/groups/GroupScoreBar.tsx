"use client";

import { ScoreBar } from "@/components/results/ScoreBar";

interface GroupScoreBarProps {
  axisName: string;
  poleALabel: string;
  poleBLabel: string;
  memberScores: number[]; // each in [-1.0, +1.0]
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
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-gray-900 text-sm">{axisName}</span>
      </div>

      {/* Member dots bar */}
      <div className="relative h-8 rounded-full overflow-hidden mb-1">
        {/* Left half: Pole A side */}
        <div className="absolute inset-y-0 left-0 w-1/2 bg-indigo-100" />
        {/* Right half: Pole B side */}
        <div className="absolute inset-y-0 right-0 w-1/2 bg-rose-100" />
        {/* Center line */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-px w-px bg-gray-300" />

        {/* Member score dots */}
        {memberScores.map((score, i) => {
          const left = ((Math.max(-1, Math.min(1, score)) + 1) / 2) * 100;
          return (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-gray-600 rounded-full shadow-sm"
              style={{ left: `${left}%` }}
              title={score.toFixed(2)}
            />
          );
        })}

        {/* Group average marker */}
        {average !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-8 bg-gray-800 opacity-60"
            style={{
              left: `${((Math.max(-1, Math.min(1, average)) + 1) / 2) * 100}%`,
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
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{poleALabel}</span>
          <span className="text-gray-300">No data</span>
          <span>{poleBLabel}</span>
        </div>
      )}
    </div>
  );
}
