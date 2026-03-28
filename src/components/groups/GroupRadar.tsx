"use client";

interface AxisAverage {
  axisId: number;
  axisName: string;
  poleALabel: string;
  poleBLabel: string;
  domain: string;
  average: number;
}

interface GroupRadarProps {
  data: AxisAverage[];
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

function polarToCart(angle: number, radius: number): [number, number] {
  return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)];
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

export function GroupRadar({ data }: GroupRadarProps) {
  const padded: AxisAverage[] = Array.from({ length: TOTAL_AXES }, (_, i) => {
    const found = data.find((d) => d.axisId === i + 1);
    return (
      found ?? {
        axisId: i + 1,
        axisName: `Axis ${i + 1}`,
        poleALabel: "",
        poleBLabel: "",
        domain: "",
        average: 0,
      }
    );
  });

  const averageValues = padded.map((d) => d.average);
  const points = scorePolygonPoints(averageValues);

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-xl"
        aria-label="Group average radar chart"
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

        {/* Group average polygon */}
        <polygon
          points={points}
          style={{ fill: 'var(--stone-600)', stroke: 'var(--stone-600)' }}
          fillOpacity={0.12}
          strokeOpacity={0.55}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* Vertex dots */}
        {padded.map((axis, i) => {
          const angle = spokeAngle(i);
          const r = scoreToRadius(axis.average);
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
        {padded.map((axis, i) => {
          const angle = spokeAngle(i);
          const labelR = MAX_RADIUS + LABEL_PADDING;
          const [x, y] = polarToCart(angle, labelR);

          const normAngle =
            ((angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI));
          let anchor: "start" | "middle" | "end" = "middle";
          if (normAngle < Math.PI * 0.1 || normAngle > Math.PI * 1.9)
            anchor = "middle";
          else if (normAngle < Math.PI * 0.9) anchor = "start";
          else if (normAngle < Math.PI * 1.1) anchor = "middle";
          else anchor = "end";

          const label = axis.poleBLabel || axis.axisName;
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
      <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-2">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ backgroundColor: 'var(--stone-600)' }}
        />
        Group average
      </div>
    </div>
  );
}
