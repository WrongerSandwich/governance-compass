"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { AnnotatedText } from "@/components/AnnotatedText";
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
 * `step` reports whether it actually moved the value; the repeat loop ends as
 * soon as it does not. Ending on the step itself matters because reaching the
 * bound also disables the button, and browsers that suppress pointer events on
 * disabled controls never deliver the `pointerup`/`pointerleave` that would
 * otherwise stop the loop — leaving a timer that resumes incrementing on its
 * own once the value became changeable again.
 */
function useStepper(step: () => boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(0);
  const repeatedRef = useRef(false);
  const stepRef = useRef(step);
  stepRef.current = step;

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    startTimeRef.current = Date.now();
    repeatedRef.current = false;
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

  // Track whether user has interacted (for suppressing initial state warnings)
  const [hasInteracted, setHasInteracted] = useState(false);
  useEffect(() => {
    if (allocated > ministries.length * MIN_ALLOCATION) setHasInteracted(true);
  }, [allocated, ministries.length]);

  return (
    <div className="flex flex-col gap-6">
      {/* Instruction text */}
      <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium text-center">
        You have {TOTAL_BUDGET} points to fund {ministries.length} ministries — there is not enough to fund everything well
      </p>

      {/* Sticky points remaining counter */}
      <div className="sticky top-0 z-10 bg-surface-2 rounded-[8px] px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-text-secondary">Points remaining</span>
        <span className="text-[16px] font-mono font-medium text-text-primary tabular-nums">
          {remaining}
          {canFinalize && (
            <span
              className="ml-2 text-xs font-sans font-medium text-stone-600"
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
            onAllocate={onAllocate}
          />
        ))}
      </div>

      {/* Confirm button — one of two filled buttons */}
      <div className="sticky bottom-0 z-10 -mx-4 border-t border-border-secondary bg-surface-1 px-4 py-4 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
        <button
          type="button"
          onClick={onFinalize}
          disabled={!canFinalize}
          className="w-full rounded-[12px] bg-stone-600 px-6 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-stone-700 focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:bg-stone-400 disabled:text-stone-200"
        >
          Confirm budget
        </button>
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
    <div className="bg-surface-1 rounded-[12px] border border-border-secondary p-4">
      <div className="mb-1">
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-text-secondary font-medium">
          {(() => { const Icon = MINISTRY_ICONS[ministry.id]; return Icon ? <Icon size={13} strokeWidth={1.5} className="shrink-0" /> : null; })()}
          {ministry.name}
        </p>
        <p className="text-xs text-text-tertiary mt-0.5">
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
          disabled={atMin}
          className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-border-primary bg-surface-1 text-text-secondary transition-colors duration-150 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-lg leading-none">&minus;</span>
        </button>

        <div className="flex-1 relative">
          {/* Track */}
          <div
            className="w-full h-[6px] rounded-[3px] overflow-hidden"
            style={{ backgroundColor: 'var(--border-secondary)' }}
          >
            <div
              className="h-full rounded-[3px] transition-all duration-100"
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
          disabled={atMax}
          className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-border-primary bg-surface-1 text-text-secondary transition-colors duration-150 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-lg leading-none">+</span>
        </button>
      </div>

      {/* Consequence text — Newsreader italic */}
      {hasInteracted && (
        <p
          key={consequenceText}
          className="text-xs font-serif italic text-text-secondary leading-relaxed mt-2"
          style={{ animation: "fade-in-up 200ms ease-out both" }}
        >
          <AnnotatedText text={consequenceText} />
        </p>
      )}
    </div>
  );
}
