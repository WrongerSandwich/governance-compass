"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuiz } from "./QuizProvider";
import { ForcedChoiceCard } from "./ForcedChoiceCard";
import { ScaledQuestionCard } from "./ScaledQuestionCard";
import { BudgetSimulator } from "./BudgetSimulator";
import { PhaseTransition } from "./PhaseTransition";
import { ProgressBar } from "./ProgressBar";

// ---------- data types coming from the server component ----------

interface ForcedChoiceItemData {
  id: string;
  axisId: number;
  itemNumber: number;
  questionType: string;
  abstractionLevel: string;
  statementA: string;
  statementB: string;
}

interface ScaledItemData {
  id: string;
  axisId: number;
  itemNumber: number;
  questionStem: string;
  option1Text: string;
  option2Text: string;
  option3Text: string;
  option4Text: string;
  option5Text: string;
}

interface MinistryData {
  id: number;
  name: string;
  description: string;
  belowBaselineWarning: string;
}

export interface QuizFlowProps {
  forcedChoiceItems: ForcedChoiceItemData[];
  scaledItems: ScaledItemData[];
  ministries: MinistryData[];
}

// ---------- seeded shuffle ----------

function seededShuffle<T>(array: T[], seed: number): T[] {
  const out = [...array];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    // Simple LCG-style PRNG
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------- component ----------

export function QuizFlow({
  forcedChoiceItems,
  scaledItems,
  ministries,
}: QuizFlowProps) {
  const { state, dispatch } = useQuiz();
  const router = useRouter();
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shuffled item orders, stable for the lifetime of the quiz
  const shuffledFC = useMemo(
    () => seededShuffle(forcedChoiceItems, Math.floor(state.randomSeed * 2147483647)),
    [forcedChoiceItems, state.randomSeed]
  );

  const shuffledSC = useMemo(
    () => seededShuffle(scaledItems, Math.floor(state.randomSeed * 2147483647) + 1),
    [scaledItems, state.randomSeed]
  );

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, []);

  // ---------- FC handlers ----------

  const handleFCSelect = useCallback(
    (itemId: string, pole: "A" | "B") => {
      dispatch({ type: "SET_FC_RESPONSE", itemId, selectedPole: pole });

      // Auto-advance after a short delay
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = setTimeout(() => {
        if (state.currentQuestionIndex < shuffledFC.length - 1) {
          dispatch({ type: "NEXT_QUESTION" });
        } else {
          dispatch({ type: "COMPLETE_PHASE1" });
        }
      }, 400);
    },
    [dispatch, state.currentQuestionIndex, shuffledFC.length]
  );

  // ---------- SC handlers ----------

  const handleSCSelect = useCallback(
    (itemId: string, value: 1 | 2 | 3 | 4 | 5) => {
      dispatch({ type: "SET_SC_RESPONSE", itemId, value });

      // Auto-advance after a short delay
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = setTimeout(() => {
        if (state.currentQuestionIndex < shuffledSC.length - 1) {
          dispatch({ type: "NEXT_QUESTION" });
        } else {
          dispatch({ type: "COMPLETE_PHASE2" });
        }
      }, 400);
    },
    [dispatch, state.currentQuestionIndex, shuffledSC.length]
  );

  // ---------- Budget handlers ----------

  const handleBudgetAllocate = useCallback(
    (ministryId: number, amount: number) => {
      dispatch({ type: "SET_BUDGET", ministryId, amount });
    },
    [dispatch]
  );

  const handleBudgetFinalize = useCallback(async () => {
    dispatch({ type: "START_COMPUTING" });

    // Build submission payload
    const forcedChoiceResponses = Object.entries(state.forcedChoiceResponses).map(
      ([itemId, selectedPole]) => ({ itemId, selectedPole })
    );
    const scaledResponses = Object.entries(state.scaledResponses).map(
      ([itemId, value]) => ({ itemId, value })
    );
    const budgetAllocations = Object.entries(state.budgetAllocations).map(
      ([ministryId, amount]) => ({ ministryId: Number(ministryId), amount })
    );

    const token = localStorage.getItem("anonymousToken") || undefined;

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          forcedChoiceResponses,
          scaledResponses,
          budgetAllocations,
          anonymousToken: token,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("anonymousToken", data.anonymousToken);
        localStorage.setItem("profileId", data.profileId);
        dispatch({ type: "COMPLETE" });
        router.push(`/results/${data.profileId}`);
      } else {
        // On failure, revert to phase3 so user can retry
        dispatch({ type: "START_PHASE3" });
      }
    } catch {
      dispatch({ type: "START_PHASE3" });
    }
  }, [dispatch, state.forcedChoiceResponses, state.scaledResponses, state.budgetAllocations, router]);

  // ---------- navigation ----------

  const handlePrev = useCallback(() => {
    if (state.currentQuestionIndex > 0) {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      dispatch({ type: "PREV_QUESTION" });
    }
  }, [dispatch, state.currentQuestionIndex]);

  const handleNext = useCallback(() => {
    if (state.phase === "phase1") {
      if (state.currentQuestionIndex < shuffledFC.length - 1) {
        dispatch({ type: "NEXT_QUESTION" });
      } else {
        dispatch({ type: "COMPLETE_PHASE1" });
      }
    } else if (state.phase === "phase2") {
      if (state.currentQuestionIndex < shuffledSC.length - 1) {
        dispatch({ type: "NEXT_QUESTION" });
      } else {
        dispatch({ type: "COMPLETE_PHASE2" });
      }
    }
  }, [dispatch, state.phase, state.currentQuestionIndex, shuffledFC.length, shuffledSC.length]);

  // ---------- renders ----------

  // Intro screen
  if (state.phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          The Governance Compass
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          A multi-dimensional assessment of your political priorities and values.
          You will work through three phases: dilemma choices, calibrated scales,
          and a budget allocation exercise.
        </p>
        <p className="text-gray-500 mb-8">
          Estimated time: ~20 minutes
        </p>
        <button
          type="button"
          onClick={() => dispatch({ type: "START_QUIZ" })}
          className="rounded-lg bg-indigo-600 px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Begin Assessment
        </button>
      </div>
    );
  }

  // Phase 1: Forced-choice dilemmas
  if (state.phase === "phase1") {
    const item = shuffledFC[state.currentQuestionIndex];
    const isFirst = state.currentQuestionIndex === 0;
    const hasResponse = item.id in state.forcedChoiceResponses;

    return (
      <div className="mx-auto max-w-2xl py-8">
        <ProgressBar
          currentPhase={1}
          currentIndex={state.currentQuestionIndex}
          totalInPhase={shuffledFC.length}
        />

        <ForcedChoiceCard
          key={item.id}
          itemId={item.id}
          statementA={item.statementA}
          statementB={item.statementB}
          questionType={item.questionType as "FC" | "PT"}
          selectedPole={state.forcedChoiceResponses[item.id]}
          onSelect={(pole) => handleFCSelect(item.id, pole)}
          randomizeOrder
        />

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirst}
            className="rounded-lg bg-gray-100 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!hasResponse}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {state.currentQuestionIndex === shuffledFC.length - 1
              ? "Continue"
              : "Next"}
          </button>
        </div>
      </div>
    );
  }

  // Transition 1 -> Phase 2
  if (state.phase === "transition1") {
    return (
      <PhaseTransition
        completedPhase={1}
        completedCount={Object.keys(state.forcedChoiceResponses).length}
        nextPhaseTitle="Calibrated Scales"
        nextPhaseDescription="Now you will rate your position on a series of nuanced statements, giving us a finer-grained picture of your views."
        estimatedTime="~8 minutes"
        onContinue={() => dispatch({ type: "START_PHASE2" })}
      />
    );
  }

  // Phase 2: Scaled questions
  if (state.phase === "phase2") {
    const item = shuffledSC[state.currentQuestionIndex];
    const isFirst = state.currentQuestionIndex === 0;
    const hasResponse = item.id in state.scaledResponses;

    return (
      <div className="mx-auto max-w-2xl py-8">
        <ProgressBar
          currentPhase={2}
          currentIndex={state.currentQuestionIndex}
          totalInPhase={shuffledSC.length}
        />

        <ScaledQuestionCard
          key={item.id}
          itemId={item.id}
          questionStem={item.questionStem}
          option1Text={item.option1Text}
          option2Text={item.option2Text}
          option3Text={item.option3Text}
          option4Text={item.option4Text}
          option5Text={item.option5Text}
          selectedValue={state.scaledResponses[item.id]}
          onSelect={(value) => handleSCSelect(item.id, value)}
        />

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirst}
            className="rounded-lg bg-gray-100 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!hasResponse}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {state.currentQuestionIndex === shuffledSC.length - 1
              ? "Continue"
              : "Next"}
          </button>
        </div>
      </div>
    );
  }

  // Transition 2 -> Phase 3
  if (state.phase === "transition2") {
    return (
      <PhaseTransition
        completedPhase={2}
        completedCount={Object.keys(state.scaledResponses).length}
        nextPhaseTitle="The Chancellor's Budget"
        nextPhaseDescription="Finally, allocate a fixed budget across government ministries. Your spending choices reveal priorities beyond what words alone can capture."
        estimatedTime="~4 minutes"
        onContinue={() => dispatch({ type: "START_PHASE3" })}
      />
    );
  }

  // Phase 3: Budget simulator
  if (state.phase === "phase3") {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <ProgressBar currentPhase={3} currentIndex={0} totalInPhase={1} />

        <BudgetSimulator
          ministries={ministries}
          allocations={state.budgetAllocations}
          onAllocate={handleBudgetAllocate}
          onFinalize={handleBudgetFinalize}
        />
      </div>
    );
  }

  // Computing / submitting
  if (state.phase === "computing" || state.phase === "done") {
    return (
      <div className="mx-auto max-w-lg py-24 text-center">
        <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Computing your results
        </h2>
        <p className="text-gray-500">
          Analyzing your responses across all three modalities...
        </p>
      </div>
    );
  }

  // Fallback (should not reach)
  return null;
}
