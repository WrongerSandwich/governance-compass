"use client";

interface AxisScore {
  axisId: number;
  name: string;
  poleALabel: string;
  poleBLabel: string;
  domain: string;
  finalScore: number;
  confidence: string;
}

interface RadarChartProps {
  axisScores: AxisScore[];
  archetypePrototype?: number[];
  showArchetypeOverlay?: boolean;
}

const TOTAL_AXES = 12;
const SIZE = 500;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_RADIUS = 170;
const LABEL_PADDING = 28;

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

/** Generate 12-sided polygon points at a uniform radius */
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

export function RadarChart({
  axisScores,
  archetypePrototype,
  showArchetypeOverlay = false,
}: RadarChartProps) {
  const sorted = [...axisScores].sort((a, b) => a.axisId - b.axisId);

  const paddedScores: AxisScore[] = Array.from({ length: TOTAL_AXES }, (_, i) => {
    const found = sorted.find((s) => s.axisId === i + 1);
    return (
      found ?? {
        axisId: i + 1,
        name: `Axis ${i + 1}`,
        poleALabel: "",
        poleBLabel: "",
        domain: "",
        finalScore: 0,
        confidence: "low",
      }
    );
  });

  const userScoreValues = paddedScores.map((s) => s.finalScore);
  const userPoints = scorePolygonPoints(userScoreValues);

  const archetypePoints =
    showArchetypeOverlay && archetypePrototype && archetypePrototype.length === TOTAL_AXES
      ? scorePolygonPoints(archetypePrototype)
      : null;

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-xl"
        aria-label="Political profile radar chart"
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

        {/* 6 spoke lines (connecting opposing axis pairs) */}
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

        {/* Archetype overlay polygon */}
        {archetypePoints && (
          <polygon
            points={archetypePoints}
            fill="none"
            style={{ stroke: 'var(--info)' }}
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.45}
          />
        )}

        {/* User profile polygon */}
        <polygon
          points={userPoints}
          style={{ fill: 'var(--stone-600)', stroke: 'var(--stone-600)' }}
          fillOpacity={0.12}
          strokeOpacity={0.55}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* Vertex dots */}
        {paddedScores.map((axis, i) => {
          const angle = spokeAngle(i);
          const r = scoreToRadius(axis.finalScore);
          const [x, y] = polarToCart(angle, r);
          return (
            <circle
              key={axis.axisId}
              cx={x}
              cy={y}
              r={3}
              style={{ fill: 'var(--stone-600)' }}
            />
          );
        })}

        {/* Pole B perimeter labels */}
        {paddedScores.map((axis, i) => {
          const angle = spokeAngle(i);
          const labelR = MAX_RADIUS + LABEL_PADDING;
          const [x, y] = polarToCart(angle, labelR);

          let anchor: "start" | "middle" | "end" = "middle";
          const normAngle = ((angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI));
          if (normAngle < Math.PI * 0.1 || normAngle > Math.PI * 1.9) anchor = "middle";
          else if (normAngle < Math.PI * 0.9) anchor = "start";
          else if (normAngle < Math.PI * 1.1) anchor = "middle";
          else anchor = "end";

          const label = axis.poleBLabel || axis.name;
          const parts = label.split(/[/]/).map((p) => p.trim());

          return (
            <text
              key={axis.axisId}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="central"
              fontSize={10}
              style={{ fill: 'var(--text-tertiary)' }}
            >
              {parts.map((part, pi) => (
                <tspan
                  key={pi}
                  x={x}
                  dy={pi === 0 ? (parts.length > 1 ? "-0.5em" : "0") : "1.1em"}
                >
                  {part}
                </tspan>
              ))}
            </text>
          );
        })}

        {/* Center dot */}
        <circle cx={CX} cy={CY} r={3} style={{ fill: 'var(--border-primary)' }} />
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-2">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--stone-600)' }}
          />
          Your profile
        </div>
        {showArchetypeOverlay && archetypePrototype && (
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--info)' }}
            />
            Archetype prototype
          </div>
        )}
      </div>
    </div>
  );
}
