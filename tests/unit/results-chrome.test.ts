/**
 * @vitest-environment jsdom
 *
 * The results page's delta-01/03/04/05/06 treatment (design delta phase 4,
 * mocks 7a and 7b), and the behaviour that must survive it.
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AxisBreakdownCard } from "@/components/results/AxisBreakdownCard";
import { ComparisonScoreBar } from "@/components/comparison/ComparisonScoreBar";
import { getDomainMarkVar } from "@/lib/design-tokens";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: { container: HTMLDivElement; root: Root }[] = [];

function render(element: ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  // Registered BEFORE rendering, so a component that throws during render
  // cannot strand its container in document.body with nothing to clean it up.
  mounted.push({ container, root });
  act(() => root.render(element));
  return container;
}

function click(target: EventTarget) {
  act(() => target.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

/** Class tokens. `toContain` on a raw className also matches substrings of
 *  other classes — `label` inside `label-tight`, `body-s` inside nothing but
 *  close enough to `body-lead` to matter — which has shipped three bugs in
 *  this migration.
 *
 *  `classList`, not `className.split(...)`: on an SVGElement `className` is a
 *  read-only `SVGAnimatedString` with no `.split`, and TypeScript will not
 *  catch the call because `SVGElement` declares it `any`. This phase renders
 *  four SVG charts. */
function classes(element: Element): string[] {
  return [...element.classList];
}

const resultsDir = resolve(process.cwd(), "src/components/results");
const resultsSources = readdirSync(resultsDir)
  .filter((name) => name.endsWith(".tsx"))
  .map((name) => ({ name, text: readFileSync(resolve(resultsDir, name), "utf8") }));

// Hook convention for this file, which gets appended to across eight more
// tasks: a `data-axis-*` attribute exists only to give an element identity
// for a selector. It is never itself the thing under test — a class, a text
// value, or another attribute read off the element it identifies is. The
// hook count should grow only when a real assertion needs a name, not
// whenever a selector feels awkward.

afterEach(() => {
  while (mounted.length) {
    const entry = mounted.pop()!;
    try {
      act(() => entry.root.unmount());
    } finally {
      // In a `finally` so a throwing unmount cannot strand THIS container.
      entry.container.remove();
    }
  }
});

const AXIS = {
  axisId: 3,
  name: "Governance Structure",
  poleALabel: "Distributed Governance",
  poleBLabel: "Centralized Governance",
  tagline: "Where should decisions be made?",
  domain: "Power and Authority",
  finalScore: -0.5,
  confidence: "high",
  tension: { detected: false, level: "none", direction: null, narrative: null },
  // Axis 3 is a no-budget axis: weights are { fc: 0.60, sc: 0.40, bg: 0.00 }.
  // 0.60*(-0.6) + 0.40*(-0.35) + 0 = -0.50, matching finalScore exactly, and
  // bg: null reflects that this axis carries no budget signal (the Budget
  // cell renders "N/A" and the formula's bg term is suppressed). Because of
  // that, the `weights.bg > 0` branch of the formula string is permanently
  // unreachable from this fixture — a case on axis 1, 2 or 5 is needed to
  // exercise it, and AXIS alone should not be assumed representative there.
  components: { fc: -0.6, sc: -0.35, bg: null as number | null },
};

