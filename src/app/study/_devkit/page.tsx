/**
 * DEVKIT PAGE — TEMPORARY (Phase 2b + 2c visual verification)
 * Remove in Phase 7 polish. Do not link from navigation.
 * View at: http://localhost:3000/study/_devkit
 */
"use client";

import { useState } from "react";
import { WorldMap } from "@/components/study/WorldMap";
import { TransnationalTile } from "@/components/study/TransnationalTile";
import { MapLegend } from "@/components/study/MapLegend";
import { Histogram } from "@/components/study/Histogram";
import { HorizontalBarChart } from "@/components/study/HorizontalBarChart";
import { CorrelationHeatmap } from "@/components/study/CorrelationHeatmap";
import { ViolinOrRidge } from "@/components/study/ViolinOrRidge";
import { TensionMatrix } from "@/components/study/TensionMatrix";
import type { RegionKey, ClusterId } from "@/lib/study/types";
import type { TensionMatrixDatum } from "@/components/study/TensionMatrix";

// Sample data matching real study numbers
const REGION_COUNTS: Record<RegionKey, number> = {
  western_europe: 134,
  south_southeast_asia: 133,
  east_asia: 112,
  latin_america: 112,
  eastern_europe_central_asia: 111,
  middle_east_north_africa: 111,
  sub_saharan_africa: 111,
  north_america: 89,
  oceania_small_states: 33,
  diaspora_transnational: 56,
};

const TOP_ARCHETYPES: Partial<Record<RegionKey, string[]>> = {
  western_europe: ["Progressive Federalist", "Nationalist Populist", "Market Liberal"],
  north_america: ["Radical Egalitarian", "Market Liberal", "Communitarian Steward"],
  east_asia: ["Developmental Modernizer", "Institutional Moderate", "Nationalist Populist"],
  latin_america: ["Popular Egalitarian", "Communitarian Steward", "Nationalist Populist"],
  south_southeast_asia: ["Popular Egalitarian", "Developmental Modernizer", "Communitarian Steward"],
  eastern_europe_central_asia: ["Nationalist Populist", "Institutional Moderate", "Progressive Federalist"],
  middle_east_north_africa: ["Developmental Modernizer", "Nationalist Populist", "Institutional Moderate"],
  sub_saharan_africa: ["Popular Egalitarian", "Communitarian Steward", "Progressive Federalist"],
  oceania_small_states: ["Communitarian Steward", "Progressive Federalist", "Market Liberal"],
  diaspora_transnational: ["Progressive Federalist", "Radical Egalitarian", "Popular Egalitarian"],
};

const DOMINANT_CLUSTERS: Partial<Record<RegionKey, { cluster: ClusterId; share: number }>> = {
  western_europe: { cluster: 2, share: 0.38 },
  eastern_europe_central_asia: { cluster: 2, share: 0.37 },
  middle_east_north_africa: { cluster: 5, share: 0.36 },
  north_america: { cluster: 4, share: 0.36 },
  oceania_small_states: { cluster: 3, share: 0.33 },
  sub_saharan_africa: { cluster: 1, share: 0.32 },
  east_asia: { cluster: 5, share: 0.31 },
  diaspora_transnational: { cluster: 0, share: 0.30 },
  latin_america: { cluster: 1, share: 0.29 },
  south_southeast_asia: { cluster: 1, share: 0.21 },
};

const AXIS8_MEANS: Partial<Record<RegionKey, number>> = {
  eastern_europe_central_asia: 0.43,
  east_asia: 0.27,
  western_europe: 0.23,
  middle_east_north_africa: 0.19,
  sub_saharan_africa: -0.05,
  south_southeast_asia: -0.02,
  oceania_small_states: -0.10,
  north_america: -0.15,
  latin_america: -0.23,
  diaspora_transnational: -0.37,
};

const CLUSTER_IDS: readonly ClusterId[] = [0, 1, 2, 3, 4, 5];

// ------------------------------------------------------------------ Phase 2c

