"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCallback } from "react";
import { useStudyFilters } from "@/lib/study/filterState";
import { useDebouncedFilterInput } from "@/lib/study/useDebouncedFilterInput";
import {
  ECONOMIC_LABELS,
  EDUCATION_LABELS,
  GENDER_LABELS,
  GOVERNANCE_LABELS,
  URBAN_RURAL_LABELS,
  labelFor,
} from "@/lib/study/labels";
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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

/* The type layer of the panel's repeated elements. It cannot live in the
   style constants below: the delta's roles are Tailwind `@utility` rules and
   there is no spelling of one inside a `style` prop. Each constant keeps only
   what is left of it — layout. */
const fieldLabelClass = "body-xs text-text-secondary font-medium";
const fieldControlClass = "body-s text-text-primary";
const groupLabelClass = "label text-text-label font-medium";

const fieldLabelStyle: CSSProperties = {
  display: "block",
  marginBottom: "4px",
};

const selectStyle: CSSProperties = {
  width: "100%",
  padding: "5px 8px",
  border: "1px solid var(--border-primary)",
  borderRadius: "var(--radius)",
  backgroundColor: "var(--surface-1)",
  appearance: "auto",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "5px 8px",
  border: "1px solid var(--border-primary)",
  borderRadius: "var(--radius)",
  backgroundColor: "var(--surface-1)",
  boxSizing: "border-box",
};

const fieldStyle: CSSProperties = {
  marginBottom: "14px",
};

