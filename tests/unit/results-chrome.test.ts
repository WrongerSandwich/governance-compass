/**
 * @vitest-environment jsdom
 *
 * The results page's delta-01/03/04/05/06 treatment (design delta phase 4,
 * mocks 7a and 7b), and the behaviour that must survive it.
 */
import { readFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ArchetypeCard } from "@/components/results/ArchetypeCard";
import { AxisBreakdownCard } from "@/components/results/AxisBreakdownCard";
import { CompassPlot } from "@/components/results/CompassPlot";
import { RadarChart } from "@/components/results/RadarChart";
import { ComparisonScoreBar } from "@/components/comparison/ComparisonScoreBar";
import { ResultsView, type ResultsViewProps } from "@/components/results/ResultsView";
import { getDomainMarkVar } from "@/lib/design-tokens";
import {
  AppRouterContext,
  ROUTER_STUB,
  installIntersectionObserverStub,
} from "../helpers/client-component-env";
import { sourceFiles } from "../helpers/source-files";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// `ResultsView` wraps all six of its sections in `FadeInSection`, which
// constructs an IntersectionObserver on mount.
installIntersectionObserverStub();

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

/** Every source file the results feature owns, as `{ path, text }` with
 *  `path` repo-relative and POSIX-separated.
 *
 *  Both directories, not just `src/components/results`: Task 5's own sub-AA
 *  violation landed at `src/app/results/[profileId]/[axisId]/page.tsx` -- the
 *  same feature, under `src/app` -- and every guard here was scoped to the
 *  components directory, so nothing caught it. It surfaced because a human
 *  happened to open the file.
 *
 *  Repo-relative paths rather than bare basenames: the sweep is recursive now
 *  and yields three different `page.tsx` files, so a basename no longer
 *  identifies a file and an assertion naming one could pass against the wrong
 *  one. `sourceFiles` (tests/helpers/source-files.ts) does the recursive walk
 *  with `node_modules` / `generated` / dot-directory pruning, and defaults to
 *  `.ts` as well as `.tsx` so a non-component helper dropped into either
 *  directory is swept too -- the `unswept` guard below reds when one appears,
 *  which is the point. */
const RESULTS_DIRS = ["src/components/results", "src/app/results"];
const resultsSources = RESULTS_DIRS.flatMap((dir) => {
  let files: string[];
  try {
    files = sourceFiles(resolve(process.cwd(), dir));
  } catch (cause) {
    // Module scope, so a renamed or deleted directory would otherwise abort
    // collection with a bare ENOENT and no hint that this file's RESULTS_DIRS
    // is what needs updating.
    throw new Error(`RESULTS_DIRS names a directory that does not exist: ${dir}`, { cause });
  }
  return files.map((file) => ({
    path: relative(process.cwd(), file).split(sep).join("/"),
    text: readFileSync(file, "utf8"),
  }));
});

/** Per-file occurrence counts for `pattern`, as a `{ path: count }` object with
 *  clean files omitted. `toEqual` against one of these fails closed in BOTH
 *  directions: a new offending file reds it, and so does an existing offender
 *  growing a ninth occurrence. A ratchet pinned to the file list alone does
 *  not — it stays green while the file it names gets worse. */
function offenceCounts(pattern: RegExp): Record<string, number> {
  return Object.fromEntries(
    resultsSources
      .map(({ path, text }) => [path, (stripComments(text).match(pattern) ?? []).length] as const)
      .filter(([, count]) => count > 0),
  );
}

/** `//` lines and block comments. The source-level guards below scan for token
 *  spellings that also appear in deliberate "not this token" notes in prose --
 *  RadarChart.tsx:141 and ArchetypeCard.tsx:98 both carry such notes today --
 *  so a guard reading raw text reds on a comment documenting the very rule it
 *  enforces.
 *
 *  The line arm is anchored to `^\s*` on purpose. An unanchored `\/\/.*$`
 *  also eats the tail of any line containing a URL, which was verified to hide
 *  a real `#abcdef` sitting after one. For a drift guard, under-detection is
 *  the dangerous direction: a false green ships the defect, a false red merely
 *  annoys. Known remaining gap, left because no realistic source triggers it:
 *  the block arm still spans from a `"/*"` string literal to a `"*\/"` one. */
function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

