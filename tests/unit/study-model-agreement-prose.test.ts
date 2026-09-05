// @vitest-environment node
/**
 * Regression cover for issue #65: the model-agreement page wrapped dynamically
 * computed axis lists in hand-counted prose ("Four axes...", "Five axes...")
 * and indexed `top3[2]` unguarded, so a dataset regen that shifted the counts
 * would print a wrong number, and one that left fewer than three positive
 * drifts would crash the page.
 */
import { describe, it, expect } from "vitest";
import {
  countWord,
  joinWithAnd,
  driftPole,
  describeTopDrifts,
  type DriftEntry,
} from "@/lib/study/modelAgreementProse";

const entry = (
  axis: number,
  axisName: string,
  drift: number
): DriftEntry => ({ axis, axisName, mean_diff_gemini_minus_claude: drift });

describe("countWord", () => {
  it("spells out small counts", () => {
    expect(countWord(0)).toBe("No");
    expect(countWord(1)).toBe("One");
    expect(countWord(4)).toBe("Four");
    expect(countWord(12)).toBe("Twelve");
  });

  it("falls back to digits past the spelled-out range", () => {
    expect(countWord(13)).toBe("13");
  });
});

describe("joinWithAnd", () => {
  it("returns a single item unchanged", () => {
    expect(joinWithAnd(["a"])).toBe("a");
  });

  it("joins two items with 'and'", () => {
    expect(joinWithAnd(["a", "b"])).toBe("a and b");
  });

  it("uses a serial comma for three or more", () => {
    expect(joinWithAnd(["a", "b", "c"])).toBe("a, b, and c");
  });

  it("returns an empty string for no items", () => {
    expect(joinWithAnd([])).toBe("");
  });
});

describe("driftPole", () => {
  it("names the documented pole for each drifting axis", () => {
    expect(driftPole(6)).toBe("alternative legitimacy");
    expect(driftPole(7)).toBe("continuity/tradition");
    expect(driftPole(9)).toBe("essentialism");
    expect(driftPole(10)).toBe("sovereignty");
  });

  it("falls back for an axis with no documented pole phrase", () => {
    expect(driftPole(3)).toBe("higher scores");
  });
});

describe("describeTopDrifts", () => {
  const three = [
    entry(7, "Change Orientation", 0.34),
    entry(10, "Sovereignty", 0.28),
    entry(6, "Legitimacy Source", 0.22),
  ];

  it("describes three drifts with poles and signed magnitudes", () => {
    const text = describeTopDrifts(three);
    expect(text).toContain("The three largest drifts are");
    expect(text).toContain("Axis 7 (Change Orientation, Gemini +0.34 toward continuity/tradition)");
    expect(text).toContain("Axis 10 (Sovereignty, +0.28 toward sovereignty)");
    expect(text).toContain("and Axis 6 (Legitimacy Source, +0.22 toward alternative legitimacy)");
  });

  it("does not crash when fewer than three positive drifts exist", () => {
    const text = describeTopDrifts([entry(7, "Change Orientation", 0.34)]);
    expect(text).toContain("The largest drift is");
    expect(text).toContain("Axis 7 (Change Orientation, Gemini +0.34 toward continuity/tradition)");
    expect(text).not.toContain("undefined");
  });

  it("counts two drifts as two, not three", () => {
    const text = describeTopDrifts(three.slice(0, 2));
    expect(text).toContain("The two largest drifts are");
    expect(text).not.toContain("three");
  });

  it("returns null when there is nothing to describe", () => {
    expect(describeTopDrifts([])).toBeNull();
  });
});
