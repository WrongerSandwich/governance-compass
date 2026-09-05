/**
 * modelAgreementProse.ts
 *
 * Sentence fragments for the model-agreement page that have to stay true when
 * the dataset is regenerated. The page previously hand-counted its own lists
 * ("Four axes reach...") and indexed a fixed three drifts, both of which desync
 * silently — or crash — the moment the numbers move.
 */

export type DriftEntry = {
  axis: number;
  axisName: string;
  mean_diff_gemini_minus_claude: number;
};

const COUNT_WORDS = [
  "No",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
];

/** Sentence-leading count, spelled out through twelve (the axis count). */
export function countWord(n: number): string {
  return COUNT_WORDS[n] ?? String(n);
}

/** Serial-comma list: "a", "a and b", "a, b, and c". */
export function joinWithAnd(items: readonly string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/**
 * The pole a positive Gemini-minus-Claude drift points toward, per axis. Only
 * the axes that actually drift are named; anything else gets a neutral phrase
 * rather than borrowing a neighbour's pole.
 */
const DRIFT_POLE_BY_AXIS: Record<number, string> = {
  6: "alternative legitimacy",
  7: "continuity/tradition",
  9: "essentialism",
  10: "sovereignty",
};

export function driftPole(axis: number): string {
  return DRIFT_POLE_BY_AXIS[axis] ?? "higher scores";
}

/** The mirror of {@link DRIFT_POLE_BY_AXIS}, for axes Claude scores higher. */
const NEGATIVE_DRIFT_POLE_BY_AXIS: Record<number, string> = {
  4: "institutional authority",
};

export function negativeDriftPole(axis: number): string {
  return NEGATIVE_DRIFT_POLE_BY_AXIS[axis] ?? "lower scores";
}

/** Below this, a drift is small enough that the page calls the axis tied. */
const TIED_DRIFT_THRESHOLD = 0.01;

/**
 * The axis to describe as "essentially tied", or null if none qualifies.
 *
 * Claude-higher axes are excluded: the prose already names those as exceptions,
 * and calling one of them tied a sentence later contradicts that.
 */
export function selectTiedAxis(
  entries: readonly DriftEntry[]
): DriftEntry | null {
  const candidate = entries
    .filter((e) => e.mean_diff_gemini_minus_claude >= 0)
    .sort(
      (a, b) =>
        Math.abs(a.mean_diff_gemini_minus_claude) -
        Math.abs(b.mean_diff_gemini_minus_claude)
    )[0];
  if (!candidate) return null;
  return Math.abs(candidate.mean_diff_gemini_minus_claude) < TIED_DRIFT_THRESHOLD
    ? candidate
    : null;
}

function signed(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

/**
 * "The three largest drifts are Axis 7 (…), Axis 10 (…), and Axis 6 (…)" —
 * pluralized and sized from whatever it is handed. Null when the list is empty.
 */
export function describeTopDrifts(entries: readonly DriftEntry[]): string | null {
  if (entries.length === 0) return null;

  const items = entries.map((e, i) => {
    // "Gemini" appears once, on the first item, and carries through the rest.
    const attribution = i === 0 ? "Gemini " : "";
    return (
      `Axis ${e.axis} (${e.axisName}, ${attribution}` +
      `${signed(e.mean_diff_gemini_minus_claude)} toward ${driftPole(e.axis)})`
    );
  });

  const lead =
    entries.length === 1
      ? "The largest drift is"
      : `The ${countWord(entries.length).toLowerCase()} largest drifts are`;

  return `${lead} ${joinWithAnd(items)}.`;
}
