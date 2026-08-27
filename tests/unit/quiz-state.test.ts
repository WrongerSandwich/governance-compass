import { describe, it, expect } from "vitest";
import {
  STORAGE_KEY,
  createFreshQuizState,
  createInitialBudget,
  isResumablePhase,
  isValidSavedQuizState,
  parseSavedQuizState,
  type QuizState,
} from "@/lib/quiz-state";

function validState(overrides: Partial<QuizState> = {}): QuizState {
  return {
    phase: "phase1",
    forcedChoiceResponses: { "FC-1": "A", "FC-2": "B" },
    scaledResponses: { "SC-1": 3 },
    budgetAllocations: createInitialBudget(),
    currentQuestionIndex: 4,
    randomSeed: 0.42,
    ...overrides,
  };
}

describe("STORAGE_KEY", () => {
  it("is the key the quiz has always used, so existing sessions still resume", () => {
    expect(STORAGE_KEY).toBe("governance-compass-quiz-state");
  });
});

describe("createFreshQuizState", () => {
  it("starts at intro with all 7 ministries at the minimum", () => {
    const state = createFreshQuizState(0.5);
    expect(state.phase).toBe("intro");
    expect(state.forcedChoiceResponses).toEqual({});
    expect(state.scaledResponses).toEqual({});
    expect(state.budgetAllocations).toEqual({ 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1 });
    expect(state.currentQuestionIndex).toBe(0);
    expect(state.randomSeed).toBe(0.5);
  });

  it("produces a state that round-trips through validation", () => {
    expect(isValidSavedQuizState(createFreshQuizState(0.5))).toBe(true);
  });
});

describe("isResumablePhase", () => {
  it("accepts every phase the user can still be sitting in", () => {
    for (const phase of ["intro", "phase1", "transition1", "phase2", "transition2", "phase3"]) {
      expect(isResumablePhase(phase)).toBe(true);
    }
  });

  it("rejects terminal phases — restoring them strands the tab on the spinner", () => {
    expect(isResumablePhase("computing")).toBe(false);
    expect(isResumablePhase("done")).toBe(false);
  });

  it("rejects unknown values", () => {
    expect(isResumablePhase("phase4")).toBe(false);
    expect(isResumablePhase(undefined)).toBe(false);
    expect(isResumablePhase(null)).toBe(false);
    expect(isResumablePhase(1)).toBe(false);
  });
});

describe("isValidSavedQuizState", () => {
  it("accepts a well-formed state", () => {
    expect(isValidSavedQuizState(validState())).toBe(true);
  });

  it("rejects non-objects", () => {
    for (const value of [null, undefined, 7, "state", [], true]) {
      expect(isValidSavedQuizState(value)).toBe(false);
    }
  });

  it("rejects a state saved in a terminal phase", () => {
    expect(isValidSavedQuizState(validState({ phase: "computing" }))).toBe(false);
    expect(isValidSavedQuizState(validState({ phase: "done" }))).toBe(false);
  });

  it("rejects missing response maps", () => {
    const noFC = validState() as Partial<QuizState>;
    delete noFC.forcedChoiceResponses;
    expect(isValidSavedQuizState(noFC)).toBe(false);

    const noSC = validState() as Partial<QuizState>;
    delete noSC.scaledResponses;
    expect(isValidSavedQuizState(noSC)).toBe(false);
  });

  it("rejects out-of-vocabulary response values", () => {
    expect(
      isValidSavedQuizState(validState({ forcedChoiceResponses: { "FC-1": "C" } as never }))
    ).toBe(false);
    expect(isValidSavedQuizState(validState({ scaledResponses: { "SC-1": 9 } as never }))).toBe(false);
    expect(isValidSavedQuizState(validState({ scaledResponses: { "SC-1": "3" } as never }))).toBe(false);
  });

  it("rejects budgets from older quiz versions", () => {
    expect(isValidSavedQuizState(validState({ budgetAllocations: {} }))).toBe(false);
    // 10-ministry budget from the pre-rebuild quiz
    const tenMinistries: Record<number, number> = {};
    for (let i = 1; i <= 10; i++) tenMinistries[i] = 10;
    expect(isValidSavedQuizState(validState({ budgetAllocations: tenMinistries }))).toBe(false);
    // right count, wrong ids
    expect(
      isValidSavedQuizState(
        validState({ budgetAllocations: { 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1 } })
      )
    ).toBe(false);
  });

  it("rejects non-numeric or negative budget amounts", () => {
    expect(
      isValidSavedQuizState(
        validState({ budgetAllocations: { ...createInitialBudget(), 3: "8" as never } })
      )
    ).toBe(false);
    expect(
      isValidSavedQuizState(validState({ budgetAllocations: { ...createInitialBudget(), 3: -5 } }))
    ).toBe(false);
    expect(
      isValidSavedQuizState(validState({ budgetAllocations: { ...createInitialBudget(), 3: NaN } }))
    ).toBe(false);
  });

  it("rejects a bogus question index", () => {
    expect(isValidSavedQuizState(validState({ currentQuestionIndex: -1 }))).toBe(false);
    expect(isValidSavedQuizState(validState({ currentQuestionIndex: 1.5 }))).toBe(false);
    expect(isValidSavedQuizState(validState({ currentQuestionIndex: 10_000 }))).toBe(false);
    expect(isValidSavedQuizState(validState({ currentQuestionIndex: "3" as never }))).toBe(false);
  });

  it("rejects a missing or non-finite random seed", () => {
    expect(isValidSavedQuizState(validState({ randomSeed: NaN }))).toBe(false);
    expect(isValidSavedQuizState(validState({ randomSeed: undefined as never }))).toBe(false);
  });
});

describe("parseSavedQuizState", () => {
  it("returns null for empty storage", () => {
    expect(parseSavedQuizState(null)).toBeNull();
    expect(parseSavedQuizState("")).toBeNull();
  });

  it("returns null for malformed JSON instead of throwing", () => {
    expect(parseSavedQuizState("{not json")).toBeNull();
  });

  it("returns null for a state saved in a terminal phase", () => {
    expect(parseSavedQuizState(JSON.stringify(validState({ phase: "done" })))).toBeNull();
  });

  it("round-trips a valid state", () => {
    const state = validState();
    expect(parseSavedQuizState(JSON.stringify(state))).toEqual(state);
  });
});
