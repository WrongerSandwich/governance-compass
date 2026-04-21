"use client";

export interface RidgeSeries {
  label: string;
  bins: number[];
  mean?: number;
  domainColor?: string;
}

export interface ViolinOrRidgeProps {
  series: RidgeSeries[];
  range: [number, number];
  ridgeHeight?: number;
  className?: string;
}

const LABEL_WIDTH = 100;
const PLOT_WIDTH = 240;
const OVERLAP = 8; // px of vertical overlap between adjacent ridges

/**
 * Ridge plot: each series is a filled area strip based on histogram bins.
 * Bins are normalized to the max count within that series.
 * Adjacent ridges overlap slightly (the "ridge" signature).
 */
export function ViolinOrRidge({
  series,
  range,
  ridgeHeight = 48,
  className,
}: ViolinOrRidgeProps) {
  const n = series.length;
  const svgWidth = LABEL_WIDTH + PLOT_WIDTH + 12;
  // Each series center is spaced `ridgeHeight` apart but overlaps OVERLAP px
  const stride = ridgeHeight - OVERLAP;
  const svgHeight = stride * n + OVERLAP + 24; // 24 = x-axis label space

  function xToSvg(val: number): number {
    return LABEL_WIDTH + ((val - range[0]) / (range[1] - range[0])) * PLOT_WIDTH;
  }

  const zeroX = xToSvg(0);

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      width={svgWidth}
      height={svgHeight}
      className={className}
      aria-hidden="true"
    >
      {/* Zero reference line */}
      <line
        x1={zeroX}
        y1={0}
        x2={zeroX}
        y2={svgHeight - 20}
        stroke="var(--border-primary)"
        strokeWidth={0.75}
        strokeDasharray="3 2"
        opacity={0.4}
      />

      {/* X axis ticks at range endpoints and 0 */}
      {[range[0], 0, range[1]].map((t) => {
        const x = xToSvg(t);
        return (
          <g key={t}>
            <line
              x1={x}
              y1={svgHeight - 20}
              x2={x}
              y2={svgHeight - 16}
              stroke="var(--border-primary)"
              strokeWidth={0.75}
            />
            <text
              x={x}
              y={svgHeight - 8}
              textAnchor="middle"
              style={{
                fontSize: "9px",
                fill: "var(--text-tertiary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {t % 1 === 0 ? t.toString() : t.toFixed(1)}
            </text>
          </g>
        );
      })}

      {series.map((s, idx) => {
        const nBins = s.bins.length;
        if (nBins === 0) return null;

        const maxBin = Math.max(...s.bins, 1);
        // Center Y for this ridge
        const centerY = idx * stride + ridgeHeight / 2;
        const halfH = ridgeHeight * 0.42; // max amplitude

        const fillColor = s.domainColor ?? "var(--stone-600)";

        // Build SVG path: left to right along bins, then back along the baseline
        // Each bin maps to a point at its center x, y = centerY - normalized * halfH
        const points: Array<[number, number]> = s.bins.map((count, bi) => {
          const fraction = (bi + 0.5) / nBins;
          const xVal = range[0] + fraction * (range[1] - range[0]);
          const x = xToSvg(xVal);
          const y = centerY - (count / maxBin) * halfH;
          return [x, y];
        });

        // Build a smooth path using simple linear interpolation (connects bin centers)
        const startX = xToSvg(range[0]);
        const endX = xToSvg(range[1]);
        const baseY = centerY;

        let d = `M ${startX} ${baseY}`;
        // Move to first point
        if (points.length > 0) {
          d += ` L ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
          for (let pi = 1; pi < points.length; pi++) {
            d += ` L ${points[pi][0].toFixed(1)} ${points[pi][1].toFixed(1)}`;
          }
        }
        d += ` L ${endX} ${baseY} Z`;

        // Mean annotation
        const meanX = s.mean != null ? xToSvg(s.mean) : null;

        return (
          <g key={idx}>
            {/* Ridge area */}
            <path
              d={d}
              fill={fillColor}
              fillOpacity={0.35}
              stroke={fillColor}
              strokeOpacity={0.7}
              strokeWidth={1}
            />

            {/* Mean dot */}
            {meanX != null && (
              <>
                <circle
                  cx={meanX}
                  cy={centerY - 4}
                  r={2.5}
                  fill={fillColor}
                  fillOpacity={0.9}
                />
                <text
                  x={meanX + 4}
                  y={centerY - 4}
                  dominantBaseline="middle"
                  style={{
                    fontSize: "8px",
                    fill: fillColor,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {s.mean!.toFixed(2)}
                </text>
              </>
            )}

            {/* Series label */}
            <text
              x={LABEL_WIDTH - 6}
              y={centerY}
              textAnchor="end"
              dominantBaseline="middle"
              style={{
                fontSize: "10px",
                fill: "var(--text-secondary)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {s.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
