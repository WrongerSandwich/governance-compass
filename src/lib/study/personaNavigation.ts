export interface PersonaNeighbors {
  /** Position of the persona in the filtered list, or -1 when absent. */
  index: number;
  prev: string | null;
  next: string | null;
}

/**
 * Resolves the previous/next persona around `id` within the current filter
 * result.
 *
 * A persona reached by deep link need not be in the filtered list at all — a
 * `?persona=` URL opened alongside a region filter that excludes it, say. In
 * that case it has no position in the sequence, so it has no neighbours
 * either; the footer disables both arrows rather than jumping to an unrelated
 * end of the list.
 */
export function personaNeighbors(
  filteredIds: string[],
  id: string
): PersonaNeighbors {
  const index = filteredIds.indexOf(id);
  if (index === -1) return { index: -1, prev: null, next: null };

  return {
    index,
    prev: index > 0 ? filteredIds[index - 1] : null,
    next: index < filteredIds.length - 1 ? filteredIds[index + 1] : null,
  };
}
