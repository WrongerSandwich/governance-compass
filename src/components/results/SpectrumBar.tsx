interface SpectrumBarProps {
  topicName: string;
  score: number;
  labelLeft: string;
  labelRight: string;
  insufficientData?: boolean;
}

export function SpectrumBar({
  topicName,
  score,
  labelLeft,
  labelRight,
  insufficientData = false,
}: SpectrumBarProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-1">
        <span className="font-medium text-gray-900">{topicName}</span>
        {insufficientData && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            Insufficient data
          </span>
        )}
      </div>
      <div className="relative h-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400 rounded-full">
        {!insufficientData && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-[3px] border-gray-800 rounded-full shadow-md transition-all duration-300"
            style={{ left: `${score}%` }}
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
