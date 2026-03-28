"use client";

interface AxisAverage {
  axisId: number;
  axisName: string;
  poleALabel: string;
  poleBLabel: string;
  domain: string;
  average: number; // -1.0 to +1.0
}

interface GroupRadarProps {
  data: AxisAverage[];
}

// Domain groupings matching the results RadarChart
const DOMAINS = [
  { name: "Economic", color: "#6366f1", axes: [1, 2] },
  { name: "Power", color: "#0ea5e9", axes: [3, 4, 5, 6] },
  { name: "Society", color: "#10b981", axes: [7, 8, 9] },
  { name: "World", color: "#f59e0b", axes: [10, 11, 12] },
] as const;

const TOTAL_AXES = 12;
const SIZE = 500;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_RADIUS = 170;
const LABEL_PADDING = 28;

// Rings at score values -1.0 (center), -0.5, 0.0, +0.5, +1.0 (perimeter)
const RING_SCORES = [-1.0, -0.5, 0.0, 0.5, 1.0];

function scoreToRadius(score: number): number {
  // score -1.0 → 0 (center), score +1.0 → MAX_RADIUS
  return ((score + 1) / 2) * MAX_RADIUS;
}

function spokeAngle(index: number): number {
  return (index / TOTAL_AXES) * 2 * Math.PI - Math.PI / 2;
}

function polarToCart(angle: number, radius: number): [number, number] {
  return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)];
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

function domainArcPath(startIdx: number, endIdx: number): string {
  const outerR = MAX_RADIUS + 14;
  const startAngle = spokeAngle(startIdx) - Math.PI / TOTAL_AXES;
  const endAngle = spokeAngle(endIdx - 1) + Math.PI / TOTAL_AXES;
  const [x1, y1] = polarToCart(startAngle, outerR);
  const [x2, y2] = polarToCart(endAngle, outerR);
  return `M ${x1} ${y1} A ${outerR} ${outerR} 0 0 1 ${x2} ${y2}`;
}

function getDomainForAxis(axisId: number) {
  return DOMAINS.find((d) => (d.axes as readonly number[]).includes(axisId));
}

export function GroupRadar({ data }: GroupRadarProps) {
  // Pad to 12 axes (score 0 = neutral) so the polygon is always complete
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
  const points = polygonPoints(averageValues);

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-xl"
        aria-label="Group average radar chart"
      >
        <defs>
          <radialGradient id="groupFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.12" />
          </radialGradient>
        </defs>

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
        {padded.map((axis, i) => {
          const angle = spokeAngle(i);
          const [x, y] = polarToCart(angle, MAX_RADIUS);
          return (
            <line
              key={axis.axisId}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              stroke="#cbd5e1"
              strokeWidth={0.8}
            />
          );
        })}

        {/* Domain separator arcs */}
        {DOMAINS.map((domain) => {
          const startIdx = domain.axes[0] - 1;
          const endIdx = domain.axes[domain.axes.length - 1];
          const path = domainArcPath(startIdx, endIdx);
          return (
            <path
              key={domain.name}
              d={path}
              fill="none"
              stroke={domain.color}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.7}
            />
          );
        })}

        {/* Group average polygon */}
        <polygon
          points={points}
          fill="url(#groupFill)"
          stroke="#6366f1"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Pole B perimeter labels */}
        {padded.map((axis, i) => {
          const angle = spokeAngle(i);
          const labelR = MAX_RADIUS + LABEL_PADDING;
          const [x, y] = polarToCart(angle, labelR);
          const domain = getDomainForAxis(axis.axisId);
          const color = domain?.color ?? "#64748b";

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
              fontSize={9}
              fill={color}
              fontWeight={500}
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
        <circle cx={CX} cy={CY} r={3} fill="#94a3b8" />

        {/* Ring score labels */}
        {["-0.5", "0", "+0.5", "+1"].map((label, i) => {
          const scoreVal = [-0.5, 0, 0.5, 1.0][i];
          const r = scoreToRadius(scoreVal);
          return (
            <text
              key={label}
              x={CX + 3}
              y={CY - r + 3}
              fontSize={7.5}
              fill="#94a3b8"
              textAnchor="start"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* Domain legend */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-2">
        {DOMAINS.map((d) => (
          <div
            key={d.name}
            className="flex items-center gap-1.5 text-xs text-gray-500"
          >
            <span
              className="inline-block w-3 h-1.5 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            {d.name}
          </div>
        ))}
      </div>
    </div>
  );
}
