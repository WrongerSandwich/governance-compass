import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { ClusterCard } from "@/components/study/patterns/ClusterCard";
import { ArchetypeDistribution } from "@/components/study/patterns/ArchetypeDistribution";
import type { ArchetypeDistributionRow } from "@/components/study/patterns/ArchetypeDistribution";
import { DemographicAggregates } from "@/components/study/patterns/DemographicAggregates";
import { TopCorrelationsList } from "@/components/study/patterns/TopCorrelationsList";
import { WorldMap } from "@/components/study/WorldMap";
import { MapLegend } from "@/components/study/MapLegend";
import { TransnationalTile } from "@/components/study/TransnationalTile";
import { ViolinOrRidge } from "@/components/study/ViolinOrRidge";
import type { RidgeSeries } from "@/components/study/ViolinOrRidge";
import { CorrelationHeatmap } from "@/components/study/CorrelationHeatmap";
import { TensionMatrix } from "@/components/study/TensionMatrix";
import type { TensionMatrixDatum } from "@/components/study/TensionMatrix";
import { HorizontalBarChart } from "@/components/study/HorizontalBarChart";
import type { HorizontalBarChartRow } from "@/components/study/HorizontalBarChart";
import { SectionNav } from "@/components/study/patterns/SectionNav";
import { CLUSTERS } from "@/data/syntheticStudyClusters";
import { archetypes } from "@/data/archetypes";
import { axes } from "@/data/axes";
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

type ClusterCentroidsFile = ClusterCentroid[];

interface AxisHistogramBin {
  min: number;
  max: number;
  count: number;
}

interface AxisHistogram {
  axis: number;
  bins: AxisHistogramBin[];
  mean: number;
}

interface CorrelationFile {
  axes: string[];
  matrix: number[][];
}

interface TensionOverallRow {
  model: "claude" | "gemini";
  axis: number;
  count: number;
  pct: number;
}

interface TensionByClusterRow {
  cluster: number;
  axis: number;
  count: number;
  pct_of_cluster_calls: number;
}

