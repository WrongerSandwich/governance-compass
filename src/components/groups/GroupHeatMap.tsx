interface AxisStat {
  axisName: string;
  spread: number; // 0.0 to 2.0
}

export function GroupHeatMap({ stats }: { stats: AxisStat[] }) {
  const sorted = [...stats].sort((a, b) => a.spread - b.spread);

  return (
    <div className="space-y-1">
      {sorted.map((stat) => {
        // Spread on [0, 2.0]; map to stone intensity
        const intensity = Math.min(stat.spread / 2.0, 1);
        const bg =
          intensity < 0.3
            ? "bg-stone-100 text-stone-800"
            : intensity < 0.6
              ? "bg-stone-200 text-stone-800"
              : "bg-stone-300 text-stone-900";

        return (
          <div
            key={stat.axisName}
            className={`flex justify-between items-center px-3 py-2 rounded-[8px] ${bg}`}
          >
            <span className="text-sm font-medium">{stat.axisName}</span>
            <span className="text-xs font-mono tabular-nums">
              {stat.spread.toFixed(2)} spread
            </span>
          </div>
        );
      })}
    </div>
  );
}
