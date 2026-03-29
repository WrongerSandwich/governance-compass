"use client";

interface CompassPlotProps {
  economic: number; // -1.0 to +1.0
  cultural: number; // -1.0 to +1.0
}

const SIZE = 400;
const PADDING = 60;
const INNER = SIZE - PADDING * 2;

function toX(v: number): number {
  return PADDING + ((v + 1) / 2) * INNER;
}

function toY(v: number): number {
  return PADDING + ((1 - v) / 2) * INNER;
}

const CENTER_X = toX(0);
const CENTER_Y = toY(0);

// Topographic contour paths — organic curves for cartographic feel
const CONTOUR_PATHS = [
  `M ${PADDING + 10} ${PADDING + INNER * 0.25} Q ${CENTER_X - 40} ${PADDING + INNER * 0.22}, ${SIZE - PADDING - 10} ${PADDING + INNER * 0.28}`,
  `M ${PADDING + 10} ${PADDING + INNER * 0.45} Q ${CENTER_X + 30} ${PADDING + INNER * 0.42}, ${SIZE - PADDING - 10} ${PADDING + INNER * 0.48}`,
  `M ${PADDING + 10} ${PADDING + INNER * 0.62} Q ${CENTER_X - 20} ${PADDING + INNER * 0.58}, ${SIZE - PADDING - 10} ${PADDING + INNER * 0.65}`,
  `M ${PADDING + 10} ${PADDING + INNER * 0.80} Q ${CENTER_X + 15} ${PADDING + INNER * 0.78}, ${SIZE - PADDING - 10} ${PADDING + INNER * 0.82}`,
];

