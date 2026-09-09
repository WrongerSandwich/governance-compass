/**
 * @vitest-environment jsdom
 *
 * The quiz's delta-01/03/04 treatment (design delta phase 3, mock 6b), and the
 * behaviour that must survive it.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ForcedChoiceCard } from "@/components/quiz/ForcedChoiceCard";
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
      // In a `finally` so a throwing unmount cannot strand THIS container.
      // The throw still propagates — `finally` without `catch` rethrows — so
      // the loop does abort and any remaining entries wait for the next
      // `afterEach`. That drains on entry, so they are cleaned up one test
      // late rather than never. Verified by forcing a throwing unmount.
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

    // Without the `totalInPhase > 0` guard the width computes to "Infinity%",
    // which jsdom's style setter rejects outright, so the observed value is ""
    // rather than "Infinity%". Either way this assertion fails — but don't
    // write the comment as if "Infinity%" is what you'd see. A rewrite that
    // claims to preserve a guard should pin the guard.
    expect(fills[0].style.width).toBe("0%");
  });
});

describe("ForcedChoiceCard", () => {
  const base = {
    itemId: "FC-1",
    headlineA: "Universal public goods",
    bodyA: "Funded through taxation.",
    headlineB: "Competing private providers",
    bodyB: "The state helps those who cannot help themselves.",
    questionType: "FC" as const,
    onSelect: () => {},
  };

  function renderCard(selectedPole: "A" | "B" | undefined) {
    return render(createElement(ForcedChoiceCard, { ...base, selectedPole }));
  }

  it("keeps the prompt a mono label, not a serif heading", () => {
    const container = renderCard(undefined);
    const prompt = container.querySelector("p")!;

    expect(prompt.textContent).toBe("Select the position closer to your own view");
    expect(classes(prompt)).toContain("label");
    // `label`, not `label-nav`/`label-eyebrow` — checked token-wise, since
    // `toContain` on the raw className passes on all three.
    expect(classes(prompt)).not.toContain("label-eyebrow");
    expect(classes(prompt)).toContain("text-text-label");
    // 18px below the prompt, per the mock. Spacing mutates green without an
    // assertion of its own.
    expect(classes(prompt)).toContain("mb-[18px]");
    // Mock 6b is explicit that this is not a heading.
    expect(container.querySelector("h1, h2, h3, h4")).toBeNull();
  });

  it("uses the PT prompt when the item is a person-type dilemma", () => {
    const container = render(
      createElement(ForcedChoiceCard, { ...base, questionType: "PT", selectedPole: undefined }),
    );

    expect(container.querySelector("p")!.textContent).toBe(
      "Which person’s view is closer to your own?",
    );
  });

  it("stacks the options below 560px and pairs them above it", () => {
    const container = renderCard(undefined);
    const grid = container.querySelector("[data-choice-card]")!.parentElement!;

    expect(classes(grid)).toContain("grid-cols-1");
    expect(classes(grid)).toContain("min-[560px]:grid-cols-2");
    expect(classes(grid)).toContain("gap-4");
  });

  it("draws an unanswered pair as two equal hairline cards", () => {
    const container = renderCard(undefined);

    for (const card of container.querySelectorAll("[data-choice-card]")) {
      const tokens = classes(card);
      expect(tokens).toContain("border");
      // 1px, per the mock. `border-2` was the shipped weight.
      expect(tokens).not.toContain("border-2");
      expect(tokens).toContain("border-border-secondary");
      expect(tokens).toContain("hover:border-stone-600");
      expect(tokens).not.toContain("opacity-60");
      // `bg-surface-1` moved from the three per-state branches into `base`
      // here, and a relocated surface token is exactly the value this project
      // has twice got wrong by reaching for a fixed ramp value instead.
      expect(tokens).toContain("bg-surface-1");
      expect(tokens).toContain("p-6");
      // `transition-colors` does NOT cover opacity, so the dimmed sibling's
      // `hover:opacity-100` snapped while its border eased. jsdom computes no
      // transitions, so the class token is the only observable — but the
      // failure is silent and nothing else catches it, and the negative names
      // the value this replaced.
      expect(tokens).toContain("transition-[border-color,opacity]");
      expect(tokens).not.toContain("transition-colors");
      expect(tokens).toContain("focus-ring-child");
      // `focus-ring-child` is scoped to `:has(> button:focus-visible)`, so the
      // ring stops painting the moment the sr-only control is not a DIRECT
      // child of the card. Task 1's utility test pins the selector's shape;
      // this pins the DOM that has to satisfy it. Wrapping the card's contents
      // in an inner element would silently break the focus indicator.
      expect(card.querySelector(":scope > button")).not.toBeNull();
    }
    expect(container.textContent).not.toContain("Selected");
  });

  it("marks the chosen card with an ink rule and a mono marker, and dims the other", () => {
    const container = renderCard("A");
    const cards = [...container.querySelectorAll("[data-choice-card]")];
    const chosen = cards.find((card) =>
      card.querySelector("[aria-pressed='true']"),
    )!;
    const other = cards.find((card) => card !== chosen)!;

    // --rule-strong, not border-stone-900: the Stone ramp is fixed across
    // modes, so a literal would go near-invisible on the dark ground.
    expect(classes(chosen)).toContain("border-rule-strong");
    expect(classes(chosen)).not.toContain("opacity-60");

    const marker = chosen.querySelector("[data-selected-marker]")!;
    expect(marker.textContent).toBe("Selected");
    expect(classes(marker)).toContain("label");
    expect(classes(marker)).toContain("font-medium");
    // 14px below the body, per the mock.
    expect(classes(marker)).toContain("mt-3.5");

    expect(classes(other)).toContain("opacity-60");
    expect(classes(other)).toContain("border-border-secondary");
    expect(other.querySelector("[data-selected-marker]")).toBeNull();

    // The focus-ring coupling again, pinned in the selected state too. The
    // states share `cardClasses` and the JSX, but a selected-state restyle that
    // wrapped the card's contents would otherwise slip through.
    for (const card of cards) {
      expect(classes(card)).toContain("focus-ring-child");
      expect(card.querySelector(":scope > button")).not.toBeNull();
    }
  });

  it("pairs each headline with its own body, in either display order", () => {
    const plain = renderCard(undefined).querySelectorAll("[data-choice-card]");

    expect(plain[0].textContent).toContain("Universal public goods");
    expect(plain[0].textContent).toContain("Funded through taxation.");
    expect(plain[0].textContent).not.toContain("The state helps");

    // `FC-1` hashes to a swapped display order (verified: ((h*31+c)>>>0) % 2 === 1),
    // so the B option renders first — and must still carry B's body and record
    // "B". Nothing else in the suite reads this wiring: the e2e spec clicks
    // `[data-choice-card]` without looking at its text, so a headline paired
    // with the wrong body renders plausibly and passes everything.
    const swapped = render(
      createElement(ForcedChoiceCard, { ...base, selectedPole: undefined, randomizeOrder: true }),
    ).querySelectorAll("[data-choice-card]");

    expect(swapped[0].textContent).toContain("Competing private providers");
    expect(swapped[0].textContent).toContain("The state helps");
    expect(swapped[0].querySelector("button")!.getAttribute("aria-label")).toBe(
      "Select Competing private providers",
    );
  });

  it("sets option headlines in the serif card role and bodies at the delta's prose size", () => {
    const container = renderCard(undefined);
    const card = container.querySelector("[data-choice-card]")!;
    const [headline, body] = card.querySelectorAll("p");

    expect(classes(headline)).toContain("display-s");
    // 10px between the headline and the body, per the mock.
    expect(classes(headline)).toContain("mb-2.5");
    expect(classes(body)).toContain("text-[13.5px]");
    // This replaced `leading-relaxed` (1.625), which still reads as correct to
    // a reviewer — the case the pinning rule exists for.
    expect(classes(body)).toContain("leading-[1.6]");
    expect(classes(body)).not.toContain("leading-relaxed");
    expect(classes(body)).toContain("text-text-secondary");
    expect(classes(body)).not.toContain("text-text-tertiary");
  });
});

describe("QuizFlow chrome", () => {
  // `vi.resetModules()` in the file-level afterEach clears the module cache but
  // NOT the mock registry — a `doMock` factory stays registered for the
  // worker's lifetime, and `vmForks` shares one registry per worker. The
  // describe that registers the mock is the one that has to retire it.
  afterEach(() => {
    vi.doUnmock("next/navigation");
  });

  async function renderPhaseOne() {
    vi.resetModules();
    vi.doMock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
    const { QuizFlow } = await import("@/components/quiz/QuizFlow");
    const { QuizProvider } = await import("@/components/quiz/QuizProvider");

    const container = render(
      createElement(
        QuizProvider,
        null,
        createElement(QuizFlow, {
          forcedChoiceItems: [
            {
              id: "FC-1", axisId: 1, itemNumber: 1, questionType: "FC",
              abstractionLevel: "concrete",
              headlineA: "Public goods", bodyA: "Funded by tax.",
              headlineB: "Private providers", bodyB: "Funded by market.",
            },
            {
              id: "FC-2", axisId: 2, itemNumber: 1, questionType: "FC",
              abstractionLevel: "concrete",
              headlineA: "Local control", bodyA: "Decide near home.",
              headlineB: "Shared institutions", bodyB: "Decide together.",
            },
          ],
          scaledItems: [],
          ministries: [],
        }),
      ),
    );

    // The intro interstitial renders first; step past it into phase 1.
    const begin = [...container.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === "Begin",
    )!;
    act(() => begin.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    return container;
  }

  function byText(container: Element, text: string) {
    return [...container.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === text,
    )!;
  }

  it("opens on an interstitial whose call to action is the ink primary", async () => {
    vi.resetModules();
    vi.doMock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
    const { QuizFlow } = await import("@/components/quiz/QuizFlow");
    const { QuizProvider } = await import("@/components/quiz/QuizProvider");
    const container = render(
      createElement(QuizProvider, null,
        createElement(QuizFlow, { forcedChoiceItems: [], scaledItems: [], ministries: [] })),
    );

    const begin = byText(container, "Begin");
    expect(classes(begin)).toContain("bg-button-primary");
    expect(classes(begin)).toContain("control");
    expect(classes(begin)).toContain("w-full");
    // The variant owns display and padding; className must never fight it.
    expect(classes(begin)).not.toContain("block");
    expect(container.querySelector("h1")!.textContent).toBe("Governance dilemmas");
    expect(classes(container.querySelector("h1")!)).toContain("display-s");
  });

  it("pairs an outlined Previous with an ink-filled Next", async () => {
    const container = await renderPhaseOne();

    const previous = byText(container, "Previous");
    const next = byText(container, "Next");

    expect(classes(previous)).toContain("border-border-primary");
    expect(classes(previous)).toContain("control");
    expect(classes(previous)).not.toContain("bg-button-primary");
    expect(previous.disabled).toBe(true);

    // Spec decision D1: the mock draws Next as an ink fill, and that wins over
    // CLAUDE.md's filled-button count, which #137 rewrites.
    expect(classes(next)).toContain("bg-button-primary");
    expect(classes(next)).toContain("text-button-primary-fg");
    expect(next.disabled).toBe(true);
  });

  it("keeps Skip a focusable mono link while the question is unanswered", async () => {
    const container = await renderPhaseOne();
    const skip = byText(container, "Skip this question");

    expect(classes(skip)).toContain("label-nav");
    expect(classes(skip)).toContain("text-text-label");
    // The shipped skip link had no focus affordance at all.
    expect(classes(skip)).toContain("focus-ring");
  });

  it("hides Skip and enables Next once a dilemma is answered", async () => {
    const container = await renderPhaseOne();
    const card = container.querySelector("[data-choice-card]")!;
    act(() => card.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    expect(byText(container, "Next").disabled).toBe(false);
    expect(container.textContent).not.toContain("Skip this question");
  });

  it("holds the column at the mock's 672px with the nav's gutters on the page", async () => {
    const container = await renderPhaseOne();
    const shell = container.querySelector("[data-quiz-shell]")!;

    expect(classes(shell)).toContain("max-w-2xl");
    expect(classes(shell)).toContain("pt-9");
    expect(classes(shell)).toContain("pb-[52px]");
    // Gutters live on <main>, so the column lines up with the wordmark.
    // The shipped shell was `py-8`; 6b asks for 36 above and 52 below.
    expect(classes(shell)).not.toContain("py-8");
  });
});
