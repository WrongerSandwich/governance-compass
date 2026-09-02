/**
 * Regression cover for issue #62: unpinning from a 2-persona compare view
 * silently failed because the page stacked a second `router.replace` built
 * from a stale `searchParams` snapshot on top of the one `togglePin` had
 * already issued. The fix is to make one pure function own the whole
 * transition, so there is exactly one navigation per toggle.
 */
import { describe, it, expect } from "vitest";
import {
  MAX_PINS,
  parsePinned,
  togglePinInParams,
} from "@/lib/study/usePinnedPersonas";

// ---------------------------------------------------------------------------
// parsePinned
// ---------------------------------------------------------------------------

describe("parsePinned", () => {
  it("returns an empty list for a missing or empty param", () => {
    expect(parsePinned(null)).toEqual([]);
    expect(parsePinned("")).toEqual([]);
  });

  it("parses a comma-separated list", () => {
    expect(parsePinned("P0001,P0042")).toEqual(["P0001", "P0042"]);
  });

  it("trims whitespace and drops empty entries", () => {
    expect(parsePinned(" P0001 , ,P0042,")).toEqual(["P0001", "P0042"]);
  });

  it("de-duplicates repeated ids", () => {
    expect(parsePinned("P0001,P0001")).toEqual(["P0001"]);
    expect(parsePinned("P0001,P0042,P0001")).toEqual(["P0001", "P0042"]);
  });

  it("caps the list at MAX_PINS after de-duplication", () => {
    // Six entries, one of them a duplicate — the duplicate must not consume a
    // slot, so P0005 still makes the cut.
    expect(parsePinned("P0001,P0001,P0002,P0003,P0004,P0005,P0006")).toEqual([
      "P0001",
      "P0002",
      "P0003",
      "P0004",
    ]);
    expect(MAX_PINS).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// togglePinInParams
// ---------------------------------------------------------------------------

function params(qs: string): URLSearchParams {
  return new URLSearchParams(qs);
}

describe("togglePinInParams", () => {
  it("adds an id to an empty pin set", () => {
    const next = togglePinInParams(params(""), "P0001");
    expect(next?.get("compare")).toBe("P0001");
  });

  it("appends to an existing pin set", () => {
    const next = togglePinInParams(params("compare=P0001"), "P0042");
    expect(next?.get("compare")).toBe("P0001,P0042");
  });

  it("removes an id that is already pinned", () => {
    const next = togglePinInParams(params("compare=P0001,P0042,P0077"), "P0042");
    expect(next?.get("compare")).toBe("P0001,P0077");
  });

  it("deletes the compare param entirely when the last pin is removed", () => {
    const next = togglePinInParams(params("compare=P0001&region=africa"), "P0001");
    expect(next?.has("compare")).toBe(false);
    expect(next?.get("region")).toBe("africa");
  });

  it("preserves unrelated params", () => {
    const next = togglePinInParams(
      params("region=africa&sort=age&page=3&compare=P0001"),
      "P0042"
    );
    expect(next?.get("region")).toBe("africa");
    expect(next?.get("sort")).toBe("age");
    expect(next?.get("page")).toBe("3");
  });

  it("refuses to add a fifth pin", () => {
    const next = togglePinInParams(
      params("compare=P0001,P0002,P0003,P0004"),
      "P0005"
    );
    expect(next).toBeNull();
  });

  it("still allows unpinning while at the maximum", () => {
    const next = togglePinInParams(
      params("compare=P0001,P0002,P0003,P0004"),
      "P0002"
    );
    expect(next?.get("compare")).toBe("P0001,P0003,P0004");
  });

  it("drops both the pin and compareView in one transition when fewer than two remain", () => {
    // The issue #62 repro: two pins, compare view open, unpin one.
    const next = togglePinInParams(
      params("compare=P0001,P0042&compareView=open"),
      "P0042"
    );
    expect(next?.get("compare")).toBe("P0001");
    expect(next?.has("compareView")).toBe(false);
  });

  it("keeps the compare view open when two or more pins remain", () => {
    const next = togglePinInParams(
      params("compare=P0001,P0042,P0077&compareView=open"),
      "P0077"
    );
    expect(next?.get("compare")).toBe("P0001,P0042");
    expect(next?.get("compareView")).toBe("open");
  });

  it("does not mutate the params it was given", () => {
    const original = params("compare=P0001,P0042&compareView=open");
    togglePinInParams(original, "P0042");
    expect(original.get("compare")).toBe("P0001,P0042");
    expect(original.get("compareView")).toBe("open");
  });

  it("collapses a duplicated compare param on the next toggle", () => {
    const next = togglePinInParams(params("compare=P0001,P0001"), "P0042");
    expect(next?.get("compare")).toBe("P0001,P0042");
  });
});
