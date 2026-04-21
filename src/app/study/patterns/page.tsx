import fs from "node:fs/promises";
import path from "node:path";
import { ClusterCard } from "@/components/study/patterns/ClusterCard";
import { ArchetypeDistribution } from "@/components/study/patterns/ArchetypeDistribution";
import type { ArchetypeDistributionRow } from "@/components/study/patterns/ArchetypeDistribution";
import { DemographicAggregates } from "@/components/study/patterns/DemographicAggregates";
import { WorldMap } from "@/components/study/WorldMap";
import { MapLegend } from "@/components/study/MapLegend";
import { TransnationalTile } from "@/components/study/TransnationalTile";
import { CLUSTERS } from "@/data/syntheticStudyClusters";
import { archetypes } from "@/data/archetypes";
import type {
  ClusterCentroid,
  ClusterNarrative,
  RegionalAggregate,
  DemographicAggregate,
} from "@/lib/study/types";
import type { ClusterId, RegionKey } from "@/lib/study/types";

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
  const derivedDir = path.join(process.cwd(), "public/study/derived");

  const [centroidsRaw, narrativesRaw, regionalRaw, demographicRaw] =
    await Promise.all([
      fs.readFile(path.join(dataDir, "cluster_centroids.json"), "utf8"),
      fs.readFile(path.join(dataDir, "cluster_narratives.json"), "utf8"),
      fs.readFile(path.join(derivedDir, "regional_aggregates.json"), "utf8"),
      fs.readFile(path.join(derivedDir, "demographic_aggregates.json"), "utf8"),
    ]);

  const centroids: ClusterCentroidsFile = JSON.parse(centroidsRaw);
  const narrativesFile: ClusterNarrativesFile = JSON.parse(narrativesRaw);
  const regionalAggregates: RegionalAggregate[] = JSON.parse(regionalRaw);
  const demographicAggregates: DemographicAggregate =
    JSON.parse(demographicRaw);

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
  // Section 3 — Regional and demographic data
  // ---------------------------------------------------------------------------

  // Build region counts map for density mode
  const regionCounts = Object.fromEntries(
    regionalAggregates.map((r) => [r.region, r.count])
  ) as Record<RegionKey, number>;

  // Build top archetypes by region for density tooltip
  const topArchetypesByRegion = Object.fromEntries(
    regionalAggregates.map((r) => [
      r.region,
      r.top_archetypes.slice(0, 3).map((a) => a.name),
    ])
  ) as Partial<Record<RegionKey, string[]>>;

  // Build dominant cluster by region for cluster map
  const dominantClusterByRegion = Object.fromEntries(
    regionalAggregates.map((r) => [
      r.region,
      { cluster: r.dominant_cluster as ClusterId, share: r.dominant_cluster_share },
    ])
  ) as Partial<Record<RegionKey, { cluster: ClusterId; share: number }>>;

  // Build mean axis 8 (index 7) by region for axis-gradient map
  const meanAxis8ByRegion = Object.fromEntries(
    regionalAggregates.map((r) => [r.region, r.mean_axis_scores[7]])
  ) as Partial<Record<RegionKey, number>>;

  // Diaspora count
  const diasporaRegion = regionalAggregates.find(
    (r) => r.region === "diaspora_transnational"
  );
  const diasporaCount = diasporaRegion?.count ?? 0;

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
      {/* Section 3 — Regional and demographic aggregates                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="mb-16">
        <div className="mx-auto max-w-3xl mb-8">
          <h2 className="text-[22px] font-serif font-medium text-text-primary">
            Regional and demographic aggregates
          </h2>
        </div>

        {/* ── 3a — Density and cluster by region ── */}
        <div
          className="mx-auto"
          style={{ maxWidth: "1120px", padding: "0 1rem" }}
        >
          {/* Maps side-by-side on desktop, stacked on mobile */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "24px",
            }}
          >
            {/* Density map */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <WorldMap
                mode={{
                  type: "static-density",
                  regionCounts,
                  topArchetypesByRegion,
                }}
              />
              <TransnationalTile
                mode={{
                  type: "static-density",
                  regionCounts,
                  topArchetypesByRegion,
                }}
                count={diasporaCount}
              />
              <MapLegend
                variant="density"
                breakpoints={[49, 89, 112, 133]}
              />
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-xs, 11px)",
                  color: "var(--text-tertiary)",
                  margin: 0,
                }}
              >
                Persona density by region
              </p>
            </div>

            {/* Dominant cluster map */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <WorldMap
                mode={{
                  type: "static-cluster",
                  dominantClusterByRegion,
                }}
              />
              <TransnationalTile
                mode={{
                  type: "static-cluster",
                  dominantClusterByRegion,
                }}
                count={diasporaCount}
              />
              <MapLegend
                variant="cluster"
                clusterIds={[0, 1, 2, 3, 4, 5]}
              />
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-xs, 11px)",
                  color: "var(--text-tertiary)",
                  margin: 0,
                }}
              >
                Dominant cluster by region
              </p>
            </div>
          </div>
        </div>

        {/* Prose for 3a */}
        <div className="mx-auto max-w-3xl mt-8 text-sm text-text-secondary leading-relaxed space-y-4">
          <p>
            Western Europe and Eastern Europe/Central Asia both show strong C2
            (Nationalist Populist) dominance at 38% and 37% respectively — the
            clearest regional-level pattern in the dataset. Latin America,
            sub-Saharan Africa, and South/Southeast Asia cluster to C1 (Popular
            Egalitarian), though dominance weakens: S/SE Asia&apos;s C1 share is
            only 21%, barely edging out three other clusters. East Asia and MENA
            both go to C5 (Developmental Modernizer) at 31% and 36%. North
            America is the one region where C4 (Radical Egalitarian) dominates.
            Oceania&apos;s dominant cluster is C3 (Communitarian Steward), the
            only region where that cluster leads. Diaspora is a near-tie between
            C0 and C4 at 30% each — the page handles this visually by hatching
            the region.
          </p>
        </div>

        {/* ── 3b — Axis 8 gradient ── */}
        <div
          className="mx-auto mt-12"
          style={{ maxWidth: "1120px", padding: "0 1rem" }}
        >
          <div className="mx-auto max-w-3xl mb-4">
            <h3 className="text-[17px] font-serif font-medium text-text-primary">
              Cultural diversity across regions
            </h3>
          </div>

          <div style={{ maxWidth: "600px" }}>
            <WorldMap
              mode={{
                type: "static-axis-gradient",
                axis: 8,
                meanAxisByRegion: meanAxis8ByRegion,
                lowLabel: "Pluralism",
                highLabel: "Cohesion",
              }}
            />
            <TransnationalTile
              mode={{
                type: "static-axis-gradient",
                axis: 8,
                meanAxisByRegion: meanAxis8ByRegion,
                lowLabel: "Pluralism",
                highLabel: "Cohesion",
              }}
              count={diasporaCount}
            />
            <MapLegend
              variant="axis-gradient"
              lowLabel="Pluralism"
              highLabel="Cohesion"
              min={-0.37}
              max={0.43}
            />
          </div>
        </div>

        {/* Prose for 3b */}
        <div className="mx-auto max-w-3xl mt-6 text-sm text-text-secondary leading-relaxed space-y-4">
          <p>
            Cultural Diversity (Axis 8, pluralism ↔ cohesion) shows the widest
            regional range of any axis: 0.80 from endpoint to endpoint. Eastern
            Europe and Central Asia lean strongest toward cohesion (+0.43),
            followed by East Asia, Western Europe, and MENA. The Americas and
            Oceania lean toward pluralism, with the diaspora category at the
            pluralism extreme (−0.37). The pattern is coherent with the broader
            literature on immigrant-receiving vs. nation-state-consolidation
            contexts, but we note the caveat: these are Gemini&apos;s personas,
            not survey respondents.
          </p>
        </div>

        {/* ── 3c — Demographic aggregates ── */}
        <div
          className="mx-auto mt-12"
          style={{ maxWidth: "1120px", padding: "0 1rem" }}
        >
          <div className="mx-auto max-w-3xl mb-6">
            <h3 className="text-[17px] font-serif font-medium text-text-primary">
              Demographic distributions
            </h3>
          </div>

          <DemographicAggregates
            urbanRural={demographicAggregates.urban_rural}
            economicPosition={demographicAggregates.economic_position}
            governanceExperience={demographicAggregates.governance_experience}
            education={demographicAggregates.education}
          />
        </div>

        {/* Prose for 3c — verified and adjusted from spec */}
        <div className="mx-auto max-w-3xl mt-8 text-sm text-text-secondary leading-relaxed space-y-4">
          <p>
            The demographic aggregates show weaker patterning than the regional
            ones — with two notable exceptions. Governance experience is the
            most differentiated: personas from authoritarian states strongly
            over-index on C5 (Developmental Modernizer), while conflict zones
            lean heavily toward C1 and C3, and stable democracies favor C4 and
            C0. Economic position shows a sharp gradient at the extremes —
            wealthy personas concentrate almost entirely in C5 (72% share),
            while struggling and working-class personas skew toward C2 and C3.
            Urban/rural shows a real but asymmetric pattern: rural personas
            over-index on C3, while urban personas spread more evenly. Education
            mirrors the urban/rural split — postgraduate and university personas
            over-index on C0 and C4, while those with no formal education
            concentrate in C3.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 4 — Axis-level distributions (Phase 5c)                    */}
      {/* ------------------------------------------------------------------ */}
      {/* Phase 5c */}

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