// Histogram: distance distribution, roughly bell-shaped around 1.2
const HIST_BINS = [4, 9, 18, 34, 52, 71, 88, 95, 80, 62, 44, 28, 14, 7, 3];
const AXIS_LABELS_SHORT = [
  "State/Mkt", "Auth/Lib", "Natl/Glob", "Trad/Prog",
  "Elit/Pop", "Eco/Env", "Civ/Sec", "Div/Coh",
  "Decentral", "Violence", "Intl Law", "Tech Gov",
];

// HorizontalBarChart: archetype distribution
const BAR_ROWS = [
  { label: "Progressive Federalist", value: 0.19, secondaryLabel: "19%", emergenceTag: "refined" },
  { label: "Nationalist Populist",   value: 0.17, secondaryLabel: "17%", emergenceTag: "dominant" },
  { label: "Market Liberal",         value: 0.14, secondaryLabel: "14%" },
  { label: "Developmental Modernizer", value: 0.12, secondaryLabel: "12%" },
  { label: "Communitarian Steward",  value: 0.11, secondaryLabel: "11%" },
  { label: "Popular Egalitarian",    value: 0.10, secondaryLabel: "10%" },
  { label: "Institutional Moderate", value: 0.08, secondaryLabel: "8%" },
  { label: "Radical Egalitarian",    value: 0.06, secondaryLabel: "6%" },
  { label: "Eco-Federalist",         value: 0.03, secondaryLabel: "3%" },
];

// HorizontalBarChart diverging: per-axis correlation drift
const DIVERGING_ROWS = [
  { label: "State/Market",     value:  0.34, secondaryLabel:  "0.34" },
  { label: "Auth/Liberal",     value: -0.28, secondaryLabel: "-0.28" },
  { label: "Natl/Global",      value:  0.18, secondaryLabel:  "0.18" },
  { label: "Trad/Progressive", value: -0.41, secondaryLabel: "-0.41" },
  { label: "Elit/Popular",     value:  0.09, secondaryLabel:  "0.09" },
  { label: "Eco/Environment",  value:  0.22, secondaryLabel:  "0.22" },
];

// CorrelationHeatmap: 6×6 sub-matrix (first 6 axes) for compact demo
const CORR_LABELS = AXIS_LABELS_SHORT.slice(0, 6);
const CORR_MATRIX: number[][] = [
  [1.00,  0.52, -0.12,  0.38, -0.07,  0.15],
  [0.52,  1.00,  0.06,  0.61,  0.10,  0.02],
  [-0.12,  0.06,  1.00, -0.18,  0.44, -0.09],
  [0.38,  0.61, -0.18,  1.00,  0.07,  0.19],
  [-0.07,  0.10,  0.44,  0.07,  1.00,  0.31],
  [0.15,  0.02, -0.09,  0.19,  0.31,  1.00],
];

// ViolinOrRidge: 6 axes, each with 10 bins over [-1, 1]
const RIDGE_SERIES = [
  { label: "State/Market",     bins: [2,4,7,12,18,22,15,10,6,3], mean:  0.18, domainColor: "var(--stone-600)" },
  { label: "Auth/Liberal",     bins: [5,8,14,20,22,16,9,4,2,1],  mean: -0.12, domainColor: "var(--slate-600)" },
  { label: "Natl/Global",      bins: [3,5,10,16,24,20,12,6,3,1], mean:  0.08, domainColor: "var(--sage-600)" },
  { label: "Trad/Progressive", bins: [1,3,6,10,16,22,20,14,6,2], mean:  0.22, domainColor: "var(--clay-600)" },
  { label: "Elit/Popular",     bins: [4,7,11,18,21,18,12,6,2,1], mean:  0.04, domainColor: "var(--stone-500)" },
  { label: "Eco/Environment",  bins: [2,5,8,14,20,24,16,7,3,1],  mean:  0.14, domainColor: "var(--slate-600)" },
];

