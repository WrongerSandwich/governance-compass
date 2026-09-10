"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { AnnotatedText } from "@/components/AnnotatedText";
import { Button } from "@/components/Button";
import { getConsequenceText } from "@/data/ministries";
import { Shield, Heart, TrendingUp, GraduationCap, Leaf, Scale, Globe } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const MINISTRY_ICONS: Record<number, LucideIcon> = {
  1: Shield,
  2: Heart,
  3: TrendingUp,
  4: GraduationCap,
  5: Leaf,
  6: Scale,
  7: Globe,
};
import type { MinistryData } from "@/data/ministries";

const TOTAL_BUDGET = 50;
const MIN_ALLOCATION = 1;
const MAX_ALLOCATION = 25;

// Hold-to-repeat pacing for the stepper buttons.
const HOLD_DELAY_MS = 200;
const HOLD_INTERVAL_MS = 100;
const HOLD_FAST_INTERVAL_MS = 50;
const HOLD_ACCELERATE_AFTER_MS = 500;

interface BudgetSimulatorProps {
  ministries: MinistryData[];
  allocations: Record<number, number>;
  onAllocate: (ministryId: number, amount: number) => void;
  onFinalize: () => void;
}

/**
 * Stepper-button behaviour: one step per `click`, plus hold-to-repeat while a
 * pointer stays down.
 *
 * Stepping hangs off `click` rather than `pointerdown` so that keyboard
 * activation (Enter/Space, which fires `click` and never `pointerdown`) works —
 * without it the budget phase, and therefore the assessment, cannot be
 * completed without a pointing device.
 *
 * `step` reports whether it actually moved the value, and the repeat loop ends
 * as soon as it does not. Terminating on the step itself, rather than on a
 * pointer event, is what keeps a hold from running away: the release can always
 * land somewhere the button never hears about, and a loop that outlives its
 * gesture resumes stepping the moment the value becomes changeable again.
 */
function useStepper(step: () => boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(0);
  const repeatedRef = useRef(false);
  const stepRef = useRef(step);
  stepRef.current = step;

  // A named function expression so the listener it detaches is itself — the
  // same instance `useCallback` hands back on every render.
  const stop = useCallback(function stopHold() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    window.removeEventListener("pointerup", stopHold);
    window.removeEventListener("pointercancel", stopHold);
    window.removeEventListener("blur", stopHold);
  }, []);

  const start = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    // Only a primary-button press is an activation. A right- or middle-press
    // produces no `click` and, once the context menu takes the pointer, often
    // no `pointerup` either — it would hold the repeat all the way to the bound.
    if (event.button !== 0 || !event.isPrimary) return;

    stop();
    startTimeRef.current = Date.now();
    repeatedRef.current = false;

    // The button's own pointer handlers miss releases that land elsewhere —
    // outside the window, or after an alt-tab. Watch for those too.
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    window.addEventListener("blur", stop);

    function tick() {
      if (!stepRef.current()) {
        stop();
        return;
      }
      repeatedRef.current = true;
      const elapsed = Date.now() - startTimeRef.current;
      timerRef.current = setTimeout(
        tick,
        elapsed > HOLD_ACCELERATE_AFTER_MS ? HOLD_FAST_INTERVAL_MS : HOLD_INTERVAL_MS,
      );
    }
    timerRef.current = setTimeout(tick, HOLD_DELAY_MS);
  }, [stop]);

  /**
   * A pointer hold still ends with a `click`; swallow that one so holding does
   * not tack an extra step onto the repeats. `detail === 0` marks a keyboard
   * activation, which never goes through the hold path and so always steps.
   */
  const click = useCallback((event: ReactMouseEvent<HTMLButtonElement>) => {
    if (event.detail !== 0 && repeatedRef.current) return;
    stepRef.current();
  }, []);

  useEffect(() => stop, [stop]);
  return { start, stop, click };
}

