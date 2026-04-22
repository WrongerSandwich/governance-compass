"use client";

import type { CSSProperties, ReactNode } from "react";
import { useStudyFilters } from "@/lib/study/filterState";
import { REGION_LABELS } from "@/lib/study/types";
import type { RegionKey, ClusterId, UrbanRural } from "@/lib/study/types";

export interface PersonaFiltersProps {
  regions: RegionKey[];
  clusters: ClusterId[];
  archetypes: Array<{ id: string; name: string }>;
  governanceCategories: string[];
  economicCategories: string[];
  urbanRuralCategories: UrbanRural[];
  educationCategories: string[];
  genderCategories: string[];
  ageRange: [number, number];
}

const CLUSTER_LABELS: Record<ClusterId, string> = {
  0: "C0 — Institutional authority",
  1: "C1 — Non-interventionism",
  2: "C2 — Sovereignty & tradition",
  3: "C3 — Distributed governance",
  4: "C4 — Collective provision",
  5: "C5 — Centralized governance",
};

const EDUCATION_LABELS: Record<string, string> = {
  primary: "Primary",
  secondary: "Secondary",
  vocational: "Vocational",
  university: "University",
  postgraduate: "Postgraduate",
};

const ECONOMIC_LABELS: Record<string, string> = {
  affluent: "Affluent",
  upper_middle_class: "Upper middle class",
  middle_class: "Middle class",
  working_class: "Working class",
  struggling: "Struggling",
  impoverished: "Impoverished",
};

const URBAN_RURAL_LABELS: Record<UrbanRural, string> = {
  urban: "Urban",
  peri_urban: "Peri-urban",
  rural: "Rural",
};

const GOVERNANCE_LABELS: Record<string, string> = {
  stable_democracy: "Stable democracy",
  transitional_democracy: "Transitional democracy",
  hybrid_regime: "Hybrid regime",
  authoritarian: "Authoritarian",
  conflict_affected: "Conflict-affected",
  colonial_or_occupied: "Colonial / occupied",
  stateless_or_displaced: "Stateless / displaced",
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const fieldLabelStyle: CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  color: "var(--text-secondary)",
  display: "block",
  marginBottom: "4px",
};

const selectStyle: CSSProperties = {
  width: "100%",
  padding: "5px 8px",
  fontSize: "0.8125rem",
  border: "1px solid var(--border-primary)",
  borderRadius: "3px",
  backgroundColor: "var(--surface-1)",
  color: "var(--text-primary)",
  appearance: "auto",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "5px 8px",
  fontSize: "0.8125rem",
  border: "1px solid var(--border-primary)",
  borderRadius: "3px",
  backgroundColor: "var(--surface-1)",
  color: "var(--text-primary)",
  boxSizing: "border-box",
};

const fieldStyle: CSSProperties = {
  marginBottom: "14px",
};

const groupLabelStyle: CSSProperties = {
  fontSize: "10px",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--text-tertiary)",
  paddingTop: "14px",
  paddingBottom: "10px",
  borderTop: "0.5px solid var(--border-secondary)",
  marginTop: "18px",
};

// ---------------------------------------------------------------------------
// Small subcomponents
// ---------------------------------------------------------------------------

