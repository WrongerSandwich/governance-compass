// @vitest-environment node
import { describe, it, expect } from "vitest";
import { computeFullResults } from "@/lib/scoring";
import type { QuizResponses } from "@/lib/scoring-types";

// ---------------------------------------------------------------------------
// Synthetic full response set
// ---------------------------------------------------------------------------

// 36 FC responses (fc-{axis}-{1|2|3} for axes 1–12).
// Alternating A/B to produce a non-trivial, non-degenerate result.
const forcedChoice: Record<string, "A" | "B"> = {
  "fc-1-1": "A", "fc-1-2": "B", "fc-1-3": "A",
  "fc-2-1": "B", "fc-2-2": "A", "fc-2-3": "B",
  "fc-3-1": "A", "fc-3-2": "A", "fc-3-3": "B",
  "fc-4-1": "B", "fc-4-2": "B", "fc-4-3": "A",
  "fc-5-1": "A", "fc-5-2": "B", "fc-5-3": "A",
  "fc-6-1": "B", "fc-6-2": "A", "fc-6-3": "B",
  "fc-7-1": "A", "fc-7-2": "B", "fc-7-3": "A",
  "fc-8-1": "B", "fc-8-2": "A", "fc-8-3": "A",
  "fc-9-1": "A", "fc-9-2": "B", "fc-9-3": "B",
  "fc-10-1": "B", "fc-10-2": "B", "fc-10-3": "A",
  "fc-11-1": "A", "fc-11-2": "A", "fc-11-3": "B",
  "fc-12-1": "B", "fc-12-2": "A", "fc-12-3": "B",
};

// 36 SC responses (sc-{axis}-{1|2|3} for axes 1–12).
// Using values 1–5 with variety across axes.
const scaled: Record<string, 1 | 2 | 3 | 4 | 5> = {
  "sc-1-1": 2, "sc-1-2": 2, "sc-1-3": 3,
  "sc-2-1": 4, "sc-2-2": 4, "sc-2-3": 5,
  "sc-3-1": 1, "sc-3-2": 2, "sc-3-3": 2,
  "sc-4-1": 5, "sc-4-2": 4, "sc-4-3": 3,
  "sc-5-1": 2, "sc-5-2": 3, "sc-5-3": 2,
  "sc-6-1": 3, "sc-6-2": 4, "sc-6-3": 4,
  "sc-7-1": 1, "sc-7-2": 2, "sc-7-3": 1,
  "sc-8-1": 3, "sc-8-2": 3, "sc-8-3": 4,
  "sc-9-1": 5, "sc-9-2": 4, "sc-9-3": 5,
  "sc-10-1": 2, "sc-10-2": 3, "sc-10-3": 2,
  "sc-11-1": 4, "sc-11-2": 4, "sc-11-3": 3,
  "sc-12-1": 2, "sc-12-2": 3, "sc-12-3": 2,
};

// 7 budget allocations (ministry IDs 1–7, each ≥ BUDGET_MINIMUM=1, total = 50).
// Using varied allocations around the 50/7 ≈ 7.14 mean to produce non-zero bg scores.
const budget: Record<number, number> = {
  1: 12, // Defense → axes 5 (+1), 11 (+1)
  2: 3,  // Public Welfare → axis 1 (-1)
  3: 10, // Economy & Growth → axes 1 (+1), 2 (+1)
  4: 5,  // Education & Research → axes 4 (+1), 12 (+1)
  5: 8,  // Environment → axis 2 (-1)
  6: 4,  // Justice & Civil Liberties → axes 5 (-1), 6 (-1)
  7: 8,  // Foreign Affairs → axis 10 (-1)
};

const responses: QuizResponses = { forcedChoice, scaled, budget };

// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------

