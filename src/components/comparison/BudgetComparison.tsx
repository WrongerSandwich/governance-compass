"use client";

import { ministries } from "@/data/ministries";
import { getConsequenceText } from "@/data/ministries";
import {
  Shield,
  Heart,
  TrendingUp,
  GraduationCap,
  Leaf,
  Scale,
  Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const MINISTRY_ICONS: Record<number, LucideIcon> = {
  1: Shield,
  2: Heart,
  3: TrendingUp,
  4: GraduationCap,
  5: Leaf,
  6: Scale,
  7: Globe,
};

interface BudgetComparisonProps {
  budgetA: Record<number, number>;
  budgetB: Record<number, number>;
  labelA: string;
  labelB: string;
}

export function BudgetComparison({
  budgetA,
  budgetB,
  labelA,
  labelB,
}: BudgetComparisonProps) {
  // Find the max allocation across both profiles for consistent bar scaling
  const allValues = [
    ...Object.values(budgetA),
    ...Object.values(budgetB),
  ];
  const maxValue = Math.max(...allValues, 1);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex gap-4 text-xs text-text-tertiary">
        <div className="flex items-center gap-1.5">
          <div
            className="h-[6px] w-5 rounded-[3px]"
            style={{ backgroundColor: "var(--stone-600)", opacity: 0.5 }}
          />
          <span>{labelA}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="h-[6px] w-5 rounded-[3px]"
            style={{ backgroundColor: "var(--stone-600)", opacity: 0.25 }}
          />
          <span>{labelB}</span>
        </div>
      </div>

      {ministries.map((ministry, i) => {
        const valueA = budgetA[ministry.id] ?? 1;
        const valueB = budgetB[ministry.id] ?? 1;
        const Icon = MINISTRY_ICONS[ministry.id];
        const consequenceA = getConsequenceText(ministry, valueA);
        const consequenceB = getConsequenceText(ministry, valueB);
        const sameConsequence = consequenceA === consequenceB;

        return (
          <div
            key={ministry.id}
            className={`rounded-[8px] px-3 py-3 ${i % 2 === 1 ? "bg-surface-2" : ""}`}
          >
            {/* Ministry header */}
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-text-secondary font-medium mb-2">
              {Icon && <Icon size={13} strokeWidth={1.5} className="shrink-0" />}
              {ministry.name}
            </p>

            {/* Bar A */}
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="flex-1 h-[6px] rounded-[3px] overflow-hidden"
                style={{ backgroundColor: "var(--border-secondary)" }}
              >
                <div
                  className="h-full rounded-[3px]"
                  style={{
                    width: `${(valueA / maxValue) * 100}%`,
                    backgroundColor: "var(--stone-600)",
                    opacity: 0.5,
                  }}
                />
              </div>
              <span className="w-5 text-right text-[13px] font-mono font-medium tabular-nums text-text-primary">
                {valueA}
              </span>
            </div>

            {/* Bar B */}
            <div className="flex items-center gap-2">
              <div
                className="flex-1 h-[6px] rounded-[3px] overflow-hidden"
                style={{ backgroundColor: "var(--border-secondary)" }}
              >
                <div
                  className="h-full rounded-[3px]"
                  style={{
                    width: `${(valueB / maxValue) * 100}%`,
                    backgroundColor: "var(--stone-600)",
                    opacity: 0.25,
                  }}
                />
              </div>
              <span className="w-5 text-right text-[13px] font-mono font-medium tabular-nums text-text-tertiary">
                {valueB}
              </span>
            </div>

            {/* Consequence text */}
            {sameConsequence ? (
              <p className="text-xs font-serif italic text-text-tertiary leading-relaxed mt-2">
                {consequenceA}
              </p>
            ) : (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-serif italic text-text-tertiary leading-relaxed">
                  <span className="not-italic font-sans font-medium text-text-secondary">{labelA}:</span>{" "}
                  {consequenceA}
                </p>
                <p className="text-xs font-serif italic text-text-tertiary leading-relaxed">
                  <span className="not-italic font-sans font-medium text-text-secondary">{labelB}:</span>{" "}
                  {consequenceB}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
