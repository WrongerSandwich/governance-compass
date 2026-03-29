interface AlignmentScoreProps {
  score: number;
}

export function AlignmentScore({ score }: AlignmentScoreProps) {
  return (
    <div className="text-center py-6" aria-label={`Overall alignment: ${score}%`}>
      <div className="text-[36px] font-serif font-medium text-text-primary">{score}%</div>
      <div className="text-text-tertiary text-sm mt-1">Overall alignment</div>
    </div>
  );
}
