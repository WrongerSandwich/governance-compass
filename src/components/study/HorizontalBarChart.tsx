"use client";

export interface HorizontalBarChartRow {
  label: string;
  value: number;
  color?: string;
  secondaryLabel?: string;
  emergenceTag?: string;
  /** If true and value === 0, render a faint dotted line across the bar area instead of a filled bar. */
  dottedIfZero?: boolean;
}

export interface HorizontalBarChartProps {
  rows: HorizontalBarChartRow[];
  diverging?: boolean;
  range?: [number, number];
  barHeight?: number;
  zeroLineColor?: string;
  /** Width reserved for the left-side label column, in SVG units.
   *  Default 140 works for most charts; increase when row labels are
   *  long (e.g. archetype names like "Authoritarian Traditionalist"). */
  labelWidth?: number;
  ariaLabel?: string;
  className?: string;
}

const SECONDARY_WIDTH = 44;
const BAR_AREA_WIDTH = 200;
const ROW_GAP = 6;
const PADDING_TOP = 8;

export function HorizontalBarChart({
  rows,
  diverging = false,
  range,
  barHeight = 24,
  zeroLineColor = "var(--border-secondary)",
  labelWidth = 140,
  ariaLabel,
  className,
}: HorizontalBarChartProps) {
  const LABEL_WIDTH = labelWidth;
  // Infer range if not provided
  const inferredRange: [number, number] = range ?? (() => {
    const values = rows.map((r) => r.value);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 0);
    return [min, max];
  })();

  const [rangeMin, rangeMax] = inferredRange;
  const rangeSpan = rangeMax - rangeMin || 1;

  const totalWidth = LABEL_WIDTH + BAR_AREA_WIDTH + SECONDARY_WIDTH;
  const rowStride = barHeight + ROW_GAP;
  const totalHeight = PADDING_TOP + rows.length * rowStride;

  // X position within bar area
  function valToX(val: number): number {
    return LABEL_WIDTH + ((val - rangeMin) / rangeSpan) * BAR_AREA_WIDTH;
  }

  // Zero X line position
  const zeroX = diverging ? valToX(0) : LABEL_WIDTH;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      style={{
        display: "block",
        width: "100%",
        maxWidth: `${totalWidth}px`,
        height: "auto",
      }}
      className={className}
      role="img"
      aria-label={ariaLabel ?? "Horizontal bar chart"}
    >
      <title>{ariaLabel ?? "Horizontal bar chart"}</title>

      {/* Zero / baseline line */}
      <line
        x1={zeroX}
        y1={PADDING_TOP}
        x2={zeroX}
        y2={totalHeight}
        stroke={zeroLineColor}
        strokeWidth={1}
        strokeDasharray={diverging ? "3 2" : undefined}
        opacity={0.6}
      />

      {rows.map((row, i) => {
        const y = PADDING_TOP + i * rowStride;
        const barY = y + rowStride / 2 - barHeight / 2;
        const defaultColor = row.color ?? "var(--stone-600)";

        // Bar x and width
        let barX: number;
        let barWidth: number;

        if (diverging) {
          const valueX = valToX(row.value);
          barX = Math.min(zeroX, valueX);
          barWidth = Math.abs(valueX - zeroX);
        } else {
          barX = LABEL_WIDTH;
          barWidth = ((row.value - rangeMin) / rangeSpan) * BAR_AREA_WIDTH;
        }

        return (
          <g key={i} role="group" aria-label={`${row.label}: ${row.value}`}>
            {/* Label */}
            <text
              x={LABEL_WIDTH - 8}
              y={barY + barHeight / 2}
              textAnchor="end"
              dominantBaseline="middle"
              style={{
                fontSize: "11px",
                fill: "var(--text-primary)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {row.label}
            </text>

            {/* Emergence tag — small italic text after label */}
            {row.emergenceTag && (
              <text
                x={LABEL_WIDTH - 8}
                y={barY + barHeight / 2 + 11}
                textAnchor="end"
                dominantBaseline="middle"
                style={{
                  fontSize: "9px",
                  fill: "var(--text-tertiary)",
                  fontFamily: "var(--font-sans)",
                  fontStyle: "italic",
                }}
              >
                {row.emergenceTag}
              </text>
            )}

            {/* Bar or dotted zero line */}
            {row.dottedIfZero && row.value === 0 ? (
              <line
                x1={LABEL_WIDTH}
                y1={barY + barHeight / 2}
                x2={LABEL_WIDTH + BAR_AREA_WIDTH}
                y2={barY + barHeight / 2}
                stroke={defaultColor}
                strokeWidth={1}
                strokeDasharray="3 4"
                opacity={0.4}
              />
            ) : (
              <rect
                x={barX}
                y={barY + 1}
                width={Math.max(barWidth, 0)}
                height={barHeight - 2}
                fill={defaultColor}
                fillOpacity={0.75}
                rx={1}
                aria-label={`${row.label}: ${row.value}`}
              />
            )}

            {/* Secondary label */}
            {row.secondaryLabel && (
              <text
                x={LABEL_WIDTH + BAR_AREA_WIDTH + 6}
                y={barY + barHeight / 2}
                dominantBaseline="middle"
                style={{
                  fontSize: "10px",
                  fill: "var(--text-tertiary)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {row.secondaryLabel}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
