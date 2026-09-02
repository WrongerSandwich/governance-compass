/**
 * tensionDescription.ts
 *
 * The synthetic-study pipeline records axis tensions as `{axis, magnitude,
 * level}` — no prose. The persona modal wants the sentence the modal spec asks
 * for ("Forced-choice answers lean collective provision (-1.0); budget
 * allocation suggests market orientation (+0.93). Strong tension."), so it is
 * generated here from the same modality scores the pipeline used.
 */

import { axes, type AxisData } from "@/data/axes";
import type { TensionLevel } from "./types";

/**
 * Stated-preference weights. The pipeline's magnitudes reproduce exactly with
 * FC 0.6 / SC 0.4 — verified against `scored_profiles.json`, e.g. P0002/claude
 * axis 1: |(0.6 x -1 + 0.4 x -0.25) - 0.9329| = 1.6329, the stored magnitude.
 * Keep these in step with the pipeline; they are not the live scoring engine's
 * fusion weights.
 */
export const STATED_FC_WEIGHT = 0.6;
export const STATED_SC_WEIGHT = 0.4;

export interface ModalityScore {
  fc?: number;
  sc?: number;
  budget?: number;
}

export interface TensionDescriptionInput {
  axis: number;
  level: TensionLevel;
  magnitude: number;
  modality: ModalityScore;
}

/**
 * Weighted combination of the two stated modalities (forced-choice + scaled).
 * Returns null when neither was administered, so callers can avoid asserting a
 * lean the data does not support.
 */
export function statedPreferenceScore(modality: ModalityScore): number | null {
  const { fc, sc } = modality;
  if (fc === undefined && sc === undefined) return null;
  return STATED_FC_WEIGHT * (fc ?? 0) + STATED_SC_WEIGHT * (sc ?? 0);
}

/** Signed score formatted the way the modal prints axis values. */
function fmt(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

/** Pole a score leans toward, or null at the exact midpoint. */
function poleLabel(axis: AxisData, value: number): string | null {
  if (value === 0) return null;
  return (value < 0 ? axis.poleALabel : axis.poleBLabel).toLowerCase();
}

/**
 * One sentence pair explaining where a flagged tension came from, always
 * closing with the severity and the magnitude that produced it.
 */
export function describeTension({
  axis,
  level,
  magnitude,
  modality,
}: TensionDescriptionInput): string {
  const verdict = `${level.charAt(0).toUpperCase()}${level.slice(1)} tension (Δ ${magnitude.toFixed(2)}).`;

  const stated = statedPreferenceScore(modality);
  const budget = modality.budget;
  const axisDef = axes.find((a) => a.id === axis);

  if (stated === null || budget === undefined || !axisDef) {
    return `Stated and budget signals diverge on this axis. ${verdict}`;
  }

  const statedPole = poleLabel(axisDef, stated);
  const budgetPole = poleLabel(axisDef, budget);

  const statedClause =
    statedPole === null
      ? `Forced-choice and scaled answers land at the midpoint (${fmt(stated)})`
      : `Forced-choice and scaled answers lean ${statedPole} (${fmt(stated)})`;

  if (statedPole !== null && statedPole === budgetPole) {
    // Same pole, so the gap is one of conviction rather than direction — and it
    // runs both ways: the budget can outrun the stated answers or fall short of
    // them. A magnitude over the 0.51 flag threshold rules out a tie.
    const strength =
      Math.abs(budget) > Math.abs(stated) ? "far more strongly" : "far more weakly";
    return `${statedClause}; budget allocation leans the same way ${strength} (${fmt(budget)}). ${verdict}`;
  }

  const budgetClause =
    budgetPole === null
      ? `budget allocation lands at the midpoint (${fmt(budget)})`
      : `budget allocation suggests ${budgetPole} (${fmt(budget)})`;

  return `${statedClause}; ${budgetClause}. ${verdict}`;
}