// TensionMatrix sample data
const TENSION_DATA: TensionMatrixDatum[] = [
  // Axis 1 (State/Market)
  { axis: 1, cluster: 0, model: "claude", pct: 12 },
  { axis: 1, cluster: 0, model: "gemini", pct: 18 },
  { axis: 1, cluster: 1, model: "claude", pct: 34 },
  { axis: 1, cluster: 1, model: "gemini", pct: 29 },
  { axis: 1, cluster: 2, model: "claude", pct: 8  },
  { axis: 1, cluster: 2, model: "gemini", pct: 11 },
  // Axis 2 (Auth/Liberal)
  { axis: 2, cluster: 0, model: "claude", pct: 41 },
  { axis: 2, cluster: 0, model: "gemini", pct: 38 },
  { axis: 2, cluster: 1, model: "claude", pct: 22 },
  { axis: 2, cluster: 1, model: "gemini", pct: 19 },
  { axis: 2, cluster: 2, model: "claude", pct: 55 },
  { axis: 2, cluster: 2, model: "gemini", pct: 48 },
  // Axis 3 (Natl/Global)
  { axis: 3, cluster: 0, model: "claude", pct: 6  },
  { axis: 3, cluster: 0, model: "gemini", pct: 9  },
  { axis: 3, cluster: 1, model: "claude", pct: 31 },
  { axis: 3, cluster: 1, model: "gemini", pct: 27 },
  { axis: 3, cluster: 2, model: "claude", pct: 14 },
  { axis: 3, cluster: 2, model: "gemini", pct: 17 },
];
const TENSION_AXIS_LABELS = ["State/Market", "Auth/Liberal", "Natl/Global"];
const TENSION_CLUSTER_LABELS = ["Cluster 0", "Cluster 1", "Cluster 2"];

