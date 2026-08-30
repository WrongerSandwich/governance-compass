import { axes as axesDef } from "@/data/axes";

export const TOTAL_AXES = 12;

export interface AxisScoreEntry {
  axisId: number;
  name: string;
  finalScore: number;
}

/**
 * Expand one profile's sparse score entries into a slot per axis. An axis with
 * no entry — hidden, or simply absent from the profile — yields `null` rather
 * than a neutral 0, because 0 is a real centrist score: padding with one would
 * invent a position the profile never took.
 */
function padScores(
  axisScores: AxisScoreEntry[],
  hidden: Set<number>
): (number | null)[] {
  return Array.from({ length: TOTAL_AXES }, (_, i) => {
    if (hidden.has(i + 1)) return null;
    const found = axisScores.find((s) => s.axisId === i + 1);
    return found?.finalScore ?? null;
  });
}

/**
 * Both profiles' scores, aligned by axis. An axis that cannot be compared —
 * hidden by either owner, or missing from either profile — is null on *both*
 * sides, so the chart never draws half a comparison. This mirrors what
 * `compareProfiles` puts in `perAxisDeltas`.
 *
 * Callers must still strip hidden entries before serializing scores to the
 * client; masking here only governs what gets drawn.
 */
export function buildComparableScores(
  axisScoresA: AxisScoreEntry[],
  axisScoresB: AxisScoreEntry[],
  hidden: Set<number> = new Set()
): { scoresA: (number | null)[]; scoresB: (number | null)[] } {
  const rawA = padScores(axisScoresA, hidden);
  const rawB = padScores(axisScoresB, hidden);
  const comparable = rawA.map((a, i) => a !== null && rawB[i] !== null);
  return {
    scoresA: rawA.map((a, i) => (comparable[i] ? a : null)),
    scoresB: rawB.map((b, i) => (comparable[i] ? b : null)),
  };
}

/**
 * Contiguous runs of comparable axis indices around the ring, which the chart
 * draws as separate open shapes. A single closed shape would connect the
 * neighbours of an omitted axis with a chord straight across its spoke —
 * showing an apparent position on the very axis being withheld.
 *
 * The ring wraps, so axis 12 and axis 1 belong to the same run. Returns one
 * full-length run when every axis is comparable, and no runs when none is.
 */
export function buildScoreRuns(scores: (number | null)[]): number[][] {
  const n = scores.length;
  const firstGap = scores.findIndex((s) => s === null);
  if (firstGap === -1) return [Array.from({ length: n }, (_, i) => i)];

  const runs: number[][] = [];
  let run: number[] = [];
  // Start just past a gap so a run is never split across the array boundary.
  for (let step = 1; step <= n; step++) {
    const i = (firstGap + step) % n;
    if (scores[i] !== null) {
      run.push(i);
    } else if (run.length > 0) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length > 0) runs.push(run);
  return runs;
}

/**
 * Axis names for all 12 spokes. Falls back to the public axis catalogue, which
 * is how an omitted axis — absent from both score arrays — still gets a label.
 */
export function buildAxisNames(
  axisScoresA: AxisScoreEntry[],
  axisScoresB: AxisScoreEntry[]
): string[] {
  return Array.from({ length: TOTAL_AXES }, (_, i) => {
    const found =
      axisScoresA.find((s) => s.axisId === i + 1) ??
      axisScoresB.find((s) => s.axisId === i + 1);
    return (
      found?.name ?? axesDef.find((a) => a.id === i + 1)?.name ?? `Axis ${i + 1}`
    );
  });
}

export function formatScore(score: number): string {
  return (score >= 0 ? "+" : "") + score.toFixed(2);
}
