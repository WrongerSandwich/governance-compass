import { describe, it, expect } from "vitest";
import { matchArchetype } from "@/lib/scoring";
import {
  MAX_ARCHETYPE_DISTANCE,
  BLENDED_THRESHOLD_PCT,
  LOW_MATCH_THRESHOLD_PCT,
} from "@/lib/scoring-types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a 12-element array from a prototype by copying it (perfect match). */
function perfectMatchFor(prototype: number[]): number[] {
  return [...prototype];
}

// Reference vectors (kept in sync with src/data/archetypes.ts).
const INSTITUTIONAL_MODERATE_PROTOTYPE = [-0.3, 0.5, 0.4, 0.55, -0.25, -0.35, -0.5, 0.25, -0.2, -0.15, -0.25, -0.1];
const SOCIAL_DEMOCRAT_PROTOTYPE = [-0.7, -0.3, 0.0, 0.2, -0.2, -0.5, -0.5, -0.3, -0.4, -0.4, -0.2, 0.0];
const FREE_MARKETEER_PROTOTYPE = [0.8, 0.5, -0.3, 0.0, -0.6, -0.3, 0.0, 0.0, 0.2, 0.2, 0.0, 0.6];
const RADICAL_EGALITARIAN_PROTOTYPE = [-0.85, -0.45, -0.45, -0.2, -0.55, -0.55, -0.7, -0.6, -0.75, -0.45, -0.6, -0.4];

// ---------------------------------------------------------------------------
// Constants sanity check
// ---------------------------------------------------------------------------

describe("scoring constants — Stage 6", () => {
  it("MAX_ARCHETYPE_DISTANCE equals sqrt(48)", () => {
    expect(MAX_ARCHETYPE_DISTANCE).toBeCloseTo(Math.sqrt(48), 5);
  });

  it("BLENDED_THRESHOLD_PCT is 10", () => {
    expect(BLENDED_THRESHOLD_PCT).toBe(10);
  });

  it("LOW_MATCH_THRESHOLD_PCT is 55", () => {
    expect(LOW_MATCH_THRESHOLD_PCT).toBe(55);
  });
});

// ---------------------------------------------------------------------------
// Return shape
// ---------------------------------------------------------------------------

