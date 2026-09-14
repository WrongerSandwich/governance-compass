/**
 * Formats a -1..1 axis score as a signed two-decimal string: `"+0.50"`,
 * `"-0.26"`, `"0.00"` (zero is not positive, so it carries no sign), or
 * `"N/A"` for an axis with no signal (e.g. a no-budget axis's `bg` component).
 *
 * The single home for what were three copies: `AxisBreakdownCard`,
 * `ComparisonScoreBar`, and `comparison-radar-data.ts`. The third signed an
 * exact zero as `"+0.00"`; its only consumers were an sr-only table and an
 * SVG hover string, so that sign aligned no visible column and only made a
 * screen reader say "plus zero point zero zero".
 */
export function formatScore(val: number | null): string {
  if (val === null) return "N/A";
  const clamped = Math.max(-1, Math.min(1, val));
  return (clamped > 0 ? "+" : "") + clamped.toFixed(2);
}
