"use client";

interface ComparisonScoreBarProps {
  axisName: string;
  scoreA: number;
  scoreB: number;
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
  const toPercent = (score: number) =>
    ((Math.max(-1, Math.min(1, score)) + 1) / 2) * 100;

  const leftA = toPercent(scoreA);
  const leftB = toPercent(scoreB);

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-text-primary">{axisName}</span>
        <span className="text-[10px] font-mono text-text-tertiary bg-surface-2 px-2 py-0.5 rounded-[8px]">
          {delta.toFixed(2)} apart
        </span>
      </div>
      <div
        className="relative h-[6px] rounded-[3px]"
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
        {/* Profile A marker (solid dot) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full z-10"
          style={{
            left: `${leftA}%`,
            width: 12,
            height: 12,
            border: '2px solid var(--stone-600)',
            backgroundColor: 'var(--surface-1)',
          }}
          title={labelA}
        />
        {/* Profile B marker (filled dot) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full z-10"
          style={{
            left: `${leftB}%`,
            width: 10,
            height: 10,
            backgroundColor: 'var(--stone-600)',
            opacity: 0.55,
          }}
          title={labelB}
        />
      </div>
      <div className="flex justify-between text-xs text-text-tertiary mt-1.5">
        <span className="truncate w-[56px] min-[560px]:w-[82px]" title={poleALabel}>{poleALabel}</span>
        <span className="truncate text-right w-[56px] min-[560px]:w-[82px]" title={poleBLabel}>{poleBLabel}</span>
      </div>
    </div>
  );
}
