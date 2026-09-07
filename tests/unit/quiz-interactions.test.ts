/**
 * @vitest-environment jsdom
 *
 * Regression coverage for issue #66's quiz and annotation interactions.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AnnotationEditor } from "@/components/annotations/AnnotationEditor";
import { ForcedChoiceCard } from "@/components/quiz/ForcedChoiceCard";
import { ScaledQuestionCard } from "@/components/quiz/ScaledQuestionCard";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: { container: HTMLDivElement; root: Root }[] = [];

function render(element: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(element));
  mounted.push({ container, root });
  return container;
}

function click(element: Element) {
  act(() => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

afterEach(() => {
  while (mounted.length) {
    const view = mounted.pop();
    if (!view) continue;
    act(() => view.root.unmount());
    view.container.remove();
  }
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("quiz interaction boundaries", () => {
  it("keeps glossary controls out of a card button and lets tooltip text be selected without choosing a response", () => {
    const onSelect = vi.fn();
    const container = render(
      createElement(ForcedChoiceCard, {
        itemId: "FC-1",
        headlineA: "Sovereignty matters",
        bodyA: "Choose local control.",
        headlineB: "Internationalism matters",
        bodyB: "Choose shared institutions.",
        questionType: "FC",
        selectedPole: undefined,
        onSelect,
      }),
    );

    expect(container.querySelector("button [role='button']")).toBeNull();
    expect(container.querySelector("button p")).toBeNull();

    const glossaryTrigger = container.querySelector("[aria-label='Definition of Sovereignty']");
    if (!glossaryTrigger) throw new Error("expected glossary trigger");
    click(glossaryTrigger);

    const definition = document.body.querySelector("[role='tooltip'] span:nth-child(2)");
    if (!definition) throw new Error("expected glossary definition");
    click(definition);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("does not treat a modified number key as a scale-selection shortcut", () => {
    const onSelect = vi.fn();
    render(
      createElement(ScaledQuestionCard, {
        questionStem: "Question",
        option1Label: "One", option1Detail: "",
        option2Label: "Two", option2Detail: "",
        option3Label: "Three", option3Detail: "",
        option4Label: "Four", option4Detail: "",
        option5Label: "Five", option5Detail: "",
        selectedValue: undefined,
        onSelect,
      }),
    );

    act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "1", ctrlKey: true, bubbles: true })));

    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("AnnotationEditor", () => {
  it("reports a failed save instead of falsely confirming success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 500 })));
    const container = render(createElement(AnnotationEditor, { axisScoreId: "axis-1", initialText: "Note" }));
    const save = container.querySelector("button");
    if (!save) throw new Error("expected save button");

    await act(async () => {
      save.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Could not save your note. Please try again.");
    expect(container.textContent).not.toContain("Saved");
    expect(save.disabled).toBe(false);
  });
});
