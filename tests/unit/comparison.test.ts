import { describe, it, expect } from "vitest";
import { compareProfiles } from "@/lib/comparison";

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

  it("reports no alignment score when no axes are common", () => {
    const scoresA = [makeScore(1, 0.5)];
    const scoresB = [makeScore(2, 0.5)];
    const result = compareProfiles(scoresA, scoresB);
    // "No data to compare" must not read as perfect alignment.
    expect(result.alignmentScore).toBeNull();
    expect(result.perAxisDeltas).toHaveLength(0);
    expect(result.closestAxes).toHaveLength(0);
    expect(result.furthestAxes).toHaveLength(0);
  });

  it("reports no alignment score when every common axis is hidden", () => {
    const scoresA = [makeScore(1, 0.5), makeScore(2, -0.5)];
    const scoresB = [makeScore(1, 0.5), makeScore(2, -0.5)];
    const result = compareProfiles(scoresA, scoresB, new Set([1, 2]));
    expect(result.alignmentScore).toBeNull();
    expect(result.perAxisDeltas).toHaveLength(0);
  });

  it("never lists the same axis as both most aligned and most divergent", () => {
    for (let n = 1; n <= 12; n++) {
      const scoresA = Array.from({ length: n }, (_, i) => makeScore(i + 1, 0));
      const scoresB = Array.from({ length: n }, (_, i) =>
        makeScore(i + 1, (i + 1) / 12)
      );
      const result = compareProfiles(scoresA, scoresB);
      const closest = new Set(result.closestAxes.map((d) => d.axisId));
      const overlap = result.furthestAxes.filter((d) => closest.has(d.axisId));
      expect(overlap, `n=${n}`).toEqual([]);
      expect(result.closestAxes.length, `n=${n}`).toBe(Math.min(3, Math.floor(n / 2)));
    }
  });

  it("highlights nothing when only one axis is common", () => {
    // Deliberate: with one axis the "most aligned" and "most divergent" lists
    // would name it twice. The axis still appears in perAxisDeltas, which is
    // what the per-axis breakdown renders.
    const result = compareProfiles([makeScore(1, 0.0)], [makeScore(1, 0.8)]);
    expect(result.perAxisDeltas).toHaveLength(1);
    expect(result.closestAxes).toEqual([]);
    expect(result.furthestAxes).toEqual([]);
  });

  it("fills both highlight lists once enough axes are common", () => {
    const scoresA = Array.from({ length: 6 }, (_, i) => makeScore(i + 1, 0));
    const scoresB = Array.from({ length: 6 }, (_, i) =>
      makeScore(i + 1, (i + 1) / 10)
    );
    const result = compareProfiles(scoresA, scoresB);
    expect(result.closestAxes).toHaveLength(3);
    expect(result.furthestAxes).toHaveLength(3);
  });

  it("excludes hidden axes from the highlight lists", () => {
    const scoresA = [makeScore(1, 0.0), makeScore(2, 0.0), makeScore(3, 0.0), makeScore(4, 0.0)];
    const scoresB = [makeScore(1, 0.1), makeScore(2, 1.0), makeScore(3, 0.2), makeScore(4, 0.3)];
    const result = compareProfiles(scoresA, scoresB, new Set([2]));
    const mentioned = [...result.closestAxes, ...result.furthestAxes].map((d) => d.axisId);
    expect(mentioned).not.toContain(2);
    expect(result.perAxisDeltas.map((d) => d.axisId)).not.toContain(2);
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
