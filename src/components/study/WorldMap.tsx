"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import type { ClusterId, CountryAggregate, RegionKey } from "@/lib/study/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WorldMapMode =
  | {
      type: "interactive";
      selectedRegion: RegionKey | null;
      onRegionSelect: (r: RegionKey | null) => void;
      regionCounts: Record<RegionKey, number>;
      topArchetypesByRegion?: Partial<Record<RegionKey, string[]>>;
      countryAggregates?: CountryAggregate[];
    }
  | {
      type: "static-density";
      regionCounts: Record<RegionKey, number>;
      topArchetypesByRegion?: Partial<Record<RegionKey, string[]>>;
      countryAggregates?: CountryAggregate[];
    }
  | {
      type: "static-cluster";
      dominantClusterByRegion: Partial<
        Record<RegionKey, { cluster: ClusterId; share: number }>
      >;
    }
  | {
      type: "static-axis-gradient";
      axis: number;
      meanAxisByRegion: Partial<Record<RegionKey, number>>;
      lowLabel: string;
      highLabel: string;
    };

export interface WorldMapProps {
  mode: WorldMapMode;
  className?: string;
}

// ---------------------------------------------------------------------------
// Tooltip state
// ---------------------------------------------------------------------------
interface TooltipState {
  x: number;
  y: number;
  content: string;
}

// ---------------------------------------------------------------------------
// Region display names
// ---------------------------------------------------------------------------
const REGION_DISPLAY: Record<RegionKey, string> = {
  western_europe: "Western Europe",
  eastern_europe_central_asia: "Eastern Europe / Central Asia",
  east_asia: "East Asia",
  latin_america: "Latin America",
  middle_east_north_africa: "Middle East & North Africa",
  sub_saharan_africa: "Sub-Saharan Africa",
  north_america: "North America",
  south_southeast_asia: "South / Southeast Asia",
  oceania_small_states: "Oceania & Small States",
  diaspora_transnational: "Transnational (Diaspora)",
};

// ---------------------------------------------------------------------------
// Density bin helper
// Fixed breakpoints: [<50, 50–89, 90–112, 113–133, 134+]
// ---------------------------------------------------------------------------
function densityBin(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count < 50) return 0;
  if (count < 90) return 1;
  if (count < 113) return 2;
  if (count < 134) return 3;
  return 4;
}

function densityFill(count: number): string {
  return `var(--map-density-${densityBin(count)})`;
}

// ---------------------------------------------------------------------------
// Axis-gradient bin helper — 5 bins centered on 0
// Warm (clay/terracotta) for positive, cool (slate) for negative
// ---------------------------------------------------------------------------
function axisFill(mean: number): string {
  if (mean >= 0.3) return "var(--color-clay-600, #8B5E3C)";
  if (mean >= 0.1) return "var(--color-clay-400, #B8836B)";
  if (mean >= -0.1) return "var(--map-density-1)";
  if (mean >= -0.3) return "var(--color-slate-400, #8BA3B0)";
  return "var(--color-slate-600, #5B7A8A)";
}

// ---------------------------------------------------------------------------
// Cluster fill + opacity + hatching
// ---------------------------------------------------------------------------
function clusterFillStyle(
  clusterId: ClusterId,
  share: number
): { fill: string; opacity: number; hatched: boolean } {
  const fill = `var(--cluster-${clusterId})`;
  if (share >= 0.3) return { fill, opacity: 1, hatched: false };
  if (share >= 0.25) return { fill, opacity: 0.8, hatched: false };
  return { fill, opacity: 0.6, hatched: true };
}

// ---------------------------------------------------------------------------
// Build tooltip content per mode
// ---------------------------------------------------------------------------
function buildTooltip(
  region: RegionKey,
  mode: WorldMapMode,
  _count?: number
): string {
  const name = REGION_DISPLAY[region];
  switch (mode.type) {
    case "interactive":
    case "static-density": {
      const count = mode.regionCounts[region] ?? 0;
      const tops = mode.topArchetypesByRegion?.[region];
      const topLine = tops?.length ? `Top 3: ${tops.slice(0, 3).join(", ")}` : "";
      return [name, `${count} personas`, topLine].filter(Boolean).join("\n");
    }
    case "static-cluster": {
      const d = mode.dominantClusterByRegion[region];
      if (!d) return `${name}\nNo dominant cluster`;
      return `${name}\nDominant: C${d.cluster} (${Math.round(d.share * 100)}%)`;
    }
    case "static-axis-gradient": {
      const mean = mode.meanAxisByRegion[region];
      if (mean === undefined) return `${name}\nNo data`;
      const sign = mean >= 0 ? "+" : "";
      return `${name}\nMean axis ${mode.axis}: ${sign}${mean.toFixed(2)}`;
    }
  }
}

