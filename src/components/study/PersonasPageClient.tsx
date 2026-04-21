"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { WorldMap } from "@/components/study/WorldMap";
import { TransnationalTile } from "@/components/study/TransnationalTile";
import { PersonaFilters } from "@/components/study/PersonaFilters";
import { PersonaGrid } from "@/components/study/PersonaGrid";
import { PersonaModal } from "@/components/study/PersonaModal";
import { PersonasProvider } from "@/lib/study/PersonasContext";
import { useStudyFilters } from "@/lib/study/filterState";
import { REGION_LABELS } from "@/lib/study/types";
import type {
  PersonaSlim,
  RegionalAggregate,
  CountryAggregate,
  RegionKey,
  ClusterId,
  UrbanRural,
} from "@/lib/study/types";

// ---------------------------------------------------------------------------
// Filter application
// ---------------------------------------------------------------------------

function applyFilters(
  catalog: PersonaSlim[],
  filters: ReturnType<typeof useStudyFilters>["filters"]
): PersonaSlim[] {
  let result = catalog;

  if (filters.region) {
    result = result.filter((p) => p.region === filters.region);
  }
  if (filters.cluster !== undefined) {
    result = result.filter((p) => p.cluster === filters.cluster);
  }
  if (filters.archetype) {
    result = result.filter((p) => p.nearest_archetype_id === filters.archetype);
  }
  if (filters.governance) {
    result = result.filter(
      (p) => p.governance_experience === filters.governance
    );
  }
  if (filters.economic) {
    result = result.filter((p) => p.economic_position === filters.economic);
  }
  if (filters.urban_rural) {
    result = result.filter((p) => p.urban_rural === filters.urban_rural);
  }
  if (filters.education) {
    result = result.filter((p) => p.education === filters.education);
  }
  if (filters.gender) {
    result = result.filter((p) => p.gender === filters.gender);
  }
  if (filters.age_min !== undefined) {
    result = result.filter((p) => p.age >= (filters.age_min ?? 0));
  }
  if (filters.age_max !== undefined) {
    result = result.filter((p) => p.age <= (filters.age_max ?? Infinity));
  }
  if (filters.shared === "shared_only") {
    result = result.filter((p) => p.n_models === 2);
  } else if (filters.shared === "non_shared_only") {
    result = result.filter((p) => p.n_models === 1);
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    result = result.filter((p) => p.name.toLowerCase().includes(q));
  }

  // Sort
  const sort = filters.sort ?? "name";
  result = [...result].sort((a, b) => {
    switch (sort) {
      case "age":
        return a.age - b.age;
      case "region":
        return a.region.localeCompare(b.region);
      case "cluster":
        return a.cluster - b.cluster;
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return result;
}

// ---------------------------------------------------------------------------
// Active filter chips
// ---------------------------------------------------------------------------

interface FilterChipsProps {
  filters: ReturnType<typeof useStudyFilters>["filters"];
  clearFilter: (key: keyof ReturnType<typeof useStudyFilters>["filters"]) => void;
  clearAll: () => void;
  activeCount: number;
}

function FilterChips({
  filters,
  clearFilter,
  clearAll,
  activeCount,
}: FilterChipsProps) {
  if (activeCount === 0) return null;

  const chips: Array<{ label: string; key: keyof typeof filters }> = [];

  if (filters.region)
    chips.push({
      label: `Region: ${REGION_LABELS[filters.region] ?? filters.region}`,
      key: "region",
    });
  if (filters.cluster !== undefined)
    chips.push({ label: `Cluster: C${filters.cluster}`, key: "cluster" });
  if (filters.archetype)
    chips.push({
      label: `Archetype: ${filters.archetype.replace(/-/g, " ")}`,
      key: "archetype",
    });
  if (filters.governance)
    chips.push({ label: `Governance: ${filters.governance}`, key: "governance" });
  if (filters.economic)
    chips.push({ label: `Economic: ${filters.economic}`, key: "economic" });
  if (filters.urban_rural)
    chips.push({ label: `Setting: ${filters.urban_rural}`, key: "urban_rural" });
  if (filters.education)
    chips.push({ label: `Education: ${filters.education}`, key: "education" });
  if (filters.gender)
    chips.push({ label: `Gender: ${filters.gender}`, key: "gender" });
  if (filters.age_min !== undefined || filters.age_max !== undefined) {
    const lo = filters.age_min ?? "any";
    const hi = filters.age_max ?? "any";
    if (filters.age_min !== undefined)
      chips.push({ label: `Age ≥ ${lo}`, key: "age_min" });
    if (filters.age_max !== undefined)
      chips.push({ label: `Age ≤ ${hi}`, key: "age_max" });
  }
  if (filters.shared && filters.shared !== "all")
    chips.push({
      label: filters.shared === "shared_only" ? "Both models" : "Single model",
      key: "shared",
    });
  if (filters.q)
    chips.push({ label: `Search: "${filters.q}"`, key: "q" });

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        alignItems: "center",
        marginBottom: "12px",
      }}
    >
      {chips.map((chip) => (
        <span
          key={chip.key}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            padding: "2px 8px",
            borderRadius: "12px",
            border: "1px solid var(--border-primary)",
            backgroundColor: "var(--surface-2)",
            color: "var(--text-secondary)",
          }}
        >
          {chip.label}
          <button
            onClick={() => clearFilter(chip.key)}
            aria-label={`Remove ${chip.label} filter`}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-tertiary)",
              padding: 0,
              lineHeight: 1,
              fontSize: "13px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
            }}
          >
            ×
          </button>
        </span>
      ))}
      <button
        onClick={clearAll}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "12px",
          color: "var(--stone-600)",
          padding: "2px 6px",
          fontWeight: 500,
        }}
      >
        Clear all
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Client component
// ---------------------------------------------------------------------------

