"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuiz } from "./QuizProvider";
import { isResumablePhase } from "@/lib/quiz-state";
import { ForcedChoiceCard } from "./ForcedChoiceCard";
import { ScaledQuestionCard } from "./ScaledQuestionCard";
import { BudgetSimulator } from "./BudgetSimulator";
import { PhaseTransition } from "./PhaseTransition";
import { ProgressBar } from "./ProgressBar";
import { GovernanceCompassMark } from "../GovernanceCompassMark";
import { ComputingMessages } from "./ComputingMessages";
import { encodeResponses } from "@/lib/response-codec";
import type { QuizResponses } from "@/lib/scoring-types";
import { saveLastResults } from "@/lib/last-results";
import { Button } from "@/components/Button";

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

import type { MinistryData } from "@/data/ministries";

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

// ---------- shell metrics ----------

/** Mock 6b's body column: 672px wide, 36px above, 52px below. Gutters are the
 *  page's — `src/app/quiz/page.tsx` sets them to the nav's 18/28px so the
 *  column lines up with the wordmark. Extracted so a metric change lands in one
 *  place rather than drifting across the question screens. */
const QUESTION_SHELL = "mx-auto max-w-2xl pt-9 pb-[52px]";

// ---------- recovery ----------

/**
 * Shown when saved state points at a question that no longer exists — a
 * tampered payload, or a session saved before the question bank changed.
 * Better a deliberate reset than a crash mid-render.
 */
function UnrecoverableState({ onReset }: { onReset: () => void }) {
  return (
    <div className="mx-auto max-w-[640px] py-12 text-center">
      <GovernanceCompassMark size={36} className="mx-auto mb-4" />
      <h1 className="display-entry text-text-primary mb-2">We lost your place</h1>
      <p className="text-[13.5px] leading-[1.6] text-text-secondary mb-8">
        Your saved progress doesn&apos;t match the current assessment, so we can&apos;t pick
        it back up. Starting over takes about 16 minutes.
      </p>
      <Button variant="secondary" onClick={onReset}>
        Start over
      </Button>
    </div>
  );
}

// ---------- component ----------

