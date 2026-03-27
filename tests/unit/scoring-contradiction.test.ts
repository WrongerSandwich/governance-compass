import { describe, it, expect } from "vitest";
import { detectContradiction } from "@/lib/scoring";
import { TENSION_THRESHOLDS, STATED_FC_WEIGHT, STATED_SC_WEIGHT } from "@/lib/scoring-types";

// Helper: compute stated score the same way the implementation does.
function stated(fc: number, sc: number): number {
  return STATED_FC_WEIGHT * fc + STATED_SC_WEIGHT * sc;
}

// ---------------------------------------------------------------------------
// No budget data — early return
// ---------------------------------------------------------------------------

describe("detectContradiction — no budget data", () => {
  it("returns detected=false, level='none', magnitude=0, direction=null when bgScore is null", () => {
    const result = detectContradiction(0.8, 0.6, null, 1);
    expect(result).toEqual({
      detected: false,
      magnitude: 0,
      level: "none",
      direction: null,
    });
  });

  it("returns the same early-exit result regardless of fc/sc values when bg is null", () => {
    const result = detectContradiction(-1.0, -1.0, null, 5);
    expect(result).toEqual({
      detected: false,
      magnitude: 0,
      level: "none",
      direction: null,
    });
  });
});

// ---------------------------------------------------------------------------
// Tension level classification
// ---------------------------------------------------------------------------

describe("detectContradiction — tension levels", () => {
  // No tension: |stated - bgScore| < 0.51
  it("returns level='none' and detected=false when magnitude is exactly 0 (perfect agreement)", () => {
    // fc=0.5, sc=0.5 → stated ≈ 0.50; bgScore=0.50 → magnitude=0
    const fc = 0.5, sc = 0.5;
    const bg = stated(fc, sc); // same value
    const result = detectContradiction(fc, sc, bg, 1);
    expect(result.level).toBe("none");
    expect(result.detected).toBe(false);
    expect(result.magnitude).toBeCloseTo(0);
  });

  it("returns level='none' when magnitude is 0.50 (just below mild threshold)", () => {
    // Place bg so |stated - bg| = 0.50 exactly
    const fc = 1.0, sc = 1.0;
    const s = stated(fc, sc); // = 1.0
    const bg = s - 0.50;      // magnitude = 0.50
    const result = detectContradiction(fc, sc, bg, 1);
    expect(result.level).toBe("none");
    expect(result.detected).toBe(false);
    expect(result.magnitude).toBeCloseTo(0.50);
  });

  // Mild: 0.51 – 1.00
  it("returns level='mild' and detected=true when magnitude is exactly at the mild threshold (0.51)", () => {
    const fc = 1.0, sc = 1.0;
    const s = stated(fc, sc); // = 1.0
    const bg = s - 0.51;      // magnitude = 0.51
    const result = detectContradiction(fc, sc, bg, 1);
    expect(result.level).toBe("mild");
    expect(result.detected).toBe(true);
    expect(result.magnitude).toBeCloseTo(0.51);
  });

  it("returns level='mild' when magnitude is 0.75 (middle of mild range)", () => {
    const fc = 1.0, sc = 1.0;
    const s = stated(fc, sc);
    const bg = s - 0.75;
    const result = detectContradiction(fc, sc, bg, 1);
    expect(result.level).toBe("mild");
    expect(result.detected).toBe(true);
  });

  it("returns level='mild' when magnitude is 1.00 (top of mild range)", () => {
    const fc = 1.0, sc = 1.0;
    const s = stated(fc, sc);
    const bg = s - 1.00;
    const result = detectContradiction(fc, sc, bg, 1);
    expect(result.level).toBe("mild");
    expect(result.detected).toBe(true);
    expect(result.magnitude).toBeCloseTo(1.00);
  });

  // Moderate: 1.01 – 1.50
  it("returns level='moderate' at the moderate threshold (1.01)", () => {
    const fc = 1.0, sc = 1.0;
    const s = stated(fc, sc);
    const bg = s - 1.01;
    const result = detectContradiction(fc, sc, bg, 1);
    expect(result.level).toBe("moderate");
    expect(result.detected).toBe(true);
    expect(result.magnitude).toBeCloseTo(1.01);
  });

  it("returns level='moderate' at the top of the moderate range (1.50)", () => {
    const fc = 1.0, sc = 1.0;
    const s = stated(fc, sc);
    const bg = s - 1.50;
    const result = detectContradiction(fc, sc, bg, 1);
    expect(result.level).toBe("moderate");
    expect(result.detected).toBe(true);
    expect(result.magnitude).toBeCloseTo(1.50);
  });

  // Strong: 1.51 – 2.00
  it("returns level='strong' at the strong threshold (1.51)", () => {
    const fc = 1.0, sc = 1.0;
    const s = stated(fc, sc);
    const bg = s - 1.51;
    const result = detectContradiction(fc, sc, bg, 1);
    expect(result.level).toBe("strong");
    expect(result.detected).toBe(true);
    expect(result.magnitude).toBeCloseTo(1.51);
  });

  it("returns level='strong' at the maximum possible magnitude (2.00)", () => {
    // stated = +1.0, bg = -1.0 → magnitude = 2.0
    const fc = 1.0, sc = 1.0; // stated = 1.0
    const bg = -1.0;
    const result = detectContradiction(fc, sc, bg, 1);
    expect(result.level).toBe("strong");
    expect(result.detected).toBe(true);
    expect(result.magnitude).toBeCloseTo(2.0);
  });
});

