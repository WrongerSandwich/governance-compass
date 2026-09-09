"use client";

import { useEffect } from "react";
import { AnnotatedText } from "@/components/AnnotatedText";

interface ScaledQuestionCardProps {
  questionStem: string;
  option1Label: string;
  option1Detail: string;
  option2Label: string;
  option2Detail: string;
  option3Label: string;
  option3Detail: string;
  option4Label: string;
  option4Detail: string;
  option5Label: string;
  option5Detail: string;
  selectedValue: 1 | 2 | 3 | 4 | 5 | undefined;
  onSelect: (value: 1 | 2 | 3 | 4 | 5) => void;
}

export function ScaledQuestionCard({
  questionStem,
  option1Label,
  option1Detail,
  option2Label,
  option2Detail,
  option3Label,
  option3Detail,
  option4Label,
  option4Detail,
  option5Label,
  option5Detail,
  selectedValue,
  onSelect,
}: ScaledQuestionCardProps) {
  const options: { value: 1 | 2 | 3 | 4 | 5; label: string; detail: string }[] = [
    { value: 1, label: option1Label, detail: option1Detail },
    { value: 2, label: option2Label, detail: option2Detail },
    { value: 3, label: option3Label, detail: option3Detail },
    { value: 4, label: option4Label, detail: option4Detail },
    { value: 5, label: option5Label, detail: option5Detail },
  ];

  const selectedDetail = options.find((o) => o.value === selectedValue)?.detail;

  // Keyboard 1-5 shortcuts for efficient scale selection
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 5) {
        onSelect(num as 1 | 2 | 3 | 4 | 5);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onSelect]);

  function buttonClasses(value: 1 | 2 | 3 | 4 | 5): string {
    const isSelected = selectedValue === value;
    const hasSelection = selectedValue !== undefined;

    const base =
      "flex flex-1 items-center justify-center px-3 py-3 text-center text-[13px] font-medium transition-colors duration-150 cursor-pointer focus-ring focus-visible:z-10";

    // The segmented bar has no per-item border to carry state, so the chosen
    // segment takes the ink fill — the same token pair as the primary button,
    // which means it inverts correctly on the dark ground.
    if (isSelected) {
      return `${base} bg-button-primary text-button-primary-fg`;
    }
    if (hasSelection) {
      return `${base} bg-surface-1 text-text-label hover:bg-surface-2`;
    }
    return `${base} bg-surface-1 text-text-secondary hover:bg-surface-2 hover:text-text-primary`;
  }

  function mobileButtonClasses(value: 1 | 2 | 3 | 4 | 5): string {
    const isSelected = selectedValue === value;
    const hasSelection = selectedValue !== undefined;

    // The mobile rows do have borders, so they mirror the choice card exactly.
    const base =
      "flex w-full items-center rounded-sharp border px-4 py-3 text-[13px] font-medium transition-colors duration-150 cursor-pointer focus-ring";

    if (isSelected) {
      return `${base} border-rule-strong bg-surface-1 text-text-primary`;
    }
    if (hasSelection) {
      return `${base} border-border-secondary bg-surface-1 text-text-secondary opacity-60 hover:opacity-100 hover:border-stone-600`;
    }
    return `${base} border-border-secondary bg-surface-1 text-text-secondary hover:border-stone-600`;
  }

  return (
    <div className="rounded-sharp border border-border-secondary bg-surface-1 p-6">
      <p className="display-s text-text-primary">
        <AnnotatedText text={questionStem} />
      </p>

      {/* Desktop: horizontal segmented bar */}
      <div
        data-scale-segments
        className="mt-4 hidden min-[560px]:flex overflow-hidden rounded-sharp border border-border-secondary divide-x divide-border-secondary"
        role="group"
        aria-label="Response options"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={selectedValue === option.value}
            onClick={() => onSelect(option.value)}
            className={buttonClasses(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Mobile: vertical list */}
      <div
        data-scale-list
        className="mt-4 flex min-[560px]:hidden flex-col gap-2"
        role="group"
        aria-label="Response options"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={selectedValue === option.value}
            onClick={() => onSelect(option.value)}
            className={mobileButtonClasses(option.value)}
          >
            <span className="text-left">{option.label}</span>
          </button>
        ))}
      </div>

      {/* Detail text / hint */}
      <div aria-live="polite" className="mt-4">
        {selectedDetail ? (
          <div data-scale-detail className="border-t border-border-secondary pt-3">
            <p className="text-[13.5px] leading-[1.6] text-text-secondary">
              {selectedDetail}
            </p>
          </div>
        ) : (
          <p className="label text-text-label text-center">
            Select to see full description
          </p>
        )}
      </div>
    </div>
  );
}
