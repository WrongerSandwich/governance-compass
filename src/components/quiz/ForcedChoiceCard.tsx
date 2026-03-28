"use client";

import { useMemo } from "react";

interface ForcedChoiceCardProps {
  itemId: string;
  statementA: string;
  statementB: string;
  questionType: "FC" | "PT";
  selectedPole: "A" | "B" | undefined;
  onSelect: (pole: "A" | "B") => void;
  randomizeOrder?: boolean;
}

export function ForcedChoiceCard({
  itemId,
  statementA,
  statementB,
  questionType,
  selectedPole,
  onSelect,
  randomizeOrder = false,
}: ForcedChoiceCardProps) {
  // Determine display order once per item. Uses itemId as a stable seed so the
  // visual swap is consistent within a session but varies across items.
  const swapped = useMemo(() => {
    if (!randomizeOrder) return false;
    let hash = 0;
    for (let i = 0; i < itemId.length; i++) {
      hash = (hash * 31 + itemId.charCodeAt(i)) >>> 0;
    }
    return hash % 2 === 1;
  }, [itemId, randomizeOrder]);

  const firstPole = swapped ? "B" : "A";
  const secondPole = swapped ? "A" : "B";
  const firstStatement = swapped ? statementB : statementA;
  const secondStatement = swapped ? statementA : statementB;

  function cardClasses(logicalPole: "A" | "B"): string {
    const isSelected = selectedPole === logicalPole;
    const hasSelection = selectedPole !== undefined;

    const base =
      "rounded-[12px] p-6 cursor-pointer transition-all duration-150 focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2";

    if (isSelected) {
      return `${base} border-2 border-stone-600 bg-surface-1`;
    }
    if (hasSelection) {
      return `${base} border border-border-secondary bg-surface-1 opacity-60`;
    }
    return `${base} border border-border-secondary bg-surface-1 hover:border-border-primary`;
  }

  return (
    <div>
      {questionType === "PT" && (
        <p className="mb-4 text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium">
          Which person&apos;s view is closer to your own?
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2">
        <button
          type="button"
          aria-pressed={selectedPole === firstPole}
          onClick={() => onSelect(firstPole)}
          className={cardClasses(firstPole)}
        >
          <p className="text-left text-sm text-text-primary leading-relaxed">
            {firstStatement}
          </p>
        </button>

        <button
          type="button"
          aria-pressed={selectedPole === secondPole}
          onClick={() => onSelect(secondPole)}
          className={cardClasses(secondPole)}
        >
          <p className="text-left text-sm text-text-primary leading-relaxed">
            {secondStatement}
          </p>
        </button>
      </div>
    </div>
  );
}
