import { describe, it, expect } from "vitest";
import {
  TOTAL_AXES,
  buildAxisNames,
  buildComparableScores,
  buildScoreRuns,
  formatScore,
  type AxisScoreEntry,
} from "@/lib/comparison-radar-data";
import { axes as axesDef } from "@/data/axes";

const entry = (axisId: number, finalScore: number): AxisScoreEntry => ({
  axisId,
  name: `Axis ${axisId}`,
  finalScore,
});

const allAxes = (score: number) =>
  Array.from({ length: TOTAL_AXES }, (_, i) => entry(i + 1, score));

describe("buildComparableScores", () => {
  it("returns one slot per axis for each profile", () => {
    const { scoresA, scoresB } = buildComparableScores(
      allAxes(0.5),
      allAxes(0.5)
    );
    expect(scoresA).toHaveLength(TOTAL_AXES);
    expect(scoresB).toHaveLength(TOTAL_AXES);
  });

  it("places scores at their axis index", () => {
    const { scoresA } = buildComparableScores(allAxes(0), [
      entry(1, 0.5),
      entry(12, -0.25),
      ...allAxes(0).slice(1, 11),
    ]);
    expect(scoresA[0]).toBe(0);
    expect(scoresA).not.toContain(null);
  });

  it("returns null for a hidden axis rather than a neutral 0", () => {
    // 0 is a real centrist score; padding a withheld axis with one would
    // invent a position for it and draw a vertex the owner chose to hide.
    const { scoresA, scoresB } = buildComparableScores(
      allAxes(0.5),
      allAxes(0.5),
      new Set([2])
    );
    expect(scoresA[1]).toBeNull();
    expect(scoresB[1]).toBeNull();
    expect(scoresA[2]).toBe(0.5);
  });

  it("hides an axis even if a caller leaves its score in the input", () => {
    const { scoresA } = buildComparableScores(
      allAxes(0.9),
      allAxes(0.9),
      new Set([2])
    );
    expect(scoresA[1]).toBeNull();
  });

  it("returns null for an axis missing from a profile, not a neutral 0", () => {
    // Same invention as a hidden axis: an unscored axis has no position, and
    // compareProfiles already drops it from perAxisDeltas.
    const { scoresA, scoresB } = buildComparableScores(
      allAxes(0.5),
      allAxes(0.5).filter((s) => s.axisId !== 4)
    );
    expect(scoresB[3]).toBeNull();
    // Nulled on both sides — half a comparison is not a comparison.
    expect(scoresA[3]).toBeNull();
  });

  it("keeps every axis when both profiles are complete and nothing is hidden", () => {
    const { scoresA, scoresB } = buildComparableScores(
      allAxes(0.5),
      allAxes(-0.5)
    );
    expect(scoresA.every((s) => s !== null)).toBe(true);
    expect(scoresB.every((s) => s !== null)).toBe(true);
  });
});

describe("buildScoreRuns", () => {
  const runsFor = (nullAt: number[]) =>
    buildScoreRuns(
      Array.from({ length: TOTAL_AXES }, (_, i) =>
        nullAt.includes(i) ? null : 0.5
      )
    );

  it("returns a single full run when every axis is comparable", () => {
    expect(runsFor([])).toEqual([[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]]);
  });

  it("returns no runs when no axis is comparable", () => {
    expect(buildScoreRuns(Array(TOTAL_AXES).fill(null))).toEqual([]);
  });

  it("wraps a run across the end of the ring", () => {
    // Axis index 1 omitted: the remaining axes form ONE run, not two, because
    // index 11 and index 0 are neighbours on the ring.
    expect(runsFor([1])).toEqual([[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0]]);
  });

  it("splits into one run per gap", () => {
    expect(runsFor([1, 5])).toEqual([
      [2, 3, 4],
      [6, 7, 8, 9, 10, 11, 0],
    ]);
  });

  it("never spans a gap, so no run connects an omitted axis's neighbours", () => {
    for (const gaps of [[0], [11], [0, 6], [3, 4, 5], [0, 1, 10, 11]]) {
      const runs = runsFor(gaps);
      for (const run of runs) {
        expect(run.some((i) => gaps.includes(i))).toBe(false);
        for (let k = 1; k < run.length; k++) {
          // Consecutive within a run means adjacent on the ring.
          expect((run[k - 1] + 1) % TOTAL_AXES).toBe(run[k]);
        }
      }
      // Every comparable axis appears exactly once.
      const covered = runs.flat().sort((a, b) => a - b);
      const expected = Array.from({ length: TOTAL_AXES }, (_, i) => i).filter(
        (i) => !gaps.includes(i)
      );
      expect(covered).toEqual(expected);
    }
  });
});

describe("buildAxisNames", () => {
  it("prefers names supplied by either profile", () => {
    const names = buildAxisNames([entry(1, 0)], [entry(2, 0)]);
    expect(names[0]).toBe("Axis 1");
    expect(names[1]).toBe("Axis 2");
  });

  it("falls back to the public axis catalogue for axes with no score entry", () => {
    // Omitted axes are stripped from both arrays, so their labels can only come
    // from the catalogue — which is public content, unlike the scores.
    const names = buildAxisNames([], []);
    expect(names).toHaveLength(TOTAL_AXES);
    expect(names).toEqual(axesDef.map((a) => a.name));
  });
});

describe("formatScore", () => {
  it("signs and fixes to two decimals", () => {
    expect(formatScore(0)).toBe("+0.00");
    expect(formatScore(0.5)).toBe("+0.50");
    expect(formatScore(-0.256)).toBe("-0.26");
  });
});
