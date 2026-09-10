/**
 * @vitest-environment jsdom
 *
 * The quiz's delta-01/03/04 treatment (design delta phase 3, mock 6b), and the
 * behaviour that must survive it.
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { BudgetSimulator } from "@/components/quiz/BudgetSimulator";
import { ForcedChoiceCard } from "@/components/quiz/ForcedChoiceCard";
import { PhaseTransition } from "@/components/quiz/PhaseTransition";
import { ProgressBar } from "@/components/quiz/ProgressBar";
import { ScaledQuestionCard } from "@/components/quiz/ScaledQuestionCard";
// Type-only, so it is erased at compile time and adds no runtime import of
// QuizFlow — which must stay dynamic, behind the `next/navigation` mock.
import type { QuizFlowProps } from "@/components/quiz/QuizFlow";
import { ministries } from "@/data/ministries";

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

  /** The mock-setup protocol, in one place: reset the module cache, register
   *  the `next/navigation` stub, then import QuizFlow and QuizProvider back
   *  through it. The ordering is subtle enough — reset before mock, both
   *  imports after — that a second copy is a second place to get it wrong,
   *  and a wrong copy fails as an unrelated-looking render error. */
  async function renderIntro(forcedChoiceItems: QuizFlowProps["forcedChoiceItems"]) {
    vi.resetModules();
    vi.doMock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
    const { QuizFlow } = await import("@/components/quiz/QuizFlow");
    const { QuizProvider } = await import("@/components/quiz/QuizProvider");

    return render(
      createElement(
        QuizProvider,
        null,
        createElement(QuizFlow, { forcedChoiceItems, scaledItems: [], ministries: [] }),
      ),
    );
  }

  /** Two items, and the count is load-bearing. At `length === 1`,
   *  `currentQuestionIndex === shuffledFC.length - 1` is already true on the
   *  first screen, so the forward button reads "Continue" and `byText(...,
   *  "Next")` finds nothing. Trimming this array breaks two tests in a way
   *  that reads as a styling regression rather than a fixture change. */
  const TWO_DILEMMAS: QuizFlowProps["forcedChoiceItems"] = [
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
  ];

  async function renderPhaseOne() {
    const container = await renderIntro(TWO_DILEMMAS);
    // The intro interstitial renders first; step past it into phase 1.
    act(() =>
      byText(container, "Begin").dispatchEvent(new MouseEvent("click", { bubbles: true })),
    );
    return container;
  }

  /** Throws rather than returning `undefined`. With a bare `!`, renaming a nav
   *  button surfaces as `Cannot read properties of undefined (reading
   *  'disabled')` in four tests at once, which names neither the button nor
   *  the rename. */
  function byText(container: Element, text: string) {
    const found = [...container.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === text,
    );
    if (!found) throw new Error(`no button labelled "${text}"`);
    return found;
  }

  it("opens on an interstitial whose call to action is the ink primary", async () => {
    // No items: this test never clicks past the intro, so the fixture is empty.
    const container = await renderIntro([]);

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

describe("PhaseTransition", () => {
  function renderTransition() {
    return render(
      createElement(PhaseTransition, {
        completedPhase: 1,
        completedCount: 36,
        nextPhaseTitle: "Nuanced scales",
        nextPhaseDescription: "You're more than halfway done.",
        estimatedTime: "~5 minutes",
        onContinue: () => {},
      }),
    );
  }

  it("sets both labels in the mono role at a colour that survives dark mode", () => {
    const container = renderTransition();
    const labels = [...container.querySelectorAll("p")].filter((p) =>
      classes(p).includes("label"),
    );

    expect(labels.map((p) => p.textContent)).toEqual(["Phase 1 complete", "Up next"]);
    for (const p of labels) {
      expect(classes(p)).toContain("text-text-label");
      // The Stone ramp does not invert: text-stone-800 measures 1.78:1 on the
      // dark panel ground — and dark `--border-primary` is also #5a4636, so the
      // old label rendered at exactly the panel's border colour.
      expect(classes(p)).not.toContain("text-stone-800");
    }
  });

  it("titles the next phase in the serif card role and dates it in the caption role", () => {
    const container = renderTransition();

    expect(classes(container.querySelector("h3")!)).toContain("display-s");
    const caption = [...container.querySelectorAll("p")].find((p) =>
      p.textContent?.startsWith("Estimated time"),
    )!;
    expect(classes(caption)).toContain("caption-italic");
  });

  it("carries the flow forward on the ink primary", () => {
    const container = renderTransition();
    const button = container.querySelector("button")!;

    expect(button.textContent).toBe("Continue");
    expect(classes(button)).toContain("bg-button-primary");
    expect(classes(button)).toContain("control");
    expect(classes(button)).toContain("w-full");
    expect(classes(button)).not.toContain("border-stone-600");
  });
});

describe("ScaledQuestionCard", () => {
  const base = {
    questionStem: "How should services be funded?",
    option1Label: "One", option1Detail: "Detail one.",
    option2Label: "Two", option2Detail: "Detail two.",
    option3Label: "Three", option3Detail: "Detail three.",
    option4Label: "Four", option4Detail: "Detail four.",
    option5Label: "Five", option5Detail: "Detail five.",
    onSelect: () => {},
  };

  function renderScale(selectedValue: 1 | 2 | 3 | 4 | 5 | undefined) {
    return render(createElement(ScaledQuestionCard, { ...base, selectedValue }));
  }

  it("sets the stem in the serif card role — it is content, not an instruction", () => {
    const container = renderScale(undefined);
    const stem = container.querySelector("p")!;

    expect(stem.textContent).toBe("How should services be funded?");
    expect(classes(stem)).toContain("display-s");
    expect(classes(stem)).not.toContain("label");
  });

  it("prompts in the mono label role until a value is chosen", () => {
    const container = renderScale(undefined);
    const hint = [...container.querySelectorAll("p")].find(
      (p) => p.textContent === "Select to see full description",
    )!;

    expect(classes(hint)).toContain("label");
    expect(classes(hint)).toContain("text-text-label");
    expect(classes(hint)).not.toContain("text-text-tertiary");
  });

  it("fills the chosen desktop segment with ink and leaves the others on paper", () => {
    const container = renderScale(3);
    const desktop = container.querySelector("[data-scale-segments]")!;
    const buttons = [...desktop.querySelectorAll("button")];

    expect(classes(buttons[2])).toContain("bg-button-primary");
    expect(classes(buttons[2])).toContain("text-button-primary-fg");
    // Stone 600 is the focus ring and the progress fill; it is not a fill here.
    expect(classes(buttons[2])).not.toContain("bg-stone-200");
    expect(classes(buttons[0])).toContain("bg-surface-1");
    expect(classes(buttons[0])).not.toContain("bg-button-primary");
    // The dimmed sibling carries its de-emphasis in opacity. The NEGATIVE is
    // the assertion that matters: `text-text-label` resolves to the same
    // #6e5a48 as `text-text-secondary` in light mode, so a revert to it would
    // render identically and no mutation could observe the difference.
    expect(classes(buttons[0])).toContain("opacity-60");
    expect(classes(buttons[0])).not.toContain("text-text-label");
    // The segmented wrapper must not clip its children's focus outlines.
    expect(classes(desktop)).not.toContain("overflow-hidden");
  });

  it("mirrors the choice card's border states in the mobile list", () => {
    const container = renderScale(2);
    const mobile = container.querySelector("[data-scale-list]")!;
    const buttons = [...mobile.querySelectorAll("button")];

    expect(classes(buttons[1])).toContain("border-rule-strong");
    expect(classes(buttons[1])).not.toContain("opacity-60");
    expect(classes(buttons[0])).toContain("border-border-secondary");
    expect(classes(buttons[0])).toContain("opacity-60");
  });

  // Not in the plan. Added after a mutation sweep found that swapping the two
  // wrappers' visibility classes, showing both at once, or hiding both, all
  // left the whole suite green. jsdom evaluates no media query, so the class
  // tokens are the only thing a unit test can hold — and
  // `tests/e2e/quiz-flow.spec.ts` clicks the first *visible*
  // `button[aria-pressed]`, which silently picks the wrong layout, or none.
  it("shows exactly one of the two layouts at a time", () => {
    const container = renderScale(undefined);
    const desktop = classes(container.querySelector("[data-scale-segments]")!);
    const mobile = classes(container.querySelector("[data-scale-list]")!);

    expect(desktop).toContain("hidden");
    expect(desktop).toContain("min-[560px]:flex");
    expect(desktop).not.toContain("flex");

    expect(mobile).toContain("flex");
    expect(mobile).toContain("min-[560px]:hidden");
    expect(mobile).not.toContain("hidden");
  });

  it("separates the detail text with a rule rather than a third surface", () => {
    const container = renderScale(4);
    const detail = container.querySelector("[data-scale-detail]")!;

    expect(detail.textContent).toContain("Detail four.");
    expect(classes(detail)).toContain("border-t");
    // The quiz already spends its two surface switches on the ground and the
    // cards; delta 04 caps it there.
    expect(classes(detail)).not.toContain("bg-surface-2");
    // `mt-4` replaced `mt-3` on the live region. 4px is invisible and the old
    // value still reads as correct, so nothing else catches a revert.
    expect(classes(detail.parentElement!)).toContain("mt-4");
    // The prose pair replaced `text-[13px] leading-relaxed`. Task 8 guards the
    // 13.5px/1.6 PAIRING but not its presence — reverting BOTH halves passes
    // that guard vacuously, because a file with no `text-[13.5px]` has no
    // offender to report.
    const prose = detail.querySelector("p")!;
    expect(classes(prose)).toContain("text-[13.5px]");
    expect(classes(prose)).toContain("leading-[1.6]");
    expect(classes(prose)).not.toContain("leading-relaxed");
  });
});

describe("BudgetSimulator", () => {
  function renderBudget(allocations: Record<number, number>) {
    return render(
      createElement(BudgetSimulator, {
        ministries,
        allocations,
        onAllocate: () => {},
        onFinalize: () => {},
      }),
    );
  }

  const fresh = Object.fromEntries(ministries.map((m) => [m.id, 1]));

  it("rules the sticky counter instead of floating it on a third surface", () => {
    const container = renderBudget(fresh);
    const counter = container.querySelector("[data-budget-counter]")!;

    expect(classes(counter)).toContain("sticky");
    expect(classes(counter)).toContain("border-b");
    expect(classes(counter)).toContain("border-rule-strong");
    expect(classes(counter)).not.toContain("bg-surface-2");
    // The POSITIVE is the load-bearing half. `bg-surface-3` is byte-identical
    // to the body ground (globals.css:231), which is what makes this read as a
    // rule rather than a floating panel — and it is what stops ministry cards
    // bleeding through mid-scroll. Dropping the class entirely is silent on
    // first paint and only shows once the user scrolls.
    expect(classes(counter)).toContain("bg-surface-3");
    // Both sticky bars bleed to the viewport edge below 560px, so their ink
    // rules run edge to edge and read as one bracket around the list. Without
    // this the counter's rule stopped at 18/372 while the confirm bar's ran
    // 0/390 — measured in the sweep, invisible to every test.
    expect(classes(counter)).toContain("-mx-[18px]");
    expect(classes(counter)).toContain("px-[18px]");
    expect(classes(counter)).toContain("min-[560px]:mx-0");
    expect(classes(counter)).toContain("min-[560px]:px-0");
    expect(classes(counter.querySelector("[data-budget-counter-label]")!)).toContain("label");
    // The instruction above the counter is prose, not the mono label role —
    // at 85 characters that role wrapped to two all-caps lines at every width
    // and outweighed this label, which is the real structural one.
    const instruction = container.querySelector("[data-budget-instruction]")!;
    expect(classes(instruction)).toContain("text-[12.5px]");
    expect(classes(instruction)).toContain("leading-[1.6]");
    expect(classes(instruction)).not.toContain("label");
  });

  it("bleeds the sticky confirm bar to the page's own gutter", () => {
    const container = renderBudget(fresh);
    const bar = container.querySelector("[data-budget-confirm]")!;

    // main is px-[18px] below the breakpoint (Task 4); -mx-4 would leave a 2px
    // strip of ground either side of the bar.
    expect(classes(bar)).toContain("-mx-[18px]");
    expect(classes(bar)).toContain("px-[18px]");
    // Below 560px BOTH sticky bars are pinned at once, so they must agree.
    // The counter is `bg-surface-3` + an ink rule; a `bg-surface-1` +
    // hairline footer would read as the floating panel delta 04 retires,
    // bracketing one scroll with two different idioms. Only a code read
    // catches this — no test renders below 560px and the e2e runs at 1280.
    expect(classes(bar)).toContain("bg-surface-3");
    expect(classes(bar)).toContain("border-rule-strong");
    // The codebase's single breakpoint is 560px, not Tailwind's sm (640px).
    expect(classes(bar)).toContain("min-[560px]:static");
    // `sticky bottom-0 z-10` is behaviour, not decoration: below 560px this bar
    // is the only way to reach Confirm without scrolling past seven ministry
    // cards. Removing it outright left the full suite green, and the e2e run is
    // at 1280px where the bar is `static` anyway — so nothing else can catch it.
    expect(classes(bar)).toContain("sticky");
    expect(classes(bar)).toContain("bottom-0");
    expect(classes(bar)).toContain("z-10");
    // The `sm:`-absence assertion below catches a MISSED conversion but not a
    // dropped or mistyped one — all five of the others could vanish silently.
    // Pin the set rather than the members.
    expect(classes(bar).filter((t) => t.startsWith("min-[560px]:")).sort()).toEqual([
      "min-[560px]:bg-transparent",
      "min-[560px]:border-0",
      "min-[560px]:mx-0",
      "min-[560px]:px-0",
      "min-[560px]:py-0",
      "min-[560px]:static",
    ]);
    expect(classes(bar).some((token) => token.startsWith("sm:"))).toBe(false);
  });

  it("confirms the budget on the ink primary", () => {
    const container = renderBudget(fresh);
    const confirm = [...container.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === "Confirm budget",
    )!;

    expect(classes(confirm)).toContain("bg-button-primary");
    expect(classes(confirm)).toContain("control");
    expect(classes(confirm)).toContain("w-full");
    expect(confirm.disabled).toBe(true);
  });

  it("squares the allocation track", () => {
    const container = renderBudget(fresh);
    const track = container.querySelector("[data-budget-track]")!;

    expect(classes(track)).not.toContain("rounded-[3px]");
    expect(classes(track.firstElementChild!)).not.toContain("rounded-[3px]");
  });

  it("labels each ministry in the mono role and its description in prose", () => {
    const container = renderBudget(fresh);
    const name = container.querySelector("[data-ministry-name]")!;
    const description = container.querySelector("[data-ministry-description]")!;

    expect(classes(name)).toContain("label");
    expect(classes(name)).toContain("text-text-primary");
    // `label` declares no font-weight, so the old string's `font-medium` would
    // silently drop to 400 without this. `ForcedChoiceCard` spells the same
    // "mono label at primary emphasis" the same way.
    expect(classes(name)).toContain("font-medium");
    expect(classes(description)).toContain("text-text-secondary");
    expect(classes(description)).not.toContain("text-text-tertiary");
  });

  it("sets the consequence line in the caption role once the user has moved something", () => {
    const container = renderBudget({ ...fresh, 1: 12 });
    const consequence = container.querySelector("[data-ministry-consequence]")!;

    expect(classes(consequence)).toContain("caption-italic");
  });
});

const quizSources = readdirSync(resolve(process.cwd(), "src/components/quiz"))
  .filter((name) => name.endsWith(".tsx"))
  .map((name) => ({
    name,
    text: readFileSync(resolve(process.cwd(), "src/components/quiz", name), "utf8"),
  }));

describe("quiz chrome drift guards", () => {
  it("has no source left in the quiz directory unswept", () => {
    // A sanity check on the sweep itself: if a component is added or renamed,
    // the guards below silently stop covering it.
    expect(quizSources.map((s) => s.name).sort()).toEqual([
      "BudgetSimulator.tsx",
      "ComputingMessages.tsx",
      "ForcedChoiceCard.tsx",
      "PhaseTransition.tsx",
      "ProgressBar.tsx",
      "QuizFlow.tsx",
      "QuizProvider.tsx",
      "ScaledQuestionCard.tsx",
    ]);
  });

  it("retires text-text-tertiary from the quiz", () => {
    // Stone 500 measures 2.73:1 on the page ground and 3.28:1 on the cards —
    // under AA for small text either way. D7 routes the label layer through
    // --text-label; prose moves to --text-secondary. D6 defers layout on
    // undrawn screens, not this.
    const offenders = quizSources
      .filter(({ text }) => text.includes("text-text-tertiary"))
      .map(({ name }) => name);

    expect(offenders).toEqual([]);
  });

  it("keeps Stone 600 to the two progress marks, its one remaining job", () => {
    // Delta 03 moved the primary off Stone 600 onto the ink token pair. Two
    // progress marks keep it as a fill — the three-segment bar, and the
    // computing screen's animated line — and nothing else in the quiz may.
    // Pinned as exact counts rather than an allowlist, so a second hand-rolled
    // fill in QuizFlow does not slip through on the file's name alone.
    // `hover:border-stone-600` on the choice states is a border, not a fill,
    // and does not match.
    const counts = Object.fromEntries(
      quizSources
        .map(({ name, text }) => [name, text.split("bg-stone-600").length - 1] as const)
        .filter(([, count]) => count > 0),
    );

    expect(counts).toEqual({ "ProgressBar.tsx": 1, "QuizFlow.tsx": 1 });
  });

  it("puts the quiz gutters on the page, matching the nav", () => {
    // BudgetSimulator's sticky bar bleeds against these exact values; if they
    // move, its -mx has to move with them.
    const page = readFileSync(resolve(process.cwd(), "src/app/quiz/page.tsx"), "utf8");

    expect(page).toContain("px-[18px] min-[560px]:px-7");
    expect(page).not.toContain('className="min-h-screen px-4"');
  });

  it("keeps the two skip links identical", () => {
    // Phase 1 and phase 2 render byte-identical nav rows, and only phase 1 is
    // mounted by any test. This is a structural pin, deliberately chosen over
    // extracting a <QuestionNav> component: the props interface would be as
    // long as the JSX it replaced, and `quiz-flow.spec.ts` drives these rows
    // by accessible name.
    const quizFlow = quizSources.find((s) => s.name === "QuizFlow.tsx")!.text;
    const skips = [
      ...quizFlow.matchAll(/className="([^"]*)"\s*>\s*\n\s*Skip this question/g),
    ];

    expect(skips).toHaveLength(2);
    expect(skips[0][1]).toBe(skips[1][1]);
  });

  it("pins the replaced values on screens nothing mounts", () => {
    // Six value-for-value replacements from Task 4 that a seven-way mutation
    // proved leave the whole suite green. Source greps rather than rendered
    // mounts: the screens are awkward to reach (the finalize alert needs
    // `encodeResponses` to throw; the resume screen needs mid-quiz
    // sessionStorage), and Step 5's manual walk reaches none of them either.
    const quizFlow = quizSources.find((s) => s.name === "QuizFlow.tsx")!.text;
    const computing = quizSources.find((s) => s.name === "ComputingMessages.tsx")!.text;

    // Renders only when encodeResponses throws. No test, no sweep, no human.
    expect(quizFlow).toMatch(/rounded-sharp border-l-2 border-warning bg-warning-bg/);
    // `label`, not `label-nav`. The four mono roles differ ONLY in tracking
    // (0.14/0.12/0.10/0.02em), so at 11px the wrong one is invisible on screen
    // — and `classes()`'s own comment warns that a substring check would pass
    // on either.
    expect(quizFlow).toMatch(/className="label text-text-label mb-2">\s*\n?\s*Phase 1 of 3/);
    expect(quizFlow).toMatch(/className="display-entry text-text-primary mb-2">\s*\n?\s*Welcome back/);
    expect(quizFlow).toMatch(/className="caption-italic mb-8"/);
    // 12px sans tertiary -> 13.5px/1.6 secondary, on screen for 1800ms before
    // the redirect fires.
    expect(computing).toMatch(/text-\[13\.5px\] leading-\[1\.6\] text-text-secondary/);
  });

  it("never layers a colour over a self-contained role", () => {
    // `caption-italic` declares its own `color`. Layering `text-*` beside it
    // is banned — whether the custom rule wins depends on Tailwind's emitted
    // order, which is too subtle to rely on. A review mutation proved this
    // offence had NO net anywhere in the repo, in any file.
    const offenders = quizSources.flatMap(({ name, text }) =>
      [...text.matchAll(/className="([^"]*\bcaption-italic\b[^"]*)"/g)]
        .filter(([, classNames]) => /\btext-(?!\[)[a-z-]+\b/.test(classNames))
        .map(([, classNames]) => `${name}: ${classNames}`),
    );

    expect(offenders).toEqual([]);
  });

  it("keeps the delta's prose size and its line-height together", () => {
    // `text-[13.5px] leading-[1.6]` is the quiz's most-repeated literal — nine
    // occurrences across five files — and it is the one size in the delta with
    // no named role, so the pair travels by convention alone. A `text-[13.5px]`
    // that loses its `leading-[1.6]` drifts silently. Minting a `body-s` role
    // is the better fix and is recorded as a follow-up; this holds the line
    // until then.
    //
    // Known limitation, measured rather than assumed: this passes VACUOUSLY
    // where the size is deleted outright, because it only inspects the matches
    // it finds. It guards the pairing, not the presence. Deleting the pair at
    // each of the nine call sites in turn reddens the suite at only three of
    // them — ForcedChoiceCard:100 and ScaledQuestionCard:155 (rendered
    // assertions) and ComputingMessages:25 (the source pin above).
    // PhaseTransition's two prose lines and QuizFlow's four (Unrecoverable,
    // resume, intro, finalize alert) have no presence guard at all. That is
    // accepted, not overlooked: a missing size class falls back to the 16px
    // browser default, which is loud enough to catch by opening the page —
    // the pinning rule's own exemption. Silent DRIFT within the pair is the
    // failure this test exists for.
    const offenders = quizSources.flatMap(({ name, text }) =>
      [...text.matchAll(/className="([^"]*\btext-\[13\.5px\][^"]*)"/g)]
        .filter(([, classNames]) => !classNames.includes("leading-[1.6]"))
        .map(([, classNames]) => `${name}: ${classNames}`),
    );

    expect(offenders).toEqual([]);
  });

  it("uses text-text-label only on the mono label layer", () => {
    // Task 6 shipped a real defect by reaching for this token to express
    // de-emphasis: `--text-label` and `--text-secondary` are BOTH #6e5a48 in
    // light mode, so it expressed nothing — and rendered identically, which is
    // why no mutation could observe it. The token belongs to the mono label
    // layer only; dim with `opacity-60` instead.
    //
    // Line-scoped, and comments are skipped, because the explanatory comments
    // in ScaledQuestionCard name the token without using it.
    const offenders = quizSources.flatMap(({ name, text }) =>
      text
        .split("\n")
        .map((line, index) => ({ line, number: index + 1 }))
        .filter(({ line }) => {
          const t = line.trimStart();
          return !t.startsWith("//") && !t.startsWith("*");
        })
        .filter(({ line }) => line.includes("text-text-label"))
        // A mono role token must sit on the same element. Strip the colour
        // class first so its own trailing "label" cannot satisfy the check.
        .filter(({ line }) => !/\blabel(?:-nav|-eyebrow|-tight)?\s/.test(
          line.replace(/text-text-label/g, ""),
        ))
        .map(({ number, line }) => `${name}:${number}: ${line.trim()}`),
    );

    expect(offenders).toEqual([]);
  });

  it("holds the 11px type floor across the quiz", () => {
    // Every explicit size in the quiz sits at or above the delta's floor.
    const sizes = quizSources.flatMap(({ name, text }) =>
      [...text.matchAll(/text-\[(\d+(?:\.\d+)?)px\]/g)].map((match) => ({
        name,
        px: Number(match[1]),
      })),
    );

    expect(sizes.length).toBeGreaterThan(0);
    expect(sizes.filter((entry) => entry.px < 11)).toEqual([]);
  });
});
