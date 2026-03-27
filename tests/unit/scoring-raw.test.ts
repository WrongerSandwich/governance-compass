import { describe, it, expect } from "vitest";
import {
  scoreForcedChoiceAxis,
  scoreScaledAxis,
  computeBudgetDeviations,
  scoreBudgetAxis,
  computeAllPerModalityScores,
} from "@/lib/scoring";
import { BUDGET_BASELINE, BUDGET_SIGMOID_K } from "@/lib/scoring-types";

// ---------------------------------------------------------------------------
// FC scoring
// ---------------------------------------------------------------------------

describe("scoreForcedChoiceAxis", () => {
  it("returns -1.0 when all three items select A", () => {
    const responses = { "fc-1-1": "A", "fc-1-2": "A", "fc-1-3": "A" } as Record<string, "A" | "B">;
    expect(scoreForcedChoiceAxis(responses, 1)).toBeCloseTo(-1.0);
  });

  it("returns +1.0 when all three items select B", () => {
    const responses = { "fc-1-1": "B", "fc-1-2": "B", "fc-1-3": "B" } as Record<string, "A" | "B">;
    expect(scoreForcedChoiceAxis(responses, 1)).toBeCloseTo(1.0);
  });

  it("returns -1/3 when two A and one B", () => {
    const responses = { "fc-1-1": "A", "fc-1-2": "A", "fc-1-3": "B" } as Record<string, "A" | "B">;
    // (-1 + -1 + 1) / 3 = -1/3
    expect(scoreForcedChoiceAxis(responses, 1)).toBeCloseTo(-1 / 3);
  });

  it("returns +1/3 when one A and two B", () => {
    const responses = { "fc-1-1": "A", "fc-1-2": "B", "fc-1-3": "B" } as Record<string, "A" | "B">;
    // (-1 + 1 + 1) / 3 = +1/3
    expect(scoreForcedChoiceAxis(responses, 1)).toBeCloseTo(1 / 3);
  });

  it("handles axis 12 correctly (all B)", () => {
    const responses = { "fc-12-1": "B", "fc-12-2": "B", "fc-12-3": "B" } as Record<string, "A" | "B">;
    expect(scoreForcedChoiceAxis(responses, 12)).toBeCloseTo(1.0);
  });

  it("handles axis 5 mixed responses", () => {
    // A=-1, B=+1, A=-1  → mean = -1/3
    const responses = { "fc-5-1": "A", "fc-5-2": "B", "fc-5-3": "A" } as Record<string, "A" | "B">;
    expect(scoreForcedChoiceAxis(responses, 5)).toBeCloseTo(-1 / 3);
  });

  it("returns 0.0 when items for axis are missing (no items found)", () => {
    // An axis that has no FC items — returns mean of 0 items = 0
    // (or handle gracefully)
    const responses = {} as Record<string, "A" | "B">;
    // axis 99 doesn't exist, no items, mean of empty = 0
    expect(scoreForcedChoiceAxis(responses, 99)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// SC scoring
// ---------------------------------------------------------------------------

describe("scoreScaledAxis", () => {
  it("maps value 1 → -2 and returns -1.0 when all three are 1", () => {
    // mean of [-2,-2,-2] / 2 = -2/2 = -1.0
    const responses = { "sc-1-1": 1, "sc-1-2": 1, "sc-1-3": 1 } as Record<string, 1 | 2 | 3 | 4 | 5>;
    expect(scoreScaledAxis(responses, 1)).toBeCloseTo(-1.0);
  });

  it("maps value 5 → +2 and returns +1.0 when all three are 5", () => {
    const responses = { "sc-1-1": 5, "sc-1-2": 5, "sc-1-3": 5 } as Record<string, 1 | 2 | 3 | 4 | 5>;
    expect(scoreScaledAxis(responses, 1)).toBeCloseTo(1.0);
  });

  it("maps value 3 → 0 and returns 0.0 when all are 3", () => {
    const responses = { "sc-1-1": 3, "sc-1-2": 3, "sc-1-3": 3 } as Record<string, 1 | 2 | 3 | 4 | 5>;
    expect(scoreScaledAxis(responses, 1)).toBeCloseTo(0.0);
  });

  it("maps value 2 → -1 and value 4 → +1 correctly", () => {
    // all 2: mean of [-1,-1,-1] / 2 = -0.5
    const responses2 = { "sc-2-1": 2, "sc-2-2": 2, "sc-2-3": 2 } as Record<string, 1 | 2 | 3 | 4 | 5>;
    expect(scoreScaledAxis(responses2, 2)).toBeCloseTo(-0.5);

    // all 4: mean of [+1,+1,+1] / 2 = +0.5
    const responses4 = { "sc-2-1": 4, "sc-2-2": 4, "sc-2-3": 4 } as Record<string, 1 | 2 | 3 | 4 | 5>;
    expect(scoreScaledAxis(responses4, 2)).toBeCloseTo(0.5);
  });

  it("handles mixed values correctly", () => {
    // sc-3-1=1(-2), sc-3-2=3(0), sc-3-3=5(+2) → mean = 0/3 = 0 → /2 = 0
    const responses = { "sc-3-1": 1, "sc-3-2": 3, "sc-3-3": 5 } as Record<string, 1 | 2 | 3 | 4 | 5>;
    expect(scoreScaledAxis(responses, 3)).toBeCloseTo(0.0);
  });

  it("handles axis 12 all value 1", () => {
    const responses = { "sc-12-1": 1, "sc-12-2": 1, "sc-12-3": 1 } as Record<string, 1 | 2 | 3 | 4 | 5>;
    expect(scoreScaledAxis(responses, 12)).toBeCloseTo(-1.0);
  });

  it("returns 0 when no items found for axis", () => {
    const responses = {} as Record<string, 1 | 2 | 3 | 4 | 5>;
    expect(scoreScaledAxis(responses, 99)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Budget deviations
// ---------------------------------------------------------------------------

describe("computeBudgetDeviations", () => {
  it("computes deviation as allocation minus baseline (10)", () => {
    const allocations = { 1: 15, 2: 10, 3: 5 };
    const deviations = computeBudgetDeviations(allocations);
    expect(deviations.get(1)).toBe(5);   // 15 - 10
    expect(deviations.get(2)).toBe(0);   // 10 - 10
    expect(deviations.get(3)).toBe(-5);  // 5 - 10
  });

  it("returns a Map with all ministry keys present in the input", () => {
    const allocations = { 4: 20, 9: 8 };
    const deviations = computeBudgetDeviations(allocations);
    expect(deviations.has(4)).toBe(true);
    expect(deviations.has(9)).toBe(true);
    expect(deviations.get(4)).toBe(10);  // 20 - 10
    expect(deviations.get(9)).toBe(-2); // 8 - 10
  });

  it("returns an empty Map when allocations is empty", () => {
    const deviations = computeBudgetDeviations({});
    expect(deviations.size).toBe(0);
  });

  it("uses BUDGET_BASELINE = 10", () => {
    expect(BUDGET_BASELINE).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// Budget axis scoring
// ---------------------------------------------------------------------------

describe("scoreBudgetAxis", () => {
  it("returns null for axis 3 (no ministry mappings)", () => {
    const deviations = new Map<number, number>([[1, 5], [2, 3]]);
    expect(scoreBudgetAxis(deviations, 3)).toBeNull();
  });

  it("returns null for axis 9 (no ministry mappings)", () => {
    const deviations = new Map<number, number>();
    expect(scoreBudgetAxis(deviations, 9)).toBeNull();
  });

  it("returns null for axis 99 (no ministry mappings)", () => {
    const deviations = new Map<number, number>();
    expect(scoreBudgetAxis(deviations, 99)).toBeNull();
  });

  it("scores axis 1 correctly with single positive deviation in direction 1 (ministry 2)", () => {
    // Axis 1 mappings: ministry 1 direction -1, ministry 2 direction +1
    // ministry 2 has deviation +10 → signed = +10 * 1 = +10
    // ministry 1 has deviation 0 → signed = 0 * -1 = 0
    // mean of [0, 10] = 5
    // tanh(5 / 10) = tanh(0.5) ≈ 0.4621
    const deviations = new Map<number, number>([[1, 0], [2, 10]]);
    const result = scoreBudgetAxis(deviations, 1);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(Math.tanh(5 / BUDGET_SIGMOID_K), 5);
  });

  it("scores axis 1 with negative deviation in direction -1 (ministry 1, collectivism)", () => {
    // ministry 1 direction -1: deviation +10 → signed = +10 * -1 = -10
    // ministry 2 direction +1: deviation 0 → signed = 0
    // mean = -5 → tanh(-5/10) = tanh(-0.5) ≈ -0.4621
    const deviations = new Map<number, number>([[1, 10], [2, 0]]);
    const result = scoreBudgetAxis(deviations, 1);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(Math.tanh(-5 / BUDGET_SIGMOID_K), 5);
  });

  it("returns 0 when deviations are all zero", () => {
    // tanh(0) = 0
    const deviations = new Map<number, number>([[1, 0], [2, 0], [3, 0]]);
    const result = scoreBudgetAxis(deviations, 1);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(0.0);
  });

  it("output is bounded in [-1.0, +1.0]", () => {
    // Extreme deviation
    const deviations = new Map<number, number>([[1, 0], [2, 1000]]);
    const result = scoreBudgetAxis(deviations, 1);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThanOrEqual(-1.0);
    expect(result!).toBeLessThanOrEqual(1.0);
  });

  it("scores axis 2 with ecological ministry opposing growth ministry", () => {
    // Axis 2 mappings:
    //   ministry 2 (Econ Dev) direction +1
    //   ministry 3 (Ecology) direction -1
    //   ministry 8 (Infra) direction +1
    // Suppose: ministry 2=+5, ministry 3=+5, ministry 8=0
    // Signed: ministry2=5*1=+5, ministry3=5*-1=-5, ministry8=0*1=0
    // mean = 0 → tanh(0) = 0
    const deviations = new Map<number, number>([[2, 5], [3, 5], [8, 0]]);
    const result = scoreBudgetAxis(deviations, 2);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(0.0);
  });

  it("handles missing ministry entries by treating deviation as 0", () => {
    // Axis 1: ministry 1 (dir -1) and ministry 2 (dir +1)
    // Only ministry 2 is in deviations map — ministry 1 missing → treated as deviation 0
    // Signed: ministry1 = 0*-1 = 0, ministry2 = 10*1 = 10
    // mean = 5 → tanh(5/10)
    const deviations = new Map<number, number>([[2, 10]]);
    const result = scoreBudgetAxis(deviations, 1);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(Math.tanh(5 / BUDGET_SIGMOID_K), 5);
  });
});

// ---------------------------------------------------------------------------
// Full per-modality scores
// ---------------------------------------------------------------------------

describe("computeAllPerModalityScores", () => {
  const allA_fc: Record<string, "A" | "B"> = {};
  const allOne_sc: Record<string, 1 | 2 | 3 | 4 | 5> = {};

  // Build "all A" FC and "all 1" SC responses for axes 1-12
  for (let axis = 1; axis <= 12; axis++) {
    for (let item = 1; item <= 3; item++) {
      allA_fc[`fc-${axis}-${item}`] = "A";
      allOne_sc[`sc-${axis}-${item}`] = 1;
    }
  }

  it("returns an object with keys for all 12 axes", () => {
    const responses = {
      forcedChoice: allA_fc,
      scaled: allOne_sc,
      budget: {},
    };
    const scores = computeAllPerModalityScores(responses);
    for (let axis = 1; axis <= 12; axis++) {
      expect(scores).toHaveProperty(String(axis));
    }
  });

  it("each axis result has fc, sc, and bg keys", () => {
    const responses = {
      forcedChoice: allA_fc,
      scaled: allOne_sc,
      budget: {},
    };
    const scores = computeAllPerModalityScores(responses);
    for (let axis = 1; axis <= 12; axis++) {
      expect(scores[axis]).toHaveProperty("fc");
      expect(scores[axis]).toHaveProperty("sc");
      expect(scores[axis]).toHaveProperty("bg");
    }
  });

  it("fc scores are -1.0 for all-A responses", () => {
    const responses = {
      forcedChoice: allA_fc,
      scaled: allOne_sc,
      budget: {},
    };
    const scores = computeAllPerModalityScores(responses);
    for (let axis = 1; axis <= 12; axis++) {
      expect(scores[axis].fc).toBeCloseTo(-1.0);
    }
  });

  it("sc scores are -1.0 for all-1 responses", () => {
    const responses = {
      forcedChoice: allA_fc,
      scaled: allOne_sc,
      budget: {},
    };
    const scores = computeAllPerModalityScores(responses);
    for (let axis = 1; axis <= 12; axis++) {
      expect(scores[axis].sc).toBeCloseTo(-1.0);
    }
  });

  it("axes 3 and 9 have null bg scores (no ministry mappings)", () => {
    const responses = {
      forcedChoice: allA_fc,
      scaled: allOne_sc,
      budget: { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10, 8: 10, 9: 10, 10: 10 },
    };
    const scores = computeAllPerModalityScores(responses);
    expect(scores[3].bg).toBeNull();
    expect(scores[9].bg).toBeNull();
  });

  it("axes with budget mappings return non-null bg scores when allocations provided", () => {
    const responses = {
      forcedChoice: allA_fc,
      scaled: allOne_sc,
      budget: { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10, 8: 10, 9: 10, 10: 10 },
    };
    const scores = computeAllPerModalityScores(responses);
    // Axes with mappings: 1, 2, 4, 5, 6, 7, 8, 10, 11, 12
    for (const axisId of [1, 2, 4, 5, 6, 7, 8, 10, 11, 12]) {
      expect(scores[axisId].bg).not.toBeNull();
    }
  });

  it("all bg scores are 0 when all allocations equal baseline", () => {
    // All ministries at baseline → deviation = 0 → tanh(0) = 0
    const baseline: Record<number, number> = {};
    for (let m = 1; m <= 10; m++) baseline[m] = BUDGET_BASELINE;
    const responses = {
      forcedChoice: allA_fc,
      scaled: allOne_sc,
      budget: baseline,
    };
    const scores = computeAllPerModalityScores(responses);
    for (let axis = 1; axis <= 12; axis++) {
      if (scores[axis].bg !== null) {
        expect(scores[axis].bg).toBeCloseTo(0.0);
      }
    }
  });

  it("all scores are in [-1.0, +1.0]", () => {
    const budget: Record<number, number> = {};
    for (let m = 1; m <= 10; m++) budget[m] = 20; // extreme allocations
    const responses = {
      forcedChoice: allA_fc,
      scaled: allOne_sc,
      budget,
    };
    const scores = computeAllPerModalityScores(responses);
    for (let axis = 1; axis <= 12; axis++) {
      expect(scores[axis].fc).toBeGreaterThanOrEqual(-1.0);
      expect(scores[axis].fc).toBeLessThanOrEqual(1.0);
      expect(scores[axis].sc).toBeGreaterThanOrEqual(-1.0);
      expect(scores[axis].sc).toBeLessThanOrEqual(1.0);
      if (scores[axis].bg !== null) {
        expect(scores[axis].bg!).toBeGreaterThanOrEqual(-1.0);
        expect(scores[axis].bg!).toBeLessThanOrEqual(1.0);
      }
    }
  });
});