interface TensionPatternsFile {
  overall_by_axis: TensionOverallRow[];
  by_cluster: TensionByClusterRow[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Domain fill color for ViolinOrRidge series (hex, from design-tokens DOMAIN_COLORS). */
function domainColorFor(axisId: number): string {
  if (axisId <= 2) return "#85735e";   // Economic Organization — Stone 600
  if (axisId <= 6) return "#6b7d8a";  // Power and Authority — Slate 600
  if (axisId <= 9) return "#7a8b6e";  // Society and Identity — Sage 600
  return "#96716b";                    // The State in the World — Clay 600
}

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

  const [
    centroidsRaw,
    narrativesRaw,
    regionalRaw,
    demographicRaw,
    axisHistogramsRaw,
    axisCorrelationsRaw,
    tensionPatternsRaw,
  ] = await Promise.all([
    fs.readFile(path.join(dataDir, "cluster_centroids.json"), "utf8"),
    fs.readFile(path.join(dataDir, "cluster_narratives.json"), "utf8"),
    fs.readFile(path.join(derivedDir, "regional_aggregates.json"), "utf8"),
    fs.readFile(path.join(derivedDir, "demographic_aggregates.json"), "utf8"),
    fs.readFile(path.join(derivedDir, "axis_histograms.json"), "utf8"),
    fs.readFile(path.join(derivedDir, "axis_correlations.json"), "utf8"),
    fs.readFile(path.join(dataDir, "tension_patterns.json"), "utf8"),
  ]);

  const centroids: ClusterCentroidsFile = JSON.parse(centroidsRaw);
  const narrativesFile: ClusterNarrativesFile = JSON.parse(narrativesRaw);
  const regionalAggregates: RegionalAggregate[] = JSON.parse(regionalRaw);
  const demographicAggregates: DemographicAggregate =
    JSON.parse(demographicRaw);
  const axisHistograms: AxisHistogram[] = JSON.parse(axisHistogramsRaw);
  const axisCorrelations: CorrelationFile = JSON.parse(axisCorrelationsRaw);
  const tensionPatterns: TensionPatternsFile = JSON.parse(tensionPatternsRaw);

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
  // Section 4 — Axis-level distributions
  // ---------------------------------------------------------------------------

  const ridgeSeries: RidgeSeries[] = axes.map((axis) => {
    const histData = axisHistograms.find((h) => h.axis === axis.id);
    return {
      label: `${axis.id}. ${axis.name}`,
      bins: histData ? histData.bins.map((b) => b.count) : [],
      mean: histData?.mean,
      domainColor: domainColorFor(axis.id),
    };
  });

  // ---------------------------------------------------------------------------
  // Section 5 — Correlations
  // ---------------------------------------------------------------------------

  const correlationMatrix = axisCorrelations.matrix;
  const correlationLabels = axes.map((a) => `A${a.id}`);

  // ---------------------------------------------------------------------------
  // Section 6 — Tension patterns
  // ---------------------------------------------------------------------------

  // Build TensionMatrix data from overall_by_axis and by_cluster.
  // by_cluster has no model split — treat as combined (use same pct for both models).
  const tensionMatrixData: TensionMatrixDatum[] = [];

  // Overall column from overall_by_axis (has model split)
  for (const row of tensionPatterns.overall_by_axis) {
    tensionMatrixData.push({
      axis: row.axis,
      cluster: "overall",
      model: row.model,
      pct: Math.round(row.pct),
    });
  }

  // Per-cluster from by_cluster — the pipeline doesn't split by model for
  // cluster data, so we emit the same combined value under both models.
  // This avoids empty-cell "is this broken?" appearance in the Gemini row
  // of cluster columns. The caption makes the combined-ness explicit.
  for (const row of tensionPatterns.by_cluster) {
    const cluster = row.cluster as 0 | 1 | 2 | 3 | 4 | 5;
    const pct = Math.round(row.pct_of_cluster_calls);
    tensionMatrixData.push({ axis: row.axis, cluster, model: "claude", pct });
    tensionMatrixData.push({ axis: row.axis, cluster, model: "gemini", pct });
  }

  // Horizontal bar chart rows for overall tension rate (Section 6 header chart)
  const tensionOverallMap = new Map<string, number>();
  for (const row of tensionPatterns.overall_by_axis) {
    tensionOverallMap.set(`${row.model}-${row.axis}`, row.pct);
  }

  // Build rows: one per axis, two models interleaved (claude then gemini)
  const tensionBarRows: HorizontalBarChartRow[] = [];
  for (const axis of axes) {
    const claudePct = tensionOverallMap.get(`claude-${axis.id}`) ?? 0;
    const geminiPct = tensionOverallMap.get(`gemini-${axis.id}`) ?? 0;
    tensionBarRows.push({
      label: `A${axis.id} Claude`,
      value: claudePct,
      color: "var(--model-claude)",
      secondaryLabel: claudePct > 0 ? `${claudePct.toFixed(0)}%` : "—",
    });
    tensionBarRows.push({
      label: `A${axis.id} Gemini`,
      value: geminiPct,
      color: "var(--model-gemini)",
      secondaryLabel: geminiPct > 0 ? `${geminiPct.toFixed(0)}%` : "—",
    });
  }

  const tensionAxisLabels = axes.map((a) => `${a.id}. ${a.name}`);
  const tensionClusterLabels = ["C0", "C1", "C2", "C3", "C4", "C5", "Overall"];

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
        <p className="mb-1">
          <Link
            href="/study"
            className="study-kicker-link text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium no-underline hover:text-text-secondary transition-colors duration-150"
          >
            ← Synthetic Study
          </Link>
        </p>
        <h1 className="text-[clamp(32px,5vw,38px)] font-serif font-medium text-text-primary leading-tight mb-6 text-balance">
          Patterns
        </h1>

        {/* Intro — same serif-heading scale as page title per spec */}
        <p className="text-[17px] font-serif text-text-secondary leading-relaxed mb-6">
          This page characterizes the 1,002 personas as a population. Six
          clusters emerged from the scored profiles; the twelve hand-crafted
          archetypes were then compared against them. The sections below
          describe the clusters, where they concentrate regionally and
          demographically, the shape of each axis across the population, and
          which axis pairs covary.
        </p>

        {/* Section nav — quiet atlas-style jump list with scroll-spy.
            Full and short labels rendered as sibling <span>s; CSS swaps
            them below 768px to keep the nav from wrapping into 4+ rows. */}
        <SectionNav
          sections={[
            { num: "01", label: "Clusters", short: "Clusters", id: "section-1" },
            { num: "02", label: "Archetype distribution", short: "Archetypes", id: "section-2" },
            { num: "03", label: "Regional & demographic", short: "Regional", id: "section-3" },
            { num: "04", label: "Axis distributions", short: "Distributions", id: "section-4" },
            { num: "05", label: "Correlations", short: "Correlations", id: "section-5" },
            { num: "06", label: "Tensions", short: "Tensions", id: "section-6" },
          ]}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 1 — The six clusters                                        */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="section-1"
        className="mb-16"
        style={{ scrollMarginTop: "72px" }}
      >
        <div className="mx-auto max-w-2xl mb-6">
          <h2 className="text-[22px] font-serif font-medium text-text-primary text-balance">
            The six clusters
          </h2>
        </div>

        {/* Cluster entries — gazetteer stack, no card chrome */}
        <div
          className="mx-auto"
          style={{ maxWidth: "840px", padding: "0 1rem" }}
        >
          <div
            style={{
              borderTop: "0.5px solid var(--border-secondary)",
            }}
          >
            {sortedClusterIds.map((clusterId, i) => {
              const clusterData = CLUSTERS.find((c) => c.id === clusterId)!;
              const centroidScores = centroidMap.get(clusterId) ?? new Array(12).fill(0);
              const topAxes = narrativesMap.get(clusterId) ?? [];
              const isLast = i === sortedClusterIds.length - 1;

              return (
                <ClusterCard
                  key={clusterId}
                  clusterId={clusterId}
                  centroidAxisScores={centroidScores}
                  clusterData={clusterData}
                  topAxesProse={topAxes}
                  isLast={isLast}
                />
              );
            })}
          </div>
        </div>

        {/* Prose beneath the card grid */}
        <div className="mx-auto max-w-2xl mt-8 text-sm text-text-secondary leading-relaxed space-y-4">
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
      <section
        id="section-2"
        className="mb-20"
        style={{ scrollMarginTop: "72px" }}
      >
        <div className="mx-auto max-w-2xl mb-8">
          <h2 className="text-[22px] font-serif font-medium text-text-primary text-balance">
            Archetype distribution
          </h2>
        </div>

        {/* Chart — centered within wide shell */}
        <div
          className="mx-auto"
          style={{ maxWidth: "1120px", padding: "0 1rem" }}
        >
          <ArchetypeDistribution rows={distributionRows} />
        </div>

        {/* Prose */}
        <div className="mx-auto max-w-2xl mt-8 text-sm text-text-secondary leading-relaxed space-y-4">
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
      <section
        id="section-3"
        className="mb-16"
        style={{ scrollMarginTop: "72px" }}
      >
        <div className="mx-auto max-w-2xl mb-8">
          <h2 className="text-[22px] font-serif font-medium text-text-primary text-balance">
            Regional and demographic aggregates
          </h2>
        </div>

        {/* ── 3a — Density and cluster by region ── */}
        <div
          className="mx-auto"
          style={{ maxWidth: "1120px", padding: "0 1rem" }}
        >
          {/* Maps side-by-side on desktop, stacked on mobile.
              auto-fit collapses empty tracks so 2 maps fill the row
              cleanly at wider viewports (auto-fill would leave an
              empty third track at ≥1040px). min(320px, 100%) lets the
              column collapse below 320px on narrow phones instead of
              forcing horizontal page overflow. */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
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
        <div className="mx-auto max-w-2xl mt-8 text-sm text-text-secondary leading-relaxed space-y-4">
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
          <div className="mx-auto max-w-2xl mb-4">
            <h3 className="text-[17px] font-serif font-medium text-text-primary">
              Cultural diversity across regions
            </h3>
          </div>

          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
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
        <div className="mx-auto max-w-2xl mt-6 text-sm text-text-secondary leading-relaxed space-y-4">
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
          <div className="mx-auto max-w-2xl mb-6">
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
        <div className="mx-auto max-w-2xl mt-8 text-sm text-text-secondary leading-relaxed space-y-4">
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
      {/* Section 4 — Axis-level distributions                               */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="section-4"
        className="mb-16"
        style={{ scrollMarginTop: "72px" }}
      >
        <div className="mx-auto max-w-2xl mb-8">
          <h2 className="text-[22px] font-serif font-medium text-text-primary text-balance">
            Axis-level distributions
          </h2>
        </div>

        {/* Ridge plot — full width, single stacked series ordered axis 1→12 */}
        <div
          className="mx-auto"
          style={{ maxWidth: "1120px", padding: "0 1rem" }}
        >
          <ViolinOrRidge
            series={ridgeSeries}
            range={[-1, 1]}
            ridgeHeight={52}
            ariaLabel="Ridge plot of axis score distributions for all 12 axes"
          />
        </div>

        {/* Prose */}
        <div className="mx-auto max-w-2xl mt-8 text-sm text-text-secondary leading-relaxed space-y-4">
          <p>
            Most axes are unimodal — the population spreads along a continuum
            without clear bimodality. The exceptions worth naming: Axes 3
            (Governance Structure) and 4 (Decision Authority) show clear
            bimodality, which reflects the cluster structure — distributed/popular
            clusters (C1, C3) versus centralized/institutional clusters (C0, C5).
            Axes 5 (Rights Balance) and 6 (Legitimacy Basis) also show bimodal
            separation, corresponding to the liberty-leaning clusters versus
            security-oriented ones.
          </p>
          <p>
            Axis 9 (Human Nature) shows the widest constructivism-essentialism
            split: two significant peaks at opposite ends of the scale,
            corresponding to the collective-provision clusters (constructivist)
            versus the nationalist-populist cluster (essentialist). Axis 2
            (Environmental Policy) is similarly polarized.
          </p>
          <p>
            Axis 11 (Military Policy) is worth flagging for its one-sidedness:
            the population leans uniformly non-interventionist with variation only
            in degree, and no secondary peak appears on the interventionist side.
            This says something about the personas Gemini generated rather than
            about the axis itself.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 5 — Correlations                                            */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="section-5"
        className="mb-20"
        style={{ scrollMarginTop: "72px" }}
      >
        <div className="mx-auto max-w-2xl mb-8">
          <h2 className="text-[22px] font-serif font-medium text-text-primary text-balance">
            Correlations
          </h2>
        </div>

        {/* Desktop: full heatmap — centered within wide shell */}
        <div
          className="mx-auto hidden md:block"
          style={{ maxWidth: "1120px", padding: "0 1rem" }}
        >
          <CorrelationHeatmap
            matrix={correlationMatrix}
            labels={correlationLabels}
            lowerTriangleOnly={true}
            cellSize={40}
            ariaLabel="12×12 correlation heatmap of axis scores"
          />
        </div>

        {/* Mobile: top correlations list */}
        <div
          className="mx-auto block md:hidden"
          style={{ maxWidth: "600px", padding: "0 1rem" }}
        >
          <TopCorrelationsList
            matrix={correlationMatrix}
            labels={axes.map((a) => `Axis ${a.id} (${a.name})`)}
            n={10}
          />
        </div>

        {/* Prose — same on both */}
        <div className="mx-auto max-w-2xl mt-8 text-sm text-text-secondary leading-relaxed space-y-4">
          <p>
            A few axis pairs covary strongly enough to note. Axis 7 (Social
            Change) correlates most tightly with Axis 9 (Human Nature) at r =
            +0.72 — progressive change preferences come packaged with
            constructivist views of human nature. Axis 3 (Governance Structure)
            and Axis 4 (Decision Authority) also correlate tightly at r = +0.71,
            which is expected: centralized governance and institutional authority
            co-occur, distributed governance and popular sovereignty co-occur.
            Axis 5 (Rights Balance) and Axis 6 (Legitimacy Basis) cluster
            together at r = +0.69.
          </p>
          <p>
            Most axes are substantially independent. The 12 axes were designed to
            capture distinct dimensions of governance philosophy, and the
            correlation structure suggests they largely succeed — no two axes are
            so correlated as to be measuring the same thing. The claimed close
            relationship between Axis 1 (Economic Model) and Axis 5 (Rights
            Balance) is modest in this dataset at r = +0.28 — the pairing exists
            but is not dominant.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 6 — Tension patterns                                        */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="section-6"
        className="mb-16"
        style={{ scrollMarginTop: "72px" }}
      >
        <div className="mx-auto max-w-2xl mb-8">
          <h2 className="text-[22px] font-serif font-medium text-text-primary text-balance">
            Tension patterns
          </h2>
        </div>

        {/* Overall tension rate per axis — centered within wide shell */}
        <div
          className="mx-auto mb-10"
          style={{ maxWidth: "1120px", padding: "0 1rem" }}
        >
          <div className="mx-auto max-w-2xl mb-4">
            <p
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-sans)",
                marginBottom: "8px",
              }}
            >
              Overall tension rate by axis (Claude / Gemini)
            </p>
          </div>
          <HorizontalBarChart
            rows={tensionBarRows}
            range={[0, 100]}
            barHeight={14}
            ariaLabel="Overall tension rate per axis for Claude and Gemini models"
          />
        </div>

