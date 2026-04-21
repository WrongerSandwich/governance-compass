"use client";

import type { ClusterId, RegionKey } from "@/lib/study/types";
import type { WorldMapMode } from "./WorldMap";

export interface TransnationalTileProps {
  mode: WorldMapMode;
  count: number;
  className?: string;
}

const REGION_KEY: RegionKey = "diaspora_transnational";

// Density bin helper (matches WorldMap)
function densityBin(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count < 50) return 0;
  if (count < 90) return 1;
  if (count < 113) return 2;
  if (count < 134) return 3;
  return 4;
}

function clusterOpacity(share: number): number {
  if (share >= 0.3) return 1;
  if (share >= 0.25) return 0.8;
  return 0.6;
}

function axisFill(mean: number): string {
  if (mean >= 0.3) return "var(--axis-gradient-positive-strong)";
  if (mean >= 0.1) return "var(--axis-gradient-positive-mild)";
  if (mean >= -0.1) return "var(--axis-gradient-neutral)";
  if (mean >= -0.3) return "var(--axis-gradient-negative-mild)";
  return "var(--axis-gradient-negative-strong)";
}

export function TransnationalTile({
  mode,
  count,
  className = "",
}: TransnationalTileProps) {
  const isInteractive = mode.type === "interactive";
  const isSelected =
    isInteractive && mode.selectedRegion === REGION_KEY;

  // Compute fill
  let fill: string;
  let opacity = 1;
  let hatched = false;

  if (mode.type === "interactive" || mode.type === "static-density") {
    fill = `var(--map-density-${densityBin(count)})`;
  } else if (mode.type === "static-cluster") {
    const d = mode.dominantClusterByRegion[REGION_KEY];
    if (d) {
      fill = `var(--cluster-${d.cluster as ClusterId})`;
      opacity = clusterOpacity(d.share);
      hatched = d.share < 0.25;
    } else {
      fill = "var(--map-density-0)";
    }
  } else {
    const mean = mode.meanAxisByRegion[REGION_KEY];
    fill = mean !== undefined ? axisFill(mean) : "var(--map-density-0)";
  }

  // Build label
  const label = `Transnational (${count})`;

  // Build tooltip content
  let tooltipContent = label;
  if (mode.type === "interactive" || mode.type === "static-density") {
    const tops = mode.topArchetypesByRegion?.[REGION_KEY];
    if (tops?.length) {
      tooltipContent += `\nTop 3: ${tops.slice(0, 3).join(", ")}`;
    }
  } else if (mode.type === "static-cluster") {
    const d = mode.dominantClusterByRegion[REGION_KEY];
    if (d) {
      tooltipContent += `\nDominant: C${d.cluster} (${Math.round(d.share * 100)}%)`;
    }
  } else if (mode.type === "static-axis-gradient") {
    const mean = mode.meanAxisByRegion[REGION_KEY];
    if (mean !== undefined) {
      const sign = mean >= 0 ? "+" : "";
      tooltipContent += `\nMean axis ${mode.axis}: ${sign}${mean.toFixed(2)}`;
    }
  }

  const handleClick = () => {
    if (!isInteractive) return;
    if (mode.selectedRegion === REGION_KEY) {
      mode.onRegionSelect(null);
    } else {
      mode.onRegionSelect(REGION_KEY);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const hatchId = "transnational-hatch";

  return (
    <div
      className={`transnational-tile ${className}`}
      title={tooltipContent}
      aria-label={tooltipContent.replace(/\n/g, ", ")}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-selected={isInteractive ? isSelected : undefined}
      onClick={handleClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "6px",
        border: isSelected
          ? "1.5px solid var(--map-accent)"
          : "1px solid var(--map-border)",
        background: fill,
        opacity,
        cursor: isInteractive ? "pointer" : "default",
        padding: "0.5rem 0.75rem",
        fontSize: "var(--text-xs, 11px)",
        fontFamily: "var(--font-mono)",
        color: "var(--text-primary)",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        userSelect: "none",
        outline: isSelected ? `2px solid var(--map-accent)` : undefined,
        outlineOffset: isSelected ? "2px" : undefined,
      }}
    >
      {/* Hatch overlay for low-dominance cluster mode */}
      {hatched && (
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
          aria-hidden
        >
          <defs>
            <pattern
              id={hatchId}
              patternUnits="userSpaceOnUse"
              width="6"
              height="6"
              patternTransform="rotate(45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="6"
                stroke="var(--map-border)"
                strokeWidth="1"
                opacity="0.6"
              />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill={`url(#${hatchId})`}
            opacity="0.4"
          />
        </svg>
      )}
      <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
    </div>
  );
}
