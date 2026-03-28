export interface AxisDelta {
  axisId: number;
  scoreA: number;
  scoreB: number;
  delta: number;
}

export interface ComparisonResult {
  alignmentScore: number;
  perAxisDeltas: AxisDelta[];
  closestAxes: AxisDelta[];
  furthestAxes: AxisDelta[];
}

interface AxisScoreInput {
  axisId: number;
  finalScore: number;
}

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
      ? perAxisDeltas.reduce((sum, d) => sum + d.delta, 0) /
        perAxisDeltas.length
      : 0;

  const alignmentScore = Math.max(
    0,
    Math.min(100, Math.round(100 * (1 - meanDelta / 2.0)))
  );

  return {
    alignmentScore,
    perAxisDeltas,
    closestAxes: sorted.slice(0, 3),
    furthestAxes: sorted.slice(-3).reverse(),
  };
}