export interface PersonasPageClientProps {
  catalog: PersonaSlim[];
  regionalAggregates: RegionalAggregate[];
  countryAggregates: CountryAggregate[];
}

function PersonasPageClientInner({
  catalog,
  regionalAggregates,
  countryAggregates,
}: PersonasPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { filters, setFilter, clearFilter, clearAll, activeCount } =
    useStudyFilters();

  const [pinned, setPinned] = useState<Set<string>>(new Set());

  const personaId = searchParams.get("persona");

  const handleTogglePin = useCallback((id: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  }, []);

  // Derive catalog metadata for filter options
  const catalogMeta = useMemo(() => {
    const regions = [...new Set(catalog.map((p) => p.region))].sort();
    const clusters = [...new Set(catalog.map((p) => p.cluster))].sort(
      (a, b) => a - b
    ) as ClusterId[];
    const archetypeIds = [...new Set(catalog.map((p) => p.nearest_archetype_id))];
    const archetypes = archetypeIds.map((id) => ({
      id,
      name: id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
    const governanceCategories = [
      ...new Set(catalog.map((p) => p.governance_experience)),
    ].sort();
    const economicCategories = [
      ...new Set(catalog.map((p) => p.economic_position)),
    ];
    const urbanRuralCategories = [
      ...new Set(catalog.map((p) => p.urban_rural)),
    ] as UrbanRural[];
    const educationCategories = [
      ...new Set(catalog.map((p) => p.education)),
    ].sort();
    const genderCategories = [...new Set(catalog.map((p) => p.gender))].sort();
    const ages = catalog.map((p) => p.age);
    const ageRange: [number, number] = [
      Math.min(...ages),
      Math.max(...ages),
    ];

    return {
      regions: regions as RegionKey[],
      clusters,
      archetypes,
      governanceCategories,
      economicCategories,
      urbanRuralCategories,
      educationCategories,
      genderCategories,
      ageRange,
    };
  }, [catalog]);

  // Apply filters to get the filtered persona list
  const filteredPersonas = useMemo(
    () => applyFilters(catalog, filters),
    [catalog, filters]
  );

  const filteredIds = useMemo(
    () => filteredPersonas.map((p) => p.id),
    [filteredPersonas]
  );

  // Map mode: region counts + top archetypes
  const regionCounts = useMemo(() => {
    const counts: Partial<Record<RegionKey, number>> = {};
    for (const agg of regionalAggregates) {
      counts[agg.region] = agg.count;
    }
    return counts as Record<RegionKey, number>;
  }, [regionalAggregates]);

  const topArchetypesByRegion = useMemo(() => {
    const result: Partial<Record<RegionKey, string[]>> = {};
    for (const agg of regionalAggregates) {
      result[agg.region] = agg.top_archetypes
        .slice(0, 3)
        .map((a) => a.name || a.id);
    }
    return result;
  }, [regionalAggregates]);

  const selectedRegion = filters.region ?? null;

  const handleRegionSelect = useCallback(
    (r: RegionKey | null) => {
      if (r) setFilter("region", r);
      else clearFilter("region");
    },
    [setFilter, clearFilter]
  );

  const transnationalCount =
    regionCounts["diaspora_transnational"] ?? 0;

  return (
    <PersonasProvider filteredIds={filteredIds}>
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 16px 48px" }}>
        {/* Page header */}
        <div style={{ padding: "24px 0 16px" }}>
          <p
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-tertiary)",
              fontWeight: 500,
              marginBottom: "4px",
            }}
          >
            Synthetic Study
          </p>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 500,
              fontSize: "28px",
              lineHeight: 1.2,
              color: "var(--text-primary)",
              marginBottom: "6px",
            }}
          >
            Personas
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}
          >
            {catalog.length.toLocaleString()} synthetic personas across 10
            regions — click a region to filter, or use the panel below.
          </p>
        </div>

        {/* Map + Transnational tile: side-by-side on desktop, stacked on mobile */}
        <div
          className="map-tile-layout"
          style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <div
            style={{
              flex: "1 1 0",
              border: "1px solid var(--border-secondary)",
              borderRadius: "6px",
              overflow: "hidden",
              backgroundColor: "var(--surface-2)",
            }}
          >
            <WorldMap
              mode={{
                type: "interactive",
                selectedRegion,
                onRegionSelect: handleRegionSelect,
                regionCounts,
                topArchetypesByRegion,
                countryAggregates,
              }}
            />
          </div>

          <div style={{ flex: "0 0 auto" }}>
            <TransnationalTile
              mode={{
                type: "interactive",
                selectedRegion,
                onRegionSelect: handleRegionSelect,
                regionCounts,
                topArchetypesByRegion,
              }}
              count={transnationalCount}
            />
          </div>
        </div>

        {/* Filter chips */}
        <FilterChips
          filters={filters}
          clearFilter={clearFilter}
          clearAll={clearAll}
          activeCount={activeCount}
        />

        {/* Main content: filter panel + grid */}
        <div className="personas-layout">
          {/* Filter panel */}
          <div className="personas-filters">
            <PersonaFilters
              regions={catalogMeta.regions}
              clusters={catalogMeta.clusters}
              archetypes={catalogMeta.archetypes}
              governanceCategories={catalogMeta.governanceCategories}
              economicCategories={catalogMeta.economicCategories}
              urbanRuralCategories={catalogMeta.urbanRuralCategories}
              educationCategories={catalogMeta.educationCategories}
              genderCategories={catalogMeta.genderCategories}
              ageRange={catalogMeta.ageRange}
            />

            {/* Pin compare button */}
            {pinned.size > 0 && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "10px",
                  border: "1px solid var(--border-primary)",
                  borderRadius: "4px",
                  backgroundColor: "var(--surface-2)",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                }}
              >
                <div style={{ fontWeight: 500, color: "var(--text-primary)", marginBottom: "4px" }}>
                  {pinned.size} pinned
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                  Compare feature coming in Phase 4c.
                </div>
                <button
                  onClick={() => setPinned(new Set())}
                  style={{
                    marginTop: "8px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "var(--stone-600)",
                    padding: 0,
                  }}
                >
                  Clear pins
                </button>
              </div>
            )}
          </div>

          {/* Persona grid */}
          <div className="personas-grid-area">
            <PersonaGrid
              personas={filteredPersonas}
              pinned={pinned}
              onTogglePin={handleTogglePin}
            />
          </div>
        </div>
      </main>

      {/* Modal */}
      {personaId && (
        <PersonaModal key={personaId} id={personaId} />
      )}

      <style>{`
        .map-tile-layout {
          flex-direction: column;
        }
        .personas-layout {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .personas-filters {
          width: 100%;
        }
        .personas-grid-area {
          flex: 1;
          min-width: 0;
        }
        @media (min-width: 768px) {
          .map-tile-layout {
            flex-direction: row !important;
            align-items: flex-start;
          }
          .personas-layout {
            flex-direction: row;
            align-items: flex-start;
            gap: 24px;
          }
          .personas-filters {
            width: 220px;
            flex-shrink: 0;
          }
        }
      `}</style>
    </PersonasProvider>
  );
}

// Wrap in Suspense for useSearchParams
export function PersonasPageClient(props: PersonasPageClientProps) {
  return (
    <Suspense fallback={null}>
      <PersonasPageClientInner {...props} />
    </Suspense>
  );
}
