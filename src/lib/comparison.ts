export interface AxisDelta {
  axisId: number;
  scoreA: number;
  scoreB: number;
  delta: number;
}

export interface ComparisonResult {
  /** Null when no axis is common to both profiles — there is nothing to align on. */
  alignmentScore: number | null;
  perAxisDeltas: AxisDelta[];
  closestAxes: AxisDelta[];
  furthestAxes: AxisDelta[];
}

interface AxisScoreInput {
  axisId: number;
  finalScore: number;
}

/** Most aligned / most divergent each show at most this many axes. */
const HIGHLIGHT_COUNT = 3;

export function compareProfiles(
  scoresA: AxisScoreInput[],
  scoresB: AxisScoreInput[],
  hiddenAxisIds: Set<number> = new Set()
): ComparisonResult {
  const mapA = new Map(scoresA.map((s) => [s.axisId, s.finalScore]));
  const mapB = new Map(scoresB.map((s) => [s.axisId, s.finalScore]));

  const commonAxisIds = [...mapA.keys()].filter(
    (id) => mapB.has(id) && !hiddenAxisIds.has(id)
  );

  const perAxisDeltas: AxisDelta[] = commonAxisIds.map((axisId) => ({
    axisId,
    scoreA: mapA.get(axisId)!,
    scoreB: mapB.get(axisId)!,
    delta: Math.abs(mapA.get(axisId)! - mapB.get(axisId)!),
  }));

  const sorted = [...perAxisDeltas].sort((a, b) => a.delta - b.delta);

  const meanDelta =
    perAxisDeltas.length > 0
      ? perAxisDeltas.reduce((sum, d) => sum + d.delta, 0) / perAxisDeltas.length
      : null;

  const alignmentScore =
    meanDelta === null
      ? null
      : Math.max(0, Math.min(100, Math.round(100 * (1 - meanDelta / 2.0))));

  // The two lists are drawn from opposite ends of the same sorted array, so
  // each can hold at most half the axes before they start naming the same one
  // as both most aligned and most divergent. With a single common axis that
  // leaves both empty, and deliberately so: it is the same axis either way, and
  // it already appears with its delta in the per-axis breakdown. The page hides
  // the section when the lists are empty.
  const highlightCount = Math.min(
    HIGHLIGHT_COUNT,
    Math.floor(sorted.length / 2)
  );

  return {
    alignmentScore,
    perAxisDeltas,
    closestAxes: sorted.slice(0, highlightCount),
    furthestAxes: sorted.slice(sorted.length - highlightCount).reverse(),
  };
}
