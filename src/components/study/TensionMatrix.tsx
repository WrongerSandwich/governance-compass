"use client";

import { useState } from "react";

export interface TensionMatrixDatum {
  axis: number;           // 1..12
  cluster: 0 | 1 | 2 | 3 | 4 | 5 | "overall";
  model: "claude" | "gemini";
  pct: number;            // 0..100
}

export interface TensionMatrixProps {
  data: TensionMatrixDatum[];
  axisLabels: string[];
  clusterLabels: string[];
  cellSize?: number;
  onCellHover?: (axis: number, cluster: TensionMatrixDatum["cluster"], model: "claude" | "gemini", pct: number) => void;
  ariaLabel?: string;
  className?: string;
}

// 220, not 180: same as the ridge plot's gutter, and for the same reason —
// these are the full axis names in mono, and 180 clipped the longest two.
const AXIS_LABEL_WIDTH = 220;
const MODEL_LABEL_WIDTH = 44;
const COL_HEADER_HEIGHT = 44;
const MODEL_ROW_HEIGHT = 24;
// Axis group: two sub-rows (claude + gemini) + 6px gap between groups
const AXIS_GROUP_HEIGHT = MODEL_ROW_HEIGHT * 2 + 6;
const AXIS_GAP = 4;
// The column headers are rotated -45 and anchored at the start, so the last
// one ("Overall") runs up and to the RIGHT of the final column. 2 units of
// slack was already half a character short of holding it; in mono it is ten
// short, and an SVG root clips by default, so the tail just disappears.
const COL_HEADER_OVERHANG = 18;

const MODELS: Array<"claude" | "gemini"> = ["claude", "gemini"];

function pctToOpacity(pct: number): number {
  // 0% → 0.04 (almost invisible), 100% → 0.92
  return 0.04 + (pct / 100) * 0.88;
}

