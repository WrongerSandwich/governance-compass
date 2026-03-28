"use client";

interface ScaledQuestionCardProps {
  itemId: string;
  questionStem: string;
  option1Text: string; // Strong Pole A (-2)
  option2Text: string; // Moderate Pole A (-1)
  option3Text: string; // Midpoint (0)
  option4Text: string; // Moderate Pole B (+1)
  option5Text: string; // Strong Pole B (+2)
  selectedValue: 1 | 2 | 3 | 4 | 5 | undefined;
  onSelect: (value: 1 | 2 | 3 | 4 | 5) => void;
}

export function ScaledQuestionCard({
  itemId: _itemId,
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
      "flex flex-1 items-center justify-center px-3 py-3 text-center text-sm font-medium transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:z-10";

    if (isSelected) {
      return `${base} bg-indigo-600 text-white`;
    }
    if (hasSelection) {
      return `${base} bg-gray-50 text-gray-500 hover:bg-gray-100`;
    }
    return `${base} bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-700`;
  }

  function mobileButtonClasses(value: 1 | 2 | 3 | 4 | 5): string {
    const isSelected = selectedValue === value;
    const hasSelection = selectedValue !== undefined;

    const base =
      "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

    if (isSelected) {
      return `${base} border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm`;
    }
    if (hasSelection) {
      return `${base} border-gray-200 bg-white text-gray-500 opacity-70 hover:opacity-100 hover:border-indigo-300`;
    }
    return `${base} border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50`;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-lg font-medium text-gray-900">{questionStem}</p>

      {/* Desktop: horizontal segmented bar */}
      <div
        className="mt-4 hidden sm:flex overflow-hidden rounded-lg border border-gray-200 divide-x divide-gray-200"
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
        className="mt-4 flex sm:hidden flex-col gap-2"
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
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                selectedValue === option.value
                  ? "border-indigo-500 bg-indigo-500"
                  : "border-gray-300 bg-white"
              }`}
            >
              {selectedValue === option.value && (
                <span className="block h-2 w-2 rounded-full bg-white" />
              )}
            </span>
            <span className="text-left">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
