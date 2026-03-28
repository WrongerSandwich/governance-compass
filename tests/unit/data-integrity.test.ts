// @vitest-environment node
import { describe, it, expect } from "vitest";
import { axes } from "@/data/axes";
import { forcedChoiceItems } from "@/data/forced-choice-items";
import { scaledItems } from "@/data/scaled-items";
import { ministries, ministryAxisMappings } from "@/data/ministries";
import { archetypes } from "@/data/archetypes";

describe("data integrity", () => {
  it("has exactly 12 axes numbered 1-12", () => {
    expect(axes).toHaveLength(12);
    expect(axes.map((a) => a.id).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 12 }, (_, i) => i + 1)
    );
  });

  it("has exactly 36 forced-choice items (3 per axis)", () => {
    expect(forcedChoiceItems).toHaveLength(36);
    for (let axisId = 1; axisId <= 12; axisId++) {
      const items = forcedChoiceItems.filter((i) => i.axisId === axisId);
      expect(items).toHaveLength(3);
    }
  });

  it("has exactly 36 scaled items (3 per axis)", () => {
    expect(scaledItems).toHaveLength(36);
    for (let axisId = 1; axisId <= 12; axisId++) {
      const items = scaledItems.filter((i) => i.axisId === axisId);
      expect(items).toHaveLength(3);
    }
  });

  it("forced-choice items have valid types and abstraction levels", () => {
    for (const item of forcedChoiceItems) {
      expect(["FC", "PT"]).toContain(item.questionType);
      expect(["P", "I", "S"]).toContain(item.abstractionLevel);
    }
  });

  it("has exactly 10 ministries", () => {
    expect(ministries).toHaveLength(10);
  });

  it("ministry-axis mappings reference valid axes and ministries", () => {
    const axisIds = new Set(axes.map((a) => a.id));
    const ministryIds = new Set(ministries.map((m) => m.id));
    for (const mapping of ministryAxisMappings) {
      expect(axisIds.has(mapping.axisId)).toBe(true);
      expect(ministryIds.has(mapping.ministryId)).toBe(true);
      expect([-1, 1]).toContain(mapping.direction);
    }
  });

  it("has 12 archetypes with valid 12-element prototypes", () => {
    expect(archetypes).toHaveLength(12);
    for (const a of archetypes) {
      expect(a.prototype).toHaveLength(12);
      for (const score of a.prototype) {
        expect(score).toBeGreaterThanOrEqual(-1.0);
        expect(score).toBeLessThanOrEqual(1.0);
      }
    }
  });
});
