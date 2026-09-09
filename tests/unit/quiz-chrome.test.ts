/**
 * @vitest-environment jsdom
 *
 * The quiz's delta-01/03/04 treatment (design delta phase 3, mock 6b), and the
 * behaviour that must survive it.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ProgressBar } from "@/components/quiz/ProgressBar";

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

/** Class tokens, split. `toContain` on a raw className also matches substrings
 *  of other classes — `label` inside `label-nav`, `hidden` inside
 *  `min-[560px]:hidden` — which has shipped three bugs in this migration. */
function classes(element: Element): string[] {
  return element.className.split(/\s+/).filter(Boolean);
}

afterEach(() => {
  while (mounted.length) {
    const entry = mounted.pop()!;
    act(() => entry.root.unmount());
    entry.container.remove();
  }
  // `vi.doMock` in the QuizFlow describe registers into this file's module
  // registry, and `vmForks` shares one registry per worker. Reset it here so a
  // mocked `next/navigation` cannot leak into a spec that runs after this one.
  vi.resetModules();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("ProgressBar", () => {
  it("sets the label row in the nav mono role at the AA-clearing label colour", () => {
    const container = render(
      createElement(ProgressBar, { currentPhase: 1, currentIndex: 1, totalInPhase: 36 }),
    );
    const row = container.querySelector("[data-progress-label]")!;

    expect(classes(row)).toContain("label-nav");
    expect(classes(row)).toContain("text-text-label");
    // Mock 6b separates phase from name with a middot, not a colon.
    expect(row.textContent).toContain("Phase 1 · Dilemmas");
    expect(row.textContent).toContain("2 of 36");
  });

  it("hides the count when the phase holds a single screen", () => {
    const container = render(
      createElement(ProgressBar, { currentPhase: 3, currentIndex: 0, totalInPhase: 1 }),
    );

    expect(container.querySelector("[data-progress-label]")!.textContent).toBe(
      "Phase 3 · Budget",
    );
  });

  it("draws three segments on the border-secondary track", () => {
    const container = render(
      createElement(ProgressBar, { currentPhase: 2, currentIndex: 0, totalInPhase: 24 }),
    );
    const tracks = container.querySelectorAll("[data-progress-track]");

    expect(tracks).toHaveLength(3);
    for (const track of tracks) {
      expect(classes(track)).toContain("bg-border-secondary");
      // border-tertiary is a step too faint against the page ground; the mock
      // draws #e0d6cc.
      expect(classes(track)).not.toContain("bg-border-tertiary");
      expect(classes(track)).toContain("h-[3px]");
    }
  });

  it("fills completed phases whole and the active phase proportionally", () => {
    const container = render(
      createElement(ProgressBar, { currentPhase: 2, currentIndex: 5, totalInPhase: 24 }),
    );
    const fills = [...container.querySelectorAll("[data-progress-fill]")] as HTMLElement[];

    expect(fills[0].style.width).toBe("100%");
    expect(fills[1].style.width).toBe(`${(6 / 24) * 100}%`);
    expect(fills[2].style.width).toBe("0%");
    // Stone 600 is the progress fill in every state. `brightness-125` lifted
    // completed segments into a tone the Stone ramp does not contain.
    expect(classes(fills[0])).toContain("bg-stone-600");
    expect(classes(fills[0])).not.toContain("brightness-125");
    expect(classes(fills[1])).toContain("bg-stone-600");
  });
});
