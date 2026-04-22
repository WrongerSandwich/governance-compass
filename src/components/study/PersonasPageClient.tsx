"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { WorldMap } from "@/components/study/WorldMap";
import { TransnationalTile } from "@/components/study/TransnationalTile";
import { PersonaFilters } from "@/components/study/PersonaFilters";
import { PersonaGrid } from "@/components/study/PersonaGrid";
import { PersonaModal } from "@/components/study/PersonaModal";
import { CompareFloatingButton } from "@/components/study/CompareFloatingButton";
import { CompareView } from "@/components/study/CompareView";
import { PersonasProvider } from "@/lib/study/PersonasContext";
import { useStudyFilters } from "@/lib/study/filterState";
import { usePinnedPersonas } from "@/lib/study/usePinnedPersonas";
import { REGION_LABELS } from "@/lib/study/types";
import { archetypes } from "@/data/archetypes";
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
  if (filters.archetype) {
    const archetypeName =
      archetypes.find((a) => a.id === filters.archetype)?.name ??
      filters.archetype;
    chips.push({
      label: `Archetype: ${archetypeName}`,
      key: "archetype",
    });
  }
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
        alignItems: "baseline",
        columnGap: "14px",
        rowGap: "6px",
        marginBottom: "12px",
        fontSize: "12px",
        color: "var(--text-secondary)",
      }}
    >
      {chips.map((chip) => (
        <span
          key={chip.key}
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: "6px",
            whiteSpace: "nowrap",
          }}
        >
          <span>{chip.label}</span>
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
          padding: 0,
          textDecoration: "underline",
          textUnderlineOffset: "3px",
          textDecorationColor: "var(--border-secondary)",
        }}
      >
        Clear all
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Region chip row — text-only button row below the map, always visible.
// Serves as a tap-friendly companion to the map and a keyboard-accessible
// alternative for selecting a region filter.
// ---------------------------------------------------------------------------

interface RegionChipRowProps {
  regions: RegionKey[];
  regionCounts: Record<RegionKey, number>;
  transnationalCount: number;
  selectedRegion: RegionKey | null;
  onRegionSelect: (r: RegionKey | null) => void;
}

