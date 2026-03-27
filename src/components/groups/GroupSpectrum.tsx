interface GroupSpectrumProps {
  topicName: string;
  labelLeft: string;
  labelRight: string;
  memberScores: number[];
  average: number | null;
}

export function GroupSpectrum({
  topicName,
  labelLeft,
  labelRight,
  memberScores,
  average,
}: GroupSpectrumProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-1">
        <span className="font-medium text-gray-900">{topicName}</span>
        {average !== null && (
          <span className="text-xs text-gray-500">
            avg: {Math.round(average)}
          </span>
        )}
      </div>
      <div className="relative h-8 bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400 rounded-full">
        {memberScores.map((score, i) => (
          <div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-gray-700 rounded-full shadow-sm"
            style={{ left: `${score}%` }}
          />
        ))}
        {average !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-8 bg-gray-800 opacity-50"
            style={{ left: `${average}%` }}
          />
        )}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{labelLeft}</span>
        <span>{labelRight}</span>
      </div>
    </div>
  );
}
