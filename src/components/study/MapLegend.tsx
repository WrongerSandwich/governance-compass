"use client";

import type { ClusterId } from "@/lib/study/types";
import { CLUSTERS } from "@/data/syntheticStudyClusters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MapLegendProps =
  | {
      variant: "density";
      /** Four upper bounds for 5 bins: [49, 89, 112, 133] → bins [<50, 50-89, 90-112, 113-133, 134+] */
      breakpoints: [number, number, number, number];
    }
  | {
      variant: "cluster";
      clusterIds: readonly ClusterId[];
      /** Optional override for short descriptor text */
      descriptorFn?: (id: ClusterId) => string;
    }
  | {
      variant: "axis-gradient";
      lowLabel: string;
      highLabel: string;
      min: number;
      max: number;
    };

// ---------------------------------------------------------------------------
// Axis-gradient fills (same as WorldMap)
// Five bins from negative to positive
// ---------------------------------------------------------------------------
const AXIS_GRADIENT_SWATCHES: Array<{ fill: string; label?: string }> = [
  { fill: "var(--axis-gradient-negative-strong)" },
  { fill: "var(--axis-gradient-negative-mild)" },
  { fill: "var(--axis-gradient-neutral)" },
  { fill: "var(--axis-gradient-positive-mild)" },
  { fill: "var(--axis-gradient-positive-strong)" },
];

// ---------------------------------------------------------------------------
// Density fills (5 bins)
// ---------------------------------------------------------------------------
const DENSITY_VARS = [
  "var(--map-density-0)",
  "var(--map-density-1)",
  "var(--map-density-2)",
  "var(--map-density-3)",
  "var(--map-density-4)",
] as const;

// ---------------------------------------------------------------------------
// Swatch component
// ---------------------------------------------------------------------------
function Swatch({
  fill,
  label,
  sublabel,
}: {
  fill: string;
  label?: string;
  sublabel?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 24,
          height: 16,
          borderRadius: 3,
          background: fill,
          border: "1px solid var(--map-border)",
          flexShrink: 0,
        }}
        aria-hidden
      />
      {label && (
        <span
          style={{
            fontSize: "var(--text-xs, 10px)",
            fontFamily: "var(--font-mono)",
            color: "var(--text-secondary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 72,
          }}
        >
          {label}
        </span>
      )}
      {sublabel && (
        <span
          style={{
            fontSize: "var(--text-xs, 10px)",
            fontFamily: "var(--font-sans)",
            color: "var(--text-tertiary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 80,
          }}
        >
          {sublabel}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MapLegend component
// ---------------------------------------------------------------------------
export function MapLegend(props: MapLegendProps) {
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    gap: "12px",
    alignItems: "flex-start",
    flexWrap: "wrap",
    padding: "8px 0",
    overflowX: "auto",
  };

  if (props.variant === "density") {
    const [b0, b1, b2, b3] = props.breakpoints;
    const rangeLabels = [
      `< ${b0 + 1}`,
      `${b0 + 1}–${b1}`,
      `${b1 + 1}–${b2}`,
      `${b2 + 1}–${b3}`,
      `${b3 + 1}+`,
    ];
    return (
      <div
        style={containerStyle}
        aria-label="Persona density legend"
        role="img"
      >
        {DENSITY_VARS.map((fill, i) => (
          <Swatch key={i} fill={fill} label={rangeLabels[i]} sublabel="personas" />
        ))}
      </div>
    );
  }

  if (props.variant === "cluster") {
    const { clusterIds, descriptorFn } = props;
    return (
      <div
        style={containerStyle}
        aria-label="Cluster color legend"
        role="img"
      >
        {clusterIds.map((id) => {
          const cluster = CLUSTERS.find((c) => c.id === id);
          if (!cluster) return null;
          const code = cluster.code;
          // Build short descriptor: up to 4–5 words from label
          const rawLabel = descriptorFn ? descriptorFn(id) : cluster.label;
          // Strip leading "Toward " and truncate to ~5 words
          const words = rawLabel.replace(/^[Tt]oward\s+/i, "").split(/\s+/);
          const shortLabel = words.slice(0, 4).join(" ");
          return (
            <Swatch
              key={id}
              fill={`var(--cluster-${id})`}
              label={code}
              sublabel={shortLabel}
            />
          );
        })}
      </div>
    );
  }

  // axis-gradient
  const { lowLabel, highLabel } = props;
  return (
    <div
      style={containerStyle}
      aria-label={`Axis gradient legend: ${lowLabel} to ${highLabel}`}
      role="img"
    >
      <span
        style={{
          fontSize: "var(--text-xs, 10px)",
          fontFamily: "var(--font-mono)",
          color: "var(--text-tertiary)",
          alignSelf: "center",
          whiteSpace: "nowrap",
        }}
      >
        ← {lowLabel}
      </span>
      {AXIS_GRADIENT_SWATCHES.map((s, i) => (
        <Swatch key={i} fill={s.fill} />
      ))}
      <span
        style={{
          fontSize: "var(--text-xs, 10px)",
          fontFamily: "var(--font-mono)",
          color: "var(--text-tertiary)",
          alignSelf: "center",
          whiteSpace: "nowrap",
        }}
      >
        {highLabel} →
      </span>
    </div>
  );
}
