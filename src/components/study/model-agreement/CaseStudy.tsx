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
              borderRadius: "var(--radius)",
              background: color,
              flexShrink: 0,
            }}
          />
          <span className="label text-text-label">{label}</span>
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
        <span className="label text-text-label font-medium">{kindLabel}</span>
        <span className="mono-meta text-text-label">
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
            className="display-s text-text-primary"
            style={{ margin: "0 0 4px" }}
          >
            {personaName}
          </p>
          <p
            className="body-xs text-text-secondary"
            style={{ margin: "0 0 12px" }}
          >
            {identity}
          </p>
          <p
            className="body-s text-text-secondary"
            style={{ margin: "0 0 12px" }}
          >
            {bioSummary}
          </p>
          <Link
            href={viewFullProfileHref}
            className="body-xs text-mark-primary"
            style={{
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
            className="mono-meta text-text-label"
            style={{ marginTop: "4px", textAlign: "center" }}
          >
            {personaId}
          </p>
        </div>

        {/* Right — analysis */}
        <div>
          <p
            className="label text-text-label"
            style={{ marginBottom: "8px" }}
          >
            Analysis
          </p>
          <p className="body-s text-text-secondary">{analyticalProse}</p>
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
