import type { QuizResponses, PerModalityScores, TensionInfo, CompassResult, ArchetypeMatch } from "./scoring-types";
import {
  BUDGET_BASELINE,
  BUDGET_SIGMOID_K,
  AXIS_WEIGHT_PROFILES,
  TENSION_THRESHOLDS,
  STATED_FC_WEIGHT,
  STATED_SC_WEIGHT,
  SD_ECONOMIC_WEIGHTS,
  SD_CULTURAL_WEIGHTS,
  MAX_ARCHETYPE_DISTANCE,
  BLENDED_THRESHOLD_PCT,
} from "./scoring-types";
import { forcedChoiceItems } from "@/data/forced-choice-items";
import { scaledItems } from "@/data/scaled-items";
import { ministryAxisMappings } from "@/data/ministries";
import { archetypes } from "@/data/archetypes";

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
 * Stage 3 — Fuse fc, sc, and optional bg scores for a single axis using
 * the axis-specific weight profile.
 *
 * When bg is null and the profile has bg > 0 (the axis has a budget mapping
 * but no budget response was produced), the fc and sc weights are renormalised
 * so they sum to 1.0.  When bg is null and profile.bg == 0 (no budget mapping
 * for this axis), fc and sc weights already sum to 1.0 and are used as-is.
 *
 * Returns a weighted sum in [-1.0, +1.0].
 */
export function fuseModalityScores(
  fc: number,
  sc: number,
  bg: number | null,
  axisId: number
): number {
  const profile = AXIS_WEIGHT_PROFILES[axisId];

  if (bg !== null) {
    // All three modalities present — use profile weights directly.
    return profile.fc * fc + profile.sc * sc + profile.bg * bg;
  }

  if (profile.bg === 0) {
    // No budget mapping for this axis; fc + sc already sum to 1.0.
    return profile.fc * fc + profile.sc * sc;
  }

  // Budget mapping exists but bg was not produced — renormalise fc and sc.
  const fcScSum = profile.fc + profile.sc;
  const normFcW = profile.fc / fcScSum;
  const normScW = profile.sc / fcScSum;
  return normFcW * fc + normScW * sc;
}

/**
 * Stage 3 — Compute final fused scores for all 12 axes.
 *
 * Returns an array of objects containing axisId, finalScore, and the
 * individual modality scores (fcScore, scScore, bgScore).
 */
