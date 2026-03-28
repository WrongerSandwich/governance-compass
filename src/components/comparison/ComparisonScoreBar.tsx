"use client";

interface ComparisonScoreBarProps {
  axisName: string;
  scoreA: number; // -1.0 to +1.0
  scoreB: number; // -1.0 to +1.0
  poleALabel: string;
  poleBLabel: string;
  delta: number;
  labelA: string;
  labelB: string;
}

export function ComparisonScoreBar({
  axisName,
  scoreA,
  scoreB,
  poleALabel,
  poleBLabel,
  delta,
  labelA,
  labelB,
}: ComparisonScoreBarProps) {
  // Convert -1.0..+1.0 to 0..100% position
  const toPercent = (score: number) =>
    ((Math.max(-1, Math.min(1, score)) + 1) / 2) * 100;

  const leftA = toPercent(scoreA);
  const leftB = toPercent(scoreB);

  // Delta badge thresholds: delta is 0.0–2.0; low < 0.2, mid < 0.6
  const badgeClass =
    delta <= 0.2
      ? "bg-green-50 text-green-700"
      : delta <= 0.6
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-700";

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-1">
        <span className="font-medium text-gray-900">{axisName}</span>
        <span className={`text-xs px-2 py-0.5 rounded ${badgeClass}`}>
          {delta.toFixed(2)} apart
        </span>
      </div>
      <div className="relative h-6 bg-gradient-to-r from-indigo-200 via-purple-100 to-rose-200 rounded-full">
        {/* Center marker */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-px w-px bg-gray-400" />
        {/* Profile A marker (indigo) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-indigo-100 border-[3px] border-indigo-600 rounded-full shadow-md z-10"
          style={{ left: `${leftA}%` }}
          title={labelA}
        />
        {/* Profile B marker (rose) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-rose-100 border-[3px] border-rose-500 rounded-full shadow-md z-10"
          style={{ left: `${leftB}%` }}
          title={labelB}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{poleALabel}</span>
        <span>{poleBLabel}</span>
      </div>
    </div>
  );
}
