"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ComparePinButton } from "@/components/study/ComparePinButton";
import { REGION_LABELS } from "@/lib/study/types";
import { getCluster } from "@/data/syntheticStudyClusters";
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

  const params = new URLSearchParams(searchParams.toString());
  params.set("persona", persona.id);
  const href = `/study/personas?${params.toString()}`;

  const cluster = getCluster(persona.cluster as ClusterId);
  const region = REGION_LABELS[persona.region] ?? persona.region;

  return (
    <article
      className="persona-entry"
      style={{
        position: "relative",
        borderBottom: "0.5px solid var(--border-secondary)",
      }}
    >
      <Link
        href={href}
        className="persona-entry-link"
        style={{
          display: "block",
          padding: "12px 40px 12px 0",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "10px",
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 500,
              fontSize: "16px",
              lineHeight: 1.25,
              color: "var(--text-primary)",
              flex: "1 1 auto",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {persona.name}
          </span>
          <span
            aria-label={cluster.label}
            title={`${cluster.code} — ${cluster.label}`}
            style={{
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.08em",
              color: `var(${cluster.colorVar})`,
              fontVariantNumeric: "tabular-nums",
              flexShrink: 0,
            }}
          >
            {cluster.code}
          </span>
        </div>
        <div
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            lineHeight: 1.4,
            marginTop: "3px",
          }}
        >
          Age {persona.age} · {region}
        </div>
      </Link>

      {/* Pin button — outside the Link to avoid nested interactive elements */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "0",
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
    </article>
  );
}
