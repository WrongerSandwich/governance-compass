"use client";

import { HorizontalBarChart } from "@/components/study/HorizontalBarChart";
import type { HorizontalBarChartRow } from "@/components/study/HorizontalBarChart";
import { EMERGENCE_LABELS } from "@/data/archetypes";
import type { ArchetypeEmergence } from "@/data/archetypes";

export interface ArchetypeDistributionRow {
  archetypeId: string;
  archetypeName: string;
  emergence: ArchetypeEmergence;
  count: number;
  /** CSS variable name for the cluster color, e.g. "--cluster-2". Undefined for zero-count archetypes. */
  clusterColorVar?: string;
}

export interface ArchetypeDistributionProps {
  rows: ArchetypeDistributionRow[];
  className?: string;
}

export function ArchetypeDistribution({
  rows,
  className,
}: ArchetypeDistributionProps) {
  const sortedRows = [...rows].sort((a, b) => b.count - a.count);
  const maxCount = Math.max(...sortedRows.map((r) => r.count));

  // Drop the "The" prefix — doesn't add information in a chart label,
  // and freeing 4-5 characters helps bars breathe at narrow viewports.
  const chartRows: HorizontalBarChartRow[] = sortedRows.map((row) => ({
    label: row.archetypeName.replace(/^The\s+/, ""),
    value: row.count,
    color: row.clusterColorVar
      ? `var(${row.clusterColorVar})`
      : "var(--border-secondary)",
    secondaryLabel:
      row.count === 0 ? "0 personas" : `${row.count} personas`,
    emergenceTag: EMERGENCE_LABELS[row.emergence],
    dottedIfZero: row.count === 0,
  }));

  // minWidth + overflowX:auto keeps text legible on very narrow viewports
  // by allowing horizontal scroll instead of shrinking labels below ~8px.
  return (
    <div className={className} style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 360 }}>
        <HorizontalBarChart
          rows={chartRows}
          diverging={false}
          range={[0, maxCount]}
          barHeight={26}
          labelWidth={180}
          ariaLabel="Distribution of 1,002 personas across twelve archetypes, colored by their nearest empirical cluster"
        />
      </div>
    </div>
  );
}
