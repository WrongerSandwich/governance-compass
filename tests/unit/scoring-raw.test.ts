import { describe, it, expect } from "vitest";
import {
  scoreForcedChoiceAxis,
  scoreScaledAxis,
  scoreBudgetAxis,
  computeAllPerModalityScores,
} from "@/lib/scoring";
import { BUDGET_MEAN, BUDGET_SIGMOID_K } from "@/lib/scoring-types";

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
// Budget axis scoring
// ---------------------------------------------------------------------------

describe("scoreBudgetAxis", () => {
  it("returns null for axis 3 (no ministry mappings)", () => {
    const allocations = { 1: 7, 2: 7 };
    expect(scoreBudgetAxis(allocations, 3)).toBeNull();
  });

  it("returns null for axis 9 (no ministry mappings)", () => {
    const allocations = {};
    expect(scoreBudgetAxis(allocations, 9)).toBeNull();
  });

  it("returns null for axis 99 (no ministry mappings)", () => {
    const allocations = {};
    expect(scoreBudgetAxis(allocations, 99)).toBeNull();
  });

  it("scores axis 1 (bidirectional) — high Economy & Growth, low Public Welfare", () => {
    // Axis 1 mappings: ministry 2 (Public Welfare) dir -1, ministry 3 (Economy & Growth) dir +1
    // Bidirectional: diff = poleBValue - poleAValue = Economy - PublicWelfare = 15 - 3 = 12
    // tanh(12 / 6) = tanh(2.0)
    const allocations = { 2: 3, 3: 15 };
    const result = scoreBudgetAxis(allocations, 1);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(Math.tanh(12 / BUDGET_SIGMOID_K), 5);
  });

  it("scores axis 1 (bidirectional) — high Public Welfare, low Economy & Growth → negative", () => {
    // diff = Economy - PublicWelfare = 3 - 15 = -12
    // tanh(-12/6) = tanh(-2.0)
    const allocations = { 2: 15, 3: 3 };
    const result = scoreBudgetAxis(allocations, 1);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(Math.tanh(-12 / BUDGET_SIGMOID_K), 5);
  });

  it("returns 0 when bidirectional ministries have equal allocations", () => {
    // Axis 1: Economy = PublicWelfare → diff = 0 → tanh(0) = 0
    const allocations = { 2: 10, 3: 10 };
    const result = scoreBudgetAxis(allocations, 1);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(0.0);
  });

  it("output is bounded in [-1.0, +1.0]", () => {
    // Extreme allocations
    const allocations = { 2: 1, 3: 25 };
    const result = scoreBudgetAxis(allocations, 1);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThanOrEqual(-1.0);
    expect(result!).toBeLessThanOrEqual(1.0);
  });

  it("scores axis 2 (bidirectional) — equal opposing ministries → 0", () => {
    // Axis 2 mappings: ministry 3 (Economy & Growth) dir +1, ministry 5 (Environment) dir -1
    // diff = Economy - Environment = 10 - 10 = 0 → tanh(0) = 0
    const allocations = { 3: 10, 5: 10 };
    const result = scoreBudgetAxis(allocations, 2);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(0.0);
  });

  it("scores unidirectional axis (axis 4) using deviation from mean", () => {
    // Axis 4: ministry 4 (Education & Research) dir +1
    // Unidirectional: deviation = (value - mean) * direction = (12 - 50/7) * 1
    // ≈ (12 - 7.1429) * 1 = 4.857
    // tanh(4.857 / 6)
    const allocations = { 4: 12 };
    const result = scoreBudgetAxis(allocations, 4);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(Math.tanh((12 - BUDGET_MEAN) / BUDGET_SIGMOID_K), 5);
  });

  it("handles missing ministry entries by treating allocation as mean", () => {
    // Axis 1 (bidirectional): ministry 2 (dir -1) and ministry 3 (dir +1)
    // Only ministry 3 present → ministry 2 defaults to BUDGET_MEAN
    // diff = 15 - BUDGET_MEAN ≈ 15 - 7.1429 = 7.857
    // tanh(7.857 / 6)
    const allocations = { 3: 15 };
    const result = scoreBudgetAxis(allocations, 1);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(Math.tanh((15 - BUDGET_MEAN) / BUDGET_SIGMOID_K), 5);
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

  it("axes 3, 7, 8, 9 have null bg scores (no ministry mappings)", () => {
    const responses = {
      forcedChoice: allA_fc,
      scaled: allOne_sc,
      budget: { 1: 7, 2: 7, 3: 7, 4: 7, 5: 7, 6: 7, 7: 7 },
    };
    const scores = computeAllPerModalityScores(responses);
    expect(scores[3].bg).toBeNull();
    expect(scores[7].bg).toBeNull();
    expect(scores[8].bg).toBeNull();
    expect(scores[9].bg).toBeNull();
  });

  it("axes with budget mappings return non-null bg scores when allocations provided", () => {
    const responses = {
      forcedChoice: allA_fc,
      scaled: allOne_sc,
      budget: { 1: 7, 2: 7, 3: 7, 4: 7, 5: 7, 6: 7, 7: 7 },
    };
    const scores = computeAllPerModalityScores(responses);
    // Axes with mappings: 1, 2, 4, 5, 6, 10, 11, 12
    for (const axisId of [1, 2, 4, 5, 6, 10, 11, 12]) {
      expect(scores[axisId].bg).not.toBeNull();
    }
  });

  it("all bg scores are ≈0 when all allocations equal mean (50/7)", () => {
    // All ministries at equal allocation → bidirectional diff = 0,
    // unidirectional deviation = 0 → tanh(0) = 0
    const mean = 50 / 7;
    const baseline: Record<number, number> = {};
    for (let m = 1; m <= 7; m++) baseline[m] = mean;
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
    for (let m = 1; m <= 7; m++) budget[m] = 20; // extreme allocations
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
