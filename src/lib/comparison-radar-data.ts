import { axes as axesDef } from "@/data/axes";

export const TOTAL_AXES = 12;

export interface AxisScoreEntry {
  axisId: number;
  name: string;
  finalScore: number;
}

/**
 * Expand sparse score entries into one slot per axis.
 *
 * Hidden axes yield `null`, never a neutral 0 — a 0 is a real, centrist score,
 * so padding a withheld axis with one would silently invent a position for it.
 * Callers must strip hidden entries from `axisScores` before serializing them
 * to the client; `hidden` only tells the chart to leave a gap.
 */
export function buildPaddedScores(
  axisScores: AxisScoreEntry[],
  hidden: Set<number> = new Set()
): (number | null)[] {
  return Array.from({ length: TOTAL_AXES }, (_, i) => {
    if (hidden.has(i + 1)) return null;
    const found = axisScores.find((s) => s.axisId === i + 1);
    return found?.finalScore ?? 0;
  });
}

/**
 * Axis names for all 12 spokes. Falls back to the public axis catalogue, which
 * is how hidden axes — absent from both score arrays — still get a label.
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
