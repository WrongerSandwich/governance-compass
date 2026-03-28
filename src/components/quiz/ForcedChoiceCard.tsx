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
    // Simple deterministic hash of the itemId
    let hash = 0;
    for (let i = 0; i < itemId.length; i++) {
      hash = (hash * 31 + itemId.charCodeAt(i)) >>> 0;
    }
    return hash % 2 === 1;
  }, [itemId, randomizeOrder]);

  // Visual poles after optional swap — the logical pole values remain "A"/"B"
  const firstPole = swapped ? "B" : "A";
  const secondPole = swapped ? "A" : "B";
  const firstStatement = swapped ? statementB : statementA;
  const secondStatement = swapped ? statementA : statementB;

  function cardClasses(logicalPole: "A" | "B"): string {
    const isSelected = selectedPole === logicalPole;
    const hasSelection = selectedPole !== undefined;

    const base =
      "rounded-lg border p-6 cursor-pointer transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

    if (isSelected) {
      return `${base} border-indigo-500 bg-indigo-50 shadow-md`;
    }
    if (hasSelection) {
      return `${base} border-gray-200 bg-white shadow-sm opacity-50`;
    }
    return `${base} border-gray-200 bg-white shadow-sm hover:border-indigo-300 hover:shadow-md`;
  }

  return (
    <div>
      {questionType === "PT" && (
        <p className="mb-4 text-sm font-medium text-gray-500 uppercase tracking-wide">
          Which person&apos;s view is closer to your own?
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          aria-pressed={selectedPole === firstPole}
          onClick={() => onSelect(firstPole)}
          className={cardClasses(firstPole)}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                selectedPole === firstPole
                  ? "border-indigo-500 bg-indigo-500"
                  : "border-gray-300 bg-white"
              }`}
            >
              {selectedPole === firstPole && (
                <span className="block h-2 w-2 rounded-full bg-white" />
              )}
            </span>
            <p className="text-left text-base text-gray-900">{firstStatement}</p>
          </div>
        </button>

        <button
          type="button"
          aria-pressed={selectedPole === secondPole}
          onClick={() => onSelect(secondPole)}
          className={cardClasses(secondPole)}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                selectedPole === secondPole
                  ? "border-indigo-500 bg-indigo-500"
                  : "border-gray-300 bg-white"
              }`}
            >
              {selectedPole === secondPole && (
                <span className="block h-2 w-2 rounded-full bg-white" />
              )}
            </span>
            <p className="text-left text-base text-gray-900">{secondStatement}</p>
          </div>
        </button>
      </div>
    </div>
  );
}
