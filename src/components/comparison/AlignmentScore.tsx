interface AlignmentScoreProps {
  score: number;
}

export function AlignmentScore({ score }: AlignmentScoreProps) {
  const color =
    score >= 75
      ? "text-green-600"
      : score >= 50
        ? "text-amber-600"
        : "text-red-600";

  return (
    <div className="text-center py-6">
      <div className={`text-5xl font-bold ${color}`}>{score}%</div>
      <div className="text-gray-500 mt-1">Overall Alignment</div>
    </div>
  );
}
