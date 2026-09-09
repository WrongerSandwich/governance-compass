"use client";

interface ProgressBarProps {
  currentPhase: 1 | 2 | 3;
  currentIndex: number;
  totalInPhase: number;
}

const PHASE_LABELS = ["Dilemmas", "Scales", "Budget"];

/**
 * Mock 6b's progress header: a mono label row over three equal segments.
 *
 * The `data-progress-*` hooks exist so the test can address the row, the
 * tracks, and the fills without depending on DOM shape — this is a
 * presentational component whose whole contract is its treatment.
 */
export function ProgressBar({
  currentPhase,
  currentIndex,
  totalInPhase,
}: ProgressBarProps) {
  const progressInPhase =
    totalInPhase > 0 ? ((currentIndex + 1) / totalInPhase) * 100 : 0;

  return (
    <div className="mb-8">
      {/* Phase label and count — 11px mono, 0.10em, at the AA-clearing label
          colour. 10px above the segments, per the mock. */}
      <div
        data-progress-label
        className="flex justify-between label-nav text-text-label mb-2.5"
      >
        <span>
          Phase {currentPhase} &middot; {PHASE_LABELS[currentPhase - 1]}
        </span>
        {totalInPhase > 1 && (
          <span>
            {currentIndex + 1} of {totalInPhase}
          </span>
        )}
      </div>

      {/* 3-segment progress bar */}
      <div className="flex gap-1">
        {[1, 2, 3].map((phase) => {
          const isCompleted = phase < currentPhase;
          const isActive = phase === currentPhase;

          return (
            <div
              key={phase}
              data-progress-track
              className="flex-1 h-[3px] overflow-hidden bg-border-secondary"
            >
              <div
                data-progress-fill
                className={`h-full transition-all duration-300 ${
                  isCompleted || isActive ? "bg-stone-600" : "bg-transparent"
                }`}
                style={{
                  width: isCompleted
                    ? "100%"
                    : isActive
                      ? `${progressInPhase}%`
                      : "0%",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
