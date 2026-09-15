# Design System Delta — The Synthetic Study Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `/study/*` — the last unswept section, 12,717 lines across 48 files — onto the delta's token layer, type roles, button primitive and focus ring, and widen the phase 5 guard block to cover it, so no surface in the product is still half-migrated.

**Architecture:** The section is not written in the idiom the rest of the app uses. `/study` styles itself with **380 inline `style={{}}` objects** — 161 inline `fontSize` values, 37 `letterSpacing`, 30 `textTransform`, 40 `borderRadius` — and imports the `Button` primitive nowhere. The delta's mono label layer is authored as Tailwind `@utility` rules, so it **cannot be adopted from an inline style at all**: there is no spelling of `label` inside a `style` prop, only a hand-rolled parallel copy of it. This phase therefore converts the **type layer** — `fontSize`, `fontFamily`, `letterSpacing`, `textTransform`, `fontWeight` and text colour — from inline styles to role classes, and leaves layout and SVG geometry inline, because that is legitimate use (D23). Everything else follows from that single move: the tokens the type sites name get corrected on the way, the sub-11px HTML sites disappear into the 11px roles, and the guards in `tests/unit/design-system-tokens.test.ts` — which scan source text — can finally see the section.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4.3.3, Vitest 4 (jsdom via docblock, `vmForks` pool), Playwright.

**Spec:** `docs/superpowers/specs/2026-09-08-design-system-delta-design.md` (decision **D6**), plus `docs/system_proposal/synthetic_study_spec/` for the section's own content rules.
**Issue:** #151 (split out of #136) · **Reference:** `docs/gov_compass_redesign.zip` → `Design system delta.dc.html`

---

## Global Constraints

