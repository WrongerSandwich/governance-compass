"use client";

import { HorizontalBarChart } from "@/components/study/HorizontalBarChart";
import type { HorizontalBarChartRow } from "@/components/study/HorizontalBarChart";

export interface AttributeCategory {
  category: string;
  label: string;
  n: number;
  mean_distance: number;
}

export interface AttributePanel {
  attribute: string;
  title: string;
  categories: AttributeCategory[];
}

interface DisagreementByAttributeProps {
  panels: AttributePanel[];
  overallMean: number;
}

/** Format a category key into a readable label */
function formatCategory(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function DisagreementByAttribute({
  panels,
  overallMean,
}: DisagreementByAttributeProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "24px",
      }}
    >
      {panels.map((panel) => {
        const rows: HorizontalBarChartRow[] = panel.categories.map((cat) => ({
          label: cat.label,
          value: cat.mean_distance,
          color: "var(--stone-600)",
          secondaryLabel: `n=${cat.n}`,
        }));

        // Add a reference-line row using a dottedIfZero trick — we insert it
        // visually via an SVG overlay instead; here we just pass it as data
        // with a zero bar and a dotted line.
        const referenceRow: HorizontalBarChartRow = {
          label: "Overall mean",
          value: overallMean,
          color: "var(--text-tertiary)",
          secondaryLabel: overallMean.toFixed(2),
          dottedIfZero: false,
        };

        // Compute range — start at 0, end slightly above max
        const maxVal = Math.max(...rows.map((r) => r.value), overallMean);
        const range: [number, number] = [0, Math.ceil(maxVal * 10) / 10 + 0.1];

        return (
          <div key={panel.attribute}>
            <p
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-sans)",
                marginBottom: "8px",
              }}
            >
              {panel.title}
            </p>
            <HorizontalBarChart
              rows={[...rows, referenceRow]}
              range={range}
              barHeight={20}
              ariaLabel={`Mean Claude-Gemini distance by ${panel.title}`}
            />
          </div>
        );
      })}
    </div>
  );
}