export function QuizFlow({
  forcedChoiceItems,
  scaledItems,
  ministries,
}: QuizFlowProps) {
  const { state, dispatch } = useQuiz();
  const router = useRouter();
  const [finalizeError, setFinalizeError] = useState(false);

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

  const handleBudgetFinalize = useCallback(() => {
    const responses: QuizResponses = {
      forcedChoice: state.forcedChoiceResponses,
      scaled: state.scaledResponses,
      budget: state.budgetAllocations,
    };

    // Encode before leaving the budget screen: if this throws, the user keeps a
    // working Finalize button instead of being stranded on the spinner.
    let encoded: string;
    try {
      encoded = encodeResponses(responses);
    } catch (err) {
      console.error("Failed to encode quiz responses", err);
      setFinalizeError(true);
      return;
    }

    setFinalizeError(false);
    dispatch({ type: "START_COMPUTING" });

    // Storage full or unavailable is swallowed inside saveLastResults — the
    // results link is in the URL either way.
    saveLastResults(encoded);

    // The provider clears the saved quiz state once the phase goes terminal.
    dispatch({ type: "COMPLETE" });
    // Artificial delay per spec (1.5-2s) before redirect
    setTimeout(() => {
      router.push(`/results?r=${encoded}`);
    }, 1800);
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

  // ---------- resume detection ----------

  // Terminal phases are never resumable, so they can't reach the resume screen.
  const hasProgress = state.phase !== "intro" && isResumablePhase(state.phase);
  const answeredCount = Object.keys(state.forcedChoiceResponses).length + Object.keys(state.scaledResponses).length;
  // Only show resume screen if we mounted with saved progress (not intro).
  // Fresh starts begin at "intro" so this initializes to true, skipping resume.
  const [resumeAcknowledged, setResumeAcknowledged] = useState(() => state.phase === "intro");
  const [glossaryHintSeen] = useState(() => {
    if (typeof window === "undefined") return true;
    return !!sessionStorage.getItem("glossary-hint-seen");
  });

  // Show resume screen if we loaded into a mid-quiz state
  if (hasProgress && answeredCount > 0 && !resumeAcknowledged) {
    const phaseLabel =
      state.phase === "phase1" || state.phase === "transition1" ? "dilemmas" :
      state.phase === "phase2" || state.phase === "transition2" ? "scales" : "budget";

    return (
      <div className="mx-auto max-w-[640px] py-12 text-center">
        <GovernanceCompassMark size={36} className="mx-auto mb-4" />
        <h1 className="display-entry text-text-primary mb-2">Welcome back</h1>
        <p className="text-[13.5px] leading-[1.6] text-text-secondary mb-8">
          You have an assessment in progress — {answeredCount} responses recorded, currently in the {phaseLabel} phase.
        </p>
        <div className="flex flex-col items-center gap-3 max-w-xs mx-auto">
          <Button className="w-full" onClick={() => setResumeAcknowledged(true)}>
            Continue where I left off
          </Button>
          <button
            type="button"
            onClick={() => { dispatch({ type: "RESET" }); setResumeAcknowledged(true); }}
            className="label-nav text-text-label hover:text-text-primary transition-colors duration-150 focus-ring"
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  // ---------- renders ----------

  // Phase 1 interstitial (intro)
  if (state.phase === "intro") {
    return (
      <div className="mx-auto max-w-lg py-12">
        <div className="rounded-sharp border border-border-secondary bg-surface-1 p-8 text-center">
          <GovernanceCompassMark size={32} className="mx-auto mb-4" animate />

          <p className="label text-text-label mb-2">Phase 1 of 3</p>
          <h1 className="display-s text-text-primary mb-2">Governance dilemmas</h1>
          <p className="text-[13.5px] leading-[1.6] text-text-secondary mb-4">
            This first section presents pairs of statements about how a society
            should be governed. For each pair, choose the statement that comes
            closer to your view — even if neither is a perfect match. There are
            no right answers, and you can&apos;t choose both.
          </p>
          <p className="caption-italic mb-8">
            36 questions &middot; ~8 minutes &middot; Your progress is saved automatically
          </p>

          <Button className="w-full" onClick={() => dispatch({ type: "START_QUIZ" })}>
            Begin
          </Button>
        </div>
      </div>
    );
  }

  // Phase 1: Forced-choice dilemmas
  if (state.phase === "phase1") {
    const item = shuffledFC[state.currentQuestionIndex];
    if (!item) return <UnrecoverableState onReset={() => dispatch({ type: "RESET" })} />;
    const isFirst = state.currentQuestionIndex === 0;
    const hasResponse = item.id in state.forcedChoiceResponses;

    return (
      <div data-quiz-shell className={QUESTION_SHELL}>
        <ProgressBar
          currentPhase={1}
          currentIndex={state.currentQuestionIndex}
          totalInPhase={shuffledFC.length}
        />

        <div aria-live="polite" className="sr-only">
          Question {state.currentQuestionIndex + 1} of {shuffledFC.length}
        </div>

        {isFirst && !glossaryHintSeen && (
          <p className="text-[12.5px] leading-[1.6] text-text-secondary text-center mb-5">
            See a{" "}
            <span
              className="text-text-primary"
              style={{
                textDecoration: "underline",
                textDecorationStyle: "dotted",
                textDecorationColor: "#C4A84A",
                textUnderlineOffset: "3px",
              }}
            >
              highlighted term
            </span>
            ? Tap it for a plain-language definition.
          </p>
        )}

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

        <div className="mt-8 flex items-center justify-between gap-4">
          <Button variant="secondary" onClick={handlePrev} disabled={isFirst}>
            Previous
          </Button>
          <Button onClick={handleNext} disabled={!hasResponse}>
            {state.currentQuestionIndex === shuffledFC.length - 1
              ? "Continue"
              : "Next"}
          </Button>
        </div>
        {!hasResponse && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={handleNext}
              className="label-nav text-text-label hover:text-text-primary transition-colors duration-150 focus-ring"
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
        nextPhaseTitle="Nuanced scales"
        nextPhaseDescription="You're more than halfway done. This section is faster — most people spend about half as long per question. You'll place yourself on a series of nuanced scales, from one governance philosophy to its counterpart."
        estimatedTime="~5 minutes"
        onContinue={() => dispatch({ type: "START_PHASE2" })}
      />
    );
  }

  // Phase 2: Scaled questions
  if (state.phase === "phase2") {
    const item = shuffledSC[state.currentQuestionIndex];
    if (!item) return <UnrecoverableState onReset={() => dispatch({ type: "RESET" })} />;
    const isFirst = state.currentQuestionIndex === 0;
    const hasResponse = item.id in state.scaledResponses;

    return (
      <div data-quiz-shell className={QUESTION_SHELL}>
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

        <div className="mt-8 flex items-center justify-between gap-4">
          <Button variant="secondary" onClick={handlePrev} disabled={isFirst}>
            Previous
          </Button>
          <Button onClick={handleNext} disabled={!hasResponse}>
            {state.currentQuestionIndex === shuffledSC.length - 1
              ? "Continue"
              : "Next"}
          </Button>
        </div>
        {!hasResponse && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={handleNext}
              className="label-nav text-text-label hover:text-text-primary transition-colors duration-150 focus-ring"
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
        nextPhaseTitle="The Chancellor's Budget"
        nextPhaseDescription="You're now head of state. You have 50 points to allocate across 7 government ministries. Every point represents a real commitment — and there isn't enough to fund everything well. Watch what happens to each ministry as you decide what to prioritize — and what to sacrifice."
        estimatedTime="~3 minutes"
        onContinue={() => dispatch({ type: "START_PHASE3" })}
      />
    );
  }

  // Phase 3: Budget simulator
  if (state.phase === "phase3") {
    return (
      <div data-quiz-shell className={QUESTION_SHELL}>
        <ProgressBar currentPhase={3} currentIndex={0} totalInPhase={1} />

        {finalizeError && (
          <p
            role="alert"
            className="mb-4 border-l-2 border-warning bg-warning-bg px-4 py-3 text-[13.5px] leading-[1.6] text-warning-text"
          >
            Something went wrong finalizing your budget. Your answers are still here — please try again.
          </p>
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
        <GovernanceCompassMark size={36} className="mx-auto mb-6" />
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
        <h2 className="display-s text-text-primary mb-2">Computing your results</h2>
        <ComputingMessages />
      </div>
    );
  }

  return null;
}
