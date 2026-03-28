"use client";

const TOTAL_UNITS = 100;
const MIN_ALLOCATION = 5;
const BASELINE = 10;

interface MinistryData {
  id: number;
  name: string;
  description: string;
  belowBaselineWarning: string;
}

interface BudgetSimulatorProps {
  ministries: MinistryData[];
  allocations: Record<number, number>; // ministryId → amount
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

  const treasuryBadge = (
    <div
      className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${
        remaining === 0
          ? "bg-green-100 text-green-800"
          : remaining < 0
            ? "bg-red-100 text-red-800"
            : "bg-indigo-100 text-indigo-800"
      }`}
    >
      <span>Remaining:</span>
      <span className="text-base tabular-nums">{remaining} units</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              The Chancellor&apos;s Budget
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Allocate exactly{" "}
              <span className="font-medium text-indigo-700">{TOTAL_UNITS}</span>{" "}
              units across all {ministries.length} ministries. Each ministry
              requires a minimum of{" "}
              <span className="font-medium">{MIN_ALLOCATION}</span> units.
              Baseline funding is{" "}
              <span className="font-medium">{BASELINE}</span> — allocating below
              it has trade-offs.
            </p>
          </div>
          <div className="shrink-0">{treasuryBadge}</div>
        </div>
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
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                {/* Ministry info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{ministry.name}</p>
                  <p className="mt-0.5 text-sm text-gray-500 truncate">
                    {ministry.description}
                  </p>
                  {belowBaseline && (
                    <p className="mt-1 text-xs font-medium text-amber-600">
                      {ministry.belowBaselineWarning}
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
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="text-lg font-bold leading-none">−</span>
                  </button>

                  <span className="w-10 text-center text-base font-semibold tabular-nums text-gray-900">
                    {amount}
                  </span>

                  <button
                    type="button"
                    aria-label={`Increase ${ministry.name} allocation`}
                    onClick={() => handleIncrement(ministry.id)}
                    disabled={atMax}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="text-lg font-bold leading-none">+</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky footer on mobile / normal footer on desktop */}
      <div className="sticky bottom-0 z-10 -mx-4 border-t border-gray-200 bg-white px-4 py-4 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="sm:hidden">{treasuryBadge}</div>
          <div className="hidden sm:block" aria-hidden="true" />
          <button
            type="button"
            onClick={onFinalize}
            disabled={!canFinalize}
            className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 sm:w-auto"
          >
            Finalize Budget
          </button>
        </div>
      </div>
    </div>
  );
}