Phases 1 (#132, PR #140), 2 (#133, PR #143), 3 (#134, PR #145), 4 (#135, PR #150) and 5 (#136, PR #152) landed the token layer, the `Button` primitive, `PairedAxisScale`, `radar-geometry`, `PageHeader`/`SpoilerNote`/`ReferenceCta`, and the guard block. Use them rather than re-spelling values. Phase 5's Global Constraints all still apply. These are the ones this phase adds or leans on hardest.

- **`/study` is inline-styled, and that is the whole shape of the phase.** Before editing any file, read its `style={{ … }}` objects and split them mentally into two piles: **type** (`fontSize`, `fontFamily`, `letterSpacing`, `textTransform`, `fontWeight`, `color`, and `fill` on SVG text) and **everything else** (`display`, `flex`, `gap`, `padding`, `margin`, `position`, `width`, computed geometry). The type pile moves to `className`. The other pile stays exactly where it is. Do not "tidy" a `display: flex` into `class="flex"` — that is not this phase, it triples the diff, and it makes every review of this phase harder.
- **`text-text-tertiary` and `var(--text-tertiary)` both die here.** 14 class sites and 80 inline sites. `--text-tertiary` is `#9d8b78` in **both** modes and measures 3.28:1 on `--surface-1`. Two replacements, and the choice is not taste:
  - **The mono label layer** (uppercase eyebrows, section labels, nav links, numeric readouts, chart tick labels) → `text-text-label`, or `var(--text-label)` where it must stay inline.
  - **Prose, links, captions, counts, and anything sentence-case** → `text-text-secondary` / `var(--text-secondary)`.

  Never use `text-text-label` to express *de-emphasis* against `text-text-secondary`: the two resolve to the same `#6e5a48` in light mode, so the distinction renders as nothing and no light-mode check can catch a wrong pick.
- **A hover must differ from its rest colour in BOTH modes.** `text-text-label hover:text-text-secondary` animates between two identical hexes on a light page. Hover targets on the label layer go to `text-text-primary`. Issue #151 lists seven class sites; there is an **eighth**, and it is in a `<style>` block rather than a `className`, so the shipped guard cannot see it — `PersonasPageClient.tsx:691`, `.study-kicker-link:hover { color: var(--text-secondary) }`. Task 2 deletes the class outright rather than repointing it.
- **A fixed hex cannot invert.** `DemographicAggregates.tsx`'s local `domainColorFor()` returns four frozen hexes; every *mark* routes through `getDomainMarkVar()` from `@/lib/design-tokens`. `var(--stone-600)` appears inline 16 times and has the same problem in reverse — it is the mark tone, and the mark token is `--mark-primary`, which steps to Stone 400 on a dark ground.
- **`--text-xs` does not exist.** Ten sites write `fontSize: "var(--text-xs, 10px)"` or `"var(--text-xs, 11px)"` and every one of them silently renders the fallback. See D25.
- **The 11px floor is an HTML floor.** SVG `<text>` inside a scaled `viewBox` is exempt, and the exemption is not an opinion — see D24. SVG text still joins the label layer in family, tracking and fill.
- **`className` does NOT override variant classes on `Button`/`ButtonLink`.** Appending does not win; Tailwind's emitted order does. `className` is only for properties no variant sets — margin, width, position. Never pass `px-*`, `text-*`, or `block`.
- **Typography roles are single self-contained classes.** Do not layer a built-in utility over one to vary a property the role already sets. Layering a property the role does **not** set is safe — `label` declares no `font-weight` and no `color`, so `label font-medium text-text-label` is fine.
- **`focus-ring` for every interactive element.** `/study` currently has **zero** uses of it across 22 hand-rolled `<button>`s, and `WorldMap` actively suppresses the ring with `outline: "none"` on paths that are `tabIndex={0} role="button"`. See D28.
- The codebase's single responsive breakpoint is `min-[560px]`. `/study` carries its own at 480/768/960/1200px inside `<style>` blocks for the browser layout; those are a layout grid, not type, and are out of scope.
- Vitest collects only `tests/**/*.test.ts` and `scripts/__tests__/**/*.test.ts`, never `.tsx`. Component tests use `createElement` with a `@vitest-environment jsdom` docblock.
- **Do not import `@testing-library/react`.** It is listed in `package.json` and its `@testing-library/dom` peer is **not installed**, so a spec that imports it fails to *collect* — a whole-file error that reads as something other than a missing dependency. Discovered in Task 2, after the first draft of this plan specified it. Every jsdom spec in this repo hand-rolls a `createRoot` + `act` harness; `tests/unit/paired-axis-scale.test.ts` is the canonical copy, and its `render()` returns the container **directly**, not `{ container }`.
- **`vmForks` shares a module registry per worker.** Any spec that calls `vi.mock` must `vi.resetModules()` and dynamically `import()` the component under test.
- **Assert class tokens, never substrings.** `expect(el.className).toContain("label")` also passes on `label-nav`. Split on whitespace, or use `element.classList`, and assert with `toContain` on the resulting array.
- **Pin a value when, if it were wrong, nothing else would fail and the wrongness would be silent.** Skip anything a repo-wide guardrail already covers. This phase is ~250 mechanical site edits; per-site assertions would be noise. The guard block in Task 14 is the coverage; the per-task tests pin only the handful of things a text scan cannot see — a structural swap, a converged component, a removed `outline: none`.
- Lint runs at `--max-warnings=0`.

**Baseline:** `main` at `360bfaf`, **887 unit tests across 68 files**, all gates green. Measured, not assumed.

**Branch:** `feat/design-delta-study` off `main`.

---

## The role mapping

Every task from 2 to 9 applies this table. It is written once, here, rather than restated per task. Where a task's site does not appear in it, the task says so explicitly.

| What the code says today | Role class | Note |
| --- | --- | --- |
| `text-[clamp(32px,5vw,38px)] font-serif font-medium` h1, or the inline equivalent | `display-page` | Via `PageHeader`, never hand-spelled. |
| `text-[32px]` / `text-[28px]` serif numeral | `display-l` | The large-numeral use named in the spec's scale table. |
| `fontSize: "24px"` serif 500 (persona name) | `display-m` | |
| `text-[22px]` / `text-[20px]` serif 500 h2 | `display-entry` | 20 and 22 both land on 22. The delta has no 20px step and minting one to preserve a 2px difference is how a scale becomes a list of sizes. |
| `text-[17px]` serif 500 h3, `fontSize: "17px"`, `fontSize: "16px"` serif 500 | `display-s` | |
| The page's intro paragraphs | `PageHeader`'s `lead` | 15px/1.65 sans. See D31 — this overrides `patterns_page.md`. |
| `fontSize: "14px"` sans prose | `body-s` | 13.5px. |
| `fontSize: "13px"` sans prose | `body-s` | |
| `fontSize: "12px"` subordinate prose, `text-[12px]` | `body-xs` | |
| Uppercase label, **page kicker** position | `label-eyebrow` | 0.14em. Via `PageHeader`. |
| Uppercase label, **section-nav link** | `label-nav` | 0.10em. |
| Uppercase label, **directly under a data mark** (axis endpoint, legend swatch, chart key) | `label-tight` | 0.02em, so it does not push past its column. |
| Uppercase label, **everywhere else** | `label` | 0.12em. This is the default; reach for the other three only for the reasons above. |
| Mono, **sentence case**, 11px (ID readouts, counts, coordinates) | `mono-meta` | 0.06em. `P0042`, `n = 150`, `+0.34`. |
| Mono uppercase 12px on a control | `control` | Button copy. Comes free via `Button`. |

**On tracking.** `/study` spells its label tracking as `0.03em`, `0.04em`, `0.05em`, `0.06em`, `0.07em`, `0.08em` and `0.10em` across 37 sites — seven values for one job, none of them the delta's. All seven collapse onto the four roles above (D30). Do not add a fifth label sibling to preserve any of them.

**On `font-weight`.** Many label sites carry `fontWeight: 500`. The `label*` roles declare no weight, so `font-medium` beside the role is legal and wins. Keep it only where the site already had it; do not add it.

---

## Decisions

Continuing phase 5's numbering (D16–D22 live in that plan).

**D23 — The type layer converts; the rest of the inline styling stays.** `/study` is 380 inline `style` objects against roughly zero for every other section. Three options were on the table: repoint the tokens inside the inline styles and leave the idiom alone; convert the type layer only; convert everything. The first is cheapest and passes every guard in issue #151, and it was rejected because it buys a green suite without buying the thing the phase exists for — the delta's label layer is a set of `@utility` rules, and a `style` prop can only ever hold a hand-rolled parallel copy of one, which is exactly the drift the roles were extracted to end. The third was rejected on risk: `WorldMap`, `Histogram`, `ViolinOrRidge`, `TensionMatrix`, `CorrelationHeatmap` and `HorizontalBarChart` all compute geometry into style objects, and converting those is a rewrite of six charts with no design delta driving it. The middle is what the delta actually asks for, because **delta 01 is a typography delta**.

**D24 — The 11px floor is a floor on HTML text. SVG chart text is exempt.** The spec's words are "Hard floor: 11px; nothing renders below it on any viewport," and taken literally that is unsatisfiable for a chart: all six of `/study`'s SVGs are `width: 100%; maxWidth: <intrinsic>px` over a `viewBox`, so a label sized in user units renders at *or below* its nominal size and shrinks with the viewport. Honouring the floor in rendered device pixels would mean either stopping the charts scaling (horizontal scroll on a phone) or moving every tick label out of the SVG into overlaid HTML (a rewrite of six charts). Neither is proportionate, and **neither is what phases 4 and 5 did on their own charts** — the shipped `/results` and `/compare` carry `fontSize={9}` and `{10}` in `ComparisonRadar` and `GroupRadar`, and `{6.5}`/`{7.5}` in `CompassPlot`, all reviewed and all landed. Applying the floor to `/study`'s SVG text alone would make the study charts inconsistent with the results charts in the *opposite* direction from the one this phase exists to fix. So: SVG `<text>` keeps its user-unit size, and joins the label layer in family (mono), tracking, and fill (`var(--text-label)`). Task 13 does that and Task 14's guard is scoped to exclude it, with the exclusion named by property rather than by file so a new chart inherits it. **HTML text has no exemption** — all ~25 sub-11px HTML sites move up.

**D25 — `var(--text-xs, …)` is deleted, not defined.** Ten sites reference a custom property that `globals.css` has never declared, so every one renders its fallback — and the two fallbacks disagree with each other (five say `10px`, five say `11px`). The reference is worse than a literal: a reader sees a token name and believes there is a token. Defining `--text-xs` would legitimise a size namespace that the delta deliberately replaced with named roles. All ten move onto roles, and Task 14 guards the spelling so it cannot come back.

**D26 — The personas browser gets its own width token.** `/study/personas` caps itself at an inline `maxWidth: "1200px"` — a fifth page measure, and the only one wider than `--container-shell` (1040). It earns the difference: it is a two-column data browser with a filter sidebar, not a prose page, and squeezing it to 1040 costs a column of the persona grid at every breakpoint above 960px. It becomes `--container-browse: 1200px` → `max-w-browse`. Five widths, five tokens, no literals. The other three study pages go to `max-w-reference` (660px) like every other prose page, which is a real narrowing from their current `max-w-3xl` (768px) and `max-w-2xl` (672px) — that narrowing is the point, since `/study` is the same kind of reading as `/methodology`.

**D27 — `/study`'s small controls do not all become `Button`.** Twenty-two hand-rolled `<button>`s, and most are not buttons in the delta's sense: they are pagination arrows, a modal close ×, pin toggles, tab chips, tension badges and filter chips. `Button`'s three variants are page-level controls with `px-[34px] py-[15px]` padding, and forcing an icon toggle through `variant="secondary"` produces a 60px-wide × in the corner of a modal. Adding a fourth "quiet/icon" variant was considered and rejected: the delta specifies a three-tier system in as many words, and a fourth tier invented mid-sweep to fit one section's chrome is how a design system stops being one. **So:** the genuine CTAs route through `Button`; the chrome controls stay hand-rolled and instead get the two things that actually failed on them — `focus-ring` and token colours that invert. Task 14's button guard is per-file, so every file holding a real CTA passes for the wrong reason; that is stated in the guard's own comment rather than papered over, and Task 11's separate `focus-ring` guard is the one that does real work here.

**D28 — `WorldMap`'s `outline: "none"` is an accessibility defect and is removed.** `WorldMap.tsx:580` and `:627` render region paths with `tabIndex={0} role="button"`, and their `default`, `hover` and `pressed` style objects each set `outline: "none"`. react-simple-maps has no `focus` entry in that style object, so there is nothing to restore the ring — a keyboard user tabbing the map gets **no focus indicator at all**, on the section's primary navigation control. This is the same defect class as the `focus:outline-none` spelling phase 1 removed from 25 call sites, arriving by a different route: there, the ring was declared and never painted; here it is painted over. The `outline: "none"` entries go from the two interactive branches and `focus-ring` goes on via `className`. The non-interactive branches (`tabIndex={-1}`, `pointerEvents: "none"`) keep theirs — an unfocusable path has no ring to suppress, and removing it there would be churn.

**D29 — `PersonaModal`'s local `ScoreBar` converges on `PairedAxisScale`.** `PersonaModal.tsx:612` defines a private `ScoreBar` whose mapping is `((score + 1) / 2) * 100` — the pre-delta spelling that phase 4 replaced site-wide with `scoreToTrackPercent`'s `50 + score * 44`, and whose alignment bug phase 4 fixed in `GroupScoreBar` (a dot at a pole clips the track end, and the midline no longer lands where the dots say 0 is). It is also, by name, a component the repo retired: phase 5 Task 5 deleted `ScoreBar.tsx` and left an import guard behind, which this local declaration passes because it is not an import. The modal's Claude-vs-Gemini bar is exactly `PairedAxisScale`'s two-respondent variant — filled dot for A, outlined for B — so the convergence is a fit, not a squeeze, and it brings the modal a generated `aria-label` where it currently has `role="presentation"` and nothing else.

**D30 — Seven label tracking values collapse onto four roles.** Stated under the role mapping table above; recorded as a decision because the alternative (preserving each site's tracking as a new `@utility` sibling) is the locally-cheaper move at every individual site and the globally-wrong one.

**D31 — `patterns_page.md`'s serif intro yields to the delta's lead role, and the spec line is amended.** `docs/system_proposal/synthetic_study_spec/patterns_page.md:20` says the intro is "set in the same serif-heading scale as the page title," and `/study/patterns` and `/study/model-agreement` both render it as `text-[17px] font-serif`. The delta has no serif body role except `caption-italic` (13.5px italic), spec delta 01 says prose "stays sans" in as many words, and phase 5 put all five reference pages' leads on `PageHeader`'s 15px sans. Two specs disagree; the newer, site-wide one wins, and the older one gets edited rather than left to contradict the code — Task 15 Step 4 makes that edit. This is the same shape as D1, where the delta overrode `CLAUDE.md`'s filled-button rule and rewrote it.

---

### Task 1: Token layer — the browser measure, and the fifth width

**Files:**
- Modify: `src/app/globals.css` — the `@theme inline` block, after `--container-quiz` (line 276)
- Test: `tests/unit/design-system-tokens.test.ts`

**Interfaces:**
- Produces: `--container-browse` (1200px), and with it the `max-w-browse` Tailwind class.
- Consumed by: Task 2 (`PersonasPageClient`'s `<main>`).

- [ ] **Step 1: Write the failing test**

In `tests/unit/design-system-tokens.test.ts`, **replace** the existing `names all four page widths as tokens…` case (line 359) with the five-width version below, and add the second case after it. Replacing rather than appending is deliberate: leaving a "four widths" case beside a "five widths" case means the next phase has to guess which is authoritative.

```ts
  it("names all five page measures as tokens, so none is spelled as a literal", () => {
    // A width spelled `max-w-3xl` reads as a generic size rather than as
    // "the study column", so a later phase retunes one page and silently
    // desyncs it from another on the same measure. 1200 is the persona
    // browser's: it is the only measure in the product wider than the chrome
    // shell, and it is wider on purpose (D26) — a two-column data browser,
    // not a prose page.
    expect(theme["--container-shell"]).toBe("1040px");
    expect(theme["--container-results"]).toBe("820px");
    expect(theme["--container-reference"]).toBe("660px");
    expect(theme["--container-quiz"]).toBe("672px");
    expect(theme["--container-browse"]).toBe("1200px");
  });

  it("keeps the browser measure the widest, since that is the only reason it exists", () => {
    // If a later retune drops --container-browse to or below the shell, the
    // token has stopped earning its place and should be deleted rather than
    // left as a second name for 1040px.
    const px = (name: string) => Number.parseInt(theme[name], 10);

    expect(px("--container-browse")).toBeGreaterThan(px("--container-shell"));
  });
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/design-system-tokens.test.ts -t "page measures"
```

Expected: FAIL — `expected undefined to be "1200px"`.

- [ ] **Step 3: Add the token**

In `src/app/globals.css`, immediately after the `--container-quiz: 672px;` declaration and its comment block:

```css
  /* Persona browser width. The only measure in the product wider than the
     chrome shell, and the exception is earned rather than inherited:
     /study/personas is a two-column data browser with a filter sidebar, and
     at 1040px it loses a column of the persona grid at every breakpoint
     above 960px. It replaces an inline `maxWidth: "1200px"` — the last page
     measure in the codebase spelled as a literal. */
  --container-browse: 1200px;
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/unit/design-system-tokens.test.ts
```

Expected: PASS, whole file.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css tests/unit/design-system-tokens.test.ts
git commit -m "feat(design): name the persona browser measure as a width token"
```

---

### Task 2: The four page shells

**Files:**
- Modify: `src/app/study/page.tsx`
- Modify: `src/app/study/patterns/page.tsx:311-333` (the header block)
- Modify: `src/app/study/model-agreement/page.tsx:343-365` (the header block)
- Modify: `src/components/study/PersonasPageClient.tsx:521-560` (the header block), `:687-693` (the `<style>` block)
- Test: `tests/unit/study-chrome.test.ts` (create)

**Interfaces:**
- Consumes: `PageHeader` from `@/components/PageHeader` (props `kicker`, `kickerHref?`, `title`, `lead?: string[]`), `max-w-reference`, `max-w-browse`.
- Produces: nothing new. The four pages stop hand-spelling their opener.

All four pages open the same way and none of them opens the way the rest of the product does. Three of them carry a `← Synthetic Study` back-link in a hand-spelled `text-[11px] uppercase tracking-[0.08em]`, one carries the same thing as an inline style, and all four set their h1 as `clamp(32px, 5vw, 38px)` serif. `PageHeader` is exactly this block, at the delta's `label-eyebrow` tracking and `display-page` size, and issue #151 says so.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/study-chrome.test.ts`:

```ts
/**
 * @vitest-environment jsdom
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { sourceFiles } from "../helpers/source-files";

// NOT @testing-library/react. It is in package.json but its
// `@testing-library/dom` peer is not installed, so a spec importing it fails
// to COLLECT — a whole-file error, not a test failure, which reads as
// something else entirely. Every jsdom spec in this repo uses the
// createRoot + act harness below; copy it from
// `tests/unit/paired-axis-scale.test.ts`, which is the canonical version.
// Note it returns the container DIRECTLY, not `{ container }`.
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

afterEach(() => {
  for (const { container, root } of mounted.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/** Class tokens as an array. `toContain` on a raw className string passes on
 *  substrings — `"label"` matches `label-nav` — which shipped three bugs
 *  before phase 4 wrote this down. */
function classes(el: Element): string[] {
  return (el.getAttribute("class") ?? "").split(/\s+/).filter(Boolean);
}

const STUDY_SOURCES = [
  ...sourceFiles(resolve(process.cwd(), "src/app/study")),
  ...sourceFiles(resolve(process.cwd(), "src/components/study")),
].map((file) => ({ file: relative(process.cwd(), file), text: readFileSync(file, "utf8") }));

describe("the study section's page shells", () => {
  it("opens every page through the shared header rather than a hand-spelled one", () => {
    // Four pages, four spellings of one block, and the tracking disagreed
    // with the delta on all four (0.08em against label-eyebrow's 0.14em).
    // The h1 was `clamp(32px, 5vw, 38px)` — a fifth display size in a scale
    // that names seven.
    const shells = [
      "src/app/study/page.tsx",
      "src/app/study/patterns/page.tsx",
      "src/app/study/model-agreement/page.tsx",
      "src/components/study/PersonasPageClient.tsx",
    ];

    for (const shell of shells) {
      const source = STUDY_SOURCES.find(({ file }) => file === shell);
      expect(source, `${shell} is not in the study sweep`).toBeDefined();
      expect(source!.text, `${shell} does not use PageHeader`).toContain(
        'from "@/components/PageHeader"',
      );
      expect(source!.text, `${shell} still spells its own h1`).not.toContain("clamp(32px");
    }
  });

  it("retires the kicker class whose hover was invisible in light mode", () => {
    // `.study-kicker-link:hover { color: var(--text-secondary) }` lived in a
    // JSX <style> block, over a rest colour of --text-tertiary. The shipped
    // hover guard reads `className` attributes only, so a rule inside a
    // <style> string is invisible to it BY CONSTRUCTION — this is the one
    // site in the section that no scan of class names could ever have found.
    const offenders = STUDY_SOURCES.flatMap(({ file, text }) =>
      text.includes("study-kicker-link") ? [file] : [],
    );

    expect(offenders).toEqual([]);
  });

  it("caps each study page on the measure its content is, not a Tailwind size", () => {
    // Three prose pages on the reference measure; the browser on its own.
    const offenders = STUDY_SOURCES.flatMap(({ file, text }) => {
      const match = text.match(/max-w-(?:2xl|3xl|xl)(?![\w-])|maxWidth: "1200px"/);
      return match ? [`${file}: ${match[0]}`] : [];
    });

    expect(offenders).toEqual([]);
  });
});

describe("the study index page", () => {
  it("renders its kicker and title on the delta's roles", async () => {
    const { default: StudyOverviewPage } = await import("@/app/study/page");

    const container = render(createElement(StudyOverviewPage));

    const heading = container.querySelector("h1")!;
    expect(heading.textContent).toBe("The Synthetic Study");
    expect(classes(heading)).toContain("display-page");

    // The kicker is an eyebrow here, not a back-link: /study IS the section
    // landing, so there is nothing above it to link to. Its three children
    // pass `kickerHref`.
    const kicker = container.querySelector("[data-page-kicker]");
    expect(kicker).not.toBeNull();
    expect(classes(kicker!)).toContain("label-eyebrow");
    expect(kicker!.querySelector("a")).toBeNull();
  });

  it("holds the key-figure labels at the type floor", () => {
    // study/page.tsx:92 drew these at 10px, under the delta's 11px hard
    // floor, and it is the one sub-floor site issue #151 names. There are
    // about twenty-five more; the guard in Task 14 covers the rest.
    const source = STUDY_SOURCES.find(({ file }) => file === "src/app/study/page.tsx")!;

    expect(source.text).not.toContain("text-[10px]");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/study-chrome.test.ts
```

Expected: FAIL on all five cases — `src/app/study/page.tsx does not use PageHeader`, the `study-kicker-link` offender list, the `max-w-xl` / `maxWidth: "1200px"` offender list, `expected [ 'text-[clamp(32px,5vw,38px)]', … ] to contain 'display-page'`, and the `text-[10px]` case.

- [ ] **Step 3: Convert `/study` (the section landing)**

In `src/app/study/page.tsx`, add the import and replace the opener (lines 62-72) plus the four `text-[20px]` h2s and the key-figure `<dd>`:

```tsx
import { PageHeader } from "@/components/PageHeader";
```

```tsx
    <main className="min-h-screen px-4 py-12">
      <article className="mx-auto max-w-reference">
        <PageHeader
          kicker="Synthetic Study"
          title="The Synthetic Study"
          lead={[
            "In April 2026, we asked a language model to generate biographies for 1,002 fictional people, administered the Governance Compass to each via two different models, and clustered the results. This section makes that dataset available for browsing, analysis, and download.",
          ]}
        />
```

Then, within the same file:

| Line | From | To |
| --- | --- | --- |
| 89 | `text-[28px] font-serif font-medium text-text-primary leading-none tabular-nums` | `display-l text-text-primary tabular-nums` |
| 92 | `text-[10px] uppercase tracking-[0.08em] text-text-tertiary font-medium mt-1.5` | `label text-text-label font-medium mt-1.5` |
| 98, 118 | `mt-3 text-[12px] text-text-tertiary` / `mt-1.5 text-[12px] text-text-tertiary` | `mt-3 body-xs text-text-secondary` / `mt-1.5 body-xs text-text-secondary` |
| 102 | `… hover:text-text-secondary hover:decoration-text-tertiary …` | `… hover:text-text-primary hover:decoration-text-secondary …` |
| 132 | `hover:text-text-secondary … hover:decoration-text-tertiary …` | `hover:text-text-primary … hover:decoration-text-secondary …` |
| 141 | `text-[15px] text-text-secondary leading-relaxed` | `text-[15px] leading-[1.65] text-text-secondary` |
| 144, 174, 199, 226 | `text-[20px] font-serif font-medium text-text-primary mb-3 text-balance` | `display-entry text-text-primary mb-3 text-balance` |
| 253 | `text-[14px] text-text-tertiary tabular-nums font-medium shrink-0` | `mono-meta text-text-label tabular-nums font-medium shrink-0` — **`font-medium` is kept.** The first draft of this row dropped it, contradicting the Global Constraint two paragraphs above it ("keep it only where the site already had it"), and Task 2's implementer followed the row rather than the constraint and flagged the conflict. The row is now right; the constraint always was. |
| 258 | `text-[17px] font-serif font-medium text-text-primary group-hover:underline …` | `display-s text-text-primary group-hover:underline …` |
| 263 | `text-text-tertiary group-hover:text-text-secondary …` | `text-text-label group-hover:text-text-primary …` |
| 268 | `block text-[14px] text-text-secondary leading-relaxed mt-1` | `block body-s text-text-secondary mt-1` |

The `dl` at line 79 keeps its `style={{ borderTopWidth: "0.5px", borderBottomWidth: "0.5px" }}` — that is a rule weight, not type, and D23 leaves it alone.

**Three type properties disappear on all four pages when `PageHeader` is adopted, and they are accepted rather than overlooked.** The kicker loses `font-weight: 500` (`label-eyebrow` declares no weight, and neither do the five reference pages that already use this component — so this makes `/study` match them rather than diverge). Two of the h1s lose `text-balance` and their `leading-tight` / `lineHeight: 1.15`, because `display-page` sets `text-wrap: pretty` at `line-height: 1.06`. Adopting a shared component means adopting its rhythm; overriding any of the three at the call site would re-create the per-page divergence the component exists to end.

- [ ] **Step 4: Convert `/study/patterns` and `/study/model-agreement`**

Both carry the identical header block. In `src/app/study/patterns/page.tsx`, replace lines 313-334 (the `<p>` kicker, the `<h1>`, and the serif intro `<p>`) with:

```tsx
      <div className="mx-auto max-w-reference">
        <PageHeader
          kicker="← Synthetic Study"
          kickerHref="/study"
          title="Patterns"
          lead={[
            "This page characterizes the 1,002 personas as a population. Six clusters emerged from the scored profiles; the twelve hand-crafted archetypes were then compared against them. The sections below describe the clusters, where they concentrate regionally and demographically, the shape of each axis across the population, and which axis pairs covary.",
          ]}
        />
        <SectionNav … />
      </div>
```

Add `import { PageHeader } from "@/components/PageHeader";` and drop the now-unused `Link` import if nothing else in the file uses it (it does — leave it if `grep -c 'Link' ` finds other uses; lint runs at `--max-warnings=0` and will tell you either way).

In `src/app/study/model-agreement/page.tsx`, replace lines 345-367 the same way, with `title="Model agreement"` and the existing intro sentence as the single `lead` entry. Its inline section-nav (`:377-400`) is Task 3's.

Every `max-w-3xl` and `max-w-2xl` in both files becomes `max-w-reference`. That is **19** sites in `patterns/page.tsx` (1 × `3xl` + 18 × `2xl`) and 1 in `model-agreement/page.tsx`; `ModelAgreementClient`'s **11** are Task 5's. Both counts were wrong in the first draft (20 and 10) and are now measured.

- [ ] **Step 5: Convert `/study/personas`**

In `src/components/study/PersonasPageClient.tsx`:

```tsx
      <main className="mx-auto max-w-browse px-4 pb-12">
        <div className="pt-6 pb-5">
          <PageHeader
            kicker="← Synthetic Study"
            kickerHref="/study"
            title="Personas"
            lead={[
              /* the existing intro string at :558, verbatim */
            ]}
          />
        </div>
```

This replaces the inline `style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 16px 48px" }}` on `<main>` and the whole hand-styled header (lines 522-560). Then delete the `.study-kicker-link:hover` rule from the `<style>` block at line 690-692 — the class has no remaining consumers.

- [ ] **Step 6: Run the tests**

```bash
npx vitest run tests/unit/study-chrome.test.ts
npm test
```

Expected: `study-chrome.test.ts` PASS; the full suite PASS at 887 + 5 = **892 tests across 69 files**.

- [ ] **Step 7: Commit**

```bash
git add src/app/study src/components/study/PersonasPageClient.tsx tests/unit/study-chrome.test.ts
git commit -m "feat(design): open every study page through the shared page header"
```

---

### Task 3: One section nav

**Files:**
- Modify: `src/components/study/patterns/SectionNav.tsx`
- Modify: `src/app/study/model-agreement/page.tsx:377-400` (replace the inline nav)
- Test: `tests/unit/study-chrome.test.ts`

**Interfaces:**
- Consumes: `SectionNavProps { sections: { num, label, short, id }[] }` — unchanged.
- Produces: nothing new. `/study/model-agreement` stops carrying a second copy of the nav.

`/study/patterns` uses `SectionNav`; `/study/model-agreement` inlines a near-identical `<nav aria-label="Sections on this page">` with the same 11px tertiary type and the same `hover:text-text-secondary` over it. Both are the delta's `label-nav` role. Two copies of a nav is how one of them ends up with scroll-spy and the other does not — which is already true today.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/study-chrome.test.ts`:

```ts
describe("the study section nav", () => {
  it("is declared once, not once per page", () => {
    // /study/model-agreement inlined its own copy: same aria-label, same
    // 11px type, no scroll-spy. The divergence was already visible — one
    // nav highlighted the section you were reading and the other did not.
    const offenders = STUDY_SOURCES.flatMap(({ file, text }) =>
      file !== "src/components/study/patterns/SectionNav.tsx" &&
      text.includes('aria-label="Sections on this page"')
        ? [file]
        : [],
    );

    expect(offenders).toEqual([]);
  });

  it("puts the nav on the label layer with a hover that moves in both modes", async () => {
    const { SectionNav } = await import("@/components/study/patterns/SectionNav");

    const container = render(
      createElement(SectionNav, {
        sections: [{ num: "01", label: "Clusters", short: "Clusters", id: "section-1" }],
      }),
    );

    const link = container.querySelector('a[href="#section-1"]')!;
    const cls = classes(link);

    expect(cls).toContain("label-nav");
    // --text-label and --text-secondary are the same hex in light mode, so
    // the shipped `hover:text-text-secondary` animated between two identical
    // colours on a light page. --text-primary differs in both modes.
    expect(cls).toContain("hover:text-text-primary");
    expect(cls).not.toContain("hover:text-text-secondary");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/study-chrome.test.ts -t "section nav"
```

Expected: FAIL — the offender list holds `src/app/study/model-agreement/page.tsx`, and the class assertion reports `text-[11px]` where `label-nav` belongs.

- [ ] **Step 3: Put `SectionNav` on the roles**

In `src/components/study/patterns/SectionNav.tsx`, the `<nav>` (line 46) and the `<a>` (line 52):

```tsx
    <nav
      aria-label="Sections on this page"
      className="mb-14 flex flex-wrap gap-x-6 gap-y-2"
    >
      {sections.map((item) => {
        const isActive = activeId === item.id;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-current={isActive ? "location" : undefined}
            className={`label-nav whitespace-nowrap transition-colors duration-150 focus-ring ${
              isActive
                ? "text-text-primary font-medium"
                : "text-text-label hover:text-text-primary"
            }`}
          >
            <span className="tabular-nums mr-1.5">{item.num}</span>
            <span className="section-nav-full">{item.label}</span>
            <span className="section-nav-short">{item.short}</span>
          </a>
        );
      })}
    </nav>
```

Two things changed beyond the role. The rest colour is now **explicit on the element** (`text-text-label`) rather than inherited from the `<nav>`, because the shipped hover guard detects the label layer from the element's own className and cannot see a colour inherited from a parent — phase 5 hit this and resolved it the same way. And `focus-ring` is added: these are keyboard-reachable links with no focus affordance today.

- [ ] **Step 4: Replace the model-agreement nav**

In `src/app/study/model-agreement/page.tsx`, delete lines 377-400 and render the shared component:

```tsx
        <SectionNav
          sections={[
            { num: "01", label: "Overall", short: "Overall", id: "section-1" },
            { num: "02a", label: "Per-axis correlation", short: "Per-axis", id: "section-2a" },
            { num: "02b", label: "Directional drift", short: "Drift", id: "section-2b" },
            { num: "03", label: "By attribute", short: "Attribute", id: "section-3" },
            { num: "04", label: "Cases", short: "Cases", id: "section-4" },
            { num: "05", label: "Instrument", short: "Instrument", id: "section-5" },
          ]}
        />
```

`short` is required by `SectionNavItem`, and the inline version had no short labels — the six above are the abbreviations the CSS swap at 768px needs. Add `import { SectionNav } from "@/components/study/patterns/SectionNav";`.

**Carry the gap over.** Task 2 prepended `mt-6` to this inline `<nav>`'s className to replace the 24px bottom margin of the intro paragraph that `PageHeader` absorbed. Deleting lines 377-400 deletes that `mt-6` with them. Re-supply it the way Task 2 did on `/study/patterns` — wrap the `<SectionNav>` in `<div className="mt-6">` — because `SectionNav` takes only a `sections` prop and giving it a `className` prop to solve a margin is the wrong shape.

`SectionNav` is `"use client"` and `model-agreement/page.tsx` is a server component; rendering a client component from a server component is the normal direction and needs no change. The `.section-nav-full` / `.section-nav-short` CSS lives in `patterns/page.tsx`'s `<style>` block — move it into `SectionNav.tsx`'s own `<style>` so the second consumer inherits it. Grep for `section-nav-full` to find it.

- [ ] **Step 5: Run the tests**

```bash
npx vitest run tests/unit/study-chrome.test.ts
npm run typecheck
```

Expected: PASS; typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/study/patterns/SectionNav.tsx src/app/study/model-agreement/page.tsx src/app/study/patterns/page.tsx tests/unit/study-chrome.test.ts
git commit -m "feat(design): share one section nav across both study index pages"
```

---

### Task 4: The label layer — the patterns page and its components

**Files:**
- Modify: `src/app/study/patterns/page.tsx`
- Modify: `src/components/study/patterns/ClusterCard.tsx`
- Modify: `src/components/study/patterns/TopCorrelationsList.tsx`
- Modify: `src/components/study/patterns/DemographicAggregates.tsx`
- Modify: `src/components/study/patterns/ArchetypeDistribution.tsx`
- Test: `tests/unit/study-label-layer.test.ts` (create)

**Interfaces:**
- Consumes: the role classes from `globals.css`; `getDomainMarkVar(axisId)` from `@/lib/design-tokens`.
- Produces: nothing new.

> **Line numbers in every table below are against `360bfaf`** and will have shifted by the time you get here. Each row also names the property signature, which does not shift. If a line number and a signature disagree, the signature wins — find it with `grep -n`.

Apply **the role mapping table** (above) to each site. The tables here give the target for every site whose mapping is not mechanical, and name the rest by count.

**`src/app/study/patterns/page.tsx`**

| Line | Today | Target |
| --- | --- | --- |
| 86-89 | `domainColorFor()` returning `#85735e` / `#6b7d8a` / `#7a8b6e` / `#96716b` | Delete the function; call `getDomainMarkVar(axisId)`. It already returns the wrapped `var(--domain-…)` form — do **not** wrap it again. Four frozen hexes that cannot step to their 400 tone on dark (spec delta 06). |
| 516, 547 | `fontFamily: sans, fontSize: "var(--text-xs, 11px)", color: "var(--text-tertiary)"` on an axis caption | `className="label-tight text-text-label"`, drop all four properties from the style object |
| 840 | `fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", fontFamily: sans` — a short chart key | `className="label text-text-label"` |
| 874 | The same properties, but the content is **two sentences, 108 characters** | **Split it.** `Tension rate by axis × cluster` → `label text-text-label`; the rest → a sibling `<p className="body-xs text-text-secondary">`. The first draft of this table lumped this site in with its short sibling above, and Task 4's implementer correctly flagged the result: a 108-character description in uppercase mono at 0.12em is ~40% wider than it was and hard to read. Spec delta 01 says prose "stays sans" and the mono layer "frames but never enters." **A label role is for a key, not for a sentence** — apply that test to every site in Tasks 5-9 too, not just this one. |
| 362, 420, 470, 699, 761, 826 | `text-[22px] font-serif font-medium text-text-primary text-balance` | `display-entry text-text-primary text-balance` |
| 584, 657 | `text-[17px] font-serif font-medium text-text-primary` | `display-s text-text-primary` |

**`src/components/study/patterns/ClusterCard.tsx`** — 7 type sites.

| Line | Today | Target |
| --- | --- | --- |
| 66 | `17px` serif 500 primary, `lineHeight: 1.3` | `display-s text-text-primary` |
| 75 | `color: var(${colorVar})` on the cluster code | keep the colour inline (it is data-driven), add `className="mono-meta"` |
| 82 | `12px` tertiary | `body-xs text-text-secondary` |
| 94, 117 | `10px uppercase 0.08em` tertiary 500 — **below the floor** | `label text-text-label font-medium` |
| 141 | `13px` secondary `lineHeight: 1.5` | `body-s text-text-secondary` |
| 150 | bare `color: var(--text-tertiary)` | `text-text-secondary` (prose) |

**`src/components/study/patterns/TopCorrelationsList.tsx`** — 6 type sites, three of them at **9px**.

| Line | Today | Target |
| --- | --- | --- |
| 46, 71 | `9px uppercase 0.06em` tertiary sans (column headers) | `label text-text-label` |
| 58 | `9px uppercase 0.06em` tertiary **mono** | `label text-text-label` |
| 103 | `11px` primary sans `lineHeight: 1.3` | `body-xs text-text-primary` |
| 112 | `color: var(--text-tertiary)` on the `↔` glyph | `text-text-label` — this one is a mark, not prose |
| 118 | `10px` mono, colour by sign | `mono-meta`, keep the computed colour inline |

**`src/components/study/patterns/DemographicAggregates.tsx`** — 4 type sites, all on the phantom `--text-xs` (D25).

| Line | Today | Target |
| --- | --- | --- |
| 89 | `var(--text-xs, 10px)` sans uppercase 0.08em tertiary 500 | `label text-text-label font-medium` |
| 122 | `var(--text-xs, 11px)` sans secondary | `body-xs text-text-secondary` |
| 142 | `border: "1px solid var(--surface-2, #e5e5e5)"` | `border: "1px solid var(--surface-2)"` — a grey that is in no palette, as a fallback for a token that always resolves |
| 168 | `var(--text-xs, 11px)` mono tertiary | `mono-meta text-text-label` |
| 218 | `var(--text-xs, 11px)` mono secondary | `mono-meta text-text-secondary` |

**`src/components/study/patterns/ArchetypeDistribution.tsx`** — 2 style objects, neither carrying type. Read it, confirm, change nothing. It is listed here so that "did anyone look at it" has an answer.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/study-label-layer.test.ts`. This spec grows across Tasks 4-9; each task appends a `describe` block and the file is the running record of what the sweep has reached.

```ts
import { readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { sourceFiles } from "../helpers/source-files";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

/** Every inline `fontSize` still left in a file, as a list. The sweep's unit
 *  of progress: a converted file has none, and the message names the ones it
 *  has so a failure is actionable without opening the file. */
function inlineFontSizes(text: string): string[] {
  return (text.match(/fontSize: *[^,\n]+/g) ?? []).map((m) => m.trim());
}

describe("the patterns page joins the label layer", () => {
  const FILES = [
    "src/app/study/patterns/page.tsx",
    "src/components/study/patterns/ClusterCard.tsx",
    "src/components/study/patterns/TopCorrelationsList.tsx",
    "src/components/study/patterns/DemographicAggregates.tsx",
  ];

  it("leaves no inline font size on any of them", () => {
    // The whole point of the phase in one assertion: an inline fontSize is a
    // hand-rolled parallel copy of a role, and there is no spelling of
    // `label` inside a style prop.
    const offenders = FILES.flatMap((file) => {
      const sizes = inlineFontSizes(read(file));
      return sizes.length ? [`${file}: ${sizes.join(", ")}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("routes the cluster domain colours through the stepping mark variable", () => {
    // Four frozen hexes in a local helper. A fixed hex is one brown in both
    // modes, while every other mark in the product steps 600 -> 400 on a
    // dark ground (spec delta 06).
    const page = read("src/app/study/patterns/page.tsx");

    expect(page).toContain("getDomainMarkVar");
    expect(page).not.toContain("domainColorFor");
    expect(page).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });

  it("stops naming a custom property that globals.css has never declared", () => {
    // Ten sites read `var(--text-xs, …)`, and the two fallbacks disagree —
    // five say 10px and five say 11px. Every one renders its fallback. The
    // reference is worse than a literal: it reads as a token.
    const globals = read("src/app/globals.css");
    expect(globals, "if --text-xs now exists, D25 needs rewriting first").not.toContain(
      "--text-xs:",
    );

    const offenders = FILES.flatMap((file) =>
      read(file).includes("--text-xs") ? [file] : [],
    );

    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/study-label-layer.test.ts
```

Expected: FAIL on all three — the offender lists name four files, `domainColorFor` is present, `--text-xs` is present in `DemographicAggregates.tsx`.

- [ ] **Step 3: Replace `domainColorFor` in `patterns/page.tsx`**

Delete the function at lines 85-91 and its call sites. `getDomainMarkVar` returns the **already-wrapped** value — `DOMAIN_MARK_VARS.economic` is the string `'var(--domain-economic)'`, not `'--domain-economic'`. Wrapping it again yields `var(var(--domain-economic))`, which is valid CSS syntax and resolves to nothing, so the mark renders transparent and no test notices. Pass it straight through:

```tsx
import { getDomainMarkVar } from "@/lib/design-tokens";

// …at each former `domainColorFor(axisId)` call site:
fill: getDomainMarkVar(axisId),
```

Read `src/lib/design-tokens.ts:88-96` for the four values rather than retyping them from here. Its banding (`<=2`, `<=6`, `<=9`, else) is identical to the deleted helper's, so this is a value-preserving swap in light mode and a behaviour change only on dark — which is the fix.

- [ ] **Step 4: Apply the four tables**

Work file by file. For each site: move the type properties out of the `style` object and onto `className`, leave every other property in place. A site whose `style` object becomes empty loses the prop entirely.

Worked example, `ClusterCard.tsx:94`, so the shape is unambiguous:

```tsx
/* before */
<div
  style={{
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--text-tertiary)",
    fontWeight: 500,
    marginBottom: "6px",
  }}
>

/* after */
<div className="label text-text-label font-medium" style={{ marginBottom: "6px" }}>
```

- [ ] **Step 5: Run the tests**

```bash
npx vitest run tests/unit/study-label-layer.test.ts
npm test
```

Expected: `study-label-layer.test.ts` PASS; full suite green.

- [ ] **Step 6: Commit**

```bash
git add src/app/study/patterns src/components/study/patterns tests/unit/study-label-layer.test.ts
git commit -m "feat(design): put the patterns page on the delta's label layer"
```

---

### Task 5: The label layer — model agreement

**Files:**
- Modify: `src/components/study/model-agreement/ModelAgreementClient.tsx`
- Modify: `src/components/study/model-agreement/CaseStudy.tsx`
- Modify: `src/components/study/model-agreement/DisagreementByAttribute.tsx`
- Test: `tests/unit/study-label-layer.test.ts`

**`ModelAgreementClient.tsx`** — mostly class-based already, so this is a retargeting rather than a conversion. **11** `max-w-2xl` → `max-w-reference`.

> **Hand-off from Task 2, and it is the kind that gets lost.** Task 2's third test case — `caps each study page on the measure its content is` in `tests/unit/study-chrome.test.ts` — had to be **scoped to the four shell files**, because these 11 sites could not pass it yet. While scoped, it guards four files and stops guarding the other ~40 study components against a new `max-w-2xl` appearing. **This task must widen it back** to all of `STUDY_SOURCES` once the 11 are converted, not merely convert the 11. Read the comment the task-2 implementer left in that case; it names this condition.

| Line | Today | Target |
| --- | --- | --- |
| 98 | `text-[11px] text-text-tertiary` | `mono-meta text-text-label` |
| 120 | `text-[32px] font-serif font-medium text-text-primary leading-none tabular-nums` | `display-l text-text-primary tabular-nums` |
| 123 | `text-[10px] uppercase tracking-[0.08em] text-text-tertiary font-medium mt-2` — **below the floor** | `label text-text-label font-medium mt-2` |
| 127 | `text-[11px] text-text-tertiary mt-1 leading-snug` | `body-xs text-text-secondary mt-1` |
| 228, 327, 417, 511, 610, 652 | `text-[22px] font-serif font-medium text-text-primary` | `display-entry text-text-primary` |
| 266 | `text-[11px] text-text-tertiary mb-2 italic` | `caption-italic mb-2` — the role already sets colour, family, style and size; do **not** add a `text-*` class beside it |
| 414 | `text-[10px] uppercase tracking-[0.1em] text-warning-text font-medium mb-2` | `label text-warning-text font-medium mb-2` |
| 95 | `borderRadius: "2px"` | already sharp; leave (Task 10 covers radius) |

**`CaseStudy.tsx`** — 10 type sites, four of them at **10px**.

| Line | Today | Target |
| --- | --- | --- |
| 65 | `10px` sans uppercase 0.08em tertiary | `label text-text-label` |
| 109 | `10px` sans uppercase 0.1em tertiary 500 | `label text-text-label font-medium` |
| 121 | `11px` mono tertiary | `mono-meta text-text-label` |
| 144 | `14px` serif 500 primary | `display-s text-text-primary` |
| 155 | `12px` sans tertiary 0.01em | `body-xs text-text-secondary` |
| 166, 236 | `14px` serif secondary `lineHeight: 1.65` | `body-s text-text-secondary` — **and the family changes, serif → sans.** Spec delta 01: prose stays sans. The serif italic lead-ins that survive the delta are `caption-italic`; a serif *roman* body paragraph is not a role the scale has. |
| 178 | `12px` sans `var(--stone-600)` | `body-xs text-mark-primary` |
| 209 | `10px` mono tertiary | `mono-meta text-text-label` |
| 224 | `10px` sans uppercase 0.08em tertiary | `label text-text-label` |

**`DisagreementByAttribute.tsx`** — 2 type sites: `:50` (`color: var(--text-tertiary)` alone → `text-text-secondary`) and `:62` (`11px` sans uppercase 0.06em tertiary → `label text-text-label`).

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/study-label-layer.test.ts`:

```ts
describe("model agreement joins the label layer", () => {
  const FILES = [
    "src/components/study/model-agreement/ModelAgreementClient.tsx",
    "src/components/study/model-agreement/CaseStudy.tsx",
    "src/components/study/model-agreement/DisagreementByAttribute.tsx",
  ];

  it("leaves no inline font size on any of them", () => {
    const offenders = FILES.flatMap((file) => {
      const sizes = inlineFontSizes(read(file));
      return sizes.length ? [`${file}: ${sizes.join(", ")}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("sets the case-study prose in sans, not serif", () => {
    // Two analytical paragraphs were 14px serif roman. Spec delta 01 puts
    // prose in sans and keeps serif for headings plus the one italic role;
    // serif roman body is not in the scale. Asserted here rather than left
    // to the fontSize sweep because moving to `body-s` changes the SIZE
    // visibly and the FAMILY invisibly, and the family is the deliberate
    // part.
    const text = read("src/components/study/model-agreement/CaseStudy.tsx");

    expect(text).not.toContain("var(--font-serif)");
  });

  it("gives the italic caption the role that already carries its colour", () => {
    // `caption-italic` declares font-family, style, size, line-height AND
    // color. A `text-*` class beside it is either redundant or fighting it,
    // and phase 5 guarded exactly this shape.
    const text = read("src/components/study/model-agreement/ModelAgreementClient.tsx");

    for (const cls of text.match(/className="[^"]*caption-italic[^"]*"/g) ?? []) {
      expect(cls, "caption-italic already sets its colour").not.toMatch(/\btext-text-/);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/study-label-layer.test.ts -t "model agreement"
```

Expected: FAIL — the offender list names `CaseStudy.tsx` and `DisagreementByAttribute.tsx`, and `var(--font-serif)` is present.

- [ ] **Step 3: Apply the three tables**

Same mechanics as Task 4 Step 4.

- [ ] **Step 4: Run the tests**

```bash
npx vitest run tests/unit/study-label-layer.test.ts
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/study/model-agreement tests/unit/study-label-layer.test.ts
git commit -m "feat(design): put the model agreement page on the delta's label layer"
```

---

### Task 6: The label layer — the persona browser chrome

**Files:**
- Modify: `src/components/study/PersonasPageClient.tsx`, `PersonaFilters.tsx`, `PersonaGrid.tsx`, `PersonaCard.tsx`, `ClusterBadge.tsx`, `ArchetypeBadgeStudy.tsx`, `MapLegend.tsx`, `TransnationalTile.tsx`, `ComparePinButton.tsx`, `CompareFloatingButton.tsx`
- Test: `tests/unit/study-label-layer.test.ts`

Ten files, 35 type sites. The tables:

**`PersonasPageClient.tsx`** (post-Task-2, the header block is gone)

| Line | Today | Target |
| --- | --- | --- |
| 186 | `12px` secondary | `body-xs text-text-secondary` |
| 211 | tertiary, `lineHeight: 1`, `13px` | `body-s text-text-secondary`, keep `lineHeight` inline |
| 227 | `12px var(--stone-600)` | `body-xs text-mark-primary` |
| 275 | `12px` secondary `lineHeight: 1.7` | `body-xs text-text-secondary`, keep `lineHeight` |
| 300 | `12px`, colour and weight computed from `active` | `body-xs`, keep both computed properties inline |
| 326, 375 | `color: var(--text-tertiary)` | `text-text-secondary` |
| 641 | `12px` tertiary `lineHeight: 1.5` | `body-xs text-text-secondary` |

**`PersonaFilters.tsx`** — `:82` (a shared style constant, `color: var(--text-tertiary)`) and `:367` (`0.8125rem` tertiary). The constant at 82 is spread into several elements; convert its consumers to `className="label text-text-label"` and delete the constant if nothing is left in it. `0.8125rem` is 13px → `body-s text-text-secondary`.

**`PersonaGrid.tsx`** — 6 sites: `:59` (`12px` tertiary → `body-xs text-text-secondary`), `:97` (`14px` secondary → `body-s text-text-secondary`), `:111` (`13px var(--stone-600)` → `body-s text-mark-primary`), `:132` (`13px` tertiary → `mono-meta text-text-label`, this is the `Page N of M` readout), `:145` and `:169` (`13px`, colour computed from disabled state → `body-s`, keep the computed colour).

**`PersonaCard.tsx`** — 5 sites: `:69` (`16px` serif 500 → `display-s text-text-primary`), `:87` (`11px` tertiary → `mono-meta text-text-label`), `:102` (`10px` 500 0.08em, colour from cluster — **below the floor** → `label font-medium`, keep the computed colour), `:115` (`13px` secondary → `body-s text-text-secondary`), `:43` (`color: "inherit"` — leave, it is defeating a link colour, not setting type).

**`ClusterBadge.tsx`** — one style object at `:42`; the only type property is `borderRadius` (Task 10). Read and confirm.

**`ArchetypeBadgeStudy.tsx`** — 3 sites: `:49` (`11px` 0.03em 500, cluster colour → `label font-medium`, keep the colour), `:62` (`fontWeight: 400, color: tertiary` → `text-text-secondary font-normal`), `:74` (`10px` tertiary — **below the floor** → `mono-meta text-text-label`).

**`MapLegend.tsx`** — `:94` (`var(--text-xs, 11px)` mono secondary → `mono-meta text-text-secondary`), `:109` (`var(--text-xs, 10px)` sans tertiary — **below the floor** → `label-tight text-text-label`; this sits directly under the density swatches, which is what `label-tight` is for), `:112` and `:201` (bare tertiary → `text-text-label`).

**`TransnationalTile.tsx`** — `:118` (`var(--text-xs, 11px)` mono uppercase 0.04em primary → `label-tight text-text-primary`).

**`ComparePinButton.tsx`** — `:50` (colour computed from `isPinned`, `var(--stone-600)` / `var(--text-tertiary)`): both branches move — `var(--mark-primary)` when pinned, `var(--text-label)` when not. Stays inline, it is computed.

**`CompareFloatingButton.tsx`** — `:42` (`13px` 500 `var(--stone-600)` 0.01em → `control text-mark-primary`; this is a button label and `control` is the button role), `:75` (`16px` tertiary `lineHeight: 1` → `text-text-label`, keep `lineHeight`; it is a `×` glyph, not type).

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/study-label-layer.test.ts`:

```ts
describe("the persona browser chrome joins the label layer", () => {
  const FILES = [
    "src/components/study/PersonasPageClient.tsx",
    "src/components/study/PersonaFilters.tsx",
    "src/components/study/PersonaGrid.tsx",
    "src/components/study/PersonaCard.tsx",
    "src/components/study/ArchetypeBadgeStudy.tsx",
    "src/components/study/MapLegend.tsx",
    "src/components/study/TransnationalTile.tsx",
    "src/components/study/CompareFloatingButton.tsx",
  ];

  it("leaves no inline font size on any of them", () => {
    const offenders = FILES.flatMap((file) => {
      const sizes = inlineFontSizes(read(file));
      return sizes.length ? [`${file}: ${sizes.join(", ")}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("puts the mark tone on the token that steps by mode", () => {
    // `var(--stone-600)` is the mark's LIGHT value, frozen. --mark-primary
    // is the same value in light and Stone 400 in dark.
    //
    // SCOPE: this case covers only this task's files. It is NOT the guard —
    // Task 14's section-wide one is. The file-list shape was the plan's
    // original design and it was wrong: Task 5's implementer found a
    // `var(--stone-600)` chart fill in `DisagreementByAttribute.tsx` that no
    // task's list contained, so nothing would ever have caught it. Twelve
    // files in the section carry the spelling. A per-task list can only ever
    // guard the files somebody already remembered.
    const offenders = [...FILES, "src/components/study/ComparePinButton.tsx"].flatMap((file) =>
      read(file).includes("var(--stone-600)") ? [file] : [],
    );

    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/study-label-layer.test.ts -t "browser chrome"
```

Expected: FAIL on both, with eight files in the first offender list and four in the second.

- [ ] **Step 3: Apply the tables**

Same mechanics. `ComparePinButton.tsx` is deliberately absent from the `fontSize` list — it has no inline `fontSize`, only a computed colour, and adding it to that list would assert nothing.

- [ ] **Step 4: Run the tests**

```bash
npx vitest run tests/unit/study-label-layer.test.ts
npm test
```

Expected: PASS. `study-map-legend.test.ts` and `study-persona-catalog.test.ts` exercise two of these files — if either reddens, the cause is a changed DOM shape, not a changed class, and the fix is in the component.

- [ ] **Step 5: Commit**

```bash
git add src/components/study tests/unit/study-label-layer.test.ts
git commit -m "feat(design): put the persona browser chrome on the delta's label layer"
```

---

### Task 7: The label layer — `CompareView`

**Files:**
- Modify: `src/components/study/CompareView.tsx`
- Test: `tests/unit/study-label-layer.test.ts`

643 lines, 32 style objects, 16 of them carrying type, and 9 `var(--text-tertiary)` sites — the densest single file after the modal.

| Line | Today | Target |
| --- | --- | --- |
| 76, 288 | `11px` 500 uppercase 0.07em tertiary | `label text-text-label font-medium` |
| 125, 256 | `10px` tertiary — **below the floor** | `mono-meta text-text-label` |
| 211 | tertiary, `lineHeight: 1` (the close `×`) | `text-text-label`, keep `lineHeight` |
| 233 | `16px` serif 500 primary `lineHeight: 1.3` | `display-s text-text-primary` |
| 246 | `12px` secondary `lineHeight: 1.4` | `body-xs text-text-secondary` |
| 316 | `11px` secondary | `body-xs text-text-secondary` |
| 328 | `11px` primary mono | `mono-meta text-text-primary` |
| 371 | `12px var(--stone-600)` 500 | `control text-mark-primary` (a control label) |
| 399, 420 | `13px` tertiary | `body-s text-text-secondary` |
| 550 | `11px` uppercase 0.08em tertiary 500 | `label text-text-label font-medium` |
| 561 | `14px` 500 primary | `body-s text-text-primary font-medium` |
| 574 | `13px` secondary | `body-s text-text-secondary` |
| 81, 130, 218, 258, 293, 405, 426, 554 | bare `color: "var(--text-tertiary)"` | `text-text-label` where the element is a label or a mark; `text-text-secondary` where it is prose. Decide per site by reading what it wraps — the two are the same hex in light mode, so a wrong pick is invisible here and wrong on dark. |

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/study-label-layer.test.ts`:

```ts
describe("the compare view joins the label layer", () => {
  const FILE = "src/components/study/CompareView.tsx";

  it("leaves no inline font size", () => {
    expect(inlineFontSizes(read(FILE))).toEqual([]);
  });

  it("leaves no reference to the sub-AA tertiary token", () => {
    // Nine sites, all inline, so the class-scanning half of the shipped
    // guard would have missed every one.
    expect(read(FILE)).not.toContain("var(--text-tertiary)");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/study-label-layer.test.ts -t "compare view"
```

Expected: FAIL — 16 font sizes listed, `var(--text-tertiary)` present.

- [ ] **Step 3: Apply the table**

- [ ] **Step 4: Run the tests**

```bash
npx vitest run tests/unit/study-label-layer.test.ts
npm test
```

Expected: PASS, including `tests/e2e`-adjacent unit specs. `tests/e2e/study-compare.spec.ts` selects by `role` and accessible name, not by class, so it is unaffected — but do not take that on faith, Task 15 runs it.

- [ ] **Step 5: Commit**

```bash
git add src/components/study/CompareView.tsx tests/unit/study-label-layer.test.ts
git commit -m "feat(design): put the compare view on the delta's label layer"
```

---

### Task 8: The label layer — `PersonaModal`, chrome and zones 1–2

**Files:**
- Modify: `src/components/study/PersonaModal.tsx` (everything except the scored-profile block, which is Task 9)
- Test: `tests/unit/study-label-layer.test.ts`

2,430 lines, 124 style objects, 65 inline `fontSize` values, and 50 `var(--text-tertiary)` references — a third of the section's type sites in one file. It is split across two tasks so that a red suite points at half a file rather than all of it.

**This task's scope:** everything outside `function ScoreBar` (`:611`) and the two scored-profile renderers that consume it. Concretely: the header and identity block (`:184`–`:534`), the model tabs and footer (`:1862`–`:2100`), and the error/empty states (`:2278`–`:2345`).

| Line | Today | Target |
| --- | --- | --- |
| 184, 213 | `11px` tertiary | `mono-meta text-text-label` |
| 205 | primary 500 | `text-text-primary font-medium` |
| 277 | `24px` serif 500 primary `lineHeight: 1.2` | `display-m text-text-primary` |
| 290 | `13px` secondary `lineHeight: 1.4` | `body-s text-text-secondary` |
| 321 | `11px var(--model-claude)` | `mono-meta`, keep the model colour inline |
| 347 | tertiary `lineHeight: 1` (close `×`) | `text-text-label`, keep `lineHeight` |
| 404, 445 | `11px` 500 uppercase 0.05em tertiary | `label text-text-label font-medium` |
| 419, 460, 478, 485 | `13px` secondary | `body-s text-text-secondary` |
| 480 | 500 primary | `text-text-primary font-medium` |
| 505 | `14px` primary `lineHeight: 1.65` | `body-s text-text-primary` |
| 517 | `13px` secondary `lineHeight: 1.6` | `body-s text-text-secondary` |
| 534 | `13px var(--stone-600)` 500 | `body-s text-mark-primary font-medium` |
| 1865 | `13px` secondary 500 | `body-s text-text-secondary font-medium` |
| 1925 | `12px` 0.05em, colour and weight computed from `isActive` | `control`, keep both computed properties |
| 2024, 2040, 2052, 2081 | `13px`, some with computed colour | `body-s`; `text-text-label` where the colour is the static tertiary, computed colours stay inline |
| 2068 | `11px` tertiary mono | `mono-meta text-text-label` |
| 2278, 2314 | `14px` tertiary / secondary | `body-s text-text-secondary` |
| 2290, 2325 | tertiary `lineHeight: 1` | `text-text-label`, keep `lineHeight` |
| 2342 | primary | `text-text-primary` |
| 2345 | `12px` on an error string | `body-xs text-warning-text` — and see the step below, this one is not only a type change |

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/study-label-layer.test.ts`:

```ts
describe("the persona modal's chrome joins the label layer", () => {
  const FILE = "src/components/study/PersonaModal.tsx";

  it("marks the modal's error state so it is not carried by colour alone", () => {
    // Phase 5's D16 amendment: `text-red-600` was swapped for the warning
    // ink at six sites on the premise that every one already had
    // `role="alert"` or a live region, and that premise was false at three
    // of them. The modal's fetch-error string has neither today, and it is
    // about to become the same amber as an advisory notice — so the cue a
    // sighted user had gets weaker at the same moment. The role goes on
    // first.
    const text = read(FILE);
    const errorBlock = text.slice(Math.max(0, text.indexOf("{error}") - 600), text.indexOf("{error}"));

    expect(errorBlock).toContain('role="alert"');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/study-label-layer.test.ts -t "modal's chrome"
```

Expected: FAIL — `expected '…' to contain 'role="alert"'`.

- [ ] **Step 3: Add the alert role, then apply the table**

At `PersonaModal.tsx:2345`, the element rendering `{error}` gains `role="alert"` alongside its new classes. Then work the table.

The whole-file `fontSize` assertion is deliberately **not** written in this task — `function ScoreBar` and the scored-profile block still hold theirs, and an assertion that cannot pass until the next task is a broken build, not a red test. Task 9 adds it.

- [ ] **Step 4: Run the tests**

```bash
npx vitest run tests/unit/study-label-layer.test.ts
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/study/PersonaModal.tsx tests/unit/study-label-layer.test.ts
git commit -m "feat(design): put the persona modal's chrome on the delta's label layer"
```

---

### Task 9: `PersonaModal`'s scored profile converges on `PairedAxisScale`

**Files:**
- Modify: `src/components/PairedAxisScale.tsx` — add the optional mark override
- Modify: `src/components/study/PersonaModal.tsx` — delete `function ScoreBar` (`:611-653`), convert its five call sites, finish the type sweep
- Test: `tests/unit/paired-axis-scale.test.ts`, `tests/unit/study-label-layer.test.ts`

**Interfaces:**
- Produces: `PairedAxisScaleProps.markVar?: string` — a CSS colour value in the same **wrapped** shape `getDomainMarkVar` returns (`"var(--model-claude)"`, not `"--model-claude"`), replacing the domain mark on respondent A's dot. Optional; absent means the existing domain behaviour, so the three shipped consumers are untouched. **The track is not affected** — it stays `domain[400]`, which the component's own comment explains is the same value in both modes and is the neutral rail rather than the mark.
- Consumed by: `PersonaModal`'s five former `ScoreBar` sites.

`PersonaModal` declares a private `ScoreBar` whose mapping is `((score + 1) / 2) * 100`. That is the pre-delta spelling `scoreToTrackPercent` replaced everywhere else, and its defect is not cosmetic: at `score = -1` the dot lands at `0%` and is half-clipped by the track's own edge, and the midline the component draws at `left: 50%` is the only point where the two mappings agree, so every other dot is offset from where the numeric readout beside it says it is. Phase 4 fixed exactly this in `GroupScoreBar`; phase 5 deleted `ScoreBar.tsx` and left an import guard that this *local declaration* passes, because it is a declaration and not an import.

**What does not change.** The dual-model view draws two half-width tracks side by side plus a delta column — it is not one track with two dots, and converting it to one would destroy the column alignment that makes the delta column readable. All five sites are `PairedAxisScale`'s **single-respondent** variant. The layout is untouched; only the primitive underneath it changes.

**Why the primitive gains a prop.** `PairedAxisScale` colours its mark from the axis's domain. The modal colours by **model** (`--model-claude` / `--model-gemini`) in the dual view and by **sign** (`--axis-gradient-*-strong`) in the single view, and that colour is the information — a Claude bar and a Gemini bar in the same row are told apart by nothing else. Both token families already step by mode (`globals.css:191-199`), so this introduces no frozen hex and no new colour. The alternative — accepting domain colours in the modal — deletes the distinction the page exists to draw.

- [ ] **Step 1: Write the failing test for the primitive**

Append to `tests/unit/paired-axis-scale.test.ts`:

```ts
  it("lets a caller name the mark colour when the domain is not what the colour means", () => {
    // /study's model-agreement rows are told apart by colour and by nothing
    // else — a Claude track and a Gemini track sit in one row under one axis
    // name. Domain colour would make them identical.
    const container = render(
      createElement(PairedAxisScale, {
        axisId: 1,
        poleALabel: "Market",
        poleBLabel: "State",
        scoreA: 0.5,
        axisName: "Economic Model",
        markVar: "var(--model-claude)",
      }),
    );

    const dot = container.querySelector('[data-respondent="a"]');
    expect(dot).not.toBeNull();
    expect(dot!.getAttribute("style")).toContain("var(--model-claude)");
    // The domain it would otherwise have used, absent.
    expect(dot!.getAttribute("style")).not.toContain("--domain-economic");
  });

  it("still defaults to the axis's domain when no override is given", () => {
    // The three shipped consumers pass no markVar. If the default ever
    // regresses to a literal, this is the only thing that notices.
    const container = render(
      createElement(PairedAxisScale, {
        axisId: 1,
        poleALabel: "Market",
        poleBLabel: "State",
        scoreA: 0.5,
        axisName: "Economic Model",
      }),
    );

    const dot = container.querySelector('[data-respondent="a"]');
    expect(dot!.getAttribute("style")).toContain("--domain-economic");
  });

  it("leaves the track on the domain rail even when the mark is overridden", () => {
    // The track is not the mark. Its comment in the component says its 400
    // tone is identical in both modes, which is why it is a literal — and a
    // caller overriding the DOT's colour is saying something about the dot.
    const container = render(
      createElement(PairedAxisScale, {
        axisId: 1,
        poleALabel: "Market",
        poleBLabel: "State",
        scoreA: 0.5,
        axisName: "Economic Model",
        markVar: "var(--model-claude)",
      }),
    );

    const track = container.querySelector("[data-track]");
    expect(track!.getAttribute("style")).not.toContain("--model-claude");
  });
```

The dot's selector is `[data-respondent="a"]` and the track's is `[data-track]` — both already on the shipped component, so no markup changes to support the test.

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/paired-axis-scale.test.ts -t "mark variable"
```

Expected: FAIL — TypeScript rejects `markVar`, or the dot's style names the domain variable.

- [ ] **Step 3: Add the override to `PairedAxisScale`**

In `src/components/PairedAxisScale.tsx`, extend the props interface:

```ts
  /**
   * Overrides the domain colour on respondent A's dot.
   *
   * Same WRAPPED shape `getDomainMarkVar` returns — `"var(--model-claude)"`,
   * not `"--model-claude"`. The one caller is /study's model-agreement view,
   * where a Claude row and a Gemini row sit under one axis name and colour is
   * the only thing telling them apart; both model tokens already step by mode
   * (`globals.css:191-193`), so this introduces no frozen hex.
   *
   * Affects the dot only. The track keeps `domain[400]`, for the reason its
   * own comment gives, and respondent B's outlined dot is Stone 500 by the
   * spec.
   */
  markVar?: string;
```

and in the body, at the single place the dot's colour is set (`:182`):

```tsx
          style={{ left: `${scoreToTrackPercent(scoreA)}%`, backgroundColor: markVar ?? getDomainMarkVar(axisId) }}
```

Add `markVar` to the destructured parameter list. Nothing else in the component changes.

- [ ] **Step 4: Convert the modal's five call sites and delete the local `ScoreBar`**

Delete `function ScoreBar` at `PersonaModal.tsx:611-653`. At each former call site, render the primitive. The single-score site at `:819`:

```tsx
<PairedAxisScale
  axisId={axisNum}
  poleALabel={axisData?.poleA ?? ""}
  poleBLabel={axisData?.poleB ?? ""}
  scoreA={score}
  axisName={axisData?.name ?? key}
  markVar={isNeg ? "var(--axis-gradient-negative-strong)" : "var(--axis-gradient-positive-strong)"}
/>
```

Read `src/data/axes.ts` for the actual pole field names rather than trusting `poleA` / `poleB` from this page — the modal already looks `axisData` up and the fields it reads are visible at the call site.

The dual-model sites at `:1188` and `:1228` take `markVar="var(--model-claude)"` and `markVar="var(--model-gemini)"` and the same axis props; `:1342` and `:1387` likewise. Each keeps the `<span>` readout beside it, which is now Task 8's `mono-meta`.

One consequence worth expecting rather than debugging: `PairedAxisScale` renders `role="img"` with a generated `aria-label`, where the old `ScoreBar` was `role="presentation"`. The modal's axis rows therefore gain twelve (or twenty-four) announced elements each. That is the correct direction — a screen-reader user currently gets the numeric readout and nothing about the scale — but check it in Task 15 Step 2 with a screen reader open, because twenty-four generated sentences in one dialog is the kind of thing that reads well in a unit test and badly in a browser. If it is too much, the fix is `label` (the escape hatch prop), not reverting the role.

- [ ] **Step 5: Finish the file's type sweep and assert it whole**

The scored-profile block's remaining type sites, per the role mapping:

| Line | Today | Target |
| --- | --- | --- |
| 698 | `9px` uppercase 0.04em, severity colour (`TensionBadge`) — **below the floor** | `label-tight`, keep the severity colour inline |
| 797, 1155, 1292 | `11px` tertiary mono (axis number) | `mono-meta text-text-label` |
| 809, 1167, 1302 | `12px` secondary `lineHeight: 1.3` (axis name) | `body-xs text-text-secondary` |
| 829, 1259, 1311 | `11px` mono, computed colour (score readout) | `mono-meta`, keep the computed colour |
| 860 | `12px`, colour computed from `tension.description` | `body-xs`, keep the computed colour |
| 890, 1547, 1657 | `11px` 500 uppercase 0.07em tertiary | `label text-text-label font-medium` |
| 992, 1016 | `11px` secondary | `body-xs text-text-secondary` |
| 1011, 1035 | bare `letterSpacing: "0.05em"` | fold into `label` on the element |
| 1056 | `10px` tertiary mono | `mono-meta text-text-label` |
| 1065, 1107 | `10px` tertiary uppercase 0.05em | `label text-text-label` |
| 1077, 1092, 1333, 1378, 1431, 1461 | `10px`/`11px` uppercase, model colour | `label`, keep the model colour |
| 1193, 1233, 1344, 1389 | `11px` mono, model colour | `mono-meta`, keep the model colour |
| 1417, 1447 | `12px` secondary `lineHeight: 1.5` | `body-xs text-text-secondary` |
| 1485, 1504 | `11px` 500 uppercase 0.07em, model colour | `label font-medium`, keep the model colour |
| 1678, 1729 | `12px` `lineHeight: 1.4` | `body-xs` |
| 1687, 1738 | mono tertiary `11px` | `mono-meta text-text-label` |
| 1696, 1747 | secondary | `text-text-secondary` |
| 1700, 1751 | primary 500 | `text-text-primary font-medium` |
| 1708, 1759 | `11px` 400 tertiary | `mono-meta text-text-secondary font-normal` |
| 1774 | `12px` tertiary | `body-xs text-text-secondary` |
| 1782 | secondary | `text-text-secondary` |
| 957 | `return "var(--text-tertiary)"` in `deltaColor` | `return "var(--text-label)"` |
| 2029 | `copied ? "var(--cluster-3)" : "var(--text-tertiary)"` | `copied ? "var(--cluster-3)" : "var(--text-label)"` |
| 766 | `colorVar="--stone-600"` — the frozen mark tone as a **bare name**, interpolated into `var(...)` later | `"--mark-primary"`. Routed here by Task 6's implementer. The bare spelling is why it survived: a scan for `var(--stone-600)` cannot match it. |

Then append the whole-file assertions to `tests/unit/study-label-layer.test.ts`:

```ts
describe("the persona modal's scored profile converges on the shared scale", () => {
  const FILE = "src/components/study/PersonaModal.tsx";

  it("leaves no inline font size anywhere in the file", () => {
    // 65 of them when this phase started — a third of the section's type
    // sites in one file.
    expect(inlineFontSizes(read(FILE))).toEqual([]);
  });

  it("leaves no reference to the sub-AA tertiary token", () => {
    expect(read(FILE)).not.toContain("var(--text-tertiary)");
  });

  it("declares no local score bar of its own", () => {
    // Phase 5 deleted ScoreBar.tsx and guarded the IMPORT. A local
    // `function ScoreBar` passed that guard, kept the retired
    // ((score+1)/2)*100 mapping alive, and clipped a dot at either pole.
    const text = read(FILE);

    expect(text).not.toMatch(/function ScoreBar\b/);
    expect(text).not.toContain("(score + 1) / 2");
    expect(text).toContain('from "@/components/PairedAxisScale"');
  });
});
```

- [ ] **Step 6: Run the tests**

```bash
npx vitest run tests/unit/paired-axis-scale.test.ts tests/unit/study-label-layer.test.ts
npm test
npm run typecheck
```

Expected: PASS on all three. The modal is the only file `study-persona-route.test.ts` and `tests/e2e/study-persona-tensions.spec.ts` reach into; the e2e spec selects tension badges by accessible name, which this task does not change.

- [ ] **Step 7: Commit**

```bash
git add src/components/PairedAxisScale.tsx src/components/study/PersonaModal.tsx tests/unit
git commit -m "feat(design): converge the persona modal's score bar on PairedAxisScale"
```

---

### Task 10: Near-square corners (spec delta 02)

**Files:**
- Modify: 16 files under `src/components/study/` carrying an inline `borderRadius`
- Test: `tests/unit/design-system-tokens.test.ts`

The delta spec says `/study` "already use[s] no `rounded-*` classes at all and need[s] no sweep." That is true of *classes* and false of the section: there are **40 inline `borderRadius` literals**, and the shipped guard at `design-system-tokens.test.ts:223` (*has retired every 12px and 8px inline border radius from src*) misses all of them because none is 12 or 8.

The spelling census: `3px` ×15, `6px` ×4, `2px` ×6, `1px` ×3, `4px` ×1, `50%` ×2, `999px` ×1, `var(--radius)` ×1.

- **`3px`, `4px`, `6px`, `2px`, `1px` → `var(--radius)`.** All five are the same intent — a softened rectangle — spelled five ways. `2px` is already the delta's value and becomes the token anyway, because a literal that happens to match today is the one that silently stops matching when `--radius` moves.
- **`50%` and `999px` stay.** Circles and pills are unaffected by delta 02, in as many words. `50%` is the persona avatar and the scale dot; `999px` is the floating compare pill.

- [ ] **Step 1: Write the failing test**

Append to the `describe("near-square corners (design delta 02)", …)` block in `tests/unit/design-system-tokens.test.ts`:

```ts
  it("spells every non-circular radius in the study section as the token", () => {
    // The two shipped cases in this block catch 12px and 8px, which is what
    // the rest of the codebase had. /study had none of those and forty of
    // something else — 1, 2, 3, 4 and 6px, five spellings of one intent, all
    // invisible to a guard written around the two values the sweep removed.
    //
    // 50% and 999px are exempt and named rather than pattern-matched: a
    // circle is not a rounded rectangle and delta 02 says so.
    const ALLOWED = new Set(["50%", "999px", "var(--radius)"]);
    const studyFiles = [
      ...sourceFiles(resolve(process.cwd(), "src/app/study")),
      ...sourceFiles(resolve(process.cwd(), "src/components/study")),
    ];

    const offenders = studyFiles.flatMap((file) => {
      const text = readFileSync(file, "utf8");
      return (text.match(/borderRadius: *"([^"]*)"/g) ?? [])
        .map((m) => m.replace(/borderRadius: *"|"$/g, ""))
        .filter((value) => !ALLOWED.has(value))
        .map((value) => `${relative(process.cwd(), file)}: ${value}`);
    });

    expect(offenders).toEqual([]);
  });
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/design-system-tokens.test.ts -t "study section as the token"
```

Expected: FAIL with **35 offenders** listed — measured, not derived. (The census above totals 40, of which 2 are `50%`, 1 is `999px` and 1 is already `var(--radius)`, which would predict 36. It does not, and the file is right; if your number is neither 35 nor 36, say so in Task 15 Step 4 rather than adjusting the guard.)

- [ ] **Step 3: Sweep the radii**

```bash
grep -rn 'borderRadius' src/app/study src/components/study
```

For each hit that is not `50%`, `999px` or already `var(--radius)`, replace the literal with `var(--radius)`.

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/unit/design-system-tokens.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src tests/unit/design-system-tokens.test.ts
git commit -m "feat(design): sharpen the study section's corners onto the radius token"
```

---

### Task 11: Controls — the button primitive and the missing focus ring

**Files:**
- Modify: `src/components/study/WorldMap.tsx:580-660` (the two interactive geography branches)
- Modify: the six files holding hand-rolled `<button>`s — `PersonaModal.tsx`, `PersonasPageClient.tsx`, `CompareView.tsx`, `PersonaGrid.tsx`, `CompareFloatingButton.tsx`, `ComparePinButton.tsx`
- Test: `tests/unit/study-controls.test.ts` (create)

**`/study` has zero uses of `focus-ring` across 22 hand-rolled `<button>`s**, and `WorldMap` does worse than omit it — it paints over it. This is the task that matters most for anyone using the section without a mouse, and it is a bigger real-world defect than every colour in this plan put together.

Per D27, the small chrome controls stay hand-rolled. What they gain is `focus-ring` and, where they have a fill, a token that inverts.

**The `WorldMap` defect, precisely.** `:580` and `:627` render region paths with `tabIndex={isInteractive ? 0 : -1}` and `role={isInteractive ? "button" : undefined}`. Each passes react-simple-maps a `style` object with `default`, `hover` and `pressed` keys, and **every one of those three sets `outline: "none"`.** react-simple-maps has no `focus` key, so nothing restores it. A keyboard user tabbing the map — the section's primary navigation control — sees no indicator at any point. The four non-interactive branches (`:466`, `:552`, `:691`, `:766`) are `tabIndex={-1}` with `pointerEvents: "none"`; they keep their `outline: "none"`, because an unfocusable path has no ring to suppress and changing them is churn that dilutes the diff.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/study-controls.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { sourceFiles } from "../helpers/source-files";

const STUDY = [
  ...sourceFiles(resolve(process.cwd(), "src/app/study")),
  ...sourceFiles(resolve(process.cwd(), "src/components/study")),
].map((file) => ({ file: relative(process.cwd(), file), text: readFileSync(file, "utf8") }));

describe("the study section's controls are reachable without a mouse", () => {
  it("reaches files, so the guards below cannot pass vacuously", () => {
    // Phase 5's M7 lesson: every case here is `expect(offenders).toEqual([])`
    // over a flatMap, and `[].flatMap(f)` is `[]`. An empty file list makes
    // all of them green while reading nothing. Named anchors rather than a
    // bare count, because twenty of the wrong files would satisfy a count.
    const files = STUDY.map(({ file }) => file);

    expect(files.length).toBeGreaterThanOrEqual(30);
    for (const anchor of [
      "src/components/study/WorldMap.tsx",
      "src/components/study/PersonaModal.tsx",
      "src/components/study/PersonaGrid.tsx",
    ]) {
      expect(files, `sweep does not reach ${anchor}`).toContain(anchor);
    }
  });

  it("gives every hand-rolled control a focus ring", () => {
    // 22 <button>s, zero focus-ring, before this task. The three variants of
    // `Button` are page-level CTAs and most of these are icon toggles and
    // chips (D27), so the primitive is the wrong fix and the ring is the
    // right one.
    const offenders = STUDY.flatMap(({ file, text }) => {
      if (!/<button\b/.test(text)) return [];
      const buttons = text.match(/<button\b[^>]*>/gs) ?? [];
      const ringless = buttons.filter((b) => !b.includes("focus-ring"));
      return ringless.length ? [`${file}: ${ringless.length} of ${buttons.length}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("stops painting over the focus ring on the map's region paths", () => {
    // WorldMap's interactive geographies are tabIndex=0 role=button, and
    // their default/hover/pressed style objects each set outline: "none".
    // react-simple-maps has no `focus` key in that object, so there is
    // nothing to put the ring back — a keyboard user gets no indicator at
    // all, on the section's primary navigation control.
    //
    // Counted, not forbidden: the four NON-interactive branches keep theirs,
    // because an unfocusable path has no ring to suppress. Four branches ×
    // three state keys = 12. If this number moves, a branch changed and
    // somebody has to decide which kind it is.
    const map = STUDY.find(({ file }) => file === "src/components/study/WorldMap.tsx")!;
    const suppressions = (map.text.match(/outline: "none"/g) ?? []).length;

    expect(suppressions).toBe(12);
    expect(map.text).toContain("focus-ring");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/study-controls.test.ts
```

Expected: FAIL on the last two — six files in the ringless list, and `expected 18 to be 12` for the map. Eighteen is the measured count on `360bfaf`: six branches, three state keys each. Four of those branches are non-interactive and keep theirs, so twelve survive.

- [ ] **Step 3: Fix the map**

In `src/components/study/WorldMap.tsx`, in the two branches at `:580` and `:627` only: delete the `outline: "none"` entry from each of the three state objects, and add `className="focus-ring"` to the `StyledGeography`. Confirm `StyledGeography` forwards `className` to the underlying `<path>` — read its definition (grep for `StyledGeography` in the same file); if it does not, forward it there rather than working around it at the call site.

The ring is drawn by the `focus-ring` utility's `:focus-visible` rule, which uses the `outline` shorthand and therefore sets `outline-style` explicitly — the reason phase 1 authored it that way is exactly this class of override.

- [ ] **Step 4: Add the ring to the 22 controls**

Each hand-rolled `<button>` gains `focus-ring` in its `className`. Several currently have no `className` at all and are styled purely inline; give them `className="focus-ring"`.

While in each file, check the one thing D27 says the ring does not cover: a hard-coded fill. `grep -n 'backgroundColor' src/components/study/*.tsx` and confirm each resolves to a token that inverts. `PersonaModal.tsx:1925`'s active model tab is the site to look at hardest — it sets `color: isActive ? "var(--surface-1)" : …`, which is ink-on-fill and only reads correctly if the fill behind it inverts in step.

- [ ] **Step 5: Route the genuine CTAs through `Button`**

There is one, and only one, control in `/study` that is a page-level call rather than chrome: the compare pill's confirm action in `CompareFloatingButton.tsx:39`. It takes `<Button variant="secondary">` — not `primary`, which CLAUDE.md reserves for beginning or resuming the assessment, and opening a comparison is neither. Pass no `className` that touches padding, colour or display; `Button`'s variant classes win over appended classes regardless of order.

- [ ] **Step 6: Run the tests**

```bash
npx vitest run tests/unit/study-controls.test.ts
npm test
npm run lint
```

Expected: PASS; lint clean at `--max-warnings=0`.

- [ ] **Step 7: Commit**

```bash
git add src/components/study tests/unit/study-controls.test.ts
git commit -m "fix(a11y): give every study control a focus ring and stop the map painting over it"
```

---

### Task 12: `Radar.tsx` joins `radar-geometry`

**Files:**
- Modify: `src/components/study/Radar.tsx`
- Test: `tests/unit/radar-geometry.test.ts`

**Interfaces:**
- Consumes: `spokeAngle(index, total)`, `polarToCart(angle, radius, cx, cy)`, `scoreToRadius(score, maxRadius)`, `ringPoints(radius, total, cx, cy)`, `roundCoord(value)`, `TOTAL_AXES` from `@/lib/radar-geometry`.

`Radar.tsx:8` declares `polarToXY`, the **fifth** copy of the polar helper, with the parameter order reversed from the shared one (`cx, cy, r, index, total` against `angle, radius, cx, cy`) and no `roundCoord`. Phase 5 Task 12 closed this everywhere else; `/study/patterns` is the worst remaining case, because it is prerendered by Node and hydrated by Chromium and the two disagree in the last binary place. This is **live on `main` today** — the phase 5 e2e run logged `y2={179.67433714816832}` server against `"179.67433714816835"` client.

`roundCoord` exists for exactly this and is already used at seven sites.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/radar-geometry.test.ts`:

```ts
describe("no component keeps its own polar helper", () => {
  it("leaves no private copy of the polar conversion anywhere in src", () => {
    // Phase 5 closed four of five. The fifth is /study's, spelled
    // `polarToXY` with the arguments in a different order, which is why a
    // grep for `polarToCart` did not find it. The consequence is not
    // stylistic: an unrounded coordinate serialises differently in Node and
    // in Chromium, and React logs a hydration mismatch on every render of
    // /study/patterns.
    const offenders = sourceFiles(resolve(process.cwd(), "src")).flatMap((file) => {
      const text = readFileSync(file, "utf8");
      if (file.endsWith("radar-geometry.ts")) return [];
      const match = text.match(/function polarTo[A-Za-z]*\(/);
      return match ? [`${relative(process.cwd(), file)}: ${match[0]}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("rounds every coordinate the study radar emits", () => {
    // The mismatch is in the last binary place, so the assertion is on the
    // DECIMAL LENGTH, not on a value — a value assertion passes on an
    // unrounded number that happens to be short.
    const points = ringPoints(80, TOTAL_AXES, 120, 120).split(" ");

    expect(points).toHaveLength(TOTAL_AXES);
    for (const point of points) {
      for (const coord of point.split(",")) {
        const decimals = coord.split(".")[1] ?? "";
        expect(decimals.length, `${coord} is not rounded`).toBeLessThanOrEqual(COORD_PLACES);
      }
    }
  });
});
```

Import `ringPoints`, `TOTAL_AXES`, `COORD_PLACES`, `sourceFiles`, `readFileSync`, `resolve` and `relative` at the top of the file if they are not already there.

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/radar-geometry.test.ts -t "polar helper"
```

Expected: FAIL — `[ 'src/components/study/Radar.tsx: function polarToXY(' ]`.

- [ ] **Step 3: Convert `Radar.tsx`**

Delete `polarToXY` (`:8-20`) and the local `ringPoints` (`:42-47`), and rewrite the three consumers against the shared module. Note the **argument-order and radius-convention change**: the shared `polarToCart` takes `(angle, radius, cx, cy)`, and the shared `ringPoints` takes an **absolute** radius rather than a fraction.

```tsx
import {
  polarToCart,
  ringPoints,
  scoreToRadius,
  spokeAngle,
  TOTAL_AXES,
} from "@/lib/radar-geometry";

function radarPoints(scores: number[], cx: number, cy: number, r: number): string {
  return scores
    .map((score, i) => {
      // `scoreToRadius` is the shared spelling of the local
      // `((score + 1) / 2) * r`. Confirm against the module before trusting
      // this line — if the two differ, the module is right and the shape
      // moving slightly is the fix, not a regression.
      const { x, y } = polarToCart(spokeAngle(i, TOTAL_AXES), scoreToRadius(score, r), cx, cy);
      return `${x},${y}`;
    })
    .join(" ");
}
```

The axis-label positions at `:151` take `polarToCart(spokeAngle(i, TOTAL_AXES), r + labelPad - 4, cx, cy)`. The ring at `:42` becomes a direct `ringPoints(r, TOTAL_AXES, cx, cy)` call.

`NUM_AXES` at `:4` is now a third exported name for twelve; delete it and use `TOTAL_AXES`.

**One non-geometry fix belongs in this file too, routed here by Task 6's implementer:** `Radar.tsx:57` defaults `colorVar = "--stone-600"` — the frozen mark tone, written as a **bare name** and interpolated into `var(...)` at the point of use. Change the default to `"--mark-primary"`. The bare spelling is the reason this survived: a scan for `var(--stone-600)` cannot see it.

- [ ] **Step 4: Run the tests**

```bash
npx vitest run tests/unit/radar-geometry.test.ts
npm test
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Verify the hydration mismatch is actually gone**

A unit test cannot see a hydration mismatch. Build and load the page with the console open:

```bash
npm run build && npm run start
```

Then open `http://localhost:3000/study/patterns` and confirm the browser console logs **no** `Warning: Prop ... did not match` and no hydration error. Record the result; a still-mismatching page means `roundCoord` is not reaching one of the three consumers.

- [ ] **Step 6: Commit**

```bash
git add src/components/study/Radar.tsx tests/unit/radar-geometry.test.ts
git commit -m "fix(study): retire the fifth polar helper and its hydration mismatch"
```

---

### Task 13: SVG chart text joins the label layer

**Files:**
- Modify: `src/components/study/Histogram.tsx`, `ViolinOrRidge.tsx`, `TensionMatrix.tsx`, `HorizontalBarChart.tsx`, `CorrelationHeatmap.tsx`, `Radar.tsx`
- Test: `tests/unit/study-label-layer.test.ts`

Twenty `<text>` elements across six charts. Per **D24** these keep their user-unit `fontSize` — that is the one exemption in the phase, and it is an exemption from the *size*, not from the layer. What changes is the family (all mono), the tracking, and the fill.

Every one of them currently fills with `var(--text-tertiary)`, `var(--text-secondary)` or a computed data colour. The rule:

- A **tick label, axis label or chart key** → `fill: "var(--text-label)"`, `fontFamily: "var(--font-mono)"`.
- A **value printed on top of a mark** (`TensionMatrix:213`, `:262`, `CorrelationHeatmap:130`) → keep its existing contrast-driven fill (`var(--surface-1)`, `var(--stone-50)`); it is ink on a filled cell and a label colour would vanish into it.
- A **data-coloured label** (`Histogram:124`, `ViolinOrRidge:167`, `TensionMatrix:171`) → keep the computed fill.

`fill` takes no Tailwind colour class on an SVG child in this codebase's idiom, and the shipped `/results` charts spell it inline — so these stay inline, and the guard in Task 14 is written to accept `var(--text-label)` in a `fill` while still banning `var(--text-tertiary)` everywhere.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/study-label-layer.test.ts`:

```ts
describe("the study charts' text joins the label layer", () => {
  const CHARTS = [
    "src/components/study/Histogram.tsx",
    "src/components/study/ViolinOrRidge.tsx",
    "src/components/study/TensionMatrix.tsx",
    "src/components/study/HorizontalBarChart.tsx",
    "src/components/study/CorrelationHeatmap.tsx",
    "src/components/study/Radar.tsx",
  ];

  it("fills no chart label from the sub-AA tertiary token", () => {
    // These are the sites the class-scanning half of the shipped guard could
    // never reach: `fill` takes no Tailwind colour class, so SVG text names
    // its token inline or not at all.
    const offenders = CHARTS.flatMap((file) =>
      read(file).includes("var(--text-tertiary)") ? [file] : [],
    );

    expect(offenders).toEqual([]);
  });

  it("keeps the charts' own sizes, which is the exemption D24 grants", () => {
    // Not an oversight and not laziness. All six SVGs are
    // `width: 100%; maxWidth: <intrinsic>px` over a viewBox, so a label
    // sized in user units renders at or BELOW its nominal size and shrinks
    // with the viewport — an 11px floor in rendered device pixels is
    // unsatisfiable without either stopping the charts scaling or moving
    // every tick into overlaid HTML. The shipped /results charts carry
    // fontSize={9} and {6.5} for the same reason, reviewed and landed. This
    // case exists so that a later reader finds a decision here rather than
    // an inconsistency.
    const sized = CHARTS.filter((file) => /fontSize/.test(read(file)));

    expect(sized).toEqual(CHARTS);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/study-label-layer.test.ts -t "charts' text"
```

Expected: FAIL on the first — five of the six files listed.

- [ ] **Step 3: Apply the rule**

Twenty sites; `grep -n 'fill:' src/components/study/{Histogram,ViolinOrRidge,TensionMatrix,HorizontalBarChart,CorrelationHeatmap,Radar}.tsx` enumerates them. Read each one's surroundings before deciding which of the three categories it is in — the categories are about what the text sits *on*, which the property list does not tell you.

Two sites also change family: `Histogram:221`/`:238` and `CorrelationHeatmap:68`/`:87` are `var(--font-sans)` and become mono, per delta 01's "every axis endpoint, count, and status becomes uppercase monospace."

**One non-text site in these files, found by Task 5's implementer and routed here because it is their file:** `HorizontalBarChart.tsx:107`, `const defaultColor = row.color ?? "var(--stone-600)"` — the frozen mark tone as a fallback fill. It is currently unreached, because every caller now passes a colour explicitly, which is exactly why it would survive a visual check and a green suite indefinitely. It becomes `var(--mark-primary)`. Task 14's section-wide guard would red on it otherwise.

- [ ] **Step 4: Run the tests**

```bash
npx vitest run tests/unit/study-label-layer.test.ts
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/study tests/unit/study-label-layer.test.ts
git commit -m "feat(design): fill the study charts' labels from the label token"
```

---

### Task 14: Widen the guard block, and mutate it

**Files:**
- Modify: `tests/unit/design-system-tokens.test.ts`
- Test: itself

Issue #151's instruction is to widen `SWEPT` "as each directory lands," and this is where that happens. Widening it is also the phase's own measurement: every guard in the phase 5 block reddens on `/study` today, and the point of Tasks 2-13 is that they stop.

- [ ] **Step 1: Widen `SWEPT`**

Add three entries to the list at `tests/unit/design-system-tokens.test.ts:434`:

```ts
  // Phase 5b. `src/lib/study` is included deliberately even though it is
  // pure logic today and clean against all six guards — it is where a
  // colour or a class would go if one of these charts grew a helper, and a
  // directory is cheaper to add now than to remember later.
  "src/app/study",
  "src/components/study",
  "src/lib/study",
```

and extend the anchor list in the *actually reaches the swept files* case, which is the one thing standing between this block and a silent vacuous pass:

```ts
      "src/app/study/patterns/page.tsx",
      "src/components/study/PersonaModal.tsx",
      "src/components/study/WorldMap.tsx",
```

Raise its count assertion from `20` to `50` — the three directories add 48 files, and a count that no longer moves with the list is a count that has stopped meaning anything.

- [ ] **Step 2: Exclude the six hand-rolled-control files from the button case only**

The per-file button guard will redden on `/study`, correctly by its own terms and wrongly by this phase's: D27 keeps twenty-two chrome controls hand-rolled on purpose, because `Button`'s three variants are page-level CTAs with `px-[34px] py-[15px]` padding and a modal close `×` is not one. Grow the exclusion, do not weaken the guard — the same move phase 5 made for `SVG_CAPPED`:

```ts
    // /study's chrome controls are hand-rolled by decision, not by
    // accident (phase 5b, D27): pagination arrows, a modal close ×, pin
    // toggles, tab chips and tension badges. `Button` is a page-level CTA
    // with 34px of horizontal padding, and routing an icon toggle through
    // it produces a 60px-wide × in the corner of a dialog. Adding a fourth
    // "quiet" variant was the other option and was rejected — the delta
    // specifies three tiers in as many words.
    //
    // What these files ARE held to is the ring, which is the thing that was
    // actually broken: see `tests/unit/study-controls.test.ts`, *gives every
    // hand-rolled control a focus ring*. That case is per ELEMENT, so it is
    // strictly stronger than this one, and it is why excluding them here
    // costs nothing.
    const HAND_ROLLED_CHROME = [
      "PersonaModal.tsx",
      "PersonasPageClient.tsx",
      "CompareView.tsx",
      "PersonaGrid.tsx",
      "CompareFloatingButton.tsx",
      "ComparePinButton.tsx",
    ];
```

- [ ] **Step 3: Add the two guards the section needs that the others do not**

Append inside the same `describe` block:

```ts
  it("names no custom property that globals.css has never declared", () => {
    // `var(--text-xs, 10px)` appeared at ten sites and five of them
    // disagreed with the other five about the fallback. Every one rendered
    // its fallback, and a reader saw a token name and believed there was a
    // token. Generalised past --text-xs: any `var(--foo)` a swept file names
    // must exist in the stylesheet.
    //
    // Two scope notes, both measured against the whole of src/ rather than
    // reasoned about:
    //
    // 1. The pattern requires a CLOSING `)` or a `,` after the name, which
    //    excludes the dynamic form `var(--cluster-${id})`. Without that,
    //    three prefixes (`--cluster-`, `--map-density-`, `--model-`) report
    //    as undeclared at nine sites, all of them correct code. A guard that
    //    cries wolf on correct code gets deleted, so it does not see the
    //    dynamic form at all — and cannot, without evaluating the template.
    // 2. Three properties are declared outside globals.css and are named
    //    here rather than pattern-matched, so that adding a fourth is a
    //    deliberate act.
    const DECLARED_ELSEWHERE = new Set([
      "--font-source-serif", // next/font, injected on <html>
      "--petal-opacity", // set inline per petal by RadarChart
      "--tw-outline-style", // Tailwind internal
    ]);
    const declared = new Set([
      ...Object.keys(light),
      ...Object.keys(dark),
      ...Object.keys(theme),
      ...DECLARED_ELSEWHERE,
    ]);

    const offenders = sweptSources().flatMap(({ file, text }) => {
      const named = [...text.matchAll(/var\((--[a-z0-9-]+)\s*[,)]/g)].map((m) => m[1]);
      return [...new Set(named)]
        .filter((name) => !declared.has(name))
        .map((name) => `${relative(process.cwd(), file)}: ${name}`);
    });

    expect(offenders).toEqual([]);
  });

  it("keeps the frozen mark tones out of every inline style in the section", () => {
    // The shipped phase-5 ramp guard matches `text|bg|border-stone-NNN`,
    // which is a TAILWIND CLASS. /study names the ramp inline instead, as
    // `var(--stone-600)`, at twelve sites across twelve files — invisible to
    // that guard in every one of them.
    //
    // 600 and 400 are the mark tones, and a mark must step by mode:
    // `--mark-primary` is Stone 600 in light and Stone 400 in dark, so
    // either literal freezes it to one of the two.
    //
    // 900 and 50 are deliberately NOT banned. They appear in `TensionMatrix`
    // and `WorldMap` as ink printed ON a filled cell, where the colour is
    // chosen for contrast against the fill rather than as a mark — the same
    // category D24 carves out for chart text. Ban them and the only way to
    // pass is to make that ink illegible.
    // BOTH SPELLINGS, and the second is the one that hides. A component can
    // hold the bare NAME — `colorVar = "--stone-600"` — and interpolate it
    // into `var(...)` at the point of use, which no scan for
    // `var(--stone-600)` can match. Task 6's implementer found one of those
    // in a file no task's list covered. This is the third time in this phase
    // a guard has been blind to a spelling rather than to a site: the
    // `<style>`-block hover was the first, the inline-vs-class ramp the
    // second. The lesson is the same each time — match the TOKEN, not the
    // syntax somebody happened to write it in.
    const offenders = sweptSources().flatMap(({ file, text }) => {
      const match = text.match(/--stone-(?:600|400)\b/);
      return match ? [`${relative(process.cwd(), file)}: ${match[0]}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("holds the type floor on every swept HTML element", () => {
    // 11px is the delta's hard floor. /study had about twenty-five HTML
    // sites under it — 10px and 9px, inline and as classes.
    //
    // SCOPE, and it is a real one: this reads `fontSize:` in style objects
    // and `text-[Npx]` classes. SVG <text> sizes its labels with a
    // `fontSize={9}` ATTRIBUTE, which this pattern does not match, and that
    // is deliberate per D24 rather than an accident of the regex — read
    // that decision before "fixing" this to catch them.
    const offenders = sweptSources().flatMap(({ file, text }) => {
      const sizes = [
        ...[...text.matchAll(/fontSize: *"([\d.]+)px"/g)].map((m) => Number(m[1])),
        ...[...text.matchAll(/text-\[([\d.]+)px\]/g)].map((m) => Number(m[1])),
      ];
      return sizes
        .filter((px) => px < 11)
        .map((px) => `${relative(process.cwd(), file)}: ${px}px`);
    });

    expect(offenders).toEqual([]);
  });
```

- [ ] **Step 4: Run the whole block**

```bash
npx vitest run tests/unit/design-system-tokens.test.ts
```

Expected: PASS. Any failure here is a site Tasks 2-13 missed; **fix the site, not the guard.**

- [ ] **Step 5: Mutation-test the widened guards**

A source-scanning guard fails by passing vacuously, and a green run proves nothing until each has been shown to redden. Apply each mutation, run the named test, confirm it **fails**, then revert. Record the result of every row in this table — a mutation that does not redden is a finding, not a formality, and phase 5's most valuable result came from exactly this step.

| # | Mutation | Must redden | Result |
|---|---|---|---|
| M1 | Restore `color: "var(--text-tertiary)"` on one span in `CompareView.tsx` | `keeps the sub-AA tertiary text token off every swept surface` | |
| M2 | Restore `#85735e` in `patterns/page.tsx` | `admits no raw hex on a swept surface` **and** Task 4's `routes the cluster domain colours through the stepping mark variable` | |
| M3 | Restore `fontSize: "10px"` on one `ClusterCard` label | `holds the type floor on every swept HTML element` **and** Task 4's `leaves no inline font size on any of them` | |
| M4 | Restore `fontSize: "var(--text-xs, 10px)"` in `DemographicAggregates.tsx` | `names no custom property that globals.css has never declared` **and** the floor case | |
| M5 | Restore `max-w-3xl` in `model-agreement/page.tsx` | `caps every swept page on a width token` **and** Task 2's `caps each study page on the measure its content is` | |
| M6 | Restore `outline: "none"` in one interactive `WorldMap` branch | Task 11's `stops painting over the focus ring on the map's region paths` | |
| M7 | Drop `focus-ring` from one `PersonaGrid` button | Task 11's `gives every hand-rolled control a focus ring` | |
| M8 | Reintroduce `function polarToXY` in `Radar.tsx` | Task 12's `leaves no private copy of the polar conversion anywhere in src` | |
| M9 | Restore `hover:text-text-secondary` on `SectionNav`'s inactive link | `never gives an element a hover that resolves to its resting value` **and** Task 3's nav case | |
| M10 | Restore `function ScoreBar` and one call site in `PersonaModal.tsx` | Task 9's `declares no local score bar of its own` | |
| M11a | Restore `var(--stone-600)` as one chart fill in `DisagreementByAttribute.tsx` | `keeps the frozen mark tones out of every inline style in the section` | |
| M11 | Restore the `.study-kicker-link:hover` rule in `PersonasPageClient.tsx`'s `<style>` block | Task 2's `retires the kicker class whose hover was invisible in light mode` — and **confirm the shipped hover guard stays GREEN on it**, because that is the point of the separate case | |
| M12 | Empty the three new `SWEPT` entries, leaving phase 5's fourteen | The two **new** cases in Step 3 must still pass (phase 5's files satisfy them), so this row is checking something different: that the anchor case in Step 1 reddens. | |
| M13 | Empty `SWEPT` to `[]` | **Every** case in the block, via `sweptSources()`'s throw | |

M11 and M12 are the two easiest to skip and the two worth most. M11 is the only evidence that the `<style>`-block defect is covered by something, since the shipped hover guard reads `className` attributes and is *structurally incapable* of seeing it — if M11 reddens the shipped guard too, then the guard is stronger than this plan claims and that is worth writing down. M12 distinguishes "the new guards work" from "the new guards are pointed at the new files"; a phase that widened a list and never checked the widening took effect is phase 5's M7 with a different name.

Check that each mutation applied as **valid syntax** before recording it as survived. A broken template literal makes vitest report no failures at all, which a harness grepping for failed-test lines records as "survived".

- [ ] **Step 6: Commit**

```bash
git add tests/unit/design-system-tokens.test.ts
git commit -m "test(design): widen the sweep guards to the synthetic study section"
```

---

### Task 15: Verification, the spec amendment, and the PR

**Files:**
- Modify: `docs/system_proposal/synthetic_study_spec/patterns_page.md`
- Modify: `docs/superpowers/plans/2026-09-14-design-system-delta-study.md` (this file)
- Modify: `CLAUDE.md` if any statement in it is now false

- [ ] **Step 1: Run every gate**

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

Expected: all green. Record the final test count — the baseline was 887 across 68 files.

Three things to expect rather than debug:
- `npm run build` runs `prebuild`, which executes `scripts/build-synthetic-study.ts` and `build-geo.ts`. Neither is touched by this phase; if one fails, it is an environment problem, not a regression.
- E2E needs port 3000 free and no stray dev server. A wall of local e2e failures is usually another dev server, not this diff.
- `tests/e2e/study-*.spec.ts` select by role and accessible name throughout, so they should be unaffected. `study-persona-tensions.spec.ts` matches tension badges by the name `/^(mild|moderate|strong) tension on axis \d+/`, which Task 9 does not change — but Task 9 *does* add a generated `aria-label` to every axis scale in the modal, so a name-based selector that was previously unique may now match more than one element. If a spec reddens with a strict-mode violation, that is why, and the fix is in the spec's selector, not in the component.

- [ ] **Step 2: Verify the section by eye, on the production build**

`next dev` reload-loops under a driven browser and resets React state, so this check runs against `npm run build && npm run start` — not the dev server. No unit test in this repo computes a custom property (jsdom does not), so **nothing above proves the section renders correctly in dark mode**; this step is the only thing that does, and it is not optional.

Walk all four pages in **both** colour schemes and confirm:
1. `/study` — the key figures, the download line, the three deep links.
2. `/study/personas` — the browser at 1200px, the filter sidebar, the map, a persona card, the modal (both a single-model and a shared persona), the compare view with three pins.
3. `/study/patterns` — all six sections; the console must log **no hydration warning** (Task 12).
4. `/study/model-agreement` — the stat row, the case studies, the section nav's scroll-spy.

Then, with a keyboard only: tab through `/study/personas` and confirm a visible ring on every control **including the map's region paths**, which had none before this phase. Then tab `/study/patterns`'s section nav.

Specific things to look at rather than glance past, because each is a place a unit test is blind:
- The charts after Task 13: mono tick labels are wider than the sans ones they replace, so a tick row that just fit may now collide. `Histogram`, `ViolinOrRidge` and `CorrelationHeatmap` are the three with the tightest label rows.
- The modal's axis rows after Task 9: the dots should now sit where their numeric readouts say, and a score of ±1.00 should sit **on** the track rather than half off its end. That is the defect the convergence fixes and it is visible at a glance once you know to look.
- The three prose pages narrowing from 768px to 660px: confirm nothing that assumed the wider measure now wraps badly — the correlation and tension charts on `/study/patterns` are the widest things on those pages.
- **`ClusterCard`'s title line**, flagged by Task 4's implementer and deliberately left as-is: the cluster code `C2` dropped from an inherited 17px serif to 11px `mono-meta` while the name beside it stayed `display-s`, joined by an em dash. A mono code beside a serif name is the house idiom (`/archetypes` pairs a mono `NN` with its entry name), so this follows the role mapping — but whether `C2 — The Communitarian` still reads as one phrase across that size step is a question only a browser answers. The same pattern recurs on `PersonaCard` and `ClusterBadge` in Task 6, so decide it once here and apply the answer to all three.
- **`MapLegend`'s cluster sublabels are truncated to about 15 of 34 characters** by an 80px `maxWidth`, and were before this phase — "Institutional authority and growth" has never fitted. Task 6 moved them off the mono label layer onto `body-xs` (they are a phrase, not a key), which recovers some width, but the cap is a legend layout question this phase deliberately did not reopen. Decide whether it wants fixing, and in which phase.
- **The kicker weight**, on all four pages: `PageHeader` sets no `font-weight` and the four hand-rolled kickers all carried 500. `/study` now matches the five reference pages. Confirm that reads as deliberate rather than washed out.

- [ ] **Step 3: Amend the study spec (D31)**

In `docs/system_proposal/synthetic_study_spec/patterns_page.md`, replace line 20:

```markdown
Two sentences, set as the page lead — 15px sans, via the shared `PageHeader`.
Originally specified as "the same serif-heading scale as the page title"; the
design system delta (`docs/superpowers/specs/2026-09-08-design-system-delta-design.md`,
delta 01) puts prose in sans and reserves serif for headings plus the one
italic caption role, and phase 5b put all four study pages on the same header
block as the five reference pages. See that phase's plan, D31.
```

Check `overview_page.md`, `model_agreement_page.md` and `persona_modal.md` for the same claim before moving on — `persona_modal.md:26` says the persona name is "large, serif, prominent," which **remains true** (`display-m` is serif) and needs no edit.

- [ ] **Step 4: Reconcile this plan with what shipped**

Phase 5's own self-review found the plan and the artifact had drifted in three separate ways, and the lesson was that a plan read after the fact is taken as a record. Walk the tasks and correct anything that is now false:
- Every line number in the tables is against `360bfaf` and every one has moved. Do not renumber them — say once, at the top of the role mapping section, that they are as-of-`360bfaf`. (It already does; confirm the wording survived.)
- The radius census in Task 10 Step 2 predicts a number. Write the real one in.
- The `outline: "none"` count in Task 11 says 18 before and 12 after, both measured on `360bfaf`. Confirm the after-count is 12 and not something else.
- Fill in the **Result** column of Task 14's mutation table, every row.
- Anything a review changed goes in a `## Review fixes` section at the bottom, not silently into the task that "should" have done it.

- [ ] **Step 5: Check `CLAUDE.md` for statements this phase falsified**

The Key Directories entry for `src/components/study/` and the Architecture Notes on the study section describe structure, not styling, and should both still be true. The Design Context's claim that domain colour marks "appear only on the results page radar/axis breakdown" was already false of `/study` before this phase and is still false after it — `/study/patterns` colours its cluster radars by domain. Either correct that sentence or, if the intent was "the general palette admits no other hues," reword it to say that. Do not leave it as-is on the grounds that this phase did not introduce it.

- [ ] **Step 6: Open the PR**

```bash
git push -u origin feat/design-delta-study
gh pr create --title "feat(design): design system delta — phase 5b synthetic study section" --body "…"
```

The body should name: the four pages and ~30 components swept; the two accessibility fixes that are not cosmetic (`WorldMap`'s painted-over focus ring, 22 ringless controls); the hydration mismatch closed on `/study/patterns`; the `PairedAxisScale` convergence and its `markVar` addition; the mutation table's results; and `Closes #151`.

---

## Deferred to later phases

Recorded here so they are not rediscovered as bugs.

- **`/study`'s layout stays inline-styled.** D23 converts the type layer and nothing else, so ~220 style objects carrying `display`, `flex`, `gap`, `padding` and computed geometry survive this phase intact. That is a deliberate stopping point, not an unfinished sweep: none of it is drift against the design system, because the design system has nothing to say about a `gap: "6px"`. If a later phase converts them, the reason should be maintainability and not delta compliance.
- **The section's four responsive breakpoints.** `/study` carries its own at 480, 768, 960 and 1200px inside JSX `<style>` blocks, against a codebase whose stated single breakpoint is `min-[560px]`. They are a data-browser layout grid rather than a type scale, and reconciling them is a layout question this phase had no design input on.
- **`PairedAxisScale` is still outside every guard's scan.** Phase 4 left it out because it is a shared primitive with consumers in three features; this phase adds a fourth consumer and does not change that reasoning. It is now the single most-depended-on component in the delta and the only one no source guard reads.
- **The `sourceFiles`-based test harness is duplicated across nine specs and this phase adds three more.** Phase 5 recorded it as "do it before phase 6" and it is now twelve copies of `render` / `classes` / the `afterEach` trio. The reason for deferring still holds — moving it mid-phase makes a red suite ambiguous — and the reason for doing it has got stronger by a third.
- **Tailwind's content scanner reads `docs/**/*.md`,** so every class name written in this plan compiles into the production stylesheet with zero source consumers. Harmless to correctness, and it means a test can never prove a class is absent by grepping the emitted CSS. The fix is a `@source` directive in `globals.css`; still its own task.
- **Bare `rounded` is still unswept.** Issue #139. `/study` has none, so this phase neither helped nor hurt.
- **`GroupRadar` still carries its own pad-to-twelve loop.** Phase 5's deferral, untouched here.
- **`--text-tertiary` now has no consumers in `src/`** — or it should not, once this phase lands. Deleting the token is a one-line change and is deliberately *not* in this phase: the last thing a phase that removed 94 call sites should also do is remove the thing that would tell it if it missed one. Delete it in phase 6, after a full release has gone by.

---

## Self-Review

Checked against `docs/superpowers/specs/2026-09-08-design-system-delta-design.md` and issue #151.

**Issue scope, bullet by bullet.**
- "`text-text-tertiary` is banned on every swept surface; `/study` is the last holdout" → Tasks 4-9, 13; guarded in Task 14. The issue names `patterns/page.tsx` and `CompareView.tsx` as carrying the `var()` form; the real count is **80 inline sites across 25 files** against 14 class sites, which is why the phase is shaped as a type-layer conversion rather than a token swap.
- "The same applies to the raw-hex, non-palette-hue, hand-rolled-button and page-width guards" → Tasks 4 (hex), 2 (width), 11 + D27 (button). **Non-palette hue: there is nothing to do** — `/study` has zero Tailwind colour utilities from a banned family. Checked, not assumed.
- "Read `sweptSources()` first — it throws on an empty resolution" → Task 14 Step 5, rows M12 and M13.
- "`Radar.tsx` inlines a fifth `polarToCart` as `polarToXY`" → Task 12, including the browser check that a unit test cannot perform.
- "`max-w-xl` and a `text-[clamp(32px,5vw,38px)]` h1; the delta's roles are `max-w-reference` and `display-page`" → Task 2. `PageHeader`'s `kicker` + `kickerHref` do fit directly, as the issue predicted.
- "`study/page.tsx:92` draws a 10px label" → Task 2 Step 3, and Task 14's floor guard, which found **about twenty-five more HTML sites** the issue does not name.
- "The width guard excludes `ComparisonRadar`/`GroupRadar` … `/study` charts will likely need the same exclusion — grow the list, don't weaken the guard" → **not needed.** `/study`'s charts cap their SVGs with an inline `maxWidth`, not `max-w-xl`, so the width guard does not see them and the exclusion list does not grow. Checked against all six charts.
- "The `<button>` guard is per-file, not per-element" → D27 and Task 14 Step 2, which is the one place this phase deliberately grows an exclusion rather than fixing sites, and pairs it with a **per-element** ring guard that is strictly stronger.
- The comment's eight hover sites → Tasks 2 and 3. Seven are `className` sites the shipped guard can see; the eighth is in a `<style>` block and it cannot, which Task 2's separate case and M11 exist to cover.

**Spec deltas.** 01 (mono layer, serif scale) → Tasks 2-9, 13. 02 (near-square corners) → Task 10, which exists **because the spec's claim that `/study` "need[s] no sweep" is wrong** — true of classes, false of the 40 inline literals. 03 (buttons) → Task 11 and D27. 04 (rules carry structure) → **not attempted**, and this is the one delta the phase does not deliver; see below. 05 (paired axis scale) → Task 9. 06 (dark mode inverts) → Tasks 4, 6, 9, 13, everywhere `var(--stone-600)` and the four frozen hexes become stepping tokens.

**The gap, stated plainly rather than buried.** **Delta 04 — "rules carry structure; cards stop floating" — is not in this plan.** It is the one delta of six that asks for bespoke *layout* work, and D6 defers bespoke layout on undrawn screens; `/study` is undrawn, with 32 components whose card and panel structure the handoff never drew. Doing it would mean designing four pages, which is a different kind of work from applying a system and wants its own design input before its own plan. What this phase does deliver is everything that follows from the token layer, which is what D6 says to do now. If a reader of this document is looking for why `/study`'s panels still float: that is why, it was a decision, and it is the obvious candidate for a phase 5c.

**Placeholder scan.** No TBDs. Four steps deliberately instruct the implementer to read a value out of the code rather than restating it — `getDomainMarkVar`'s exact variable names, `axes.ts`'s pole field names, `StyledGeography`'s `className` forwarding, and `scoreToRadius` against the local `((score + 1) / 2) * r` — and each says which source wins. Phase 5's self-review found that promoting such an instruction to a literal is what shipped its one defect, so these stayed as instructions. Three steps predict a number (the radius census, the `outline: "none"` count before and after) and each says explicitly that the file wins and the real number gets written back in Task 15 Step 4.

**Type consistency.** `PageHeader`'s props (`kicker`, `kickerHref?`, `title`, `lead?: string[]`) are used under those names in Task 2 and match the shipped component. `SectionNavProps.sections` entries are `{ num, label, short, id }` in both Task 3 call sites, and `short` is required — the model-agreement nav had no short labels, so Task 3 supplies six. `PairedAxisScaleProps.markVar?: string` takes the **wrapped** `var(--x)` form in its definition (Task 9 Step 3), its two tests (Step 1) and all five call sites (Step 4); this was wrong in the first draft, where the prop took a bare name while `getDomainMarkVar` returned a wrapped one, and a caller following Task 4's original wording would have emitted `var(var(--domain-economic))` — valid syntax, resolves to nothing, renders a transparent mark, and no test in this plan would have caught it. The dot and track selectors (`[data-respondent="a"]`, `[data-track]`) are the shipped ones, verified against the component rather than invented for the test.

**Known gap, inherited and widened.** As in phases 4 and 5: no unit test covers the *rendered* dark-mode appearance of anything here, because jsdom computes no custom properties. The tokens are asserted on both sides in the stylesheet and the call sites are asserted to name a stepping token rather than a frozen one, but the composition of the two is verified only by hand, in Task 15 Step 2. This phase widens the gap because it moves ~250 sites onto tokens at once. Step 2 is the coverage, and it is why it is written as a checklist rather than as "check it looks right."
