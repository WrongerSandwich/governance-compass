import { DOMAIN_COLORS, getDomainForAxis, getDomainMarkVar } from "@/lib/design-tokens";

/**
 * One axis rendered as a scale, for one or two respondents (design delta 05).
 *
 * Renders only the scale — endpoints, track, midline, dots. Callers own the
 * surrounding row, because the home page, the results breakdown, the
 * comparison view and the group view wrap it in different grids.
 */
export interface PairedAxisScaleProps {
  /** 1-12; selects the domain colour. */
  axisId: number;
  poleALabel: string;
  poleBLabel: string;
  scoreA: number;
  /** Omit for the single-respondent variant. */
  scoreB?: number;
  /** Endpoints sit above the track on desktop, below it when stacked. */
  endpoints?: "above" | "below";
  /**
   * Names the axis in the generated description. Pass this, not `label`.
   *
   * May also carry a qualifier appended after the axis name (e.g. "Power
   * Distribution, group average") — this works only because the prefix
   * built from it is the bare `${axisName}: `, so a future change to that
   * prefix format could silently misread a qualifier as part of the name.
   */
  axisName?: string;
  respondentALabel?: string;
  respondentBLabel?: string;
  /** Escape hatch: replaces the generated description outright. */
  label?: string;
}

/**
 * Maps a -1..1 score to a percentage across the track.
 *
 * The range is 6%..94% rather than 0%..100% so a dot at a pole still sits
 * fully on the track instead of clipping its end.
 */
export function scoreToTrackPercent(score: number): number {
  const clamped = Math.max(-1, Math.min(1, score));
  return Math.round((50 + clamped * 44) * 10) / 10;
}

/**
 * One respondent's position, in words.
 *
 * `role="img"` makes this component's subtree presentational, so the visible
 * endpoint text never reaches the accessibility tree and both dots are
 * aria-hidden. Everything the scale communicates has to survive in the
 * `aria-label`, which is what these two helpers build.
 *
 * Returns a fragment for embedding, not a complete label.
 */
export function describePosition(score: number, poleALabel: string, poleBLabel: string): string {
  const magnitude = Math.abs(Math.max(-1, Math.min(1, score)));
  if (magnitude < 0.15) return "near the midpoint";
  const pole = score < 0 ? poleALabel : poleBLabel;
  const strength = magnitude < 0.45 ? "slightly" : magnitude < 0.75 ? "moderately" : "strongly";
  return `${strength} toward ${pole}`;
}

/** The relationship between two respondents, from the unsigned gap between
 *  their scores.
 *
 *  The THRESHOLDS are ComparisonScoreBar's shipped ones, moved here so the
 *  visible label and the accessible description are one computation. One
 *  WORDING changed in the move: "very close" reads as a distance, and the
 *  bucket is about agreement. The other three are the shipped strings
 *  verbatim, deliberately — every extra reworded string is another place
 *  /compare's own copy of these buckets can diverge before Task 6 folds it in.
 *
 *  Returns a fragment, not a finished label: Task 6 renders it bare as a
 *  badge, which is why no bucket carries an article. */
export function describeGap(gap: number): string {
  if (gap <= 0.3) return "close agreement";
  if (gap <= 0.7) return "some distance";
  if (gap <= 1.2) return "significant gap";
  return "far apart";
}

export function describeScale({
  axisName,
  poleALabel,
  poleBLabel,
  scoreA,
  scoreB,
  respondentALabel,
  respondentBLabel,
}: {
  /** Omit to get the bare position, with no prefix. */
  axisName?: string;
  poleALabel: string;
  poleBLabel: string;
  scoreA: number;
  scoreB?: number;
  respondentALabel: string;
  respondentBLabel: string;
}): string {
  // Dropped rather than defaulted when absent. The previous fallback named
  // the poles, which the position phrase then names again: "Distributed to
  // Centralized: moderately toward Distributed" — a synthesized pole-pair
  // prefix that reads worse than no prefix at all. More generally: an
  // aria-label on a role="img" only parses correctly against whatever DOM
  // happens to sit next to it, and nothing enforces that adjacency. Callers
  // name the axis explicitly rather than lean on that, even where it means
  // repeating a heading already visible beside the scale.
  const prefix = axisName ? `${axisName}: ` : "";
  const a = describePosition(scoreA, poleALabel, poleBLabel);
  if (scoreB === undefined) return `${prefix}${a}`;
  const b = describePosition(scoreB, poleALabel, poleBLabel);
  const relation = describeGap(Math.abs(scoreA - scoreB));
  // A semicolon, not an em dash. Most synthesizers speak nothing for U+2014
  // and do not reliably pause on it, so the relationship phrase ran straight
  // onto the end of respondent B's position; at higher punctuation verbosity
  // it is spoken as "dash", once per axis, twelve times down the page.
  return `${prefix}${respondentALabel} ${a}, ${respondentBLabel} ${b}; ${relation}`;
}

export function PairedAxisScale({
  axisId,
  poleALabel,
  poleBLabel,
  scoreA,
  scoreB,
  endpoints = "above",
  axisName,
  respondentALabel = "Respondent A",
  respondentBLabel = "Respondent B",
  label,
}: PairedAxisScaleProps) {
  const domain = DOMAIN_COLORS[getDomainForAxis(axisId)];
  const endpointRow = (
    <div
      className={`flex justify-between label-tight text-text-label ${
        endpoints === "above" ? "mb-1" : "mt-1.5"
      }`}
    >
      <span>{poleALabel}</span>
      <span className="text-right">{poleBLabel}</span>
    </div>
  );

  const description =
    label ??
    describeScale({
      axisName,
      poleALabel,
      poleBLabel,
      scoreA,
      scoreB,
      respondentALabel,
      respondentBLabel,
    });

  return (
    <div role="img" aria-label={description}>
      {endpoints === "above" && endpointRow}
      <div className="relative h-3.5">
        {/* The track keeps the 400 tone as a literal: unlike the dot, its
            value is the same in both modes (mock 7b draws it at 400 too), so
            there is nothing for a custom property to step. */}
        <div
          data-track
          className="absolute left-0 right-0 top-1.5 h-0.5 opacity-50"
          style={{ backgroundColor: domain[400] }}
        />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border-secondary" />
        {scoreB !== undefined && (
          <div
            data-respondent="b"
            aria-hidden="true"
            className="absolute top-px h-3 w-3 -translate-x-1/2 rounded-full border-[1.5px] border-text-label bg-surface-1"
            style={{ left: `${scoreToTrackPercent(scoreB)}%` }}
          />
        )}
        {/* Respondent A steps 600 -> 400 by mode; a hex from DOMAIN_COLORS
            cannot. In light mode the two spellings are pixel-identical, so
            this is guarded on the declaration, not the rendered colour. */}
        <div
          data-respondent="a"
          aria-hidden="true"
          className="absolute top-0.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full"
          style={{ left: `${scoreToTrackPercent(scoreA)}%`, backgroundColor: getDomainMarkVar(axisId) }}
        />
      </div>
      {endpoints === "below" && endpointRow}
    </div>
  );
}
