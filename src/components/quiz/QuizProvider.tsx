"use client";

import { createContext, useContext, useEffect, useReducer, type ReactNode } from "react";
import {
  STORAGE_KEY,
  createFreshQuizState,
  isResumablePhase,
  parseSavedQuizState,
  type QuizState,
} from "@/lib/quiz-state";

// QuizState has always been part of this module's surface; the storage contract
// itself now lives in @/lib/quiz-state.
export type { QuizPhase, QuizState } from "@/lib/quiz-state";

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
      // Storage is the persistence effect's business, not the reducer's.
      return createFreshQuizState();
    default:
      return state;
  }
}

function createInitialState(): QuizState {
  if (typeof window !== "undefined") {
    try {
      // Anything stale, tampered with, or left over from an older quiz version
      // is discarded rather than restored into a half-valid render.
      const restored = parseSavedQuizState(sessionStorage.getItem(STORAGE_KEY));
      if (restored) return restored;
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable (private mode, blocked cookies) — start fresh
    }
  }
  return createFreshQuizState();
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

  // Single owner of the saved-state lifecycle. Terminal phases ("computing",
  // "done") are cleared instead of written: the responses are already on their
  // way to /results, and a saved "done" state would strand the next visit to
  // /quiz on the computing spinner.
  useEffect(() => {
    try {
      if (isResumablePhase(state.phase)) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
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
