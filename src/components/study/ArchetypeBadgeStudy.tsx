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
  // Falls back to the mark tone, which steps Stone 600 -> 400 on a dark
  // ground. The Stone 600 ramp entry is that tone's frozen LIGHT value
  // (spec delta 06), and naming it here — even in a comment — is the spelling
  // the section guard exists to keep out.
  const colorVar =
    clusterId !== undefined ? `--cluster-${clusterId}` : "--mark-primary";

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
        className="label font-medium"
        style={{
          fontVariant: "small-caps",
          color: `var(${colorVar})`,
          display: "block",
        }}
      >
        {archetypeName}
        {matchStrength && (
          <span
            className="text-text-secondary font-normal"
            style={{
              fontVariant: "normal",
              marginLeft: "0.3em",
            }}
          >
            — {MATCH_STRENGTH_LABELS[matchStrength]}
          </span>
        )}
      </span>
      <span
        className="mono-meta text-text-label"
        style={{
          fontStyle: "italic",
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
