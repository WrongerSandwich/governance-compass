"use client";

import { DOMAIN_COLORS, getDomainColor600, type DomainKey } from "@/lib/design-tokens";

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
}

const TOTAL_AXES = 12;
const SIZE = 540;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_RADIUS = 170;
const LABEL_PADDING = 38;

const RING_FRACTIONS = [0.33, 0.5, 0.67, 1.0];

// Domain segments in clockwise order, with start/end axis indices (0-based)
const DOMAIN_SEGMENTS: { key: DomainKey; startIdx: number; endIdx: number }[] = [
  { key: "economic", startIdx: 0, endIdx: 1 },
  { key: "power", startIdx: 2, endIdx: 5 },
  { key: "society", startIdx: 6, endIdx: 8 },
  { key: "world", startIdx: 9, endIdx: 11 },
];

function scoreToRadius(score: number): number {
  // Directional: center = strongest Pole A (-1), perimeter = strongest Pole B (+1)
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
    const [x, y] = polarToCart(spokeAngle(i), r);
    return `${x},${y}`;
  }).join(" ");
}

/** Build an SVG path segment from one vertex to the next for a domain stroke */
function buildDomainPath(scores: number[], startIdx: number, endIdx: number): string {
  // Include one vertex before and after for continuous coverage at boundaries
  const first = startIdx === 0 ? TOTAL_AXES - 1 : startIdx - 1;
  const last = (endIdx + 1) % TOTAL_AXES;

  const points: [number, number][] = [];

  // Bridge from previous domain's last vertex
  points.push(polarToCart(spokeAngle(first), scoreToRadius(scores[first])));

  // This domain's vertices
  for (let i = startIdx; i <= endIdx; i++) {
    points.push(polarToCart(spokeAngle(i), scoreToRadius(scores[i])));
  }

  // Bridge to next domain's first vertex
  points.push(polarToCart(spokeAngle(last), scoreToRadius(scores[last])));

  return "M " + points.map(([x, y]) => `${x},${y}`).join(" L ");
}

export function RadarChart({
  axisScores,
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
            style={{ stroke: frac === 0.5 ? 'var(--stone-600)' : 'var(--border-tertiary)' }}
            strokeWidth={frac === 0.5 ? 0.7 : 0.5}
            strokeDasharray={frac === 0.5 ? "3 3" : undefined}
            opacity={frac === 0.5 ? 0.35 : 0.4}
          />
        ))}

        {/* 6 spoke lines (connecting opposing axis pairs) */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const [x1, y1] = polarToCart(spokeAngle(i), MAX_RADIUS);
          const [x2, y2] = polarToCart(spokeAngle(i + 6), MAX_RADIUS);
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              style={{ stroke: 'var(--border-tertiary)' }}
              strokeWidth={0.5}
              opacity={0.25}
            />
          );
        })}

        {/* Domain-colored triangle fills (center → vertex[n] → vertex[n+1]) */}
        {userScoreValues.map((_, i) => {
          const next = (i + 1) % TOTAL_AXES;
          const [x1, y1] = polarToCart(spokeAngle(i), scoreToRadius(userScoreValues[i]));
          const [x2, y2] = polarToCart(spokeAngle(next), scoreToRadius(userScoreValues[next]));
          const color = getDomainColor600(i + 1);
          const opacity = i % 2 === 0 ? 0.06 : 0.08;
          return (
            <polygon
              key={`fill-${i}`}
              points={`${CX},${CY} ${x1},${y1} ${x2},${y2}`}
              fill={color}
              opacity={opacity}
            />
          );
        })}

        {/* Domain-colored stroke segments */}
        {DOMAIN_SEGMENTS.map((seg) => (
          <path
            key={seg.key}
            d={buildDomainPath(userScoreValues, seg.startIdx, seg.endIdx)}
            fill="none"
            stroke={DOMAIN_COLORS[seg.key][600]}
            strokeWidth={1.8}
            strokeOpacity={0.55}
            strokeLinejoin="round"
          />
        ))}

        {/* Domain-colored vertex dots */}
        {paddedScores.map((axis, i) => {
          const [x, y] = polarToCart(spokeAngle(i), scoreToRadius(axis.finalScore));
          return (
            <circle
              key={axis.axisId}
              cx={x}
              cy={y}
              r={3.5}
              fill={getDomainColor600(axis.axisId)}
            />
          );
        })}

        {/* Domain-colored perimeter labels */}
        {paddedScores.map((axis, i) => {
          const angle = spokeAngle(i);
          const [x, y] = polarToCart(angle, MAX_RADIUS + LABEL_PADDING);

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
              fill={getDomainColor600(axis.axisId)}
              opacity={0.8}
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
        {(["economic", "power", "society", "world"] as DomainKey[]).map((key) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: DOMAIN_COLORS[key][600] }}
            />
            {DOMAIN_COLORS[key].name}
          </div>
        ))}
      </div>
    </div>
  );
}
