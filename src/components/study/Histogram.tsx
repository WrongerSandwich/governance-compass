"use client";

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

export function Histogram({
  bins,
  range,
  xLabel,
  yLabel,
  height = 160,
  barColor = "var(--stone-600)",
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
              x={x + 3}
              y={PADDING.top + 8}
              style={{
                fontSize: "9px",
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
              style={{
                fontSize: "9px",
                fill: "var(--text-tertiary)",
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
          style={{
            fontSize: "10px",
            fill: "var(--text-secondary)",
            fontFamily: "var(--font-sans)",
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
          style={{
            fontSize: "10px",
            fill: "var(--text-secondary)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {yLabel}
        </text>
      )}
    </svg>
  );
}
