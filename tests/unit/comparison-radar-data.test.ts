import { describe, it, expect } from "vitest";
import {
  TOTAL_AXES,
  buildAxisNames,
  buildPaddedScores,
  formatScore,
  type AxisScoreEntry,
} from "@/lib/comparison-radar-data";
import { axes as axesDef } from "@/data/axes";

const entry = (axisId: number, finalScore: number): AxisScoreEntry => ({
  axisId,
  name: `Axis ${axisId}`,
  finalScore,
});

describe("buildPaddedScores", () => {
  it("returns one slot per axis", () => {
    expect(buildPaddedScores([entry(1, 0.5)])).toHaveLength(TOTAL_AXES);
  });

  it("places scores at their axis index", () => {
    const padded = buildPaddedScores([entry(1, 0.5), entry(12, -0.25)]);
    expect(padded[0]).toBe(0.5);
    expect(padded[11]).toBe(-0.25);
  });

  it("returns null for a hidden axis rather than a neutral 0", () => {
    // 0 is a real centrist score; padding a withheld axis with one would
    // invent a position for it and draw a vertex the owner chose to hide.
    const padded = buildPaddedScores([entry(1, 0.5)], new Set([2]));
    expect(padded[1]).toBeNull();
    expect(padded[2]).toBe(0);
  });

  it("hides an axis even if a caller leaves its score in the input", () => {
    const padded = buildPaddedScores([entry(2, 0.9)], new Set([2]));
    expect(padded[1]).toBeNull();
    expect(padded).not.toContain(0.9);
  });

  it("treats every axis as visible when no hidden set is given", () => {
    const padded = buildPaddedScores([entry(1, 0.5)]);
    expect(padded.every((s) => s !== null)).toBe(true);
  });
});

describe("buildAxisNames", () => {
  it("prefers names supplied by either profile", () => {
    const names = buildAxisNames([entry(1, 0)], [entry(2, 0)]);
    expect(names[0]).toBe("Axis 1");
    expect(names[1]).toBe("Axis 2");
  });

  it("falls back to the public axis catalogue for axes with no score entry", () => {
    // Hidden axes are stripped from both arrays, so their labels can only come
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
