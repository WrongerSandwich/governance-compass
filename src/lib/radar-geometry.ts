/**
 * Shared polar geometry for the two radar charts on the results page:
 * `RadarChart` (the full 12-axis chart) and `MiniRadar` (inside
 * `ArchetypeCard`). Both previously inlined their own copies — `MiniRadar`
 * re-inlined `spokeAngle` twice, `polarToCart` twice and `scoreToRadius`
 * once — so a fix to one chart's mapping silently missed the other.
 *
 * Every function here takes its dimensions as arguments rather than closing
 * over module constants: the two charts differ only in radius and centre, and
 * a helper that closed over one chart's constants is exactly how the
 * duplication started.
 */

import type { AxisConfidence } from "./scoring-types";

/** The governance compass has twelve axes. Both charts draw all twelve. */
export const TOTAL_AXES = 12;

/**
 * The subset of an axis score that a radar needs. `ResultsView` passes a
 * wider `AxisDisplayData`, which satisfies this structurally.
 *
 * No `domain`: both charts derive a spoke's domain from its `axisId` (see
 * `getDomainForAxis`), which is also the only spelling that cannot disagree
 * with the id — a caller is free to pass a domain string that names a
 * different group, or no string at all.
 */
export interface RadarAxisScore {
  axisId: number;
  name: string;
  poleALabel: string;
  poleBLabel: string;
  finalScore: number;
  /** The engine's union, matching its sibling on `AxisDisplayData`.
   *  `RadarChart` prints this straight into its sr-only table, so a drifted
   *  value is announced verbatim to a screen reader and to nobody else. */
  confidence: AxisConfidence;
}

/**
 * Angle of spoke `index` of `total`, in radians, with spoke 0 pointing
 * straight up (-90 degrees) and the rest running clockwise.
 *
 * The divisor is `total`, not `total - 1`: the spokes close a circle, so the
 * last one must not land back on the first. At index 0 the divisor cancels,
 * which is why an off-by-one here is invisible unless a test reads a vertex
 * other than the first.
 */
export function spokeAngle(index: number, total: number): number {
  return (index / total) * 2 * Math.PI - Math.PI / 2;
}

/**
 * Maps a -1..1 axis score onto a 0..`maxRadius` distance from the centre.
 * Directional: the centre is the strongest Pole A (-1) and the perimeter the
 * strongest Pole B (+1), so -1 -> 0, 0 -> maxRadius / 2, +1 -> maxRadius.
 */
export function scoreToRadius(score: number, maxRadius: number): number {
  return ((score + 1) / 2) * maxRadius;
}

/** Polar to cartesian about (`cx`, `cy`). */
export function polarToCart(
  angle: number,
  radius: number,
  cx: number,
  cy: number,
): [number, number] {
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

/**
 * The `points` attribute of a regular `total`-sided ring at an **absolute**
 * radius about (`cx`, `cy`).
 *
 * Absolute, not a fraction of some maximum. `RadarChart` previously took a
 * fraction (`ringPolygonPoints(0.5)`) while `ArchetypeCard` took an absolute
 * radius (`ringPoints(MINI_R * 0.5)`); unifying the two by name without
 * converting the call sites rescales every ring in one of the charts, and
 * both still render plausibly, so nothing crashes to catch it.
 */
export function ringPoints(radius: number, total: number, cx: number, cy: number): string {
  return Array.from({ length: total }, (_, i) => {
    const [x, y] = polarToCart(spokeAngle(i, total), radius, cx, cy);
    return `${x},${y}`;
  }).join(" ");
}

/**
 * Normalises an axis list to exactly `total` entries in axis-id order, padding
 * any missing axis with a neutral (0) score.
 *
 * A radar's vertex `i` means "axis i + 1" — it is positional. Callers do not
 * all agree on order: `src/app/results/page.tsx` maps in scoring-pipeline
 * order while `src/app/results/[profileId]/page.tsx` orders by `axis.order`.
 * Those agree only because `order === id` for all twelve rows of
 * `src/data/axes.ts` today. If that ever stops holding, an un-normalised list
 * silently draws the right shape against the wrong spokes.
 *
 * Indexing by `axisId` both orders and pads in one pass, so this deliberately
 * does not also call `.sort()` first: on a list reconstructed by id lookup a
 * prior sort is provably a no-op. Named for what it does rather than how —
 * there is no sort in here to drop.
 *
 * Two consequences of the id lookup, neither of which any caller relies on
 * today: a duplicated `axisId` keeps the first match in input order, and an
 * id outside 1..`total` (0, 13, a negative) is silently dropped, since
 * nothing ever looks it up.
 */
export function normaliseByAxisId(
  axisScores: RadarAxisScore[],
  total: number = TOTAL_AXES,
): RadarAxisScore[] {
  return Array.from({ length: total }, (_, i) => {
    const axisId = i + 1;
    return (
      axisScores.find((score) => score.axisId === axisId) ?? {
        axisId,
        name: `Axis ${axisId}`,
        poleALabel: "",
        poleBLabel: "",
        finalScore: 0,
        confidence: "low",
      }
    );
  });
}
