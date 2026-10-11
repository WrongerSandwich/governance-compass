"use client";

import { estimateMonoLabelWidth } from "@/lib/study/monoLabelWidth";
import { placeOverlayLabels } from "@/lib/study/overlayLabels";

export interface HistogramOverlay {
  value: number;
  label: string;
  color?: string;
  dashed?: boolean;
}

export interface HistogramProps {
  bins: number[];
  range: [number, number];
  xLabel?: string;
  yLabel?: string;
  height?: number;
  barColor?: string;
  overlays?: HistogramOverlay[];
  ariaLabel?: string;
  className?: string;
}

const PADDING = { top: 16, right: 12, bottom: 40, left: 40 };
const OVERLAY_FONT_SIZE = 9;
/** Vertical step between two overlay labels that would otherwise collide. */
const OVERLAY_ROW_STEP = 11;
/** Horizontal clearance between a marker line and its label. */
const OVERLAY_LABEL_INSET = 3;

export function Histogram({
  bins,
  range,
  xLabel,
  yLabel,
  height = 160,
  barColor = "var(--mark-primary)",
  overlays,
  ariaLabel,
  className,
}: HistogramProps) {
  const width = 320;
  const plotW = width - PADDING.left - PADDING.right;
  const plotH = height - PADDING.top - PADDING.bottom;

  const maxCount = Math.max(...bins, 1);
  // Round up to a "nice" y-max
  const yMax = Math.ceil(maxCount / 5) * 5 || 5;
  const nBins = bins.length;
  const barW = plotW / nBins;

  // X ticks: range start, mid, end
  const xTicks = [range[0], (range[0] + range[1]) / 2, range[1]];
  // Y ticks: 0, mid, top
  const yTicks = [0, Math.round(yMax / 2), yMax];

  function xToSvg(val: number): number {
    return PADDING.left + ((val - range[0]) / (range[1] - range[0])) * plotW;
  }
  function yToSvg(count: number): number {
    return PADDING.top + plotH - (count / yMax) * plotH;
  }

  // Overlay labels are placed together rather than one at a time: two markers
  // closer than a label's width share a column, so the second steps down a
  // row instead of overprinting the first.
  const overlayPlacements = placeOverlayLabels(
    (overlays ?? []).map((ov) => ({
      x: xToSvg(ov.value),
      width: estimateMonoLabelWidth(ov.label, OVERLAY_FONT_SIZE),
    })),
    { maxX: PADDING.left + plotW, inset: OVERLAY_LABEL_INSET },
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{
        width: "100%",
        maxWidth: `${width}px`,
        height: "auto",
      }}
      className={className}
      role="img"
      aria-label={ariaLabel ?? "Histogram"}
    >
      <title>{ariaLabel ?? "Histogram"}</title>

      {/* Y-axis gridlines */}
      {yTicks.map((t) => (
        <line
          key={t}
          x1={PADDING.left}
          y1={yToSvg(t)}
          x2={PADDING.left + plotW}
          y2={yToSvg(t)}
          stroke="var(--border-secondary)"
          strokeWidth={0.5}
          strokeDasharray={t === 0 ? undefined : "2 3"}
          opacity={0.6}
        />
      ))}

      {/* Bars */}
      {bins.map((count, i) => {
        const x = PADDING.left + i * barW;
        const barH = (count / yMax) * plotH;
        const y = PADDING.top + plotH - barH;
        return (
          <rect
            key={i}
            x={x + 1}
            y={y}
            width={barW - 2}
            height={barH}
            fill={barColor}
            fillOpacity={0.75}
            aria-label={`Bin ${i + 1}: ${count}`}
          />
        );
      })}

      {/* Overlay lines */}
      {overlays?.map((ov, i) => {
        const x = xToSvg(ov.value);
        const color = ov.color ?? "var(--text-secondary)";
        const { row, anchor } = overlayPlacements[i];
        return (
          <g key={i}>
            <line
              x1={x}
              y1={PADDING.top}
              x2={x}
              y2={PADDING.top + plotH}
              stroke={color}
              strokeWidth={1}
              // overlay lines are dashed by default; pass dashed: false for a solid line
              strokeDasharray={ov.dashed !== false ? "3 2" : undefined}
            />
            <text
              x={anchor === "start" ? x + OVERLAY_LABEL_INSET : x - OVERLAY_LABEL_INSET}
              y={PADDING.top + 8 + row * OVERLAY_ROW_STEP}
              textAnchor={anchor}
              fontSize={OVERLAY_FONT_SIZE}
              letterSpacing="0.02em"
              style={{
                fill: color,
                fontFamily: "var(--font-mono)",
              }}
            >
              {ov.label}
            </text>
          </g>
        );
      })}

      {/* X axis line */}
      <line
        x1={PADDING.left}
        y1={PADDING.top + plotH}
        x2={PADDING.left + plotW}
        y2={PADDING.top + plotH}
        stroke="var(--border-primary)"
        strokeWidth={0.75}
      />

      {/* Y axis line */}
      <line
        x1={PADDING.left}
        y1={PADDING.top}
        x2={PADDING.left}
        y2={PADDING.top + plotH}
        stroke="var(--border-primary)"
        strokeWidth={0.75}
      />

      {/* X ticks + labels */}
      {xTicks.map((t) => {
        const x = xToSvg(t);
        return (
          <g key={t}>
            <line
              x1={x}
              y1={PADDING.top + plotH}
              x2={x}
              y2={PADDING.top + plotH + 4}
              stroke="var(--border-primary)"
              strokeWidth={0.75}
            />
            <text
              x={x}
              y={PADDING.top + plotH + 13}
              textAnchor="middle"
              fontSize={9}
              letterSpacing="0.02em"
              style={{
                fill: "var(--text-label)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {t % 1 === 0 ? t.toString() : t.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* Y ticks + labels */}
      {yTicks.map((t) => {
        const y = yToSvg(t);
        return (
          <g key={t}>
            <line
              x1={PADDING.left - 4}
              y1={y}
              x2={PADDING.left}
              y2={y}
              stroke="var(--border-primary)"
              strokeWidth={0.75}
            />
            <text
              x={PADDING.left - 7}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={9}
              letterSpacing="0.02em"
              style={{
                fill: "var(--text-label)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {t}
            </text>
          </g>
        );
      })}

      {/* X label */}
      {xLabel && (
        <text
          x={PADDING.left + plotW / 2}
          y={height - 4}
          textAnchor="middle"
          fontSize={10}
          letterSpacing="0.02em"
          style={{
            fill: "var(--text-label)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {xLabel}
        </text>
      )}

      {/* Y label — rotated */}
      {yLabel && (
        <text
          x={0}
          y={0}
          textAnchor="middle"
          transform={`translate(10, ${PADDING.top + plotH / 2}) rotate(-90)`}
          fontSize={10}
          letterSpacing="0.02em"
          style={{
            fill: "var(--text-label)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {yLabel}
        </text>
      )}
    </svg>
  );
}
