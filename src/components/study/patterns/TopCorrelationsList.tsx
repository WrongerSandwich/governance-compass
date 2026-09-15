"use client";

export interface TopCorrelationsListProps {
  matrix: number[][];
  labels: string[];
  n?: number;
}

interface CorrelationPair {
  i: number;
  j: number;
  r: number;
}

function getTopPairs(matrix: number[][], n: number): CorrelationPair[] {
  const pairs: CorrelationPair[] = [];
  for (let i = 0; i < matrix.length; i++) {
    for (let j = i + 1; j < matrix[i].length; j++) {
      pairs.push({ i, j, r: matrix[i][j] });
    }
  }
  pairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  return pairs.slice(0, n);
}

const BAR_MAX_WIDTH = 72;

export function TopCorrelationsList({
  matrix,
  labels,
  n = 10,
}: TopCorrelationsListProps) {
  const pairs = getTopPairs(matrix, n);

  return (
    <div className="space-y-1">
      {/* Header row */}
      <div
        className="flex items-center gap-2 pb-2"
        style={{
          borderBottom: "1px solid var(--border-secondary)",
          marginBottom: "4px",
        }}
      >
        <span className="label text-text-label" style={{ flex: "1 1 0" }}>
          Axis pair
        </span>
        <span
          className="label text-text-label"
          style={{ width: "48px", textAlign: "right" }}
        >
          r
        </span>
        <span
          className="label text-text-label"
          style={{ width: `${BAR_MAX_WIDTH}px` }}
        >
          magnitude
        </span>
      </div>

      {pairs.map(({ i, j, r }, idx) => {
        const absR = Math.abs(r);
        const barWidth = absR * BAR_MAX_WIDTH;
        const isPositive = r >= 0;
        const barColor = isPositive
          ? "var(--axis-gradient-positive-strong)"
          : "var(--axis-gradient-negative-strong)";

        return (
          <div
            key={idx}
            className="flex items-center gap-2 py-1"
            style={{
              borderBottom: "1px solid var(--border-secondary)",
              borderBottomStyle: "dashed",
            }}
          >
            {/* Pair label */}
            <span
              className="body-xs text-text-primary"
              style={{ flex: "1 1 0" }}
            >
              {labels[i]}{" "}
              <span className="text-text-label">↔</span>{" "}
              {labels[j]}
            </span>

            {/* r value */}
            <span
              className="mono-meta"
              style={{
                width: "48px",
                color: isPositive
                  ? "var(--axis-gradient-positive-strong)"
                  : "var(--axis-gradient-negative-strong)",
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {r > 0 ? "+" : ""}
              {r.toFixed(2)}
            </span>

            {/* Bar */}
            <div
              style={{
                width: `${BAR_MAX_WIDTH}px`,
                height: "8px",
                backgroundColor: "var(--surface-2)",
                borderRadius: "2px",
                flexShrink: 0,
                overflow: "hidden",
              }}
              aria-label={`Magnitude: ${absR.toFixed(2)}`}
            >
              <div
                style={{
                  width: `${barWidth}px`,
                  height: "100%",
                  backgroundColor: barColor,
                  borderRadius: "2px",
                  opacity: 0.8,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
