"use client";

import type { DemographicClusterDistribution } from "@/lib/study/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DemographicAggregatesProps {
  urbanRural: DemographicClusterDistribution[];
  economicPosition: DemographicClusterDistribution[];
  governanceExperience: DemographicClusterDistribution[];
  education: DemographicClusterDistribution[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CLUSTER_IDS = [0, 1, 2, 3, 4, 5] as const;

// Human-readable category labels
const CATEGORY_LABELS: Record<string, string> = {
  // urban_rural
  urban: "Urban",
  peri_urban: "Peri-urban",
  rural: "Rural",
  // economic_position
  wealthy: "Wealthy",
  affluent: "Affluent",
  middle_class: "Middle class",
  working_class: "Working class",
  struggling: "Struggling",
  // governance_experience
  stable_democracy: "Stable democracy",
  flawed_democracy: "Flawed democracy",
  hybrid_regime: "Hybrid regime",
  colonial_post_colonial_transition: "Colonial/transitional",
  conflict_zone: "Conflict zone",
  authoritarian_state: "Authoritarian",
  // education
  postgraduate: "Postgraduate",
  university: "University",
  secondary: "Secondary",
  primary: "Primary",
  none: "No formal ed.",
};

// Category sort orders (highest to lowest "sophistication" or social stratification)
const SORT_ORDERS: Record<string, string[]> = {
  urban_rural: ["urban", "peri_urban", "rural"],
  economic_position: ["wealthy", "affluent", "middle_class", "working_class", "struggling"],
  governance_experience: [
    "stable_democracy",
    "flawed_democracy",
    "hybrid_regime",
    "colonial_post_colonial_transition",
    "conflict_zone",
    "authoritarian_state",
  ],
  education: ["postgraduate", "university", "secondary", "primary", "none"],
};

// ---------------------------------------------------------------------------
// Single stacked bar chart
// ---------------------------------------------------------------------------

interface StackedBarChartProps {
  title: string;
  rows: DemographicClusterDistribution[];
  attribute: string;
}

function StackedBarChart({ title, rows, attribute }: StackedBarChartProps) {
  // Sort rows per defined order
  const sortOrder = SORT_ORDERS[attribute] ?? [];
  const sorted = [...rows].sort((a, b) => {
    const ai = sortOrder.indexOf(a.category);
    const bi = sortOrder.indexOf(b.category);
    if (ai === -1 && bi === -1) return a.category.localeCompare(b.category);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-xs, 11px)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--text-tertiary)",
          fontWeight: 500,
          margin: 0,
        }}
      >
        {title}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {sorted.map((row) => {
          const dist = row.cluster_distribution;
          const label =
            CATEGORY_LABELS[row.category] ?? row.category.replace(/_/g, " ");

          return (
            <div
              key={row.category}
              className="demo-agg-row"
              style={{
                display: "grid",
                gridTemplateColumns: "clamp(96px, 28%, 150px) minmax(0, 1fr) 40px",
                gap: "8px",
                alignItems: "center",
              }}
            >
              {/* Category label */}
              <span
                className="demo-agg-label"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-xs, 11px)",
                  color: "var(--text-secondary)",
                  textAlign: "right",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {label}
              </span>

              {/* Stacked bar */}
              <div
                style={{
                  display: "flex",
                  height: "20px",
                  borderRadius: "3px",
                  overflow: "hidden",
                  border: "1px solid var(--surface-2, #e5e5e5)",
                }}
                role="img"
                aria-label={`${label} cluster distribution: ${CLUSTER_IDS.map(
                  (c) => `C${c} ${Math.round((dist[String(c)] ?? 0) * 100)}%`
                ).join(", ")}`}
              >
                {CLUSTER_IDS.map((c) => {
                  const share = dist[String(c)] ?? 0;
                  if (share === 0) return null;
                  return (
                    <div
                      key={c}
                      title={`C${c}: ${Math.round(share * 100)}%`}
                      style={{
                        width: `${share * 100}%`,
                        background: `var(--cluster-${c})`,
                        flexShrink: 0,
                      }}
                    />
                  );
                })}
              </div>

              {/* Count annotation */}
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs, 10px)",
                  color: "var(--text-tertiary)",
                  whiteSpace: "nowrap",
                }}
              >
                n={row.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cluster color legend
// ---------------------------------------------------------------------------

function ClusterLegend() {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        padding: "6px 0",
      }}
      role="img"
      aria-label="Cluster color legend"
    >
      {CLUSTER_IDS.map((c) => (
        <div
          key={c}
          style={{ display: "flex", alignItems: "center", gap: "5px" }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 2,
              background: `var(--cluster-${c})`,
              border: "1px solid var(--map-border)",
              flexShrink: 0,
            }}
            aria-hidden
          />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs, 10px)",
              color: "var(--text-secondary)",
            }}
          >
            C{c}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DemographicAggregates({
  urbanRural,
  economicPosition,
  governanceExperience,
  education,
}: DemographicAggregatesProps) {
  return (
    <div>
      {/* min(420px, 100%) keeps the desktop floor while letting the column
          collapse to container width on narrow phones — without it, a fixed
          420px minimum forces horizontal page overflow below ~452px. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))",
          gap: "32px",
        }}
      >
        <StackedBarChart
          title="Urban / rural"
          rows={urbanRural}
          attribute="urban_rural"
        />
        <StackedBarChart
          title="Economic position"
          rows={economicPosition}
          attribute="economic_position"
        />
        <StackedBarChart
          title="Governance experience"
          rows={governanceExperience}
          attribute="governance_experience"
        />
        <StackedBarChart
          title="Education"
          rows={education}
          attribute="education"
        />
      </div>

      {/* Legend below grid */}
      <div style={{ marginTop: "16px" }}>
        <ClusterLegend />
      </div>
    </div>
  );
}
