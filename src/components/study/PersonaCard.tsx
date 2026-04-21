"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ClusterBadge } from "@/components/study/ClusterBadge";
import { ComparePinButton } from "@/components/study/ComparePinButton";
import { REGION_LABELS } from "@/lib/study/types";
import type { PersonaSlim, ClusterId } from "@/lib/study/types";

export interface PersonaCardProps {
  persona: PersonaSlim;
  isPinned?: boolean;
  canPin?: boolean;
  onTogglePin?: (id: string) => void;
}

export function PersonaCard({
  persona,
  isPinned = false,
  canPin = true,
  onTogglePin,
}: PersonaCardProps) {
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
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
        }}
      >
        <ComparePinButton
          personaId={persona.id}
          personaName={persona.name}
          isPinned={isPinned}
          canPin={canPin}
          onToggle={onTogglePin ?? (() => {})}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function regionLabel(region: string): string {
  return (REGION_LABELS as Record<string, string>)[region] ?? region;
}
