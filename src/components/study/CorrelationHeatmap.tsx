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

const LABEL_PAD = 56; // space for rotated bottom labels and left labels
const FONT_SIZE = 9;

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
  const n = labels.length;
  const gridSize = n * cellSize;

  // SVG viewBox: left labels + grid + bottom labels (rotated, need extra height)
  const svgW = LABEL_PAD + gridSize;
  const svgH = LABEL_PAD + gridSize;

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
          x={LABEL_PAD - 6}
          y={LABEL_PAD + row * cellSize + cellSize / 2}
          textAnchor="end"
          dominantBaseline="middle"
          style={{
            fontSize: `${FONT_SIZE}px`,
            fill: "var(--text-secondary)",
            fontFamily: "var(--font-sans)",
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
          transform={`translate(${LABEL_PAD + col * cellSize + cellSize / 2}, ${LABEL_PAD + gridSize + 6}) rotate(-45)`}
          style={{
            fontSize: `${FONT_SIZE}px`,
            fill: "var(--text-secondary)",
            fontFamily: "var(--font-sans)",
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

          const x = LABEL_PAD + col * cellSize;
          const y = LABEL_PAD + row * cellSize;
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
                  style={{
                    fontSize: "8px",
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