describe("computeFullResults — integration", () => {
  // Run once and share the result
  const result = computeFullResults(responses);

  // --- Output shape ---

  it("returns an object with axisScores, compass, and archetype", () => {
    expect(result).toHaveProperty("axisScores");
    expect(result).toHaveProperty("compass");
    expect(result).toHaveProperty("archetype");
  });

  it("axisScores has exactly 12 entries", () => {
    expect(result.axisScores).toHaveLength(12);
  });

  it("each axisScore has the expected properties", () => {
    for (const as of result.axisScores) {
      expect(as).toHaveProperty("axisId");
      expect(as).toHaveProperty("fcScore");
      expect(as).toHaveProperty("scScore");
      expect(as).toHaveProperty("bgScore");
      expect(as).toHaveProperty("finalScore");
      expect(as).toHaveProperty("confidence");
      expect(as).toHaveProperty("tension");
    }
  });

  it("axisScores contains each axisId from 1 to 12 exactly once", () => {
    const ids = result.axisScores.map((as) => as.axisId).sort((a, b) => a - b);
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  // --- Value ranges ---

  it("all fcScore values are in [-1.0, +1.0]", () => {
    for (const as of result.axisScores) {
      expect(as.fcScore).toBeGreaterThanOrEqual(-1.0);
      expect(as.fcScore).toBeLessThanOrEqual(1.0);
    }
  });

  it("all scScore values are in [-1.0, +1.0]", () => {
    for (const as of result.axisScores) {
      expect(as.scScore).toBeGreaterThanOrEqual(-1.0);
      expect(as.scScore).toBeLessThanOrEqual(1.0);
    }
  });

  it("bgScore is a number or null for each axis", () => {
    for (const as of result.axisScores) {
      if (as.bgScore !== null) {
        expect(typeof as.bgScore).toBe("number");
        expect(as.bgScore).toBeGreaterThanOrEqual(-1.0);
        expect(as.bgScore).toBeLessThanOrEqual(1.0);
      }
    }
  });

  it("all finalScore values are in [-1.0, +1.0]", () => {
    for (const as of result.axisScores) {
      expect(as.finalScore).toBeGreaterThanOrEqual(-1.0);
      expect(as.finalScore).toBeLessThanOrEqual(1.0);
    }
  });

  it("confidence is one of: high, moderate, low, conflicted", () => {
    const valid = new Set(["high", "moderate", "low", "conflicted"]);
    for (const as of result.axisScores) {
      expect(valid.has(as.confidence)).toBe(true);
    }
  });

  it("tension has detected, magnitude, level, and direction", () => {
    for (const as of result.axisScores) {
      expect(typeof as.tension.detected).toBe("boolean");
      expect(typeof as.tension.magnitude).toBe("number");
      expect(["none", "mild", "moderate", "strong"]).toContain(as.tension.level);
      const validDir = [
        null,
        "principles_A_but_budget_B",
        "principles_B_but_budget_A",
      ];
      expect(validDir).toContain(as.tension.direction);
    }
  });

  // --- Axes with no budget mapping have bgScore = null ---

  it("axes 3, 7, 8, 9 have bgScore = null (no budget mapping)", () => {
    for (const axisId of [3, 7, 8, 9]) {
      const as = result.axisScores.find((a) => a.axisId === axisId);
      expect(as?.bgScore).toBeNull();
    }
  });

  it("axes with budget mappings have non-null bgScore", () => {
    const axesWithBudget = [1, 2, 4, 5, 6, 10, 11, 12];
    for (const axisId of axesWithBudget) {
      const as = result.axisScores.find((a) => a.axisId === axisId);
      expect(as?.bgScore).not.toBeNull();
    }
  });

  // --- Compass ---

  it("compass has economic and cultural numbers", () => {
    expect(typeof result.compass.economic).toBe("number");
    expect(typeof result.compass.cultural).toBe("number");
  });

  it("compass.economic is in [-1.0, +1.0]", () => {
    expect(result.compass.economic).toBeGreaterThanOrEqual(-1.0);
    expect(result.compass.economic).toBeLessThanOrEqual(1.0);
  });

  it("compass.cultural is in [-1.0, +1.0]", () => {
    expect(result.compass.cultural).toBeGreaterThanOrEqual(-1.0);
    expect(result.compass.cultural).toBeLessThanOrEqual(1.0);
  });

  // --- Archetype ---

  it("archetype has primaryId, secondaryId, primaryMatchPct, secondaryMatchPct, isBlended", () => {
    expect(typeof result.archetype.primaryId).toBe("string");
    expect(typeof result.archetype.secondaryId).toBe("string");
    expect(typeof result.archetype.primaryMatchPct).toBe("number");
    expect(typeof result.archetype.secondaryMatchPct).toBe("number");
    expect(typeof result.archetype.isBlended).toBe("boolean");
  });

  it("archetype primaryId and secondaryId differ", () => {
    expect(result.archetype.primaryId).not.toBe(result.archetype.secondaryId);
  });

  it("primaryMatchPct >= secondaryMatchPct", () => {
    expect(result.archetype.primaryMatchPct).toBeGreaterThanOrEqual(
      result.archetype.secondaryMatchPct
    );
  });

  it("primaryMatchPct is in [0, 100]", () => {
    expect(result.archetype.primaryMatchPct).toBeGreaterThanOrEqual(0);
    expect(result.archetype.primaryMatchPct).toBeLessThanOrEqual(100);
  });

  it("secondaryMatchPct is in [0, 100]", () => {
    expect(result.archetype.secondaryMatchPct).toBeGreaterThanOrEqual(0);
    expect(result.archetype.secondaryMatchPct).toBeLessThanOrEqual(100);
  });

  // --- Neutral respondent produces centrist result ---

  describe("neutral/centrist respondent (all-3 SC, alternating FC, baseline budget)", () => {
    const neutralFC: Record<string, "A" | "B"> = {};
    // Give each axis 2 A and 1 B to keep it slightly left of neutral;
    // use all 3 A for a truly neutral FC (mean = -1): instead all B = +1.
    // Actually: 2A+1B = (-1-1+1)/3 = -1/3; to get 0 we'd need a mix not available with 3 items.
    // Use half-and-half: for 2-per-axis pattern some axes can't reach exactly 0.
    // Use all "A" for simplicity — this is just a smoke test for the centrist-ish output.
    for (let axis = 1; axis <= 12; axis++) {
      for (let item = 1; item <= 3; item++) {
        neutralFC[`fc-${axis}-${item}`] = "A";
      }
    }

    const neutralSC: Record<string, 1 | 2 | 3 | 4 | 5> = {};
    for (let axis = 1; axis <= 12; axis++) {
      for (let item = 1; item <= 3; item++) {
        neutralSC[`sc-${axis}-${item}`] = 3; // midpoint → sc = 0
      }
    }

    // Equal allocation budget → all deviations = 0 → bg = tanh(0) ≈ 0
    // 50/7 ≈ 7.14 per ministry; use exact equal split
    const baselineBudget: Record<number, number> = {};
    for (let i = 1; i <= 7; i++) {
      baselineBudget[i] = 50 / 7;
    }

    const neutralResult = computeFullResults({
      forcedChoice: neutralFC,
      scaled: neutralSC,
      budget: baselineBudget,
    });

    it("all-A FC with neutral SC and baseline budget produces fcScore = -1.0 on every axis", () => {
      for (const as of neutralResult.axisScores) {
        expect(as.fcScore).toBeCloseTo(-1.0, 5);
      }
    });

    it("all-A FC with neutral SC and baseline budget produces scScore = 0.0 on every axis", () => {
      for (const as of neutralResult.axisScores) {
        expect(as.scScore).toBeCloseTo(0.0, 5);
      }
    });

    it("baseline budget produces bgScore = 0.0 for axes with budget mappings", () => {
      for (const as of neutralResult.axisScores) {
        if (as.bgScore !== null) {
          expect(as.bgScore).toBeCloseTo(0.0, 5);
        }
      }
    });

    it("all finalScores are in [-1.0, +1.0]", () => {
      for (const as of neutralResult.axisScores) {
        expect(as.finalScore).toBeGreaterThanOrEqual(-1.0);
        expect(as.finalScore).toBeLessThanOrEqual(1.0);
      }
    });

    it("compass is in valid range", () => {
      expect(neutralResult.compass.economic).toBeGreaterThanOrEqual(-1.0);
      expect(neutralResult.compass.economic).toBeLessThanOrEqual(1.0);
      expect(neutralResult.compass.cultural).toBeGreaterThanOrEqual(-1.0);
      expect(neutralResult.compass.cultural).toBeLessThanOrEqual(1.0);
    });
  });
});
