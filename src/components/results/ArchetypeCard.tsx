"use client";

import { useState } from "react";
import Link from "next/link";

interface ArchetypeCardProps {
  primary: {
    id: string;
    name: string;
    matchPercentage: number;
    summary: string;
    description: string;
    tension: string;
    prototype: number[];
  };
  secondary: {
    name: string;
    matchPercentage: number;
    summary: string;
  };
  isBlended: boolean;
  isDistinctive: boolean;
  userScores?: number[]; // 12 axis finalScores for mini radar
}

const MINI_SIZE = 200;
const MINI_CX = MINI_SIZE / 2;
const MINI_CY = MINI_SIZE / 2;
const MINI_R = 80;
const MINI_AXES = 12;

function miniRadarPoints(scores: number[]): string {
  return scores.map((score, i) => {
    const angle = (i / MINI_AXES) * 2 * Math.PI - Math.PI / 2;
    const r = ((score + 1) / 2) * MINI_R;
    return `${MINI_CX + r * Math.cos(angle)},${MINI_CY + r * Math.sin(angle)}`;
  }).join(" ");
}

function MiniRadar({ userScores, prototypeScores }: { userScores: number[]; prototypeScores: number[] }) {
  return (
    <svg viewBox={`0 0 ${MINI_SIZE} ${MINI_SIZE}`} className="w-full max-w-[200px] mx-auto" aria-hidden="true">
      {/* Background ring */}
      <polygon
        points={Array.from({ length: MINI_AXES }, (_, i) => {
          const angle = (i / MINI_AXES) * 2 * Math.PI - Math.PI / 2;
          return `${MINI_CX + MINI_R * Math.cos(angle)},${MINI_CY + MINI_R * Math.sin(angle)}`;
        }).join(" ")}
        fill="none" style={{ stroke: 'var(--border-secondary)' }} strokeWidth={0.5} opacity={0.5}
      />
      {/* Midpoint ring */}
      <polygon
        points={Array.from({ length: MINI_AXES }, (_, i) => {
          const angle = (i / MINI_AXES) * 2 * Math.PI - Math.PI / 2;
          const r = MINI_R * 0.5;
          return `${MINI_CX + r * Math.cos(angle)},${MINI_CY + r * Math.sin(angle)}`;
        }).join(" ")}
        fill="none" style={{ stroke: 'var(--border-secondary)' }} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.3}
      />
      {/* Archetype prototype (dashed) */}
      <polygon
        points={miniRadarPoints(prototypeScores)}
        fill="none" style={{ stroke: 'var(--stone-500)' }}
        strokeWidth={1} strokeDasharray="3 2" opacity={0.4}
      />
      {/* User profile (solid) */}
      <polygon
        points={miniRadarPoints(userScores)}
        style={{ fill: 'var(--stone-600)', stroke: 'var(--stone-600)' }}
        fillOpacity={0.1} strokeOpacity={0.6} strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArchetypeCard({
  primary,
  secondary,
  isBlended,
  isDistinctive,
  userScores,
}: ArchetypeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const lowMatch = primary.matchPercentage < 55;

  if (isDistinctive) {
    return (
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary font-medium mb-2">
          Distinctive profile
        </p>

        <p className="text-[13px] text-text-secondary leading-relaxed mb-3">
          Your governance positions form a combination that doesn&apos;t map
          cleanly to any single archetype. This often reflects considered
          positions that cross traditional ideological lines.
        </p>

        <div className="border-t border-border-secondary my-4" style={{ borderWidth: '0.5px' }} />

        <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium mb-2">
          Nearest archetypes
        </p>
        <p className="text-xs text-text-secondary mb-1">
          {primary.name} — {primary.matchPercentage}% match
        </p>
        <p className="text-xs text-text-tertiary">
          {secondary.name} — {secondary.matchPercentage}% match
        </p>
      </div>
    );
  }

  const showMiniRadar = userScores && primary.prototype.length === 12;

  return (
    <div>
      {/* Side-by-side: text left, mini radar right */}
      <div className={`grid gap-5 ${showMiniRadar ? "grid-cols-1 min-[560px]:grid-cols-[1fr_auto]" : ""}`}>
        <div>
          {/* Section label */}
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary font-medium mb-2">
            Primary archetype
          </p>

          {/* Match percentage — visual anchor */}
          <p className="text-[36px] font-serif font-medium text-text-primary leading-none mb-1">
            {primary.matchPercentage}%
          </p>

          {/* Archetype name */}
          <h2 className="text-[17px] font-serif font-medium text-text-primary mb-2">
            {primary.name}
          </h2>

          {isBlended && (
            <p className="text-xs text-text-tertiary mb-2">
              Blended type — your profile draws nearly equally from both archetypes
            </p>
          )}

          {lowMatch && (
            <p className="text-xs mb-2 text-warning-text">
              Your profile is unusually distributed and doesn&apos;t map cleanly to
              any single governance philosophy.
            </p>
          )}

          {/* Description */}
          <p className="text-[13px] text-text-secondary leading-relaxed">
            {primary.summary}
          </p>
        </div>

        {/* Mini radar — right column */}
        {showMiniRadar && (
          <div className="flex flex-col items-center justify-center">
            <MiniRadar userScores={userScores!} prototypeScores={primary.prototype} />
            <div className="flex justify-center gap-3 mt-1.5">
              <div className="flex items-center gap-1 text-[10px] text-text-tertiary">
                <span className="inline-block w-3 h-[1.5px] rounded-full bg-stone-600" />
                You
              </div>
              <div className="flex items-center gap-1 text-[10px] text-text-tertiary">
                <svg width="12" height="4" aria-hidden="true"><line x1="0" y1="2" x2="12" y2="2" stroke="var(--stone-500)" strokeWidth="1" strokeDasharray="2 1.5" opacity="0.5" /></svg>
                {primary.name.replace(/^The\s+/, "")}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expand toggle + reference link */}
      <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="text-[13px] text-text-secondary hover:text-text-primary transition-colors duration-150"
          aria-expanded={expanded}
          aria-label={expanded ? "Hide archetype details" : "Show archetype details"}
        >
          {expanded ? "\u25BE Hide details" : "\u25B8 Learn more"}
        </button>
        <Link
          href={`/archetypes#${primary.id}`}
          className="text-[12px] text-text-tertiary hover:text-text-secondary transition-colors duration-150"
        >
          Read in the archetype reference →
        </Link>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3">
          <p className="text-[13px] text-text-secondary leading-relaxed">
            {primary.description}
          </p>
          {primary.tension && (
            <div className="border border-border-secondary rounded-[8px] p-3">
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium mb-1">
                Characteristic tension
              </p>
              <p className="text-[13px] text-text-secondary">{primary.tension}</p>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-border-secondary my-4" style={{ borderWidth: '0.5px' }} />

      {/* Adjacent type — inline per spec */}
      <p className="text-xs text-text-tertiary">
        <span className="font-medium text-text-secondary">Adjacent:</span>{" "}
        {secondary.name} — {secondary.matchPercentage}% match
      </p>
    </div>
  );
}
