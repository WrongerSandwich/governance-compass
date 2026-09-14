/**
 * The three guards that let a value read back out of the database rejoin the
 * scoring engine's unions.
 *
 * `AxisScore.confidence`, `.tensionLevel` and `.tensionDirection` are all bare
 * `String` columns, so these are the only thing standing between a drifted row
 * and rendered copy. Each failure is silent: an unknown confidence reads as
 * "Low confidence", an unknown tension level titles a panel with a word the
 * page never meant, and an unknown direction renders a titled tension panel
 * with no explanation in it at all. Nothing throws and everything renders, so
 * a type alone cannot cover the boundary — only these can.
 */
import { describe, expect, it } from "vitest";
import {
  AXIS_CONFIDENCES,
  TENSION_DIRECTIONS,
  TENSION_LEVELS,
  toAxisConfidence,
  toTensionDirection,
  toTensionLevel,
} from "@/lib/scoring-types";

describe("toAxisConfidence", () => {
  it("round-trips every grade the engine can produce", () => {
    // Driven off the list rather than a second hand-written literal: the union
    // is derived from AXIS_CONFIDENCES, so a fifth grade added to the type is
    // added here too and must be handled, instead of silently becoming "low".
    for (const grade of AXIS_CONFIDENCES) {
      expect(toAxisConfidence(grade)).toBe(grade);
    }
    expect(AXIS_CONFIDENCES).toEqual(["high", "moderate", "low", "conflicted"]);
  });

  it("reads an unrecognised or empty grade as the most conservative one", () => {
    expect(toAxisConfidence("bogus")).toBe("low");
    expect(toAxisConfidence("")).toBe("low");
    // Case matters: the engine writes lowercase, and a case-insensitive guard
    // would quietly bless a column some other writer had title-cased.
    expect(toAxisConfidence("High")).toBe("low");
  });
});

describe("toTensionLevel", () => {
  it("round-trips every level the engine can produce", () => {
    for (const level of TENSION_LEVELS) {
      expect(toTensionLevel(level)).toBe(level);
    }
    expect(TENSION_LEVELS).toEqual(["none", "mild", "moderate", "strong"]);
  });

  it("reads an unrecognised or empty level as no tension", () => {
    // "none" and not "mild": a level the page cannot name should not be
    // announced to the respondent as a finding.
    expect(toTensionLevel("bogus")).toBe("none");
    expect(toTensionLevel("")).toBe("none");
  });
});

describe("toTensionDirection", () => {
  it("round-trips both directions", () => {
    for (const direction of TENSION_DIRECTIONS) {
      expect(toTensionDirection(direction)).toBe(direction);
    }
    expect(TENSION_DIRECTIONS).toEqual([
      "principles_A_but_budget_B",
      "principles_B_but_budget_A",
    ]);
  });

  it("reads null, empty and unrecognised alike as no direction", () => {
    // null is a real stored value here — an axis with no budget signal records
    // a level but no direction — so it must pass through rather than fall to a
    // default that would describe a tension backwards.
    expect(toTensionDirection(null)).toBeNull();
    expect(toTensionDirection("")).toBeNull();
    expect(toTensionDirection("bogus")).toBeNull();
    expect(toTensionDirection("principles_A_but_budget_A")).toBeNull();
  });
});