export function TensionMatrix({
  data,
  axisLabels,
  clusterLabels,
  cellSize = 24,
  onCellHover,
  ariaLabel,
  className,
}: TensionMatrixProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    label: string;
  } | null>(null);

  // Build lookup: (axis, cluster, model) → pct
  const lookup = new Map<string, number>();
  for (const d of data) {
    lookup.set(`${d.axis}-${d.cluster}-${d.model}`, d.pct);
  }

  function getPct(axis: number, cluster: TensionMatrixDatum["cluster"], model: "claude" | "gemini"): number {
    return lookup.get(`${axis}-${cluster}-${model}`) ?? 0;
  }

  const nAxes = axisLabels.length;
  const nClusters = clusterLabels.length;
  const colW = cellSize;

  const totalWidth =
    AXIS_LABEL_WIDTH + MODEL_LABEL_WIDTH + nClusters * colW + COL_HEADER_OVERHANG;
  const totalHeight = COL_HEADER_HEIGHT + nAxes * (AXIS_GROUP_HEIGHT + AXIS_GAP);

  function cellX(clusterIdx: number): number {
    return AXIS_LABEL_WIDTH + MODEL_LABEL_WIDTH + clusterIdx * colW;
  }

  function axisGroupTopY(axisIdx: number): number {
    return COL_HEADER_HEIGHT + axisIdx * (AXIS_GROUP_HEIGHT + AXIS_GAP);
  }

  function modelRowY(axisIdx: number, modelIdx: number): number {
    return axisGroupTopY(axisIdx) + modelIdx * MODEL_ROW_HEIGHT;
  }

  function handleMouseEnter(
    axis: number,
    cluster: TensionMatrixDatum["cluster"],
    model: "claude" | "gemini",
    pct: number,
    svgX: number,
    svgY: number
  ) {
    if (onCellHover) onCellHover(axis, cluster, model, pct);
    setTooltip({
      x: svgX,
      y: svgY,
      label: `${axisLabels[axis - 1]} / ${cluster === "overall" ? "overall" : clusterLabels[cluster as number]} / ${model}: ${pct}%`,
    });
  }

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      style={{
        display: "block",
        width: "100%",
        maxWidth: `${totalWidth}px`,
        height: "auto",
        margin: "0 auto",
      }}
      className={className}
      role="img"
      aria-label={ariaLabel ?? "Tension matrix"}
      onMouseLeave={() => setTooltip(null)}
    >
      <title>{ariaLabel ?? "Tension matrix"}</title>

      {/* Column headers */}
      {clusterLabels.map((label, ci) => {
        const x = cellX(ci) + colW / 2;
        return (
          <text
            key={ci}
            x={0}
            y={0}
            transform={`translate(${x}, ${COL_HEADER_HEIGHT - 4}) rotate(-45)`}
            textAnchor="start"
            fontSize={11}
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

      {/* Rows: one axis group = two sub-rows (claude, gemini) */}
      {axisLabels.map((axisLabel, ai) => {
        const groupTopY = axisGroupTopY(ai);
        const axisNum = ai + 1;

        return (
          <g key={ai}>
            {/* Axis label (centered over two sub-rows) */}
            <text
              x={AXIS_LABEL_WIDTH - 6}
              y={groupTopY + AXIS_GROUP_HEIGHT / 2}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={12}
              letterSpacing="0.02em"
              style={{
                fill: "var(--text-label)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {axisLabel}
            </text>

            {/* Model sub-rows */}
            {MODELS.map((model, mi) => {
              const rowY = modelRowY(ai, mi);
              const modelLabel = model === "claude" ? "C" : "G";
              const modelColor = `var(--model-${model})`;

              return (
                <g key={model}>
                  {/* Model sub-label */}
                  <text
                    x={AXIS_LABEL_WIDTH + MODEL_LABEL_WIDTH - 6}
                    y={rowY + MODEL_ROW_HEIGHT / 2}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize={10}
                    letterSpacing="0.02em"
                    style={{
                      fill: modelColor,
                      fontFamily: "var(--font-mono)",
                      fontStyle: "italic",
                    }}
                  >
                    {modelLabel}
                  </text>

                  {/* Cells */}
                  {clusterLabels.map((_clLabel, ci) => {
                    const clusterKey: TensionMatrixDatum["cluster"] = ci === 6 ? "overall" : (ci as 0 | 1 | 2 | 3 | 4 | 5);
                    const cluster = clusterKey;
                    const pct = getPct(axisNum, cluster, model);
                    const opacity = pctToOpacity(pct);
                    const cx = cellX(ci);

                    return (
                      <g
                        key={ci}
                        onMouseEnter={() =>
                          handleMouseEnter(axisNum, cluster, model, pct, cx + colW / 2, rowY)
                        }
                        style={{ cursor: "default" }}
                      >
                        <rect
                          x={cx}
                          y={rowY}
                          width={colW - 1}
                          height={MODEL_ROW_HEIGHT - 1}
                          fill="var(--warning-text)"
                          fillOpacity={opacity}
                          rx={1}
                          aria-label={`Axis ${axisNum} ${model} cluster ${ci}: ${pct}%`}
                        />
                        {pct >= 30 && (
                          <text
                            x={cx + colW / 2}
                            y={rowY + MODEL_ROW_HEIGHT / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={9}
                            letterSpacing="0.02em"
                            style={{
                              fill: "var(--surface-1)",
                              fontFamily: "var(--font-mono)",
                              pointerEvents: "none",
                            }}
                          >
                            {pct}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* Separator between axis groups */}
            {ai < nAxes - 1 && (
              <line
                x1={AXIS_LABEL_WIDTH}
                y1={groupTopY + AXIS_GROUP_HEIGHT + AXIS_GAP / 2}
                x2={totalWidth}
                y2={groupTopY + AXIS_GROUP_HEIGHT + AXIS_GAP / 2}
                stroke="var(--border-secondary)"
                strokeWidth={0.5}
                opacity={0.4}
              />
            )}
          </g>
        );
      })}

      {/* Tooltip */}
      {tooltip && (
        <g style={{ pointerEvents: "none" }}>
          <rect
            x={Math.min(tooltip.x + 4, totalWidth - 244)}
            y={Math.max(tooltip.y - 26, 4)}
            width={240}
            height={22}
            rx={2}
            fill="var(--stone-900)"
            fillOpacity={0.9}
          />
          <text
            x={Math.min(tooltip.x + 10, totalWidth - 238)}
            y={Math.max(tooltip.y - 12, 18)}
            dominantBaseline="middle"
            fontSize={11}
            letterSpacing="0.02em"
            style={{
              fill: "var(--stone-50)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {tooltip.label}
          </text>
        </g>
      )}
    </svg>
  );
}
