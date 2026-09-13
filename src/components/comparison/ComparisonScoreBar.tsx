"use client";

import { PairedAxisScale, describeGap } from "@/components/PairedAxisScale";
import { getDomainMarkVar } from "@/lib/design-tokens";
import { formatScore } from "@/lib/format-score";

interface ComparisonScoreBarProps {
  axisId: number;
  axisName: string;
  tagline: string;
  scoreA: number;
  scoreB: number;
  poleALabel: string;
  poleBLabel: string;
  labelA: string;
  labelB: string;
  alternateRow?: boolean;
}

/**
 * One axis for two respondents, as row chrome around `PairedAxisScale`.
 *
 * The hover tooltips this replaced were mouse-only — no keyboard path, no
 * screen-reader path — and showed the same numbers the readouts below now
 * show permanently. Note that the dot roles are the primitive's, not this
 * component's former ones: respondent A is the FILLED domain dot and
 * respondent B the outlined one, which is the reverse of what shipped. The
 * legend on `/compare` names them in that order.
 *
 * `delta` is not a prop: it is derived here from the same two scores the
 * scale draws, so the visible gap badge and the scale's `aria-label` can
 * never disagree by construction. (An earlier version of this task kept
 * `delta` as an incoming prop, mirroring `compareProfiles`'s own field of the
 * same name — but that gave the badge and the scale two independent code
 * paths for one number, which is exactly the kind of duplication this
 * convergence exists to remove.)
 */
export function ComparisonScoreBar({
  axisId,
  axisName,
  tagline,
  scoreA,
  scoreB,
  poleALabel,
  poleBLabel,
  labelA,
  labelB,
  alternateRow = false,
}: ComparisonScoreBarProps) {
  const delta = Math.abs(scoreA - scoreB);

  return (
    <div className={`rounded-sharp px-3 py-[9px] ${alternateRow ? "bg-surface-2" : ""}`}>
      <div className="flex items-baseline justify-between gap-3 mb-0.5">
        <span className="body-s text-text-primary">{axisName}</span>
        {/* aria-hidden: byte-identical to the scale's aria-label trailing
            clause below, so a screen reader would otherwise hear it twice
            per row, twelve times down the page. */}
        <span data-gap aria-hidden="true" className="mono-meta text-text-label shrink-0">
          {describeGap(delta)}
        </span>
      </div>
      <p className="body-xs text-text-label mb-2">{tagline}</p>

      {/* The tooltips this replaced were the only thing mapping a
          respondent's name to a specific dot. `/compare/[id]/[id]` has no
          legend at all (it passes real user names), so each readout carries
          its own swatch in the primitive's own mark vocabulary — the
          mode-stepping custom property, not a fixed hex — rather than
          relying on a legend elsewhere on the page. */}
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mb-1.5 mono-meta text-text-secondary tabular-nums">
        <span data-readout="a" className="inline-flex items-center gap-1">
          <span
            data-mark="a"
            aria-hidden="true"
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: getDomainMarkVar(axisId) }}
          />
          {labelA} {formatScore(scoreA)}
        </span>
        <span data-readout="b" className="inline-flex items-center gap-1">
          <span
            data-mark="b"
            aria-hidden="true"
            className="h-2 w-2 rounded-full border-[1.5px] border-text-label bg-surface-1 shrink-0"
          />
          {labelB} {formatScore(scoreB)}
        </span>
      </div>

      <PairedAxisScale
        axisId={axisId}
        poleALabel={poleALabel}
        poleBLabel={poleBLabel}
        scoreA={scoreA}
        scoreB={scoreB}
        endpoints="below"
        axisName={axisName}
        respondentALabel={labelA}
        respondentBLabel={labelB}
      />
    </div>
  );
}
