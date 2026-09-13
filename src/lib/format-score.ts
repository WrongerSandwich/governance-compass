/**
 * Formats a -1..1 axis score as a signed two-decimal string: `"+0.50"`,
 * `"-0.26"`, `"0.00"` (zero is not positive, so it carries no sign), or
 * `"N/A"` for an axis with no signal (e.g. a no-budget axis's `bg` component).
 *
 * The single home for what were three verbatim-or-near-verbatim copies
 * (`AxisBreakdownCard`, `ComparisonScoreBar`, and `comparison-radar-data.ts`).
 * The first two agreed on this `> 0` clamped behaviour; `comparison-radar-data.ts`
 * disagreed (`score >= 0`, printing `"+0.00"` for an exact zero) and is
 * deliberately NOT folded in here — an existing test
 * (`tests/unit/comparison-radar-data.test.ts`) pins that `+0.00` output, and
 * unifying it is a product decision for whoever owns that pin, not a
 * refactor to make silently.
 */
export function formatScore(val: number | null): string {
  if (val === null) return "N/A";
  const clamped = Math.max(-1, Math.min(1, val));
  return (clamped > 0 ? "+" : "") + clamped.toFixed(2);
}
