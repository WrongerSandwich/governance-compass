interface AxisStat {
  axisName: string;
  spread: number; // 0.0 to 2.0
}

/** Three spread bands, tight to wide: one hue at rising alpha.
 *
 *  The first attempt reached for `--surface-2` / `--border-secondary` /
 *  `--border-primary`, on the reasoning that named surfaces invert where the
 *  Stone ramp does not. They do invert — but the panel underneath is
 *  `--surface-1`, and against *it* the three land at 1.10 / 1.43 / 1.80 in
 *  light and 1.11 / 1.21 / 1.78 in dark. The dark row is the failure: band 0
 *  is a step *darker* than the panel while bands 1 and 2 are lighter, so the
 *  first two sit on opposite sides of the ground at almost the same distance
 *  from it and cannot be ordered by eye. A heat map whose lowest two bands are
 *  indistinguishable is not a heat map.
 *
 *  Compositing one colour at rising alpha is monotonic by construction, in
 *  both modes, whatever the panel is — which is the property a sequential
 *  scale needs and the property a hand-picked triple kept failing to have.
 *  `--mark-primary` is the stepping token, so the hue itself still inverts.
 *
 *  Against the panel this gives 1.19 / 1.46 / 1.94 light and 1.28 / 1.80 /
 *  2.71 dark. The first band matches the 1.20 the old Stone 100 fill had (spelled in prose:
 *  the ramp guard scans comments too), so
 *  the light rendering is unchanged where it was already right. The alphas
 *  stop at 0.50 because `--text-primary` on the widest band measures 4.83:1
 *  in dark; the next step up drops it to 4.37 and fails AA. */
const SPREAD_SURFACES = [
  "color-mix(in srgb, var(--mark-primary) 14%, transparent)",
  "color-mix(in srgb, var(--mark-primary) 30%, transparent)",
  "color-mix(in srgb, var(--mark-primary) 50%, transparent)",
] as const;

function spreadSurface(spread: number): string {
  // Spread on [0, 2.0]; map to intensity, same arithmetic as the old
  // stone-ramp version — the cuts are on intensity, not raw spread.
  const intensity = Math.min(spread / 2.0, 1);
  if (intensity < 0.3) return SPREAD_SURFACES[0];
  if (intensity < 0.6) return SPREAD_SURFACES[1];
  return SPREAD_SURFACES[2];
}

export function GroupHeatMap({ stats }: { stats: AxisStat[] }) {
  const sorted = [...stats].sort((a, b) => a.spread - b.spread);

  return (
    <div className="space-y-1">
      {sorted.map((stat) => (
        <div
          key={stat.axisName}
          data-spread-cell
          className="flex justify-between items-center px-3 py-2 rounded-sharp text-text-primary"
          style={{ backgroundColor: spreadSurface(stat.spread) }}
        >
          <span className="text-sm font-medium">{stat.axisName}</span>
          <span className="text-xs font-mono tabular-nums">
            {stat.spread.toFixed(2)} spread
          </span>
        </div>
      ))}
    </div>
  );
}
