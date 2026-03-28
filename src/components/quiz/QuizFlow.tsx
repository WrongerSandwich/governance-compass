"use client";

import { useCallback, useMemo, useState } from "react";
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
  headlineA: string;
  bodyA: string;
  headlineB: string;
  bodyB: string;
}

interface ScaledItemData {
  id: string;
  axisId: number;
  itemNumber: number;
  questionStem: string;
  option1Label: string;
  option1Detail: string;
  option2Label: string;
  option2Detail: string;
  option3Label: string;
  option3Detail: string;
  option4Label: string;
  option4Detail: string;
  option5Label: string;
  option5Detail: string;
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
  const [submitError, setSubmitError] = useState<string | null>(null);

  const shuffledFC = useMemo(
    () => seededShuffle(forcedChoiceItems, Math.floor(state.randomSeed * 2147483647)),
    [forcedChoiceItems, state.randomSeed]
  );

  const shuffledSC = useMemo(
    () => seededShuffle(scaledItems, Math.floor(state.randomSeed * 2147483647) + 1),
    [scaledItems, state.randomSeed]
  );

  // ---------- FC handlers ----------

  const handleFCSelect = useCallback(
    (itemId: string, pole: "A" | "B") => {
      dispatch({ type: "SET_FC_RESPONSE", itemId, selectedPole: pole });
    },
    [dispatch]
  );

  // ---------- SC handlers ----------

  const handleSCSelect = useCallback(
    (itemId: string, value: 1 | 2 | 3 | 4 | 5) => {
      dispatch({ type: "SET_SC_RESPONSE", itemId, value });
    },
    [dispatch]
  );

  // ---------- Budget handlers ----------

  const handleBudgetAllocate = useCallback(
    (ministryId: number, amount: number) => {
      dispatch({ type: "SET_BUDGET", ministryId, amount });
    },
    [dispatch]
  );

  const handleBudgetFinalize = useCallback(async () => {
    setSubmitError(null);
    dispatch({ type: "START_COMPUTING" });

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
        // Artificial delay per spec (1.5-2s) before redirect
        setTimeout(() => {
          router.push(`/results/${data.profileId}`);
        }, 1800);
      } else {
        setSubmitError("We couldn\u2019t save your results. Your answers are preserved \u2014 please try again.");
        dispatch({ type: "START_PHASE3" });
      }
    } catch {
      setSubmitError("We couldn\u2019t save your results. Your answers are preserved \u2014 please try again.");
      dispatch({ type: "START_PHASE3" });
    }
  }, [dispatch, state.forcedChoiceResponses, state.scaledResponses, state.budgetAllocations, router]);

  // ---------- navigation ----------

  const handlePrev = useCallback(() => {
    if (state.currentQuestionIndex > 0) {
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
      <div className="mx-auto max-w-[640px] py-12 text-center">
        <h1 className="text-[22px] font-serif font-medium text-text-primary mb-4">
          The governance compass
        </h1>
        <p className="text-sm text-text-secondary mb-2 leading-relaxed">
          A multi-dimensional assessment of your political priorities and values.
          You will work through three phases: dilemma choices, calibrated scales,
          and a budget allocation exercise.
        </p>
        <p className="text-xs font-serif italic text-text-tertiary mb-2">
          Estimated time: ~20 minutes
        </p>
        <p className="text-xs text-text-tertiary mb-8">
          Your progress is saved automatically — you can leave and return at any time.
        </p>
        <button
          type="button"
          onClick={() => dispatch({ type: "START_QUIZ" })}
          className="rounded-[12px] bg-stone-600 px-8 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-stone-700 focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2"
        >
          Begin assessment
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

        <div aria-live="polite" className="sr-only">
          Question {state.currentQuestionIndex + 1} of {shuffledFC.length}
        </div>

        <ForcedChoiceCard
          key={item.id}
          itemId={item.id}
          headlineA={item.headlineA}
          bodyA={item.bodyA}
          headlineB={item.headlineB}
          bodyB={item.bodyB}
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
            className="rounded-[8px] border border-border-primary px-6 py-2.5 text-sm text-text-secondary transition-colors duration-150 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!hasResponse}
            className="rounded-[8px] border border-stone-600 px-6 py-2.5 text-sm text-stone-600 transition-colors duration-150 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state.currentQuestionIndex === shuffledFC.length - 1
              ? "Continue"
              : "Next"}
          </button>
        </div>
        {!hasResponse && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={handleNext}
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors duration-150"
            >
              Skip this question
            </button>
          </div>
        )}
      </div>
    );
  }

  // Transition 1 -> Phase 2
  if (state.phase === "transition1") {
    return (
      <PhaseTransition
        completedPhase={1}
        completedCount={Object.keys(state.forcedChoiceResponses).length}
        nextPhaseTitle="Calibrated scales"
        nextPhaseDescription="Now you will place yourself on a series of nuanced scales — from one governance philosophy to its counterpart — giving us a finer-grained picture of your views."
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

        <div aria-live="polite" className="sr-only">
          Question {state.currentQuestionIndex + 1} of {shuffledSC.length}
        </div>

        <ScaledQuestionCard
          key={item.id}
          questionStem={item.questionStem}
          option1Label={item.option1Label}
          option1Detail={item.option1Detail}
          option2Label={item.option2Label}
          option2Detail={item.option2Detail}
          option3Label={item.option3Label}
          option3Detail={item.option3Detail}
          option4Label={item.option4Label}
          option4Detail={item.option4Detail}
          option5Label={item.option5Label}
          option5Detail={item.option5Detail}
          selectedValue={state.scaledResponses[item.id]}
          onSelect={(value) => handleSCSelect(item.id, value)}
        />

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirst}
            className="rounded-[8px] border border-border-primary px-6 py-2.5 text-sm text-text-secondary transition-colors duration-150 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!hasResponse}
            className="rounded-[8px] border border-stone-600 px-6 py-2.5 text-sm text-stone-600 transition-colors duration-150 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state.currentQuestionIndex === shuffledSC.length - 1
              ? "Continue"
              : "Next"}
          </button>
        </div>
        {!hasResponse && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={handleNext}
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors duration-150"
            >
              Skip this question
            </button>
          </div>
        )}
      </div>
    );
  }

  // Transition 2 -> Phase 3
  if (state.phase === "transition2") {
    return (
      <PhaseTransition
        completedPhase={2}
        completedCount={Object.keys(state.scaledResponses).length}
        nextPhaseTitle="The chancellor's budget"
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

        {submitError && (
          <div className="mb-6 rounded-[8px] border border-warning bg-warning-bg p-4 text-sm text-warning-text" role="alert">
            {submitError}
          </div>
        )}

        <BudgetSimulator
          ministries={ministries}
          allocations={state.budgetAllocations}
          onAllocate={handleBudgetAllocate}
          onFinalize={handleBudgetFinalize}
        />
      </div>
    );
  }

  // Computing / submitting — thin animated Stone 600 line
  if (state.phase === "computing" || state.phase === "done") {
    return (
      <div className="mx-auto max-w-lg py-24 text-center" aria-live="polite" aria-busy="true">
        {/* Animated loading line (keyframe defined in globals.css) */}
        <div className="w-full h-[2px] bg-border-tertiary rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-stone-600 rounded-full"
            style={{
              animation: 'loading-slide 1.5s ease-in-out infinite',
              width: '40%',
            }}
          />
        </div>
        <h2 className="text-[18px] font-serif font-medium text-text-primary mb-2">
          Computing your results
        </h2>
        <p className="text-sm text-text-tertiary">
          Analyzing your responses across all three modalities...
        </p>
      </div>
    );
  }

  return null;
}
