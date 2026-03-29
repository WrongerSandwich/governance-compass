"use client";

import { useState } from "react";

interface ArchetypeCardProps {
  primary: {
    name: string;
    matchPercentage: number;
    summary: string;
    description: string;
    tension: string;
  };
  secondary: {
    name: string;
    matchPercentage: number;
    summary: string;
  };
  isBlended: boolean;
}

export function ArchetypeCard({
  primary,
  secondary,
  isBlended,
}: ArchetypeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const lowMatch = primary.matchPercentage < 55;

  return (
    <div>
      {/* Section label */}
      <p className="text-[11px] uppercase tracking-[0.08em] text-stone-800 font-medium mb-2">
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
          Blended type — your profile draws nearly equally from both types
        </p>
      )}

      {lowMatch && (
        <p className="text-xs mb-2" style={{ color: 'var(--warning-text)' }}>
          Your profile is unusually distributed and doesn&apos;t map cleanly to
          any single governance philosophy.
        </p>
      )}

      {/* Description */}
      <p className="text-[13px] text-text-secondary leading-relaxed">
        {primary.summary}
      </p>

      {/* Expand toggle — text-only with triangle */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="mt-3 text-[13px] text-text-secondary hover:text-text-primary transition-colors duration-150"
        aria-expanded={expanded}
        aria-label={expanded ? "Hide archetype details" : "Show archetype details"}
      >
        {expanded ? "\u25BE Hide details" : "\u25B8 Learn more"}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <p className="text-[13px] text-text-secondary leading-relaxed">
            {primary.description}
          </p>
          {primary.tension && (
            <div className="bg-surface-2 rounded-[8px] p-3">
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
