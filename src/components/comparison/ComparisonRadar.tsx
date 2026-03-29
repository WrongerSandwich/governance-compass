"use client";

import { useState } from "react";
import { getDomainColor600 } from "@/lib/design-tokens";

interface AxisScoreEntry {
  axisId: number;
  name: string;
  finalScore: number;
}

interface ComparisonRadarProps {
  axisScoresA: AxisScoreEntry[];
  axisScoresB: AxisScoreEntry[];
  labelA: string;
  labelB: string;
}

const TOTAL_AXES = 12;
const SIZE = 580;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_RADIUS = 170;
const LABEL_PADDING = 38;
const RING_FRACTIONS = [0.33, 0.5, 0.67, 1.0];

function scoreToRadius(score: number): number {
  return ((score + 1) / 2) * MAX_RADIUS;
}

function spokeAngle(index: number): number {
  return (index / TOTAL_AXES) * 2 * Math.PI - Math.PI / 2;
}

function polarToCart(angle: number, radius: number): [number, number] {
  return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)];
}

function ringPolygonPoints(radiusFraction: number): string {
  const r = MAX_RADIUS * radiusFraction;
  return Array.from({ length: TOTAL_AXES }, (_, i) => {
    const [x, y] = polarToCart(spokeAngle(i), r);
    return `${x},${y}`;
  }).join(" ");
}

function scorePolygonPoints(scores: number[]): string {
  return scores
    .map((score, i) => {
      const [x, y] = polarToCart(spokeAngle(i), scoreToRadius(score));
      return `${x},${y}`;
    })
    .join(" ");
}

function buildPaddedScores(axisScores: AxisScoreEntry[]): number[] {
  return Array.from({ length: TOTAL_AXES }, (_, i) => {
    const found = axisScores.find((s) => s.axisId === i + 1);
    return found?.finalScore ?? 0;
  });
}