// ---------------------------------------------------------------------------
// Direction detection
// ---------------------------------------------------------------------------

describe("detectContradiction — direction", () => {
  it("returns direction='principles_A_but_budget_B' when stated < 0 and bgScore > 0", () => {
    // stated = -1.0, bgScore = +1.0 → magnitude = 2.0, opposite sides
    const fc = -1.0, sc = -1.0; // stated ≈ -1.0
    const bg = 1.0;
    const result = detectContradiction(fc, sc, bg, 1);
    expect(result.detected).toBe(true);
    expect(result.direction).toBe("principles_A_but_budget_B");
  });

  it("returns direction='principles_B_but_budget_A' when stated > 0 and bgScore < 0", () => {
    const fc = 1.0, sc = 1.0; // stated ≈ +1.0
    const bg = -1.0;
    const result = detectContradiction(fc, sc, bg, 1);
    expect(result.detected).toBe(true);
    expect(result.direction).toBe("principles_B_but_budget_A");
  });

  it("returns direction=null when stated and bgScore are both negative (same side)", () => {
    // Both on the A side; large magnitude difference but no directional contradiction
    const fc = -0.2, sc = -0.2; // stated ≈ -0.2
    const bg = -1.0;             // magnitude = 0.8 → mild, but same side
    const result = detectContradiction(fc, sc, bg, 1);
    expect(result.detected).toBe(true);
    expect(result.direction).toBe(null);
  });

  it("returns direction=null when stated and bgScore are both positive (same side)", () => {
    const fc = 0.2, sc = 0.2; // stated ≈ +0.2
    const bg = 1.0;             // magnitude = 0.8 → mild, but same side
    const result = detectContradiction(fc, sc, bg, 1);
    expect(result.detected).toBe(true);
    expect(result.direction).toBe(null);
  });

  it("returns direction=null when tension is not detected (level='none')", () => {
    const fc = 0.5, sc = 0.5;
    const bg = stated(fc, sc); // no tension
    const result = detectContradiction(fc, sc, bg, 1);
    expect(result.detected).toBe(false);
    expect(result.direction).toBe(null);
  });

  it("returns direction=null when stated is exactly 0 (no side to determine direction)", () => {
    // stated = 0, bg = -0.8 → magnitude = 0.8 → mild; stated not < 0 so direction = null
    const fc = 0.0, sc = 0.0; // stated = 0.0
    const bg = -0.8;
    const result = detectContradiction(fc, sc, bg, 1);
    expect(result.detected).toBe(true);
    expect(result.direction).toBe(null);
  });
});

// ---------------------------------------------------------------------------
// Magnitude accuracy
// ---------------------------------------------------------------------------

describe("detectContradiction — magnitude accuracy", () => {
  it("magnitude equals |stated - bgScore|", () => {
    const fc = 0.6, sc = 0.4;
    const bg = -0.3;
    const s = stated(fc, sc);
    const expectedMag = Math.abs(s - bg);
    const result = detectContradiction(fc, sc, bg, 2);
    expect(result.magnitude).toBeCloseTo(expectedMag, 5);
  });

  it("uses STATED_FC_WEIGHT and STATED_SC_WEIGHT for the stated score", () => {
    const fc = 0.8, sc = -0.4;
    const bg = 0.0;
    const s = STATED_FC_WEIGHT * fc + STATED_SC_WEIGHT * sc;
    const expectedMag = Math.abs(s - bg);
    const result = detectContradiction(fc, sc, bg, 3);
    expect(result.magnitude).toBeCloseTo(expectedMag, 5);
  });
});

// ---------------------------------------------------------------------------
// Axis ID is passed through (no axis-specific logic expected in Stage 4)
// ---------------------------------------------------------------------------

describe("detectContradiction — axis-agnostic", () => {
  it("produces the same result for different axis IDs given identical fc/sc/bg values", () => {
    const fc = 0.5, sc = -0.5, bg = -0.9;
    const r1 = detectContradiction(fc, sc, bg, 1);
    const r2 = detectContradiction(fc, sc, bg, 7);
    expect(r1).toEqual(r2);
  });
});
