/**
 * integrity.ts
 *
 * Pure predicates and lookups used by the synthetic-study build to fail loudly
 * on malformed source data, extracted so they can be unit-tested without
 * running the whole pipeline.
 */

/** Slack for float round-trips through CSV/JSON. */
const AXIS_BOUND_EPSILON = 1e-9;

/**
 * True when `v` is not a finite number inside [-1, 1] (± epsilon).
 *
 * The `!Number.isFinite` guard is load-bearing: a bare `v < min || v > max`
 * comparison is `false` for NaN, so `parseFloat("")` on an empty CSV cell would
 * otherwise sail through every bounds check and into the published dataset.
 */
export function isAxisScoreOutOfBounds(v: number): boolean {
  return (
    !Number.isFinite(v) ||
    v < -1.0 - AXIS_BOUND_EPSILON ||
    v > 1.0 + AXIS_BOUND_EPSILON
  );
}

/**
 * Persona ids that have no row in cluster_labels.csv, in persona order.
 *
 * Without this the build indexes the cluster map with a non-null assertion and
 * dies on a bare TypeError instead of reporting an integrity failure.
 */
export function findMissingClusterRows(
  personaIds: readonly string[],
  clusterRowPersonaIds: readonly string[]
): string[] {
  const present = new Set(clusterRowPersonaIds);
  return personaIds.filter((id) => !present.has(id));
}

/**
 * The most frequent key in a count map. Ties break on the key's string form so
 * the result does not depend on iteration (i.e. insertion) order.
 */
export function pluralityKey<K>(counts: ReadonlyMap<K, number>): K | undefined {
  let best: K | undefined;
  let bestCount = -Infinity;
  for (const [key, count] of counts) {
    if (
      count > bestCount ||
      (count === bestCount && best !== undefined && String(key) < String(best))
    ) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}