export function BudgetSimulator({
  ministries,
  allocations,
  onAllocate,
  onFinalize,
}: BudgetSimulatorProps) {
  const allocated = Object.values(allocations).reduce((sum, v) => sum + v, 0);
  const remaining = TOTAL_BUDGET - allocated;
  const canFinalize = remaining === 0;

  // Consequence text stays hidden until the user has moved something, so the
  // opening screen isn't a wall of warnings about allocations they didn't
  // choose. Two ways to have moved something: a resumed session mounts with
  // points already spent (QuizProvider restores budgetAllocations from
  // sessionStorage), or an allocation happens while we're on screen. The
  // latch reads the total once at mount for the first and follows the
  // allocate event after that — the event is the more honest signal, since a
  // reallocation that leaves the total unchanged is still an interaction.
  const [hasInteracted, setHasInteracted] = useState(
    () => allocated > ministries.length * MIN_ALLOCATION
  );
  const handleAllocate = useCallback(
    (ministryId: number, amount: number) => {
      setHasInteracted(true);
      onAllocate(ministryId, amount);
    },
    [onAllocate]
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Instruction text. NOT the mono label role, despite 6b putting the
          question-screen instruction there: 6b's is 43 characters and fits one
          line, this is 85 and needs ~672px at 11px/0.12em — so it wrapped to two
          all-caps lines at EVERY width, and sat directly above `Points remaining`
          in the identical role, size and colour, which inverted the hierarchy.
          Prose, per the visual sweep. Precedent: QuizFlow.tsx's glossary hint. */}
      <p data-budget-instruction className="text-[12.5px] leading-[1.6] text-text-secondary text-center">
        You have {TOTAL_BUDGET} points to fund {ministries.length} ministries — there is not enough to fund everything well
      </p>

      {/* Sticky points-remaining counter. Delta 04: a card's own header sits
          over a 1px ink rule rather than inside a filled panel, and the quiz
          has already spent its two surface switches on ground and cards. */}
      <div
        data-budget-counter
        className="sticky top-0 z-10 -mx-[18px] flex items-center justify-between border-b border-rule-strong bg-surface-3 px-[18px] py-3 min-[560px]:mx-0 min-[560px]:px-0"
      >
        <span data-budget-counter-label className="label text-text-label">
          Points remaining
        </span>
        <span className="text-[16px] font-mono font-medium text-text-primary tabular-nums">
          {remaining}
          {canFinalize && (
            <span
              className="ml-2 label text-text-label"
              style={{ animation: "fade-in-up 200ms ease-out both" }}
            >
              All allocated
            </span>
          )}
        </span>
      </div>

      {/* Ministry list */}
      <div className="flex flex-col gap-5">
        {ministries.map((ministry) => (
          <MinistrySlider
            key={ministry.id}
            ministry={ministry}
            value={allocations[ministry.id] ?? MIN_ALLOCATION}
            remaining={remaining}
            hasInteracted={hasInteracted}
            onAllocate={handleAllocate}
          />
        ))}
      </div>

      {/* Confirm button — a primary assessment action. The bleed matches the
          page's own gutter (src/app/quiz/page.tsx), not Tailwind's px-4. */}
      <div
        data-budget-confirm
        className="sticky bottom-0 z-10 -mx-[18px] border-t border-rule-strong bg-surface-3 px-[18px] py-4 min-[560px]:static min-[560px]:mx-0 min-[560px]:border-0 min-[560px]:bg-transparent min-[560px]:px-0 min-[560px]:py-0"
      >
        <Button className="w-full" onClick={onFinalize} disabled={!canFinalize}>
          Confirm budget
        </Button>
      </div>
    </div>
  );
}

// ---------- Ministry slider card ----------

interface MinistrySliderProps {
  ministry: MinistryData;
  value: number;
  remaining: number;
  hasInteracted: boolean;
  onAllocate: (ministryId: number, amount: number) => void;
}

const STEPPER_BASE =
  "flex h-9 w-9 items-center justify-center rounded-sharp border border-border-primary " +
  "bg-surface-1 text-text-secondary transition-colors duration-150 focus-ring";

