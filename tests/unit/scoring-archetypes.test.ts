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

/** Build a 12-element array that is the antipodal opposite of a prototype. */
function oppositeOf(prototype: number[]): number[] {
  return prototype.map((v) => -v);
}

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
  it("returns an object with the five expected properties", () => {
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
// Pragmatic Centrist (all-zeros) — perfect centrist respondent
// ---------------------------------------------------------------------------

describe("matchArchetype — Pragmatic Centrist (all zeros)", () => {
  it("identifies pragmatic-centrist as primary with 100% match", () => {
    const result = matchArchetype(new Array(12).fill(0));
    expect(result.primaryId).toBe("pragmatic-centrist");
    expect(result.primaryMatchPct).toBeCloseTo(100, 5);
  });

  it("primaryMatchPct is 100 (distance = 0)", () => {
    const result = matchArchetype(new Array(12).fill(0));
    expect(result.primaryMatchPct).toBeCloseTo(100, 5);
  });

  it("is NOT blended (clear winner at distance 0)", () => {
    const result = matchArchetype(new Array(12).fill(0));
    expect(result.isBlended).toBe(false);
  });

  it("secondary is civic-institutionalist (closest neighbour to centrist)", () => {
    const result = matchArchetype(new Array(12).fill(0));
    expect(result.secondaryId).toBe("civic-institutionalist");
  });

  it("secondary match is < 100%", () => {
    const result = matchArchetype(new Array(12).fill(0));
    expect(result.secondaryMatchPct).toBeLessThan(100);
    expect(result.secondaryMatchPct).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Perfect match to a non-centrist prototype
// ---------------------------------------------------------------------------

describe("matchArchetype — perfect match to prototype", () => {
  it("social-democrat exact prototype → 100% primary match", () => {
    // prototype: [-0.7, -0.3, 0.0, 0.2, -0.2, -0.5, -0.5, -0.3, -0.4, -0.4, -0.2, 0.0]
    const sdPrototype = [-0.7, -0.3, 0.0, 0.2, -0.2, -0.5, -0.5, -0.3, -0.4, -0.4, -0.2, 0.0];
    const result = matchArchetype(perfectMatchFor(sdPrototype));
    expect(result.primaryId).toBe("social-democrat");
    expect(result.primaryMatchPct).toBeCloseTo(100, 5);
  });

  it("free-marketeer exact prototype → 100% primary match", () => {
    // prototype: [0.8, 0.5, -0.3, 0.0, -0.6, -0.3, 0.0, 0.0, 0.2, 0.2, 0.0, 0.6]
    const fmPrototype = [0.8, 0.5, -0.3, 0.0, -0.6, -0.3, 0.0, 0.0, 0.2, 0.2, 0.0, 0.6];
    const result = matchArchetype(perfectMatchFor(fmPrototype));
    expect(result.primaryId).toBe("free-marketeer");
    expect(result.primaryMatchPct).toBeCloseTo(100, 5);
  });

  it("perfect match is never blended (distance = 0 → ratio = Infinity)", () => {
    const sdPrototype = [-0.7, -0.3, 0.0, 0.2, -0.2, -0.5, -0.5, -0.3, -0.4, -0.4, -0.2, 0.0];
    const result = matchArchetype(perfectMatchFor(sdPrototype));
    expect(result.isBlended).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Match percentage formula
// ---------------------------------------------------------------------------

describe("matchArchetype — match percentage formula", () => {
  it("match_pct = max(0, (1 - distance / MAX_DISTANCE)) * 100", () => {
    // For pragmatic-centrist prototype, test with a known offset
    // Place respondent at [0.5, 0, 0, ..., 0]: distance from centrist = 0.5
    const respondent = new Array(12).fill(0);
    respondent[0] = 0.5;
    const dist = 0.5; // sqrt(0.5^2)
    const expectedPct = (1 - dist / MAX_ARCHETYPE_DISTANCE) * 100;
    const result = matchArchetype(respondent);
    expect(result.primaryId).toBe("pragmatic-centrist");
    expect(result.primaryMatchPct).toBeCloseTo(expectedPct, 3);
  });

  it("match_pct is always >= 0 (floor at zero)", () => {
    // Any respondent that could exceed MAX_DISTANCE from best archetype
    // Alternating +1/-1 gives primary = 50%, still non-negative
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
    // All +1.0 → developmental-modernizer is closest (dist ≈ 2.152, pct ≈ 68.94%)
    const result = matchArchetype(new Array(12).fill(1.0));
    expect(result.primaryId).toBe("developmental-modernizer");
    expect(result.primaryMatchPct).toBeCloseTo(68.94, 1);
  });

  it("identifies authoritarian-traditionalist as secondary for all-positive respondent", () => {
    // All +1.0 → second closest is authoritarian-traditionalist (dist ≈ 2.324, pct ≈ 66.46%)
    const result = matchArchetype(new Array(12).fill(1.0));
    expect(result.secondaryId).toBe("authoritarian-traditionalist");
    expect(result.secondaryMatchPct).toBeCloseTo(66.46, 1);
  });
});

// ---------------------------------------------------------------------------
// Blended type detection
// ---------------------------------------------------------------------------

describe("matchArchetype — blended type detection", () => {
  it("respondent at exact midpoint of two prototypes → isBlended = true", () => {
    // Midpoint between civic-institutionalist and social-democrat:
    // civic:   [-0.3, -0.2, -0.3, 0.3, -0.5, -0.7, -0.2, 0.0, 0.0, -0.3, 0.0, 0.0]
    // soc-dem: [-0.7, -0.3,  0.0, 0.2, -0.2, -0.5, -0.5, -0.3, -0.4, -0.4, -0.2, 0.0]
    // midpt:   [-0.5, -0.25, -0.15, 0.25, -0.35, -0.6, -0.35, -0.15, -0.2, -0.35, -0.1, 0.0]
    const midpoint = [-0.5, -0.25, -0.15, 0.25, -0.35, -0.6, -0.35, -0.15, -0.2, -0.35, -0.1, 0.0];
    const result = matchArchetype(midpoint);
    expect(result.isBlended).toBe(true);
  });

  it("midpoint respondent has near-equal primary and secondary match percentages", () => {
    const midpoint = [-0.5, -0.25, -0.15, 0.25, -0.35, -0.6, -0.35, -0.15, -0.2, -0.35, -0.1, 0.0];
    const result = matchArchetype(midpoint);
    expect(Math.abs(result.primaryMatchPct - result.secondaryMatchPct)).toBeCloseTo(0, 3);
  });

  it("all-positive respondent is blended (developmental-modernizer / authoritarian-traditionalist within 10%)", () => {
    // dist primary ≈ 2.152, dist secondary ≈ 2.324
    // |2.152 - 2.324| / 2.152 ≈ 0.08 (<= 0.10)
    const result = matchArchetype(new Array(12).fill(1.0));
    expect(result.isBlended).toBe(true);
  });

  it("respondent strongly aligned to one archetype → isBlended = false", () => {
    // Perfect match to radical-egalitarian → distance 0, not blended
    const radPrototype = [-0.9, -0.5, -0.5, -0.4, -0.3, -0.5, -0.8, -0.5, -0.8, -0.5, -0.5, -0.3];
    const result = matchArchetype(radPrototype);
    expect(result.isBlended).toBe(false);
  });

  it("isBlended uses 10% threshold on distance ratio (just inside boundary)", () => {
    // Construct a respondent where primary and secondary distances are exactly equal
    // → ratio = 0, definitely blended
    const midpoint = [-0.5, -0.25, -0.15, 0.25, -0.35, -0.6, -0.35, -0.15, -0.2, -0.35, -0.1, 0.0];
    const result = matchArchetype(midpoint);
    const { primaryMatchPct, secondaryMatchPct } = result;
    // Both should be ~93.59%
    expect(primaryMatchPct).toBeCloseTo(93.59, 1);
    expect(secondaryMatchPct).toBeCloseTo(93.59, 1);
    expect(result.isBlended).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Low match threshold — unusual profile
// ---------------------------------------------------------------------------

describe("matchArchetype — low match threshold (unusual profile)", () => {
  it("alternating ±1 respondent yields primaryMatchPct below LOW_MATCH_THRESHOLD_PCT", () => {
    // [+1, -1, +1, -1, ...] → best match is pragmatic-centrist at exactly 50%
    const alternating = Array.from({ length: 12 }, (_, i) => (i % 2 === 0 ? 1.0 : -1.0));
    const result = matchArchetype(alternating);
    expect(result.primaryMatchPct).toBeLessThan(LOW_MATCH_THRESHOLD_PCT);
  });

  it("alternating ±1 respondent primary is pragmatic-centrist at 50%", () => {
    const alternating = Array.from({ length: 12 }, (_, i) => (i % 2 === 0 ? 1.0 : -1.0));
    const result = matchArchetype(alternating);
    expect(result.primaryId).toBe("pragmatic-centrist");
    expect(result.primaryMatchPct).toBeCloseTo(50.0, 1);
  });

  it("a strongly aligned respondent is above the low match threshold", () => {
    // Social-democrat exact prototype → 100%
    const sdPrototype = [-0.7, -0.3, 0.0, 0.2, -0.2, -0.5, -0.5, -0.3, -0.4, -0.4, -0.2, 0.0];
    const result = matchArchetype(sdPrototype);
    expect(result.primaryMatchPct).toBeGreaterThanOrEqual(LOW_MATCH_THRESHOLD_PCT);
  });
});

// ---------------------------------------------------------------------------
// Weighted Euclidean distance — all axis weights = 1.0 (v1)
// ---------------------------------------------------------------------------

describe("matchArchetype — distance calculation", () => {
  it("uses equal (1.0) weight for all 12 axes", () => {
    // Verify by testing with a single-axis deviation
    // Respondent: centrist except axis 6 = 1.0 → distance from centrist = 1.0
    const respondent = new Array(12).fill(0);
    respondent[5] = 1.0; // axis 6 (index 5)
    const expectedDist = 1.0;
    const expectedPct = (1 - expectedDist / MAX_ARCHETYPE_DISTANCE) * 100;
    const result = matchArchetype(respondent);
    // Centrist should still be primary (distance 1.0 is small)
    expect(result.primaryId).toBe("pragmatic-centrist");
    expect(result.primaryMatchPct).toBeCloseTo(expectedPct, 3);
  });

  it("two equal deviations on different axes produce the same distance", () => {
    const r1 = new Array(12).fill(0);
    r1[0] = 0.5; // deviation on axis 1
    const r2 = new Array(12).fill(0);
    r2[11] = 0.5; // deviation on axis 12
    const res1 = matchArchetype(r1);
    const res2 = matchArchetype(r2);
    // Both should produce the same match % for pragmatic-centrist
    expect(res1.primaryMatchPct).toBeCloseTo(res2.primaryMatchPct, 5);
  });
});
