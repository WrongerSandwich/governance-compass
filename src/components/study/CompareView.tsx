"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, ExternalLink } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Radar } from "@/components/study/Radar";
import { ArchetypeBadgeStudy } from "@/components/study/ArchetypeBadgeStudy";
import { ClusterBadge } from "@/components/study/ClusterBadge";
import { axes } from "@/data/axes";
import { REGION_LABELS } from "@/lib/study/types";
import type { PersonaDetailResponse, ClusterId } from "@/lib/study/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MINISTRY_ORDER = [
  "defense",
  "public_welfare",
  "economy_growth",
  "education_research",
  "environment",
  "justice_civil_liberties",
  "foreign_affairs",
];

const BUDGET_LABELS: Record<string, string> = {
  defense: "Defense",
  public_welfare: "Public Welfare",
  economy_growth: "Economy & Growth",
  education_research: "Education & Research",
  environment: "Environment",
  justice_civil_liberties: "Justice & Civil Liberties",
  foreign_affairs: "Foreign Affairs",
};

const BUDGET_COLORS = [
  "var(--cluster-5)",
  "var(--cluster-4)",
  "var(--cluster-0)",
  "var(--cluster-3)",
  "var(--cluster-1)",
  "var(--cluster-2)",
  "var(--stone-400)",
];

function axisKeyToNumber(key: string): number {
  return parseInt(key.split("_")[0], 10);
}

