/**
 * Shared polar geometry for the radar charts: `RadarChart` (the full 12-axis
 * chart on the results page), `MiniRadar` (inside `ArchetypeCard`) and
 * `study/Radar`. All previously inlined their own copies — `MiniRadar`
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

/**
 * Decimal places every coordinate this module emits is rounded to.
 *
 * Node and Chromium do not agree to the last bit on `Math.sin`/`Math.cos` —
 * neither is required by ECMA-262 to be correctly rounded, and the two ship
 * different ports of the underlying routine — so the server and the client
 * compute vertices that differ by roughly one ulp. React's hydration pass
 * compares the serialised attribute against the client value, finds
 * `y="123.7231224733878"` against `y={123.72312247338783}`, and logs "some
 * attributes of the server rendered HTML didn't match the client properties.
 * This won't be patched up" — a console error on every load of
 * /results/[profileId], for a disagreement of 3e-14 SVG units.
 *
 * Rounding collapses the two values onto one decimal grid point. `toFixed` and
 * numeric parsing are both exactly specified, so the rounding itself is
 * engine-independent.
 *
 * BUT THIS IS A PROBABILITY REDUCTION, NOT A PROOF, and the number was chosen
 * on that basis. Two doubles an ulp apart can still land either side of a
 * rounding boundary; the chance of that is about (ulp / grid). Measured at the
 * magnitudes these charts actually use:
 *
 *   places  worst rounding error   headroom vs the 5e-7 test tolerance   residual per page render
 *   6       4.6e-7                 1.2x  (too tight)                     4.0e-7
 *   7       3.6e-8                 16x                                   4.0e-5
 *   9       2.4e-10                2400x                                 4.0e-3
 *
 * Nine places was the first choice and was wrong: 2400x of tolerance headroom
 * buys nothing, while the coarser grid leaves roughly one page render in 250
 * still mismatching — not a rare edge case, a weekly one. Seven keeps 16x of
 * headroom, which is ample, and pushes the residual to about one render in
 * 25,000. Six is the first value that does not clear the tolerance and is the
 * floor, not a candidate.
 *
 * The genuinely deterministic fix is a lookup table of the twelve spoke
 * angles' sine and cosine as literal constants, so no trig runs at either end
 * and the remaining arithmetic is IEEE-exact. That is a signature change to
 * general-purpose helpers for a defect this closes to 4e-5, so it is recorded
 * in the plan's backlog rather than taken here.
 *
 * Rounding lives in `polarToCart` rather than at each `points=`/`cx=`/`y=`
 * site because every coordinate on both charts comes through it, and a helper
 * a future call site can forget to apply is the exact duplication this module
 * was extracted to end.
 */
export const COORD_PLACES = 7;

/** Rounds one coordinate to `COORD_PLACES`. See the constant's note. */
export function roundCoord(value: number): number {
  return Number(value.toFixed(COORD_PLACES));
}

/**
 * Polar to cartesian about (`cx`, `cy`), rounded to `COORD_PLACES`.
 *
 * The rounding is not cosmetic — see `COORD_PLACES`. It is what keeps the
 * server's serialised SVG attribute byte-identical to the client's recomputed
 * one.
 *
 * NOT the only trig on the results page, despite what "every coordinate comes
 * through it" would suggest: `RadarChart.tsx:202-203` calls `Math.cos`/
 * `Math.sin` directly to offset the vertex tooltip. That one is safe for a
 * different reason — the tooltip mounts on hover, so it never exists during
 * hydration — but a future coordinate added beside it would not be.
 */
export function polarToCart(
  angle: number,
  radius: number,
  cx: number,
  cy: number,
): [number, number] {
  return [
    roundCoord(cx + radius * Math.cos(angle)),
    roundCoord(cy + radius * Math.sin(angle)),
  ];
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

/**
 * Split a long perimeter label at the space nearest its middle.
 *
 * A radar label sits at the rim and runs outward, so its length is the thing
 * that decides how much margin the viewBox needs; two short lines need
 * roughly half the horizontal room one long one does. Lived in
 * `RadarChart` until `study/Radar` needed the same thing — where the
 * one-line spelling was cutting "International Engagement" down to
 * "al Engagement", painted away by the SVG root's default `overflow:
 * hidden`. Behaviour is unchanged from the copy this replaces.
 */
export function splitLabel(label: string): string[] {
  if (label.includes("/")) return label.split(/[/]/).map((p) => p.trim());
  if (label.length <= 14) return [label];
  const mid = Math.ceil(label.length / 2);
  const spaceAfter = label.indexOf(" ", mid);
  const spaceBefore = label.lastIndexOf(" ", mid);
  const splitAt =
    spaceAfter !== -1 && spaceAfter - mid < mid - spaceBefore ? spaceAfter : spaceBefore;
  return splitAt > 0 ? [label.slice(0, splitAt), label.slice(splitAt + 1)] : [label];
}
