import { describe, it, expect } from "vitest";
import { compareProfiles, type ComparisonResult } from "@/lib/comparison";

const makeScore = (axisId: number, finalScore: number) => ({
  axisId,
  finalScore,
});

describe("compareProfiles", () => {
  it("returns 100% alignment for identical profiles", () => {
    const scoresA = [makeScore(1, 0.5), makeScore(2, -0.25)];
    const scoresB = [makeScore(1, 0.5), makeScore(2, -0.25)];
    const result = compareProfiles(scoresA, scoresB);
    expect(result.alignmentScore).toBe(100);
    expect(result.perAxisDeltas).toHaveLength(2);
    expect(result.perAxisDeltas.every((d) => d.delta === 0)).toBe(true);
  });

  it("returns 0% alignment for maximally divergent profiles", () => {
    const scoresA = [makeScore(1, -1.0), makeScore(2, -1.0)];
    const scoresB = [makeScore(1, 1.0), makeScore(2, 1.0)];
    const result = compareProfiles(scoresA, scoresB);
    expect(result.alignmentScore).toBe(0);
  });

  it("calculates correct per-axis deltas", () => {
    const scoresA = [makeScore(1, -0.4), makeScore(2, 0.6)];
    const scoresB = [makeScore(1, 0.4), makeScore(2, -0.6)];
    const result = compareProfiles(scoresA, scoresB);
    const a1Delta = result.perAxisDeltas.find((d) => d.axisId === 1);
    expect(a1Delta?.delta).toBeCloseTo(0.8);
    const a2Delta = result.perAxisDeltas.find((d) => d.axisId === 2);
    expect(a2Delta?.delta).toBeCloseTo(1.2);
  });

  it("calculates alignment score with new formula", () => {
    // meanDelta = 0.5 → alignmentScore = 100 * (1 - 0.5/2.0) = 75
    const scoresA = [makeScore(1, 0.0)];
    const scoresB = [makeScore(1, 0.5)];
    const result = compareProfiles(scoresA, scoresB);
    expect(result.alignmentScore).toBe(75);
  });

  it("identifies closest and furthest axes", () => {
    const scoresA = [
      makeScore(1, 0.0),
      makeScore(2, -0.5),
      makeScore(3, 0.8),
    ];
    const scoresB = [
      makeScore(1, 0.02), // delta 0.02 (closest)
      makeScore(2, 0.5),  // delta 1.0 (furthest)
      makeScore(3, 0.6),  // delta 0.2
    ];
    const result = compareProfiles(scoresA, scoresB);
    expect(result.closestAxes[0].axisId).toBe(1);
    expect(result.furthestAxes[0].axisId).toBe(2);
  });

  it("excludes hidden axes", () => {
    const scoresA = [makeScore(1, 0.0), makeScore(2, 0.0)];
    const scoresB = [makeScore(1, 0.0), makeScore(2, 1.0)];
    const hidden = new Set([2]);
    const result = compareProfiles(scoresA, scoresB, hidden);
    expect(result.perAxisDeltas).toHaveLength(1);
    expect(result.alignmentScore).toBe(100); // only axis 1 compared, identical
  });

  it("only compares axes present in both profiles", () => {
    const scoresA = [makeScore(1, 0.5), makeScore(2, 0.3)];
    const scoresB = [makeScore(1, 0.7), makeScore(3, 0.8)];
    const result = compareProfiles(scoresA, scoresB);
    expect(result.perAxisDeltas).toHaveLength(1);
    expect(result.perAxisDeltas[0].axisId).toBe(1);
  });

  it("returns 100% alignment for empty common axes", () => {
    const scoresA = [makeScore(1, 0.5)];
    const scoresB = [makeScore(2, 0.5)];
    const result = compareProfiles(scoresA, scoresB);
    expect(result.alignmentScore).toBe(100);
    expect(result.perAxisDeltas).toHaveLength(0);
  });

  it("clamps alignment score to [0, 100]", () => {
    // Even with max possible delta, score should not go below 0
    const scoresA = [makeScore(1, -1.0)];
    const scoresB = [makeScore(1, 1.0)];
    const result = compareProfiles(scoresA, scoresB);
    expect(result.alignmentScore).toBeGreaterThanOrEqual(0);
    expect(result.alignmentScore).toBeLessThanOrEqual(100);
  });
});
