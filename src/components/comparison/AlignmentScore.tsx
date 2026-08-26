interface AlignmentScoreProps {
  /** Null when the two profiles share no comparable axis. */
  score: number | null;
}

export function AlignmentScore({ score }: AlignmentScoreProps) {
  const hasScore = score !== null;
  return (
    <div
      className="text-center py-6"
      aria-label={
        hasScore
          ? `Overall alignment: ${score}%`
          : "Overall alignment unavailable: no shared axes"
      }
    >
      <div className="text-[36px] font-serif font-medium text-text-primary">
        {hasScore ? `${score}%` : "—"}
      </div>
      <div className="text-text-tertiary text-sm mt-1">
        {hasScore ? "Overall alignment" : "No shared axes to compare"}
      </div>
    </div>
  );
}
