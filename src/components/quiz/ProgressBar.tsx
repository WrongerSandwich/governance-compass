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
 *
 * The segment row carries `role="progressbar"`, so the bar is a progress
 * indicator to assistive technology rather than three anonymous divs. Two
 * consequences worth keeping in mind before editing:
 *
 *  - `progressbar` is children-presentational. The tracks and fills below it
 *    are dropped from the accessibility tree, and the role takes no name from
 *    its content — hence the authored `aria-label`.
 *  - The visible label row says exactly what the bar's name and value text
 *    say, so it is `aria-hidden`. One channel, not two. QuizFlow announces
 *    position separately from an `aria-live` region on each question screen;
 *    the bar must never grow one of its own.
 */
export function ProgressBar({
  currentPhase,
  currentIndex,
  totalInPhase,
}: ProgressBarProps) {
  const progressInPhase =
    totalInPhase > 0 ? ((currentIndex + 1) / totalInPhase) * 100 : 0;

  const phaseName = PHASE_LABELS[currentPhase - 1];
  // The ARIA value mirrors the fill: valuemax clamps to 1 so the degenerate
  // empty phase reports a valid range rather than a valuenow above its
  // valuemax, and valuenow stays at 0 there so the percentage a screen reader
  // computes agrees with the 0%-wide fill instead of contradicting it.
  const valueMax = Math.max(totalInPhase, 1);
  const valueNow = totalInPhase > 0 ? Math.min(currentIndex + 1, valueMax) : 0;
  // Authored for every phase that has screens, INCLUDING the single-screen
  // budget phase. aria-valuetext replaces the percentage the values would
  // otherwise be read as, and the budget's are 1 of 1 — so without it that
  // screen announces "100%" on arrival and never changes, calling the budget
  // finished before the first allocation is made. "1 of 1" is the same
  // vocabulary "36 of 36" uses on the last dilemma, and it is a position, not
  // a completion. The visible row drops the count as visual noise; that reason
  // does not carry to a channel where the alternative is a false claim.
  const valueText = totalInPhase > 0 ? `${valueNow} of ${totalInPhase}` : undefined;

  return (
    <div className="mb-8">
      {/* Phase label and count — 11px mono, 0.10em, at the AA-clearing label
          colour. 10px above the segments, per the mock. */}
      <div
        data-progress-label
        aria-hidden="true"
        className="flex justify-between label-nav text-text-label mb-2.5"
      >
        <span>
          Phase {currentPhase} &middot; {phaseName}
        </span>
        {totalInPhase > 1 && (
          <span>
            {valueNow} of {totalInPhase}
          </span>
        )}
      </div>

      {/* 3-segment progress bar */}
      <div
        className="flex gap-1"
        role="progressbar"
        // Spoken form of the row above: the middot reads as punctuation.
        aria-label={`Phase ${currentPhase} of 3, ${phaseName}`}
        aria-valuemin={0}
        aria-valuemax={valueMax}
        aria-valuenow={valueNow}
        aria-valuetext={valueText}
      >
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
