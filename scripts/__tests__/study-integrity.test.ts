import { describe, it, expect } from "vitest";
import {
  isAxisScoreOutOfBounds,
  findMissingClusterRows,
  pluralityKey,
} from "../lib/integrity";

describe("isAxisScoreOutOfBounds", () => {
  it("accepts scores inside [-1, 1]", () => {
    expect(isAxisScoreOutOfBounds(0)).toBe(false);
    expect(isAxisScoreOutOfBounds(-1)).toBe(false);
    expect(isAxisScoreOutOfBounds(1)).toBe(false);
    expect(isAxisScoreOutOfBounds(0.4237)).toBe(false);
  });

  it("tolerates float noise just outside the bounds", () => {
    expect(isAxisScoreOutOfBounds(-1 - 1e-12)).toBe(false);
    expect(isAxisScoreOutOfBounds(1 + 1e-12)).toBe(false);
  });

  it("rejects scores meaningfully outside [-1, 1]", () => {
    expect(isAxisScoreOutOfBounds(-1.01)).toBe(true);
    expect(isAxisScoreOutOfBounds(1.01)).toBe(true);
  });

  it("rejects NaN, which comparison-only checks let through", () => {
    expect(isAxisScoreOutOfBounds(NaN)).toBe(true);
  });

  it("rejects the NaN that parseFloat produces for an empty CSV cell", () => {
    expect(isAxisScoreOutOfBounds(parseFloat(""))).toBe(true);
  });

  it("rejects Infinity", () => {
    expect(isAxisScoreOutOfBounds(Infinity)).toBe(true);
    expect(isAxisScoreOutOfBounds(-Infinity)).toBe(true);
  });
});

describe("findMissingClusterRows", () => {
  it("returns an empty array when every persona has a cluster row", () => {
    expect(findMissingClusterRows(["P0001", "P0002"], ["P0002", "P0001"])).toEqual([]);
  });

  it("names the personas that have no cluster row", () => {
    expect(findMissingClusterRows(["P0001", "P0002", "P0003"], ["P0002"])).toEqual([
      "P0001",
      "P0003",
    ]);
  });

  it("preserves persona order so the failure message is stable", () => {
    expect(findMissingClusterRows(["P0003", "P0001"], [])).toEqual(["P0003", "P0001"]);
  });

  it("ignores cluster rows that have no matching persona", () => {
    expect(findMissingClusterRows(["P0001"], ["P0001", "P9999"])).toEqual([]);
  });
});

describe("pluralityKey", () => {
  it("returns the key with the highest count", () => {
    expect(
      pluralityKey(
        new Map([
          ["europe", 3],
          ["africa", 7],
        ])
      )
    ).toBe("africa");
  });

  it("breaks ties deterministically by key order, not insertion order", () => {
    const seenEuropeFirst = new Map([
      ["europe", 4],
      ["africa", 4],
    ]);
    const seenAfricaFirst = new Map([
      ["africa", 4],
      ["europe", 4],
    ]);
    expect(pluralityKey(seenEuropeFirst)).toBe(pluralityKey(seenAfricaFirst));
    expect(pluralityKey(seenEuropeFirst)).toBe("africa");
  });

  it("returns undefined for an empty map", () => {
    expect(pluralityKey(new Map<string, number>())).toBeUndefined();
  });
});
