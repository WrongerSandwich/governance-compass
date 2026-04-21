"use client";

import Link from "next/link";
import { Radar } from "@/components/study/Radar";
import { axes } from "@/data/axes";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CaseStudyProps {
  kind: "high_agreement" | "typical" | "high_disagreement" | "directional_drift";
  kindLabel: string;
  personaId: string;
  personaName: string;
  identity: string;
  bioSummary: string;
  distance: number;
  claudeScores: number[];
  geminiScores: number[];
  analyticalProse: string;
  viewFullProfileHref: string;
}

// ---------------------------------------------------------------------------
// Axis short names
// ---------------------------------------------------------------------------

const AXIS_LABELS: string[] = axes.map((a) => a.name);

// ---------------------------------------------------------------------------
// Swatch legend
// ---------------------------------------------------------------------------

function ModelLegend() {
  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        justifyContent: "center",
        marginTop: "8px",
      }}
    >
      {(
        [
          { color: "var(--model-claude)", label: "Claude" },
          { color: "var(--model-gemini)", label: "Gemini" },
        ] as const
      ).map(({ color, label }) => (
        <div
          key={label}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "2px",
              background: color,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-sans)",
              textTransform: "uppercase" as const,
              letterSpacing: "0.08em",
              color: "var(--text-tertiary)",
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CaseStudy
// ---------------------------------------------------------------------------

export function CaseStudy({
  kindLabel,
  personaId,
  personaName,
  identity,
  bioSummary,
  distance,
  claudeScores,
  geminiScores,
  analyticalProse,
  viewFullProfileHref,
}: CaseStudyProps) {
  return (
    <div>
      {/* Kind label + distance */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            fontFamily: "var(--font-sans)",
            textTransform: "uppercase" as const,
            letterSpacing: "0.1em",
            color: "var(--text-tertiary)",
            fontWeight: 500,
          }}
        >
          {kindLabel}
        </span>
        <span
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--text-tertiary)",
          }}
        >
          distance = {distance.toFixed(3)}
        </span>
      </div>

      {/* Three-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "30% 35% 35%",
          gap: "24px",
          alignItems: "start",
        }}
        className="case-study-grid"
      >
        {/* Left — bio */}
        <div>
          <p
            style={{
              fontSize: "15px",
              fontFamily: "var(--font-serif)",
              fontWeight: 500,
              color: "var(--text-primary)",
              margin: "0 0 4px",
            }}
          >
            {personaName}
          </p>
          <p
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--text-tertiary)",
              margin: "0 0 12px",
            }}
          >
            {identity}
          </p>
          <p
            style={{
              fontSize: "13px",
              fontFamily: "var(--font-serif)",
              color: "var(--text-secondary)",
              lineHeight: 1.65,
              margin: "0 0 12px",
            }}
          >
            {bioSummary}
          </p>
          <Link
            href={viewFullProfileHref}
            style={{
              fontSize: "12px",
              fontFamily: "var(--font-sans)",
              color: "var(--stone-600)",
              textDecoration: "underline",
              textDecorationColor: "var(--border-secondary)",
              textUnderlineOffset: "3px",
            }}
          >
            View full profile →
          </Link>
        </div>

        {/* Center — radar */}
        <div
          style={{
            display: "flex",
            flexDirection: "column" as const,
            alignItems: "center",
          }}
        >
          <Radar
            scores={claudeScores}
            overlayScores={geminiScores}
            colorVar="--model-claude"
            overlayColorVar="--model-gemini"
            size={260}
            axisLabels={AXIS_LABELS}
          />
          <ModelLegend />
          <p
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              color: "var(--text-tertiary)",
              marginTop: "4px",
              textAlign: "center",
            }}
          >
            {personaId}
          </p>
        </div>

        {/* Right — analysis */}
        <div>
          <p
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-sans)",
              textTransform: "uppercase" as const,
              letterSpacing: "0.08em",
              color: "var(--text-tertiary)",
              marginBottom: "8px",
            }}
          >
            Analysis
          </p>
          <p
            style={{
              fontSize: "13px",
              fontFamily: "var(--font-serif)",
              color: "var(--text-secondary)",
              lineHeight: 1.65,
            }}
          >
            {analyticalProse}
          </p>
        </div>
      </div>

      {/* Responsive styles via style tag */}
      <style>{`
        @media (max-width: 640px) {
          .case-study-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
