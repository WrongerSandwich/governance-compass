import { describe, it, expect } from "vitest";
import { computeSuperDimensions } from "@/lib/scoring";
import { SD_ECONOMIC_WEIGHTS, SD_CULTURAL_WEIGHTS } from "@/lib/scoring-types";

// ---------------------------------------------------------------------------
// All-zero input
// ---------------------------------------------------------------------------

describe("computeSuperDimensions — all zeros", () => {
  it("returns { economic: 0, cultural: 0 } when all axis scores are 0", () => {
    const axisScores: Record<number, number> = {};
    for (let i = 1; i <= 12; i++) axisScores[i] = 0;
    const result = computeSuperDimensions(axisScores);
    expect(result.economic).toBeCloseTo(0);
    expect(result.cultural).toBeCloseTo(0);
  });

  it("returns { economic: 0, cultural: 0 } when axisScores is an empty record", () => {
    const result = computeSuperDimensions({});
    expect(result.economic).toBeCloseTo(0);
    expect(result.cultural).toBeCloseTo(0);
  });
});

// ---------------------------------------------------------------------------
// Economic super-dimension: 0.65 × axis1 + 0.35 × axis2
// ---------------------------------------------------------------------------

describe("computeSuperDimensions — economic dimension", () => {
  it("computes economic = 0.65 × axis1 + 0.35 × axis2", () => {
    const axisScores: Record<number, number> = {};
    for (let i = 1; i <= 12; i++) axisScores[i] = 0;
    axisScores[1] = 0.8;
    axisScores[2] = 0.4;
    const expected = SD_ECONOMIC_WEIGHTS[1] * 0.8 + SD_ECONOMIC_WEIGHTS[2] * 0.4;
    const result = computeSuperDimensions(axisScores);
    expect(result.economic).toBeCloseTo(expected, 5);
  });

  it("treats missing axis1 as 0 when computing economic", () => {
    const result = computeSuperDimensions({ 2: 1.0 });
    const expected = SD_ECONOMIC_WEIGHTS[2] * 1.0; // axis1 defaults to 0
    expect(result.economic).toBeCloseTo(expected, 5);
  });

  it("treats missing axis2 as 0 when computing economic", () => {
    const result = computeSuperDimensions({ 1: 1.0 });
    const expected = SD_ECONOMIC_WEIGHTS[1] * 1.0; // axis2 defaults to 0
    expect(result.economic).toBeCloseTo(expected, 5);
  });

  it("economic weights sum to 1.0 (axis1=1.0, axis2=1.0 → economic=1.0)", () => {
    const result = computeSuperDimensions({ 1: 1.0, 2: 1.0 });
    // 0.65 + 0.35 = 1.0
    expect(result.economic).toBeCloseTo(1.0, 5);
  });

  it("economic is negative when axis1 and axis2 are both -1.0", () => {
    const result = computeSuperDimensions({ 1: -1.0, 2: -1.0 });
    expect(result.economic).toBeCloseTo(-1.0, 5);
  });
});

// ---------------------------------------------------------------------------
// Cultural super-dimension: 0.30×axis7 + 0.20×axis8 + 0.20×axis9 + 0.15×axis5 + 0.15×axis4
// ---------------------------------------------------------------------------

describe("computeSuperDimensions — cultural dimension", () => {
  it("computes cultural using all five contributing axes", () => {
    const axisScores: Record<number, number> = {
      4: 0.2, 5: 0.4, 7: 0.6, 8: 0.8, 9: -0.2,
    };
    const expected =
      SD_CULTURAL_WEIGHTS[7] * 0.6 +
      SD_CULTURAL_WEIGHTS[8] * 0.8 +
      SD_CULTURAL_WEIGHTS[9] * -0.2 +
      SD_CULTURAL_WEIGHTS[5] * 0.4 +
      SD_CULTURAL_WEIGHTS[4] * 0.2;
    const result = computeSuperDimensions(axisScores);
    expect(result.cultural).toBeCloseTo(expected, 5);
  });

  it("treats missing cultural axes as 0", () => {
    const result = computeSuperDimensions({ 7: 1.0 });
    const expected = SD_CULTURAL_WEIGHTS[7] * 1.0;
    expect(result.cultural).toBeCloseTo(expected, 5);
  });

  it("cultural weights sum to 1.0 (all cultural axes = 1.0 → cultural = 1.0)", () => {
    const result = computeSuperDimensions({ 4: 1.0, 5: 1.0, 7: 1.0, 8: 1.0, 9: 1.0 });
    // 0.30 + 0.20 + 0.20 + 0.15 + 0.15 = 1.0
    expect(result.cultural).toBeCloseTo(1.0, 5);
  });

  it("cultural is -1.0 when all cultural axes are -1.0", () => {
    const result = computeSuperDimensions({ 4: -1.0, 5: -1.0, 7: -1.0, 8: -1.0, 9: -1.0 });
    expect(result.cultural).toBeCloseTo(-1.0, 5);
  });
});

