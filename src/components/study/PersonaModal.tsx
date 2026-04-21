"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Radar, DEFAULT_AXIS_LABELS } from "@/components/study/Radar";
import { ArchetypeBadgeStudy } from "@/components/study/ArchetypeBadgeStudy";
import { ClusterBadge } from "@/components/study/ClusterBadge";
import { axes } from "@/data/axes";
import { ministries } from "@/data/ministries";
import {
  getQuestion,
  getQuestionsForAxis,
} from "@/lib/study/questionLookup";
import { usePersonasContext } from "@/lib/study/PersonasContext";
import { REGION_LABELS } from "@/lib/study/types";
import type { PersonaDetailResponse, ClusterId } from "@/lib/study/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function humanizeKey(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatGender(gender: string): string {
  if (gender === "non_binary") return "Non-binary";
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}

function formatUrbanRural(val: string): string {
  if (val === "peri_urban") return "Peri-urban";
  return val.charAt(0).toUpperCase() + val.slice(1);
}

const ECONOMIC_LABELS: Record<string, string> = {
  affluent: "Affluent",
  upper_middle_class: "Upper middle class",
  middle_class: "Middle class",
  working_class: "Working class",
  struggling: "Struggling",
  impoverished: "Impoverished",
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

const SC_CHOICE_LABELS: Record<number, string> = {
  1: "Strongly pole A",
  2: "Moderate pole A",
  3: "Neutral",
  4: "Moderate pole B",
  5: "Strongly pole B",
};

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

/** Budget key (snake_case) → ministry name */
const BUDGET_KEY_TO_MINISTRY: Record<string, string> = {
  defense: "Defense",
  public_welfare: "Public Welfare",
  economy_growth: "Economy & Growth",
  education_research: "Education & Research",
  environment: "Environment",
  justice_civil_liberties: "Justice & Civil Liberties",
  foreign_affairs: "Foreign Affairs",
};

// ---------------------------------------------------------------------------
// Confidence indicator
// ---------------------------------------------------------------------------

function ConfidenceDot({
  level,
}: {
  level: "high" | "moderate" | "low";
}) {
  const COLOR = {
    high: "var(--cluster-3)", // sage — good
    moderate: "var(--warning)",
    low: "var(--cluster-4)", // clay-rust — concern
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
  const MINISTRY_ORDER = [
    "defense",
    "public_welfare",
    "economy_growth",
    "education_research",
    "environment",
    "justice_civil_liberties",
    "foreign_affairs",
  ];
  const entries = MINISTRY_ORDER.map((key) => ({
    key,
    name: BUDGET_KEY_TO_MINISTRY[key] ?? humanizeKey(key),
    value: budget[key] ?? 0,
  }));

  const COLORS = [
    "var(--cluster-5)",
    "var(--cluster-4)",
    "var(--cluster-0)",
    "var(--cluster-3)",
    "var(--cluster-1)",
    "var(--cluster-2)",
    "var(--stone-400)",
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          height: "20px",
          borderRadius: "3px",
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
                backgroundColor: COLORS[i % COLORS.length],
                flexShrink: 0,
              }}
            />
          );
        })}
      </div>
      {/* Labels */}
      <div
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
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              color: "var(--text-tertiary)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "1px",
                backgroundColor: COLORS[i % COLORS.length],
                flexShrink: 0,
              }}
            />
            <span>
              {e.name}{" "}
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                {e.value ?? "—"}
              </span>
            </span>
          </div>
        ))}
        <div
          style={{
            fontSize: "11px",
            color: "var(--text-tertiary)",
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
  const identityLine = [
    `Age ${persona.age}`,
    persona.occupation,
    persona.location,
    regionLabel,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      style={{
        padding: "20px 24px 16px",
        borderBottom: "1px solid var(--border-secondary)",
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
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 500,
            fontSize: "24px",
            lineHeight: 1.2,
            color: "var(--text-primary)",
            margin: 0,
            marginBottom: "4px",
          }}
        >
          {persona.name}
        </h2>
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {identityLine}
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
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                padding: "2px 7px",
                borderRadius: "3px",
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
        onClick={onClose}
        aria-label="Close persona modal"
        style={{
          background: "none",
          border: "1px solid var(--border-primary)",
          borderRadius: "3px",
          padding: "4px 6px",
          cursor: "pointer",
          color: "var(--text-tertiary)",
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

function BiographicalBlock({ data }: { data: PersonaDetailResponse }) {
  const { persona } = data;

  const detailFields = (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Situation */}
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
          Situation
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {[
              ["Setting", formatUrbanRural(persona.urban_rural)],
              [
                "Economic position",
                ECONOMIC_LABELS[persona.economic_position] ??
                  humanizeKey(persona.economic_position),
              ],
              ["Economic detail", persona.economic_detail || "—"],
              ["Family", persona.family || "—"],
              ["Religion", persona.religious_tradition || "—"],
            ].map(([label, value]) => (
              <tr key={label}>
                <td
                  style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--text-tertiary)",
                    paddingBottom: "3px",
                    paddingRight: "8px",
                    verticalAlign: "top",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </td>
                <td
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
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
          Life context
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {[
              ["Education", humanizeKey(persona.education)],
              ["Occupation", persona.occupation || "—"],
              ["Gender", formatGender(persona.gender)],
            ].map(([label, value]) => (
              <tr key={label}>
                <td
                  style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--text-tertiary)",
                    paddingBottom: "3px",
                    paddingRight: "8px",
                    verticalAlign: "top",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </td>
                <td
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
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
          Governance experience
        </div>
        <div
          style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "3px" }}
        >
          <strong style={{ fontWeight: 500, color: "var(--text-primary)" }}>
            {GOVERNANCE_LABELS[persona.governance_experience] ??
              humanizeKey(persona.governance_experience)}
          </strong>
        </div>
        {persona.governance_detail && (
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
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
        borderBottom: "1px solid var(--border-secondary)",
      }}
    >
      <div className="bio-layout">
        {/* Narrative — 60% on desktop */}
        <div className="bio-narrative">
          {persona.life_narrative && (
            <div
              style={{
                fontSize: "14px",
                lineHeight: 1.65,
                color: "var(--text-primary)",
                marginBottom: "12px",
              }}
            >
              {persona.life_narrative}
            </div>
          )}
          {persona.key_tensions && (
            <div
              style={{
                fontSize: "13px",
                lineHeight: 1.6,
                color: "var(--text-secondary)",
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
            style={{
              cursor: "pointer",
              fontSize: "13px",
              color: "var(--stone-600)",
              fontWeight: 500,
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

function ScoredProfile({ data }: { data: PersonaDetailResponse }) {
  const [expandedTensions, setExpandedTensions] = useState<Set<number>>(
    new Set()
  );

  // Single-model: use first administration (Claude if present, else Gemini)
  const admin = data.administrations.find((a) => a.model === "claude") ??
    data.administrations[0];

  if (!admin) return null;

  const scoreArray = axisScoresToArray(admin.axis_scores);

  // Build tension map keyed by axis number
  const tensionMap = new Map(
    admin.tensions.map((t) => [t.axis, t])
  );

  const toggleTension = (axisNum: number) => {
    setExpandedTensions((prev) => {
      const next = new Set(prev);
      if (next.has(axisNum)) next.delete(axisNum);
      else next.add(axisNum);
      return next;
    });
  };

  // Axis score keys in order
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

  const SEVERITY_COLORS: Record<string, string> = {
    mild: "var(--warning)",
    moderate: "var(--stone-600)",
    strong: "var(--cluster-4)",
  };

  return (
    <div
      style={{
        padding: "20px 24px",
        borderBottom: "1px solid var(--border-secondary)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: "var(--text-tertiary)",
          marginBottom: "16px",
        }}
      >
        Scored profile
      </div>

      {/* Phase 4b-2 will add dual-model overlay here for shared personas */}

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
            colorVar="--stone-600"
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

            // Bar: -1 to +1; 0 is center; negative = toward poleA
            const barPct = ((score + 1) / 2) * 100;
            const isNeg = score < 0;

            return (
              <div
                key={key}
                style={{ marginBottom: "6px" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "3px 0",
                  }}
                >
                  {/* Axis number */}
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--text-tertiary)",
                      fontFamily: "var(--font-mono)",
                      minWidth: "18px",
                    }}
                  >
                    {axisNum}
                  </span>

                  {/* Axis name */}
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      flex: "0 0 120px",
                      lineHeight: 1.3,
                    }}
                  >
                    {axisData?.name ?? key}
                  </span>

                  {/* Score bar */}
                  <div
                    style={{
                      flex: 1,
                      height: "6px",
                      backgroundColor: "var(--border-secondary)",
                      borderRadius: "3px",
                      position: "relative",
                      minWidth: "60px",
                    }}
                    role="presentation"
                  >
                    {/* Center marker */}
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: 0,
                        bottom: 0,
                        width: "1px",
                        backgroundColor: "var(--border-primary)",
                      }}
                      aria-hidden
                    />
                    {/* Score marker */}
                    <div
                      style={{
                        position: "absolute",
                        left: `${barPct}%`,
                        top: "-2px",
                        width: "10px",
                        height: "10px",
                        backgroundColor: isNeg
                          ? "var(--axis-gradient-negative-strong)"
                          : "var(--axis-gradient-positive-strong)",
                        borderRadius: "50%",
                        transform: "translateX(-50%)",
                        border: "1.5px solid var(--surface-1)",
                      }}
                      aria-hidden
                    />
                  </div>

                  {/* Score value */}
                  <span
                    style={{
                      fontSize: "11px",
                      fontFamily: "var(--font-mono)",
                      color:
                        score < -0.1
                          ? "var(--axis-gradient-negative-strong)"
                          : score > 0.1
                          ? "var(--axis-gradient-positive-strong)"
                          : "var(--text-tertiary)",
                      minWidth: "38px",
                      textAlign: "right",
                    }}
                  >
                    {score >= 0 ? "+" : ""}
                    {score.toFixed(2)}
                  </span>

                  {/* Confidence indicator */}
                  {confidence && <ConfidenceDot level={confidence} />}

                  {/* Tension badge */}
                  {tension && (
                    <button
                      onClick={() => toggleTension(axisNum)}
                      aria-expanded={isExpanded}
                      aria-label={`${tension.severity} tension on axis ${axisNum} — click to ${isExpanded ? "collapse" : "expand"}`}
                      style={{
                        background: "none",
                        border: `0.5px solid ${SEVERITY_COLORS[tension.severity] ?? "var(--warning)"}`,
                        borderRadius: "2px",
                        padding: "0 4px",
                        fontSize: "9px",
                        cursor: "pointer",
                        color:
                          SEVERITY_COLORS[tension.severity] ?? "var(--warning)",
                        lineHeight: 1.6,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        flexShrink: 0,
                      }}
                    >
                      {tension.severity}
                    </button>
                  )}
                </div>

                {/* Expanded tension description */}
                {isExpanded && tension?.description && (
                  <div
                    style={{
                      marginLeft: "24px",
                      marginTop: "2px",
                      marginBottom: "4px",
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                      padding: "6px 10px",
                      backgroundColor: "var(--surface-2)",
                      borderRadius: "3px",
                      borderLeft: `2px solid ${SEVERITY_COLORS[tension.severity] ?? "var(--warning)"}`,
                    }}
                  >
                    {tension.description}
                  </div>
                )}
                {isExpanded && !tension?.description && (
                  <div
                    style={{
                      marginLeft: "24px",
                      marginTop: "2px",
                      marginBottom: "4px",
                      fontSize: "12px",
                      color: "var(--text-tertiary)",
                      fontStyle: "italic",
                    }}
                  >
                    No description available for this tension.
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
              style={{
                fontSize: "11px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: "var(--text-tertiary)",
                marginBottom: "8px",
              }}
            >
              Budget allocation
            </div>
            <BudgetStrip budget={admin.raw_responses.budget} />
          </div>
        )}

      <style>{`
        .scored-profile-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .scored-radar {
          display: flex;
          justify-content: center;
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
// Zone 4 — Raw responses (collapsible)
// ---------------------------------------------------------------------------

function RawResponses({ data }: { data: PersonaDetailResponse }) {
  const [open, setOpen] = useState(false);

  // Single-model: use first administration (Claude if present, else Gemini)
  // Phase 4b-2 will add Claude/Gemini toggle here for dual-model personas
  const admin = data.administrations.find((a) => a.model === "claude") ??
    data.administrations[0];

  if (!admin) return null;

  const { fc, sc, budget } = admin.raw_responses;

  const CHOICE_LABELS_LIKERT: Record<number, string> = {
    1: "Strongly agree (pole A)",
    2: "Agree (pole A)",
    3: "Neutral",
    4: "Agree (pole B)",
    5: "Strongly agree (pole B)",
  };

  return (
    <div
      id="modal-raw-responses"
      style={{
        borderBottom: "1px solid var(--border-secondary)",
      }}
    >
      {/* Toggle button */}
      <button
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
          fontSize: "13px",
          color: "var(--text-secondary)",
          fontWeight: 500,
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
          {/* Phase 4b-2 will add Claude/Gemini toggle here */}

          {axes.map((axisData) => {
            const axisNum = axisData.id;
            const axisQuestions = getQuestionsForAxis(axisNum);
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
            const axisKey = Object.keys(admin.modality_scores).find(
              (k) => k.startsWith(`${axisNum}_`)
            );
            const budgetScore = axisKey
              ? admin.modality_scores[axisKey]?.budget ?? null
              : null;

            // Budget ministries mapped to axis
            const ministryNames = ministries
              .filter((m) => {
                // Use budget key lookup in allocation
                const keyMap: Record<number, string> = {
                  1: "defense",
                  2: "public_welfare",
                  3: "economy_growth",
                  4: "education_research",
                  5: "environment",
                  6: "justice_civil_liberties",
                  7: "foreign_affairs",
                };
                const budgetKey = keyMap[m.id];
                return (
                  budgetKey &&
                  budget[budgetKey] !== undefined
                );
              })
              .map((m) => m.name);

            return (
              <div
                key={axisNum}
                style={{
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color: "var(--text-tertiary)",
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
                    r.choice === "A"
                      ? axisData.poleALabel
                      : axisData.poleBLabel;
                  return (
                    <div
                      key={r.item}
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "4px",
                        fontSize: "12px",
                        lineHeight: 1.4,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          color: "var(--text-tertiary)",
                          flexShrink: 0,
                          fontSize: "11px",
                        }}
                      >
                        {r.item}
                      </span>
                      <span style={{ color: "var(--text-secondary)", flex: 1 }}>
                        {q ? q.text : r.item}
                      </span>
                      <span
                        style={{
                          color: "var(--text-primary)",
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        {r.choice}{" "}
                        <span
                          style={{
                            fontWeight: 400,
                            color: "var(--text-tertiary)",
                            fontSize: "11px",
                          }}
                        >
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
                    SC_CHOICE_LABELS[r.choice as number] ??
                    String(r.choice);
                  return (
                    <div
                      key={r.item}
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "4px",
                        fontSize: "12px",
                        lineHeight: 1.4,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          color: "var(--text-tertiary)",
                          flexShrink: 0,
                          fontSize: "11px",
                        }}
                      >
                        {r.item}
                      </span>
                      <span style={{ color: "var(--text-secondary)", flex: 1 }}>
                        {q ? q.text : r.item}
                      </span>
                      <span
                        style={{
                          color: "var(--text-primary)",
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        {r.choice}{" "}
                        <span
                          style={{
                            fontWeight: 400,
                            color: "var(--text-tertiary)",
                            fontSize: "11px",
                          }}
                        >
                          ({choiceLabel})
                        </span>
                      </span>
                    </div>
                  );
                })}

                {budgetScore !== null && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-tertiary)",
                      fontStyle: "italic",
                      marginTop: "2px",
                    }}
                  >
                    Budget signal:{" "}
                    <span style={{ color: "var(--text-secondary)" }}>
                      {budgetScore >= 0 ? "+" : ""}
                      {budgetScore.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
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

  const currentIndex = filteredIds.indexOf(id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < filteredIds.length - 1;

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
        borderTop: "1px solid var(--border-secondary)",
      }}
    >
      {/* Share */}
      <button
        onClick={handleShare}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "13px",
          color: copied ? "var(--cluster-3)" : "var(--text-tertiary)",
          padding: 0,
          transition: "color 150ms ease",
        }}
      >
        {copied ? "Copied" : "Share this persona"}
      </button>

      {/* Prev / Next */}
      {filteredIds.length > 1 && (
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          <button
            onClick={() =>
              hasPrev && navigateTo(filteredIds[currentIndex - 1])
            }
            disabled={!hasPrev}
            aria-label="Previous persona"
            style={{
              background: "none",
              border: "1px solid var(--border-primary)",
              borderRadius: "3px",
              padding: "4px 8px",
              cursor: hasPrev ? "pointer" : "default",
              color: hasPrev ? "var(--text-secondary)" : "var(--text-tertiary)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronLeft size={14} aria-hidden />
          </button>
          {currentIndex >= 0 && (
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-mono)",
                minWidth: "60px",
                textAlign: "center",
              }}
            >
              {currentIndex + 1} / {filteredIds.length}
            </span>
          )}
          <button
            onClick={() =>
              hasNext && navigateTo(filteredIds[currentIndex + 1])
            }
            disabled={!hasNext}
            aria-label="Next persona"
            style={{
              background: "none",
              border: "1px solid var(--border-primary)",
              borderRadius: "3px",
              padding: "4px 8px",
              cursor: hasNext ? "pointer" : "default",
              color: hasNext ? "var(--text-secondary)" : "var(--text-tertiary)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronRight size={14} aria-hidden />
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

  // Fetch persona data on mount / id change
  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);

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

  // Keyboard: Escape to close + focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }
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
          style={{
            width: "100%",
            maxWidth: "900px",
            maxHeight: "90vh",
            backgroundColor: "var(--surface-1)",
            border: "1px solid var(--border-secondary)",
            borderRadius: "6px",
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
              style={{
                padding: "60px 24px",
                textAlign: "center",
                color: "var(--text-tertiary)",
                fontSize: "14px",
              }}
            >
              {/* Hidden close button so focus trap doesn't get stuck */}
              <button
                ref={closeBtnRef}
                onClick={handleClose}
                aria-label="Close persona modal"
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "none",
                  border: "1px solid var(--border-primary)",
                  borderRadius: "3px",
                  padding: "4px 6px",
                  cursor: "pointer",
                  color: "var(--text-tertiary)",
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
              style={{
                padding: "40px 24px",
                textAlign: "center",
                color: "var(--text-secondary)",
                fontSize: "14px",
              }}
            >
              <button
                ref={closeBtnRef}
                onClick={handleClose}
                aria-label="Close persona modal"
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "none",
                  border: "1px solid var(--border-primary)",
                  borderRadius: "3px",
                  padding: "4px 6px",
                  cursor: "pointer",
                  color: "var(--text-tertiary)",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={16} aria-hidden />
              </button>
              <div style={{ marginBottom: "8px", color: "var(--text-primary)" }}>
                Could not load persona
              </div>
              <div style={{ fontSize: "12px" }}>{error}</div>
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

      {/* Animation keyframes */}
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
        @media (max-width: 640px) {
          .persona-modal-container {
            border-radius: 0 !important;
            max-height: 100vh !important;
          }
        }
      `}</style>
    </>
  );
}