describe("matchArchetype — return shape", () => {
  it("returns an object with the expected properties", () => {
    const result = matchArchetype(new Array(12).fill(0));
    expect(result).toHaveProperty("primaryId");
    expect(result).toHaveProperty("primaryMatchPct");
    expect(result).toHaveProperty("secondaryId");
    expect(result).toHaveProperty("secondaryMatchPct");
    expect(result).toHaveProperty("isBlended");
    expect(typeof result.primaryId).toBe("string");
    expect(typeof result.primaryMatchPct).toBe("number");
    expect(typeof result.secondaryId).toBe("string");
    expect(typeof result.secondaryMatchPct).toBe("number");
    expect(typeof result.isBlended).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// Institutional Moderate — respondent at exact prototype
// ---------------------------------------------------------------------------

describe("matchArchetype — Institutional Moderate (exact prototype)", () => {
  it("identifies institutional-moderate as primary with 100% match", () => {
    const result = matchArchetype(INSTITUTIONAL_MODERATE_PROTOTYPE);
    expect(result.primaryId).toBe("institutional-moderate");
    expect(result.primaryMatchPct).toBe(100);
  });

  it("is NOT blended (clear winner at distance 0)", () => {
    const result = matchArchetype(INSTITUTIONAL_MODERATE_PROTOTYPE);
    expect(result.isBlended).toBe(false);
  });

  it("secondary is social-democrat (closest neighbour to institutional-moderate)", () => {
    const result = matchArchetype(INSTITUTIONAL_MODERATE_PROTOTYPE);
    expect(result.secondaryId).toBe("social-democrat");
  });

  it("secondary match is < 100%", () => {
    const result = matchArchetype(INSTITUTIONAL_MODERATE_PROTOTYPE);
    expect(result.secondaryMatchPct).toBeLessThan(100);
    expect(result.secondaryMatchPct).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Perfect match to a non-centrist prototype
// ---------------------------------------------------------------------------

describe("matchArchetype — perfect match to prototype", () => {
  it("social-democrat exact prototype → 100% primary match", () => {
    const result = matchArchetype(perfectMatchFor(SOCIAL_DEMOCRAT_PROTOTYPE));
    expect(result.primaryId).toBe("social-democrat");
    expect(result.primaryMatchPct).toBeCloseTo(100, 5);
  });

  it("free-marketeer exact prototype → 100% primary match", () => {
    const result = matchArchetype(perfectMatchFor(FREE_MARKETEER_PROTOTYPE));
    expect(result.primaryId).toBe("free-marketeer");
    expect(result.primaryMatchPct).toBeCloseTo(100, 5);
  });

  it("perfect match is never blended (distance = 0 → ratio = Infinity)", () => {
    const result = matchArchetype(perfectMatchFor(SOCIAL_DEMOCRAT_PROTOTYPE));
    expect(result.isBlended).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Match percentage formula
// ---------------------------------------------------------------------------

describe("matchArchetype — match percentage formula", () => {
  it("match_pct = max(0, (1 - distance / MAX_DISTANCE)) * 100", () => {
    // Place respondent at social-democrat prototype shifted +0.5 on axis 1.
    // Distance from social-democrat = 0.5 (single-axis deviation),
    // and social-democrat remains the closest archetype at that offset.
    const respondent = [...SOCIAL_DEMOCRAT_PROTOTYPE];
    respondent[0] = SOCIAL_DEMOCRAT_PROTOTYPE[0] + 0.5;
    const dist = 0.5;
    const expectedPct = Math.round((1 - dist / MAX_ARCHETYPE_DISTANCE) * 100);
    const result = matchArchetype(respondent);
    expect(result.primaryId).toBe("social-democrat");
    expect(result.primaryMatchPct).toBe(expectedPct);
  });

  it("match_pct is always >= 0 (floor at zero)", () => {
    const alternating = Array.from({ length: 12 }, (_, i) => (i % 2 === 0 ? 1.0 : -1.0));
    const result = matchArchetype(alternating);
    expect(result.primaryMatchPct).toBeGreaterThanOrEqual(0);
    expect(result.secondaryMatchPct).toBeGreaterThanOrEqual(0);
  });

  it("match_pct is <= 100 for all respondents", () => {
    const respondent = new Array(12).fill(0.3);
    const result = matchArchetype(respondent);
    expect(result.primaryMatchPct).toBeLessThanOrEqual(100);
    expect(result.secondaryMatchPct).toBeLessThanOrEqual(100);
  });
});

// ---------------------------------------------------------------------------
// Correct primary and secondary identification
// ---------------------------------------------------------------------------

describe("matchArchetype — primary and secondary identification", () => {
  it("primary has higher match percentage than secondary", () => {
    const respondent = new Array(12).fill(0);
    respondent[0] = 0.4;
    respondent[1] = 0.2;
    const result = matchArchetype(respondent);
    expect(result.primaryMatchPct).toBeGreaterThanOrEqual(result.secondaryMatchPct);
  });

  it("primary and secondary have different IDs", () => {
    const result = matchArchetype(new Array(12).fill(0));
    expect(result.primaryId).not.toBe(result.secondaryId);
  });

  it("identifies developmental-modernizer as primary for all-positive respondent", () => {
    // All +1.0 → developmental-modernizer is closest (dist ≈ 2.078, pct ≈ 70%)
    const result = matchArchetype(new Array(12).fill(1.0));
    expect(result.primaryId).toBe("developmental-modernizer");
    expect(result.primaryMatchPct).toBe(70);
  });

  it("identifies authoritarian-traditionalist as secondary for all-positive respondent", () => {
    // All +1.0 → second closest is authoritarian-traditionalist (dist ≈ 2.324, pct ≈ 66%)
    const result = matchArchetype(new Array(12).fill(1.0));
    expect(result.secondaryId).toBe("authoritarian-traditionalist");
    expect(result.secondaryMatchPct).toBe(66);
  });
});

// ---------------------------------------------------------------------------
// Blended type detection
// ---------------------------------------------------------------------------

describe("matchArchetype — blended type detection", () => {
  // Midpoint between radical-egalitarian and social-democrat
  // (their vectors are 1.052 apart → midpoint sits 0.526 from each).
  const RAD_SD_MIDPOINT = RADICAL_EGALITARIAN_PROTOTYPE.map(
    (v, i) => (v + SOCIAL_DEMOCRAT_PROTOTYPE[i]) / 2
  );

  it("respondent at exact midpoint of two prototypes → isBlended = true", () => {
    const result = matchArchetype(RAD_SD_MIDPOINT);
    expect(result.isBlended).toBe(true);
  });

  it("midpoint respondent has near-equal primary and secondary match percentages", () => {
    const result = matchArchetype(RAD_SD_MIDPOINT);
    expect(Math.abs(result.primaryMatchPct - result.secondaryMatchPct)).toBeCloseTo(0, 3);
  });

  it("all-positive respondent is NOT blended (developmental-modernizer / authoritarian-traditionalist gap > 10%)", () => {
    // dist primary ≈ 2.078, dist secondary ≈ 2.324
    // |2.078 - 2.324| / 2.078 ≈ 0.118 (> 0.10) → not blended
    const result = matchArchetype(new Array(12).fill(1.0));
    expect(result.isBlended).toBe(false);
  });

  it("respondent strongly aligned to one archetype → isBlended = false", () => {
    // Perfect match to radical-egalitarian → distance 0, not blended
    const result = matchArchetype(RADICAL_EGALITARIAN_PROTOTYPE);
    expect(result.isBlended).toBe(false);
  });

  it("midpoint between social-democrat and radical-egalitarian → both at 92%", () => {
    const result = matchArchetype(RAD_SD_MIDPOINT);
    expect(result.primaryMatchPct).toBe(92);
    expect(result.secondaryMatchPct).toBe(92);
    expect(result.isBlended).toBe(true);
    // Primary and secondary should be the two prototypes used to construct the midpoint
    const ids = [result.primaryId, result.secondaryId].sort();
    expect(ids).toEqual(["radical-egalitarian", "social-democrat"]);
  });
});

// ---------------------------------------------------------------------------
// Low match threshold — unusual profile
// ---------------------------------------------------------------------------

describe("matchArchetype — low match threshold (unusual profile)", () => {
  it("alternating ±1 respondent yields primaryMatchPct below LOW_MATCH_THRESHOLD_PCT", () => {
    const alternating = Array.from({ length: 12 }, (_, i) => (i % 2 === 0 ? 1.0 : -1.0));
    const result = matchArchetype(alternating);
    expect(result.primaryMatchPct).toBeLessThan(LOW_MATCH_THRESHOLD_PCT);
  });

  it("a strongly aligned respondent is above the low match threshold", () => {
    // Social-democrat exact prototype → 100%
    const result = matchArchetype(SOCIAL_DEMOCRAT_PROTOTYPE);
    expect(result.primaryMatchPct).toBeGreaterThanOrEqual(LOW_MATCH_THRESHOLD_PCT);
  });
});

// ---------------------------------------------------------------------------
// Weighted Euclidean distance — all axis weights = 1.0 (v1)
// ---------------------------------------------------------------------------

describe("matchArchetype — distance calculation", () => {
  it("uses equal (1.0) weight for all 12 axes", () => {
    // Respondent at social-democrat prototype except axis 6 shifted by +0.3.
    // Distance from social-democrat = 0.3 (single-axis deviation),
    // and social-democrat remains the closest archetype.
    const respondent = [...SOCIAL_DEMOCRAT_PROTOTYPE];
    respondent[5] = SOCIAL_DEMOCRAT_PROTOTYPE[5] + 0.3;
    const expectedDist = 0.3;
    const expectedPct = Math.round((1 - expectedDist / MAX_ARCHETYPE_DISTANCE) * 100);
    const result = matchArchetype(respondent);
    expect(result.primaryId).toBe("social-democrat");
    expect(result.primaryMatchPct).toBe(expectedPct);
  });

  it("two equal deviations on different axes from the same prototype produce the same distance", () => {
    const r1 = [...SOCIAL_DEMOCRAT_PROTOTYPE];
    r1[0] = SOCIAL_DEMOCRAT_PROTOTYPE[0] + 0.3;
    const r2 = [...SOCIAL_DEMOCRAT_PROTOTYPE];
    r2[11] = SOCIAL_DEMOCRAT_PROTOTYPE[11] + 0.3;
    const res1 = matchArchetype(r1);
    const res2 = matchArchetype(r2);
    expect(res1.primaryId).toBe("social-democrat");
    expect(res2.primaryId).toBe("social-democrat");
    expect(res1.primaryMatchPct).toBeCloseTo(res2.primaryMatchPct, 5);
  });
});