export function CompassPlot({ economic, cultural }: CompassPlotProps) {
  const dotX = toX(economic);
  const dotY = toY(cultural);

  const economicLabel = economic >= 0 ? `+${economic.toFixed(2)}` : economic.toFixed(2);
  const culturalLabel = cultural >= 0 ? `+${cultural.toFixed(2)}` : cultural.toFixed(2);

  // Moderate zone rect at 43% inset from edges
  const modInset = INNER * 0.43;
  const modX = PADDING + modInset;
  const modY = PADDING + modInset;
  const modW = INNER - modInset * 2;
  const modH = INNER - modInset * 2;

  // Leader line: flip to left side when dot is in right half to prevent overflow
  const flipLeader = dotX > CENTER_X;
  const leaderEndX = flipLeader ? dotX - 28 : dotX + 28;
  const labelX = flipLeader ? leaderEndX - 4 : leaderEndX + 4;
  const labelAnchor = flipLeader ? "end" as const : "start" as const;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-sm"
        aria-label={`Political compass plot. Economic: ${economicLabel}, Cultural: ${culturalLabel}`}
        role="img"
      >
        {/* White inner rect with 6px radius */}
        <rect
          x={PADDING}
          y={PADDING}
          width={INNER}
          height={INNER}
          rx={6}
          style={{ fill: 'var(--surface-1)' }}
        />

        {/* Quadrant domain tints at 4% opacity — subliminal visual rhyme */}
        <rect x={PADDING} y={PADDING} width={INNER / 2} height={INNER / 2} fill="#6b7d8a" opacity={0.04} />
        <rect x={CENTER_X} y={PADDING} width={INNER / 2} height={INNER / 2} fill="#85735e" opacity={0.04} />
        <rect x={PADDING} y={CENTER_Y} width={INNER / 2} height={INNER / 2} fill="#7a8b6e" opacity={0.04} />
        <rect x={CENTER_X} y={CENTER_Y} width={INNER / 2} height={INNER / 2} fill="#96716b" opacity={0.04} />

        {/* Topographic contour lines — decorative signature */}
        {CONTOUR_PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            style={{ stroke: 'var(--stone-600)', opacity: 'var(--contour-opacity)' }}
            strokeWidth={0.5}
          />
        ))}

        {/* Moderate zone dashed rect */}
        <rect
          x={modX}
          y={modY}
          width={modW}
          height={modH}
          fill="none"
          style={{ stroke: 'var(--border-tertiary)' }}
          strokeWidth={0.5}
          strokeDasharray="3 3"
          opacity={0.3}
        />

        {/* Primary crosshairs */}
        <line
          x1={CENTER_X}
          y1={PADDING}
          x2={CENTER_X}
          y2={SIZE - PADDING}
          style={{ stroke: 'var(--border-tertiary)' }}
          strokeWidth={0.5}
        />
        <line
          x1={PADDING}
          y1={CENTER_Y}
          x2={SIZE - PADDING}
          y2={CENTER_Y}
          style={{ stroke: 'var(--border-tertiary)' }}
          strokeWidth={0.5}
        />

        {/* Quadrant whisper labels — very low opacity */}
        <text
          x={PADDING + 8}
          y={PADDING + 16}
          fontSize={9}
          style={{ fill: 'var(--text-tertiary)' }}
          fontFamily="inherit"
          opacity={0.2}
        >
          Communitarian
        </text>
        <text
          x={SIZE - PADDING - 8}
          y={PADDING + 16}
          fontSize={9}
          style={{ fill: 'var(--text-tertiary)' }}
          fontFamily="inherit"
          textAnchor="end"
          opacity={0.2}
        >
          Conservative
        </text>
        <text
          x={PADDING + 8}
          y={SIZE - PADDING - 8}
          fontSize={9}
          style={{ fill: 'var(--text-tertiary)' }}
          fontFamily="inherit"
          opacity={0.2}
        >
          Libertarian left
        </text>
        <text
          x={SIZE - PADDING - 8}
          y={SIZE - PADDING - 8}
          fontSize={9}
          style={{ fill: 'var(--text-tertiary)' }}
          fontFamily="inherit"
          textAnchor="end"
          opacity={0.2}
        >
          Classical liberal
        </text>

        {/* Cardinal axis labels — 10px uppercase */}
        <text
          x={PADDING - 6}
          y={CENTER_Y}
          fontSize={10}
          style={{ fill: 'var(--text-tertiary)' }}
          fontFamily="inherit"
          textAnchor="end"
          dominantBaseline="middle"
          letterSpacing="0.08em"
        >
          COLLECTIVE
        </text>
        <text
          x={SIZE - PADDING + 6}
          y={CENTER_Y}
          fontSize={10}
          style={{ fill: 'var(--text-tertiary)' }}
          fontFamily="inherit"
          dominantBaseline="middle"
          letterSpacing="0.08em"
        >
          MARKET
        </text>
        <text
          x={CENTER_X}
          y={PADDING - 10}
          fontSize={10}
          style={{ fill: 'var(--text-tertiary)' }}
          fontFamily="inherit"
          textAnchor="middle"
          letterSpacing="0.08em"
        >
          TRADITIONAL
        </text>
        <text
          x={CENTER_X}
          y={SIZE - PADDING + 18}
          fontSize={10}
          style={{ fill: 'var(--text-tertiary)' }}
          fontFamily="inherit"
          textAnchor="middle"
          letterSpacing="0.08em"
        >
          PROGRESSIVE
        </text>

        {/* Concentric pulse rings */}
        <circle
          cx={dotX}
          cy={dotY}
          r={16}
          fill="none"
          style={{ stroke: 'var(--stone-600)' }}
          strokeWidth={0.5}
          opacity={0.2}
        />
        <circle
          cx={dotX}
          cy={dotY}
          r={10}
          fill="none"
          style={{ stroke: 'var(--stone-600)' }}
          strokeWidth={0.5}
          opacity={0.45}
        />

        {/* Respondent dot */}
        <circle
          cx={dotX}
          cy={dotY}
          r={5}
          style={{ fill: 'var(--stone-600)' }}
        />

        {/* Leader line from dot to coordinate label */}
        <line
          x1={flipLeader ? dotX - 16 : dotX + 16}
          y1={dotY}
          x2={leaderEndX}
          y2={dotY}
          style={{ stroke: 'var(--stone-600)' }}
          strokeWidth={0.5}
          opacity={0.35}
        />

        {/* Coordinate label */}
        <text
          x={labelX}
          y={dotY}
          textAnchor={labelAnchor}
          fontSize={10}
          style={{ fill: 'var(--stone-600)', fontFamily: 'var(--font-mono)' }}
          dominantBaseline="middle"
        >
          {economicLabel}, {culturalLabel}
        </text>
      </svg>
    </div>
  );
}