function axisScoresToArray(scores: Record<string, number>): number[] {
  const arr: number[] = new Array(12).fill(0);
  for (const [key, val] of Object.entries(scores)) {
    const n = axisKeyToNumber(key);
    if (n >= 1 && n <= 12) arr[n - 1] = val;
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Mini budget strip
// ---------------------------------------------------------------------------

function MiniBudgetStrip({ budget }: { budget: Record<string, number> }) {
  const total = Object.values(budget).reduce((s, v) => s + (v ?? 0), 0) || 50;
  const entries = MINISTRY_ORDER.map((key) => ({
    key,
    name: BUDGET_LABELS[key] ?? key,
    value: budget[key] ?? 0,
  }));

  return (
    <div>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: "var(--text-tertiary)",
          marginBottom: "5px",
        }}
      >
        Budget
      </div>
      <div
        style={{
          display: "flex",
          height: "16px",
          borderRadius: "3px",
          overflow: "hidden",
          border: "1px solid var(--border-secondary)",
        }}
        role="img"
        aria-label="Budget allocation"
      >
        {entries.map((e, i) => {
          const pct = (e.value / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={e.key}
              title={`${e.name}: ${e.value}`}
              style={{
                width: `${pct}%`,
                backgroundColor: BUDGET_COLORS[i % BUDGET_COLORS.length],
                flexShrink: 0,
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 10px",
          marginTop: "5px",
        }}
      >
        {entries.map((e, i) => (
          <div
            key={e.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "3px",
              fontSize: "10px",
              color: "var(--text-tertiary)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "6px",
                height: "6px",
                borderRadius: "1px",
                backgroundColor: BUDGET_COLORS[i % BUDGET_COLORS.length],
                flexShrink: 0,
              }}
            />
            {e.name.split(" ")[0]} {e.value}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single persona panel
// ---------------------------------------------------------------------------

function PersonaPanel({
  data,
  panelId,
  headingId,
  onUnpin,
  onViewFull,
}: {
  data: PersonaDetailResponse;
  panelId: string;
  headingId: string;
  onUnpin: () => void;
  onViewFull: () => void;
}) {
  const { persona, cluster, n_models, nearest_archetype, averaged_axis_scores } =
    data;

  const regionLabel =
    (REGION_LABELS as Record<string, string>)[persona.region] ?? persona.region;

  const identityLine = [
    persona.location,
    `Age ${persona.age}`,
    regionLabel,
  ]
    .filter(Boolean)
    .join(" · ");

  // Get the averaged scores array
  const radarScores =
    averaged_axis_scores.length === 12
      ? averaged_axis_scores
      : axisScoresToArray(
          data.administrations[0]?.axis_scores ?? {}
        );

  // Budget from first administration
  const budget = data.administrations[0]?.raw_responses.budget ?? {};

  return (
    <figure
      aria-labelledby={headingId}
      style={{
        margin: 0,
        padding: "16px",
        border: "1px solid var(--border-secondary)",
        borderRadius: "6px",
        backgroundColor: "var(--surface-1)",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        position: "relative",
      }}
    >
      {/* Unpin button */}
      <button
        onClick={onUnpin}
        aria-label={`Remove ${persona.name} from comparison`}
        title="Remove from comparison"
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-tertiary)",
          padding: "4px",
          lineHeight: 1,
          borderRadius: "3px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <X size={13} aria-hidden />
      </button>

      {/* Name + identity */}
      <div style={{ paddingRight: "24px" }}>
        <h3
          id={headingId}
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 500,
            fontSize: "16px",
            lineHeight: 1.3,
            color: "var(--text-primary)",
            margin: 0,
            marginBottom: "3px",
          }}
        >
          {persona.name}
        </h3>
        <div
          style={{
            fontSize: "12px",
            color: "var(--text-secondary)",
            lineHeight: 1.4,
          }}
        >
          {identityLine}
        </div>
        {n_models === 2 && (
          <div
            style={{
              fontSize: "10px",
              color: "var(--text-tertiary)",
              marginTop: "3px",
              fontStyle: "italic",
            }}
          >
            avg of 2 models
          </div>
        )}
      </div>

      {/* Cluster + archetype badges */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
        <ClusterBadge clusterId={cluster as ClusterId} href={null} />
        <ArchetypeBadgeStudy
          archetypeId={nearest_archetype.id}
          archetypeName={nearest_archetype.name}
          emergence={nearest_archetype.emergence}
          matchStrength={nearest_archetype.match_strength}
          clusterId={cluster as ClusterId}
        />
      </div>

      {/* Mini radar */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Radar scores={radarScores} size={160} />
      </div>

      {/* Axis score rows */}
      <div>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            color: "var(--text-tertiary)",
            marginBottom: "6px",
          }}
        >
          Axes
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {axes.map((axis, i) => {
            const score = radarScores[i] ?? 0;
            // Convert -1..1 to 0..100 for the bar
            const barPct = ((score + 1) / 2) * 100;
            return (
              <div key={axis.id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "2px",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      minWidth: 0,
                    }}
                  >
                    {axis.name}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-mono)",
                      flexShrink: 0,
                    }}
                  >
                    {score >= 0 ? "+" : ""}
                    {score.toFixed(2)}
                  </span>
                </div>
                <div
                  style={{
                    height: "3px",
                    backgroundColor: "var(--border-secondary)",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${barPct}%`,
                      height: "100%",
                      backgroundColor: "var(--stone-600)",
                      borderRadius: "2px",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Budget strip */}
      {Object.keys(budget).length > 0 && (
        <MiniBudgetStrip budget={budget} />
      )}

      {/* View full profile link */}
      <div style={{ marginTop: "auto", paddingTop: "4px" }}>
        <button
          onClick={onViewFull}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "12px",
            color: "var(--stone-600)",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontWeight: 500,
          }}
        >
          View full profile
          <ExternalLink size={11} aria-hidden />
        </button>
      </div>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Loading / error panel placeholder
// ---------------------------------------------------------------------------

function PanelSkeleton({ id }: { id: string }) {
  return (
    <div
      style={{
        padding: "16px",
        border: "1px solid var(--border-secondary)",
        borderRadius: "6px",
        backgroundColor: "var(--surface-1)",
        fontSize: "13px",
        color: "var(--text-tertiary)",
        minHeight: "200px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      Loading {id}…
    </div>
  );
}

function PanelError({ id }: { id: string }) {
  return (
    <div
      style={{
        padding: "16px",
        border: "1px solid var(--border-secondary)",
        borderRadius: "6px",
        backgroundColor: "var(--surface-1)",
        fontSize: "13px",
        color: "var(--text-tertiary)",
        minHeight: "100px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      Failed to load {id}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compare view root
// ---------------------------------------------------------------------------

export interface CompareViewProps {
  pinnedIds: string[];
  onClose: () => void;
  onUnpin: (id: string) => void;
}

export function CompareView({ pinnedIds, onClose, onUnpin }: CompareViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dataMap, setDataMap] = useState<
    Map<string, PersonaDetailResponse | "loading" | "error">
  >(new Map());

  const backdropRef = useRef<HTMLDivElement>(null);

  // Fetch all pinned personas
  useEffect(() => {
    setDataMap((prev) => {
      const next = new Map(prev);
      for (const id of pinnedIds) {
        if (!next.has(id)) next.set(id, "loading");
      }
      return next;
    });

    for (const id of pinnedIds) {
      fetch(`/api/study/persona/${id}`)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json() as Promise<PersonaDetailResponse>;
        })
        .then((data) => {
          setDataMap((prev) => new Map(prev).set(id, data));
        })
        .catch(() => {
          setDataMap((prev) => new Map(prev).set(id, "error"));
        });
    }
  // Re-fetch when pinned IDs list changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinnedIds.join(",")]);

  // Escape key closes
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === backdropRef.current) onClose();
    },
    [onClose]
  );

  // Open persona modal: close compare view first, then open persona
  function handleViewFull(id: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("compareView");
    next.set("persona", id);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const count = pinnedIds.length;

  // Grid column class via media queries
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "12px",
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 30,
        backgroundColor: "rgba(0,0,0,0.45)",
        overflowY: "auto",
        padding: "40px 16px 60px",
      }}
    >
      <div
        role="region"
        aria-label={`Compare view: ${count} personas`}
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          backgroundColor: "var(--surface-2)",
          borderRadius: "8px",
          border: "1px solid var(--border-primary)",
          overflow: "hidden",
        }}
      >
        {/* Header bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: "1px solid var(--border-secondary)",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text-tertiary)",
                fontWeight: 500,
              }}
            >
              Comparing
            </span>
            <span
              style={{
                marginLeft: "8px",
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--text-primary)",
              }}
            >
              {count} persona{count !== 1 ? "s" : ""}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close compare view"
            style={{
              background: "none",
              border: "1px solid var(--border-primary)",
              borderRadius: "3px",
              padding: "4px 8px",
              cursor: "pointer",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "13px",
            }}
          >
            <X size={14} aria-hidden />
            Close
          </button>
        </div>

        {/* Panel grid */}
        <div
          style={{ padding: "16px" }}
        >
          <div
            className="compare-grid"
            data-count={String(count)}
            style={gridStyle}
          >
            {pinnedIds.map((id) => {
              const entry = dataMap.get(id);
              const headingId = `compare-panel-heading-${id}`;
              const panelId = `compare-panel-${id}`;

              if (!entry || entry === "loading") {
                return <PanelSkeleton key={id} id={id} />;
              }
              if (entry === "error") {
                return <PanelError key={id} id={id} />;
              }

              return (
                <PersonaPanel
                  key={id}
                  data={entry}
                  panelId={panelId}
                  headingId={headingId}
                  onUnpin={() => onUnpin(id)}
                  onViewFull={() => handleViewFull(id)}
                />
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 640px) {
          .compare-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          .compare-grid[data-count="3"] {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .compare-grid[data-count="4"] {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
