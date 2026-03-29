"use client";

interface ProgressBarProps {
  currentPhase: 1 | 2 | 3;
  currentIndex: number;
  totalInPhase: number;
}

const PHASE_LABELS = ["Dilemmas", "Scales", "Budget"];

export function ProgressBar({
  currentPhase,
  currentIndex,
  totalInPhase,
}: ProgressBarProps) {
  const progressInPhase =
    totalInPhase > 0 ? ((currentIndex + 1) / totalInPhase) * 100 : 0;

  return (
    <div className="mb-8">
      {/* Phase label and count */}
      <div className="flex justify-between text-xs text-text-secondary mb-2">
        <span>
          Phase {currentPhase}: {PHASE_LABELS[currentPhase - 1]}
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
              className="flex-1 h-[3px] overflow-hidden bg-border-tertiary"
            >
              <div
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
