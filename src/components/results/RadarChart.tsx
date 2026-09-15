"use client";

import { useState } from "react";
import {
  DOMAIN_COLORS,
  DOMAIN_MARK_VARS,
  getDomainForAxis,
  getDomainMarkVar,
  type DomainKey,
} from "@/lib/design-tokens";
import { formatScore } from "@/lib/format-score";
import {
  TOTAL_AXES,
  normaliseByAxisId,
  polarToCart,
  ringPoints,
  scoreToRadius,
  spokeAngle,
  splitLabel,
  type RadarAxisScore,
} from "@/lib/radar-geometry";

interface RadarChartProps {
  axisScores: RadarAxisScore[];
}

const SIZE = 580;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_RADIUS = 170;
// Mock 7a puts the labels at r+22. The old r+38 was sized for two-line
// domain-coloured labels; at 11px mono the ring can close up.
const LABEL_PADDING = 22;

export function RadarChart({ axisScores }: RadarChartProps) {
  const paddedScores = normaliseByAxisId(axisScores);

  const userPolygon = paddedScores
    .map((axis, i) => {
      const [x, y] = polarToCart(
        spokeAngle(i, TOTAL_AXES),
        scoreToRadius(axis.finalScore, MAX_RADIUS),
        CX,
        CY,
      );
      return `${x},${y}`;
    })
    .join(" ");

  const [hoveredAxis, setHoveredAxis] = useState<number | null>(null);

  return (
    <div className="w-full flex flex-col items-center">
      {/* The SVG is aria-hidden, so this table is the entire accessible chart. */}
      <table className="sr-only" aria-label="12-axis governance profile scores">
        <thead>
          <tr>
            <th scope="col">Axis</th>
            <th scope="col">Domain</th>
            <th scope="col">Score</th>
            <th scope="col">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {paddedScores.map((axis) => (
            <tr key={axis.axisId}>
              <td>{axis.name}: {axis.poleALabel} to {axis.poleBLabel}</td>
              {/* This task made domain the job of the twelve dots, which a
                  screen reader cannot see — so without this column the one
                  variable the chart gained is the one AT loses.

                  Derived from the axis id, exactly as `getDomainMarkVar`
                  derives the dot beside it, rather than read off
                  `axis.domain`. The two can disagree — a caller sets the
                  string while the dot is computed — and a padded axis has no
                  string at all, though its id still names its domain. */}
              <td>{DOMAIN_COLORS[getDomainForAxis(axis.axisId)].name}</td>
              {/* The shared formatter, not a fourth inline copy of
                  `>= 0 ? "+" : ""`. It also clamps to -1..1, and it does not
                  sign an exact zero — a padded axis reads "0.00", so a screen
                  reader no longer says "plus zero point zero zero" for an
                  axis that carries no signal at all. */}
              <td>{formatScore(axis.finalScore)}</td>
              <td>{axis.confidence}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-xl" aria-hidden="true">
        {/* Outer ring and dashed mid-ring. Four concentric rings became two:
            the mid-ring is the neutral mark the caption describes, and the
            0.33/0.67 rings carried no meaning.

            `ringPoints` takes an ABSOLUTE radius, where the local helper this
            replaces took a fraction of MAX_RADIUS. Passing 1 and 0.5 here
            would collapse both rings to the centre. */}
        <polygon
          data-radar-ring
          points={ringPoints(MAX_RADIUS, TOTAL_AXES, CX, CY)}
          fill="none"
          style={{ stroke: 'var(--border-secondary)' }}
          strokeWidth={0.8}
        />
        <polygon
          data-radar-ring
          points={ringPoints(MAX_RADIUS * 0.5, TOTAL_AXES, CX, CY)}
          fill="none"
          style={{ stroke: 'var(--border-primary)' }}
          strokeWidth={0.8}
          strokeDasharray="3 3"
        />

        {/* Twelve spokes from the centre, not six diameters: a spoke has to be
            present even where the mapping puts its vertex at the origin. */}
        {Array.from({ length: TOTAL_AXES }, (_, i) => {
          const [x, y] = polarToCart(spokeAngle(i, TOTAL_AXES), MAX_RADIUS, CX, CY);
          return (
            <line
              key={i}
              data-radar-spoke
              x1={CX} y1={CY} x2={x} y2={y}
              style={{ stroke: 'var(--border-secondary)' }}
              strokeWidth={0.6}
            />
          );
        })}

        {/* One shape. --mark-primary, not var(--stone-600) and not
            --domain-economic: it steps to Stone 400 on a dark ground, and the
            domain token holds the identical value in both modes, which makes
            a swap between them invisible. */}
        <polygon
          data-radar-user
          points={userPolygon}
          style={{ fill: 'var(--mark-primary)', stroke: 'var(--mark-primary)' }}
          fillOpacity={0.1}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />

        {paddedScores.map((axis, i) => {
          const [x, y] = polarToCart(
            spokeAngle(i, TOTAL_AXES),
            scoreToRadius(axis.finalScore, MAX_RADIUS),
            CX,
            CY,
          );
          const isHovered = hoveredAxis === axis.axisId;
          return (
            <g key={axis.axisId}>
              <circle
                data-radar-dot
                cx={x}
                cy={y}
                r={isHovered ? 5.5 : 4}
                fill={getDomainMarkVar(axis.axisId)}
                style={{ transition: "r 150ms ease-out" }}
              />
              {/* Larger invisible hit target */}
              <circle
                cx={x}
                cy={y}
                r={14}
                fill="transparent"
                style={{ cursor: "default" }}
                onMouseEnter={() => setHoveredAxis(axis.axisId)}
                onMouseLeave={() => setHoveredAxis(null)}
              />
            </g>
          );
        })}

        {hoveredAxis != null && (() => {
          const axis = paddedScores[hoveredAxis - 1];
          const i = hoveredAxis - 1;
          const angle = spokeAngle(i, TOTAL_AXES);
          const [vx, vy] = polarToCart(
            angle,
            scoreToRadius(axis.finalScore, MAX_RADIUS),
            CX,
            CY,
          );
          const score = axis.finalScore;
          const poleName = score >= 0 ? axis.poleBLabel : axis.poleALabel;
          const label = `${Math.abs(score).toFixed(2)}  ${poleName}`;
          const boxW = label.length * 5.5 + 16;
          const boxH = 28;

          let tx = vx + Math.cos(angle) * 20;
          let ty = vy + Math.sin(angle) * 20;
          tx = Math.max(10, Math.min(SIZE - boxW - 2, tx - boxW / 2)) + boxW / 2;
          ty = Math.max(7, Math.min(SIZE - boxH - 2, ty - boxH / 2)) + boxH / 2;

          return (
            <g style={{ pointerEvents: "none" }}>
              <rect
                x={tx - boxW / 2}
                y={ty - boxH / 2}
                width={boxW}
                height={boxH}
                rx={2}
                style={{ fill: "var(--surface-1)", stroke: "var(--border-secondary)" }}
                strokeWidth={0.5}
              />
              <text
                x={tx}
                y={ty}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={11}
                style={{ fill: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
              >
                {label}
              </text>
            </g>
          );
        })()}

        {paddedScores.map((axis, i) => {
          const angle = spokeAngle(i, TOTAL_AXES);
          const [x, y] = polarToCart(angle, MAX_RADIUS + LABEL_PADDING, CX, CY);

          let anchor: "start" | "middle" | "end" = "middle";
          const normAngle = (angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
          if (normAngle < Math.PI * 0.1 || normAngle > Math.PI * 1.9) anchor = "middle";
          else if (normAngle < Math.PI * 0.9) anchor = "start";
          else if (normAngle < Math.PI * 1.1) anchor = "middle";
          else anchor = "end";

          const parts = splitLabel(
            `${String(axis.axisId).padStart(2, "0")} ${axis.poleBLabel || axis.name}`,
          );

          return (
            <text
              key={axis.axisId}
              data-radar-label
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="central"
              fontSize={11}
              letterSpacing="0.02em"
              style={{ fill: 'var(--text-label)', fontFamily: 'var(--font-mono)' }}
            >
              {parts.map((part, pi) => (
                <tspan key={pi} x={x} dy={pi === 0 ? (parts.length > 1 ? "-0.5em" : "0") : "1.1em"}>
                  {part}
                </tspan>
              ))}
            </text>
          );
        })}
      </svg>

      {/* aria-hidden, like the <svg> it annotates: exposed, it reads as four
          loose domain names with no referent, describing a chart AT cannot
          perceive. The table above carries the same information in rows. */}
      <div
        data-radar-legend
        aria-hidden="true"
        className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-3"
      >
        {(["economic", "power", "society", "world"] as DomainKey[]).map((key) => (
          <div key={key} className="flex items-center gap-1.5 mono-meta text-text-label">
            <span
              data-radar-legend-swatch
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: DOMAIN_MARK_VARS[key] }}
            />
            {DOMAIN_COLORS[key].name}
          </div>
        ))}
      </div>
    </div>
  );
}