// ---------------------------------------------------------------------------
// Output range [-1.0, +1.0]
// ---------------------------------------------------------------------------

describe("computeSuperDimensions — output range", () => {
  it("returns +1.0 for both dimensions when all relevant axes are +1.0", () => {
    const axisScores: Record<number, number> = {};
    for (let i = 1; i <= 12; i++) axisScores[i] = 1.0;
    const result = computeSuperDimensions(axisScores);
    expect(result.economic).toBeCloseTo(1.0, 5);
    expect(result.cultural).toBeCloseTo(1.0, 5);
  });

  it("returns -1.0 for both dimensions when all relevant axes are -1.0", () => {
    const axisScores: Record<number, number> = {};
    for (let i = 1; i <= 12; i++) axisScores[i] = -1.0;
    const result = computeSuperDimensions(axisScores);
    expect(result.economic).toBeCloseTo(-1.0, 5);
    expect(result.cultural).toBeCloseTo(-1.0, 5);
  });

  it("economic stays within [-1.0, +1.0] for extreme inputs", () => {
    const result = computeSuperDimensions({ 1: 1.0, 2: -1.0 });
    // 0.65*1.0 + 0.35*(-1.0) = 0.30
    expect(result.economic).toBeGreaterThanOrEqual(-1.0);
    expect(result.economic).toBeLessThanOrEqual(1.0);
    expect(result.economic).toBeCloseTo(0.30, 5);
  });

  it("cultural stays within [-1.0, +1.0] for mixed inputs", () => {
    const result = computeSuperDimensions({ 7: 1.0, 8: -1.0, 9: 1.0, 5: -1.0, 4: 1.0 });
    // 0.30*1 + 0.20*(-1) + 0.20*1 + 0.15*(-1) + 0.15*1 = 0.30-0.20+0.20-0.15+0.15 = 0.30
    expect(result.cultural).toBeGreaterThanOrEqual(-1.0);
    expect(result.cultural).toBeLessThanOrEqual(1.0);
    expect(result.cultural).toBeCloseTo(0.30, 5);
  });
});

// ---------------------------------------------------------------------------
// Mixed values — non-contributing axes are ignored
// ---------------------------------------------------------------------------

describe("computeSuperDimensions — non-contributing axes ignored", () => {
  it("axes 3, 6, 10, 11, 12 do not affect economic or cultural", () => {
    const baseScores = { 1: 0.5, 2: 0.5, 4: 0.5, 5: 0.5, 7: 0.5, 8: 0.5, 9: 0.5 };
    const withExtras = {
      ...baseScores,
      3: 1.0, 6: 1.0, 10: 1.0, 11: 1.0, 12: 1.0,
    };
    const r1 = computeSuperDimensions(baseScores);
    const r2 = computeSuperDimensions(withExtras);
    expect(r1.economic).toBeCloseTo(r2.economic, 5);
    expect(r1.cultural).toBeCloseTo(r2.cultural, 5);
  });
});

// ---------------------------------------------------------------------------
// Return type shape
// ---------------------------------------------------------------------------

describe("computeSuperDimensions — return shape", () => {
  it("returns an object with exactly 'economic' and 'cultural' numeric properties", () => {
    const result = computeSuperDimensions({ 1: 0.3, 2: 0.7 });
    expect(result).toHaveProperty("economic");
    expect(result).toHaveProperty("cultural");
    expect(typeof result.economic).toBe("number");
    expect(typeof result.cultural).toBe("number");
  });
});
