"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { ClusterBadge } from "@/components/study/ClusterBadge";
import type { PersonaSlim, ClusterId } from "@/lib/study/types";

export interface PersonaCardProps {
  persona: PersonaSlim;
  isPinned?: boolean;
  onTogglePin?: (id: string) => void;
}

export function PersonaCard({ persona, isPinned = false, onTogglePin }: PersonaCardProps) {
  const searchParams = useSearchParams();

  // Build the link URL: preserve current filter params and add persona param
  const params = new URLSearchParams(searchParams.toString());
  params.set("persona", persona.id);
  const href = `/study/personas?${params.toString()}`;

  const identity = [
    `Age ${persona.age}`,
    regionLabel(persona.region),
  ]
    .filter(Boolean)
    .join(" · ");

  function handlePinClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onTogglePin?.(persona.id);
  }

  return (
    <div
      style={{
        position: "relative",
        border: "1px solid var(--border-primary)",
        borderRadius: "4px",
        backgroundColor: "var(--surface-1)",
        transition: "border-color 120ms ease",
      }}
      className="persona-card"
    >
      <Link
        href={href}
        style={{
          display: "block",
          padding: "14px 40px 14px 14px",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        {/* Name */}
        <div
          style={{
            fontFamily: "var(--font-serif, Georgia, serif)",
            fontWeight: 500,
            fontSize: "1rem",
            lineHeight: 1.3,
            color: "var(--text-primary)",
            marginBottom: "3px",
          }}
        >
          {persona.name}
        </div>

        {/* Identity line */}
        <div
          style={{
            fontSize: "0.8125rem",
            color: "var(--text-secondary)",
            lineHeight: 1.4,
            marginBottom: "8px",
          }}
        >
          {identity}
        </div>

        {/* Badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          <ClusterBadge
            clusterId={persona.cluster as ClusterId}
            href={null}
          />
        </div>
      </Link>

      {/* Pin button — outside the Link to avoid nested interactive elements */}
      <button
        onClick={handlePinClick}
        aria-label={isPinned ? `Unpin ${persona.name}` : `Pin ${persona.name}`}
        title={isPinned ? "Unpin" : "Pin"}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          padding: "4px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: isPinned ? "var(--stone-600)" : "var(--text-tertiary)",
          lineHeight: 1,
          borderRadius: "3px",
          transition: "color 120ms ease",
        }}
      >
        <Bookmark
          size={14}
          fill={isPinned ? "currentColor" : "none"}
          strokeWidth={1.5}
        />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const REGION_LABELS: Record<string, string> = {
  western_europe: "Western Europe",
  eastern_europe_central_asia: "Eastern Europe & Central Asia",
  north_america: "North America",
  latin_america: "Latin America",
  middle_east_north_africa: "Middle East & N. Africa",
  sub_saharan_africa: "Sub-Saharan Africa",
  south_southeast_asia: "South & SE Asia",
  east_asia: "East Asia",
  oceania_small_states: "Oceania",
  diaspora_transnational: "Diaspora / Transnational",
};

function regionLabel(region: string): string {
  return REGION_LABELS[region] ?? region;
}
