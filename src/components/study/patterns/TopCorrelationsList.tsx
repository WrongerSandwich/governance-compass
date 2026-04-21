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
        <span
          style={{
            flex: "1 1 0",
            fontSize: "9px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--text-tertiary)",
            fontFamily: "var(--font-sans)",
          }}
        >
          Axis pair
        </span>
        <span
          style={{
            width: "48px",
            fontSize: "9px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--text-tertiary)",
            fontFamily: "var(--font-mono)",
            textAlign: "right",
          }}
        >
          r
        </span>
        <span
          style={{
            width: `${BAR_MAX_WIDTH}px`,
            fontSize: "9px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--text-tertiary)",
            fontFamily: "var(--font-sans)",
          }}
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
              style={{
                flex: "1 1 0",
                fontSize: "11px",
                color: "var(--text-primary)",
                fontFamily: "var(--font-sans)",
                lineHeight: "1.3",
              }}
            >
              {labels[i]}{" "}
              <span style={{ color: "var(--text-tertiary)" }}>↔</span>{" "}
              {labels[j]}
            </span>

            {/* r value */}
            <span
              style={{
                width: "48px",
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
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