export function ComparisonRadar({
  axisScoresA,
  axisScoresB,
  labelA,
  labelB,
}: ComparisonRadarProps) {
  const allAxes = axisScoresA.length > 0 ? axisScoresA : axisScoresB;
  const paddedNames = Array.from({ length: TOTAL_AXES }, (_, i) => {
    const found = allAxes.find((s) => s.axisId === i + 1);
    return found?.name ?? `Axis ${i + 1}`;
  });

  const scoresA = buildPaddedScores(axisScoresA);
  const scoresB = buildPaddedScores(axisScoresB);
  const pointsA = scorePolygonPoints(scoresA);
  const pointsB = scorePolygonPoints(scoresB);
  const [hoveredAxis, setHoveredAxis] = useState<number | null>(null);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Visually hidden table for screen readers */}
      <table className="sr-only" aria-label="Comparison of two governance profiles">
        <thead>
          <tr><th>Axis</th><th>{labelA}</th><th>{labelB}</th><th>Difference</th></tr>
        </thead>
        <tbody>
          {paddedNames.map((name, i) => (
            <tr key={i}>
              <td>{name}</td>
              <td>{scoresA[i] >= 0 ? "+" : ""}{scoresA[i].toFixed(2)}</td>
              <td>{scoresB[i] >= 0 ? "+" : ""}{scoresB[i].toFixed(2)}</td>
              <td>{Math.abs(scoresA[i] - scoresB[i]).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-xl"
        aria-hidden="true"
      >
        {/* Concentric rings with midpoint */}
        {RING_FRACTIONS.map((frac) => (
          <polygon
            key={frac}
            points={ringPolygonPoints(frac)}
            fill="none"
            style={{ stroke: frac === 0.5 ? 'var(--stone-600)' : 'var(--border-tertiary)' }}
            strokeWidth={frac === 0.5 ? 0.7 : 0.5}
            strokeDasharray={frac === 0.5 ? "3 3" : undefined}
            opacity={frac === 0.5 ? 0.35 : 0.4}
          />
        ))}

        {/* 6 spoke lines */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const [x1, y1] = polarToCart(spokeAngle(i), MAX_RADIUS);
          const [x2, y2] = polarToCart(spokeAngle(i + 6), MAX_RADIUS);
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              style={{ stroke: 'var(--border-tertiary)' }}
              strokeWidth={0.5}
              opacity={0.25}
            />
          );
        })}

        {/* Profile B polygon (dashed) */}
        <polygon
          points={pointsB}
          fill="none"
          style={{ stroke: 'var(--stone-600)' }}
          strokeWidth={1.5}
          strokeDasharray="5 3"
          strokeOpacity={0.55}
          strokeLinejoin="round"
        />

        {/* Profile A polygon (solid) */}
        <polygon
          points={pointsA}
          style={{ fill: 'var(--stone-600)', stroke: 'var(--stone-600)' }}
          fillOpacity={0.12}
          strokeOpacity={0.55}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* Center dot — render before interactive dots */}
        <circle cx={CX} cy={CY} r={3} style={{ fill: 'var(--border-primary)' }} />

        {/* Domain-colored vertex dots — Profile A (solid) + Profile B (ring) + hit targets */}
        {scoresA.map((score, i) => {
          const [xa, ya] = polarToCart(spokeAngle(i), scoreToRadius(score));
          const [xb, yb] = polarToCart(spokeAngle(i), scoreToRadius(scoresB[i]));
          const isHovered = hoveredAxis === i;
          return (
            <g key={i}>
              {/* Profile A dot */}
              <circle cx={xa} cy={ya} r={isHovered ? 5 : 3.5} fill={getDomainColor600(i + 1)} style={{ transition: "r 150ms" }} />
              {/* Profile B ring */}
              <circle cx={xb} cy={yb} r={isHovered ? 4 : 3} fill="none" stroke={getDomainColor600(i + 1)} strokeWidth={1.5} opacity={0.6} style={{ transition: "r 150ms" }} />
              {/* Hit target — centered between A and B */}
              <circle
                cx={(xa + xb) / 2}
                cy={(ya + yb) / 2}
                r={16}
                fill="transparent"
                style={{ cursor: "default" }}
                onMouseEnter={() => setHoveredAxis(i)}
                onMouseLeave={() => setHoveredAxis(null)}
              />
            </g>
          );
        })}

        {/* Tooltip for hovered axis */}
        {hoveredAxis != null && (() => {
          const i = hoveredAxis;
          const sA = scoresA[i];
          const sB = scoresB[i];
          const name = paddedNames[i];
          const label = `${labelA}: ${Math.abs(sA).toFixed(2)}  |  ${labelB}: ${Math.abs(sB).toFixed(2)}`;
          const charWidth = 5;
          const textWidth = label.length * charWidth;
          const padH = 8;
          const padV = 5;
          const boxW = textWidth + padH * 2;
          const boxH = 28 + padV * 2;

          const [xa, ya] = polarToCart(spokeAngle(i), scoreToRadius(sA));
          const [xb, yb] = polarToCart(spokeAngle(i), scoreToRadius(sB));
          const angle = spokeAngle(i);
          let tx = (xa + xb) / 2 + Math.cos(angle) * 24;
          let ty = (ya + yb) / 2 + Math.sin(angle) * 24;

          tx = Math.max(padH + 2, Math.min(SIZE - boxW - 2, tx - boxW / 2)) + boxW / 2;
          ty = Math.max(padV + 2, Math.min(SIZE - boxH - 2, ty - boxH / 2)) + boxH / 2;

          return (
            <g style={{ pointerEvents: "none" }}>
              <rect
                x={tx - boxW / 2} y={ty - boxH / 2}
                width={boxW} height={boxH} rx={4}
                style={{ fill: "var(--surface-1)", stroke: "var(--border-secondary)" }}
                strokeWidth={0.5}
              />
              <text
                x={tx} y={ty - 5}
                textAnchor="middle" dominantBaseline="central"
                fontSize={9} style={{ fill: "var(--text-tertiary)" }}
              >
                {name}
              </text>
              <text
                x={tx} y={ty + 7}
                textAnchor="middle" dominantBaseline="central"
                fontSize={9} style={{ fill: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
              >
                {label}
              </text>
            </g>
          );
        })()}

        {/* Axis labels with long-label wrapping */}
        {paddedNames.map((name, i) => {
          const angle = spokeAngle(i);
          const [x, y] = polarToCart(angle, MAX_RADIUS + LABEL_PADDING);

          let anchor: "start" | "middle" | "end" = "middle";
          const normAngle = ((angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI));
          if (normAngle < Math.PI * 0.1 || normAngle > Math.PI * 1.9) anchor = "middle";
          else if (normAngle < Math.PI * 0.9) anchor = "start";
          else if (normAngle < Math.PI * 1.1) anchor = "middle";
          else anchor = "end";

          let parts: string[];
          if (name.length > 14) {
            const mid = Math.ceil(name.length / 2);
            const spaceAfter = name.indexOf(" ", mid);
            const spaceBefore = name.lastIndexOf(" ", mid);
            const splitAt = spaceAfter !== -1 && (spaceAfter - mid) < (mid - spaceBefore) ? spaceAfter : spaceBefore;
            parts = splitAt > 0 ? [name.slice(0, splitAt), name.slice(splitAt + 1)] : [name];
          } else {
            parts = [name];
          }

          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="central"
              fontSize={10}
              fill={getDomainColor600(i + 1)}
              opacity={0.8}
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

      {/* Legend */}
      <div className="flex gap-6 mt-3">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <svg width="16" height="8" viewBox="0 0 16 8" aria-hidden="true">
            <line x1="0" y1="4" x2="16" y2="4" stroke="var(--stone-600)" strokeWidth="1.5" />
          </svg>
          {labelA}
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <svg width="16" height="8" viewBox="0 0 16 8" aria-hidden="true">
            <line x1="0" y1="4" x2="16" y2="4" stroke="var(--stone-600)" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.55" />
          </svg>
          {labelB}
        </div>
      </div>
    </div>
  );
}