export default function DevKitPage() {
  const [selectedRegion, setSelectedRegion] = useState<RegionKey | null>(null);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 500, marginBottom: "0.5rem" }}>
        WorldMap DevKit — Phase 2b
      </h1>
      <p style={{ color: "var(--text-tertiary)", fontSize: "0.875rem", marginBottom: "2rem" }}>
        Temporary visual verification page. Not linked from navigation.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* Mode 1: Interactive */}
      {/* ------------------------------------------------------------------ */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 500, marginBottom: "0.25rem" }}>
          Mode 1: Interactive (density)
        </h2>
        <p style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", marginBottom: "0.75rem" }}>
          Selected: {selectedRegion ?? "none"}
        </p>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <WorldMap
              mode={{
                type: "interactive",
                selectedRegion,
                onRegionSelect: setSelectedRegion,
                regionCounts: REGION_COUNTS,
                topArchetypesByRegion: TOP_ARCHETYPES,
              }}
            />
            <MapLegend variant="density" breakpoints={[49, 89, 112, 133]} />
          </div>
          <TransnationalTile
            mode={{
              type: "interactive",
              selectedRegion,
              onRegionSelect: setSelectedRegion,
              regionCounts: REGION_COUNTS,
              topArchetypesByRegion: TOP_ARCHETYPES,
            }}
            count={56}
            className="devkit-transnational-tile"
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Mode 2: Static — density */}
      {/* ------------------------------------------------------------------ */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 500, marginBottom: "0.75rem" }}>
          Mode 2: Static — density
        </h2>
        <WorldMap
          mode={{
            type: "static-density",
            regionCounts: REGION_COUNTS,
            topArchetypesByRegion: TOP_ARCHETYPES,
          }}
        />
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginTop: "0.5rem" }}>
          <MapLegend variant="density" breakpoints={[49, 89, 112, 133]} />
          <TransnationalTile
            mode={{ type: "static-density", regionCounts: REGION_COUNTS }}
            count={56}
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Mode 3: Static — cluster */}
      {/* ------------------------------------------------------------------ */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 500, marginBottom: "0.75rem" }}>
          Mode 3: Static — cluster (hatching on S/SE Asia &lt;25%)
        </h2>
        <WorldMap
          mode={{
            type: "static-cluster",
            dominantClusterByRegion: DOMINANT_CLUSTERS,
          }}
        />
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginTop: "0.5rem" }}>
          <MapLegend variant="cluster" clusterIds={CLUSTER_IDS} />
          <TransnationalTile
            mode={{ type: "static-cluster", dominantClusterByRegion: DOMINANT_CLUSTERS }}
            count={56}
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Mode 4: Static — axis gradient */}
      {/* ------------------------------------------------------------------ */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 500, marginBottom: "0.75rem" }}>
          Mode 4: Static — axis 8 gradient (Cultural Diversity)
        </h2>
        <WorldMap
          mode={{
            type: "static-axis-gradient",
            axis: 8,
            meanAxisByRegion: AXIS8_MEANS,
            lowLabel: "Pluralism",
            highLabel: "Cohesion",
          }}
        />
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginTop: "0.5rem" }}>
          <MapLegend variant="axis-gradient" lowLabel="Pluralism" highLabel="Cohesion" min={-0.37} max={0.43} />
          <TransnationalTile
            mode={{
              type: "static-axis-gradient",
              axis: 8,
              meanAxisByRegion: AXIS8_MEANS,
              lowLabel: "Pluralism",
              highLabel: "Cohesion",
            }}
            count={56}
          />
        </div>
      </section>

      {/* ================================================================== */}
      {/* Phase 2c — Chart primitives                                        */}
      {/* ================================================================== */}
      <hr style={{ border: "none", borderTop: "1px solid var(--border-secondary)", margin: "3rem 0" }} />
      <h1 style={{ fontSize: "1.5rem", fontWeight: 500, marginBottom: "0.5rem" }}>
        Chart Primitives DevKit — Phase 2c
      </h1>
      <p style={{ color: "var(--text-tertiary)", fontSize: "0.875rem", marginBottom: "2rem" }}>
        Temporary visual verification. Not linked from navigation.
      </p>

      {/* Histogram */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 500, marginBottom: "0.25rem" }}>
          Histogram — distance distribution (bins 15, range [0, 3.5])
        </h2>
        <p style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", marginBottom: "0.75rem" }}>
          Overlays: mean (solid) at 1.3, median (dashed) at 1.25
        </p>
        <Histogram
          bins={HIST_BINS}
          range={[0, 3.5]}
          xLabel="Distance"
          yLabel="Count"
          height={180}
          overlays={[
            { value: 1.3, label: "Mean", dashed: false },
            { value: 1.25, label: "Median", dashed: true, color: "var(--text-tertiary)" },
          ]}
          ariaLabel="Histogram of distance distribution"
        />
      </section>

      {/* HorizontalBarChart — standard */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 500, marginBottom: "0.25rem" }}>
          HorizontalBarChart — archetype distribution (standard, with emergence tags)
        </h2>
        <HorizontalBarChart
          rows={BAR_ROWS}
          range={[0, 0.25]}
          ariaLabel="Archetype distribution bar chart"
        />
      </section>

      {/* HorizontalBarChart — diverging */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 500, marginBottom: "0.25rem" }}>
          HorizontalBarChart — per-axis drift (diverging, range [-0.5, 0.5])
        </h2>
        <HorizontalBarChart
          rows={DIVERGING_ROWS}
          diverging
          range={[-0.5, 0.5]}
          ariaLabel="Per-axis correlation drift diverging bar chart"
        />
      </section>

      {/* CorrelationHeatmap */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 500, marginBottom: "0.25rem" }}>
          CorrelationHeatmap — 6×6 lower-triangle (axes 1–6)
        </h2>
        <CorrelationHeatmap
          matrix={CORR_MATRIX}
          labels={CORR_LABELS}
          cellSize={32}
          ariaLabel="Axis correlation heatmap lower triangle"
          onCellHover={(row, col, val) =>
            console.log(`Hovered: ${CORR_LABELS[row]} × ${CORR_LABELS[col]} = ${val}`)
          }
        />
      </section>

      {/* ViolinOrRidge */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 500, marginBottom: "0.25rem" }}>
          ViolinOrRidge — 6 axes, range [-1, 1], ridgeHeight 52
        </h2>
        <ViolinOrRidge
          series={RIDGE_SERIES}
          range={[-1, 1]}
          ridgeHeight={52}
        />
      </section>

      {/* TensionMatrix */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 500, marginBottom: "0.25rem" }}>
          TensionMatrix — 3 axes × 3 clusters × 2 models
        </h2>
        <p style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", marginBottom: "0.75rem" }}>
          Hover cells for tooltip. Cells ≥30% show percentage text.
        </p>
        <TensionMatrix
          data={TENSION_DATA}
          axisLabels={TENSION_AXIS_LABELS}
          clusterLabels={TENSION_CLUSTER_LABELS}
          cellSize={36}
          ariaLabel="Tension matrix — axis by cluster by model"
        />
      </section>

    </div>
  );
}
