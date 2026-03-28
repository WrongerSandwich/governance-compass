"use client";

interface PhaseTransitionProps {
  completedPhase: number;
  completedCount: number;
  nextPhaseTitle: string;
  nextPhaseDescription: string;
  estimatedTime: string;
  onContinue: () => void;
}

export function PhaseTransition({
  completedPhase,
  completedCount,
  nextPhaseTitle,
  nextPhaseDescription,
  estimatedTime,
  onContinue,
}: PhaseTransitionProps) {
  return (
    <div className="mx-auto max-w-lg py-12">
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm text-center">
        {/* Completion badge */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
          <svg
            className="h-8 w-8 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>

        {/* Completion message */}
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Phase {completedPhase} Complete
        </h2>
        <p className="text-gray-500 mb-6">
          You answered {completedCount} question{completedCount !== 1 ? "s" : ""}.
          Great work!
        </p>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-6" />

        {/* Next phase info */}
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-2">
          Up next
        </p>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {nextPhaseTitle}
        </h3>
        <p className="text-sm text-gray-600 mb-4">{nextPhaseDescription}</p>
        <p className="text-sm text-gray-400 mb-8">
          Estimated time:&nbsp;
          <span className="font-medium text-gray-600">{estimatedTime}</span>
        </p>

        {/* CTA */}
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-lg bg-indigo-600 py-3 px-6 text-base font-medium text-white hover:bg-indigo-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
