"use client";

import { createContext, useContext, useEffect, useReducer, type ReactNode } from "react";

export interface QuizState {
  phase:
    | "intro"
    | "phase1"
    | "transition1"
    | "phase2"
    | "transition2"
    | "phase3"
    | "computing"
    | "done";
  forcedChoiceResponses: Record<string, "A" | "B">;
  scaledResponses: Record<string, 1 | 2 | 3 | 4 | 5>;
  budgetAllocations: Record<number, number>; // ministryId -> amount
  currentQuestionIndex: number; // within current phase
  randomSeed: number; // for consistent randomization
}

export type QuizAction =
  | { type: "START_QUIZ" }
  | { type: "SET_FC_RESPONSE"; itemId: string; selectedPole: "A" | "B" }
  | { type: "SET_SC_RESPONSE"; itemId: string; value: 1 | 2 | 3 | 4 | 5 }
  | { type: "SET_BUDGET"; ministryId: number; amount: number }
  | { type: "NEXT_QUESTION" }
  | { type: "PREV_QUESTION" }
  | { type: "COMPLETE_PHASE1" }
  | { type: "COMPLETE_PHASE2" }
  | { type: "START_PHASE2" }
  | { type: "START_PHASE3" }
  | { type: "START_COMPUTING" }
  | { type: "COMPLETE" }
  | { type: "RESET" };

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "START_QUIZ":
      return { ...state, phase: "phase1", currentQuestionIndex: 0 };
    case "SET_FC_RESPONSE":
      return {
        ...state,
        forcedChoiceResponses: {
          ...state.forcedChoiceResponses,
          [action.itemId]: action.selectedPole,
        },
      };
    case "SET_SC_RESPONSE":
      return {
        ...state,
        scaledResponses: {
          ...state.scaledResponses,
          [action.itemId]: action.value,
        },
      };
    case "SET_BUDGET":
      return {
        ...state,
        budgetAllocations: {
          ...state.budgetAllocations,
          [action.ministryId]: action.amount,
        },
      };
    case "NEXT_QUESTION":
      return { ...state, currentQuestionIndex: state.currentQuestionIndex + 1 };
    case "PREV_QUESTION":
      return { ...state, currentQuestionIndex: state.currentQuestionIndex - 1 };
    case "COMPLETE_PHASE1":
      return { ...state, phase: "transition1" };
    case "COMPLETE_PHASE2":
      return { ...state, phase: "transition2" };
    case "START_PHASE2":
      return { ...state, phase: "phase2", currentQuestionIndex: 0 };
    case "START_PHASE3":
      return { ...state, phase: "phase3" };
    case "START_COMPUTING":
      return { ...state, phase: "computing" };
    case "COMPLETE":
      return { ...state, phase: "done" };
    case "RESET":
      sessionStorage.removeItem(STORAGE_KEY);
      return {
        phase: "intro",
        forcedChoiceResponses: {},
        scaledResponses: {},
        budgetAllocations: createInitialBudget(),
        currentQuestionIndex: 0,
        randomSeed: Math.random(),
      };
    default:
      return state;
  }
}

// Initialize budgetAllocations with all 7 ministries at minimum (1 each).
// 7 points committed, 43 to distribute. Total: 50.
const STORAGE_KEY = "governance-compass-quiz-state";

function createInitialBudget(): Record<number, number> {
  const allocations: Record<number, number> = {};
  for (let i = 1; i <= 7; i++) {
    allocations[i] = 1;
  }
  return allocations;
}

function createInitialState(): QuizState {
  if (typeof window !== "undefined") {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Invalidate stale budget state from old quiz versions
        const budgetKeys = Object.keys(parsed.budgetAllocations || {});
        if (budgetKeys.length !== 7 || budgetKeys.some((k) => Number(k) > 7)) {
          sessionStorage.removeItem(STORAGE_KEY);
        } else {
          return parsed;
        }
      }
    } catch {
      // Ignore parse errors or missing storage
    }
  }
  return {
    phase: "intro",
    forcedChoiceResponses: {},
    scaledResponses: {},
    budgetAllocations: createInitialBudget(),
    currentQuestionIndex: 0,
    randomSeed: Math.random(),
  };
}

interface QuizContextValue {
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
}

const QuizContext = createContext<QuizContextValue | null>(null);

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used within QuizProvider");
  return ctx;
}

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quizReducer, undefined, createInitialState);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or unavailable
    }
  }, [state]);

  return (
    <QuizContext.Provider value={{ state, dispatch }}>
      {children}
    </QuizContext.Provider>
  );
}
