"use client";

export interface ScoreBarProps {
  score: number; // -1.0 to +1.0
  poleALabel: string;
  poleBLabel: string;
  height?: number; // default 8
}

export function ScoreBar({
  score,
  poleALabel,
  poleBLabel,
  height = 8,
}: ScoreBarProps) {
  // Clamp score to [-1, 1]
  const clamped = Math.max(-1, Math.min(1, score));

  // Convert score to a left percentage (0% = -1.0, 50% = 0.0, 100% = +1.0)
  const markerLeft = ((clamped + 1) / 2) * 100;

  const formattedScore =
    clamped === 0
      ? "0.00"
      : (clamped > 0 ? "+" : "") + clamped.toFixed(2);

  return (
    <div className="w-full">
      {/* Bar */}
      <div
        className="relative w-full rounded-full overflow-hidden"
        style={{ height }}
      >
        {/* Left half: Pole A side (indigo-200) */}
        <div
          className="absolute inset-y-0 left-0 bg-indigo-200"
          style={{ width: "50%" }}
        />
        {/* Right half: Pole B side (rose-200) */}
        <div
          className="absolute inset-y-0 right-0 bg-rose-200"
          style={{ width: "50%" }}
        />
        {/* Center marker line */}
        <div
          className="absolute inset-y-0 left-1/2 -translate-x-px w-px bg-gray-400"
          aria-hidden="true"
        />
        {/* Score marker dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-indigo-600 shadow-md ring-2 ring-white"
          style={{
            left: `${markerLeft}%`,
            width: height + 4,
            height: height + 4,
          }}
          aria-hidden="true"
        />
      </div>

      {/* Labels row */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-500 truncate max-w-[40%]">
          {poleALabel}
        </span>
        <span className="text-xs font-semibold text-indigo-700 tabular-nums">
          {formattedScore}
        </span>
        <span className="text-xs text-gray-500 truncate max-w-[40%] text-right">
          {poleBLabel}
        </span>
      </div>
    </div>
  );
}
