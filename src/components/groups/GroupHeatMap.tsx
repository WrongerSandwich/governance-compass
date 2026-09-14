interface AxisStat {
  axisName: string;
  spread: number; // 0.0 to 2.0
}

/** Three spread bands, tight to wide. Surfaces rather than ramp entries, so
 *  the scale inverts with the page: on a dark ground `--surface-2` is a step
 *  lighter than the panel and `--border-secondary` a step lighter again, which
 *  preserves the ordering the light-mode ramp expressed by getting darker. */
const SPREAD_SURFACES = [
  "var(--surface-2)",
  "var(--border-secondary)",
  "var(--border-primary)",
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
