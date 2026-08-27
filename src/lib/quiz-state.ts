/**
 * Quiz state shape, validation, and the sessionStorage contract.
 *
 * Kept free of React so the persistence rules can be unit-tested directly.
 * The provider owns *when* to read and write; this module owns *what* counts
 * as a valid saved state and which phases are worth saving at all.
 */

export const STORAGE_KEY = "governance-compass-quiz-state";

/** Ministries in the budget phase (see src/data/ministries.ts). */
export const MINISTRY_COUNT = 7;

/**
 * Sanity ceiling on a restored question index. The provider cannot know how
 * many items a phase holds, so this only rejects obviously bogus payloads;
 * QuizFlow still guards the actual lookup.
 */
const MAX_QUESTION_INDEX = 1000;

export type QuizPhase =
  | "intro"
  | "phase1"
  | "transition1"
  | "phase2"
  | "transition2"
  | "phase3"
  | "computing"
  | "done";

export interface QuizState {
  phase: QuizPhase;
  forcedChoiceResponses: Record<string, "A" | "B">;
  scaledResponses: Record<string, 1 | 2 | 3 | 4 | 5>;
  budgetAllocations: Record<number, number>; // ministryId -> amount
  currentQuestionIndex: number; // within current phase
  randomSeed: number; // for consistent randomization
}

/**
 * Phases the quiz can be resumed into. "computing" and "done" are terminal:
 * the results have already been handed off to /results, and restoring into
 * either one strands the user on the computing spinner with no way out.
 */
const RESUMABLE_PHASES: readonly QuizPhase[] = [
  "intro",
  "phase1",
  "transition1",
  "phase2",
  "transition2",
  "phase3",
];

export function isResumablePhase(phase: unknown): phase is QuizPhase {
  return RESUMABLE_PHASES.includes(phase as QuizPhase);
}

/** Budget starts with every ministry at the minimum of 1: 7 committed, 43 to spend. */
export function createInitialBudget(): Record<number, number> {
  const allocations: Record<number, number> = {};
  for (let i = 1; i <= MINISTRY_COUNT; i++) {
    allocations[i] = 1;
  }
  return allocations;
}

export function createFreshQuizState(randomSeed: number = Math.random()): QuizState {
  return {
    phase: "intro",
    forcedChoiceResponses: {},
    scaledResponses: {},
    budgetAllocations: createInitialBudget(),
    currentQuestionIndex: 0,
    randomSeed,
  };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidBudget(value: unknown): value is Record<number, number> {
  if (!isPlainRecord(value)) return false;
  const keys = Object.keys(value);
  if (keys.length !== MINISTRY_COUNT) return false;
  return keys.every((key) => {
    const id = Number(key);
    if (!Number.isInteger(id) || id < 1 || id > MINISTRY_COUNT) return false;
    const amount = value[key];
    return typeof amount === "number" && Number.isFinite(amount) && amount >= 0;
  });
}

function isValidResponseMap<T>(value: unknown, isValidValue: (v: unknown) => v is T): value is Record<string, T> {
  if (!isPlainRecord(value)) return false;
  return Object.values(value).every(isValidValue);
}

function isPole(value: unknown): value is "A" | "B" {
  return value === "A" || value === "B";
}

function isLikert(value: unknown): value is 1 | 2 | 3 | 4 | 5 {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

/**
 * Validate a parsed saved state. Anything that fails — a tampered payload, a
 * shape from an older quiz version, or a terminal phase that should never have
 * been written — is rejected so the caller can start clean rather than crash
 * partway through a render.
 */
export function isValidSavedQuizState(value: unknown): value is QuizState {
  if (!isPlainRecord(value)) return false;
  if (!isResumablePhase(value.phase)) return false;
  if (!isValidResponseMap(value.forcedChoiceResponses, isPole)) return false;
  if (!isValidResponseMap(value.scaledResponses, isLikert)) return false;
  if (!isValidBudget(value.budgetAllocations)) return false;
  if (
    !Number.isInteger(value.currentQuestionIndex) ||
    (value.currentQuestionIndex as number) < 0 ||
    (value.currentQuestionIndex as number) > MAX_QUESTION_INDEX
  ) {
    return false;
  }
  if (typeof value.randomSeed !== "number" || !Number.isFinite(value.randomSeed)) return false;
  return true;
}

/** Parse a raw sessionStorage payload, returning null for anything unusable. */
export function parseSavedQuizState(raw: string | null): QuizState | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isValidSavedQuizState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
