"use client";

interface ProgressBarProps {
  currentIndex: number;
  totalTopics: number;
  topicNames: string[];
}

export function ProgressBar({
  currentIndex,
  totalTopics,
  topicNames,
}: ProgressBarProps) {
  const progress = ((currentIndex + 1) / totalTopics) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>
          Topic {currentIndex + 1} of {totalTopics}:{" "}
          <span className="font-medium">{topicNames[currentIndex]}</span>
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
