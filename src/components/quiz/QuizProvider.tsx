"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";

interface QuizAnswer {
  value: number | null;
  skipped: boolean;
}

interface QuizState {
  phase: "intro" | "questions" | "review" | "submitting";
  currentTopicIndex: number;
  answers: Record<string, QuizAnswer>;
}

type QuizAction =
  | { type: "START_QUIZ" }
  | { type: "SET_ANSWER"; questionId: string; value: number }
  | { type: "SKIP_QUESTION"; questionId: string }
  | { type: "NEXT_TOPIC" }
  | { type: "PREV_TOPIC" }
  | { type: "GO_TO_REVIEW" }
  | { type: "GO_TO_TOPIC"; index: number }
  | { type: "SUBMIT" };

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "START_QUIZ":
      return { ...state, phase: "questions", currentTopicIndex: 0 };
    case "SET_ANSWER":
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: { value: action.value, skipped: false },
        },
      };
    case "SKIP_QUESTION":
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: { value: null, skipped: true },
        },
      };
    case "NEXT_TOPIC":
      return { ...state, currentTopicIndex: state.currentTopicIndex + 1 };
    case "PREV_TOPIC":
      return { ...state, currentTopicIndex: state.currentTopicIndex - 1 };
    case "GO_TO_REVIEW":
      return { ...state, phase: "review" };
    case "GO_TO_TOPIC":
      return { ...state, phase: "questions", currentTopicIndex: action.index };
    case "SUBMIT":
      return { ...state, phase: "submitting" };
    default:
      return state;
  }
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
  const [state, dispatch] = useReducer(quizReducer, {
    phase: "intro",
    currentTopicIndex: 0,
    answers: {},
  });

  return (
    <QuizContext.Provider value={{ state, dispatch }}>
      {children}
    </QuizContext.Provider>
  );
}
