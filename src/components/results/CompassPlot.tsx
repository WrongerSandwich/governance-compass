"use client";

interface CompassPlotProps {
  economic: number; // -1.0 to +1.0
  cultural: number; // -1.0 to +1.0
}

const SIZE = 400;
const PADDING = 60;
const INNER = SIZE - PADDING * 2;

/** Map a value in [-1, 1] to SVG x coordinate */
function toX(v: number): number {
  return PADDING + ((v + 1) / 2) * INNER;
}

/** Map a value in [-1, 1] to SVG y coordinate (cultural +1 → top → small y) */
function toY(v: number): number {
  return PADDING + ((1 - v) / 2) * INNER;
}

const CENTER_X = toX(0);
const CENTER_Y = toY(0);

export function CompassPlot({ economic, cultural }: CompassPlotProps) {
  const dotX = toX(economic);
  const dotY = toY(cultural);

  const economicLabel = economic >= 0 ? `+${economic.toFixed(2)}` : economic.toFixed(2);
  const culturalLabel = cultural >= 0 ? `+${cultural.toFixed(2)}` : cultural.toFixed(2);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-sm"
        aria-label={`Political compass plot. Economic: ${economicLabel}, Cultural: ${culturalLabel}`}
        role="img"
      >
        {/* Quadrant background fills */}
        {/* Top-left: Communitarian */}
        <rect
          x={PADDING}
          y={PADDING}
          width={INNER / 2}
          height={INNER / 2}
          fill="#f1f5f9"
          opacity={0.5}
        />
        {/* Top-right: Conservative */}
        <rect
          x={CENTER_X}
          y={PADDING}
          width={INNER / 2}
          height={INNER / 2}
          fill="#faf5ff"
          opacity={0.5}
        />
        {/* Bottom-left: Libertarian Left */}
        <rect
          x={PADDING}
          y={CENTER_Y}
          width={INNER / 2}
          height={INNER / 2}
          fill="#f0fdf4"
          opacity={0.5}
        />
        {/* Bottom-right: Liberal */}
        <rect
          x={CENTER_X}
          y={CENTER_Y}
          width={INNER / 2}
          height={INNER / 2}
          fill="#eff6ff"
          opacity={0.5}
        />

        {/* Grid lines at ±0.5 */}
        {[-0.5, 0.5].map((v) => (
          <g key={v}>
            {/* Vertical grid line */}
            <line
              x1={toX(v)}
              y1={PADDING}
              x2={toX(v)}
              y2={SIZE - PADDING}
              stroke="#e2e8f0"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            {/* Horizontal grid line */}
            <line
              x1={PADDING}
              y1={toY(v)}
              x2={SIZE - PADDING}
              y2={toY(v)}
              stroke="#e2e8f0"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          </g>
        ))}

        {/* Outer border */}
        <rect
          x={PADDING}
          y={PADDING}
          width={INNER}
          height={INNER}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={1}
        />

        {/* Crosshair lines at center */}
        <line
          x1={CENTER_X}
          y1={PADDING}
          x2={CENTER_X}
          y2={SIZE - PADDING}
          stroke="#cbd5e1"
          strokeWidth={1.5}
        />
        <line
          x1={PADDING}
          y1={CENTER_Y}
          x2={SIZE - PADDING}
          y2={CENTER_Y}
          stroke="#cbd5e1"
          strokeWidth={1.5}
        />

        {/* Quadrant labels in corners */}
        <text
          x={PADDING + 8}
          y={PADDING + 16}
          fontSize={10}
          fill="#9ca3af"
          fontFamily="inherit"
        >
          Communitarian
        </text>
        <text
          x={SIZE - PADDING - 8}
          y={PADDING + 16}
          fontSize={10}
          fill="#9ca3af"
          fontFamily="inherit"
          textAnchor="end"
        >
          Conservative
        </text>
        <text
          x={PADDING + 8}
          y={SIZE - PADDING - 8}
          fontSize={10}
          fill="#9ca3af"
          fontFamily="inherit"
        >
          Libertarian Left
        </text>
        <text
          x={SIZE - PADDING - 8}
          y={SIZE - PADDING - 8}
          fontSize={10}
          fill="#9ca3af"
          fontFamily="inherit"
          textAnchor="end"
        >
          Liberal
        </text>

        {/* Cardinal axis labels — left */}
        <text
          x={PADDING - 6}
          y={CENTER_Y}
          fontSize={9}
          fill="#64748b"
          fontFamily="inherit"
          textAnchor="end"
          dominantBaseline="middle"
        >
          Collective ·
        </text>
        <text
          x={PADDING - 6}
          y={CENTER_Y + 11}
          fontSize={9}
          fill="#64748b"
          fontFamily="inherit"
          textAnchor="end"
          dominantBaseline="middle"
        >
          Limits-Conscious
        </text>

        {/* Cardinal axis labels — right */}
        <text
          x={SIZE - PADDING + 6}
          y={CENTER_Y}
          fontSize={9}
          fill="#64748b"
          fontFamily="inherit"
          dominantBaseline="middle"
        >
          Market ·
        </text>
        <text
          x={SIZE - PADDING + 6}
          y={CENTER_Y + 11}
          fontSize={9}
          fill="#64748b"
          fontFamily="inherit"
          dominantBaseline="middle"
        >
          Growth-Oriented
        </text>

        {/* Cardinal axis labels — top */}
        <text
          x={CENTER_X}
          y={PADDING - 18}
          fontSize={9}
          fill="#64748b"
          fontFamily="inherit"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          Traditional ·
        </text>
        <text
          x={CENTER_X}
          y={PADDING - 7}
          fontSize={9}
          fill="#64748b"
          fontFamily="inherit"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          Authority-Oriented
        </text>

        {/* Cardinal axis labels — bottom */}
        <text
          x={CENTER_X}
          y={SIZE - PADDING + 8}
          fontSize={9}
          fill="#64748b"
          fontFamily="inherit"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          Progressive ·
        </text>
        <text
          x={CENTER_X}
          y={SIZE - PADDING + 19}
          fontSize={9}
          fill="#64748b"
          fontFamily="inherit"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          Liberty-Oriented
        </text>

        {/* Respondent dot */}
        <circle cx={dotX} cy={dotY} r={7} fill="#4f46e5" />
        {/* Subtle halo */}
        <circle cx={dotX} cy={dotY} r={11} fill="#4f46e5" opacity={0.15} />
      </svg>

      {/* Coordinate readout */}
      <p className="text-sm font-mono text-gray-600">
        Economic: {economicLabel} · Cultural: {culturalLabel}
      </p>

      {/* Framing note */}
      <p className="text-xs text-gray-400 text-center max-w-xs">
        This is a simplified two-dimensional view. See the full radar chart
        below for your complete 12-axis profile.
      </p>
    </div>
  );
}
