"use client";

import { useState, type ReactNode } from "react";
import { Button, ButtonLink } from "@/components/Button";
import {
  TOTAL_AXES,
  polarToCart,
  ringPoints,
  scoreToRadius,
  spokeAngle,
} from "@/lib/radar-geometry";

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
  /** Mock 7a draws Copy link / Compare with someone inside the panel, but the
   *  timer and the router belong to ResultsView. It passes them in here. */
  actions?: ReactNode;
}

const MINI_SIZE = 200;
const MINI_CX = MINI_SIZE / 2;
const MINI_CY = MINI_SIZE / 2;
const MINI_R = 80;

/** Vertex `i` is axis `i + 1`, so this mapping is positional. `userScores`
 *  arrives as a bare `number[]` (`axisData.map((a) => a.finalScore)` at the
 *  call site), which carries no axis id, so `normaliseByAxisId` cannot be
 *  applied here without widening `ArchetypeCard`'s `userScores` prop to carry
 *  ids — a change to the public prop shape, made at ResultsView. `RadarChart`
 *  normalises because its prop already carries `axisId`. See the report note
 *  on addendum D. */
function miniRadarPoints(scores: number[]): string {
  return scores
    .map((score, i) => {
      const [x, y] = polarToCart(
        spokeAngle(i, TOTAL_AXES),
        scoreToRadius(score, MINI_R),
        MINI_CX,
        MINI_CY,
      );
      return `${x},${y}`;
    })
    .join(" ");
}

function MiniRadar({
  userScores,
  prototypeScores,
}: {
  userScores: number[];
  prototypeScores: number[];
}) {
  return (
    <svg
      viewBox={`0 0 ${MINI_SIZE} ${MINI_SIZE}`}
      className="w-full max-w-[200px] mx-auto"
      aria-hidden="true"
    >
      <polygon
        data-mini-ring="outer"
        points={ringPoints(MINI_R, TOTAL_AXES, MINI_CX, MINI_CY)}
        fill="none"
        style={{ stroke: 'var(--border-secondary)' }}
        strokeWidth={0.6}
      />
      <polygon
        data-mini-ring="mid"
        points={ringPoints(MINI_R * 0.5, TOTAL_AXES, MINI_CX, MINI_CY)}
        fill="none"
        style={{ stroke: 'var(--border-secondary)' }}
        strokeWidth={0.5}
        strokeDasharray="2 2"
      />
      <polygon
        points={miniRadarPoints(prototypeScores)}
        fill="none"
        style={{ stroke: 'var(--stone-500)' }}
        strokeWidth={1}
        strokeDasharray="3 2"
        opacity={0.5}
      />
      {/* --mark-primary, not var(--stone-600): mock 7b paints this shape Stone
          400 on a dark ground. Deliberately NOT --domain-economic, which holds
          the same value in both modes — see the note in globals.css. */}
      <polygon
        data-mini-user
        points={miniRadarPoints(userScores)}
        style={{ fill: 'var(--mark-primary)', stroke: 'var(--mark-primary)' }}
        fillOpacity={0.12}
        strokeWidth={1.4}
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
  actions,
}: ArchetypeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const lowMatch = primary.matchPercentage < 55;

  if (isDistinctive) {
    return (
      <div>
        <p className="label-eyebrow text-text-label pb-3 border-b border-rule-strong mb-3.5">
          Distinctive profile
        </p>

        <p className="body-s text-text-secondary mb-4">
          Your governance positions form a combination that doesn&apos;t map
          cleanly to any single archetype. This often reflects considered
          positions that cross traditional ideological lines.
        </p>

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 mb-4">{actions}</div>
        )}

        <p className="label-tight text-text-label mt-[18px] pt-3.5 border-t border-rule-hairline mb-1">
          Nearest archetypes
        </p>
        <p className="mono-meta text-text-secondary">
          {primary.name} — {primary.matchPercentage}% match
        </p>
        <p className="mono-meta text-text-label">
          {secondary.name} — {secondary.matchPercentage}% match
        </p>
      </div>
    );
  }

  const showMiniRadar =
    userScores?.length === TOTAL_AXES && primary.prototype.length === TOTAL_AXES;

  return (
    <div>
      <div
        data-archetype-grid
        className={`grid gap-7 items-start ${showMiniRadar ? "grid-cols-1 min-[560px]:grid-cols-[minmax(0,1fr)_220px]" : ""}`}
      >
        <div>
          <p
            data-archetype-label
            className="label-eyebrow text-text-label pb-3 border-b border-rule-strong mb-3.5"
          >
            Primary archetype
          </p>

          <p data-archetype-match className="display-l text-text-primary mb-1">
            {primary.matchPercentage}%
          </p>

          <h2 className="display-s text-text-primary mb-3">{primary.name}</h2>

          {isBlended && (
            <p className="mono-meta text-text-label mb-2">
              Blended type — your profile draws nearly equally from both archetypes
            </p>
          )}

          {lowMatch && (
            <p className="mono-meta text-warning-text mb-2">
              Your profile is unusually distributed and doesn&apos;t map cleanly to
              any single governance philosophy.
            </p>
          )}

          <p className="body-s text-text-secondary mb-4">{primary.summary}</p>

          <div className="flex flex-wrap items-center gap-2.5">
            {actions}
            <Button
              variant="tertiary"
              data-archetype-expand
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
            >
              {expanded ? "Hide details" : "Learn more"}
              <span className="sr-only"> about {primary.name}</span>
            </Button>
          </div>

          {expanded && (
            <div className="mt-4 space-y-3">
              <p className="body-s text-text-secondary">{primary.description}</p>
              {primary.tension && (
                <div className="border-l-2 border-border-secondary pl-4">
                  <p className="label text-text-label mb-1">Characteristic tension</p>
                  <p className="body-s text-text-secondary">{primary.tension}</p>
                </div>
              )}
              {/* ButtonLink, not a hand-copied class string: the plan spelled
                  the tertiary variant out inline, which forks it from
                  Button.tsx and loses the named transition list that file
                  documents as a deliberate fix over `transition-colors`. */}
              <ButtonLink variant="tertiary" href={`/archetypes#${primary.id}`}>
                Read in the archetype reference →
              </ButtonLink>
            </div>
          )}
        </div>

        {showMiniRadar && (
          <div className="flex flex-col items-center justify-center">
            <MiniRadar userScores={userScores} prototypeScores={primary.prototype} />
            <div
              data-mini-legend
              aria-hidden="true"
              className="flex justify-center gap-3.5 mt-1.5 mono-meta text-text-label"
            >
              <span className="flex items-center gap-1.5">
                <span
                  data-mini-legend-you
                  className="inline-block w-3 h-0.5"
                  style={{ backgroundColor: 'var(--mark-primary)' }}
                />
                You
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="2" aria-hidden="true">
                  <line
                    x1="0"
                    y1="1"
                    x2="12"
                    y2="1"
                    stroke="var(--stone-500)"
                    strokeWidth="1"
                    strokeDasharray="3 2"
                  />
                </svg>
                Prototype
              </span>
            </div>
          </div>
        )}
      </div>

      <p
        data-archetype-adjacent
        className="mono-meta text-text-label mt-[18px] pt-3.5 border-t border-rule-hairline"
      >
        Adjacent · {secondary.name} — {secondary.matchPercentage}% match
      </p>
    </div>
  );
}
