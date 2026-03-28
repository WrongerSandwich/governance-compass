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
      <div className="rounded-[12px] border border-border-secondary bg-surface-1 p-8 text-center">
        {/* Completion message */}
        <p className="text-[11px] uppercase tracking-[0.08em] text-stone-800 font-medium mb-2">
          Phase {completedPhase} complete
        </p>
        <p className="text-text-tertiary text-sm mb-6">
          You answered {completedCount} question{completedCount !== 1 ? "s" : ""}.
        </p>

        {/* Divider */}
        <div className="border-t border-border-secondary mb-6" />

        {/* Next phase info */}
        <p className="text-[11px] uppercase tracking-[0.08em] text-stone-800 font-medium mb-2">
          Up next
        </p>
        <h3 className="text-[18px] font-serif font-medium text-text-primary mb-2">
          {nextPhaseTitle}
        </h3>
        <p className="text-[13px] text-text-secondary mb-4">{nextPhaseDescription}</p>
        <p className="text-xs font-serif italic text-text-tertiary mb-8">
          Estimated time: {estimatedTime}
        </p>

        {/* CTA — ghost button (not one of the two filled buttons) */}
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-[12px] border border-stone-600 py-3 px-6 text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors duration-150 focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