const groupLabelStyle: CSSProperties = {
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
      <div className={groupLabelClass} style={{ ...groupLabelStyle, ...(first ? { marginTop: 0, paddingTop: 0, borderTop: "none" } : {}) }}>
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
  const { filters, setFilter, clearFilter } = useStudyFilters();

  // The three free-text inputs are buffered locally and committed once typing
  // settles, with `replace` so a search never costs a history entry per
  // keystroke. Every other control below is a discrete choice and pushes.
  const commitQuery = useCallback(
    (value: string) => {
      if (value) setFilter("q", value, { history: "replace" });
      else clearFilter("q", { history: "replace" });
    },
    [setFilter, clearFilter]
  );
  const [queryDraft, onQueryChange] = useDebouncedFilterInput(
    filters.q ?? "",
    commitQuery
  );

  const commitAgeMin = useCallback(
    (value: string) => {
      const n = parseInt(value, 10);
      if (Number.isFinite(n)) setFilter("age_min", n, { history: "replace" });
      else clearFilter("age_min", { history: "replace" });
    },
    [setFilter, clearFilter]
  );
  const [ageMinDraft, onAgeMinChange] = useDebouncedFilterInput(
    filters.age_min !== undefined ? String(filters.age_min) : "",
    commitAgeMin
  );

  const commitAgeMax = useCallback(
    (value: string) => {
      const n = parseInt(value, 10);
      if (Number.isFinite(n)) setFilter("age_max", n, { history: "replace" });
      else clearFilter("age_max", { history: "replace" });
    },
    [setFilter, clearFilter]
  );
  const [ageMaxDraft, onAgeMaxChange] = useDebouncedFilterInput(
    filters.age_max !== undefined ? String(filters.age_max) : "",
    commitAgeMax
  );

  return (
    <div>
      {/* Name search — standalone at top. Page-level filter chip row already
          surfaces active filters + Clear all, so no panel-level header is
          needed here. */}
      <div style={fieldStyle}>
        <label className={fieldLabelClass} style={fieldLabelStyle} htmlFor="filter-q">
          Name
        </label>
        <input
          id="filter-q"
          type="search"
          placeholder="Search by name…"
          value={queryDraft}
          onChange={(e) => onQueryChange(e.target.value)}
          className={fieldControlClass}
          style={inputStyle}
        />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Geography                                                          */}
      {/* ---------------------------------------------------------------- */}
      <Group label="Geography">
        {regions.length > 0 && (
          <div style={fieldStyle}>
            <label className={fieldLabelClass} style={fieldLabelStyle} htmlFor="filter-region">
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
              className={fieldControlClass}
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
            <label className={fieldLabelClass} style={fieldLabelStyle} htmlFor="filter-urban-rural">
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
              className={fieldControlClass}
              style={selectStyle}
            >
              <option value="">All</option>
              {urbanRuralCategories.map((u) => (
                <option key={u} value={u}>
                  {labelFor(URBAN_RURAL_LABELS, u)}
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
            <label className={fieldLabelClass} style={fieldLabelStyle} htmlFor="filter-cluster">
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
              className={fieldControlClass}
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
            <label className={fieldLabelClass} style={fieldLabelStyle} htmlFor="filter-archetype">
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
              className={fieldControlClass}
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
            <label className={fieldLabelClass} style={fieldLabelStyle} htmlFor="filter-governance">
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
              className={fieldControlClass}
              style={selectStyle}
            >
              <option value="">All</option>
              {governanceCategories.map((g) => (
                <option key={g} value={g}>
                  {labelFor(GOVERNANCE_LABELS, g)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={fieldStyle}>
          <label className={fieldLabelClass} style={fieldLabelStyle} htmlFor="filter-shared">
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
            className={fieldControlClass}
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
          <span className={fieldLabelClass} style={fieldLabelStyle}>Age range</span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="number"
              aria-label="Minimum age"
              placeholder={String(ageRange[0])}
              min={ageRange[0]}
              max={ageRange[1]}
              value={ageMinDraft}
              onChange={(e) => onAgeMinChange(e.target.value)}
              className={fieldControlClass}
              style={{ ...inputStyle, width: "72px" }}
            />
            <span className="body-s text-text-secondary">–</span>
            <input
              type="number"
              aria-label="Maximum age"
              placeholder={String(ageRange[1])}
              min={ageRange[0]}
              max={ageRange[1]}
              value={ageMaxDraft}
              onChange={(e) => onAgeMaxChange(e.target.value)}
              className={fieldControlClass}
              style={{ ...inputStyle, width: "72px" }}
            />
          </div>
        </div>

        {genderCategories.length > 0 && (
          <div style={fieldStyle}>
            <label className={fieldLabelClass} style={fieldLabelStyle} htmlFor="filter-gender">
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
              className={fieldControlClass}
              style={selectStyle}
            >
              <option value="">All</option>
              {genderCategories.map((g) => (
                <option key={g} value={g}>
                  {labelFor(GENDER_LABELS, g)}
                </option>
              ))}
            </select>
          </div>
        )}

        {educationCategories.length > 0 && (
          <div style={fieldStyle}>
            <label className={fieldLabelClass} style={fieldLabelStyle} htmlFor="filter-education">
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
              className={fieldControlClass}
              style={selectStyle}
            >
              <option value="">All</option>
              {educationCategories.map((e) => (
                <option key={e} value={e}>
                  {labelFor(EDUCATION_LABELS, e)}
                </option>
              ))}
            </select>
          </div>
        )}

        {economicCategories.length > 0 && (
          <div style={fieldStyle}>
            <label className={fieldLabelClass} style={fieldLabelStyle} htmlFor="filter-economic">
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
              className={fieldControlClass}
              style={selectStyle}
            >
              <option value="">All</option>
              {economicCategories.map((e) => (
                <option key={e} value={e}>
                  {labelFor(ECONOMIC_LABELS, e)}
                </option>
              ))}
            </select>
          </div>
        )}
      </Group>

      {/* Sort — standalone at bottom */}
      <div style={{ ...fieldStyle, marginTop: "18px", paddingTop: "14px", borderTop: "0.5px solid var(--border-secondary)" }}>
        <label className={fieldLabelClass} style={fieldLabelStyle} htmlFor="filter-sort">
          Sort by
        </label>
        <select
          id="filter-sort"
          value={filters.sort ?? "name"}
          onChange={(e) => {
            const v = e.target.value as "name" | "age" | "region" | "cluster";
            setFilter("sort", v);
          }}
          className={fieldControlClass}
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
