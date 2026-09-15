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
      <div data-alignment-value className="display-l text-text-primary">
        {hasScore ? `${score}%` : "—"}
      </div>
      <div data-alignment-label className="label-eyebrow text-text-label mt-2">
        {hasScore ? "Overall alignment" : "No shared axes to compare"}
      </div>
    </div>
  );
}
