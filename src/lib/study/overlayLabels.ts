/**
 * Collision-aware placement for the text labels that annotate a chart's
 * vertical marker lines (Histogram's mean/median overlays).
 *
 * Two markers can sit anywhere, including on top of each other — on
 * `/study/model-agreement` the mean (1.51) and median (1.46) are about ten
 * rendered pixels apart with ~60px labels, so `mean 1.51` and `median 1.46`
 * interleaved character by character. Labels are placed left to right; each
 * takes the first row whose already-placed labels it does not overlap, and a
 * label that would run past the plot's right edge flips to end at its marker
 * instead of starting there.
 */

export interface OverlayLabelInput {
  /** Horizontal position of the marker, in the chart's own units. */
  x: number;
  /** Estimated rendered width of the label, in the same units. */
  width: number;
}

export interface OverlayLabelPlacement {
  /** Zero-based row; the caller decides the vertical step per row. */
  row: number;
  /** `start` draws the label to the right of its marker, `end` to the left. */
  anchor: "start" | "end";
}

export interface PlaceOverlayLabelsOptions {
  /** Right edge a `start`-anchored label must not cross. Omit to never flip. */
  maxX?: number;
  /** Minimum clear space between two labels on the same row. */
  gap?: number;
  /**
   * Clearance between a marker and its label, applied on the label's own
   * side: a `start` label begins `inset` right of its marker, an `end` label
   * ends `inset` left of it. Applied here rather than by the caller so the
   * collision check and the drawn glyphs agree on which side it falls.
   */
  inset?: number;
}

/**
 * Places `items` so that no two labels on the same row overlap. The result
 * is in input order.
 */
export function placeOverlayLabels(
  items: readonly OverlayLabelInput[],
  { maxX, gap = 4, inset = 0 }: PlaceOverlayLabelsOptions = {},
): OverlayLabelPlacement[] {
  const order = items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => a.item.x - b.item.x || a.index - b.index);

  const rows: Array<Array<[number, number]>> = [];
  const placements: OverlayLabelPlacement[] = new Array(items.length);

  for (const { item, index } of order) {
    const anchor: OverlayLabelPlacement["anchor"] =
      maxX !== undefined && item.x + inset + item.width > maxX ? "end" : "start";
    const span: [number, number] =
      anchor === "start"
        ? [item.x + inset, item.x + inset + item.width]
        : [item.x - inset - item.width, item.x - inset];

    let row = rows.findIndex((placed) =>
      placed.every(([a, b]) => span[1] + gap <= a || span[0] >= b + gap),
    );
    if (row === -1) {
      row = rows.length;
      rows.push([]);
    }
    rows[row].push(span);
    placements[index] = { row, anchor };
  }

  return placements;
}
