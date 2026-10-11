import { describe, expect, it } from "vitest";
import { estimateMonoLabelWidth } from "@/lib/study/monoLabelWidth";
import { placeOverlayLabels } from "@/lib/study/overlayLabels";

/**
 * Issue #154: Histogram's mean and median markers on /study/model-agreement
 * sit at 1.51 and 1.46 — about ten rendered px apart with ~60px labels — so
 * `mean 1.51` and `median 1.46` interleaved character by character. The
 * placement is a pure function so the collision rule can be pinned here.
 */
describe("placeOverlayLabels", () => {
  it("keeps labels that do not overlap on the first row", () => {
    const placed = placeOverlayLabels([
      { x: 10, width: 50 },
      { x: 120, width: 50 },
    ]);
    expect(placed.map((p) => p.row)).toEqual([0, 0]);
  });

  it("steps a colliding label down a row", () => {
    // The shipped case: two markers four units apart under 60-unit labels.
    const placed = placeOverlayLabels([
      { x: 100, width: 60 },
      { x: 104, width: 62 },
    ]);
    expect(placed.map((p) => p.row)).toEqual([0, 1]);
  });

  it("reuses a row once it is clear", () => {
    const placed = placeOverlayLabels([
      { x: 0, width: 50 },
      { x: 10, width: 50 },
      { x: 200, width: 50 },
    ]);
    expect(placed.map((p) => p.row)).toEqual([0, 1, 0]);
  });

  it("treats the gap as part of the collision", () => {
    // Touching edges are a collision; `gap` units of clearance are not.
    expect(
      placeOverlayLabels([{ x: 0, width: 50 }, { x: 52, width: 50 }], { gap: 4 }).map((p) => p.row),
    ).toEqual([0, 1]);
    expect(
      placeOverlayLabels([{ x: 0, width: 50 }, { x: 54, width: 50 }], { gap: 4 }).map((p) => p.row),
    ).toEqual([0, 0]);
  });

  it("returns placements in input order whatever the x order", () => {
    const placed = placeOverlayLabels([
      { x: 104, width: 62 },
      { x: 100, width: 60 },
    ]);
    // The leftmost marker is placed first and keeps row 0.
    expect(placed).toEqual([
      { row: 1, anchor: "start" },
      { row: 0, anchor: "start" },
    ]);
  });

  it("flips a label that would cross the right edge to end at its marker", () => {
    const placed = placeOverlayLabels([{ x: 280, width: 60 }], { maxX: 300 });
    expect(placed[0].anchor).toBe("end");
  });

  it("checks a flipped label against its neighbours on its own side", () => {
    // The flipped label occupies [220, 280]; a start label at 200 of width
    // 60 occupies [200, 260] and collides with it.
    const placed = placeOverlayLabels(
      [
        { x: 200, width: 60 },
        { x: 280, width: 60 },
      ],
      { maxX: 300 },
    );
    expect(placed).toEqual([
      { row: 0, anchor: "start" },
      { row: 1, anchor: "end" },
    ]);
  });

  it("applies the inset on the label's own side of its marker", () => {
    // Review finding on the first cut: the caller offset every marker by +3
    // before placement, so a flipped label's glyphs (drawn ending 3 left of
    // the marker) sat 6 units left of where the collision check believed,
    // and could overprint a same-row neighbour by the width of a glyph.
    // Markers 134 and 250, labels 50.2 and 61.4 wide, right edge 308.
    const placed = placeOverlayLabels(
      [
        { x: 134, width: 50.2 },
        { x: 250, width: 61.4 },
      ],
      { maxX: 308, gap: 4, inset: 3 },
    );
    // A occupies [137, 187.2]; B flips and occupies [185.6, 247] — a
    // collision once the inset is on the correct side.
    expect(placed).toEqual([
      { row: 0, anchor: "start" },
      { row: 1, anchor: "end" },
    ]);
    // And with no inset the same pair clears, which is what the first cut
    // wrongly concluded for the inset case.
    expect(
      placeOverlayLabels(
        [
          { x: 134, width: 50.2 },
          { x: 250, width: 61.4 },
        ],
        { maxX: 308, gap: 4 },
      ).map((p) => p.row),
    ).toEqual([0, 0]);
  });

  it("flips on the inset edge, not the bare marker", () => {
    // 290 + 3 + 10 crosses 300; 290 + 10 alone would not.
    expect(placeOverlayLabels([{ x: 290, width: 10 }], { maxX: 300, inset: 3 })[0].anchor).toBe("end");
    expect(placeOverlayLabels([{ x: 290, width: 10 }], { maxX: 300 })[0].anchor).toBe("start");
  });

  it("never flips when no right edge is given", () => {
    expect(placeOverlayLabels([{ x: 1000, width: 60 }])[0].anchor).toBe("start");
  });

  it("places nothing for no overlays", () => {
    expect(placeOverlayLabels([])).toEqual([]);
  });
});

describe("estimateMonoLabelWidth", () => {
  it("scales with character count and font size", () => {
    expect(estimateMonoLabelWidth("", 9)).toBe(0);
    expect(estimateMonoLabelWidth("median 1.46", 9)).toBeCloseTo(11 * 9 * 0.62);
    expect(estimateMonoLabelWidth("ab", 10)).toBeGreaterThan(estimateMonoLabelWidth("ab", 9));
  });
});
