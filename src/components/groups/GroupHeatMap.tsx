interface TopicStat {
  topicName: string;
  spread: number;
}

export function GroupHeatMap({ stats }: { stats: TopicStat[] }) {
  const sorted = [...stats].sort((a, b) => a.spread - b.spread);

  return (
    <div className="space-y-2">
      {sorted.map((stat) => {
        const intensity = Math.min(stat.spread / 80, 1);
        const bgColor =
          intensity < 0.3
            ? "bg-green-100 text-green-800"
            : intensity < 0.6
              ? "bg-amber-100 text-amber-800"
              : "bg-red-100 text-red-800";

        return (
          <div
            key={stat.topicName}
            className={`flex justify-between items-center px-4 py-2 rounded-lg ${bgColor}`}
          >
            <span className="font-medium text-sm">{stat.topicName}</span>
            <span className="text-sm">
              {Math.round(stat.spread)} pt spread
            </span>
          </div>
        );
      })}
    </div>
  );
}
