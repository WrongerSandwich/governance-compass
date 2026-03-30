"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnnotatedText } from "@/components/AnnotatedText";

const TOTAL_UNITS = 100;
const MIN_ALLOCATION = 5;
const BASELINE = 10;
const DISCRETIONARY = 50;

interface MinistryData {
  id: number;
  name: string;
  description: string;
  belowBaselineWarning: string;
}

interface BudgetSimulatorProps {
  ministries: MinistryData[];
  allocations: Record<number, number>;
  onAllocate: (ministryId: number, amount: number) => void;
  onFinalize: () => void;
}

/**
 * Hold-to-repeat hook for stepper buttons.
 * Fires immediately on press, then accelerates: 200ms delay, then every
 * 100ms, speeding to 50ms after 500ms of holding.
 */
function useHoldRepeat(callback: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(0);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    callbackRef.current();

    function tick() {
      callbackRef.current();
      const elapsed = Date.now() - startTimeRef.current;
      const interval = elapsed > 500 ? 50 : 100;
      timerRef.current = setTimeout(tick, interval);
    }

    timerRef.current = setTimeout(tick, 200);
  }, []);

  useEffect(() => stop, [stop]);

  return { start, stop };
}

export function BudgetSimulator({
  ministries,
  allocations,
  onAllocate,
  onFinalize,
}: BudgetSimulatorProps) {
  const allocated = Object.values(allocations).reduce((sum, v) => sum + v, 0);
  const remaining = TOTAL_UNITS - allocated;
  const discretionaryUsed = allocated - ministries.length * MIN_ALLOCATION;
  const discretionaryRemaining = DISCRETIONARY - discretionaryUsed;
  const canFinalize = remaining === 0;

  // Track whether the user has interacted (allocated any discretionary points)
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (discretionaryUsed > 0) setHasInteracted(true);
  }, [discretionaryUsed]);

  return (
    <div className="flex flex-col gap-6">
      {/* Instruction text */}
      <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium text-center">
        You have {DISCRETIONARY} points to distribute across {ministries.length} ministries — reducing any ministry below {BASELINE} has consequences
      </p>

      {/* Sticky treasury counter */}
      <div className="sticky top-0 z-10 bg-surface-2 rounded-[8px] px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-text-secondary">Discretionary remaining</span>
        <span className="text-[16px] font-mono font-medium text-text-primary tabular-nums">
          {discretionaryRemaining}
          {canFinalize && (
            <span
              className="ml-2 text-xs font-sans font-medium text-stone-600"
              style={{ animation: "fade-in-up 200ms ease-out both" }}
            >
              Balanced
            </span>
          )}
        </span>
      </div>

      {/* Ministry list */}
      <div className="flex flex-col gap-3">
        {ministries.map((ministry) => {
          const amount = allocations[ministry.id] ?? BASELINE;
          const belowBaseline = amount < BASELINE;
          const showWarning = belowBaseline && hasInteracted;

          return (
            <MinistryCard
              key={ministry.id}
              ministry={ministry}
              amount={amount}
              remaining={remaining}
              showWarning={showWarning}
              onDecrement={() => {
                const current = allocations[ministry.id] ?? BASELINE;
                if (current > MIN_ALLOCATION) onAllocate(ministry.id, current - 1);
              }}
              onIncrement={() => {
                if (remaining > 0) {
                  const current = allocations[ministry.id] ?? BASELINE;
                  onAllocate(ministry.id, current + 1);
                }
              }}
            />
          );
        })}
      </div>

      {/* Finalize button — full width, one of two filled buttons */}
      <div className="sticky bottom-0 z-10 -mx-4 border-t border-border-secondary bg-surface-1 px-4 py-4 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
        <button
          type="button"
          onClick={onFinalize}
          disabled={!canFinalize}
          className="w-full rounded-[12px] bg-stone-600 px-6 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-stone-700 focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:bg-stone-400 disabled:text-stone-200"
        >
          Finalize budget
        </button>
      </div>
    </div>
  );
}

// ---------- Ministry card with hold-to-repeat steppers ----------

interface MinistryCardProps {
  ministry: MinistryData;
  amount: number;
  remaining: number;
  showWarning: boolean;
  onDecrement: () => void;
  onIncrement: () => void;
}

function MinistryCard({
  ministry,
  amount,
  remaining,
  showWarning,
  onDecrement,
  onIncrement,
}: MinistryCardProps) {
  const atMin = amount <= MIN_ALLOCATION;
  const atMax = remaining <= 0;

  const dec = useHoldRepeat(onDecrement);
  const inc = useHoldRepeat(onIncrement);

  return (
    <div className="bg-surface-1 rounded-[12px] border border-border-secondary p-4">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">{ministry.name}</p>
          <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">
            <AnnotatedText text={ministry.description} />
          </p>
          {showWarning && (
            <p className="mt-1.5 text-xs font-medium text-warning-text">
              {ministry.belowBaselineWarning}
            </p>
          )}
        </div>

        {/* Stepper — 44px touch targets on mobile, 32px on desktop */}
        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          <button
            type="button"
            aria-label={`Decrease ${ministry.name} allocation`}
            onPointerDown={atMin ? undefined : dec.start}
            onPointerUp={dec.stop}
            onPointerLeave={dec.stop}
            disabled={atMin}
            className="flex h-11 w-11 min-[560px]:h-8 min-[560px]:w-8 items-center justify-center rounded-[8px] border border-border-primary bg-surface-1 text-text-secondary transition-colors duration-150 hover:bg-surface-2 focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-lg leading-none">&minus;</span>
          </button>

          <span className="w-10 text-center text-[16px] font-mono font-medium tabular-nums text-text-primary">
            {amount}
          </span>

          <button
            type="button"
            aria-label={`Increase ${ministry.name} allocation`}
            onPointerDown={atMax ? undefined : inc.start}
            onPointerUp={inc.stop}
            onPointerLeave={inc.stop}
            disabled={atMax}
            className="flex h-11 w-11 min-[560px]:h-8 min-[560px]:w-8 items-center justify-center rounded-[8px] border border-border-primary bg-surface-1 text-text-secondary transition-colors duration-150 hover:bg-surface-2 focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-lg leading-none">+</span>
          </button>
        </div>
      </div>
    </div>
  );
}
