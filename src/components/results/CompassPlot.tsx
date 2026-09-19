"use client";

import { archetypes } from "@/data/archetypes";
import { formatScore } from "@/lib/format-score";
import { SD_ECONOMIC_WEIGHTS, SD_CULTURAL_WEIGHTS } from "@/lib/scoring-types";

interface CompassPlotProps {
  economic: number; // -1.0 to +1.0
  cultural: number; // -1.0 to +1.0
  primaryArchetypeId?: string;
}

const SIZE = 400;
// 300px plot square, per mock 7a, inside the existing 400-unit viewBox. The
// margin holds nothing — the pole labels moved inside the square — but it
// keeps the square off the container edge.
const PADDING = 50;
const INNER = SIZE - PADDING * 2;

// The grid divides the square into six columns. At PADDING = 50 that step is
// 50 units, which equals PADDING and puts a line under the centre crosshair —
// both coincidences of this particular padding, not relationships. Expressing
// the step as a fraction of INNER keeps the grid square and centred if PADDING
// ever moves; a literal 50 would drift off its own frame.
const GRID_STEP = INNER / 6;
const GRID_LINES = [1, 2, 3, 4, 5];

// 12px ink dot at the 400px render width.
const DOT_R = 6;
// Pole labels sit inside the square now, so they must clear a dot parked hard
// against the frame: one dot radius plus 2 units of breath.
const POLE_INSET = DOT_R + 2;
const POLE_FONT = 11;
// Baseline push for the TOP pole only: the other three centre on an axis or
// sit above the bottom edge, while this one hangs off the frame's top edge and
// would otherwise render its cap height outside the square. Hand-tuned by eye
// against POLE_FONT = 11 and NOT derived from it -- move POLE_FONT and this
// needs re-checking rather than recomputing itself.
const POLE_CAP = 6;
// The leader line has to start clear of the dot it points away from, so both
// offsets exceed DOT_R.
const LEADER_START = DOT_R + 10;
const LEADER_END = DOT_R + 22;
// And the readout sits just past the leader's far end.
const READOUT_GAP = 4;
// Nudge the readout clear of the horizontal axis when the dot sits on it —
// see the collision note at the call site.
const READOUT_NUDGE = 12;

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

// Precompute archetype compass positions from their 12-axis prototypes
const ARCHETYPE_POSITIONS = archetypes.map((a) => {
  let economic = 0;
  for (const [axisId, weight] of Object.entries(SD_ECONOMIC_WEIGHTS)) {
    economic += weight * (a.prototype[Number(axisId) - 1] ?? 0);
  }
  let cultural = 0;
  for (const [axisId, weight] of Object.entries(SD_CULTURAL_WEIGHTS)) {
    cultural += weight * (a.prototype[Number(axisId) - 1] ?? 0);
  }
  const words = a.name.replace(/^The\s+/, "").split(/\s+/);
  const shortLabel = words[words.length - 1];
  return { id: a.id, name: a.name, shortLabel, economic, cultural };
});

/**
 * The pole a score leans toward, for the SVG's accessible label. An exact zero
 * leans to neither: a fully-skipped assessment scores exactly 0 on both axes,
 * so glossing 0 as "Collective" would tell a respondent who answered nothing
 * that they lean collective-progressive.
 */
function poleGloss(v: number, negative: string, positive: string): string {
  if (v === 0) return "centre";
  return v > 0 ? positive : negative;
}