        {/* Tension matrix — centered within wide shell */}
        <div
          className="mx-auto"
          style={{ maxWidth: "1120px", padding: "0 1rem" }}
        >
          <div className="mx-auto max-w-2xl mb-4">
            <p
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-sans)",
                marginBottom: "8px",
              }}
            >
              Tension rate by axis × cluster. Overall column splits
              Claude/Gemini; cluster columns show a model-combined rate.
            </p>
          </div>
          <TensionMatrix
            data={tensionMatrixData}
            axisLabels={tensionAxisLabels}
            clusterLabels={tensionClusterLabels}
            cellSize={28}
            ariaLabel="Tension rates by axis and cluster"
          />
        </div>

        {/* Prose */}
        <div className="mx-auto max-w-2xl mt-8 text-sm text-text-secondary leading-relaxed space-y-4">
          <p>
            Tensions surface when a persona&apos;s forced-choice answer pulls one
            direction and their budget allocation pulls another on the same axis.
            They&apos;re a signal about the instrument&apos;s internal consistency
            — where tensions are rare, the modalities converge; where
            they&apos;re frequent, stated preferences and revealed preferences
            part ways.
          </p>
          <p>
            Axis 12 (Technology Governance) produces the highest tension rate in
            the dataset: 85% of Claude administrations and 73% of Gemini&apos;s
            trigger a mild-or-greater tension on that axis. This is a large and
            consistent divergence between what personas say about technology
            governance in forced-choice and scaled items versus how they allocate
            the education-and-research budget that proxies for it. Worth reviewing
            whether the ministry mapping for Axis 12 is a good proxy for the
            underlying axis, or whether the axis itself needs tightening.
          </p>
          <p>
            Axes 4 (Decision Authority) and 6 (Legitimacy Basis) are the next
            most tension-prone: Axis 4 runs at 66% (Claude) and 54% (Gemini);
            Axis 6 at 67% (Claude) and 57% (Gemini). These are axes where the
            budget&apos;s institutional-versus-popular signal consistently pulls
            against stated preferences. Axes 1 and 11 run quietest, with tension
            rates at 23% and 21% for Claude respectively.
          </p>
          <p>
            Axes 3, 7, 8, and 9 produce no tension in this dataset — they are
            not mapped to any ministry in the budget phase, so the forced-choice
            and scaled modalities are the only signal.
          </p>
        </div>
      </section>

      {/* Mobile refinements. Full+short section-nav labels swap on width;
          charts themselves are responsive via SVG viewBox, so no scroll
          fade hint is needed. */}
      <style>{`
        .section-nav-short { display: none; }
        @media (max-width: 767px) {
          .section-nav-full { display: none; }
          .section-nav-short { display: inline; }
        }
      `}</style>
    </main>
  );
}
