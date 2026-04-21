"use client";

import { axes } from "@/data/axes";

const NUM_AXES = 12;
const DEFAULT_SIZE = 240;

function polarToXY(
  cx: number,
  cy: number,
  r: number,
  index: number,
  total: number
): { x: number; y: number } {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

function radarPoints(
  scores: number[],
  cx: number,
  cy: number,
  r: number
): string {
  return scores
    .map((score, i) => {
      const { x, y } = polarToXY(cx, cy, ((score + 1) / 2) * r, i, NUM_AXES);
      return `${x},${y}`;
    })
    .join(" ");
}

function ringPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: NUM_AXES }, (_, i) => {
    const { x, y } = polarToXY(cx, cy, r, i, NUM_AXES);
    return `${x},${y}`;
  }).join(" ");
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
  colorVar = "--stone-600",
  overlayColorVar = "--model-gemini",
  axisLabels,
  className,
}: RadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  // Leave room for axis labels if present
  const labelPad = axisLabels ? 20 : 0;
  const r = size / 2 - 8 - labelPad;

  const primaryColor = `var(${colorVar})`;
  const overlayColor = `var(${overlayColorVar})`;

  // No fade-in: consistent with MiniRadar (ArchetypeCard) and avoids reduced-motion flash on mount.

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      {/* Outer reference ring */}
      <polygon
        points={ringPoints(cx, cy, r)}
        fill="none"
        style={{ stroke: "var(--border-secondary)" }}
        strokeWidth={0.5}
        opacity={0.5}
      />
      {/* Mid reference ring (dashed) */}
      <polygon
        points={ringPoints(cx, cy, r * 0.5)}
        fill="none"
        style={{ stroke: "var(--border-secondary)" }}
        strokeWidth={0.5}
        strokeDasharray="2 2"
        opacity={0.3}
      />
      {/* Spoke lines */}
      {Array.from({ length: NUM_AXES }, (_, i) => {
        const { x, y } = polarToXY(cx, cy, r, i, NUM_AXES);
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
          const { x, y } = polarToXY(cx, cy, r + labelPad - 4, i, NUM_AXES);
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
              style={{
                fontSize: "9px",
                fill: "var(--text-tertiary)",
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
