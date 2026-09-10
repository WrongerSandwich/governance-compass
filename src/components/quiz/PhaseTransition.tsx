"use client";

import { GovernanceCompassMark } from "../GovernanceCompassMark";
import { Button } from "@/components/Button";

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
      <div className="rounded-sharp border border-border-secondary bg-surface-1 p-8 text-center">
        {/* Contour mark as chapter break */}
        <GovernanceCompassMark size={32} className="mx-auto mb-4" animate />

        {/* Completion message */}
        <p className="label text-text-label mb-2">Phase {completedPhase} complete</p>
        <p className="text-[13.5px] leading-[1.6] text-text-secondary mb-6">
          Your {completedCount} responses have been recorded.
        </p>

        {/* Divider */}
        <div className="border-t border-border-secondary mb-6" />

        {/* Next phase info. `text-stone-800` used to sit here — a fixed ramp
            value on an inverting surface, so it went near-invisible in dark. */}
        <p className="label text-text-label mb-2">Up next</p>
        <h3 className="display-s text-text-primary mb-2">{nextPhaseTitle}</h3>
        <p className="text-[13.5px] leading-[1.6] text-text-secondary mb-4">
          {nextPhaseDescription}
        </p>
        <p className="caption-italic mb-8">Estimated time: {estimatedTime}</p>

        {/* The same forward action as Next, so the same ink fill (spec D1). */}
        <Button className="w-full" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
