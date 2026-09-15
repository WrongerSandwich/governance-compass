"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X, Users } from "lucide-react";
import { PairedAxisScale } from "@/components/PairedAxisScale";
import { Radar, DEFAULT_AXIS_LABELS } from "@/components/study/Radar";
import { ArchetypeBadgeStudy } from "@/components/study/ArchetypeBadgeStudy";
import { ClusterBadge } from "@/components/study/ClusterBadge";
import { axes } from "@/data/axes";
import {
  BUDGET_COLORS,
  BUDGET_LABELS,
  MINISTRY_ORDER,
} from "@/lib/study/budgetColors";
import { getQuestion } from "@/lib/study/questionLookup";
import { usePersonasContext } from "@/lib/study/PersonasContext";
import { personaNeighbors } from "@/lib/study/personaNavigation";
import { useEscapeKey } from "@/lib/study/useEscapeKey";
import {
  ECONOMIC_LABELS,
  EDUCATION_LABELS,
  GENDER_LABELS,
  GOVERNANCE_LABELS,
  URBAN_RURAL_LABELS,
  humanizeKey,
  labelFor,
} from "@/lib/study/labels";
import { REGION_LABELS } from "@/lib/study/types";
import type { PersonaDetailResponse, ClusterId } from "@/lib/study/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The five score-bar columns' shared sizing. `PairedAxisScale` renders only
 *  the scale and leaves the row to its caller, where the retired local
 *  `ScoreBar` carried this on its own root. One frozen object is safe to share
 *  across style props — React never mutates them. */
const TRACK_COL = { flex: 1, minWidth: "40px" } as const;

/** Extract axis number from the axis_scores key "1_economic_model" → 1 */
function axisKeyToNumber(key: string): number {
  return parseInt(key.split("_")[0], 10);
}

