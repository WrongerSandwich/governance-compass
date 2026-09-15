"use client";

import { axes } from "@/data/axes";
import {
  polarToCart,
  ringPoints,
  scoreToRadius,
  spokeAngle,
  TOTAL_AXES,
} from "@/lib/radar-geometry";

const DEFAULT_SIZE = 240;

/**
 * The `points` attribute of the score polygon.
 *
 * Every coordinate goes through the shared `polarToCart`, which rounds to
 * `COORD_PLACES`. That rounding is the whole point of the migration: this
 * component is prerendered by Node and hydrated by Chromium, whose `Math.sin`
 * and `Math.cos` disagree in the last binary place, and the unrounded copy
 * that used to live here logged a hydration mismatch on every load of
 * /study/patterns.
 */
function radarPoints(
  scores: number[],
  cx: number,
  cy: number,
  r: number
): string {
  return scores
    .map((score, i) => {
      const [x, y] = polarToCart(
        spokeAngle(i, TOTAL_AXES),
        scoreToRadius(score, r),
        cx,
        cy
      );
      return `${x},${y}`;
    })
    .join(" ");
}

export interface RadarProps {
  scores: number[];
  overlayScores?: number[];
  size?: number;
  colorVar?: string;
  overlayColorVar?: string;
  axisLabels?: string[];
  className?: string;
}

export function Radar({
  scores,
  overlayScores,
  size = DEFAULT_SIZE,
  colorVar = "--mark-primary",
  overlayColorVar = "--model-gemini",
  axisLabels,
  className,
}: RadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  // Leave room for axis labels if present
  const labelPad = axisLabels ? 20 : 0;
  const r = size / 2 - 8 - labelPad;

  // When axis labels are present, expand the viewBox on all sides so long
  // labels (e.g. "International Engagement") don't clip at narrow viewports.
  // SVG rendered size stays at `size` via responsive style — the radar
  // circle scales down slightly inside the expanded viewBox to make room.
  const labelMargin = axisLabels ? 60 : 0;
  const viewBoxMin = -labelMargin;
  const viewBoxSize = size + 2 * labelMargin;

  const primaryColor = `var(${colorVar})`;
  const overlayColor = `var(${overlayColorVar})`;

  // No fade-in: consistent with MiniRadar (ArchetypeCard) and avoids reduced-motion flash on mount.

  return (
    <svg
      viewBox={`${viewBoxMin} ${viewBoxMin} ${viewBoxSize} ${viewBoxSize}`}
      style={{
        width: "100%",
        maxWidth: `${size}px`,
        height: "auto",
      }}
      className={className}
      aria-hidden="true"
    >
      {/* Outer reference ring */}
      <polygon
        points={ringPoints(r, TOTAL_AXES, cx, cy)}
        fill="none"
        style={{ stroke: "var(--border-secondary)" }}
        strokeWidth={0.5}
        opacity={0.5}
      />
      {/* Mid reference ring (dashed) */}
      <polygon
        points={ringPoints(r * 0.5, TOTAL_AXES, cx, cy)}
        fill="none"
        style={{ stroke: "var(--border-secondary)" }}
        strokeWidth={0.5}
        strokeDasharray="2 2"
        opacity={0.3}
      />
      {/* Spoke lines */}
      {Array.from({ length: TOTAL_AXES }, (_, i) => {
        const [x, y] = polarToCart(spokeAngle(i, TOTAL_AXES), r, cx, cy);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            style={{ stroke: "var(--border-secondary)" }}
            strokeWidth={0.5}
            opacity={0.2}
          />
        );
      })}

      {/* Overlay polygon (drawn behind primary) */}
      {overlayScores && (
        <polygon
          points={radarPoints(overlayScores, cx, cy, r)}
          style={{ fill: overlayColor, stroke: overlayColor }}
          fillOpacity={0.08}
          strokeOpacity={0.45}
          strokeWidth={1}
          strokeLinejoin="round"
        />
      )}

      {/* Primary polygon */}
      <polygon
        points={radarPoints(scores, cx, cy, r)}
        style={{ fill: primaryColor, stroke: primaryColor }}
        fillOpacity={0.12}
        strokeOpacity={0.7}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />

      {/* Axis labels at each vertex */}
      {axisLabels &&
        axisLabels.map((label, i) => {
          const [x, y] = polarToCart(
            spokeAngle(i, TOTAL_AXES),
            r + labelPad - 4,
            cx,
            cy
          );
          // Anchor text based on horizontal position
          const anchor =
            Math.abs(x - cx) < 4 ? "middle" : x < cx ? "end" : "start";
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize={9}
              letterSpacing="0.02em"
              style={{
                fill: "var(--text-label)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {label}
            </text>
          );
        })}
    </svg>
  );
}

// Convenience: default axis short names derived from axes.ts
export const DEFAULT_AXIS_LABELS: string[] = axes.map((a) => a.name);
