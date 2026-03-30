import { describe, it, expect } from "vitest";
import {
  fuseModalityScores,
  computeAllFinalScores,
} from "@/lib/scoring";
import { AXIS_WEIGHT_PROFILES } from "@/lib/scoring-types";
import type { PerModalityScores } from "@/lib/scoring-types";

// ---------------------------------------------------------------------------
// fuseModalityScores — basic weight profiles
// ---------------------------------------------------------------------------

describe("fuseModalityScores", () => {
  // Axis 1: full budget — fc=0.40, sc=0.35, bg=0.25
  describe("full budget axis (axis 1)", () => {
    it("computes 0.40*fc + 0.35*sc + 0.25*bg when all inputs are 1.0", () => {
      const result = fuseModalityScores(1.0, 1.0, 1.0, 1);
      expect(result).toBeCloseTo(0.45 + 0.30 + 0.25);
    });

    it("computes 0.45*fc + 0.30*sc + 0.25*bg with distinct values", () => {
      const fc = 0.8, sc = 0.6, bg = 0.4;
      const expected = 0.45 * fc + 0.30 * sc + 0.25 * bg;
      expect(fuseModalityScores(fc, sc, bg, 1)).toBeCloseTo(expected);
    });

    it("returns 0 when all inputs are 0", () => {
      expect(fuseModalityScores(0, 0, 0, 1)).toBeCloseTo(0);
    });

    it("returns -1.0 when all inputs are -1.0 (extreme low)", () => {
      expect(fuseModalityScores(-1.0, -1.0, -1.0, 1)).toBeCloseTo(-1.0);
    });

    it("returns +1.0 when all inputs are +1.0 (extreme high)", () => {
      expect(fuseModalityScores(1.0, 1.0, 1.0, 1)).toBeCloseTo(1.0);
    });
  });

  // Axis 3: no budget — fc=0.60, sc=0.40, bg=0.00
  describe("no budget axis (axis 3)", () => {
    it("computes 0.60*fc + 0.40*sc when bg is null", () => {
      const fc = 0.6, sc = -0.4;
      const expected = 0.60 * fc + 0.40 * sc;
      expect(fuseModalityScores(fc, sc, null, 3)).toBeCloseTo(expected);
    });

    it("returns 0 when fc and sc are 0 and bg is null", () => {
      expect(fuseModalityScores(0, 0, null, 3)).toBeCloseTo(0);
    });

    it("returns +1.0 when fc=1 and sc=1 and bg is null (fc+sc weights sum to 1)", () => {
      expect(fuseModalityScores(1.0, 1.0, null, 3)).toBeCloseTo(1.0);
    });

    it("returns -1.0 when fc=-1 and sc=-1 and bg is null", () => {
      expect(fuseModalityScores(-1.0, -1.0, null, 3)).toBeCloseTo(-1.0);
    });

    it("uses 0.60 weight for fc and 0.40 for sc (axis 9 same profile)", () => {
      const fc = 1.0, sc = 0.0;
      expect(fuseModalityScores(fc, sc, null, 9)).toBeCloseTo(0.60);
    });
  });

  // Axis 4: partial budget — fc=0.50, sc=0.35, bg=0.15
  describe("partial budget axis (axis 4)", () => {
    it("computes 0.50*fc + 0.35*sc + 0.15*bg when bg is present", () => {
      const fc = 0.5, sc = 0.3, bg = 0.7;
      const expected = 0.50 * fc + 0.35 * sc + 0.15 * bg;
      expect(fuseModalityScores(fc, sc, bg, 4)).toBeCloseTo(expected);
    });

    it("normalises fc and sc when bg is null but profile has bg > 0", () => {
      // Profile bg=0.15, so fc+sc weights in profile = 0.50+0.35 = 0.85
      // Normalized: fc = 0.50/0.85, sc = 0.35/0.85
      const fc = 0.8, sc = -0.2;
      const normFcW = 0.50 / (0.50 + 0.35);
      const normScW = 0.35 / (0.50 + 0.35);
      const expected = normFcW * fc + normScW * sc;
      expect(fuseModalityScores(fc, sc, null, 4)).toBeCloseTo(expected);
    });

    it("returns 0 when all inputs are 0 (including bg=null)", () => {
      expect(fuseModalityScores(0, 0, null, 4)).toBeCloseTo(0);
    });
  });

  // Axis 2: full budget — same profile as axis 1
  describe("full budget axis (axis 2) — bg null triggers normalization", () => {
    it("normalises fc and sc when bg is null (profile bg=0.25 > 0)", () => {
      // Profile: fc=0.45, sc=0.30, bg=0.25; fc+sc = 0.75
      // Normalized: fc = 0.45/0.75, sc = 0.30/0.75
      const fc = 1.0, sc = 0.0;
      const normFcW = 0.45 / (0.45 + 0.30);
      const expected = normFcW * fc;
      expect(fuseModalityScores(fc, sc, null, 2)).toBeCloseTo(expected);
    });
  });

  // Output range verification
  describe("output range [-1.0, +1.0]", () => {
    it("is bounded at +1.0 for extreme positive inputs (full budget)", () => {
      const result = fuseModalityScores(1.0, 1.0, 1.0, 1);
      expect(result).toBeGreaterThanOrEqual(-1.0);
      expect(result).toBeLessThanOrEqual(1.0);
    });

    it("is bounded at -1.0 for extreme negative inputs (full budget)", () => {
      const result = fuseModalityScores(-1.0, -1.0, -1.0, 1);
      expect(result).toBeGreaterThanOrEqual(-1.0);
      expect(result).toBeLessThanOrEqual(1.0);
    });

    it("stays within range for mixed extreme inputs (partial budget)", () => {
      const result = fuseModalityScores(1.0, -1.0, 0.5, 4);
      expect(result).toBeGreaterThanOrEqual(-1.0);
      expect(result).toBeLessThanOrEqual(1.0);
    });

    it("stays within range for no-budget axis with extreme inputs", () => {
      const result = fuseModalityScores(-1.0, 1.0, null, 3);
      expect(result).toBeGreaterThanOrEqual(-1.0);
      expect(result).toBeLessThanOrEqual(1.0);
    });
  });

  // Weight profile constants sanity checks
  describe("AXIS_WEIGHT_PROFILES constants", () => {
    it("full budget axes 1, 2, 5 have bg=0.25", () => {
      for (const axisId of [1, 2, 5]) {
        expect(AXIS_WEIGHT_PROFILES[axisId].bg).toBeCloseTo(0.25);
      }
    });

    it("no budget axes 3, 7, 8, 9 have bg=0.00", () => {
      for (const axisId of [3, 7, 8, 9]) {
        expect(AXIS_WEIGHT_PROFILES[axisId].bg).toBeCloseTo(0.00);
      }
    });

    it("partial budget axes 4, 6, 10, 11, 12 have bg=0.15", () => {
      for (const axisId of [4, 6, 10, 11, 12]) {
        expect(AXIS_WEIGHT_PROFILES[axisId].bg).toBeCloseTo(0.15);
      }
    });

    it("all profiles have fc+sc+bg summing to 1.0", () => {
      for (let axisId = 1; axisId <= 12; axisId++) {
        const p = AXIS_WEIGHT_PROFILES[axisId];
        expect(p.fc + p.sc + p.bg).toBeCloseTo(1.0);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// computeAllFinalScores
// ---------------------------------------------------------------------------

describe("computeAllFinalScores", () => {
  // Build a PerModalityScores with all zeros (bg=null for axes 3 and 9)
  // Axes with no budget mapping: 3, 7, 8, 9
  const noBudgetAxes = new Set([3, 7, 8, 9]);

  function buildPerModalityScores(
    fcVal: number,
    scVal: number,
    bgVal: number | null
  ): PerModalityScores {
    const scores: PerModalityScores = {};
    for (let axisId = 1; axisId <= 12; axisId++) {
      const hasBudget = !noBudgetAxes.has(axisId);
      scores[axisId] = {
        fc: fcVal,
        sc: scVal,
        bg: hasBudget ? bgVal : null,
      };
    }
    return scores;
  }

  it("returns an array with exactly 12 entries", () => {
    const scores = buildPerModalityScores(0, 0, 0);
    const result = computeAllFinalScores(scores);
    expect(result).toHaveLength(12);
  });

  it("each entry has axisId, finalScore, fcScore, scScore, bgScore fields", () => {
    const scores = buildPerModalityScores(0.5, 0.3, 0.1);
    const result = computeAllFinalScores(scores);
    for (const entry of result) {
      expect(entry).toHaveProperty("axisId");
      expect(entry).toHaveProperty("finalScore");
      expect(entry).toHaveProperty("fcScore");
      expect(entry).toHaveProperty("scScore");
      expect(entry).toHaveProperty("bgScore");
    }
  });

  it("axisIds cover 1 through 12", () => {
    const scores = buildPerModalityScores(0, 0, 0);
    const result = computeAllFinalScores(scores);
    const ids = result.map((r) => r.axisId).sort((a, b) => a - b);
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("returns 0 for all finalScores when all inputs are 0", () => {
    const scores = buildPerModalityScores(0, 0, 0);
    const result = computeAllFinalScores(scores);
    for (const entry of result) {
      expect(entry.finalScore).toBeCloseTo(0);
    }
  });

  it("returns +1.0 for all finalScores when all inputs are +1.0", () => {
    const scores = buildPerModalityScores(1.0, 1.0, 1.0);
    const result = computeAllFinalScores(scores);
    for (const entry of result) {
      expect(entry.finalScore).toBeCloseTo(1.0);
    }
  });

  it("returns -1.0 for all finalScores when all inputs are -1.0", () => {
    const scores = buildPerModalityScores(-1.0, -1.0, -1.0);
    const result = computeAllFinalScores(scores);
    for (const entry of result) {
      expect(entry.finalScore).toBeCloseTo(-1.0);
    }
  });

  it("axes 3, 7, 8, 9 have null bgScore and use fc+sc-only weights", () => {
    const scores = buildPerModalityScores(1.0, 0.0, null);
    const result = computeAllFinalScores(scores);

    for (const axisId of [3, 7, 8, 9]) {
      const axis = result.find((r) => r.axisId === axisId)!;
      expect(axis.bgScore).toBeNull();
      // Profile for no-budget axes: fc=0.60, sc=0.40, bg=0.00
      // finalScore = 0.60 * 1.0 + 0.40 * 0.0 = 0.60
      expect(axis.finalScore).toBeCloseTo(0.60);
    }
  });

  it("passes through fc, sc, bg scores in the result objects", () => {
    const scores = buildPerModalityScores(0.7, -0.3, 0.5);
    const result = computeAllFinalScores(scores);
    for (const entry of result) {
      expect(entry.fcScore).toBeCloseTo(0.7);
      expect(entry.scScore).toBeCloseTo(-0.3);
      if (!noBudgetAxes.has(entry.axisId)) {
        expect(entry.bgScore).toBeCloseTo(0.5);
      } else {
        expect(entry.bgScore).toBeNull();
      }
    }
  });

  it("all finalScores are within [-1.0, +1.0]", () => {
    const scores = buildPerModalityScores(1.0, -1.0, 0.8);
    const result = computeAllFinalScores(scores);
    for (const entry of result) {
      expect(entry.finalScore).toBeGreaterThanOrEqual(-1.0);
      expect(entry.finalScore).toBeLessThanOrEqual(1.0);
    }
  });

  it("axis 1 (full budget) computes correct finalScore with known values", () => {
    // axis 1 profile: fc=0.45, sc=0.30, bg=0.25
    const fc = 0.8, sc = -0.4, bg = 0.6;
    const expected = 0.45 * fc + 0.30 * sc + 0.25 * bg;
    const perModality: PerModalityScores = {
      ...buildPerModalityScores(0, 0, 0),
      1: { fc, sc, bg },
    };
    const result = computeAllFinalScores(perModality);
    const axis1 = result.find((r) => r.axisId === 1)!;
    expect(axis1.finalScore).toBeCloseTo(expected);
  });

  it("axis 4 (partial budget, bg null) normalises fc+sc weights", () => {
    // Profile bg=0.15 > 0, but bg is null → normalize
    // normFcW = 0.50/(0.50+0.35), normScW = 0.35/(0.50+0.35)
    const fc = 0.6, sc = 0.4;
    const normFcW = 0.50 / (0.50 + 0.35);
    const normScW = 0.35 / (0.50 + 0.35);
    const expected = normFcW * fc + normScW * sc;
    const perModality: PerModalityScores = {
      ...buildPerModalityScores(0, 0, 0),
      4: { fc, sc, bg: null },
    };
    const result = computeAllFinalScores(perModality);
    const axis4 = result.find((r) => r.axisId === 4)!;
    expect(axis4.finalScore).toBeCloseTo(expected);
  });
});
