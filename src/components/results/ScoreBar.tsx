"use client";

export interface ScoreBarProps {
  score: number; // -1.0 to +1.0
  poleALabel: string;
  poleBLabel: string;
  height?: number; // default 6
  accentColor?: string; // hex color for fill and dot border
}

export function ScoreBar({
  score,
  poleALabel,
  poleBLabel,
  height = 6,
  accentColor,
}: ScoreBarProps) {
  const fillColor = accentColor ?? 'var(--stone-600)';
  const dotBorder = accentColor ? `2px solid ${accentColor}` : '2px solid var(--stone-600)';
  const clamped = Math.max(-1, Math.min(1, score));

  // Marker position: 0% = -1.0, 50% = 0.0, 100% = +1.0
  const markerLeft = ((clamped + 1) / 2) * 100;

  // Fill extends from center (50%) toward the score
  const fillLeft = Math.min(50, markerLeft);
  const fillWidth = Math.abs(markerLeft - 50);

  const formattedScore =
    clamped === 0
      ? "0.00"
      : (clamped > 0 ? "+" : "") + clamped.toFixed(2);

  return (
    <div className="w-full overflow-hidden">
      {/* Score value above the bar, positioned at marker */}
      <div className="relative mb-1" style={{ height: 14 }}>
        <span
          className="absolute text-[10px] font-mono tabular-nums -translate-x-1/2"
          style={{
            left: `${markerLeft}%`,
            color: 'var(--text-secondary)',
          }}
        >
          {formattedScore}
        </span>
      </div>

      {/* Track */}
      <div
        className="relative w-full rounded-[3px] overflow-visible"
        style={{
          height,
          backgroundColor: 'var(--border-secondary)',
        }}
      >
        {/* Fill from center toward score */}
        <div
          className="absolute inset-y-0 rounded-[3px]"
          style={{
            left: `${fillLeft}%`,
            width: `${fillWidth}%`,
            backgroundColor: fillColor,
            opacity: 0.6,
          }}
        />

        {/* Center zero mark */}
        <div
          className="absolute left-1/2 -translate-x-px"
          style={{
            top: -3,
            width: 0.5,
            height: height + 6,
            backgroundColor: 'var(--border-secondary)',
          }}
          aria-hidden="true"
        />

        {/* Dot marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full"
          style={{
            left: `${markerLeft}%`,
            width: 12,
            height: 12,
            border: dotBorder,
            backgroundColor: 'var(--surface-1)',
          }}
          aria-hidden="true"
        />
      </div>

      {/* Pole labels */}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs text-text-tertiary">
          {poleALabel}
        </span>
        <span className="text-xs text-text-tertiary text-right">
          {poleBLabel}
        </span>
      </div>
    </div>
  );
}
