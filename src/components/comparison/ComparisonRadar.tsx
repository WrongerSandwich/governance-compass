"use client";

interface AxisScoreEntry {
  axisId: number;
  name: string;
  finalScore: number;
}

interface ComparisonRadarProps {
  axisScoresA: AxisScoreEntry[];
  axisScoresB: AxisScoreEntry[];
  labelA: string;
  labelB: string;
}

const TOTAL_AXES = 12;
const SIZE = 500;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_RADIUS = 170;
const RING_FRACTIONS = [0.33, 0.67, 1.0];

function scoreToRadius(score: number): number {
  return ((score + 1) / 2) * MAX_RADIUS;
}

function spokeAngle(index: number): number {
  return (index / TOTAL_AXES) * 2 * Math.PI - Math.PI / 2;
}

function polarToCart(
  angle: number,
  radius: number,
  cx = CX,
  cy = CY
): [number, number] {
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

function ringPolygonPoints(radiusFraction: number): string {
  const r = MAX_RADIUS * radiusFraction;
  return Array.from({ length: TOTAL_AXES }, (_, i) => {
    const angle = spokeAngle(i);
    const [x, y] = polarToCart(angle, r);
    return `${x},${y}`;
  }).join(" ");
}

function scorePolygonPoints(scores: number[]): string {
  return scores
    .map((score, i) => {
      const angle = spokeAngle(i);
      const r = scoreToRadius(score);
      const [x, y] = polarToCart(angle, r);
      return `${x},${y}`;
    })
    .join(" ");
}

function buildPaddedScores(axisScores: AxisScoreEntry[]): number[] {
  return Array.from({ length: TOTAL_AXES }, (_, i) => {
    const found = axisScores.find((s) => s.axisId === i + 1);
    return found?.finalScore ?? 0;
  });
}

export function ComparisonRadar({
  axisScoresA,
  axisScoresB,
  labelA,
  labelB,
}: ComparisonRadarProps) {
  const allAxes = axisScoresA.length > 0 ? axisScoresA : axisScoresB;
  const paddedNames = Array.from({ length: TOTAL_AXES }, (_, i) => {
    const found = allAxes.find((s) => s.axisId === i + 1);
    return found?.name ?? `Axis ${i + 1}`;
  });

  const scoresA = buildPaddedScores(axisScoresA);
  const scoresB = buildPaddedScores(axisScoresB);
  const pointsA = scorePolygonPoints(scoresA);
  const pointsB = scorePolygonPoints(scoresB);

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-xl"
        aria-label="Political profile comparison radar chart"
      >
        {/* Concentric 12-sided polygon rings */}
        {RING_FRACTIONS.map((frac) => (
          <polygon
            key={frac}
            points={ringPolygonPoints(frac)}
            fill="none"
            style={{ stroke: 'var(--border-tertiary)' }}
            strokeWidth={frac === 0.67 ? 0.6 : 0.5}
            opacity={frac === 0.67 ? 0.5 : 0.4}
          />
        ))}

        {/* 6 spoke lines */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle1 = spokeAngle(i);
          const angle2 = spokeAngle(i + 6);
          const [x1, y1] = polarToCart(angle1, MAX_RADIUS);
          const [x2, y2] = polarToCart(angle2, MAX_RADIUS);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              style={{ stroke: 'var(--border-tertiary)' }}
              strokeWidth={0.5}
              opacity={0.25}
            />
          );
        })}

        {/* Profile B polygon (dashed) */}
        <polygon
          points={pointsB}
          fill="none"
          style={{ stroke: 'var(--stone-600)' }}
          strokeWidth={1.5}
          strokeDasharray="5 3"
          strokeOpacity={0.55}
          strokeLinejoin="round"
        />

        {/* Profile A polygon (solid) */}
        <polygon
          points={pointsA}
          style={{ fill: 'var(--stone-600)', stroke: 'var(--stone-600)' }}
          fillOpacity={0.12}
          strokeOpacity={0.55}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* Axis labels */}
        {paddedNames.map((name, i) => {
          const angle = spokeAngle(i);
          const labelR = MAX_RADIUS + 28;
          const [x, y] = polarToCart(angle, labelR);

          let anchor: "start" | "middle" | "end" = "middle";
          const normAngle =
            ((angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI));
          if (normAngle < Math.PI * 0.1 || normAngle > Math.PI * 1.9)
            anchor = "middle";
          else if (normAngle < Math.PI * 0.9) anchor = "start";
          else if (normAngle < Math.PI * 1.1) anchor = "middle";
          else anchor = "end";

          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="central"
              fontSize={10}
              style={{ fill: 'var(--text-tertiary)' }}
            >
              {name}
            </text>
          );
        })}

        {/* Center dot */}
        <circle cx={CX} cy={CY} r={3} style={{ fill: 'var(--border-primary)' }} />
      </svg>

      {/* Legend — differentiated by stroke style, not color */}
      <div className="flex gap-6 mt-3">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span className="inline-block w-4 h-[1.5px] rounded-full bg-stone-600" />
          {labelA}
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span className="inline-block w-4 h-[1.5px] rounded-full bg-stone-600 opacity-55" style={{ borderTop: '1.5px dashed var(--stone-600)' }} />
          {labelB}
        </div>
      </div>
    </div>
  );
}
