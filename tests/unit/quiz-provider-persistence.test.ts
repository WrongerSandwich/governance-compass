/**
 * @vitest-environment jsdom
 *
 * Regression cover for the "finishing the assessment traps the tab on the
 * computing screen" bug: the provider — not the flow component — owns the
 * saved-state lifecycle, and terminal phases are never written back.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { QuizProvider, useQuiz } from "@/components/quiz/QuizProvider";
import { STORAGE_KEY, createInitialBudget, type QuizState } from "@/lib/quiz-state";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

type Quiz = ReturnType<typeof useQuiz>;

/**
 * Mounts a real QuizProvider over jsdom's sessionStorage and hands back the
 * live context value, so these assertions exercise the actual persistence
 * effect rather than a re-implementation of it.
 */
function mountQuiz() {
  let captured: Quiz | null = null;
  function Probe() {
    captured = useQuiz();
    return null;
  }

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(createElement(QuizProvider, null, createElement(Probe)));
  });

  return {
    get result(): Quiz {
      if (!captured) throw new Error("QuizProvider did not render");
      return captured;
    },
    unmount() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

function savedState(): QuizState | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as QuizState) : null;
}

beforeEach(() => {
  sessionStorage.clear();
});

describe("QuizProvider persistence", () => {
  it("saves in-progress state so a refresh can resume", () => {
    const quiz = mountQuiz();

    act(() => quiz.result.dispatch({ type: "START_QUIZ" }));
    act(() => quiz.result.dispatch({ type: "SET_FC_RESPONSE", itemId: "FC-1", selectedPole: "A" }));

    expect(savedState()).toMatchObject({
      phase: "phase1",
      forcedChoiceResponses: { "FC-1": "A" },
    });
  });

  it("clears saved state when the quiz completes, and does not write it back", () => {
    const quiz = mountQuiz();

    act(() => quiz.result.dispatch({ type: "START_QUIZ" }));
    act(() => quiz.result.dispatch({ type: "SET_FC_RESPONSE", itemId: "FC-1", selectedPole: "A" }));
    expect(savedState()).not.toBeNull();

    // Finalize dispatches both, as handleBudgetFinalize does.
    act(() => {
      quiz.result.dispatch({ type: "START_COMPUTING" });
      quiz.result.dispatch({ type: "COMPLETE" });
    });

    expect(quiz.result.state.phase).toBe("done");
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("returning to the quiz after finishing starts at the intro, not the spinner", () => {
    const first = mountQuiz();
    act(() => first.result.dispatch({ type: "START_QUIZ" }));
    act(() => {
      first.result.dispatch({ type: "START_COMPUTING" });
      first.result.dispatch({ type: "COMPLETE" });
    });
    first.unmount();

    // Same tab, navigating back to /quiz — a fresh provider over the same storage.
    const second = mountQuiz();
    expect(second.result.state.phase).toBe("intro");
  });

  it("discards a hand-planted terminal state rather than restoring the spinner", () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        phase: "done",
        forcedChoiceResponses: {},
        scaledResponses: {},
        budgetAllocations: createInitialBudget(),
        currentQuestionIndex: 0,
        randomSeed: 0.5,
      })
    );

    const quiz = mountQuiz();

    expect(quiz.result.state.phase).toBe("intro");
    expect(savedState()?.phase).toBe("intro");
  });

  it("discards a corrupted payload instead of restoring a half-valid state", () => {
    // Passes the old budget-keys-only check, but the response maps are missing
    // and the index points past the end of the question bank.
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        phase: "phase1",
        budgetAllocations: createInitialBudget(),
        currentQuestionIndex: 40,
        randomSeed: 0.5,
      })
    );

    const quiz = mountQuiz();

    expect(quiz.result.state.phase).toBe("intro");
    expect(quiz.result.state.currentQuestionIndex).toBe(0);
    expect(quiz.result.state.budgetAllocations).toEqual(createInitialBudget());
  });

  it("RESET clears responses and leaves a fresh state in storage", () => {
    const quiz = mountQuiz();

    act(() => quiz.result.dispatch({ type: "START_QUIZ" }));
    act(() => quiz.result.dispatch({ type: "SET_SC_RESPONSE", itemId: "SC-1", value: 4 }));
    act(() => quiz.result.dispatch({ type: "RESET" }));

    expect(quiz.result.state.phase).toBe("intro");
    expect(quiz.result.state.scaledResponses).toEqual({});
    expect(savedState()).toMatchObject({ phase: "intro", scaledResponses: {} });
  });
});