describe("AxisBreakdownCard", () => {
  it("lays the row out on the mock's three-column grid", () => {
    const container = render(createElement(AxisBreakdownCard, AXIS));
    const grid = container.querySelector("[data-axis-row]")!;

    // 24px index, elastic middle, 210px meta. Pinned because a wrong track
    // width still renders a plausible-looking row.
    expect(classes(grid)).toContain("min-[560px]:grid-cols-[24px_minmax(0,1fr)_210px]");
    // Below the breakpoint the meta column drops BENEATH the scale rather
    // than squeezing a 210px column into a 320px screen.
    expect(classes(grid)).toContain("grid-cols-[24px_minmax(0,1fr)]");
    // `items-center` centres the middle cell while the index's `pt-1` pins
    // to the track top, so the axis number floats above its own name on
    // every row where the meta column outgrows the middle one (every tension
    // row, since every tagline wraps in a 210px column). Divergence from the
    // mock's `align-items:center` is deliberate — see the component comment.
    expect(classes(grid)).toContain("items-start");
    expect(classes(grid)).not.toContain("items-center");
  });

  it("separates rows by a rule instead of a zebra fill", () => {
    const container = render(createElement(AxisBreakdownCard, AXIS));
    const row = container.firstElementChild!;

    // Delta 04: rules carry structure and cards stop floating. The prop that
    // drove the alternating fill is gone from the interface, so this cannot
    // regress by a caller passing `false`.
    expect(classes(row)).toContain("border-b");
    expect(classes(row)).toContain("border-border-secondary");
    expect(container.querySelector(".bg-surface-2")).toBeNull();
    expect(container.querySelector(".rounded-sharp")).toBeNull();
  });

  it("numbers the axis and prints its signed score on the name line", () => {
    const container = render(createElement(AxisBreakdownCard, AXIS));

    expect(container.querySelector("[data-axis-index]")!.textContent).toBe("03");
    expect(container.querySelector("[data-axis-score]")!.textContent).toBe("-0.50");
  });

  it("renders the tension flag in the reserved warning accent", () => {
    // The AXIS fixture defaults to tension.detected: false, so the row's only
    // use of the --warning accent never renders unless a case exercises it.
    const container = render(
      createElement(AxisBreakdownCard, {
        ...AXIS,
        tension: { detected: true, level: "moderate", direction: null, narrative: null },
      }),
    );
    const flag = container.querySelector("[data-axis-tension]");

    expect(flag).not.toBeNull();
    expect(flag!.textContent).toBe("Tension detected");
    expect(classes(flag!)).toContain("text-warning-text");
  });

  it("moves the confidence label and tagline into the meta column", () => {
    const container = render(createElement(AxisBreakdownCard, AXIS));
    const meta = container.querySelector("[data-axis-meta]")!;

    expect(meta.textContent).toContain("High confidence");
    expect(meta.textContent).toContain("Where should decisions be made?");
    // It is the third grid cell on desktop and the second on mobile, so it
    // must start in column 2 when the third track does not exist.
    expect(classes(meta)).toContain("col-start-2");
    expect(classes(meta)).toContain("min-[560px]:col-start-3");

    // Type role, not just visible text: `label` would visibly UPPERCASE the
    // confidence line, a delta violation that a plain textContent check
    // cannot see. Same shape as tests/unit/footer-chrome.test.ts:33-36.
    const confidence = container.querySelector("[data-axis-confidence]")!;
    expect(classes(confidence)).toContain("mono-meta");
    expect(classes(confidence)).not.toContain("label");

    // The tagline is the mock's 12px/1.5 role, named `body-xs` rather than
    // carried as `text-xs leading-[1.5]` — reverting to that raw pair
    // currently leaves every rendered assertion here green, which is exactly
    // what globals.css documents an unnamed size/leading pair as unable to
    // catch. `> p:last-child` is stable: the tagline is always the meta
    // column's final paragraph.
    const tagline = container.querySelector("[data-axis-meta] > p:last-child")!;
    expect(classes(tagline)).toContain("body-xs");
    expect(classes(tagline)).not.toContain("text-xs");
  });

  it("draws the scale through the shared primitive, described in words", () => {
    const container = render(createElement(AxisBreakdownCard, AXIS));
    const scale = container.querySelector("[role='img']")!;

    // The whole point of building PairedAxisScale. If this row ever draws its
    // own track again, the description regresses to two aria-hidden dots.
    expect(scale.getAttribute("aria-label")).toBe(
      "Governance Structure: moderately toward Distributed Governance",
    );
    expect(container.querySelector("[data-respondent='b']")).toBeNull();

    // `endpoints="below"`, pinned through DOM order rather than a class,
    // since PairedAxisScale places the pole labels by render order, not by a
    // toggled class: the track-bearing element is the scale's first child,
    // and the endpoint row (which contains no [data-track]) is its last.
    expect(scale.firstElementChild!.querySelector("[data-track]")).not.toBeNull();
    expect(scale.lastElementChild!.querySelector("[data-track]")).toBeNull();
  });

  it("keeps the scoring disclosure behind the section toggle", () => {
    const closed = render(createElement(AxisBreakdownCard, AXIS));
    expect(closed.textContent).not.toContain("See how this was scored");

    const open = render(createElement(AxisBreakdownCard, { ...AXIS, showScoring: true }));
    expect(open.textContent).toContain("See how this was scored");
  });

  it("expands the scoring disclosure on click, without reviving the retired card styling", () => {
    const container = render(createElement(AxisBreakdownCard, { ...AXIS, showScoring: true }));
    const button = container.querySelector("button")!;

    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.textContent).toContain("See how this was scored");

    click(button);

    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.textContent).toContain("Hide scoring breakdown");

    // The four bg-surface-2/bg-surface-1 + rounded-sharp card wrappers this
    // task removed lived INSIDE this panel. Test 2's negative guards only
    // ever render the collapsed default, so only an expanded render actually
    // covers the place the cards were.
    expect(container.querySelector(".bg-surface-2")).toBeNull();
    expect(container.querySelector(".rounded-sharp")).toBeNull();

    // The disclosure's whole reason to exist ("radical transparency") is
    // that this string adds up. Pinned exactly: swapping which weight
    // multiplies which component score (fc's weight against sc's value, say)
    // renders a formula that visibly does not add up, and nothing else here
    // would notice.
    expect(container.textContent).toContain(
      "(0.60 × -0.60) + (0.40 × -0.35) = -0.50",
    );

    // Scoped to the Budget cell specifically — the third of the three
    // fc/sc/bg cells in the breakdown grid — not asserted against the whole
    // row, where "N/A" would also pass if it turned up anywhere else.
    const budgetCell = container.querySelector(".grid-cols-3")!.children[2];
    expect(budgetCell.textContent).toContain("N/A");

    // The disclosure's indent is unconditional, not `min-[560px]:pl-10`:
    // below the breakpoint the meta column already sits at this same 40px
    // indent (24px index + 16px gap), so the panel needs the same push there
    // too, not none. Reverting to the conditional class is currently green
    // everywhere else in this file.
    const disclosure = button.parentElement!;
    expect(classes(disclosure)).toContain("pl-10");
    expect(classes(disclosure)).not.toContain("min-[560px]:pl-10");
  });

  it("no longer imports ScoreBar or getDomainColor600 from the retired axis-row primitives", () => {
    // Task 4's Interfaces section promises both imports are dropped: the row
    // now draws through PairedAxisScale, which owns the dot's colour-stepping
    // via getDomainMarkVar internally — AxisBreakdownCard itself calls
    // neither. Guarded on source text — this task is the first of ScoreBar's
    // three call sites to move, and Task 5 cannot delete ScoreBar.tsx while
    // any results component still imports it.
    const card = resultsSources.find((f) => f.name === "AxisBreakdownCard.tsx");
    expect(card).toBeDefined();
    // Matches both the relative spelling and an aliased one
    // (`@/components/results/ScoreBar`), not just `"./ScoreBar"`.
    expect(card!.text).not.toMatch(/from\s+["'][^"']*\/ScoreBar["']/);
    expect(card!.text).not.toContain("getDomainColor600");
  });
});

