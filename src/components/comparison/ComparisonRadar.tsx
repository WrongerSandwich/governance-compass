"use client";

interface AxisScoreEntry {
  axisId: number;
  name: string;
  finalScore: number; // -1.0 to +1.0
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
const RING_SCORES = [-1.0, -0.5, 0.0, 0.5, 1.0];

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

function polygonPoints(scores: number[]): string {
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
  // Use axis names from whichever profile has them
  const allAxes = axisScoresA.length > 0 ? axisScoresA : axisScoresB;
  const paddedNames = Array.from({ length: TOTAL_AXES }, (_, i) => {
    const found = allAxes.find((s) => s.axisId === i + 1);
    return found?.name ?? `Axis ${i + 1}`;
  });

  const scoresA = buildPaddedScores(axisScoresA);
  const scoresB = buildPaddedScores(axisScoresB);
  const pointsA = polygonPoints(scoresA);
  const pointsB = polygonPoints(scoresB);

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-xl"
        aria-label="Political profile comparison radar chart"
      >
        {/* Concentric rings */}
        {RING_SCORES.map((score) => {
          const r = scoreToRadius(score);
          if (r <= 0) return null;
          return (
            <circle
              key={score}
              cx={CX}
              cy={CY}
              r={r}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={score === 0 ? 1.5 : 0.8}
              strokeDasharray={score === 0 ? "4 3" : undefined}
            />
          );
        })}

        {/* Spoke lines */}
        {paddedNames.map((name, i) => {
          const angle = spokeAngle(i);
          const [x, y] = polarToCart(angle, MAX_RADIUS);
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              stroke="#cbd5e1"
              strokeWidth={0.8}
            />
          );
        })}

        {/* Profile B polygon (rose) */}
        <polygon
          points={pointsB}
          fill="#f43f5e"
          fillOpacity={0.1}
          stroke="#f43f5e"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Profile A polygon (indigo) */}
        <polygon
          points={pointsA}
          fill="#6366f1"
          fillOpacity={0.1}
          stroke="#6366f1"
          strokeWidth={2}
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
              fontSize={9}
              fill="#64748b"
              fontWeight={500}
            >
              {name}
            </text>
          );
        })}

        {/* Center dot */}
        <circle cx={CX} cy={CY} r={3} fill="#94a3b8" />
      </svg>

      {/* Legend */}
      <div className="flex gap-6 mt-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="inline-block w-4 h-1 rounded-full bg-indigo-500" />
          {labelA}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="inline-block w-4 h-1 rounded-full bg-rose-500" />
          {labelB}
        </div>
      </div>
    </div>
  );
}
