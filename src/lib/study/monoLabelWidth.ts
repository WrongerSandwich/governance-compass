/**
 * Estimated advance of the mono label layer, for sizing chart gutters.
 *
 * 0.6em is the advance of every monospace face in the stack — it is what
 * makes them monospace — and 0.02 is the tracking the label layer adds.
 * Measured against the rendered radar at 5.583 units per glyph at font size
 * 9, i.e. 0.6203em.
 *
 * It is an estimate, and it is used to size a MARGIN or a collision box
 * rather than to place anything, so an error shows up as a few units of
 * slack and never as a cut glyph. One constant for the radar's label
 * margin, the heatmap's gutters and the histogram's overlay labels, so a
 * retune after a font-stack change reaches all three.
 */
export const MONO_LABEL_ADVANCE_EM = 0.62;

/** Estimated width of a mono label at `fontSize`, in the same units. */
export function estimateMonoLabelWidth(label: string, fontSize: number): number {
  return label.length * fontSize * MONO_LABEL_ADVANCE_EM;
}