function Group({
  label,
  children,
  first,
}: {
  label: string;
  children: ReactNode;
  first?: boolean;
}) {
  return (
    <section>
      <div style={{ ...groupLabelStyle, ...(first ? { marginTop: 0, paddingTop: 0, borderTop: "none" } : {}) }}>
        {label}
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PersonaFilters({
  regions,
  clusters,
  archetypes,
  governanceCategories,
  economicCategories,
  urbanRuralCategories,
  educationCategories,
  genderCategories,
  ageRange,
}: PersonaFiltersProps) {
  const { filters, setFilter, clearFilter, clearAll, activeCount } =
    useStudyFilters();

  return (
    <div>
      {/* Header row: "Filters" + clear-all */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          paddingBottom: "10px",
          borderBottom: "0.5px solid var(--border-secondary)",
          marginBottom: "14px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
          }}
        >
          Filters
        </span>
        {activeCount > 0 && (
          <button
            onClick={() => clearAll()}
            style={{
              fontSize: "11px",
              color: "var(--stone-600)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>

      {/* Name search — standalone at top */}
      <div style={fieldStyle}>
        <label style={fieldLabelStyle} htmlFor="filter-q">
          Name
        </label>
        <input
          id="filter-q"
          type="search"
          placeholder="Search by name…"
          value={filters.q ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            if (v) setFilter("q", v);
            else clearFilter("q");
          }}
          style={inputStyle}
        />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Geography                                                          */}
      {/* ---------------------------------------------------------------- */}
      <Group label="Geography">
        {regions.length > 0 && (
          <div style={fieldStyle}>
            <label style={fieldLabelStyle} htmlFor="filter-region">
              Region
            </label>
            <select
              id="filter-region"
              value={filters.region ?? ""}
              onChange={(e) => {
                const v = e.target.value as RegionKey | "";
                if (v) setFilter("region", v);
                else clearFilter("region");
              }}
              style={selectStyle}
            >
              <option value="">All regions</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {REGION_LABELS[r] ?? r}
                </option>
              ))}
            </select>
          </div>
        )}

        {urbanRuralCategories.length > 0 && (
          <div style={fieldStyle}>
            <label style={fieldLabelStyle} htmlFor="filter-urban-rural">
              Setting
            </label>
            <select
              id="filter-urban-rural"
              value={filters.urban_rural ?? ""}
              onChange={(e) => {
                const v = e.target.value as UrbanRural | "";
                if (v) setFilter("urban_rural", v);
                else clearFilter("urban_rural");
              }}
              style={selectStyle}
            >
              <option value="">All</option>
              {urbanRuralCategories.map((u) => (
                <option key={u} value={u}>
                  {URBAN_RURAL_LABELS[u] ?? u}
                </option>
              ))}
            </select>
          </div>
        )}
      </Group>

      {/* ---------------------------------------------------------------- */}
      {/* Profile                                                            */}
      {/* ---------------------------------------------------------------- */}
      <Group label="Profile">
        {clusters.length > 0 && (
          <div style={fieldStyle}>
            <label style={fieldLabelStyle} htmlFor="filter-cluster">
              Cluster
            </label>
            <select
              id="filter-cluster"
              value={
                filters.cluster !== undefined ? String(filters.cluster) : ""
              }
              onChange={(e) => {
                const v = e.target.value;
                if (v !== "")
                  setFilter("cluster", parseInt(v, 10) as ClusterId);
                else clearFilter("cluster");
              }}
              style={selectStyle}
            >
              <option value="">All clusters</option>
              {clusters.map((c) => (
                <option key={c} value={String(c)}>
                  {CLUSTER_LABELS[c] ?? `Cluster ${c}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {archetypes.length > 0 && (
          <div style={fieldStyle}>
            <label style={fieldLabelStyle} htmlFor="filter-archetype">
              Nearest archetype
            </label>
            <select
              id="filter-archetype"
              value={filters.archetype ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v) setFilter("archetype", v);
                else clearFilter("archetype");
              }}
              style={selectStyle}
            >
              <option value="">All archetypes</option>
              {archetypes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {governanceCategories.length > 0 && (
          <div style={fieldStyle}>
            <label style={fieldLabelStyle} htmlFor="filter-governance">
              Governance experience
            </label>
            <select
              id="filter-governance"
              value={filters.governance ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v) setFilter("governance", v);
                else clearFilter("governance");
              }}
              style={selectStyle}
            >
              <option value="">All</option>
              {governanceCategories.map((g) => (
                <option key={g} value={g}>
                  {GOVERNANCE_LABELS[g] ?? g}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={fieldStyle}>
          <label style={fieldLabelStyle} htmlFor="filter-shared">
            Model coverage
          </label>
          <select
            id="filter-shared"
            value={filters.shared ?? "all"}
            onChange={(e) => {
              const v = e.target.value as
                | "all"
                | "shared_only"
                | "non_shared_only";
              setFilter("shared", v);
            }}
            style={selectStyle}
          >
            <option value="all">All personas</option>
            <option value="shared_only">Both models (shared)</option>
            <option value="non_shared_only">Single model only</option>
          </select>
        </div>
      </Group>

      {/* ---------------------------------------------------------------- */}
      {/* Demographics                                                       */}
      {/* ---------------------------------------------------------------- */}
      <Group label="Demographics">
        <div style={fieldStyle}>
          <span style={fieldLabelStyle}>Age range</span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="number"
              aria-label="Minimum age"
              placeholder={String(ageRange[0])}
              min={ageRange[0]}
              max={ageRange[1]}
              value={
                filters.age_min !== undefined ? String(filters.age_min) : ""
              }
              onChange={(e) => {
                const v = e.target.value;
                if (v) setFilter("age_min", parseInt(v, 10));
                else clearFilter("age_min");
              }}
              style={{ ...inputStyle, width: "72px" }}
            />
            <span
              style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem" }}
            >
              –
            </span>
            <input
              type="number"
              aria-label="Maximum age"
              placeholder={String(ageRange[1])}
              min={ageRange[0]}
              max={ageRange[1]}
              value={
                filters.age_max !== undefined ? String(filters.age_max) : ""
              }
              onChange={(e) => {
                const v = e.target.value;
                if (v) setFilter("age_max", parseInt(v, 10));
                else clearFilter("age_max");
              }}
              style={{ ...inputStyle, width: "72px" }}
            />
          </div>
        </div>

        {genderCategories.length > 0 && (
          <div style={fieldStyle}>
            <label style={fieldLabelStyle} htmlFor="filter-gender">
              Gender
            </label>
            <select
              id="filter-gender"
              value={filters.gender ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v) setFilter("gender", v);
                else clearFilter("gender");
              }}
              style={selectStyle}
            >
              <option value="">All</option>
              {genderCategories.map((g) => (
                <option key={g} value={g}>
                  {g.charAt(0).toUpperCase() + g.slice(1).replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        )}

        {educationCategories.length > 0 && (
          <div style={fieldStyle}>
            <label style={fieldLabelStyle} htmlFor="filter-education">
              Education
            </label>
            <select
              id="filter-education"
              value={filters.education ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v) setFilter("education", v);
                else clearFilter("education");
              }}
              style={selectStyle}
            >
              <option value="">All</option>
              {educationCategories.map((e) => (
                <option key={e} value={e}>
                  {EDUCATION_LABELS[e] ?? e}
                </option>
              ))}
            </select>
          </div>
        )}

        {economicCategories.length > 0 && (
          <div style={fieldStyle}>
            <label style={fieldLabelStyle} htmlFor="filter-economic">
              Economic position
            </label>
            <select
              id="filter-economic"
              value={filters.economic ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v) setFilter("economic", v);
                else clearFilter("economic");
              }}
              style={selectStyle}
            >
              <option value="">All</option>
              {economicCategories.map((e) => (
                <option key={e} value={e}>
                  {ECONOMIC_LABELS[e] ?? e}
                </option>
              ))}
            </select>
          </div>
        )}
      </Group>

      {/* Sort — standalone at bottom */}
      <div style={{ ...fieldStyle, marginTop: "18px", paddingTop: "14px", borderTop: "0.5px solid var(--border-secondary)" }}>
        <label style={fieldLabelStyle} htmlFor="filter-sort">
          Sort by
        </label>
        <select
          id="filter-sort"
          value={filters.sort ?? "name"}
          onChange={(e) => {
            const v = e.target.value as "name" | "age" | "region" | "cluster";
            setFilter("sort", v);
          }}
          style={selectStyle}
        >
          <option value="name">Name (A–Z)</option>
          <option value="age">Age</option>
          <option value="region">Region</option>
          <option value="cluster">Cluster</option>
        </select>
      </div>
    </div>
  );
}