/**
 * Bounds are marked with `aria-disabled` rather than `disabled`: a disabled
 * control drops out of the tab order, and disabling the one the user just
 * pressed throws their focus to the top of the page — which is exactly what
 * happens when the last point is allocated and every "+" reaches its bound at
 * once. The step callbacks already no-op past a bound, so a stray activation
 * changes nothing.
 */
function stepperClass(atBound: boolean) {
  return `${STEPPER_BASE} ${atBound ? "cursor-not-allowed opacity-50" : "hover:bg-surface-2"}`;
}

function MinistrySlider({
  ministry,
  value,
  remaining,
  hasInteracted,
  onAllocate,
}: MinistrySliderProps) {
  const consequenceText = getConsequenceText(ministry, value);

  const atMin = value <= MIN_ALLOCATION;
  const atMax = value >= MAX_ALLOCATION || remaining <= 0;

  const handleDecrement = useCallback(() => {
    if (value <= MIN_ALLOCATION) return false;
    onAllocate(ministry.id, value - 1);
    return true;
  }, [ministry.id, value, onAllocate]);

  const handleIncrement = useCallback(() => {
    if (value >= MAX_ALLOCATION || remaining <= 0) return false;
    onAllocate(ministry.id, value + 1);
    return true;
  }, [ministry.id, value, remaining, onAllocate]);

  const dec = useStepper(handleDecrement);
  const inc = useStepper(handleIncrement);

  return (
    <div className="bg-surface-1 rounded-sharp border border-border-secondary p-4">
      <div className="mb-1">
        <p
          data-ministry-name
          className="flex items-center gap-1.5 label font-medium text-text-primary"
        >
          {(() => { const Icon = MINISTRY_ICONS[ministry.id]; return Icon ? <Icon size={13} strokeWidth={1.5} className="shrink-0" /> : null; })()}
          {ministry.name}
        </p>
        <p
          data-ministry-description
          className="text-[12.5px] leading-[1.6] text-text-secondary mt-1"
        >
          {ministry.description}
        </p>
      </div>

      {/* Stepper + value */}
      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          aria-label={`Decrease ${ministry.name} allocation`}
          onClick={dec.click}
          onPointerDown={dec.start}
          onPointerUp={dec.stop}
          onPointerLeave={dec.stop}
          onPointerCancel={dec.stop}
          aria-disabled={atMin}
          className={stepperClass(atMin)}
        >
          <span className="text-lg leading-none">&minus;</span>
        </button>

        <div className="flex-1 relative">
          {/* Track — square, per delta 05's data marks. */}
          <div
            data-budget-track
            className="w-full h-[6px] overflow-hidden"
            style={{ backgroundColor: 'var(--border-secondary)' }}
          >
            <div
              className="h-full transition-all duration-100"
              style={{
                width: `${Math.min(100, ((value - MIN_ALLOCATION) / (MAX_ALLOCATION - MIN_ALLOCATION)) * 100)}%`,
                backgroundColor: 'var(--stone-600)',
                opacity: 0.5,
              }}
            />
          </div>
        </div>

        <span className="w-7 text-center text-[14px] font-mono font-medium tabular-nums text-text-primary">
          {value}
        </span>

        <button
          type="button"
          aria-label={`Increase ${ministry.name} allocation`}
          onClick={inc.click}
          onPointerDown={inc.start}
          onPointerUp={inc.stop}
          onPointerLeave={inc.stop}
          onPointerCancel={inc.stop}
          aria-disabled={atMax}
          className={stepperClass(atMax)}
        >
          <span className="text-lg leading-none">+</span>
        </button>
      </div>

      {/* Consequence text — the serif italic caption role */}
      {hasInteracted && (
        <p
          key={consequenceText}
          data-ministry-consequence
          className="caption-italic mt-2"
          style={{ animation: "fade-in-up 200ms ease-out both" }}
        >
          <AnnotatedText text={consequenceText} />
        </p>
      )}
    </div>
  );
}