// ---------------------------------------------------------------------------
// WorldMap component
// ---------------------------------------------------------------------------
export function WorldMap({ mode, className = "" }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [mobileTooltip, setMobileTooltip] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Escape key clears selection in interactive mode
  useEffect(() => {
    if (mode.type !== "interactive") return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        mode.onRegionSelect(null);
        setTooltip(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mode]);

  const handleMouseEnter = useCallback(
    (region: RegionKey, e: React.MouseEvent) => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      const content = buildTooltip(region, mode);
      setTooltip({ x: e.clientX, y: e.clientY, content });
    },
    [mode]
  );

  const handleMouseMove = useCallback(
    (_region: RegionKey, e: React.MouseEvent) => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = setTimeout(() => {
        setTooltip((prev) =>
          prev ? { ...prev, x: e.clientX, y: e.clientY } : prev
        );
      }, 16);
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    setTooltip(null);
  }, []);

  const handleClick = useCallback(
    (region: RegionKey, e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if (mode.type !== "interactive") {
        // Mobile tap-to-peek on static modes
        setMobileTooltip(buildTooltip(region, mode));
        return;
      }
      if (mode.selectedRegion === region) {
        mode.onRegionSelect(null);
      } else {
        mode.onRegionSelect(region);
      }
      // Mobile tooltip for interactive mode too
      setMobileTooltip(buildTooltip(region, mode));
    },
    [mode]
  );

  const handleKeyDown = useCallback(
    (region: RegionKey, e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (mode.type === "interactive") {
          if (mode.selectedRegion === region) {
            mode.onRegionSelect(null);
          } else {
            mode.onRegionSelect(region);
          }
        }
      }
    },
    [mode]
  );

  // Build aria-description for the whole map
  const ariaDescription = (() => {
    if (mode.type === "interactive" || mode.type === "static-density") {
      const total = Object.values(mode.regionCounts).reduce(
        (a: number, b: number) => a + b,
        0
      );
      const densest = Object.entries(mode.regionCounts).sort(
        ([, a], [, b]) => b - a
      )[0];
      return `World map showing persona density across 9 geographic regions plus a transnational tile. Total: ${total} personas. Densest region: ${densest ? REGION_DISPLAY[densest[0] as RegionKey] : "unknown"} (${densest?.[1] ?? 0} personas). Includes transnational tile.`;
    }
    if (mode.type === "static-cluster") {
      return "World map showing dominant cluster by region. Includes transnational tile.";
    }
    if (mode.type === "static-axis-gradient") {
      return `World map showing mean axis ${mode.axis} scores by region.`;
    }
    return "World map";
  })();

  // Hatch pattern id
  const hatchId = "map-hatch";

  return (
    <div className={`worldmap-wrapper ${className}`}>
      {/* SVG Map */}
      <div
        className="worldmap-svg-container"
        style={{ position: "relative" }}
        onClick={() => {
          // Clicking map background clears selection
          if (mode.type === "interactive" && mode.selectedRegion !== null) {
            mode.onRegionSelect(null);
          }
          setMobileTooltip(null);
        }}
      >
        <ComposableMap
          projection="geoNaturalEarth1"
          width={820}
          height={410}
          role="img"
          aria-label="World map"
          aria-description={ariaDescription}
          style={{ width: "100%", height: "auto" }}
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

          <Geographies geography="/geo/world-regions-110m.json">
            {({ geographies }) =>
              geographies.map((geo) => {
                const region = geo.properties?.region as RegionKey | undefined;
                if (!region) return null;

                const isInteractive = mode.type === "interactive";
                const isSelected =
                  isInteractive && mode.selectedRegion === region;
                const hasSelection =
                  isInteractive && mode.selectedRegion !== null;
                const isDimmed = hasSelection && !isSelected;

                // Compute fill
                let fill: string;
                let fillOpacity = 1;
                let hatched = false;

                if (mode.type === "interactive" || mode.type === "static-density") {
                  const count = mode.regionCounts[region] ?? 0;
                  fill = densityFill(count);
                } else if (mode.type === "static-cluster") {
                  const d = mode.dominantClusterByRegion[region];
                  if (d) {
                    const style = clusterFillStyle(d.cluster, d.share);
                    fill = style.fill;
                    fillOpacity = style.opacity;
                    hatched = style.hatched;
                  } else {
                    fill = "var(--map-density-0)";
                  }
                } else {
                  // axis-gradient
                  const mean = mode.meanAxisByRegion[region];
                  fill = mean !== undefined ? axisFill(mean) : "var(--map-density-0)";
                }

                // Compute aria-label
                let ariaLabel = REGION_DISPLAY[region];
                if (mode.type === "interactive" || mode.type === "static-density") {
                  const count = mode.regionCounts[region] ?? 0;
                  const tops = mode.topArchetypesByRegion?.[region];
                  ariaLabel += `, ${count} personas`;
                  if (tops?.[0]) ariaLabel += `, ${tops[0]}`;
                } else if (mode.type === "static-cluster") {
                  const d = mode.dominantClusterByRegion[region];
                  if (d) ariaLabel += `, C${d.cluster} dominant at ${Math.round(d.share * 100)}%`;
                } else {
                  const mean = mode.meanAxisByRegion[region];
                  if (mean !== undefined) ariaLabel += `, axis ${mode.axis} mean: ${mean.toFixed(2)}`;
                }

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    tabIndex={isInteractive ? 0 : -1}
                    aria-label={ariaLabel}
                    aria-selected={isInteractive ? isSelected : undefined}
                    role={isInteractive ? "button" : undefined}
                    style={{
                      default: {
                        fill: hatched ? `url(#${hatchId})` : fill,
                        stroke: "var(--map-border)",
                        strokeWidth: 0.5,
                        outline: "none",
                        opacity: isDimmed ? 0.4 : fillOpacity,
                      },
                      hover: {
                        fill: isInteractive ? "var(--map-hover)" : fill,
                        stroke: isInteractive ? "var(--map-accent)" : "var(--map-border)",
                        strokeWidth: isInteractive ? 1 : 0.5,
                        outline: "none",
                        opacity: isDimmed ? 0.4 : fillOpacity,
                        cursor: isInteractive ? "pointer" : "default",
                      },
                      pressed: {
                        fill: "var(--map-hover)",
                        stroke: "var(--map-accent)",
                        strokeWidth: 1.5,
                        outline: "none",
                      },
                    }}
                    onMouseEnter={(e: React.MouseEvent) =>
                      handleMouseEnter(region, e)
                    }
                    onMouseMove={(e: React.MouseEvent) =>
                      handleMouseMove(region, e)
                    }
                    onMouseLeave={handleMouseLeave}
                    onClick={(e: React.MouseEvent) => handleClick(region, e)}
                    onKeyDown={(e: React.KeyboardEvent) =>
                      handleKeyDown(region, e)
                    }
                  />
                );
              })
            }
          </Geographies>

          {/* Selected region outline overlay */}
          {mode.type === "interactive" && mode.selectedRegion && (
            <Geographies geography="/geo/world-regions-110m.json">
              {({ geographies }) =>
                geographies
                  .filter(
                    (geo) =>
                      geo.properties?.region === mode.selectedRegion
                  )
                  .map((geo) => (
                    <Geography
                      key={`selected-${geo.rsmKey}`}
                      geography={geo}
                      tabIndex={-1}
                      aria-hidden
                      style={{
                        default: {
                          fill: "var(--map-hover)",
                          stroke: "var(--map-accent)",
                          strokeWidth: 1.5,
                          outline: "none",
                          pointerEvents: "none",
                        },
                        hover: {
                          fill: "var(--map-hover)",
                          stroke: "var(--map-accent)",
                          strokeWidth: 1.5,
                          outline: "none",
                        },
                        pressed: {
                          fill: "var(--map-hover)",
                          stroke: "var(--map-accent)",
                          strokeWidth: 1.5,
                          outline: "none",
                        },
                      }}
                    />
                  ))
              }
            </Geographies>
          )}
        </ComposableMap>

        {/* Floating tooltip — not animated per spec */}
        {tooltip && (
          <div
            className="worldmap-tooltip"
            style={{
              position: "fixed",
              left: tooltip.x + 12,
              top: tooltip.y - 8,
              pointerEvents: "none",
              zIndex: 50,
            }}
            aria-hidden
          >
            {tooltip.content.split("\n").map((line, i) => (
              <div key={i} style={i === 0 ? { fontWeight: 500 } : undefined}>
                {line}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile persistent tooltip */}
      {mobileTooltip && (
        <div
          className="worldmap-mobile-tooltip"
          aria-live="polite"
        >
          {mobileTooltip.split("\n").map((line, i) => (
            <div key={i} style={i === 0 ? { fontWeight: 500 } : undefined}>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