/** Build a numeric array from axis_scores record in order 1..12 */
function axisScoresToArray(
  scores: Record<string, number>
): number[] {
  const arr: number[] = new Array(12).fill(0);
  for (const [key, val] of Object.entries(scores)) {
    const n = axisKeyToNumber(key);
    if (n >= 1 && n <= 12) arr[n - 1] = val;
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Confidence indicator
// ---------------------------------------------------------------------------

function ConfidenceDot({
  level,
}: {
  level: "high" | "moderate" | "low";
}) {
  // Warning-family ramp — confidence is advisory, not cluster-affinity.
  // Previous version used cluster colors which collided semantically with
  // the ClusterBadge + axis-gradient palettes elsewhere on the page.
  const COLOR = {
    high: "var(--mark-primary)",
    moderate: "var(--warning-border)",
    low: "var(--warning)",
  } as const;

  const TITLE = {
    high: "High confidence: all three modalities aligned",
    moderate: "Moderate confidence: minor divergence between FC, SC, and Budget",
    low: "Low confidence: forced-choice, scaled, and budget responses diverged",
  } as const;

  return (
    <span
      title={TITLE[level]}
      aria-label={TITLE[level]}
      style={{
        display: "inline-block",
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        backgroundColor: COLOR[level],
        flexShrink: 0,
        cursor: "help",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Budget strip
// ---------------------------------------------------------------------------

function BudgetStrip({ budget }: { budget: Record<string, number> }) {
  const total = Object.values(budget).reduce((s, v) => s + (v ?? 0), 0) || 50;
  const entries = MINISTRY_ORDER.map((key) => ({
    key,
    name: BUDGET_LABELS[key] ?? humanizeKey(key),
    value: budget[key] ?? 0,
  }));

  return (
    <div>
      <div
        style={{
          display: "flex",
          height: "20px",
          borderRadius: "var(--radius)",
          overflow: "hidden",
          border: "1px solid var(--border-secondary)",
        }}
        role="img"
        aria-label={`Budget allocation: total ${total} points across ${entries.length} ministries`}
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
      {/* Labels. Inline flex-wrap on desktop; 2-column grid on mobile
          (≤640px) via CSS. Swatches hidden on mobile — the colored bar
          above already carries the color → ministry association. */}
      <div
        className="budget-labels"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 14px",
          marginTop: "6px",
        }}
      >
        {entries.map((e, i) => (
          <div
            key={e.key}
            className="mono-meta text-text-label"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span
              className="budget-swatch"
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "var(--radius)",
                backgroundColor: BUDGET_COLORS[i % BUDGET_COLORS.length],
                flexShrink: 0,
              }}
            />
            <span>
              {e.name}{" "}
              <span className="text-text-primary font-medium">
                {e.value ?? "—"}
              </span>
            </span>
          </div>
        ))}
        <div
          className="budget-total mono-meta text-text-label"
          style={{
            marginLeft: "auto",
          }}
        >
          Total: {total}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Zone 1 — Header
// ---------------------------------------------------------------------------

function ModalHeader({
  data,
  titleId,
  onClose,
  closeBtnRef,
}: {
  data: PersonaDetailResponse;
  titleId: string;
  onClose: () => void;
  closeBtnRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const { persona, nearest_archetype, cluster, n_models } = data;
  const regionLabel = REGION_LABELS[persona.region] ?? persona.region;
  // Identity line: full form on desktop, region-trimmed on mobile (cluster
  // badge already surfaces the region, so dropping it here saves vertical
  // space in the sticky header without losing information).
  const identityFull = [
    `Age ${persona.age}`,
    persona.occupation,
    persona.location,
    regionLabel,
  ]
    .filter(Boolean)
    .join(" · ");
  const identityShort = [
    `Age ${persona.age}`,
    persona.occupation,
    persona.location,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      style={{
        padding: "20px 24px 16px",
        borderBottom: "0.5px solid var(--border-secondary)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "16px",
      }}
    >
      {/* Left: name + identity */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <h2
          id={titleId}
          className="display-m text-text-primary"
          style={{
            margin: 0,
            marginBottom: "4px",
          }}
        >
          {persona.name}
        </h2>
        <p
          className="body-s text-text-secondary"
          style={{
            margin: 0,
          }}
        >
          <span className="identity-full">{identityFull}</span>
          <span className="identity-short">{identityShort}</span>
        </p>

        {/* Badges row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginTop: "10px",
          }}
        >
          <ArchetypeBadgeStudy
            archetypeId={nearest_archetype.id}
            archetypeName={nearest_archetype.name}
            emergence={nearest_archetype.emergence}
            matchStrength={nearest_archetype.match_strength}
            clusterId={cluster as ClusterId}
          />
          <ClusterBadge clusterId={cluster as ClusterId} />
          {n_models === 2 && (
            <a
              href="#modal-raw-responses"
              className="mono-meta"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 7px",
                borderRadius: "var(--radius)",
                border: "0.5px solid var(--model-claude)",
                backgroundColor:
                  "color-mix(in srgb, var(--model-claude) 8%, transparent)",
                color: "var(--model-claude)",
                textDecoration: "none",
              }}
            >
              <Users size={10} aria-hidden />
              Both models
            </a>
          )}
        </div>
      </div>

      {/* Close button */}
      <button
        ref={closeBtnRef}
        className="focus-ring text-text-label"
        onClick={onClose}
        aria-label="Close persona modal"
        style={{
          background: "none",
          border: "1px solid var(--border-primary)",
          borderRadius: "var(--radius)",
          padding: "4px 6px",
          cursor: "pointer",
          lineHeight: 1,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
        }}
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Zone 2 — Biographical block
// ---------------------------------------------------------------------------

/* The type layer of the block's repeated elements. It cannot live in the style
   constant below: the delta's roles are Tailwind `@utility` rules and there is
   no spelling of one inside a `style` prop.

   Section headers are serif medium, sentence case, text-primary — clearly
   differentiated from the mono uppercase field labels underneath. The delta's
   serif scale has no 13px step, so a small serif-500 heading maps onto
   `display-s`, the same move `model-agreement/CaseStudy.tsx`'s section heading
   made from 14px. (`CompareView`'s persona name landed on the same role, but
   from 16px — a different row of the mapping.) */
const sectionHeaderClass = "display-s text-text-primary";
const fieldLabelClass = "label text-text-label font-medium";
const fieldValueClass = "body-s text-text-secondary";

const sectionHeaderStyle: React.CSSProperties = {
  marginBottom: "8px",
  paddingBottom: "4px",
  borderBottom: "0.5px solid var(--border-secondary)",
};

function BiographicalBlock({ data }: { data: PersonaDetailResponse }) {
  const { persona } = data;

  const detailFields = (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Situation */}
      <div>
        <div className={sectionHeaderClass} style={sectionHeaderStyle}>
          Situation
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {[
              ["Setting", labelFor(URBAN_RURAL_LABELS, persona.urban_rural)],
              [
                "Economic position",
                labelFor(ECONOMIC_LABELS, persona.economic_position),
              ],
              ["Economic detail", persona.economic_detail || "—"],
              ["Family", persona.family || "—"],
              ["Religion", persona.religious_tradition || "—"],
            ].map(([label, value]) => (
              <tr key={label}>
                <td
                  className={fieldLabelClass}
                  style={{
                    paddingBottom: "3px",
                    paddingRight: "8px",
                    verticalAlign: "top",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </td>
                <td
                  className={fieldValueClass}
                  style={{
                    paddingBottom: "3px",
                  }}
                >
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Life context */}
      <div>
        <div className={sectionHeaderClass} style={sectionHeaderStyle}>
          Life context
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {[
              ["Education", labelFor(EDUCATION_LABELS, persona.education)],
              ["Occupation", persona.occupation || "—"],
              ["Gender", labelFor(GENDER_LABELS, persona.gender)],
            ].map(([label, value]) => (
              <tr key={label}>
                <td
                  className={fieldLabelClass}
                  style={{
                    paddingBottom: "3px",
                    paddingRight: "8px",
                    verticalAlign: "top",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </td>
                <td
                  className={fieldValueClass}
                  style={{
                    paddingBottom: "3px",
                  }}
                >
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Governance experience */}
      <div>
        <div className={sectionHeaderClass} style={sectionHeaderStyle}>
          Governance experience
        </div>
        <div
          className="body-s text-text-secondary"
          style={{ marginBottom: "3px" }}
        >
          <strong className="text-text-primary font-medium">
            {labelFor(GOVERNANCE_LABELS, persona.governance_experience)}
          </strong>
        </div>
        {persona.governance_detail && (
          <div className="body-s text-text-secondary">
            {persona.governance_detail}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      style={{
        padding: "20px 24px",
        borderBottom: "0.5px solid var(--border-secondary)",
      }}
    >
      <div className="bio-layout">
        {/* Narrative — 60% on desktop */}
        <div className="bio-narrative">
          {persona.life_narrative && (
            <div
              className="body-s text-text-primary"
              style={{
                marginBottom: "12px",
              }}
            >
              {persona.life_narrative}
            </div>
          )}
          {persona.key_tensions && (
            <div
              className="body-s text-text-secondary"
              style={{
                borderLeft: "2px solid var(--border-primary)",
                paddingLeft: "12px",
              }}
            >
              {persona.key_tensions}
            </div>
          )}
        </div>

        {/* Details — 40% on desktop, collapsible on mobile */}
        <div className="bio-details-desktop">{detailFields}</div>
        <details className="bio-details-mobile">
          <summary
            className="body-s text-mark-primary font-medium"
            style={{
              cursor: "pointer",
              marginTop: "12px",
              userSelect: "none",
            }}
          >
            Show details
          </summary>
          <div style={{ marginTop: "12px" }}>{detailFields}</div>
        </details>
      </div>

      <style>{`
        .bio-layout {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .bio-details-desktop { display: none; }
        .bio-details-mobile  { display: block; }

        @media (min-width: 640px) {
          .bio-layout {
            flex-direction: row;
            gap: 24px;
          }
          .bio-narrative {
            flex: 0 0 60%;
          }
          .bio-details-desktop {
            display: block;
            flex: 0 0 40%;
          }
          .bio-details-mobile {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Zone 3 — Scored profile
// ---------------------------------------------------------------------------

// Shared constants for scored profile rendering
const AXIS_KEYS = [
  "1_economic_model",
  "2_environmental_policy",
  "3_governance_structure",
  "4_decision_authority",
  "5_rights_balance",
  "6_legitimacy_basis",
  "7_social_change",
  "8_cultural_diversity",
  "9_human_nature",
  "10_international_engagement",
  "11_military_policy",
  "12_technology_governance",
] as const;

type AxisKey = (typeof AXIS_KEYS)[number];

// Severity escalates within the warning family (mild → moderate → strong).
// Previous version mixed stone-600 and cluster-4 into severity, which read
// as "moderate tension is the primary brand state" — not what was intended.
const SEVERITY_COLORS: Record<string, string> = {
  mild: "var(--warning-border)",
  moderate: "var(--warning)",
  strong: "var(--warning-text)",
};

/**
 * Shown when a tension arrives without a generated narrative — e.g. a response
 * cached by a deploy that predates server-side tension descriptions. Expanding
 * a badge must always produce visible text, never a silent no-op.
 */
const NO_TENSION_DESCRIPTION = "No description available for this tension.";

/** Tension badge button for a single tension entry */
function TensionBadge({
  tension,
  axisNum,
  isExpanded,
  onToggle,
  modelLabel,
}: {
  tension: { axis: number; severity: string; magnitude?: number; description?: string };
  axisNum: number;
  isExpanded: boolean;
  onToggle: () => void;
  modelLabel?: string;
}) {
  const label = modelLabel
    ? `${modelLabel}: ${tension.severity} tension on axis ${axisNum}`
    : `${tension.severity} tension on axis ${axisNum}`;
  // Mobile: abbreviate to a 3-char form so every badge has the same visual
  // width (Mld/Mod/Str), preventing differential bar-width compression
  // across axes. Color (warning-family ramp) still carries severity.
  const abbrev: Record<string, string> = {
    mild: "Mld",
    moderate: "Mod",
    strong: "Str",
  };
  return (
    <button
      className="focus-ring tension-badge label-tight"
      onClick={onToggle}
      aria-expanded={isExpanded}
      aria-label={`${label} — click to ${isExpanded ? "collapse" : "expand"}`}
      style={{
        background: "none",
        border: `0.5px solid ${SEVERITY_COLORS[tension.severity] ?? "var(--warning)"}`,
        borderRadius: "var(--radius)",
        padding: "0 4px",
        cursor: "pointer",
        // Severity is computed, so the colour stays inline; `label-tight`
        // declares none of its own.
        color: SEVERITY_COLORS[tension.severity] ?? "var(--warning)",
        flexShrink: 0,
      }}
    >
      {modelLabel ? `${modelLabel[0]}: ` : ""}
      <span className="tension-full">{tension.severity}</span>
      <span className="tension-abbr" aria-hidden="true">
        {abbrev[tension.severity] ?? tension.severity}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Single-model scored profile (original code path — preserved)
// ---------------------------------------------------------------------------

function SingleModelScoredProfile({
  data,
}: {
  data: PersonaDetailResponse;
}) {
  const [expandedTensions, setExpandedTensions] = useState<Set<number>>(
    new Set()
  );

  const admin =
    data.administrations.find((a) => a.model === "claude") ??
    data.administrations[0];

  if (!admin) return null;

  const scoreArray = axisScoresToArray(admin.axis_scores);
  const tensionMap = new Map(admin.tensions.map((t) => [t.axis, t]));

  const toggleTension = (axisNum: number) => {
    setExpandedTensions((prev) => {
      const next = new Set(prev);
      if (next.has(axisNum)) next.delete(axisNum);
      else next.add(axisNum);
      return next;
    });
  };

  return (
    <>
      {/* Radar + axis rows */}
      <div className="scored-profile-layout">
        {/* Radar chart */}
        <div
          className="scored-radar"
          role="img"
          aria-label={`Radar chart showing ${data.persona.name}'s governance profile across 12 axes`}
        >
          <Radar
            scores={scoreArray}
            axisLabels={DEFAULT_AXIS_LABELS}
            size={300}
            colorVar="--mark-primary"
          />
        </div>

        {/* Axis score rows */}
        <div className="scored-axis-rows" style={{ flex: 1, minWidth: 0 }}>
          {AXIS_KEYS.map((key, i) => {
            const axisNum = i + 1;
            const axisData = axes[i];
            const score = admin.axis_scores[key] ?? 0;
            const confidence = admin.confidence[key] as
              | "high"
              | "moderate"
              | "low"
              | undefined;
            const tension = tensionMap.get(axisNum);
            const isExpanded = expandedTensions.has(axisNum);
            const isNeg = score < 0;

            return (
              <div key={key} style={{ marginBottom: "6px" }}>
                <div
                  className="axis-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "3px 0",
                  }}
                >
                  <span
                    className="mono-meta text-text-label"
                    style={{ minWidth: "18px" }}
                  >
                    {axisNum}
                  </span>

                  <span
                    className="axis-name body-xs text-text-secondary"
                    style={{ flex: "0 0 120px" }}
                  >
                    {axisData?.name ?? key}
                  </span>

                  <div style={TRACK_COL}>
                    <PairedAxisScale
                      axisId={axisNum}
                      poleALabel={axisData?.poleALabel ?? ""}
                      poleBLabel={axisData?.poleBLabel ?? ""}
                      scoreA={score}
                      axisName={axisData?.name ?? key}
                      // Measured across 320-1600px: see the prop's own comment.
                      endpoints="none"
                      markVar={
                        isNeg
                          ? "var(--axis-gradient-negative-strong)"
                          : "var(--axis-gradient-positive-strong)"
                      }
                    />
                  </div>

                  <span
                    className="mono-meta"
                    style={{
                      // Computed from the sign, so it stays inline.
                      color:
                        score < -0.1
                          ? "var(--axis-gradient-negative-strong)"
                          : score > 0.1
                          ? "var(--axis-gradient-positive-strong)"
                          : "var(--text-label)",
                      minWidth: "38px",
                      textAlign: "right",
                    }}
                  >
                    {score >= 0 ? "+" : ""}
                    {score.toFixed(2)}
                  </span>

                  {confidence && <ConfidenceDot level={confidence} />}

                  {tension && (
                    <TensionBadge
                      tension={tension}
                      axisNum={axisNum}
                      isExpanded={isExpanded}
                      onToggle={() => toggleTension(axisNum)}
                    />
                  )}
                </div>

                {isExpanded && tension && (
                  <div
                    className="body-xs"
                    style={{
                      marginLeft: "24px",
                      marginTop: "2px",
                      marginBottom: "4px",
                      color: tension.description
                        ? "var(--text-secondary)"
                        : "var(--text-label)",
                      fontStyle: tension.description ? "normal" : "italic",
                      padding: "6px 10px",
                      backgroundColor: "var(--surface-2)",
                      borderRadius: "var(--radius)",
                      borderLeft: `2px solid ${SEVERITY_COLORS[tension.severity] ?? "var(--warning)"}`,
                    }}
                  >
                    {tension.description || NO_TENSION_DESCRIPTION}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Budget allocation */}
      {admin.raw_responses.budget &&
        Object.keys(admin.raw_responses.budget).length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <div
              className="label text-text-label font-medium"
              style={{ marginBottom: "8px" }}
            >
              Budget allocation
            </div>
            <BudgetStrip budget={admin.raw_responses.budget} />
          </div>
        )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Dual-model scored profile (Phase 4b-2 — shared personas)
// ---------------------------------------------------------------------------

function DualModelScoredProfile({
  data,
}: {
  data: PersonaDetailResponse;
}) {
  // Track expanded tension state per model+axis: key = "claude-3" or "gemini-3"
  const [expandedTensions, setExpandedTensions] = useState<Set<string>>(
    new Set()
  );

  const claudeAdmin = data.administrations.find((a) => a.model === "claude");
  const geminiAdmin = data.administrations.find((a) => a.model === "gemini");

  // Graceful fallback — shouldn't happen for shared personas, but be safe
  if (!claudeAdmin && !geminiAdmin) return null;

  const claudeScores = claudeAdmin
    ? axisScoresToArray(claudeAdmin.axis_scores)
    : new Array(12).fill(0);
  const geminiScores = geminiAdmin
    ? axisScoresToArray(geminiAdmin.axis_scores)
    : new Array(12).fill(0);

  const claudeTensionMap = new Map(
    (claudeAdmin?.tensions ?? []).map((t) => [t.axis, t])
  );
  const geminiTensionMap = new Map(
    (geminiAdmin?.tensions ?? []).map((t) => [t.axis, t])
  );

  const toggleTension = (model: string, axisNum: number) => {
    const key = `${model}-${axisNum}`;
    setExpandedTensions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  /** Delta magnitude → gradient token */
  function deltaColor(delta: number): string {
    const abs = Math.abs(delta);
    if (abs >= 0.6) return "var(--axis-gradient-positive-strong)";
    if (abs >= 0.3) return "var(--axis-gradient-positive-mild)";
    return "var(--text-label)";
  }

  return (
    <>
      {/* Radar + axis rows */}
      <div className="scored-profile-layout">
        {/* Overlaid radar */}
        <div className="scored-radar" style={{ flexShrink: 0 }}>
          {/* Single SVG with both polygons overlaid via Radar's overlayScores prop */}
          <div
            role="img"
            aria-label={`Overlaid radar chart: Claude and Gemini scored profiles for ${data.persona.name}`}
          >
            <Radar
              scores={claudeScores}
              overlayScores={geminiScores}
              axisLabels={DEFAULT_AXIS_LABELS}
              size={300}
              colorVar="--model-claude"
              overlayColorVar="--model-gemini"
            />
          </div>

          {/* Model color legend */}
          <div
            style={{
              display: "flex",
              gap: "14px",
              justifyContent: "center",
              marginTop: "8px",
            }}
            aria-label="Radar chart legend"
          >
            <div
              className="body-xs text-text-secondary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "20px",
                  height: "2px",
                  backgroundColor: "var(--model-claude)",
                  borderRadius: "var(--radius)",
                  opacity: 0.85,
                }}
                aria-hidden
              />
              <span className="label text-text-secondary">Claude</span>
            </div>
            <div
              className="body-xs text-text-secondary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "20px",
                  height: "2px",
                  backgroundColor: "var(--model-gemini)",
                  borderRadius: "var(--radius)",
                  opacity: 0.85,
                }}
                aria-hidden
              />
              <span className="label text-text-secondary">Gemini</span>
            </div>
          </div>
        </div>

        {/* Dual-column axis scores table */}
        <div className="scored-axis-rows" style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div
            className="dual-axis-header"
            style={{
              display: "flex",
              gap: "6px",
              padding: "0 0 6px 0",
              borderBottom: "0.5px solid var(--border-secondary)",
              marginBottom: "6px",
            }}
          >
            <span
              className="mono-meta text-text-label"
              style={{ minWidth: "18px" }}
              aria-hidden
            />
            <span
              className="label text-text-label"
              style={{ flex: "0 0 100px" }}
            >
              Axis
            </span>
            <span
              className="dual-axis-col-header label"
              style={{
                // The model colour IS the column key; `label` declares none.
                color: "var(--model-claude)",
                flex: 1,
                minWidth: 0,
                textAlign: "center",
              }}
            >
              Claude
            </span>
            <span
              className="dual-axis-col-header label"
              style={{
                color: "var(--model-gemini)",
                flex: 1,
                minWidth: 0,
                textAlign: "center",
              }}
            >
              Gemini
            </span>
            <span
              className="dual-axis-col-header label text-text-label"
              style={{ flex: "0 0 30px", textAlign: "right" }}
            >
              Δ
            </span>
          </div>

          {AXIS_KEYS.map((key: AxisKey, i) => {
            const axisNum = i + 1;
            const axisData = axes[i];
            const cScore = claudeAdmin?.axis_scores[key] ?? 0;
            const gScore = geminiAdmin?.axis_scores[key] ?? 0;
            const delta = gScore - cScore;
            const cConf = claudeAdmin?.confidence[key] as
              | "high"
              | "moderate"
              | "low"
              | undefined;
            const gConf = geminiAdmin?.confidence[key] as
              | "high"
              | "moderate"
              | "low"
              | undefined;
            const cTension = claudeTensionMap.get(axisNum);
            const gTension = geminiTensionMap.get(axisNum);
            const cExpanded = expandedTensions.has(`claude-${axisNum}`);
            const gExpanded = expandedTensions.has(`gemini-${axisNum}`);

            return (
              <div key={key} style={{ marginBottom: "6px" }}>
                {/* Desktop/tablet: side-by-side row */}
                <div
                  className="dual-axis-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "3px 0",
                  }}
                >
                  {/* Axis number */}
                  <span
                    className="mono-meta text-text-label"
                    style={{ minWidth: "18px" }}
                  >
                    {axisNum}
                  </span>

                  {/* Axis name */}
                  <span
                    className="body-xs text-text-secondary"
                    style={{ flex: "0 0 100px" }}
                  >
                    {axisData?.name ?? key}
                  </span>

                  {/* Claude column: bar + value + confidence + tension */}
                  <div
                    className="dual-axis-model-col"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <div style={TRACK_COL}>
                      <PairedAxisScale
                        axisId={axisNum}
                        poleALabel={axisData?.poleALabel ?? ""}
                        poleBLabel={axisData?.poleBLabel ?? ""}
                        scoreA={cScore}
                        // The qualifier keeps the two tracks in one row from
                        // announcing the same sentence twice.
                        axisName={`${axisData?.name ?? key}, Claude`}
                        // ~121px of column: see the prop's own comment.
                        endpoints="none"
                        markVar="var(--model-claude)"
                      />
                    </div>
                    <span
                      className="mono-meta"
                      style={{
                        color: "var(--model-claude)",
                        minWidth: "36px",
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {cScore >= 0 ? "+" : ""}
                      {cScore.toFixed(2)}
                    </span>
                    {cConf && <ConfidenceDot level={cConf} />}
                    {cTension && (
                      <TensionBadge
                        tension={cTension}
                        axisNum={axisNum}
                        isExpanded={cExpanded}
                        onToggle={() => toggleTension("claude", axisNum)}
                        modelLabel="C"
                      />
                    )}
                  </div>

                  {/* Gemini column: bar + value + confidence + tension */}
                  <div
                    className="dual-axis-model-col"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <div style={TRACK_COL}>
                      <PairedAxisScale
                        axisId={axisNum}
                        poleALabel={axisData?.poleALabel ?? ""}
                        poleBLabel={axisData?.poleBLabel ?? ""}
                        scoreA={gScore}
                        // The qualifier keeps the two tracks in one row from
                        // announcing the same sentence twice.
                        axisName={`${axisData?.name ?? key}, Gemini`}
                        // ~121px of column: see the prop's own comment.
                        endpoints="none"
                        markVar="var(--model-gemini)"
                      />
                    </div>
                    <span
                      className="mono-meta"
                      style={{
                        color: "var(--model-gemini)",
                        minWidth: "36px",
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {gScore >= 0 ? "+" : ""}
                      {gScore.toFixed(2)}
                    </span>
                    {gConf && <ConfidenceDot level={gConf} />}
                    {gTension && (
                      <TensionBadge
                        tension={gTension}
                        axisNum={axisNum}
                        isExpanded={gExpanded}
                        onToggle={() => toggleTension("gemini", axisNum)}
                        modelLabel="G"
                      />
                    )}
                  </div>

                  {/* Delta column */}
                  <span
                    className="mono-meta"
                    style={{
                      color: deltaColor(delta),
                      flex: "0 0 38px",
                      textAlign: "right",
                    }}
                    title={`Δ = Gemini − Claude = ${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`}
                  >
                    {delta >= 0 ? "+" : ""}
                    {delta.toFixed(2)}
                  </span>
                </div>

                {/* Mobile stacked version — hidden on desktop via CSS */}
                <div
                  className="dual-axis-row-mobile"
                  style={{
                    display: "none",
                    flexDirection: "column",
                    gap: "3px",
                    padding: "3px 0",
                  }}
                >
                  {/* Axis label row */}
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      alignItems: "baseline",
                    }}
                  >
                    <span
                      className="mono-meta text-text-label"
                      style={{ minWidth: "18px" }}
                    >
                      {axisNum}
                    </span>
                    <span className="body-xs text-text-secondary">
                      {axisData?.name ?? key}
                    </span>
                    {/* Δ shown inline on mobile */}
                    <span
                      className="mono-meta"
                      style={{ color: deltaColor(delta), marginLeft: "auto" }}
                    >
                      Δ{delta >= 0 ? "+" : ""}
                      {delta.toFixed(2)}
                    </span>
                  </div>

                  {/* Claude stacked row */}
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      alignItems: "center",
                      paddingLeft: "24px",
                    }}
                  >
                    <span
                      className="label"
                      style={{ color: "var(--model-claude)", minWidth: "10px" }}
                    >
                      C:
                    </span>
                    <div style={TRACK_COL}>
                      <PairedAxisScale
                        axisId={axisNum}
                        poleALabel={axisData?.poleALabel ?? ""}
                        poleBLabel={axisData?.poleBLabel ?? ""}
                        scoreA={cScore}
                        axisName={`${axisData?.name ?? key}, Claude`}
                        // ~121px of column: see the prop's own comment.
                        endpoints="none"
                        markVar="var(--model-claude)"
                      />
                    </div>
                    <span
                      className="mono-meta"
                      style={{
                        color: "var(--model-claude)",
                        minWidth: "36px",
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {cScore >= 0 ? "+" : ""}
                      {cScore.toFixed(2)}
                    </span>
                    {cConf && <ConfidenceDot level={cConf} />}
                    {cTension && (
                      <TensionBadge
                        tension={cTension}
                        axisNum={axisNum}
                        isExpanded={cExpanded}
                        onToggle={() => toggleTension("claude", axisNum)}
                        modelLabel="C"
                      />
                    )}
                  </div>

                  {/* Gemini stacked row */}
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      alignItems: "center",
                      paddingLeft: "24px",
                    }}
                  >
                    <span
                      className="label"
                      style={{ color: "var(--model-gemini)", minWidth: "10px" }}
                    >
                      G:
                    </span>
                    <div style={TRACK_COL}>
                      <PairedAxisScale
                        axisId={axisNum}
                        poleALabel={axisData?.poleALabel ?? ""}
                        poleBLabel={axisData?.poleBLabel ?? ""}
                        scoreA={gScore}
                        axisName={`${axisData?.name ?? key}, Gemini`}
                        // ~121px of column: see the prop's own comment.
                        endpoints="none"
                        markVar="var(--model-gemini)"
                      />
                    </div>
                    <span
                      className="mono-meta"
                      style={{
                        color: "var(--model-gemini)",
                        minWidth: "36px",
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {gScore >= 0 ? "+" : ""}
                      {gScore.toFixed(2)}
                    </span>
                    {gConf && <ConfidenceDot level={gConf} />}
                    {gTension && (
                      <TensionBadge
                        tension={gTension}
                        axisNum={axisNum}
                        isExpanded={gExpanded}
                        onToggle={() => toggleTension("gemini", axisNum)}
                        modelLabel="G"
                      />
                    )}
                  </div>
                </div>

                {/* Expanded tension details — Claude */}
                {cExpanded && cTension && (
                  <div
                    className="body-xs text-text-secondary"
                    style={{
                      marginLeft: "24px",
                      marginTop: "2px",
                      marginBottom: "2px",
                      padding: "5px 8px",
                      backgroundColor: "var(--surface-2)",
                      borderRadius: "var(--radius)",
                      borderLeft: `2px solid var(--model-claude)`,
                    }}
                  >
                    <span
                      className="label"
                      style={{ color: "var(--model-claude)", marginRight: "4px" }}
                    >
                      Claude:
                    </span>
                    {cTension.description || NO_TENSION_DESCRIPTION}
                  </div>
                )}

                {/* Expanded tension details — Gemini */}
                {gExpanded && gTension && (
                  <div
                    className="body-xs text-text-secondary"
                    style={{
                      marginLeft: "24px",
                      marginTop: "2px",
                      marginBottom: "2px",
                      padding: "5px 8px",
                      backgroundColor: "var(--surface-2)",
                      borderRadius: "var(--radius)",
                      borderLeft: `2px solid var(--model-gemini)`,
                    }}
                  >
                    <span
                      className="label"
                      style={{ color: "var(--model-gemini)", marginRight: "4px" }}
                    >
                      Gemini:
                    </span>
                    {gTension.description || NO_TENSION_DESCRIPTION}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two stacked budget strips */}
      <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {claudeAdmin?.raw_responses.budget &&
          Object.keys(claudeAdmin.raw_responses.budget).length > 0 && (
            <div>
              <div
                className="label font-medium"
                style={{ color: "var(--model-claude)", marginBottom: "6px" }}
              >
                Claude — budget allocation
              </div>
              <BudgetStrip budget={claudeAdmin.raw_responses.budget} />
            </div>
          )}
        {geminiAdmin?.raw_responses.budget &&
          Object.keys(geminiAdmin.raw_responses.budget).length > 0 && (
            <div>
              <div
                className="label font-medium"
                style={{ color: "var(--model-gemini)", marginBottom: "6px" }}
              >
                Gemini — budget allocation
              </div>
              <BudgetStrip budget={geminiAdmin.raw_responses.budget} />
            </div>
          )}
      </div>

      <style>{`
        @media (max-width: 639px) {
          .dual-axis-row        { display: none !important; }
          .dual-axis-row-mobile { display: flex !important; }
          .dual-axis-header     { display: none !important; }
        }
      `}</style>
    </>
  );
}

// ---------------------------------------------------------------------------
// ScoredProfile — branches between single and dual model
// ---------------------------------------------------------------------------

function ScoredProfile({ data }: { data: PersonaDetailResponse }) {
  const isDual = data.administrations.length === 2;

  return (
    <div
      style={{
        padding: "20px 24px",
        borderBottom: "0.5px solid var(--border-secondary)",
      }}
    >
      <div
        className="label text-text-label font-medium"
        style={{ marginBottom: "16px" }}
      >
        Scored profile
      </div>

      {isDual ? (
        <DualModelScoredProfile data={data} />
      ) : (
        <SingleModelScoredProfile data={data} />
      )}

      <style>{`
        .scored-profile-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .scored-radar {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        /* Mobile: constrain the radar width and scale its SVG down so
           axis labels have room before the viewport edge. */
        @media (max-width: 639px) {
          .scored-radar {
            max-width: clamp(240px, 80vw, 300px);
            margin: 0 auto;
          }
          .scored-radar svg {
            width: 100% !important;
            height: auto !important;
          }
          /* Axis rows: wrap so the score bar gets the full width of the
             second line when the axis-name column would otherwise crowd it. */
          .axis-row {
            flex-wrap: wrap;
          }
          .axis-row > .axis-name {
            flex: 1 1 100% !important;
          }
        }
        @media (min-width: 640px) {
          .scored-profile-layout {
            flex-direction: row;
            align-items: flex-start;
            gap: 24px;
          }
          .scored-radar {
            flex: 0 0 300px;
          }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Zone 4 — Raw responses inner content (shared between single and dual mode)
// ---------------------------------------------------------------------------

function ResponsesContent({
  admin,
}: {
  admin: PersonaDetailResponse["administrations"][number];
}) {
  const { fc, sc } = admin.raw_responses;

  const CHOICE_LABELS_LIKERT: Record<number, string> = {
    1: "Strongly agree (pole A)",
    2: "Agree (pole A)",
    3: "Neutral",
    4: "Agree (pole B)",
    5: "Strongly agree (pole B)",
  };

  return (
    <>
      {axes.map((axisData) => {
        const axisNum = axisData.id;
        const fcForAxis = fc.filter((r) => {
          const q = getQuestion(r.item);
          return q?.axis === axisNum;
        });
        const scForAxis = sc.filter((r) => {
          const q = getQuestion(r.item);
          return q?.axis === axisNum;
        });

        if (fcForAxis.length === 0 && scForAxis.length === 0) return null;

        // Budget signal for this axis from modality scores
        const axisKey = Object.keys(admin.modality_scores).find((k) =>
          k.startsWith(`${axisNum}_`)
        );
        const budgetScore = axisKey
          ? admin.modality_scores[axisKey]?.budget ?? null
          : null;

        return (
          <div key={axisNum} style={{ marginBottom: "20px" }}>
            <div
              className="label text-text-label font-medium"
              style={{
                marginBottom: "8px",
                paddingBottom: "4px",
                borderBottom: "1px solid var(--border-tertiary)",
              }}
            >
              Axis {axisNum} — {axisData.name}
            </div>

            {fcForAxis.map((r) => {
              const q = getQuestion(r.item);
              const poleLabel =
                r.choice === "A" ? axisData.poleALabel : axisData.poleBLabel;
              return (
                <div
                  key={r.item}
                  className="body-xs"
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    className="mono-meta text-text-label"
                    style={{ flexShrink: 0 }}
                  >
                    {r.item}
                  </span>
                  <span className="text-text-secondary" style={{ flex: 1 }}>
                    {q ? q.text : r.item}
                  </span>
                  <span
                    className="text-text-primary font-medium"
                    style={{ flexShrink: 0 }}
                  >
                    {r.choice}{" "}
                    <span className="body-xs text-text-label font-normal">
                      (toward {poleLabel})
                    </span>
                  </span>
                </div>
              );
            })}

            {scForAxis.map((r) => {
              const q = getQuestion(r.item);
              const choiceLabel =
                CHOICE_LABELS_LIKERT[r.choice as number] ??
                String(r.choice);
              return (
                <div
                  key={r.item}
                  className="body-xs"
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    className="mono-meta text-text-label"
                    style={{ flexShrink: 0 }}
                  >
                    {r.item}
                  </span>
                  <span className="text-text-secondary" style={{ flex: 1 }}>
                    {q ? q.text : r.item}
                  </span>
                  <span
                    className="text-text-primary font-medium"
                    style={{ flexShrink: 0 }}
                  >
                    {r.choice}{" "}
                    <span className="body-xs text-text-label font-normal">
                      ({choiceLabel})
                    </span>
                  </span>
                </div>
              );
            })}

            {budgetScore !== null && (
              <div
                className="body-xs text-text-secondary"
                style={{ fontStyle: "italic", marginTop: "2px" }}
              >
                Budget signal:{" "}
                <span className="text-text-primary">
                  {budgetScore >= 0 ? "+" : ""}
                  {budgetScore.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Zone 4 — Raw responses (collapsible)
// ---------------------------------------------------------------------------

function RawResponses({ data }: { data: PersonaDetailResponse }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);

  // For dual-model personas, manage active tab via URL param `model`
  const isDual = data.administrations.length === 2;

  // Read active model from URL; default to "claude"
  const modelParam = searchParams.get("model");
  const activeModel: "claude" | "gemini" =
    modelParam === "gemini" ? "gemini" : "claude";

  // Resolve active administration
  const admin = isDual
    ? (data.administrations.find((a) => a.model === activeModel) ??
        data.administrations[0])
    : (data.administrations.find((a) => a.model === "claude") ??
        data.administrations[0]);

  if (!admin) return null;

  // Toggle active model tab and update URL.
  const handleTabSwitch = (model: "claude" | "gemini") => {
    if (model === activeModel) return;

    const params = new URLSearchParams(searchParams.toString());
    if (model === "claude") {
      params.delete("model"); // default; keep URL clean
    } else {
      params.set("model", model);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Keyboard navigation for tablist
  const handleTabKeyDown = (
    e: React.KeyboardEvent,
    model: "claude" | "gemini"
  ) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      handleTabSwitch(model === "claude" ? "gemini" : "claude");
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTabSwitch(model);
    }
  };

  const claudeTabId = "raw-responses-tab-claude";
  const geminiTabId = "raw-responses-tab-gemini";
  const panelId = "raw-responses-panel";

  return (
    <div
      id="modal-raw-responses"
      style={{
        borderBottom: "0.5px solid var(--border-secondary)",
      }}
    >
      {/* Toggle button */}
      <button
        className="focus-ring body-s text-text-secondary font-medium"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 24px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span>View responses</span>
        <span
          style={{
            display: "inline-block",
            transition: "transform 150ms ease",
            transform: open ? "rotate(180deg)" : "none",
          }}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open && (
        <div style={{ padding: "0 24px 20px" }}>
          {/* Dual-model tab toggle */}
          {isDual && (
            <div
              role="tablist"
              aria-label="Select model responses"
              style={{
                display: "flex",
                gap: "0",
                marginBottom: "16px",
                border: "1px solid var(--border-primary)",
                borderRadius: "var(--radius)",
                // No `overflow: hidden`: an outline is clipped by an ancestor's
                // overflow clip, and these tabs sit flush against this box's
                // edges, so the focus ring below would have been declared and
                // never painted. It was here to round the active tab's fill
                // into the corners, which at the 2px radius token is a
                // sub-pixel effect and not worth a keyboard user's indicator.
                width: "fit-content",
              }}
            >
              {(["claude", "gemini"] as const).map((model) => {
                const isActive = activeModel === model;
                const tabId = model === "claude" ? claudeTabId : geminiTabId;
                const modelColor =
                  model === "claude" ? "var(--model-claude)" : "var(--model-gemini)";
                return (
                  <button
                    key={model}
                    id={tabId}
                    className="focus-ring control"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={panelId}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => handleTabSwitch(model)}
                    onKeyDown={(e) => handleTabKeyDown(e, model)}
                    // `fontWeight` stays inline and stays computed: the 500/400
                    // split is the selected-tab cue, alongside the filled
                    // background. It is not redundant with `control`'s own 500
                    // — the inline value wins on BOTH tabs, so the role's weight
                    // is merely duplicated on the active one and deliberately
                    // overridden on the inactive one.
                    style={{
                      padding: "6px 18px",
                      background: isActive ? modelColor : "none",
                      border: "none",
                      cursor: "pointer",
                      color: isActive ? "var(--surface-1)" : "var(--text-secondary)",
                      fontWeight: isActive ? 500 : 400,
                      transition: "background 200ms ease, color 200ms ease",
                    }}
                  >
                    {model === "claude" ? "Claude" : "Gemini"}
                  </button>
                );
              })}
            </div>
          )}

          {/* Response content panel */}
          <div
            id={panelId}
            role={isDual ? "tabpanel" : undefined}
            aria-labelledby={
              isDual
                ? activeModel === "claude"
                  ? claudeTabId
                  : geminiTabId
                : undefined
            }
          >
            <ResponsesContent admin={admin} />
          </div>
        </div>
      )}

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          [role="tab"] {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Zone 5 — Footer (prev/next + share)
// ---------------------------------------------------------------------------

function ModalFooter({ id }: { id: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { filteredIds } = usePersonasContext();
  const [copied, setCopied] = useState(false);

  const {
    index: currentIndex,
    prev: prevId,
    next: nextId,
  } = personaNeighbors(filteredIds, id);
  const hasPrev = prevId !== null;
  const hasNext = nextId !== null;

  const navigateTo = useCallback(
    (newId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("persona", newId);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard not available
    }
  }, []);

  return (
    <div
      style={{
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderTop: "0.5px solid var(--border-secondary)",
      }}
    >
      {/* Share */}
      <button
        className="focus-ring body-s"
        onClick={handleShare}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: copied ? "var(--cluster-3)" : "var(--text-label)",
          padding: 0,
          transition: "color 150ms ease",
        }}
      >
        {copied ? "Copied" : "Share this persona"}
      </button>

      {/* Prev / Next — text-only, matches the Personas pagination pattern. */}
      {filteredIds.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "baseline",
          }}
        >
          <button
            className="focus-ring body-s"
            onClick={() => prevId && navigateTo(prevId)}
            disabled={!hasPrev}
            aria-label="Previous persona"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: hasPrev ? "pointer" : "default",
              color: hasPrev
                ? "var(--text-secondary)"
                : "var(--border-primary)",
            }}
          >
            ← Previous
          </button>
          {currentIndex >= 0 && (
            <span
              aria-hidden="true"
              className="mono-meta text-text-label"
            >
              {currentIndex + 1} / {filteredIds.length}
            </span>
          )}
          <button
            className="focus-ring body-s"
            onClick={() => nextId && navigateTo(nextId)}
            disabled={!hasNext}
            aria-label="Next persona"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: hasNext ? "pointer" : "default",
              color: hasNext
                ? "var(--text-secondary)"
                : "var(--border-primary)",
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main modal shell
// ---------------------------------------------------------------------------

export interface PersonaModalProps {
  id: string;
}

export function PersonaModal({ id }: PersonaModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<Element | null>(null);

  const [data, setData] = useState<PersonaDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Store triggering element for focus return on close
  useEffect(() => {
    triggerRef.current = document.activeElement;
  }, []);

  // Fetch persona data on mount. The modal is keyed on the persona id at its
  // call site, so a different persona mounts a fresh component already in the
  // loading state — no reset pass needed here.
  useEffect(() => {
    let cancelled = false;

    fetch(`/api/study/persona/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<PersonaDetailResponse>;
      })
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message ?? "Failed to load persona");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Focus management: move focus to loading-state close button on initial mount
  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  // Once data has loaded, shift focus to the loaded-state close button (in ModalHeader)
  useEffect(() => {
    if (data && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }
  }, [data]);

  // Close handler
  const handleClose = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("persona");
    params.delete("model");
    const qs = params.toString();
    router.push(pathname + (qs ? `?${qs}` : ""), { scroll: false });

    // Return focus to triggering element
    if (triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
    }
  }, [router, pathname, searchParams]);

  // Escape closes. Routed through the shared stack so the press is not also
  // delivered to the compare view or the map underneath this modal.
  useEscapeKey(handleClose);

  // Keyboard: focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab" && dialogRef.current) {
        // Trap focus within modal
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        role="presentation"
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "color-mix(in srgb, var(--stone-900) 40%, transparent)",
          zIndex: 1000,
          animation: "modal-fade-in 200ms ease forwards",
        }}
        aria-hidden
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1001,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0",
          pointerEvents: "none",
        }}
      >
        <div
          className="persona-modal-container"
          style={{
            width: "100%",
            maxWidth: "900px",
            maxHeight: "90vh",
            backgroundColor: "var(--surface-1)",
            border: "1px solid var(--border-secondary)",
            borderRadius: "var(--radius)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            pointerEvents: "all",
            animation: "modal-slide-in 200ms ease forwards",
          }}
          // Prevent backdrop click from closing when clicking inside the modal
          onClick={(e) => e.stopPropagation()}
        >
          {/* Loading state */}
          {loading && (
            <div
              className="body-s text-text-secondary"
              style={{
                padding: "60px 24px",
                textAlign: "center",
              }}
            >
              {/* Hidden close button so focus trap doesn't get stuck */}
              <button
                ref={closeBtnRef}
                className="focus-ring text-text-label"
                onClick={handleClose}
                aria-label="Close persona modal"
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "none",
                  border: "1px solid var(--border-primary)",
                  borderRadius: "var(--radius)",
                  padding: "4px 6px",
                  cursor: "pointer",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={16} aria-hidden />
              </button>
              Loading…
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div
              className="body-s text-text-secondary"
              style={{
                padding: "40px 24px",
                textAlign: "center",
              }}
            >
              <button
                ref={closeBtnRef}
                className="focus-ring text-text-label"
                onClick={handleClose}
                aria-label="Close persona modal"
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "none",
                  border: "1px solid var(--border-primary)",
                  borderRadius: "var(--radius)",
                  padding: "4px 6px",
                  cursor: "pointer",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={16} aria-hidden />
              </button>
              <div className="text-text-primary" style={{ marginBottom: "8px" }}>
                Could not load persona
              </div>
              {/* `role="alert"` before the colour change, not after it: the
                  string is about to carry the same advisory amber an ordinary
                  notice does, so the cue a sighted user had gets weaker at the
                  same moment (phase 5, D16). */}
              <div role="alert" className="body-xs text-warning-text">
                {error}
              </div>
            </div>
          )}

          {/* Loaded state */}
          {!loading && data && (
            <>
              {/* Sticky header (close btn inside) */}
              <div style={{ flexShrink: 0 }}>
                <ModalHeader
                  data={data}
                  titleId={titleId}
                  onClose={handleClose}
                  closeBtnRef={closeBtnRef}
                />
              </div>

              {/* Scrollable body */}
              <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                <BiographicalBlock data={data} />
                <ScoredProfile data={data} />
                <RawResponses data={data} />
                <ModalFooter id={id} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Animation keyframes + mobile modal-shell adaptations */}
      <style>{`
        @keyframes modal-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modal-slide-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes modal-fade-in  { from { opacity: 1; } to { opacity: 1; } }
          @keyframes modal-slide-in { from { opacity: 1; } to { opacity: 1; } }
        }
        /* Full-screen modal on mobile + responsive identity / budget labels. */
        .identity-short { display: none; }
        .tension-abbr { display: none; }
        @media (max-width: 640px) {
          .persona-modal-container {
            border-radius: var(--radius) !important;
            /* 100dvh adapts to iOS URL-bar toggle; 24px gap leaves
               breathing room at top and bottom so prev/next footer
               isn't cut off by the viewport edge. */
            max-height: calc(100vh - 24px) !important;
            max-height: calc(100dvh - 24px) !important;
          }
          .identity-full { display: none; }
          .identity-short { display: inline; }
          /* Tension badges: abbreviate text so every badge has equal
             visual width, preventing differential bar compression. */
          .tension-full { display: none; }
          .tension-abbr { display: inline; }
          .tension-badge {
            min-width: 44px;
            text-align: center;
          }
          /* Budget labels: 2-column grid, swatches hidden (bar above
             already carries color → ministry mapping). */
          .budget-labels {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 4px 12px !important;
          }
          .budget-labels .budget-swatch {
            display: none !important;
          }
          .budget-labels .budget-total {
            margin-left: 0 !important;
            grid-column: 1 / -1;
            padding-top: 4px;
            border-top: 0.5px solid var(--border-secondary);
          }
        }
      `}</style>
    </>
  );
}
