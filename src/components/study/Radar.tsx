"use client";

import { axes } from "@/data/axes";
import {
  polarToCart,
  ringPoints,
  scoreToRadius,
  spokeAngle,
  splitLabel,
  TOTAL_AXES,
} from "@/lib/radar-geometry";

const DEFAULT_SIZE = 240;

const LABEL_FONT_SIZE = 9;
/** Advance width of one monospace glyph, in ems. 0.60 is the advance of
 *  every monospace face in the stack — it is what makes them monospace —
 *  and 0.02 is the tracking the label layer adds. Measured against the
 *  rendered chart at 5.583 units per glyph at `fontSize` 9, i.e. 0.6203em.
 *
 *  It is an estimate, and it is used to size a MARGIN rather than to place
 *  anything, so an error shows up as a few units of slack and never as a
 *  cut glyph. */
const LABEL_ADVANCE_EM = 0.62;
/** Breathing room past the last glyph's side bearing. */
const LABEL_EDGE_PAD = 4;

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

  // Wrapped, like the results-page radar: a label runs outward from the rim,
  // so its LENGTH is what decides the margin, and two short lines need about
  // half the horizontal room one long one does.
  const labelLines = axisLabels?.map(splitLabel);

  // DERIVED, not guessed. This was a flat 60 under a comment claiming long
  // labels "don't clip at narrow viewports" — they clipped at wide ones, and
  // an SVG root's default `overflow: hidden` painted the overflow away rather
  // than letting it spill: "International Engagement" rendered as
  // "al Engagement" and two more lost their last word.
  //
  // The binding case is the label on a horizontal vertex, anchored `start` or
  // `end` at cx ± (r + labelPad - 4) = cx ± (size/2 - 12) and running
  // outward by its own width. So the viewBox needs `width + pad - 12` past
  // the edge of the plot box. Every other vertex sits closer to the centre
  // horizontally, or is `middle`-anchored and needs half as much.
  //
  // Widening the viewBox without widening the rendered box is not free — it
  // is paid in effective type size, since the SVG still renders at `size` px.
  // That is why this is derived from the labels actually passed instead of
  // being set to a number big enough for anything: a caller with short labels
  // gets a bigger chart, and one with none pays nothing.
  const widestLine = Math.max(
    0,
    ...(labelLines?.flat().map((line) => line.length) ?? []),
  );
  const labelMargin = labelLines
    ? Math.ceil(widestLine * LABEL_FONT_SIZE * LABEL_ADVANCE_EM) +
      LABEL_EDGE_PAD -
      12
    : 0;
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
      {labelLines &&
        labelLines.map((lines, i) => {
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
              fontSize={LABEL_FONT_SIZE}
              letterSpacing="0.02em"
              style={{
                fill: "var(--text-label)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {lines.map((line, li) => (
                <tspan
                  key={li}
                  x={x}
                  dy={li === 0 ? (lines.length > 1 ? "-0.5em" : "0") : "1.1em"}
                >
                  {line}
                </tspan>
              ))}
            </text>
          );
        })}
    </svg>
  );
}

// Convenience: default axis short names derived from axes.ts
export const DEFAULT_AXIS_LABELS: string[] = axes.map((a) => a.name);