function RegionChipRow({
  regions,
  regionCounts,
  transnationalCount,
  selectedRegion,
  onRegionSelect,
}: RegionChipRowProps) {
  // Ensure diaspora_transnational is present and ordered last
  const ordered: RegionKey[] = [
    ...regions.filter((r) => r !== "diaspora_transnational"),
    "diaspora_transnational" as RegionKey,
  ];

  return (
    <nav
      aria-label="Select a region"
      style={{
        display: "flex",
        flexWrap: "wrap",
        columnGap: "16px",
        rowGap: "4px",
        alignItems: "baseline",
        marginTop: "12px",
        marginBottom: "16px",
        fontSize: "12px",
        lineHeight: 1.7,
        color: "var(--text-secondary)",
      }}
    >
      {ordered.map((r) => {
        const active = selectedRegion === r;
        const count =
          r === "diaspora_transnational"
            ? transnationalCount
            : regionCounts[r] ?? 0;
        return (
          <button
            key={r}
            onClick={() => onRegionSelect(active ? null : r)}
            aria-pressed={active}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontSize: "12px",
              color: active
                ? "var(--stone-600)"
                : "var(--text-secondary)",
              fontWeight: active ? 500 : 400,
              whiteSpace: "nowrap",
              textDecoration: active ? "underline" : "none",
              textUnderlineOffset: "3px",
              textDecorationColor: "var(--stone-600)",
            }}
          >
            {REGION_LABELS[r] ?? r}
            <span
              aria-hidden="true"
              style={{
                marginLeft: "6px",
                color: "var(--text-tertiary)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Filter panel collapse — closed on mobile (<960px), expanded on desktop.
// ---------------------------------------------------------------------------

function FilterPanelCollapse({
  activeCount,
  children,
}: {
  activeCount: number;
  children: React.ReactNode;
}) {
  // Default open on SSR (desktop-safe); useEffect corrects on mobile.
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 960px)");
    const sync = () => setOpen(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  return (
    <div className="persona-filters-wrap">
      <button
        type="button"
        className="persona-filters-toggle"
        aria-expanded={open}
        aria-controls="persona-filters-content"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>
          Filters
          {activeCount > 0 && (
            <span style={{ color: "var(--text-tertiary)", marginLeft: "6px" }}>
              ({activeCount} active)
            </span>
          )}
        </span>
        <span aria-hidden="true">{open ? "▾" : "▸"}</span>
      </button>
      <div
        id="persona-filters-content"
        hidden={!open}
        className="persona-filters-content"
      >
        {children}
      </div>
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

  const { pinned, togglePin, canPin, clearAll: clearAllPins } =
    usePinnedPersonas();

  const personaId = searchParams.get("persona");
  const compareView = searchParams.get("compareView");

  const openCompareView = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("compareView", "open");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  const closeCompareView = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("compareView");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  const unpinPersona = useCallback((id: string) => {
    togglePin(id);
    // If only 1 left after unpin, close the compare view
    if (pinned.length <= 2) {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("compareView");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }
  }, [togglePin, pinned.length, router, pathname, searchParams]);

  // Derive catalog metadata for filter options
  const catalogMeta = useMemo(() => {
    const regions = [...new Set(catalog.map((p) => p.region))].sort();
    const clusters = [...new Set(catalog.map((p) => p.cluster))].sort(
      (a, b) => a - b
    ) as ClusterId[];
    const archetypeIds = [...new Set(catalog.map((p) => p.nearest_archetype_id))];
    const archetypeLabel = (id: string) =>
      archetypes.find((a) => a.id === id)?.name ?? id;
    const archetypeOptions = archetypeIds.map((id) => ({
      id,
      name: archetypeLabel(id),
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
      archetypes: archetypeOptions,
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
        <div style={{ padding: "24px 0 20px" }}>
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
              fontSize: "clamp(32px, 5vw, 38px)",
              lineHeight: 1.15,
              color: "var(--text-primary)",
              marginBottom: "8px",
            }}
          >
            Personas
          </h1>
          <p
            style={{
              fontSize: "15px",
              fontFamily: "var(--font-serif)",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}
          >
            A gazetteer of the {catalog.length.toLocaleString()} personas
            Gemini generated for the April 2026 study, faceted by region,
            governance context, and demographic attributes.
          </p>
        </div>

        {/* Map + Transnational tile: side-by-side on desktop, stacked on mobile.
            No card chrome — the map sits inline against the page. */}
        <div
          className="map-tile-layout"
          style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <div style={{ flex: "1 1 0", minWidth: 0 }}>
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

        {/* Region chip row — text-only, always visible. Tap-friendly companion
            to the map and keyboard-accessible alternative to the map's
            geographic tap targets. */}
        <RegionChipRow
          regions={catalogMeta.regions}
          regionCounts={regionCounts}
          transnationalCount={transnationalCount}
          selectedRegion={selectedRegion}
          onRegionSelect={handleRegionSelect}
        />

        {/* Filter chips */}
        <FilterChips
          filters={filters}
          clearFilter={clearFilter}
          clearAll={clearAll}
          activeCount={activeCount}
        />

        {/* Main content: filter panel + grid */}
        <div className="personas-layout">
          {/* Filter panel — collapsible on mobile, always-open on desktop */}
          <div className="personas-filters">
            <FilterPanelCollapse activeCount={activeCount}>
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
            </FilterPanelCollapse>

            {/* Pin count annotation — quiet inline sentence */}
            {pinned.length > 0 && (
              <p
                style={{
                  marginTop: "18px",
                  paddingTop: "12px",
                  borderTop: "0.5px solid var(--border-secondary)",
                  fontSize: "12px",
                  color: "var(--text-tertiary)",
                  lineHeight: 1.5,
                }}
              >
                {pinned.length} pinned
                {pinned.length < 2 && " — pin one more to compare"}
                {pinned.length === 4 && " — maximum reached"}
              </p>
            )}
          </div>

          {/* Persona grid */}
          <div className="personas-grid-area">
            <PersonaGrid
              personas={filteredPersonas}
              pinned={pinned}
              canPin={canPin}
              onTogglePin={togglePin}
            />
          </div>
        </div>
      </main>

      {/* Floating compare button (≥2 pinned) */}
      <CompareFloatingButton
        count={pinned.length}
        onOpen={openCompareView}
        onClear={clearAllPins}
      />

      {/* Compare view (compareView=open in URL) */}
      {compareView === "open" && pinned.length >= 2 && (
        <CompareView
          pinnedIds={pinned}
          onClose={closeCompareView}
          onUnpin={unpinPersona}
        />
      )}

      {/* Modal — renders on top of compare view if both are active */}
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
        }
        /* Sidebar breakpoint aligns with the gazetteer's 2-col breakpoint
           (960px) so there's no intermediate zone with sidebar + 1-col grid. */
        @media (min-width: 960px) {
          .personas-layout {
            flex-direction: row;
            align-items: flex-start;
            gap: 24px;
          }
          .personas-filters {
            width: 220px;
            flex-shrink: 0;
          }
          /* Desktop: the collapse toggle is decorative/redundant; hide it
             and ensure content is always visible. */
          .persona-filters-toggle {
            display: none;
          }
        }
        /* Mobile collapse toggle: ghost button framed by thin rules. */
        .persona-filters-toggle {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          border-top: 0.5px solid var(--border-secondary);
          border-bottom: 0.5px solid var(--border-secondary);
          background: none;
          cursor: pointer;
          font-size: 13px;
          color: var(--text-primary);
          text-align: left;
          font-family: inherit;
          margin-bottom: 14px;
        }
        .persona-filters-toggle:hover {
          color: var(--text-primary);
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