// Hook convention for this file, which gets appended to across eight more
// tasks: a `data-*` attribute exists only to give an element identity
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
  // `as const`: Task 10 narrowed the prop from `string` to the scoring
  // engine's four-member union, so a widened `string` no longer compiles.
  confidence: "high" as const,
  // `level`, `direction` and `narrative` left the prop at Task 10 — the row
  // only ever showed that a tension exists. The tension panels above it,
  // which ResultsView draws, are where the grade and direction are spelled.
  tension: { detected: false },
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
        tension: { detected: true },
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

  it("names the disclosure with its visible label rather than instead of it", () => {
    // WCAG 2.5.3, Label in Name. The retired aria-label read "Show scoring
    // breakdown for {name}" against a visible "See how this was scored" —
    // sharing no words, so it replaced the accessible name and the control
    // stopped matching by voice. A visually-hidden suffix extends the name
    // instead. State is not in the name: aria-expanded already carries it.
    const container = render(createElement(AxisBreakdownCard, { ...AXIS, showScoring: true }));
    const button = container.querySelector("button")!;

    expect(button.getAttribute("aria-label")).toBeNull();
    expect(button.textContent).toContain("See how this was scored");
    // The twelve rows all label this control identically otherwise, which
    // makes them indistinguishable in an AT control list.
    expect(button.textContent).toContain("Governance Structure");
    // Scoped to the button, not the container: RadarChart.tsx already renders
    // an .sr-only table and Task 8 rewrites it, so a container-wide lookup
    // would start passing on the wrong node without ever reddening.
    expect(button.querySelector(".sr-only")).not.toBeNull();

    // The caret is decoration inside that same accessible name, and the space
    // after it has to survive JSX whitespace collapsing.
    const caret = button.querySelector("[aria-hidden='true']")!;
    expect(caret.textContent).toBe("▸");
    expect(button.textContent).toContain("▸ See how this was scored");
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
    const card = resultsSources.find(
      (f) => f.path === "src/components/results/AxisBreakdownCard.tsx",
    );
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

    // And again on a WIDE pair. The close fixture alone cannot see a dropped
    // Math.abs: (-0.5, -0.3) signed is -0.2, which buckets as "close
    // agreement" exactly like +0.2, so badge and clause still agree. On PAIR
    // the same mutation prints "close agreement" beside an aria-label saying
    // "far apart" — the precise divergence this test exists to forbid.
    const wide = render(createElement(ComparisonScoreBar, PAIR));
    const wideLabel = wide.querySelector("[role='img']")!.getAttribute("aria-label")!;
    const wideClause = wideLabel.slice(wideLabel.lastIndexOf("; ") + 2);

    expect(wide.querySelector("[data-gap]")!.textContent).toBe(wideClause);
    expect(wideClause).toBe("far apart");
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

/** One `RadarAxisScore` for the mini radar. The chart reads `axisId` and
 *  `finalScore`; the rest is the shape, not the subject. */
const MINI_AXES = Array.from({ length: 12 }, (_, i) => i + 1);
function miniAxis(axisId: number, finalScore: number) {
  return {
    axisId,
    name: `Axis ${axisId}`,
    poleALabel: `Pole A ${axisId}`,
    poleBLabel: `Pole B ${axisId}`,
    finalScore,
    confidence: "high" as const,
  };
}

describe("ArchetypeCard", () => {
  const ARCHETYPE = {
    primary: {
      id: "social-democrat",
      name: "The Social Democrat",
      matchPercentage: 74,
      summary: "Collective provision through democratic institutions.",
      description: "A longer description.",
      tension: "A characteristic tension.",
      prototype: Array.from({ length: 12 }, () => 0.2),
    },
    secondary: { name: "The Communitarian Steward", matchPercentage: 61, summary: "" },
    isBlended: false,
    isDistinctive: false,
    // Carries `axisId`, not bare scores: `MiniRadar` normalises by id, the
    // same way `RadarChart` does, so the user polygon and the fixed
    // axis-1-through-12 prototype cannot drift against each other.
    userScores: MINI_AXES.map((axisId) => miniAxis(axisId, -0.1)),
  };

  it("lays the panel out as text beside a 220px radar column", () => {
    const container = render(createElement(ArchetypeCard, ARCHETYPE));
    const grid = container.querySelector("[data-archetype-grid]")!;

    expect(classes(grid)).toContain("min-[560px]:grid-cols-[minmax(0,1fr)_220px]");
  });

  it("puts the section label over a hard ink rule", () => {
    const container = render(createElement(ArchetypeCard, ARCHETYPE));
    const label = container.querySelector("[data-archetype-label]")!;

    expect(label.textContent).toBe("Primary archetype");
    // border-rule-strong, NOT border-stone-900: the Stone ramp is fixed across
    // modes, so the literal would vanish into a dark ground. This exact
    // mistake has shipped twice in this migration.
    expect(classes(label)).toContain("border-rule-strong");
    expect(classes(label)).not.toContain("border-stone-900");
  });

  it("anchors on the match percentage at display-l, with the name below it", () => {
    const container = render(createElement(ArchetypeCard, ARCHETYPE));
    const match = container.querySelector("[data-archetype-match]")!;

    expect(match.textContent).toBe("74%");
    // Was a bare text-[36px]. display-l is 34px and carries the serif family,
    // weight and tracking with it.
    expect(classes(match)).toContain("display-l");
    expect(classes(container.querySelector("h2")!)).toContain("display-s");
  });

  it("renders the caller's actions inside the panel", () => {
    const container = render(
      createElement(ArchetypeCard, {
        ...ARCHETYPE,
        actions: createElement("button", { type: "button" }, "Copy link"),
      }),
    );
    const grid = container.querySelector("[data-archetype-grid]")!;

    // Inside the grid, not appended after the card: mock 7a draws the action
    // row in the left column, under the summary.
    expect(grid.textContent).toContain("Copy link");
  });

  it("offers Learn more as a tertiary control and keeps the disclosure working", () => {
    const container = render(createElement(ArchetypeCard, ARCHETYPE));
    const learnMore = container.querySelector("[data-archetype-expand]") as HTMLButtonElement;

    expect(classes(learnMore)).toContain("label-nav");
    // WCAG 2.5.3: the accessible name EXTENDS the visible label rather than
    // replacing it, so "Learn more" still matches by voice.
    expect(learnMore.textContent).toContain("about The Social Democrat");
    expect(learnMore.getAttribute("aria-expanded")).toBe("false");
    expect(container.textContent).not.toContain("A longer description.");

    click(learnMore);

    expect(learnMore.getAttribute("aria-expanded")).toBe("true");
    expect(container.textContent).toContain("A longer description.");
    // The reference link moves into the expanded block, beside the full
    // description it continues.
    expect(container.querySelector("a[href='/archetypes#social-democrat']")).not.toBeNull();
  });

  it("closes the panel with the adjacent line over a hairline rule", () => {
    const container = render(createElement(ArchetypeCard, ARCHETYPE));
    const adjacent = container.querySelector("[data-archetype-adjacent]")!;

    expect(adjacent.textContent).toBe("Adjacent · The Communitarian Steward — 61% match");
    expect(classes(adjacent)).toContain("border-rule-hairline");
  });

  it("draws the mini radar off the stepping mark, not a fixed Stone", () => {
    const container = render(createElement(ArchetypeCard, ARCHETYPE));
    const user = container.querySelector("[data-mini-user]") as SVGPolygonElement;

    // Mock 7b paints this shape Stone 400 on dark. A var(--stone-600) literal
    // would stay muddy there, and in LIGHT mode the two are pixel-identical —
    // which is why this asserts the declaration.
    expect(user.style.fill).toBe("var(--mark-primary)");
    expect(user.getAttribute("fill-opacity")).toBe("0.12");
    // The stroke, not the fill, is what the eye reads here: the fill sits at
    // 12% while the stroke has no opacity at all. Guarding only `fill` leaves
    // the load-bearing half of the declaration free to revert to Stone 600.
    expect(user.style.stroke).toBe("var(--mark-primary)");

    // Same token, same component, same inversion requirement.
    const swatch = container.querySelector("[data-mini-legend-you]") as HTMLElement;
    expect(swatch.style.backgroundColor).toBe("var(--mark-primary)");

    // The <svg> is aria-hidden, so an exposed legend describes a chart AT
    // cannot perceive — a bare "You Prototype" with no referent.
    const legend = container.querySelector("[data-mini-legend]")!;
    expect(legend.getAttribute("aria-hidden")).toBe("true");
  });

  it("places the radar's vertices where the score and the radius put them", () => {
    // The geometry is otherwise unpinned: miniRadarPoints can be rescaled, have
    // its sign mapping inverted, or lose its -90 degree offset, and ringPoints
    // can ignore its radius argument, all without reddening a single class or
    // token assertion. Hand-computed from the fixture: every userScore is -0.1,
    // so r = ((-0.1 + 1) / 2) * 80 = 36 for all twelve vertices, about the
    // (100, 100) centre. Vertex 0 sits at -90 degrees, i.e. straight up.
    const container = render(createElement(ArchetypeCard, ARCHETYPE));
    const parse = (el: Element) =>
      el.getAttribute("points")!.split(" ").map((pair) => pair.split(",").map(Number));

    const user = parse(container.querySelector("[data-mini-user]")!);
    expect(user).toHaveLength(12);
    for (const [x, y] of user) {
      expect(Math.hypot(x - 100, y - 100)).toBeCloseTo(36, 6);
    }
    expect(user[0][0]).toBeCloseTo(100, 6);
    expect(user[0][1]).toBeCloseTo(64, 6);
    // A second, non-zero vertex: the radius assertions above are blind to
    // angular error (radius is a function of score alone, and every fixture
    // score is equal), and at vertex 0 the `/ MINI_AXES` divisor cancels. At
    // i = 3 the angle is exactly 0, so an off-by-one divisor moves this point
    // to [135.63, 105.12].
    expect(user[3][0]).toBeCloseTo(136, 6);
    expect(user[3][1]).toBeCloseTo(100, 6);

    // ringPoints must honour the radius it is handed, not close over MINI_R:
    // the two rings differ only by that argument.
    expect(parse(container.querySelector("[data-mini-ring='outer']")!)[0]).toEqual([100, 20]);
    expect(parse(container.querySelector("[data-mini-ring='mid']")!)[0]).toEqual([100, 60]);
  });

  it("puts each axis on its own spoke, whatever order the caller built", () => {
    // The half of Task 7's addendum D that Task 8 could not finish: the prop
    // used to be a bare `number[]`, so vertex `i` was whatever the caller
    // happened to put at index `i`. The two routes into ResultsView build
    // their lists differently — scoring-pipeline order on /results, `axis.order`
    // on /results/[profileId] — and agree only while `order === id` holds for
    // every row of src/data/axes.ts. Reversed here, so a positional map lands
    // axis 1 on vertex 11 and draws a plausible wrong polygon against the
    // prototype this chart exists to compare it with.
    const reversed = [...MINI_AXES].reverse().map((axisId) => miniAxis(axisId, axisId === 1 ? 1 : -1));
    const container = render(
      createElement(ArchetypeCard, { ...ARCHETYPE, userScores: reversed }),
    );
    const points = container
      .querySelector("[data-mini-user]")!
      .getAttribute("points")!
      .split(" ")
      .map((pair) => pair.split(",").map(Number));

    // Axis 1 scores +1, so r = 80 — vertex 0, straight up from (100, 100).
    expect(points[0][0]).toBeCloseTo(100, 6);
    expect(points[0][1]).toBeCloseTo(20, 6);
    // Every other axis scores -1, so r = 0: they all collapse on the centre.
    for (const [x, y] of points.slice(1)) {
      expect(Math.hypot(x - 100, y - 100)).toBeCloseTo(0, 6);
    }
  });

  it("still describes a distinctive profile without an archetype", () => {
    const container = render(
      createElement(ArchetypeCard, { ...ARCHETYPE, isDistinctive: true }),
    );

    expect(container.textContent).toContain("Distinctive profile");
    expect(container.textContent).toContain("The Social Democrat — 74% match");
  });

  it("declines to draw a radar from an axis list that is not twelve long", () => {
    // `userScores` is `axisData.map((a) => a.finalScore)` at the call site, so
    // its length tracks the caller's axis list; `primary.prototype` is a
    // 12-element literal for all twelve archetypes and cannot vary. Guarding
    // the prototype alone is a tautology, and a short userScores reaches
    // miniRadarPoints unchecked and draws a plausible wrong polygon.
    const container = render(
      createElement(ArchetypeCard, {
        ...ARCHETYPE,
        userScores: [miniAxis(1, 0.1), miniAxis(2, -0.2), miniAxis(3, 0.3)],
      }),
    );

    expect(container.querySelector("[data-mini-user]")).toBeNull();
  });

  it("offers the same actions slot on the distinctive branch", () => {
    // One contract for the slot, not two: Task 10 passes the same node
    // whichever branch renders, so the branch that skips the archetype must
    // still place it.
    const container = render(
      createElement(ArchetypeCard, {
        ...ARCHETYPE,
        isDistinctive: true,
        actions: createElement("button", { type: "button" }, "Copy link"),
      }),
    );

    expect(container.textContent).toContain("Copy link");
  });
});

describe("RadarChart", () => {
  const SCORES = Array.from({ length: 12 }, (_, i) => ({
    axisId: i + 1,
    name: `Axis ${i + 1}`,
    poleALabel: `Pole A ${i + 1}`,
    poleBLabel: `Pole B ${i + 1}`,
    domain: "Economic Organization",
    finalScore: 0.2,
    confidence: "high" as const,
  }));

  it("draws exactly one user polygon, off the stepping mark", () => {
    const container = render(createElement(RadarChart, { axisScores: SCORES }));
    const user = container.querySelector("[data-radar-user]") as SVGPolygonElement;

    // Was four domain-coloured stroke SEGMENTS over twelve domain-tinted
    // triangle fills — a second colour system layered on the first. Mock 7a
    // draws one shape and lets the dots carry domain.
    expect(container.querySelectorAll("[data-radar-user]")).toHaveLength(1);
    expect(container.querySelectorAll("path")).toHaveLength(0);
    // NOT --domain-economic, which holds the identical value in both modes.
    expect(user.style.fill).toBe("var(--mark-primary)");
    expect(user.getAttribute("fill-opacity")).toBe("0.1");
    // The stroke, not the fill, is what the eye reads: the fill sits at 10%
    // while the 1.6px stroke has no opacity at all. Guarding only `fill`
    // leaves the load-bearing half free to revert to a fixed Stone 600, which
    // in light mode is pixel-identical and only shows up on a dark ground.
    expect(user.style.stroke).toBe("var(--mark-primary)");
  });

  it("marks each axis with a domain dot", () => {
    const container = render(createElement(RadarChart, { axisScores: SCORES }));
    const dots = [...container.querySelectorAll("[data-radar-dot]")] as SVGCircleElement[];

    expect(dots).toHaveLength(12);
    expect(dots[0].getAttribute("r")).toBe("4");
    // Axis 1 is Economic, axis 3 is Power, axis 7 Society, axis 10 World.
    expect(dots[0].getAttribute("fill")).toBe("var(--domain-economic)");
    expect(dots[2].getAttribute("fill")).toBe("var(--domain-power)");
    expect(dots[6].getAttribute("fill")).toBe("var(--domain-society)");
    expect(dots[9].getAttribute("fill")).toBe("var(--domain-world)");
  });

  it("reduces to two rings and twelve spokes", () => {
    const container = render(createElement(RadarChart, { axisScores: SCORES }));

    // Four concentric rings became an outer ring plus a dashed mid-ring.
    expect(container.querySelectorAll("[data-radar-ring]")).toHaveLength(2);
    // Six full-diameter lines became twelve spokes from the centre, so a
    // spoke is present even where the mapping puts a vertex at the origin.
    const spokes = [...container.querySelectorAll("[data-radar-spoke]")];
    expect(spokes).toHaveLength(12);
    // Counting alone cannot tell twelve spokes from twelve diameters. Each
    // one starts AT the centre, which is the whole point of the change: a
    // diameter through the middle draws no spoke for an axis whose vertex
    // lands on the origin.
    expect(spokes[0].getAttribute("x1")).toBe("290");
    expect(spokes[0].getAttribute("y1")).toBe("290");
  });

  it("draws the rings and labels at absolute radii, not fractions of one", () => {
    // The ring helper is shared with MiniRadar and takes an ABSOLUTE radius,
    // where this chart's old local helper took a fraction of MAX_RADIUS.
    // Passing the old 1 / 0.5 through collapses both rings onto the centre,
    // and counting rings — which is all the test above does — still sees two.
    // Vertex 0 of each ring is straight up from the (290, 290) centre.
    const container = render(createElement(RadarChart, { axisScores: SCORES }));
    const vertex0 = (el: Element) =>
      el.getAttribute("points")!.split(" ")[0].split(",").map(Number);
    const [outer, mid] = [...container.querySelectorAll("[data-radar-ring]")];

    expect(vertex0(outer)).toEqual([290, 290 - 170]);
    expect(vertex0(mid)).toEqual([290, 290 - 85]);

    // And the labels sit at r+22, the tightened radius the test below names
    // but does not otherwise measure. At r+38 this would read 62.
    const label = container.querySelector("[data-radar-label]")!;
    expect(Number(label.getAttribute("y"))).toBeCloseTo(290 - (170 + 22), 6);
  });

  it("keeps the score-to-radius mapping the chart has always used", () => {
    // ((score + 1) / 2) * MAX_RADIUS, with the first spoke pointing straight
    // up. A score of 0.2 puts vertex 0 at 60% of the radius above centre.
    const container = render(createElement(RadarChart, { axisScores: SCORES }));
    const first = container.querySelector("[data-radar-dot]") as SVGCircleElement;

    expect(Number(first.getAttribute("cx"))).toBeCloseTo(290, 4);
    expect(Number(first.getAttribute("cy"))).toBeCloseTo(290 - 0.6 * 170, 4);
  });

  it("labels each spoke in mono, numbered, at the tightened radius", () => {
    const container = render(createElement(RadarChart, { axisScores: SCORES }));
    const labels = [...container.querySelectorAll("[data-radar-label]")];

    expect(labels).toHaveLength(12);
    expect(labels[0].textContent).toContain("01");
    expect(labels[0].textContent).toContain("Pole B 1");
    // Was domain-coloured at r+38. The mono label layer is monochrome, and
    // --text-label is the one token that steps for AA in both modes.
    expect((labels[0] as SVGTextElement).style.fill).toBe("var(--text-label)");
  });

  it("keeps the visually hidden score table", () => {
    const container = render(createElement(RadarChart, { axisScores: SCORES }));
    const table = container.querySelector("table")!;

    // The SVG is aria-hidden, so this table is the entire accessible chart.
    expect(classes(table)).toContain("sr-only");
    expect(table.querySelectorAll("tbody tr")).toHaveLength(12);
    // That premise is stated in three comments and was asserted nowhere.
    // Drop the attribute and twelve SVG labels plus the tooltip become a
    // second, duplicate reading of the same twelve axes.
    expect(container.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
    // Column headers, so a row cell is announced with the column it sits in.
    // `toEqual` against a literal rather than `.every(...)`: every() is TRUE on
    // an empty array, so a <th> -> <td> change emptied the selector and the
    // assertion passed on nothing. This form also pins the column count.
    const headers = [...table.querySelectorAll("thead th")];
    expect(headers.map((th) => th.getAttribute("scope"))).toEqual(["col", "col", "col", "col"]);
  });

  it("names each axis's domain in the table and hides the legend that repeats it", () => {
    // This task made domain the job of the twelve dots. A screen reader sees
    // no dots, so without a column here the one variable the chart gained is
    // the one assistive tech loses.
    const container = render(createElement(RadarChart, { axisScores: SCORES }));
    const table = container.querySelector("table")!;
    const domainCell = (row: number) =>
      [...table.querySelectorAll("tbody tr")][row].querySelectorAll("td")[1].textContent;

    expect([...table.querySelectorAll("thead th")].map((th) => th.textContent)).toEqual([
      "Axis",
      "Domain",
      "Score",
      "Confidence",
    ]);
    // Derived from the axis id, exactly as the dot beside it is. The fixture
    // sets `domain: "Economic Organization"` on all twelve, so reading the
    // field instead would label axis 3 Economic while its dot renders
    // --domain-power — the table and the chart disagreeing about the same axis.
    expect(domainCell(0)).toBe("Economic Organization");
    expect(domainCell(2)).toBe("Power and Authority");
    expect(domainCell(6)).toBe("Society and Identity");
    expect(domainCell(9)).toBe("The State in the World");

    // The legend annotates an aria-hidden <svg>. Exposed, it reads as four
    // loose domain names with no referent — the defect Task 7 fixed on the
    // mini radar's twin legend one task ago.
    const legend = container.querySelector("[data-radar-legend]")!;
    expect(legend.getAttribute("aria-hidden")).toBe("true");

    // The swatches are data marks: a fixed hex cannot step to the 400 tone on
    // a dark ground, and reverting them was previously undetectable.
    const swatches = [...container.querySelectorAll("[data-radar-legend-swatch]")] as HTMLElement[];
    expect(swatches).toHaveLength(4);
    expect(swatches.map((s) => s.style.backgroundColor)).toEqual([
      "var(--domain-economic)",
      "var(--domain-power)",
      "var(--domain-society)",
      "var(--domain-world)",
    ]);
  });

  it("reads the score table through the shared formatter", () => {
    // The table used to inline `>= 0 ? "+" : ""`, a fourth copy of the pattern
    // Task 6 consolidated into format-score.ts. That copy signed an exact
    // zero. A padded axis scores exactly 0, so this is reachable: the sole
    // consumer is a screen reader, which would say "plus zero point zero zero"
    // for an axis carrying no signal at all.
    const container = render(
      createElement(RadarChart, { axisScores: [SCORES[0], { ...SCORES[1], finalScore: -0.4 }] }),
    );
    const cells = [...container.querySelectorAll("tbody tr")].map(
      (row) => row.querySelectorAll("td")[2].textContent,
    );

    expect(cells[0]).toBe("+0.20");
    expect(cells[1]).toBe("-0.40");
    // Axes 3-12 are absent from the input and pad to a neutral, unsigned zero.
    expect(cells[2]).toBe("0.00");
    expect(cells).toHaveLength(12);
  });
});

describe("CompassPlot", () => {
  const PLOT = { economic: -0.4, cultural: 0.3, primaryArchetypeId: "social-democrat" };
  // toX/toY map [-1,+1] across PADDING..SIZE-PADDING, so the origin of both
  // axes is the centre of the 400-unit viewBox.
  const CENTRE = 200;

  it("draws a 300px plot square with a 50px grid", () => {
    const container = render(createElement(CompassPlot, PLOT));
    const frame = container.querySelector("[data-compass-frame]") as SVGRectElement;

    expect(frame.getAttribute("width")).toBe("300");
    expect(frame.getAttribute("height")).toBe("300");
    // Squared off with the rest of the system: this rect carried rx={6}.
    expect(frame.getAttribute("rx")).toBeNull();
    // The frame's own origin, so the grid below is pinned to the square and not
    // merely to the viewBox. Offset the frame by 10 and the lines stop dividing
    // it, with a size-and-count assertion none the wiser.
    expect(frame.getAttribute("x")).toBe("50");
    expect(frame.getAttribute("y")).toBe("50");

    // Five interior lines each way -- and WHERE they fall, not just how many.
    // A step of 40 leaves exactly ten lines that no longer divide a 300px
    // square into six columns.
    const grid = [...container.querySelectorAll("[data-compass-grid]")];
    expect(grid).toHaveLength(10);
    const verticals = grid.filter((l) => l.getAttribute("x1") === l.getAttribute("x2"));
    const horizontals = grid.filter((l) => l.getAttribute("y1") === l.getAttribute("y2"));
    expect(verticals.map((l) => l.getAttribute("x1"))).toEqual(["100", "150", "200", "250", "300"]);
    expect(horizontals.map((l) => l.getAttribute("y1"))).toEqual(["100", "150", "200", "250", "300"]);

    // Those are viewBox units, which are only 300 *px* if the 400-unit viewBox
    // renders 400px wide. max-w-sm is 384px, which would draw the square at
    // 288px and the grid at 48px with every assertion above green.
    //
    // The cap has to sit on the WRAPPER. Task 9 put `w-full max-w-[400px]` on
    // the svg alone and this assertion read green, but the wrapper is a flex
    // item of a `flex justify-center` panel, so it shrink-wrapped its child and
    // the svg's percentage width resolved against a shrink-to-fit box — the
    // square rendered at 225 CSS px, which Task 12 measured in Chromium. jsdom
    // lays nothing out, so the size itself is not assertable here; what is
    // assertable is that the cap and the width are on the same element, which
    // is the part that was wrong.
    const svg = container.querySelector("svg")!;
    expect(classes(svg)).toContain("w-full");
    expect(classes(svg)).not.toContain("max-w-[400px]");
    expect(classes(svg.parentElement!)).toEqual(
      expect.arrayContaining(["w-full", "max-w-[400px]"]),
    );
  });

  it("plots the respondent as a 12px ink dot the engine positions", () => {
    const container = render(createElement(CompassPlot, PLOT));
    const dot = container.querySelector("[data-compass-dot]") as SVGCircleElement;

    expect(dot.getAttribute("r")).toBe("6");
    // var(--text-primary), not var(--stone-900): Stone 900 ink on a Stone 900
    // ground is invisible, and --text-primary is already the ink pair that
    // inverts (#3d2e1f / #efe9e3).
    expect(dot.style.fill).toBe("var(--text-primary)");

    // Nothing else in this file reads cx/cy against the inputs, so without
    // these an inverted toY -- cultural +1 rendering at the BOTTOM, every point
    // and all twelve archetype markers mirrored -- is entirely invisible.
    // PLOT is economic -0.4 (left of centre) and cultural +0.3 (above it).
    expect(Number(dot.getAttribute("cx"))).toBeLessThan(CENTRE);
    expect(Number(dot.getAttribute("cy"))).toBeLessThan(CENTRE);
    // Exact, so no sign error can hide inside a "less than".
    expect(dot.getAttribute("cx")).toBe("140");
    expect(dot.getAttribute("cy")).toBe("155");
  });

  it("keeps the compass pointing the way the scoring engine does", () => {
    const container = render(createElement(CompassPlot, PLOT));
    const poleEls = [...container.querySelectorAll("[data-compass-pole]")];
    const poles = poleEls.map((p) => p.textContent);
    const poleY = (t: string) => Number(poleEls.find((p) => p.textContent === t)!.getAttribute("y"));
    const poleX = (t: string) => Number(poleEls.find((p) => p.textContent === t)!.getAttribute("x"));

    // Mock 7a labels the vertical axis Open / Traditional, which would invert
    // the meaning of every plotted point. SD_CULTURAL_WEIGHTS maps +1 to the
    // top and the shipped labels say Traditional there. The mock is a static
    // prototype with fabricated coordinates; it does not outrank the engine.
    expect(poles).toEqual(["Collective", "Market", "Traditional", "Progressive"]);
    expect(poles).not.toContain("Open");
    // The four 10px letterSpaced cardinal labels that used to sit OUTSIDE the
    // square are replaced, not supplemented. They carry no [data-compass-pole]
    // hook, so leaving them behind would sail past the assertions above while
    // rendering each pole twice.
    expect(container.textContent).not.toContain("COLLECTIVE");
    expect(container.textContent).not.toContain("PROGRESSIVE");

    // WHERE each label sits, not merely that it exists. Reading textContent in
    // DOM order cannot tell Traditional-on-top from Traditional-on-the-bottom,
    // so the array above leaves D12 -- the decision this plan spent a paragraph
    // defending -- unguarded on its own.
    expect(poleY("Traditional")).toBeLessThan(poleY("Progressive"));
    expect(poleX("Collective")).toBeLessThan(poleX("Market"));
    // And each straddles the axis it names rather than merely out-ordering its
    // opposite somewhere off in a corner.
    expect(poleY("Traditional")).toBeLessThan(CENTRE);
    expect(poleY("Progressive")).toBeGreaterThan(CENTRE);

    // INSIDE the square, which is the whole point of moving them off the
    // outside. Every assertion above is relational -- Traditional above
    // Progressive, Collective left of Market -- and a relational assertion is
    // blind to a uniform outward shift: negating POLE_INSET puts all four
    // labels outside the frame with their ordering, and the suite, intact.
    // Bounds read off the frame rather than recomputed, as the dot test does.
    const frameEl = container.querySelector("[data-compass-frame]")!;
    const fx = Number(frameEl.getAttribute("x"));
    const fy = Number(frameEl.getAttribute("y"));
    const fr = fx + Number(frameEl.getAttribute("width"));
    const fb = fy + Number(frameEl.getAttribute("height"));
    for (const p of poleEls) {
      expect(Number(p.getAttribute("x"))).toBeGreaterThanOrEqual(fx);
      expect(Number(p.getAttribute("x"))).toBeLessThanOrEqual(fr);
      expect(Number(p.getAttribute("y"))).toBeGreaterThanOrEqual(fy);
      expect(Number(p.getAttribute("y"))).toBeLessThanOrEqual(fb);
    }

    // The mono face is a named deliverable of this task; flipping all six
    // labels to `inherit` otherwise passes.
    expect((poleEls[0] as SVGTextElement).style.fontFamily).toBe("var(--font-mono)");
  });

  it("keeps the contour lines and the archetype markers", () => {
    const container = render(createElement(CompassPlot, PLOT));

    // CLAUDE.md names the contour lines as the design system's one protected
    // decorative exception. The markers are the only thing that says where a
    // respondent sits RELATIVE to the twelve archetypes.
    expect(container.querySelectorAll("[data-compass-contour]")).toHaveLength(4);
    expect(container.querySelectorAll("[data-compass-archetype]")).toHaveLength(12);

    // All twelve are LABELLED. The MIN_DIST = 18 collision suppression has
    // never fired against the shipped archetype data -- the closest label pair
    // is 23.0068 units apart at PADDING = 50, and was 19.0189 at the old 76,
    // so this task moved the margin away from the threshold rather than toward
    // it. Worst case across all thirteen primaryArchetypeId selections (the
    // primary's label sits one unit higher than the rest) those become 22.70
    // and 18.72 -- still clear of 18, so every conclusion here holds.
    // Pinning the observable outcome beats contriving a fixture to force a
    // branch real data does not reach, and this reds if a future prototype
    // edit, or a smaller INNER, starts swallowing labels.
    expect(container.querySelectorAll("[data-compass-archetype] text")).toHaveLength(12);
  });

  it("drops the decoration the mock is right to cut", () => {
    const container = render(createElement(CompassPlot, PLOT));
    const svg = container.querySelector("svg")!;

    expect(container.textContent).not.toContain("Libertarian left");

    // The obvious spelling of the rest of this -- querying
    // [data-compass-moderate] and [data-compass-pulse] and expecting null -- is
    // an absence assertion on a hook that never existed. It passes against the
    // pre-task file, so it cannot tell "removed" from "never present", and it
    // coins hooks that name nothing, against the hook convention at the top of
    // this file. (No line number: the citation has gone stale twice already —
    // Task 9 wrote it as :56-61, Task 11 re-derived it to :103-108 and the same
    // commit's own docstrings displaced it again. The prose anchor survives any
    // shift; the number is the only part that keeps rotting.) These are
    // positive and hold only after the removal.
    //
    // One rect: the frame. Before this task there were six -- the frame, the
    // four quadrant tints and the dashed moderate-zone rect.
    expect(svg.querySelectorAll("rect")).toHaveLength(1);
    // One circle at the dot's own coordinates: the two pulse rings sat there
    // too. Read off the dot rather than recomputing toX/toY in the test.
    const dot = container.querySelector("[data-compass-dot]")!;
    const atDot = [...svg.querySelectorAll("circle")].filter(
      (c) =>
        c.getAttribute("cx") === dot.getAttribute("cx") &&
        c.getAttribute("cy") === dot.getAttribute("cy"),
    );
    expect(atDot).toHaveLength(1);
  });

  it("still reports the coordinates in words and in numbers", () => {
    const container = render(createElement(CompassPlot, PLOT));
    const svg = container.querySelector("svg")!;
    const readout = container.querySelector("[data-compass-readout]") as SVGTextElement;

    // role="img" is what promotes the label to the accessible name of the whole
    // plot; drop it and the label goes unannounced.
    expect(svg.getAttribute("role")).toBe("img");
    // Two bare numbers tell a screen-reader user nothing about which way either
    // axis runs, so each carries the pole it leans toward.
    expect(svg.getAttribute("aria-label")).toBe(
      "Political compass plot. Economic: -0.40 (Collective), Cultural: +0.30 (Traditional)",
    );
    expect(readout.textContent).toBe("-0.40, +0.30");
    expect(readout.style.fontFamily).toBe("var(--font-mono)");
    // The leader starts clear of the dot it points away from -- LEADER_START
    // must exceed DOT_R or the line is drawn through the ink it is labelling.
    const leader = container.querySelector("[data-compass-leader]")!;
    const dotEl = container.querySelector("[data-compass-dot]")!;
    expect(
      Math.abs(Number(leader.getAttribute("x1")) - Number(dotEl.getAttribute("cx"))),
    ).toBeGreaterThan(Number(dotEl.getAttribute("r")));

    // That bound is one-sided: it pins LEADER_START from below and says
    // nothing at all about the far end or the label. Stretching LEADER_END to
    // 160, flipping its sign so the leader runs backwards through the dot, or
    // widening READOUT_GAP to 60 all drag the readout off the plot square with
    // the assertion above still green. dotX is 140, so from the dot: start
    // +16, end +28, readout +32.
    expect(leader.getAttribute("x1")).toBe("156");
    expect(leader.getAttribute("x2")).toBe("168");
    expect(readout.getAttribute("x")).toBe("172");
    // Sits on the dot's own baseline: this one is 45 units clear of the
    // horizontal axis, so the collision nudge below must not fire.
    expect(readout.getAttribute("y")).toBe(dotEl.getAttribute("cy"));
  });

  it("signs the readout through the shared formatter", () => {
    // Fifth inlined copy of the always-signed formatter, folded onto
    // src/lib/format-score.ts (Task 6 consolidated three, Task 8 a fourth).
    // formatScore signs on `> 0`, so an exact zero loses its `+` -- which is
    // what the axis table beside this plot already renders, and what a screen
    // reader should hear. computeSuperDimensions bounds both outputs to
    // [-1, +1], so formatScore's clamp is a no-op here.
    const container = render(
      createElement(CompassPlot, { economic: 0, cultural: -0.25 }),
    );

    expect(container.querySelector("[data-compass-readout]")!.textContent).toBe("0.00, -0.25");
    // "(centre)", not "(Collective)": an exact zero leans to neither pole, and
    // a fully-skipped assessment scores exactly 0 on both axes.
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Political compass plot. Economic: 0.00 (centre), Cultural: -0.25 (Progressive)",
    );
  });

  it("keeps the readout clear of the pole labels when the dot sits on the axis", () => {
    // Moving the pole labels inside the square opened a collision the
    // outside-the-square labels could not have. The readout renders at
    // dotX + 32 on the dot's own baseline and "Collective" begins at x=58 on
    // the centre line, so an economic score below about -0.72 with a near-zero
    // cultural score printed one straight through the other. Reachable by a
    // consistent respondent, and trivially via a crafted ?r= URL.
    const left = render(createElement(CompassPlot, { economic: -0.9, cultural: 0 }));
    const collective = [...left.querySelectorAll("[data-compass-pole]")].find(
      (p) => p.textContent === "Collective",
    )!;
    expect(Number(collective.getAttribute("y"))).toBe(CENTRE);
    expect(
      Math.abs(Number(left.querySelector("[data-compass-readout]")!.getAttribute("y")) - CENTRE),
    ).toBeGreaterThanOrEqual(12);

    // Symmetrically past +0.89 on "Market" -- and this dot sits just BELOW the
    // axis, so the nudge has to carry it further down. A nudge that always went
    // up would push the readout back across the centre line onto the very label
    // it is avoiding.
    const right = render(createElement(CompassPlot, { economic: 0.95, cultural: -0.05 }));
    expect(
      Number(right.querySelector("[data-compass-readout]")!.getAttribute("y")),
    ).toBeGreaterThan(CENTRE + 11);
  });
});

describe("ResultsView", () => {
  const TENSION_BY_INDEX: Record<number, {
    detected: true;
    level: "moderate" | "strong";
    direction: "principles_A_but_budget_B" | "principles_B_but_budget_A";
  }> = {
    4: { detected: true, level: "moderate", direction: "principles_A_but_budget_B" },
    7: { detected: true, level: "strong", direction: "principles_B_but_budget_A" },
  };

  const AXES = Array.from({ length: 12 }, (_, i) => ({
    axisId: i + 1,
    name: `Axis ${i + 1}`,
    poleALabel: `Pole A ${i + 1}`,
    poleBLabel: `Pole B ${i + 1}`,
    tagline: `Tagline ${i + 1}`,
    domain: [
      "Economic Organization", "Economic Organization",
      "Power and Authority", "Power and Authority", "Power and Authority", "Power and Authority",
      "Society and Identity", "Society and Identity", "Society and Identity",
      "The State in the World", "The State in the World", "The State in the World",
    ][i],
    finalScore: 0.2,
    // `as const` throughout, which the plan's fixture omitted: `confidence`,
    // `tension.level` and `tension.direction` are all narrowed to the scoring
    // engine's unions, and a widened `string` here would fail to compile.
    confidence: "high" as const,
    // TWO tension axes, with OPPOSITE directions. One is not enough: the two
    // narrative arms are mirror images, so swapping their bodies leaves a
    // single-direction fixture green while every panel on the page then tells
    // the respondent the exact opposite of what they answered. Axis 5 is in
    // the Power domain and axis 8 in Society, so the domain counts below are
    // untouched by this.
    tension: TENSION_BY_INDEX[i] ?? { detected: false as const, level: "none" as const, direction: null },
    components: { fc: 0.2, sc: 0.2, bg: 0.2 },
  }));

  const PROPS = {
    axisData: AXES,
    compass: { economic: -0.4, cultural: 0.3 },
    archetype: {
      primary: {
        id: "social-democrat",
        name: "The Social Democrat",
        matchPercentage: 74,
        summary: "A summary.",
        description: "A description.",
        tension: "A tension.",
        prototype: Array.from({ length: 12 }, () => 0.2),
      },
      // No `summary`: `ArchetypeCard` never read it and the prop is gone from
      // both interfaces, so supplying one would be inventing a consumer.
      secondary: { name: "The Communitarian Steward", matchPercentage: 61 },
      isBlended: false,
      isDistinctive: false,
    },
    encoded: "abc123",
  };

  /** The same respondent with every tension cleared. The interesting fixture:
   *  it is the one under which the Tensions section used to disappear while
   *  its jump link stayed. */
  const NO_TENSION_PROPS = {
    ...PROPS,
    axisData: AXES.map((axis) => ({
      ...axis,
      tension: { detected: false as const, level: "none" as const, direction: null },
    })),
  };

  const DISTINCTIVE_PROPS = {
    ...PROPS,
    archetype: { ...PROPS.archetype, isDistinctive: true },
  };

  /** `CompareInput` calls `useRouter`, which throws outright with no
   *  `AppRouterContext` above it. The context is supplied rather than mocked:
   *  this suite runs on `vmForks`, where a `vi.mock` of a module as widely
   *  imported as `next/navigation` leaks into whichever file runs next. */
  function renderView(props: ResultsViewProps = PROPS) {
    return render(
      createElement(
        AppRouterContext.Provider,
        { value: ROUTER_STUB },
        createElement(ResultsView, props),
      ),
    );
  }

  it("caps the column at the mock's width and takes the nav's gutters", () => {
    const container = renderView();
    const main = container.querySelector("main")!;
    const column = container.querySelector("[data-results-column]")!;

    // max-w-results (820px), NOT max-w-3xl (768px) and not max-w-shell (1040px,
    // which NavBar and Footer keep).
    expect(classes(column)).toContain("max-w-results");
    expect(classes(main)).toContain("px-[18px]");
    expect(classes(main)).toContain("min-[560px]:px-7");
  });

  it("names each section with the heading the e2e suite and the jump nav expect", () => {
    // Written after Task 12's first e2e run went red on a string no unit test
    // held. Task 10 retitled the radar section "12-axis radar" ->
    // "Twelve-axis radar"; quiz-flow.spec.ts:93 still asserted the old name and
    // nothing caught it for two commits. This file already mounted the whole
    // view — what it did not do was assert a single section TITLE, only the
    // structural classes around them. Playwright held these four strings alone,
    // and Playwright ran once in twelve tasks.
    //
    // Deliberately by TEXT and not by [data-*]: the coupling being protected is
    // to the words, because that is what `getByRole("heading", { name })` reads
    // and what a reader of the page sees. A hook would let the copy drift while
    // staying green, which is the exact failure this replaces.
    const container = renderView();
    const headings = [...container.querySelectorAll("h2")].map((h) => h.textContent);

    for (const title of [
      "Twelve-axis radar",
      "Principles against priorities",
      "Axis breakdown",
      "Compass plot",
    ]) {
      expect(headings).toContain(title);
    }

    // The section IDS are deliberately NOT re-asserted here: `points every jump
    // link at a section that is actually on the page` already pins all five, in
    // order, across three prop variants. This test is only about the titles,
    // which nothing held.
  });

  it("leads with the eyebrow, the archetype at display-page, and the match sub", () => {
    const container = renderView();

    // The e2e suite locates the page by this exact string.
    expect(container.textContent).toContain("Assessment results");
    const h1 = container.querySelector("h1")!;
    expect(h1.textContent).toBe("The Social Democrat");
    expect(classes(h1)).toContain("display-page");
    expect(container.querySelector("[data-results-sub]")!.textContent).toBe(
      "74% match — your compass across twelve axes.",
    );
  });

  it("rules the jump nav above and below", () => {
    const container = renderView();
    const nav = container.querySelector("nav")!;

    expect(classes(nav)).toContain("border-y");
    expect(classes(nav)).toContain("border-border-secondary");
    expect(classes(nav)).toContain("label-nav");
    expect(nav.querySelectorAll("a")).toHaveLength(5);
    // The page also renders NavBar's <nav>. Without a name this is a second,
    // unnamed landmark of the same role — and `querySelector("nav")` in any
    // future full-page test then reads whichever comes first in the DOM.
    expect(nav.getAttribute("aria-label")).toBe("Page sections");
  });

  it("heads each domain group with a 2px rule in the domain's own colour", () => {
    const container = renderView();
    const groups = [...container.querySelectorAll("[data-domain-head]")] as HTMLElement[];

    expect(groups).toHaveLength(4);
    expect(groups[1].style.borderTopColor).toBe("var(--domain-power)");
    expect(classes(groups[1])).toContain("border-t-2");
    // The name takes the same mark, so it steps with the rule above it.
    const name = groups[1].querySelector("[data-domain-name]") as HTMLElement;
    expect(name.textContent).toBe("Power and Authority");
    expect(name.style.color).toBe("var(--domain-power)");

    // ALL FOUR counts, not just this group's. Asserting one leaves the other
    // three free to lose a row: the twelve axes split 2/4/3/3, and a filter
    // that silently drops one renders eleven plausible rows under four
    // plausible headings.
    expect(groups.map((g) => g.querySelector("[data-domain-count]")!.textContent)).toEqual([
      "2 axes",
      "4 axes",
      "3 axes",
      "3 axes",
    ]);
    expect(groups.map((g) => g.querySelector("[data-domain-name]")!.textContent)).toEqual([
      "Economic Organization",
      "Power and Authority",
      "Society and Identity",
      "The State in the World",
    ]);
  });

  it("draws a tension as a warning-ruled panel, not a badge", () => {
    const container = renderView();
    const panels = [...container.querySelectorAll("[data-tension-panel]")];

    expect(panels).toHaveLength(2);
    // Delta 04: a 2px domain-or-warning colour on a callout's left edge.
    expect(classes(panels[0])).toContain("border-l-2");
    expect(classes(panels[0])).toContain("border-l-warning");
    // Capitalised in JS, not by a `capitalize` class over the `label` role:
    // `text-transform` leaves `textContent` alone, so a CSS-only capital is
    // invisible to a screen reader and to a copy-paste.
    expect(panels.map((p) => p.querySelector("[data-tension-title]")!.textContent)).toEqual([
      "Moderate tension · Axis 5",
      "Strong tension · Axis 8",
    ]);
    // The circled "!" glyph it replaced carried no information the title
    // did not already carry. Scoped to the panel, not the whole page: the
    // plan's `container.textContent` form also forbids `CopyLinkButton`'s
    // "Copied!" state and every future exclamation anywhere on the results
    // page, which is a tripwire for unrelated work rather than a guard.
    expect(panels[0].textContent).not.toContain("!");
  });

  it("explains each tension in the direction the respondent actually answered", () => {
    // The one assertion on this page whose failure mode is not cosmetic. The
    // two narrative arms are mirror images of each other, so swapping their
    // bodies compiles, renders, and tells every respondent with a tension the
    // exact opposite of what they answered. Both directions are pinned by
    // their pole names, which is the only thing that tells the arms apart.
    const container = renderView();
    const narratives = [...container.querySelectorAll("[data-tension-narrative]")].map(
      (p) => p.textContent,
    );

    expect(narratives).toEqual([
      // Axis 5, principles_A_but_budget_B: questionnaire toward A, budget B.
      "Your questionnaire responses lean toward Pole A 5, but your budget priorities suggest Pole B 5.",
      // Axis 8, principles_B_but_budget_A: the mirror. If this reads "Pole A 8
      // ... Pole B 8", the two arms have been swapped.
      "Your questionnaire responses lean toward Pole B 8, but your budget priorities suggest Pole A 8.",
    ]);
  });

  it("records the absence of tension rather than dropping the section", () => {
    const container = renderView(NO_TENSION_PROPS);

    expect(container.querySelectorAll("[data-tension-panel]")).toHaveLength(0);
    // The section still exists, so its jump link still resolves — see the
    // anchor test below, which is what this exists to keep honest.
    expect(container.querySelector("#tensions")).not.toBeNull();
    expect(container.querySelector("[data-tension-empty]")!.textContent).toBe(
      "No tensions recorded: your stated views and budget priorities point the same way on all twelve axes.",
    );
  });

  it("points every jump link at a section that is actually on the page", () => {
    // `toHaveLength(5)` alone passes with a link aimed at an id that does not
    // exist: clicking sets the hash, scrolls nowhere, moves focus nowhere, and
    // nothing distinguishes it from the four that work.
    for (const props of [PROPS, NO_TENSION_PROPS, DISTINCTIVE_PROPS]) {
      const container = renderView(props);
      const targets = [...container.querySelectorAll('nav a[href^="#"]')].map((a) =>
        a.getAttribute("href")!.slice(1),
      );

      expect(targets).toEqual(["archetype", "radar", "tensions", "breakdown", "compass"]);
      for (const id of targets) {
        expect(container.querySelector(`#${id}`)).not.toBeNull();
      }
    }
  });

  it("layers every section panel on the raised surface", () => {
    // Mock 7a's central move: content sits on surface-1 panels over the
    // surface-3 page ground. `PANEL` is one shared string, so one drifted
    // token restyles five sections at once and nothing else notices.
    const container = renderView();
    const panels = [
      container.querySelector("#archetype")!,
      container.querySelector("#radar div")!,
      container.querySelector("#compass div")!,
      container.querySelector("[data-tension-panel]")!,
    ];

    for (const panel of panels) {
      expect(classes(panel)).toContain("bg-surface-1");
      expect(classes(panel)).toContain("border-border-secondary");
      expect(classes(panel)).toContain("rounded-sharp");
    }
  });

  it("tells a distinctive respondent there is no match, and marks no archetype", () => {
    const container = renderView(DISTINCTIVE_PROPS);

    expect(container.querySelector("h1")!.textContent).toBe("A distinctive profile");
    expect(container.querySelector("[data-results-sub]")!.textContent).toBe(
      "Your positions don't map to a single governance philosophy — nearest match is The Social Democrat at 74%.",
    );

    // The branch that matters. `primaryArchetypeId` is passed as `undefined`
    // on this branch, which is what stops CompassPlot emphasising one of its
    // twelve reference marks — at 0.75 opacity and r=3 against the others'
    // 0.4 and r=2. Passing it unconditionally gives the compass a primary
    // archetype mark for exactly the respondents the copy has just told there
    // is no such match, and every other assertion on the page still passes.
    const marks = [...container.querySelectorAll("[data-compass-archetype]")];
    expect(marks).toHaveLength(12);
    expect(marks.filter((g) => g.getAttribute("opacity") === "0.75")).toHaveLength(0);

    // The control: the same page for a matched respondent emphasises exactly
    // one, so the assertion above cannot pass by the marks having gone away.
    const matched = renderView();
    expect(
      [...matched.querySelectorAll("[data-compass-archetype]")].filter(
        (g) => g.getAttribute("opacity") === "0.75",
      ),
    ).toHaveLength(1);
  });

  it("hands the copy and compare controls to the archetype panel", () => {
    const container = renderView();
    const grid = container.querySelector("[data-archetype-grid]")!;

    // Mock 7a draws them inside the panel; they used to sit in a bar below it.
    // The e2e suite drives both by accessible name.
    expect(grid.textContent).toContain("Copy link");
    expect(grid.textContent).toContain("Compare with someone");
  });

  it("toggles the scoring disclosures for every row at once", () => {
    const container = renderView();
    const toggle = container.querySelector("[data-scoring-toggle]") as HTMLButtonElement;

    // Every axis has a row before the toggle is touched. `aria-expanded` alone
    // is a lower bound that still holds at eleven rows, because the archetype
    // panel's own disclosure makes up the twelfth — so an axis can vanish from
    // the breakdown with this test green.
    expect(container.querySelectorAll("[data-axis-row]")).toHaveLength(12);

    expect(container.textContent).not.toContain("See how this was scored");
    act(() => toggle.click());
    expect(container.querySelectorAll("[data-axis-row]")).toHaveLength(12);
    expect(
      [...container.querySelectorAll("[data-axis-row]")].filter(
        (row) => row.parentElement!.textContent!.includes("See how this was scored"),
      ),
    ).toHaveLength(12);
  });
});

describe("results chrome drift guards", () => {
  it("keeps the migrated results components off the sub-AA tertiary token", () => {
    // Stone 500 measures 3.28:1 on the card ground — under AA for small text.
    // Phase 4 routes the label layer through --text-label and prose through
    // --text-secondary, but nothing in the per-component tests notices a
    // revert: every `text-text-label` this phase introduces can go back to
    // `text-text-tertiary` with the whole suite green. Mirrors the quiz's
    // guard at tests/unit/quiz-chrome.test.ts.
    //
    // Counted per file, not just listed: see offenceCounts. An object also
    // sidesteps the ordering problem a sorted array literal only papers over.
    const offenders = offenceCounts(/\btext-text-tertiary\b/g);

    // Shrank to [] across src/components/results at Task 10, which rewrote
    // ResultsView.tsx — the last file in that directory still on the token, at
    // 12 occurrences. Task 12 emptied the last entry: the per-axis detail
    // page's eight occurrences were three roles, not one substitution — 11px
    // structural labels to --text-label, 13px prose to --text-secondary, and
    // the unselected arm of `r.selectedPole === … ? … : "text-text-tertiary"`
    // to --text-secondary, which keeps it the weaker of the pair while
    // clearing AA (measured in a browser: 3.28:1 -> 6.52:1 in light, unchanged
    // in dark, where --text-label and --text-tertiary are the same value).
    //
    // NO RATCHET REMAINS. This is now a flat zero and must stay one; a new
    // entry here is a regression, not a backlog item.
    expect(offenders).toEqual({});
  });

  it("keeps them off the sub-AA tertiary token in its OTHER spelling too", () => {
    // The class-name guard above is blind to this phase's four SVG charts.
    // CompassPlot colours all six of its labels through inline
    // style={{ fill: 'var(--...)' }} and carries no `text-` class at all, so
    // dropping every one of them onto the 3.28:1 token passes it green. Same
    // token, same failure, different spelling.
    //
    // Comments stripped, like the class guard above: this file family writes
    // `// --mark-primary, not var(--stone-600)` as a matter of style, so the
    // natural `// --text-label, not var(--text-tertiary): 3.28:1 fails AA`
    // would otherwise red this guard on prose documenting compliance with it.
    const varOffenders = resultsSources
      .filter(({ text }) => stripComments(text).includes("var(--text-tertiary)"))
      .map(({ path }) => path)
      .sort();

    expect(varOffenders).toEqual([]);
  });

  it("keeps raw colour hexes out of the results components", () => {
    // CompassPlot's four quadrant tints were raw hexes (#6b7d8a, #85735e,
    // #7a8b6e, #96716b); a fixed hex cannot invert, and Task 9 removed them.
    // A DOM-level check on [fill] attributes looks like it guards this and does
    // not: post-task the only fill attributes left are the contours'
    // fill="none", so such a check runs over ["none","none","none","none"] and
    // a tint re-added as style={{ fill: '#6b7d8a' }} sails straight through.
    // Source level, so no spelling dodges it.
    const hexOffenders = resultsSources
      .filter(({ text }) => /#[0-9a-fA-F]{3,8}\b/.test(stripComments(text)))
      .map(({ path }) => path)
      .sort();

    expect(hexOffenders).toEqual([]);
  });

  it("has no source left in the results feature unswept", () => {
    // A sanity check on the sweep itself: if a component is added, renamed or
    // moved, every guard in this block silently stops covering it and nothing
    // else notices. ScoreBar's absence is pinned here as well as in
    // results-dead-code, because this list is what a future author reads when
    // adding a file.
    //
    // Repo-relative, because the sweep now spans two directories and three of
    // the eight files are called `page.tsx`.
    expect(resultsSources.map(({ path }) => path).sort()).toEqual([
      "src/app/results/[profileId]/[axisId]/page.tsx",
      "src/app/results/[profileId]/page.tsx",
      "src/app/results/page.tsx",
      "src/components/results/ArchetypeCard.tsx",
      "src/components/results/AxisBreakdownCard.tsx",
      "src/components/results/CompassPlot.tsx",
      "src/components/results/RadarChart.tsx",
      "src/components/results/ResultsView.tsx",
    ]);
  });

  it("routes every data mark through the stepping tokens", () => {
    // getDomainColor600 returns a fixed hex, which cannot invert. Delta 06
    // steps every dot, track, rule and domain label to its 400 tone on a dark
    // ground. The reference pages (/axes, /questions) keep the fixed accessor
    // deliberately — they are D6-deferred and their 600 tone is intended in
    // both modes — so this guard is scoped to this feature.
    expect(offenceCounts(/getDomainColor600|DOMAIN_COLORS\[[^\]]+\]\[600\]/g)).toEqual({});

    // The positive half, so the assertion above cannot pass by every domain
    // colour having been dropped. During Task 8, reverting the radar's legend
    // swatch from DOMAIN_MARK_VARS to a fixed 600 hex was undetectable by
    // every test then in place; this is the general form of that catch.
    //
    // Matched at the CALL and the SUBSCRIPT — `getDomainMarkVar(`, not
    // `getDomainMarkVar` — because the bare name is also on the import line.
    // Replacing the only use in ResultsView with a literal string leaves the
    // import behind, which satisfied an identifier-only regex and left this
    // guard green while the mount test did all the work. (Lint would red the
    // unused import, but that is a different gate than the one claiming this.)
    //
    // Counted per file for the same reason the ratchets are: RadarChart has
    // TWO consumers (the domain dots and the legend swatches), and a file-list
    // assertion survives one of them regressing while the other holds it on
    // the list. A legitimate third consumer updates the number here.
    //
    // Two files, not three: RadarChart (Task 8) and ResultsView's domain rule
    // (Task 10). AxisBreakdownCard draws no mark itself — its dots come from
    // src/components/PairedAxisScale.tsx, outside both swept directories and
    // deliberately left to phase 5, where paired-axis-scale.test.ts covers
    // them — and CompassPlot has none.
    expect(offenceCounts(/getDomainMarkVar\(|DOMAIN_MARK_VARS\[/g)).toEqual({
      "src/components/results/RadarChart.tsx": 2,
      "src/components/results/ResultsView.tsx": 1,
    });
  });

  it("never names --domain-economic where --mark-primary is meant", () => {
    // THE alias hazard of this phase, and the reason it is a source assertion
    // rather than a rendered one. --mark-primary and --domain-economic hold
    // the SAME value in BOTH modes (Stone 600 light, Stone 400 dark), because
    // the Economic domain is the Stone accent. A mutation swapping one for the
    // other renders pixel-identically in light AND dark, so no mount, no
    // screenshot and no computed-style check can catch it. An earlier phase
    // shipped a real defect exactly this way.
    //
    // The radar polygons and the mini radar are Stone marks, not Economic
    // ones. Only AxisBreakdownCard's dots — drawn by PairedAxisScale, not
    // here — are domain-scoped.
    //
    // Through stripComments: RadarChart.tsx and ArchetypeCard.tsx each carry a
    // deliberate "--mark-primary, NOT --domain-economic" note at exactly the
    // line where the distinction matters, so a raw scan reds on the prose
    // documenting the rule it enforces. Strip the prose; never reword it.
    const offenders = resultsSources
      .filter(({ text }) => stripComments(text).includes("--domain-economic"))
      .map(({ path }) => path)
      .sort();

    expect(offenders).toEqual([]);
    expect(
      resultsSources
        .filter(({ text }) => stripComments(text).includes("var(--mark-primary)"))
        .map(({ path }) => path)
        .sort(),
    ).toEqual([
      "src/components/results/ArchetypeCard.tsx",
      "src/components/results/RadarChart.tsx",
    ]);
  });

  it("keeps fixed ramp literals out of the ink and mark positions", () => {
    // The bug this project has shipped twice: a raw ramp literal where an
    // inverting token belongs. All four ramps are fixed across modes, so
    // var(--stone-900) as a fill reads as near-black ink on a near-black
    // ground — and var(--slate-600), var(--sage-700) and var(--clay-800) are
    // no less fixed than the Stone ones, so all four families are matched.
    //
    // Only `--stone-500` is spared, and only in this spelling: it is the same
    // value in both modes and is the stroke of both the mini radar's prototype
    // polygon (ArchetypeCard) and the compass contour lines (CompassPlot,
    // Task 9), neither of which needs to step. The other three ramps have no
    // such use, so their 500s stay closed.
    //
    // Through stripComments for the same reason as the guard above, and with
    // one more offender than that one: CompassPlot's ink-dot note spells out
    // "--text-primary, not var(--stone-900)".
    const offenders = offenceCounts(
      /var\(--stone-(?:50|100|200|300|400|600|700|800|900|950)\)|var\(--(?:slate|sage|clay)-(?:50|100|200|300|400|500|600|700|800|900|950)\)/g,
    );

    expect(offenders).toEqual({});
  });

  it("keeps the fixed ramp out of the Tailwind class spelling too", () => {
    // Same defect, different spelling — `border-stone-900` is exactly as fixed
    // across modes as `var(--stone-900)`, and the guard above sees neither it
    // nor `bg-clay-100`.
    //
    // This is not hypothetical. ArchetypeCard's distinctive branch carries its
    // own section rule, and `puts the section label over a hard ink rule` only
    // ever mounts the PRIMARY branch: swapping that rule to `border-stone-900`
    // was verified to survive the whole 69-test file. A browser pass would not
    // have found it either — in light mode `border-stone-900` and
    // `border-rule-strong` are near-identical, so it only shows in dark, on a
    // branch that needs a contrived profile to render at all.
    //
    // stripComments is REQUIRED here, not merely tidy: CompassPlot.tsx:143
    // carries a deliberate "a `stroke-stone-50` literal would read as
    // near-white hairlines on a dark ground" note, and a raw scan reds on it.
    const offenders = offenceCounts(
      /\b(?:text|bg|border|fill|stroke|ring|divide|from|via|to)-(?:stone|slate|sage|clay)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/g,
    );

    // Emptied by Task 12 in the same commit as its twin above — the :153 and
    // :163 pairs are two arms of one ternary and appeared in BOTH ratchets, so
    // clearing one without the other would have left those rows half-migrated.
    // The per-axis page's ten ramp classes were the last holders: the back
    // link's 600/800 hover pair became --text-secondary/--text-primary, the
    // three section headings became --text-primary (stone-800 measures 2.09:1
    // on the dark PAGE ground — body is --surface-3, and these three sit
    // directly on it rather than inside a panel; the earlier 1.78 figure here
    // was this colour against --surface-1, which is the wrong ground for these
    // elements. globals.css:29-36 uses the page ground correctly and is the
    // convention), the selected
    // pole's `bg-stone-100 text-stone-800` became `bg-surface-2
    // text-text-primary` so the highlight inverts with the surface instead of
    // staying a light beige box on a dark page, and the chosen scaled option
    // moved off text-stone-600 (3.47:1 in dark) onto --text-primary.
    //
    // NO RATCHET REMAINS, the same as its twin. A new entry is a regression.
    expect(offenders).toEqual({});
  });

  it("never layers a colour over a self-contained role", () => {
    // `caption-italic` declares its own `color`. Layering `text-*` beside it
    // is banned — whether the custom rule wins depends on Tailwind's emitted
    // order, which is too subtle to rely on. `text-[` is excluded: an
    // arbitrary size (`text-[13px]`) is not a colour.
    //
    // Known gap: the regex reads static `className="..."` only, so a
    // `className={`caption-italic ${cls}`}` evades it. No source in the swept
    // set builds this role's class list dynamically today, and widening to
    // template literals would mean matching an interpolation whose value is
    // not in this file — a guard that cannot see its own subject. Left
    // narrow and stated rather than made to look broader than it is.
    const captioned = resultsSources.flatMap(({ path, text }) =>
      [...stripComments(text).matchAll(/className="([^"]*\bcaption-italic\b[^"]*)"/g)].map(
        ([, classNames]) => `${path}: ${classNames}`,
      ),
    );

    expect(captioned.filter((entry) => /\btext-(?!\[)[a-z-]+\b/.test(entry))).toEqual([]);
    // The role is actually in use, so the assertion above is not vacuous.
    expect(captioned.length).toBeGreaterThan(0);
  });

  it("keeps the zebra fill retired", () => {
    // Delta 04: rules carry structure, and a list separated by 1px Stone 200
    // does not also need an alternating surface. The prop is gone from the
    // interface, so this guard is about the idiom not creeping back in via
    // an nth-child or an index modulo.
    //
    // Any identifier modulo two, not the literal `i % 2` the draft carried:
    // `${axisId % 2 === 0 ? "bg-surface-2" : ""}` was verified to survive the
    // whole file, since the rows here are mapped over `axisId`/`index`, never
    // `i`, and the mount test only backstops this when the fixture's index
    // happens to be even (AXIS.axisId is 3). Whitespace is optional on both
    // sides because `axisId%2` is what a formatter-free edit produces.
    const offenders = offenceCounts(
      /\balternateRow\b|\b[A-Za-z_$][\w$]*\s*%\s*2\b|\bodd:bg-|\beven:bg-/g,
    );

    expect(offenders).toEqual({});
  });

  it("routes every focus ring and corner through the shared utilities", () => {
    // A local copy of the repo-wide guardrails, kept because those scan `src`
    // and would report a violation here as an anonymous path in a long list.
    // This one names the file, which is what a reviewer of THIS phase needs.
    //
    // The corner arm is the repo-wide pattern verbatim
    // (design-system-tokens.test.ts:210) rather than the phase plan's
    // shorthand: the optional `-[a-z]{1,2}` side segment catches `rounded-t-lg`
    // and `rounded-tl-[8px]`, which the shorthand misses entirely, and the
    // `(?![\w-])` boundary stops `rounded-lg` matching inside a longer token.
    // Copying the shorthand would have left a reviewer trusting a guard
    // narrower than the one it claims to mirror.
    const offenders = offenceCounts(
      /outline-none|focus-visible:outline-|rounded(?:-[a-z]{1,2})?-(?:\[(?:12|8)px\]|lg|xl)(?![\w-])/g,
    );

    expect(offenders).toEqual({});
  });
});
