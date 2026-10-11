"use client";

export interface CorrelationHeatmapProps {
  matrix: number[][];
  labels: string[];
  cellSize?: number;
  lowerTriangleOnly?: boolean;
  onCellHover?: (row: number, col: number, value: number) => void;
  ariaLabel?: string;
  className?: string;
}

const FONT_SIZE = 11;
/** Clearance between a label's end and the grid edge it reads against. */
const LABEL_GAP = 6;
/** Breathing room past the extent of the outermost label on each side. */
const EDGE_PAD = 4;
/** Mono advance is ~0.6em; the labels add 0.02em of tracking. */
const CHAR_WIDTH = FONT_SIZE * 0.62;
const SIN_45 = Math.SQRT1_2;

export interface HeatmapGeometry {
  /** Width reserved for the right-aligned row labels. */
  leftPad: number;
  /** Height above the grid: the first row label is centred on its row. */
  topPad: number;
  /** Height reserved for the 45° column labels hanging below the grid. */
  bottomPad: number;
  gridSize: number;
  svgW: number;
  svgH: number;
}

/**
 * Sizes the SVG around its labels rather than around a fixed pad. The shipped
 * constant reserved 64 units on the top and left and nothing below, so the
 * column labels — placed 6 units under the grid — fell outside the viewBox
 * and were clipped away, while the 64 units above the grid sat empty.
 */
export function heatmapGeometry(labels: readonly string[], cellSize: number): HeatmapGeometry {
  const gridSize = labels.length * cellSize;
  const longest = labels.reduce((max, label) => Math.max(max, label.length), 0) * CHAR_WIDTH;
  const leftPad = Math.ceil(longest + LABEL_GAP + EDGE_PAD);
  const topPad = EDGE_PAD;
  // A label rotated 45° and anchored at its end hangs down and to the left
  // of the anchor; its vertical extent is the projection of its width plus
  // its own glyph height.
  const bottomPad = Math.ceil(LABEL_GAP + (longest + FONT_SIZE) * SIN_45 + EDGE_PAD);
  return {
    leftPad,
    topPad,
    bottomPad,
    gridSize,
    svgW: leftPad + gridSize + EDGE_PAD,
    svgH: topPad + gridSize + bottomPad,
  };
}

/**
 * Map a correlation value [-1,1] to one of the 5 axis-gradient CSS vars.
 * Bins: ≤-0.4, -0.4 to -0.15, -0.15 to 0.15, 0.15 to 0.4, ≥0.4
 */
function corrToColor(v: number): string {
  if (v <= -0.4) return "var(--axis-gradient-negative-strong)";
  if (v < -0.15) return "var(--axis-gradient-negative-mild)";
  if (v <= 0.15) return "var(--axis-gradient-neutral)";
  if (v < 0.4) return "var(--axis-gradient-positive-mild)";
  return "var(--axis-gradient-positive-strong)";
}

export function CorrelationHeatmap({
  matrix,
  labels,
  cellSize = 28,
  lowerTriangleOnly = true,
  onCellHover,
  ariaLabel,
  className,
}: CorrelationHeatmapProps) {
  const { leftPad, topPad, gridSize, svgW, svgH } = heatmapGeometry(labels, cellSize);

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{
        display: "block",
        width: "100%",
        maxWidth: `${svgW}px`,
        height: "auto",
        margin: "0 auto",
      }}
      className={className}
      role="img"
      aria-label={ariaLabel ?? "Correlation heatmap"}
    >
      <title>{ariaLabel ?? "Correlation heatmap"}</title>

      {/* Left axis labels */}
      {labels.map((label, row) => (
        <text
          key={`left-${row}`}
          x={leftPad - LABEL_GAP}
          y={topPad + row * cellSize + cellSize / 2}
          textAnchor="end"
          dominantBaseline="middle"
          fontSize={FONT_SIZE}
          letterSpacing="0.02em"
          style={{
            fill: "var(--text-label)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {label}
        </text>
      ))}

      {/* Bottom axis labels (rotated 45°) */}
      {labels.map((label, col) => (
        <text
          key={`bottom-${col}`}
          x={0}
          y={0}
          textAnchor="end"
          dominantBaseline="middle"
          transform={`translate(${leftPad + col * cellSize + cellSize / 2}, ${topPad + gridSize + LABEL_GAP}) rotate(-45)`}
          fontSize={FONT_SIZE}
          letterSpacing="0.02em"
          style={{
            fill: "var(--text-label)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {label}
        </text>
      ))}

      {/* Cells */}
      {matrix.map((rowArr, row) =>
        rowArr.map((value, col) => {
          // For lower triangle only, skip upper triangle and diagonal
          if (lowerTriangleOnly && col >= row) return null;

          const x = leftPad + col * cellSize;
          const y = topPad + row * cellSize;
          const fill = corrToColor(value);
          const showText = Math.abs(value) >= 0.4;

          return (
            <g
              key={`${row}-${col}`}
              onMouseEnter={onCellHover ? () => onCellHover(row, col, value) : undefined}
              style={{ cursor: onCellHover ? "pointer" : undefined }}
            >
              <rect
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                fill={fill}
                stroke="var(--surface-1)"
                strokeWidth={0.5}
                aria-label={`${labels[row]} × ${labels[col]}: ${value.toFixed(2)}`}
              />
              {showText && (
                <text
                  x={x + cellSize / 2}
                  y={y + cellSize / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={10}
                  letterSpacing="0.02em"
                  style={{
                    fill: "var(--surface-1)",
                    fontFamily: "var(--font-mono)",
                    pointerEvents: "none",
                  }}
                >
                  {value.toFixed(2)}
                </text>
              )}
            </g>
          );
        })
      )}
    </svg>
  );
}
