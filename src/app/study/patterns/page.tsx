import fs from "node:fs/promises";
import path from "node:path";
import { ClusterCard } from "@/components/study/patterns/ClusterCard";
import { ArchetypeDistribution } from "@/components/study/patterns/ArchetypeDistribution";
import type { ArchetypeDistributionRow } from "@/components/study/patterns/ArchetypeDistribution";
import { CLUSTERS } from "@/data/syntheticStudyClusters";
import { archetypes } from "@/data/archetypes";
import type { ClusterCentroid, ClusterNarrative } from "@/lib/study/types";
import type { ClusterId } from "@/lib/study/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ClusterNarrativesFile {
  k: number;
  clusters: ClusterNarrative[];
}

interface ClusterCentroidsFile extends Array<ClusterCentroid> {}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert the flat axis_1..axis_12 centroid into a number[12] ordered array. */
function centroidToAxisScores(c: ClusterCentroid): number[] {
  return [
    c.axis_1,
    c.axis_2,
    c.axis_3,
    c.axis_4,
    c.axis_5,
    c.axis_6,
    c.axis_7,
    c.axis_8,
    c.axis_9,
    c.axis_10,
    c.axis_11,
    c.axis_12,
  ];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function PatternsPage() {
  const dataDir = path.join(process.cwd(), "data/synthetic_study");

  const [centroidsRaw, narrativesRaw] = await Promise.all([
    fs.readFile(path.join(dataDir, "cluster_centroids.json"), "utf8"),
    fs.readFile(path.join(dataDir, "cluster_narratives.json"), "utf8"),
  ]);

  const centroids: ClusterCentroidsFile = JSON.parse(centroidsRaw);
  const narrativesFile: ClusterNarrativesFile = JSON.parse(narrativesRaw);

  // Build a map from cluster id → centroid axis scores
  const centroidMap = new Map<number, number[]>(
    centroids.map((c) => [c.cluster, centroidToAxisScores(c)])
  );

  // Build a map from cluster id → top_axes prose
  const narrativesMap = new Map<number, string[]>(
    narrativesFile.clusters.map((n) => [n.cluster, n.top_axes])
  );

  // Sorted cluster order: C2 → C4 → C1 → C0 → C5 → C3 (size descending)
  const sortedClusterIds: ClusterId[] = [2, 4, 1, 0, 5, 3];

  // ---------------------------------------------------------------------------
  // Archetype distribution rows
  // ---------------------------------------------------------------------------
  // Build a map from archetypeId → cluster (from the post-revision CLUSTERS data)
  const archetypeToCluster = new Map<string, typeof CLUSTERS[number]>(
    CLUSTERS.map((c) => [c.nearestArchetypeId, c])
  );

  // Count: cluster size for matched clusters, 0 for unmatched archetypes
  const distributionRows: ArchetypeDistributionRow[] = archetypes.map((arch) => {
    const cluster = archetypeToCluster.get(arch.id);
    return {
      archetypeId: arch.id,
      archetypeName: arch.name,
      emergence: arch.emergence,
      count: cluster ? cluster.size : 0,
      clusterColorVar: cluster ? cluster.colorVar : undefined,
    };
  });

  return (
    <main className="min-h-screen px-4 py-12">
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="mx-auto max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium mb-1">
          Synthetic Study
        </p>
        <h1 className="text-[28px] font-serif font-medium text-text-primary leading-tight mb-6">
          Patterns
        </h1>

        {/* Intro — same serif-heading scale as page title per spec */}
        <p className="text-[17px] font-serif text-text-secondary leading-relaxed mb-12">
          This page characterizes the 1,002 personas as a population. Six
          clusters emerged from the scored profiles; the twelve hand-crafted
          archetypes were then compared against them. The sections below
          describe the clusters, where they concentrate regionally and
          demographically, the shape of each axis across the population, and
          which axis pairs covary.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 1 — The six clusters                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="mb-16">
        <div className="mx-auto max-w-3xl mb-8">
          <h2 className="text-[22px] font-serif font-medium text-text-primary">
            The six clusters
          </h2>
        </div>

        {/* Cluster card grid — full content width */}
        <div
          className="mx-auto"
          style={{ maxWidth: "1120px", padding: "0 1rem" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {sortedClusterIds.map((clusterId) => {
              const clusterData = CLUSTERS.find((c) => c.id === clusterId)!;
              const centroidScores = centroidMap.get(clusterId) ?? new Array(12).fill(0);
              const topAxes = narrativesMap.get(clusterId) ?? [];

              return (
                <ClusterCard
                  key={clusterId}
                  clusterId={clusterId}
                  centroidAxisScores={centroidScores}
                  clusterData={clusterData}
                  topAxesProse={topAxes}
                />
              );
            })}
          </div>
        </div>

        {/* Prose beneath the card grid */}
        <div className="mx-auto max-w-3xl mt-8 text-sm text-text-secondary leading-relaxed space-y-4">
          <p>
            Three clusters lean collectivist-egalitarian (C1, C3, C4), two lean
            traditionalist or authority-oriented (C2, C5), and one sits near the
            center (C0). C1 and C4 are close neighbors in the
            radical-egalitarian region of the space; their separation is driven
            mostly by axes 3 (governance structure) and 4 (decision authority),
            where C1 leans distributed and popular while C4 sits closer to
            neutral.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2 — Archetype distribution                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className="mb-16">
        <div className="mx-auto max-w-3xl mb-8">
          <h2 className="text-[22px] font-serif font-medium text-text-primary">
            Archetype distribution
          </h2>
        </div>

        {/* Chart — full content width */}
        <div
          className="mx-auto"
          style={{ maxWidth: "1120px", padding: "0 1rem" }}
        >
          <ArchetypeDistribution rows={distributionRows} />
        </div>

        {/* Prose */}
        <div className="mx-auto max-w-3xl mt-8 text-sm text-text-secondary leading-relaxed space-y-4">
          <p>
            Six archetypes have nonzero populations; six have none. The six
            empirical-zero archetypes — The Social Democrat, The Green
            Communalist, The Cosmopolitan Technologist, The Free Marketeer, The
            Libertarian Individualist, and The Authoritarian Traditionalist —
            are all theoretically coherent positions, but no synthetic persona
            in the dataset landed closest to any of them. This could mean those
            positions don&apos;t exist in the population Gemini generated, or
            that they exist but get pulled toward a nearest empirical cluster in
            the 12-axis space. Either way, the gap is worth naming: the
            archetype catalog covers more philosophical ground than the
            synthetic population occupies.
          </p>

          {/* Sub-section: C1/C4 split */}
          <p>
            Two clusters (C1 and C4) both had The Radical Egalitarian as their
            nearest match before the archetype revision. After revision, C4
            remains The Radical Egalitarian and C1 became The Popular Egalitarian
            — the closest empirical anchor to what had been an unclaimed
            theoretical region. The other four clusters each map cleanly to a
            single archetype.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 3 — Regional and demographic aggregates (Phase 5b)          */}
      {/* ------------------------------------------------------------------ */}
      {/* Phase 5b/5c */}

      {/* ------------------------------------------------------------------ */}
      {/* Section 4 — Axis-level distributions (Phase 5b)                     */}
      {/* ------------------------------------------------------------------ */}
      {/* Phase 5b/5c */}

      {/* ------------------------------------------------------------------ */}
      {/* Section 5 — Correlations (Phase 5c)                                 */}
      {/* ------------------------------------------------------------------ */}
      {/* Phase 5b/5c */}

      {/* ------------------------------------------------------------------ */}
      {/* Section 6 — Tension patterns (Phase 5c)                             */}
      {/* ------------------------------------------------------------------ */}
      {/* Phase 5b/5c */}
    </main>
  );
}