describe("ComparisonScoreBar", () => {
  const PAIR = {
    axisId: 3,
    axisName: "Governance Structure",
    tagline: "Where should decisions be made?",
    scoreA: -0.5,
    scoreB: 0.9,
    poleALabel: "Distributed Governance",
    poleBLabel: "Centralized Governance",
    labelA: "You",
    labelB: "Them",
  };

  it("draws both respondents through the shared primitive", () => {
    const container = render(createElement(ComparisonScoreBar, PAIR));

    expect(container.querySelector("[data-respondent='a']")).not.toBeNull();
    expect(container.querySelector("[data-respondent='b']")).not.toBeNull();
    // It must not draw its own track. A second implementation of the same
    // thing is the defect this convergence exists to remove.
    expect(container.querySelectorAll("[data-track]")).toHaveLength(1);
  });

  it("replaces the mouse-only tooltips with permanent readouts", () => {
    const container = render(createElement(ComparisonScoreBar, PAIR));

    // The tooltips they replace had no keyboard or screen-reader path, so
    // this is a strict accessibility gain, not a like-for-like restyle.
    expect(container.querySelector("[data-readout='a']")!.textContent).toBe("You -0.50");
    expect(container.querySelector("[data-readout='b']")!.textContent).toBe("Them +0.90");
  });

  it("names the respondents inside the scale's description", () => {
    const container = render(createElement(ComparisonScoreBar, PAIR));

    expect(container.querySelector("[role='img']")!.getAttribute("aria-label")).toBe(
      "Governance Structure: You moderately toward Distributed Governance, " +
        "Them strongly toward Centralized Governance; far apart",
    );
  });

  it("derives the gap badge from the same two scores as the scale, not an independent prop", () => {
    // `delta` used to arrive as a prop the caller computed separately from
    // scoreA/scoreB. A fixture that set delta inconsistently with the scores
    // could make the visible badge and the aria-label's trailing clause
    // disagree; deriving delta inside the component from scoreA/scoreB makes
    // that impossible rather than merely untested. This pair (-0.5, -0.3) is
    // close enough to land in the "close agreement" bucket.
    const container = render(
      createElement(ComparisonScoreBar, { ...PAIR, scoreA: -0.5, scoreB: -0.3 }),
    );

    const ariaLabel = container.querySelector("[role='img']")!.getAttribute("aria-label")!;
    const trailingClause = ariaLabel.slice(ariaLabel.lastIndexOf("; ") + 2);

    expect(container.querySelector("[data-gap]")!.textContent).toBe(trailingClause);
    expect(trailingClause).toBe("close agreement");
  });

  it("hides the gap badge from the accessibility tree, since the aria-label already says it", () => {
    // The badge's text is byte-identical to the aria-label's trailing clause
    // (proven by the previous test). Left exposed, a screen-reader user would
    // hear the same relationship twice per row, twelve times down the page.
    const container = render(createElement(ComparisonScoreBar, PAIR));

    expect(container.querySelector("[data-gap]")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("marks each readout with the same dot vocabulary the scale itself uses", () => {
    // The tooltips this replaced were the only thing tying a respondent's
    // name to a specific dot. `/compare/[id]/[id]` has no legend at all, so
    // the mapping has to live on the readout itself. The colour must be the
    // mode-stepping custom property the primitive uses for its own dot, not
    // a fixed hex, or the swatch would desync from the real dot in dark mode.
    const container = render(createElement(ComparisonScoreBar, PAIR));

    const markA = container.querySelector("[data-mark='a']")! as HTMLElement;
    const markB = container.querySelector("[data-mark='b']")! as HTMLElement;

    expect(markA.getAttribute("aria-hidden")).toBe("true");
    expect(markB.getAttribute("aria-hidden")).toBe("true");

    // A is the filled dot: same custom property as the primitive's own
    // respondent-A mark, not a literal hex.
    expect(markA.style.backgroundColor).toBe(getDomainMarkVar(PAIR.axisId));
    // B is the outlined dot: a border, not a fill.
    expect(classes(markB)).toContain("border-text-label");
    expect(classes(markB)).not.toContain("bg-text-label");
  });

  it("uses the design system's named type roles, not the pre-commit raw utility pairs", () => {
    // `text-text-label` and `text-text-secondary` resolve to the identical
    // hex in light mode, so only a class assertion (never a computed style)
    // can tell the named role from the retired one.
    const container = render(createElement(ComparisonScoreBar, PAIR));

    const gap = container.querySelector("[data-gap]")!;
    const axisNameSpan = gap.previousElementSibling!;
    expect(classes(axisNameSpan)).toContain("body-s");
    expect(classes(axisNameSpan)).not.toContain("text-sm");

    expect(classes(gap)).toContain("text-text-label");
    expect(classes(gap)).not.toContain("text-text-tertiary");
    // Long axis names must not be allowed to squeeze the badge into wrapping.
    expect(classes(gap)).toContain("shrink-0");

    const tagline = container.querySelector("p")!;
    expect(classes(tagline)).toContain("body-xs");
    expect(classes(tagline)).not.toContain("text-xs");

    const readoutRow = container.querySelector("[data-readout='a']")!.parentElement!;
    expect(classes(readoutRow)).toContain("mono-meta");
    expect(classes(readoutRow)).toContain("text-text-secondary");
    expect(classes(readoutRow)).not.toContain("text-text-tertiary");
    // A long user-supplied name wrapping the row to two lines needs row gap,
    // or its 11px lines butt against each other at line-height 1.4.
    expect(classes(readoutRow)).toContain("gap-y-0.5");
  });

  it("keeps the pole endpoints below the track, not above it", () => {
    // Pinned through DOM order rather than a class, since PairedAxisScale
    // places the pole labels by render order: the track-bearing element is
    // the scale's first child only when `endpoints="below"` is actually
    // passed through, and its last child otherwise.
    const container = render(createElement(ComparisonScoreBar, PAIR));
    const scale = container.querySelector("[role='img']")!;

    expect(scale.firstElementChild!.querySelector("[data-track]")).not.toBeNull();
    expect(scale.lastElementChild!.querySelector("[data-track]")).toBeNull();
  });
});
