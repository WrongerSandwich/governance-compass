"use client";

import { useMemo } from "react";
import { AnnotatedText } from "@/components/AnnotatedText";

interface ForcedChoiceCardProps {
  itemId: string;
  headlineA: string;
  bodyA: string;
  headlineB: string;
  bodyB: string;
  questionType: "FC" | "PT";
  selectedPole: "A" | "B" | undefined;
  onSelect: (pole: "A" | "B") => void;
  randomizeOrder?: boolean;
}

export function ForcedChoiceCard({
  itemId,
  headlineA,
  bodyA,
  headlineB,
  bodyB,
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

  function cardClasses(logicalPole: "A" | "B"): string {
    const isSelected = selectedPole === logicalPole;
    const hasSelection = selectedPole !== undefined;

    // 1px border in every state — the state is carried by the border's tone,
    // not its weight, so the border itself never changes the card's metrics.
    // (The card does grow on selection: the `Selected` marker below adds a
    // line. That is mock 6b's design, not an accident of the border.)
    //
    // `transition-[border-color,opacity]`, not `transition-colors`: Tailwind's
    // colour set covers color/background-color/border-color/fill/stroke and
    // NOT opacity, so `hover:opacity-100` on the dimmed sibling would snap
    // while its border eased. Two `transition-*` classes cannot both apply —
    // they collide on `transition-property` — so name both properties on one
    // utility. Verified to compile: `transition-property: border-color,opacity`.
    const base =
      "rounded-sharp p-6 border bg-surface-1 cursor-pointer transition-[border-color,opacity] duration-150 focus-ring-child";

    if (isSelected) {
      // --rule-strong is the ink/hairline pair's strong end, so it inverts with
      // the surface. `border-stone-900` would go near-invisible in dark mode.
      return `${base} border-rule-strong`;
    }
    if (hasSelection) {
      return `${base} border-border-secondary opacity-60 hover:opacity-100 hover:border-stone-600`;
    }
    return `${base} border-border-secondary hover:border-stone-600`;
  }

  /** Takes only the pole; the copy is derived. Passing `(pole, headline, body)`
   *  ends in two adjacent `string` parameters, so a call site can transpose one
   *  card's headline with the other's body — it type-checks, renders plausibly,
   *  and the whole suite stays green. Deriving here makes that unrepresentable
   *  and retires the four `first*`/`second*` copy variables. */
  function renderOption(pole: "A" | "B") {
    const isSelected = selectedPole === pole;
    const headline = pole === "A" ? headlineA : headlineB;
    const body = pole === "A" ? bodyA : bodyB;
    return (
      <div
        data-choice-card
        onClick={() => onSelect(pole)}
        className={cardClasses(pole)}
      >
        <button
          type="button"
          aria-pressed={isSelected}
          aria-label={`Select ${headline}`}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(pole);
          }}
          className="sr-only"
        />
        <p className="display-s text-text-primary mb-2.5">
          <AnnotatedText text={headline} />
        </p>
        <p className="text-[13.5px] leading-[1.6] text-text-secondary">
          <AnnotatedText text={body} />
        </p>
        {isSelected && (
          // `label` declares no font-weight, so `font-medium` layers over it
          // safely — the roles only conflict on properties they both set.
          <p data-selected-marker className="mt-3.5 label font-medium text-text-primary">
            Selected
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="mb-[18px] label text-text-label">
        {questionType === "PT"
          ? "Which person\u2019s view is closer to your own?"
          : "Select the position closer to your own view"}
      </p>
      <div className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2">
        {renderOption(firstPole)}
        {renderOption(secondPole)}
      </div>
    </div>
  );
}
