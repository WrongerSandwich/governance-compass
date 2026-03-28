"use client";

interface ScaledQuestionCardProps {
  itemId: string;
  questionStem: string;
  option1Text: string;
  option2Text: string;
  option3Text: string;
  option4Text: string;
  option5Text: string;
  selectedValue: 1 | 2 | 3 | 4 | 5 | undefined;
  onSelect: (value: 1 | 2 | 3 | 4 | 5) => void;
}

export function ScaledQuestionCard({
  questionStem,
  option1Text,
  option2Text,
  option3Text,
  option4Text,
  option5Text,
  selectedValue,
  onSelect,
}: ScaledQuestionCardProps) {
  const options: { value: 1 | 2 | 3 | 4 | 5; label: string }[] = [
    { value: 1, label: option1Text },
    { value: 2, label: option2Text },
    { value: 3, label: option3Text },
    { value: 4, label: option4Text },
    { value: 5, label: option5Text },
  ];

  function buttonClasses(value: 1 | 2 | 3 | 4 | 5): string {
    const isSelected = selectedValue === value;
    const hasSelection = selectedValue !== undefined;

    const base =
      "flex flex-1 items-center justify-center px-3 py-3 text-center text-[13px] font-medium transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:z-10";

    if (isSelected) {
      return `${base} bg-stone-100 text-stone-600`;
    }
    if (hasSelection) {
      return `${base} bg-surface-1 text-text-tertiary hover:bg-surface-2`;
    }
    return `${base} bg-surface-1 text-text-secondary hover:bg-surface-2 hover:text-text-primary`;
  }

  function mobileButtonClasses(value: 1 | 2 | 3 | 4 | 5): string {
    const isSelected = selectedValue === value;
    const hasSelection = selectedValue !== undefined;

    const base =
      "flex w-full items-center rounded-[12px] border px-4 py-3 text-[13px] font-medium transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600";

    if (isSelected) {
      return `${base} border-stone-600 bg-stone-100 text-stone-600`;
    }
    if (hasSelection) {
      return `${base} border-border-secondary bg-surface-1 text-text-tertiary opacity-70 hover:opacity-100 hover:border-border-primary`;
    }
    return `${base} border-border-secondary bg-surface-1 text-text-secondary hover:border-border-primary hover:bg-surface-2`;
  }

  return (
    <div className="rounded-[12px] border border-border-secondary bg-surface-1 p-6">
      <p className="text-[16px] font-medium text-text-primary">{questionStem}</p>

      {/* Desktop: horizontal segmented bar */}
      <div
        className="mt-4 hidden min-[560px]:flex overflow-hidden rounded-[12px] border border-border-secondary divide-x divide-border-secondary"
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
    </div>
  );
}
