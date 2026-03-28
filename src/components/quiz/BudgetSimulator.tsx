"use client";

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

  function handleDecrement(ministryId: number) {
    const current = allocations[ministryId] ?? BASELINE;
    if (current <= MIN_ALLOCATION) return;
    onAllocate(ministryId, current - 1);
  }

  function handleIncrement(ministryId: number) {
    if (remaining <= 0) return;
    const current = allocations[ministryId] ?? BASELINE;
    onAllocate(ministryId, current + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Sticky treasury counter */}
      <div className="sticky top-0 z-10 bg-surface-2 rounded-[8px] px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-text-secondary">Discretionary remaining:</span>
        <span className="text-[16px] font-mono font-medium text-text-primary tabular-nums">
          {discretionaryRemaining} of {DISCRETIONARY}
        </span>
      </div>

      {/* Ministry list */}
      <div className="flex flex-col gap-3">
        {ministries.map((ministry) => {
          const amount = allocations[ministry.id] ?? BASELINE;
          const atMin = amount <= MIN_ALLOCATION;
          const atMax = remaining <= 0;
          const belowBaseline = amount < BASELINE;

          return (
            <div
              key={ministry.id}
              className="bg-surface-1 rounded-[12px] border border-border-secondary p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{ministry.name}</p>
                  <p className="mt-0.5 text-xs text-text-tertiary truncate">
                    {ministry.description}
                  </p>
                  {belowBaseline && (
                    <p className="mt-1 text-xs font-medium" style={{ color: 'var(--warning)' }}>
                      ! {ministry.belowBaselineWarning}
                    </p>
                  )}
                </div>

                {/* Stepper */}
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Decrease ${ministry.name} allocation`}
                    onClick={() => handleDecrement(ministry.id)}
                    disabled={atMin}
                    className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-border-primary bg-surface-1 text-text-secondary transition-colors duration-120 hover:bg-surface-2 focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="text-lg leading-none">&minus;</span>
                  </button>

                  <span className="w-10 text-center text-[16px] font-mono font-medium tabular-nums text-text-primary">
                    {amount}
                  </span>

                  <button
                    type="button"
                    aria-label={`Increase ${ministry.name} allocation`}
                    onClick={() => handleIncrement(ministry.id)}
                    disabled={atMax}
                    className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-border-primary bg-surface-1 text-text-secondary transition-colors duration-120 hover:bg-surface-2 focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="text-lg leading-none">+</span>
                  </button>
                </div>
              </div>
            </div>
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
