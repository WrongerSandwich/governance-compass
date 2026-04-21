import Link from "next/link";
import { EMERGENCE_LABELS } from "@/data/archetypes";
import type { ArchetypeEmergence } from "@/data/archetypes";
import type { ClusterId, MatchStrength } from "@/lib/study/types";

const MATCH_STRENGTH_LABELS: Record<MatchStrength, string> = {
  strong: "strong match",
  moderate: "moderate match",
  close: "close match",
  weak: "weak match",
};

export interface ArchetypeBadgeStudyProps {
  archetypeId: string;
  archetypeName: string;
  emergence: ArchetypeEmergence;
  matchStrength?: MatchStrength;
  /** If provided, tints the chip in the cluster's color. */
  clusterId?: ClusterId;
  className?: string;
}

export function ArchetypeBadgeStudy({
  archetypeId,
  archetypeName,
  emergence,
  matchStrength,
  clusterId,
  className,
}: ArchetypeBadgeStudyProps) {
  const colorVar =
    clusterId !== undefined ? `--cluster-${clusterId}` : "--stone-600";

  const chipStyle: React.CSSProperties = {
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 0,
    padding: "2px 7px",
    borderRadius: "3px",
    border: `0.5px solid var(${colorVar})`,
    backgroundColor: `color-mix(in srgb, var(${colorVar}) 8%, transparent)`,
    textDecoration: "none",
  };

  const inner = (
    <>
      <span
        style={{
          fontSize: "11px",
          fontVariant: "small-caps",
          letterSpacing: "0.03em",
          color: `var(${colorVar})`,
          fontWeight: 500,
          lineHeight: 1.4,
          display: "block",
        }}
      >
        {archetypeName}
        {matchStrength && (
          <span
            style={{
              fontVariant: "normal",
              fontWeight: 400,
              color: "var(--text-tertiary)",
              marginLeft: "0.3em",
            }}
          >
            — {MATCH_STRENGTH_LABELS[matchStrength]}
          </span>
        )}
      </span>
      <span
        style={{
          fontSize: "10px",
          fontStyle: "italic",
          color: "var(--text-tertiary)",
          lineHeight: 1.3,
          display: "block",
        }}
      >
        {EMERGENCE_LABELS[emergence]}
      </span>
    </>
  );

  return (
    <Link
      href={`/archetypes#${archetypeId}`}
      style={chipStyle}
      className={className}
    >
      {inner}
    </Link>
  );
}