export function computeAllFinalScores(
  perModalityScores: PerModalityScores
): { axisId: number; finalScore: number; fcScore: number; scScore: number; bgScore: number | null }[] {
  const results: { axisId: number; finalScore: number; fcScore: number; scScore: number; bgScore: number | null }[] = [];

  for (let axisId = 1; axisId <= 12; axisId++) {
    const { fc, sc, bg } = perModalityScores[axisId];
    const finalScore = fuseModalityScores(fc, sc, bg, axisId);
    results.push({ axisId, finalScore, fcScore: fc, scScore: sc, bgScore: bg });
  }

  return results;
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

/**
 * Stage 4 — Detect contradiction between stated preferences (FC + SC)
 * and revealed preferences (budget).
 *
 * Stated score = (STATED_FC_WEIGHT × fcScore) + (STATED_SC_WEIGHT × scScore).
 * Magnitude = |stated - bgScore|.
 *
 * Tension levels:
 *   0.00 – 0.50 → "none"  (detected=false)
 *   0.51 – 1.00 → "mild"  (detected=true)
 *   1.01 – 1.50 → "moderate" (detected=true)
 *   1.51 – 2.00 → "strong"   (detected=true)
 *
 * Direction (only when detected AND stated/budget are on opposite sides of 0):
 *   stated < 0 and bgScore > 0 → "principles_A_but_budget_B"
 *   stated > 0 and bgScore < 0 → "principles_B_but_budget_A"
 *   otherwise → null
 */
export function detectContradiction(
  fcScore: number,
  scScore: number,
  bgScore: number | null,
  axisId: number
): TensionInfo {
  if (bgScore === null) {
    return { detected: false, magnitude: 0, level: "none", direction: null };
  }

  const statedScore = STATED_FC_WEIGHT * fcScore + STATED_SC_WEIGHT * scScore;
  const magnitude = Math.abs(statedScore - bgScore);

  let level: TensionInfo["level"];
  let detected: boolean;

  if (magnitude >= TENSION_THRESHOLDS.strong) {
    level = "strong";
    detected = true;
  } else if (magnitude >= TENSION_THRESHOLDS.moderate) {
    level = "moderate";
    detected = true;
  } else if (magnitude >= TENSION_THRESHOLDS.mild) {
    level = "mild";
    detected = true;
  } else {
    level = "none";
    detected = false;
  }

  let direction: TensionInfo["direction"] = null;
  if (detected && statedScore < 0 && bgScore > 0) {
    direction = "principles_A_but_budget_B";
  } else if (detected && statedScore > 0 && bgScore < 0) {
    direction = "principles_B_but_budget_A";
  }

  return { detected, magnitude, level, direction };
}

/**
 * Stage 5 — Reduce 12 axis scores to two super-dimension coordinates for the
 * political compass plot.
 *
 * Economic super-dimension:  0.65 × axis1 + 0.35 × axis2
 * Cultural super-dimension:  0.30 × axis7 + 0.20 × axis8 + 0.20 × axis9
 *                           + 0.15 × axis5 + 0.15 × axis4
 *
 * Missing axes default to 0. Both outputs are in [-1.0, +1.0] because the
 * weights in each group sum to 1.0 and inputs are bounded to [-1.0, +1.0].
 */
export function computeSuperDimensions(
  axisScores: Record<number, number>
): CompassResult {
  let economic = 0;
  for (const [axisId, weight] of Object.entries(SD_ECONOMIC_WEIGHTS)) {
    economic += weight * (axisScores[Number(axisId)] ?? 0);
  }

  let cultural = 0;
  for (const [axisId, weight] of Object.entries(SD_CULTURAL_WEIGHTS)) {
    cultural += weight * (axisScores[Number(axisId)] ?? 0);
  }

  return { economic, cultural };
}

/**
 * Stage 6 — Match a respondent's axis scores to the nearest archetype
 * prototype using weighted Euclidean distance (all weights = 1.0 for v1).
 *
 * axisScores is a 12-element array where index 0 = axis 1, index 11 = axis 12.
 *
 * Distance formula:
 *   distance = sqrt(sum over 12 axes of: (respondent[i] - prototype[i])²)
 *
 * Match percentage:
 *   match_pct = max(0, (1 - distance / MAX_ARCHETYPE_DISTANCE)) × 100
 *   where MAX_ARCHETYPE_DISTANCE = sqrt(48) ≈ 6.928
 *
 * Blended detection:
 *   If |primary_dist - secondary_dist| / primary_dist <= BLENDED_THRESHOLD_PCT / 100,
 *   set isBlended = true. (When primary_dist = 0, isBlended = false.)
 *
 * Returns: { primaryId, primaryMatchPct, secondaryId, secondaryMatchPct, isBlended }
 */
export function matchArchetype(axisScores: number[]): ArchetypeMatch {
  const ranked = archetypes.map((archetype) => {
    const sumSq = axisScores.reduce(
      (sum, score, i) => sum + (score - archetype.prototype[i]) ** 2,
      0
    );
    const distance = Math.sqrt(sumSq);
    const matchPct = Math.max(0, (1 - distance / MAX_ARCHETYPE_DISTANCE)) * 100;
    return { id: archetype.id, distance, matchPct };
  });

  ranked.sort((a, b) => a.distance - b.distance);

  const primary = ranked[0];
  const secondary = ranked[1];

  const blendedRatio =
    primary.distance === 0
      ? Infinity
      : Math.abs(primary.distance - secondary.distance) / primary.distance;

  const isBlended = blendedRatio <= BLENDED_THRESHOLD_PCT / 100;

  return {
    primaryId: primary.id,
    primaryMatchPct: primary.matchPct,
    secondaryId: secondary.id,
    secondaryMatchPct: secondary.matchPct,
    isBlended,
  };
}
