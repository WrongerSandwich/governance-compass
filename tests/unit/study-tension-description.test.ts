import { describe, it, expect } from "vitest";
import {
  statedPreferenceScore,
  describeTension,
} from "@/lib/study/tensionDescription";

describe("statedPreferenceScore", () => {
  it("weights forced-choice 0.6 and scaled 0.4, matching the pipeline magnitudes", () => {
    // P0002 / claude / axis 1: fc -1, sc -0.25, bg +0.9329, stored magnitude 1.6329
    const stated = statedPreferenceScore({ fc: -1, sc: -0.25, budget: 0.9329 });
    expect(stated).toBeCloseTo(-0.7, 6);
    expect(Math.abs(stated! - 0.9329)).toBeCloseTo(1.6329, 4);
  });

  it("treats a missing modality as zero when the other is present", () => {
    expect(statedPreferenceScore({ fc: -1 })).toBeCloseTo(-0.6, 6);
    expect(statedPreferenceScore({ sc: 0.5 })).toBeCloseTo(0.2, 6);
  });

  it("returns null when neither stated modality is present", () => {
    expect(statedPreferenceScore({ budget: 0.5 })).toBeNull();
  });
});

describe("describeTension", () => {
  it("names both poles when stated and budget point in opposite directions", () => {
    const description = describeTension({
      axis: 1,
      level: "strong",
      magnitude: 1.6329,
      modality: { fc: -1, sc: -0.25, budget: 0.9329 },
    });

    expect(description).toContain("collective provision");
    expect(description).toContain("market allocation");
    expect(description).toContain("-0.70");
    expect(description).toContain("+0.93");
    expect(description.toLowerCase()).toContain("strong tension");
  });

  it("describes an intensity gap when both signals lean the same way", () => {
    const description = describeTension({
      axis: 2,
      level: "mild",
      magnitude: 0.7976,
      modality: { fc: 0.3333, sc: 0, budget: 0.9976 },
    });

    expect(description).toContain("growth imperative");
    expect(description).not.toContain("ecological limits");
    expect(description.toLowerCase()).toContain("mild tension");
  });

  it("calls out a midpoint stated score rather than inventing a lean", () => {
    const description = describeTension({
      axis: 5,
      level: "moderate",
      magnitude: 1.2,
      modality: { fc: 0, sc: 0, budget: 1.2 },
    });

    expect(description).toContain("midpoint");
    expect(description).toContain("security");
  });

  it("still returns a usable sentence when budget data is absent", () => {
    const description = describeTension({
      axis: 3,
      level: "mild",
      magnitude: 0.6,
      modality: { fc: -0.5, sc: -0.5 },
    });

    expect(description).not.toEqual("");
    expect(description.toLowerCase()).toContain("mild tension");
    expect(description).toContain("0.60");
  });

  it("always reports the magnitude that the badge severity came from", () => {
    for (const level of ["mild", "moderate", "strong"] as const) {
      const description = describeTension({
        axis: 12,
        level,
        magnitude: 1.5899,
        modality: { fc: -1, sc: 0, budget: 0.9899 },
      });
      expect(description).toContain("1.59");
    }
  });

  it("falls back to a generic axis reference for an unknown axis id", () => {
    const description = describeTension({
      axis: 99,
      level: "mild",
      magnitude: 0.6,
      modality: { fc: -1, sc: 0, budget: 0.2 },
    });

    expect(description.toLowerCase()).toContain("mild tension");
  });
});
