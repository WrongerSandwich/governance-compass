import type { QuizResponses, PerModalityScores } from "./scoring-types";
import { BUDGET_BASELINE, BUDGET_SIGMOID_K } from "./scoring-types";
import { forcedChoiceItems } from "@/data/forced-choice-items";
import { scaledItems } from "@/data/scaled-items";
import { ministryAxisMappings } from "@/data/ministries";

/**
 * Stage 1 — Raw FC scoring for a single axis.
 *
 * For each FC item on this axis: selectedPole "A" → -1.0, "B" → +1.0.
 * Returns the mean of all item scores. Range: [-1.0, +1.0].
 * Possible discrete values: -1.0, -0.333…, +0.333…, +1.0 (for 3-item axes).
 * Returns 0 when no items exist for the axis.
 */
export function scoreForcedChoiceAxis(
  responses: Record<string, "A" | "B">,
  axisId: number
): number {
  const items = forcedChoiceItems.filter((item) => item.axisId === axisId);
  if (items.length === 0) return 0;

  const scores = items.map((item) => {
    const selected = responses[item.id];
    if (selected === "A") return -1.0;
    if (selected === "B") return 1.0;
    // Unanswered item — treat as neutral
    return 0.0;
  });

  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

/**
 * Stage 1 — Raw SC scoring for a single axis.
 *
 * Maps Likert values: 1 → -2, 2 → -1, 3 → 0, 4 → +1, 5 → +2.
 * Returns mean / 2.0 to normalise to [-1.0, +1.0].
 * Returns 0 when no items exist for the axis.
 */
export function scoreScaledAxis(
  responses: Record<string, 1 | 2 | 3 | 4 | 5>,
  axisId: number
): number {
  const items = scaledItems.filter((item) => item.axisId === axisId);
  if (items.length === 0) return 0;

  const scores = items.map((item) => {
    const value = responses[item.id];
    if (value === undefined) return 0;
    // Map 1→-2, 2→-1, 3→0, 4→+1, 5→+2
    return (value as number) - 3;
  });

  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return mean / 2.0;
}

/**
 * Stage 1 — Compute per-ministry budget deviations from the baseline.
 *
 * Returns Map<ministryId, deviation> where deviation = allocation - BUDGET_BASELINE.
 */
export function computeBudgetDeviations(
  allocations: Record<number, number>
): Map<number, number> {
  const deviations = new Map<number, number>();
  for (const [ministryIdStr, allocation] of Object.entries(allocations)) {
    const ministryId = Number(ministryIdStr);
    deviations.set(ministryId, allocation - BUDGET_BASELINE);
  }
  return deviations;
}

/**
 * Stage 1 — Raw budget scoring for a single axis.
 *
 * For each ministry-axis mapping:
 *   signedDeviation = deviation * direction
 * Returns tanh(mean(signedDeviations) / BUDGET_SIGMOID_K).
 * Returns null when no ministry mappings exist for the axis.
 */
export function scoreBudgetAxis(
  deviations: Map<number, number>,
  axisId: number
): number | null {
  const mappings = ministryAxisMappings.filter((m) => m.axisId === axisId);
  if (mappings.length === 0) return null;

  const signedDeviations = mappings.map((mapping) => {
    const deviation = deviations.get(mapping.ministryId) ?? 0;
    return deviation * mapping.direction;
  });

  const mean =
    signedDeviations.reduce((sum, s) => sum + s, 0) / signedDeviations.length;

  return Math.tanh(mean / BUDGET_SIGMOID_K);
}

/**
 * Stage 2 — Compute per-modality scores for all 12 axes.
 *
 * Runs FC, SC, and budget scoring for each axis and assembles the
 * PerModalityScores record.
 */
export function computeAllPerModalityScores(
  responses: QuizResponses
): PerModalityScores {
  const deviations = computeBudgetDeviations(responses.budget);
  const result: PerModalityScores = {};

  for (let axisId = 1; axisId <= 12; axisId++) {
    result[axisId] = {
      fc: scoreForcedChoiceAxis(responses.forcedChoice, axisId),
      sc: scoreScaledAxis(responses.scaled, axisId),
      bg: scoreBudgetAxis(deviations, axisId),
    };
  }

  return result;
}
