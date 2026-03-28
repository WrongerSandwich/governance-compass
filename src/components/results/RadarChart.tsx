"use client";

interface AxisScore {
  axisId: number;
  name: string;
  poleALabel: string;
  poleBLabel: string;
  domain: string;
  finalScore: number; // -1.0 to +1.0
  confidence: string;
}

interface RadarChartProps {
  axisScores: AxisScore[];
  archetypePrototype?: number[]; // Optional 12-element overlay
  showArchetypeOverlay?: boolean;
}

// Domain groupings (axisId ranges, 1-indexed)
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

// Rings at -1.0 (center point=0), -0.5, 0.0, +0.5, +1.0 (perimeter)
const RING_SCORES = [-1.0, -0.5, 0.0, 0.5, 1.0];

function scoreToRadius(score: number): number {
  // score -1.0 → 0 (center), score +1.0 → MAX_RADIUS
  return ((score + 1) / 2) * MAX_RADIUS;
}

function spokeAngle(index: number): number {
  // Clockwise from top; index 0 = top (−90° in standard math)
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

function polygonPoints(
  scores: number[],
  axisCount: number
): string {
  return scores
    .map((score, i) => {
      const angle = spokeAngle(i);
      const r = scoreToRadius(score);
      const [x, y] = polarToCart(angle, r);
      return `${x},${y}`;
    })
    .join(" ");
}

// Build a domain arc path between two spoke indices (exclusive end)
function domainArcPath(startIdx: number, endIdx: number): string {
  const outerR = MAX_RADIUS + 14;
  const startAngle = spokeAngle(startIdx) - Math.PI / TOTAL_AXES;
  const endAngle = spokeAngle(endIdx - 1) + Math.PI / TOTAL_AXES;

  const [x1, y1] = polarToCart(startAngle, outerR);
  const [x2, y2] = polarToCart(endAngle, outerR);

  // Arc sweep: always short arc clockwise
  return `M ${x1} ${y1} A ${outerR} ${outerR} 0 0 1 ${x2} ${y2}`;
}

function getDomainForAxis(axisId: number) {
  return DOMAINS.find((d) => (d.axes as readonly number[]).includes(axisId));
}

export function RadarChart({
  axisScores,
  archetypePrototype,
  showArchetypeOverlay = false,
}: RadarChartProps) {
  // Sort axes by axisId (1–12) to ensure correct spoke placement
  const sorted = [...axisScores].sort((a, b) => a.axisId - b.axisId);

  // Pad to 12 if fewer axes provided (score 0 = neutral)
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
  const userPoints = polygonPoints(userScoreValues, TOTAL_AXES);

  const archetypePoints =
    showArchetypeOverlay && archetypePrototype && archetypePrototype.length === TOTAL_AXES
      ? polygonPoints(archetypePrototype, TOTAL_AXES)
      : null;

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-xl"
        aria-label="Political profile radar chart"
      >
        <defs>
          <radialGradient id="userFill" cx="50%" cy="50%" r="50%">
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
        {paddedScores.map((axis, i) => {
          const angle = spokeAngle(i);
          const [x, y] = polarToCart(angle, MAX_RADIUS);
          const isLowConfidence =
            axis.confidence === "low" || axis.confidence === "conflicted";
          return (
            <line
              key={axis.axisId}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              stroke="#cbd5e1"
              strokeWidth={0.8}
              strokeDasharray={isLowConfidence ? "4 3" : undefined}
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

        {/* Archetype overlay polygon */}
        {archetypePoints && (
          <polygon
            points={archetypePoints}
            fill="none"
            stroke="#a855f7"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            opacity={0.8}
          />
        )}

        {/* User profile polygon */}
        <polygon
          points={userPoints}
          fill="url(#userFill)"
          stroke="#6366f1"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Pole B perimeter labels */}
        {paddedScores.map((axis, i) => {
          const angle = spokeAngle(i);
          const labelR = MAX_RADIUS + LABEL_PADDING;
          const [x, y] = polarToCart(angle, labelR);
          const domain = getDomainForAxis(axis.axisId);
          const color = domain?.color ?? "#64748b";

          // Anchor text based on angular position
          let anchor: "start" | "middle" | "end" = "middle";
          const normAngle = ((angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI));
          if (normAngle < Math.PI * 0.1 || normAngle > Math.PI * 1.9) anchor = "middle";
          else if (normAngle < Math.PI * 0.9) anchor = "start";
          else if (normAngle < Math.PI * 1.1) anchor = "middle";
          else anchor = "end";

          // Word-wrap: split on "/" or "↔" or long strings at space
          const label = axis.poleBLabel || axis.name;
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

        {/* Ring labels (scores) */}
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
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span
              className="inline-block w-3 h-1.5 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            {d.name}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="inline-block w-3 h-px border-t border-dashed border-gray-400" />
          Low confidence
        </div>
        {showArchetypeOverlay && archetypePrototype && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="inline-block w-3 h-px border-t-2 border-dashed border-purple-500" />
            Archetype
          </div>
        )}
      </div>
    </div>
  );
}
