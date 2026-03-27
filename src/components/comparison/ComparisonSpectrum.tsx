interface ComparisonSpectrumProps {
  topicName: string;
  scoreA: number;
  scoreB: number;
  labelLeft: string;
  labelRight: string;
  delta: number;
}

export function ComparisonSpectrum({
  topicName,
  scoreA,
  scoreB,
  labelLeft,
  labelRight,
  delta,
}: ComparisonSpectrumProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-1">
        <span className="font-medium text-gray-900">{topicName}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            delta <= 10
              ? "bg-green-50 text-green-700"
              : delta <= 30
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700"
          }`}
        >
          {Math.round(delta)} pts apart
        </span>
      </div>
      <div className="relative h-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400 rounded-full">
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-indigo-100 border-[3px] border-indigo-600 rounded-full shadow-md z-10"
          style={{ left: `${scoreA}%` }}
          title="You"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-rose-100 border-[3px] border-rose-500 rounded-full shadow-md z-10"
          style={{ left: `${scoreB}%` }}
          title="Them"
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{labelLeft}</span>
        <span>{labelRight}</span>
      </div>
    </div>
  );
}