export function CompassPlot({ economic, cultural, primaryArchetypeId }: CompassPlotProps) {
  const dotX = toX(economic);
  const dotY = toY(cultural);

  // The shared formatter, not a fifth inlined copy. It signs on `> 0`, so an
  // exact zero reads "0.00" here — matching the axis table beside this plot,
  // and sparing a screen reader "plus zero point zero zero". Its ±1 clamp is
  // a no-op: computeSuperDimensions bounds both outputs to [-1, +1].
  const economicLabel = formatScore(economic);
  const culturalLabel = formatScore(cultural);

  const flipLeader = dotX > CENTER_X;
  const leaderEndX = flipLeader ? dotX - LEADER_END : dotX + LEADER_END;
  const labelX = flipLeader ? leaderEndX - READOUT_GAP : leaderEndX + READOUT_GAP;
  const labelAnchor = flipLeader ? "end" as const : "start" as const;

  // Moving the pole labels inside the square opened a collision the
  // outside-the-square labels could not have: the readout renders on the dot's
  // own baseline, so a dot sitting on the horizontal axis pushes it straight
  // through "Collective" (economic below about -0.72) or "Market" (above about
  // +0.89). Both are reachable by a consistent respondent. Nudge the readout
  // off the axis, and always AWAY from centre, so the nudge can never carry it
  // onto the label it is avoiding.
  const readoutY =
    Math.abs(dotY - CENTER_Y) < READOUT_NUDGE
      ? dotY + (dotY <= CENTER_Y ? -READOUT_NUDGE : READOUT_NUDGE)
      : dotY;

  return (
    /* `w-full max-w-[400px]` on the WRAPPER, not only on the svg. The wrapper
       is a flex item of `${PANEL} … flex justify-center`, so without a width
       of its own it shrink-wraps its child; the svg's `w-full` then resolved
       against a shrink-to-fit box and settled on the 300px default width of a
       replaced element. The plot square rendered at 225 CSS px rather than the
       300 the mock and the guard both name — measured in Chromium on the
       production build, which is the only place it shows. */
    <div className="flex w-full max-w-[400px] flex-col items-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full"
        aria-label={`Political compass plot. Economic: ${economicLabel} (${poleGloss(economic, "Collective", "Market")}), Cultural: ${culturalLabel} (${poleGloss(cultural, "Progressive", "Traditional")})`}
        role="img"
      >
        {/* Plot background */}
        <rect
          data-compass-frame
          x={PADDING}
          y={PADDING}
          width={INNER}
          height={INNER}
          style={{ fill: 'var(--surface-1)', stroke: 'var(--border-secondary)' }}
          strokeWidth={1}
        />

        {/* Grid. --rule-hairline is the barely-there pair (Stone 50 / Stone
            900); a `stroke-stone-50` literal would read as near-white hairlines
            on a dark ground. */}
        {GRID_LINES.map((k) => (
          <g key={k}>
            <line
              data-compass-grid
              x1={PADDING + k * GRID_STEP} y1={PADDING} x2={PADDING + k * GRID_STEP} y2={SIZE - PADDING}
              style={{ stroke: 'var(--rule-hairline)' }}
              strokeWidth={1}
            />
            <line
              data-compass-grid
              x1={PADDING} y1={PADDING + k * GRID_STEP} x2={SIZE - PADDING} y2={PADDING + k * GRID_STEP}
              style={{ stroke: 'var(--rule-hairline)' }}
              strokeWidth={1}
            />
          </g>
        ))}

        {/* Contour lines — CLAUDE.md's one protected decorative exception. */}
        {CONTOUR_PATHS.map((d, i) => (
          <path
            key={i}
            data-compass-contour
            d={d}
            fill="none"
            style={{ stroke: 'var(--stone-500)', opacity: 'var(--contour-opacity)' }}
            strokeWidth={0.6}
          />
        ))}

        {/* Crosshairs */}
        <line
          x1={CENTER_X} y1={PADDING} x2={CENTER_X} y2={SIZE - PADDING}
          style={{ stroke: 'var(--border-secondary)' }}
          strokeWidth={1}
        />
        <line
          x1={PADDING} y1={CENTER_Y} x2={SIZE - PADDING} y2={CENTER_Y}
          style={{ stroke: 'var(--border-secondary)' }}
          strokeWidth={1}
        />

        {/* Pole labels, inside the square at a POLE_INSET gutter. Traditional
            is TOP and Progressive is BOTTOM because toY maps cultural +1 to the
            top and SD_CULTURAL_WEIGHTS is what defines +1 — mock 7a's Open /
            Traditional pair would invert the meaning of every plotted point
            without touching the engine. See D12. */}
        <text data-compass-pole x={PADDING + POLE_INSET} y={CENTER_Y} fontSize={POLE_FONT} letterSpacing="0.02em" dominantBaseline="middle" style={{ fill: 'var(--text-label)', fontFamily: 'var(--font-mono)' }}>
          Collective
        </text>
        <text data-compass-pole x={SIZE - PADDING - POLE_INSET} y={CENTER_Y} fontSize={POLE_FONT} letterSpacing="0.02em" textAnchor="end" dominantBaseline="middle" style={{ fill: 'var(--text-label)', fontFamily: 'var(--font-mono)' }}>
          Market
        </text>
        <text data-compass-pole x={CENTER_X} y={PADDING + POLE_INSET + POLE_CAP} fontSize={POLE_FONT} letterSpacing="0.02em" textAnchor="middle" style={{ fill: 'var(--text-label)', fontFamily: 'var(--font-mono)' }}>
          Traditional
        </text>
        <text data-compass-pole x={CENTER_X} y={SIZE - PADDING - POLE_INSET} fontSize={POLE_FONT} letterSpacing="0.02em" textAnchor="middle" style={{ fill: 'var(--text-label)', fontFamily: 'var(--font-mono)' }}>
          Progressive
        </text>

        {/* Archetype reference markers — with collision suppression */}
        {(() => {
          const sorted = [...ARCHETYPE_POSITIONS].sort((a, b) => {
            if (a.id === primaryArchetypeId) return -1;
            if (b.id === primaryArchetypeId) return 1;
            return 0;
          });

          const placed: { x: number; y: number }[] = [];
          const MIN_DIST = 18;

          return sorted.map((a) => {
            const ax = toX(a.economic);
            const ay = toY(a.cultural);
            const isPrimary = a.id === primaryArchetypeId;
            const labelY = ay - (isPrimary ? 6 : 5);

            const tooClose = placed.some(
              (p) => Math.hypot(ax - p.x, labelY - p.y) < MIN_DIST
            );
            const showLabel = isPrimary || !tooClose;
            if (showLabel) placed.push({ x: ax, y: labelY });

            return (
              <g key={a.id} data-compass-archetype opacity={isPrimary ? 0.75 : 0.4}>
                <circle
                  cx={ax}
                  cy={ay}
                  r={isPrimary ? 3 : 2}
                  style={{ fill: 'var(--text-secondary)' }}
                />
                {showLabel && (
                  <text
                    x={ax}
                    y={labelY}
                    textAnchor="middle"
                    fontSize={isPrimary ? 7.5 : 6.5}
                    style={{ fill: 'var(--text-label)', fontFamily: 'var(--font-mono)' }}
                  >
                    {a.shortLabel}
                  </text>
                )}
              </g>
            );
          });
        })()}

        {/* 12px ink dot. --text-primary, not var(--stone-900): Stone 900 ink
            on a Stone 900 ground is invisible, and this token is already the
            ink pair that inverts. */}
        <circle data-compass-dot cx={dotX} cy={dotY} r={DOT_R} style={{ fill: 'var(--text-primary)' }} />

        {/* Leader line */}
        <line
          data-compass-leader
          x1={flipLeader ? dotX - LEADER_START : dotX + LEADER_START}
          y1={dotY}
          x2={leaderEndX}
          y2={dotY}
          style={{ stroke: 'var(--text-label)' }}
          strokeWidth={0.6}
        />

        {/* Coordinate label */}
        <text
          data-compass-readout
          x={labelX}
          y={readoutY}
          textAnchor={labelAnchor}
          fontSize={POLE_FONT}
          letterSpacing="0.02em"
          style={{ fill: 'var(--text-label)', fontFamily: 'var(--font-mono)' }}
          dominantBaseline="middle"
        >
          {economicLabel}, {culturalLabel}
        </text>
      </svg>
    </div>
  );
}
