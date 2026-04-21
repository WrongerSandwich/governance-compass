/**
 * DEVKIT PAGE — TEMPORARY (Phase 2b visual verification)
 * Remove in Phase 7 polish. Do not link from navigation.
 * View at: http://localhost:3000/study/_devkit
 */
"use client";

import { useState } from "react";
import { WorldMap } from "@/components/study/WorldMap";
import { TransnationalTile } from "@/components/study/TransnationalTile";
import { MapLegend } from "@/components/study/MapLegend";
import type { RegionKey, ClusterId } from "@/lib/study/types";

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
    </div>
  );
}
