/**
 * archetypeResolution.ts
 *
 * Shared helper for resolving the post-revision nearest archetype for a
 * synthetic-study cluster.  Used by both the build script and the API route
 * so both always derive from the same source of truth: CLUSTERS
 * (syntheticStudyClusters.ts) × archetypes (archetypes.ts).
 *
 * The key invariant: CLUSTERS[cluster].nearestArchetypeId is the authoritative
 * post-revision mapping; distances are computed on-demand from the centroid
 * vector and the matched archetype's prototype.
 */

import type { ClusterId, ArchetypeEmergence } from "./types";
import { CLUSTERS } from "../../data/syntheticStudyClusters";
import { archetypes } from "../../data/archetypes";

export interface PostRevisionArchetypeMatch {
  id: string;
  name: string;
  emergence: ArchetypeEmergence;
  distance: number; // Euclidean distance from centroid to archetype prototype
}

/**
 * Compute Euclidean distance between two 12-element axis-score vectors.
 */
export function computeDistance(
  a: readonly number[],
  b: readonly number[]
): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Return the post-revision archetype match for a cluster.
 *
 * @param cluster  The cluster id (0–5).
 * @param centroid The 12-element averaged-axis-score vector for the cluster.
 * @throws If the cluster id is invalid or the archetype id is not found in
 *         archetypes.ts (both indicate a data inconsistency that must be fixed,
 *         not silently fallen back from).
 */
export function postRevisionArchetypeForCluster(
  cluster: ClusterId,
  centroid: readonly number[]
): PostRevisionArchetypeMatch {
  const clusterDef = CLUSTERS.find((c) => c.id === cluster);
  if (!clusterDef) {
    throw new Error(`Cluster ${cluster} not found in CLUSTERS`);
  }

  const archetype = archetypes.find((a) => a.id === clusterDef.nearestArchetypeId);
  if (!archetype) {
    throw new Error(
      `Archetype "${clusterDef.nearestArchetypeId}" (cluster ${cluster}) not found in archetypes.ts`
    );
  }

  const distance = computeDistance(centroid, archetype.prototype);

  return {
    id: archetype.id,
    name: archetype.name,
    emergence: archetype.emergence,
    distance,
  };
}

/**
 * Legacy ID remapping for any consumer that needs a raw ID→ID translation.
 * Only covers IDs that actually appeared in pipeline output as nearest-archetype
 * for a cluster but were subsequently replaced in the post-revision catalog.
 *
 * `civic-institutionalist` is intentionally absent — it was never a cluster's
 * nearest match in the pipeline output and has no direct post-revision counterpart.
 */
export const LEGACY_ARCHETYPE_ID_MAP: Readonly<Record<string, string>> = {
  "pragmatic-centrist": "institutional-moderate",
} as const;
