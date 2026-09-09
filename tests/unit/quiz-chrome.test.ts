/**
 * @vitest-environment jsdom
 *
 * The quiz's delta-01/03/04 treatment (design delta phase 3, mock 6b), and the
 * behaviour that must survive it.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ProgressBar } from "@/components/quiz/ProgressBar";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: { container: HTMLDivElement; root: Root }[] = [];

function render(element: ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  // Registered BEFORE rendering. A component that throws during render would
  // otherwise strand its container in document.body with nothing to clean it
  // up — and Tasks 4 and 7 mount QuizFlow and BudgetSimulator with real
  // providers, which is exactly where a render-time throw is likely.
  mounted.push({ container, root });
  act(() => root.render(element));
  return container;
}

/** Class tokens. `toContain` on a raw className also matches substrings of
 *  other classes — `label` inside `label-nav`, `hidden` inside
 *  `min-[560px]:hidden` — which has shipped three bugs in this migration.
 *
 *  `classList`, not `className.split(...)`: on an SVGElement `className` is a
 *  read-only `SVGAnimatedString` with no `.split`, and TypeScript will not
 *  catch the call because `SVGElement` declares it `any`. Task 7 renders a
 *  Lucide icon inside the ministry name row, so an SVG is one
 *  `firstElementChild` away from a test author. */
function classes(element: Element): string[] {
  return [...element.classList];
}

afterEach(() => {
  while (mounted.length) {
    const entry = mounted.pop()!;
    try {
      act(() => entry.root.unmount());
    } finally {
      // In a `finally` so a throwing unmount cannot both strand this container
      // and abort the loop, leaving every remaining entry mounted for the next
      // test.
      entry.container.remove();
    }
  }
  // A fresh module graph for the next dynamic import. This does NOT clear the
  // mock registry: `vi.doMock` stays registered for the worker's lifetime, and
  // resetting modules makes it MORE likely to apply, by forcing the next
  // import back through the mocker. The describe that calls `doMock` owns the
  // matching `doUnmock`.
  vi.resetModules();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  // BudgetSimulator's hold-to-repeat and QuizFlow's finalize both run on
  // setTimeout, so a later task will reach for fake timers.
  vi.useRealTimers();
  sessionStorage.clear();
  localStorage.clear();
});

describe("ProgressBar", () => {
  it("sets the label row in the nav mono role at the AA-clearing label colour", () => {
    const container = render(
      createElement(ProgressBar, { currentPhase: 1, currentIndex: 1, totalInPhase: 36 }),
    );
    const row = container.querySelector("[data-progress-label]")!;

    expect(classes(row)).toContain("label-nav");
    expect(classes(row)).toContain("text-text-label");
    // 10px above the segments, per the mock. Pinned because spacing is one of
    // this task's five deltas, and every spacing class mutates green without
    // an assertion of its own.
    expect(classes(row)).toContain("mb-2.5");
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
    // The rest of the mock's geometry: 4px between segments, 32px below the bar.
    expect(classes(tracks[0].parentElement!)).toContain("gap-1");
    expect(classes(container.firstElementChild!)).toContain("mb-8");
  });

  it("fills completed phases whole and the active phase proportionally", () => {
    const container = render(
      createElement(ProgressBar, { currentPhase: 2, currentIndex: 5, totalInPhase: 24 }),
    );
    const fills = [...container.querySelectorAll("[data-progress-fill]")] as HTMLElement[];

    expect(fills[0].style.width).toBe("100%");
    // A literal, not `${(6 / 24) * 100}%`. Recomputing the formula under test
    // means a changed formula passes trivially, and the float-to-string
    // formatting is never pinned at all.
    expect(fills[1].style.width).toBe("25%");
    expect(fills[2].style.width).toBe("0%");
    // Stone 600 is the progress fill in every state. `brightness-125` lifted
    // completed segments into a tone the Stone ramp does not contain.
    expect(classes(fills[0])).toContain("bg-stone-600");
    expect(classes(fills[0])).not.toContain("brightness-125");
    expect(classes(fills[1])).toContain("bg-stone-600");
  });

  it("writes the raw ratio, not a rounded one", () => {
    const container = render(
      createElement(ProgressBar, { currentPhase: 1, currentIndex: 0, totalInPhase: 36 }),
    );
    const fills = [...container.querySelectorAll("[data-progress-fill]")] as HTMLElement[];

    // The shape every phase-1 screen produces. Pins the formatting that the
    // terminating 25% case above cannot.
    expect(fills[0].style.width).toBe("2.7777777777777777%");
  });

  it("survives an empty phase without dividing by zero", () => {
    const container = render(
      createElement(ProgressBar, { currentPhase: 1, currentIndex: 0, totalInPhase: 0 }),
    );
    const fills = [...container.querySelectorAll("[data-progress-fill]")] as HTMLElement[];

    // Without the `totalInPhase > 0` guard this is "Infinity%". A rewrite that
    // claims to preserve a guard should pin the guard.
    expect(fills[0].style.width).toBe("0%");
  });
});
