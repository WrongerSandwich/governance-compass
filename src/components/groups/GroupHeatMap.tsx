interface AxisStat {
  axisName: string;
  spread: number; // 0.0 to 2.0 (max delta on [-1, +1] scale)
}

export function GroupHeatMap({ stats }: { stats: AxisStat[] }) {
  const sorted = [...stats].sort((a, b) => a.spread - b.spread);

  return (
    <div className="space-y-2">
      {sorted.map((stat) => {
        // Spread is on [0, 2.0] scale; normalize to [0, 1] for color intensity
        const intensity = Math.min(stat.spread / 2.0, 1);
        const bgColor =
          intensity < 0.3
            ? "bg-green-100 text-green-800"
            : intensity < 0.6
              ? "bg-amber-100 text-amber-800"
              : "bg-red-100 text-red-800";

        return (
          <div
            key={stat.axisName}
            className={`flex justify-between items-center px-4 py-2 rounded-lg ${bgColor}`}
          >
            <span className="font-medium text-sm">{stat.axisName}</span>
            <span className="text-sm tabular-nums">
              {stat.spread.toFixed(2)} spread
            </span>
          </div>
        );
      })}
    </div>
  );
}
