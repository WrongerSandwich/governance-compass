# Design System Delta — Results Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the results page in both colour schemes on the Phase 1 token layer, converge every score bar in the codebase onto `PairedAxisScale`, and give the data marks the dark-mode step (domain 600 → domain 400) that no token currently expresses.

**Architecture:** Mostly restyle, with one real structural change and one deletion. `ScoreBar.tsx` is deleted and its three call sites move to `PairedAxisScale`; `ComparisonScoreBar` becomes row chrome around the same primitive. The enabling change is a set of mode-stepping `--domain-*` custom properties, because `DOMAIN_COLORS[key][600]` is a fixed hex and cannot invert. `RadarChart` loses its per-domain stroke segmentation and triangle fills in favour of one Stone 600 polygon plus twelve domain dots; `CompassPlot` adopts the mock's chrome while keeping the contour lines, archetype markers and coordinate readout the mock's static prototype could not draw.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4.3.3, Vitest 4 (jsdom via docblock, `vmForks` pool), Playwright.

**Spec:** `docs/superpowers/specs/2026-09-08-design-system-delta-design.md`
**Issue:** #135 · **Reference:** `docs/gov_compass_redesign.zip` → `Page mocks.dc.html`, options **7a** (light) and **7b** (dark), plus `README.md` §3.

---

## Global Constraints

Phases 1 (#132, PR #140), 2 (#133, PR #143) and 3 (#134, PR #145) landed the token layer, the `Button` primitive, `PairedAxisScale`, and the page idiom. Use them rather than re-spelling values.

- **`text-text-label`, never `text-text-tertiary`, for the mono label layer.** Stone 500 measures 2.73:1 on the light page ground and fails WCAG AA; `--text-label` steps Stone 700 / Stone 500 by mode. Spec decision D7. The `src/components/results/` sweep happens here — Task 11 pins that nothing in that directory keeps `text-text-tertiary`.
- **`--text-label` and `--text-secondary` are the SAME colour in light mode.** Both resolve to `#6e5a48`; they diverge only in dark. Swapping one for the other is invisible in light mode, and therefore invisible to mutation testing. Never use `text-text-label` to express *de-emphasis* against `text-text-secondary` — it expresses nothing. `text-text-label` is for the mono label layer only.
- **`className` does NOT override variant classes on `Button`/`ButtonLink`.** Appending does not win; Tailwind's emitted order does, and the variant utilities land later in the sheet. `className` is only for properties no variant sets — margin, width, position. Never pass `px-*`, `text-*`, or `block`.
- **Typography roles** (`display-page`, `display-l`, `display-m`, `display-s`, `body-lead`, `body-s` (new, Task 1), `label`, `label-eyebrow`, `label-nav`, `label-tight`, `control`, `caption-italic`) are single self-contained classes. Do not layer a built-in utility over one to vary a property the role already sets. Layering a property the role does **not** set is safe — `label` declares no `font-weight`, so `label font-medium` is fine; `caption-italic` declares `color`, so a colour class beside it is banned and guarded.
- **`rounded-sharp`** for corners. A guardrail bans `rounded-[8px]`/`[12px]`/`lg`/`xl` and the inline `borderRadius: 8` forms. SVG `rx` values in this phase drop to `2`.
- **`focus-ring`** for every interactive element. Never hand-roll `outline-none` + `outline-2`; a source guardrail fails on all three broken spellings.
- **No new colour values.** Every token added in Task 1 is an alias onto an existing ramp entry. No Tailwind `dark:` variants — dark mode is `prefers-color-scheme` overriding `:root` custom properties. Watch for the inverse: a hard-coded ramp value like `text-stone-800` reads as near-black on a dark ground.
- **A fixed hex cannot invert.** `getDomainColor600()` returns `#6b7d8a` in both modes. Every data mark on this page — dots, domain rules, domain labels, radar vertices — must route through `getDomainMarkVar()` (Task 1) instead. `DOMAIN_COLORS[key][400]` stays a literal where the value is genuinely the same in both modes (the paired scale's track), and `DOMAIN_COLORS[key].name` is unaffected.
- **`--mark-primary` and `--domain-economic` are value-identical in BOTH modes** (Stone 600 light, Stone 400 dark), because the Economic domain *is* the Stone accent. A mutation swapping one for the other renders identically and no rendered assertion can catch it. Task 11 guards this with a **source** assertion instead: the radar polygons must name `--mark-primary`, never `--domain-economic`. This is the hazard that already shipped a real defect once in this migration.
- The codebase's single responsive breakpoint is `min-[560px]`.
- Vitest collects only `tests/**/*.test.ts` and `scripts/__tests__/**/*.test.ts`, never `.tsx`. Component tests use `createElement` with a `@vitest-environment jsdom` docblock.
- **`vmForks` shares a module registry per worker.** Any spec that calls `vi.mock` must `vi.resetModules()` and dynamically `import()` the component under test. A spec that mocks at module scope and imports statically passes alone and fails in a full run.
- **Pin a value when, if it were wrong, nothing else would fail and the wrongness would be silent.** Pin: a fixed ramp value where an inverting token belongs, a structural coupling, and any value that *replaced* a different value. Skip: anything a repo-wide guardrail already covers, and anything whose wrongness is loud enough that opening the page catches it. Pair every positive assertion with the negative of the value it replaced — that negative carries the information.
- **Assert class tokens, never substrings.** `expect(el.className).toContain("label")` also passes on `label-nav`, and `toContain("border-l-2")` passes on nothing useful. Split on whitespace, or use `element.classList`, and assert with `toContain` on the resulting array.
- Lint runs at `--max-warnings=0`.

**Baseline:** `main` at `70a417c`, **676 unit tests across 60 files**, all gates green.

**Branch:** `feat/design-delta-results` off `main`.

---

## File Structure

| File | Change | Responsibility after this phase |
| --- | --- | --- |
| `src/app/globals.css` | Modify | Adds the four `--domain-*` marks, `--mark-primary`, `--container-results`, and the `body-s` role. |
| `src/lib/design-tokens.ts` | Modify | Adds `DOMAIN_MARK_VARS` and `getDomainMarkVar()` beside the existing fixed-hex accessors. |
| `src/components/PairedAxisScale.tsx` | Modify | Gains a real accessible description, respondent naming, and a mode-stepping dot. The only score-bar primitive in the repo. |
| `src/components/results/ScoreBar.tsx` | **Delete** | — |
| `src/components/results/AxisBreakdownCard.tsx` | Modify | Mock 7a's `24px 1fr 210px` axis row. No zebra, no card radius. |
| `src/components/results/ArchetypeCard.tsx` | Modify | Mock 7a's `1fr 220px` panel, including the action row it now hosts. |
| `src/components/results/RadarChart.tsx` | Modify | Mock 7a's twelve-spoke radar: one polygon, twelve domain dots. |
| `src/components/results/CompassPlot.tsx` | Modify | Mock 7a's 300px square, keeping contours, archetype markers and the readout. |
| `src/components/results/ResultsView.tsx` | Modify | Page shell, header, jump nav, section chrome, tension panels, domain groups. |
| `src/components/comparison/ComparisonScoreBar.tsx` | Modify | Row chrome around `PairedAxisScale`; tooltips become readouts. |
| `src/components/groups/GroupScoreBar.tsx` | Modify | Member dots plus a `PairedAxisScale` for the average. Gains `axisId`. |
| `src/app/groups/[groupId]/page.tsx` | Modify (1 line) | Passes `axisId` through. |
| `src/app/results/[profileId]/[axisId]/page.tsx` | Modify | Third former `ScoreBar` call site. |
| `src/app/page.tsx` | Modify (1 prop) | Passes `axisName` instead of a hand-built `label`. |
| `src/components/quiz/*.tsx` | Modify (sweep) | Nine `text-[13.5px] leading-[1.6]` sites collapse onto `body-s`; the budget track adopts the canonical mark. |
| `tests/unit/results-chrome.test.ts` | **Create** | Every rendered assertion and results-directory guardrail for this phase. |
| `tests/unit/design-system-tokens.test.ts` | Modify | Stylesheet assertions for the new tokens and the `body-s` role. |
| `tests/unit/paired-axis-scale.test.ts` | Modify | Covers the description, the respondent labels, and the stepping dot. |
| `tests/unit/quiz-chrome.test.ts` | Modify | The `text-[13.5px]`/`leading-[1.6]` pairing guard retires into a `body-s` guard. |
| `tests/unit/results-dead-code.test.ts` | Modify | Pins `ScoreBar.tsx` as deleted. |

`FadeInSection.tsx`, `QuizProvider.tsx`, `ComparisonRadar.tsx` and everything under `src/components/study/` are untouched. `tests/unit/quiz-interactions.test.ts`, `tests/unit/budget-simulator-stepper.test.ts`, `tests/unit/home-page.test.ts` and all Playwright specs must stay green unmodified.

---

## Decisions

**D8 — The data marks need tokens the Stone ramp cannot provide.** Delta 06 says dots, tracks and domain labels step from domain 600 to domain 400 on dark surfaces. `DOMAIN_COLORS` is a TypeScript object of fixed hexes read at render time, so no call site can express that. Four new custom properties (`--domain-economic`, `--domain-power`, `--domain-society`, `--domain-world`) alias the existing `--slate-*`/`--sage-*`/`--clay-*`/`--stone-*` entries and step by mode. **No new colour value is introduced** — the dark values are the 400-level tones already declared in `:root`. `getDomainColor600()` survives for the static contexts that keep the 600 tone in both modes (`/axes`, `/questions`, `ComparisonRadar`, the home domain footer); those are D6-deferred screens and are *not* swept here.

**D9 — `ScoreBar` is deleted rather than restyled.** The issue's first scope bullet is the point of building `PairedAxisScale`. `ScoreBar` has three call sites (`AxisBreakdownCard`, `GroupScoreBar`, the per-axis detail page) and its distinguishing features — a centre-out fill and a score readout floating above the marker — are both things mock 7a removes. Restyling it would leave two primitives drawing the same thing.

**D10 — `ComparisonScoreBar` converges, and its hover tooltips become readouts.** The tooltips were mouse-only: no keyboard path, no screen-reader path, and they duplicated information mock 7a puts permanently on the axis-name line. Replacing them with two always-visible mono readouts is strictly more accessible and removes `useState` from the component. `/compare`'s bespoke layout stays deferred to phase 5; only the bar converges. The `delta <= 0.3 / 0.7 / 1.2` bucket thresholds move into `PairedAxisScale` as `describeGap()` so the accessible description and the visible label cannot drift apart.

**D11 — `CompassPlot` takes the mock's chrome and keeps its data.** Mock 7a draws a 300px square with a 50px grid, 1px axes, a 12px ink dot and four mono pole labels. It has no contour lines, no archetype markers and no coordinate readout — but `CLAUDE.md` names the contour lines as the design system's one protected decorative exception, and the twelve archetype markers are the only thing that tells a respondent *where they sit relative to the archetypes*. Both stay. Dropped, as decoration the mock is right to cut: the four quadrant tint rects, the dashed moderate-zone rect, the four whisper quadrant labels, and the two pulse rings.

**D12 — The compass keeps its own axis orientation.** Mock 7a labels the vertical axis `Open` (top) / `Traditional` (bottom). The shipped plot labels it `TRADITIONAL` (top) / `PROGRESSIVE` (bottom), and `toY()` maps cultural `+1` to the top. Adopting the mock's labels would invert the meaning of every plotted point without touching the scoring engine. The mock is a static prototype with fabricated coordinates; it is not authoritative over `SD_CULTURAL_WEIGHTS`. **Keep `Collective`/`Market` and `Traditional`/`Progressive`, in the existing positions**, and adopt only the mono treatment.

**D13 — The archetype action row moves into `ArchetypeCard`, but its behaviour does not move with it.** Mock 7a puts `Copy link`, `Compare with someone` and `Learn more` inside the panel's left column; today `ResultsView` renders the first two *below* the card. `CopyLinkButton` and `CompareInput` stay in `ResultsView` — they own the `encoded` prop, the router and the copy timer — and are passed down through a new `actions?: ReactNode` slot. `Learn more` is the existing expand toggle restyled as a tertiary button, so per-card expansion is unchanged. The `Read in the archetype reference →` link moves into the expanded block, beside the full description it continues.

**D14 — `body-s` is minted here.** `text-[13.5px] leading-[1.6]` is the delta's most-used sans size and its only unnamed one, at nine call sites across five quiz files, with the results page about to add more. Phase 3's guard on the pairing is vacuous where the size is deleted outright (measured: three of nine sites redden). A named role makes the presence guardable and the drift impossible. Phase 6 (#137) documents it in the design spec.

**D15 — The budget track adopts the canonical data mark.** `BudgetSimulator`'s allocation fill is `var(--stone-600)` at `opacity: 0.5`, which measures ~1.69:1 against its track and is, at 50% opacity, no longer Stone 600. This phase settles what a data mark is, so the fill becomes `var(--mark-primary)` at full opacity. Phase 3 already added the `data-budget-track` hook that makes it testable.

---

### Task 1: Mode-stepping data-mark tokens, `body-s`, and the results container

**Files:**
- Modify: `src/app/globals.css` — the light `:root` block, the `prefers-color-scheme: dark` block, `@theme inline`, and the typography `@utility` run
- Modify: `src/lib/design-tokens.ts` — append after `getDomainColor600`
- Modify: `tests/unit/design-system-tokens.test.ts` — append two `describe` blocks

**Interfaces:**
- Produces: `--domain-economic|power|society|world`, `--mark-primary`, `--container-results`, the `body-s` utility, `DOMAIN_MARK_VARS`, `getDomainMarkVar(axisId)`.
- Consumed by: every task from 2 onward.

**Why this is first.** Nothing else in the phase can be dark-mode correct without it, and the issue calls the dark pass "where this phase earns its keep". `DOMAIN_COLORS[key][600]` is a fixed hex read at render time; there is no call-site spelling that inverts.

- [x] **Step 1: Write the failing stylesheet guardrails**

The file already parses `globals.css` into `light`, `dark` and `utilities`. Append these two blocks at the end of `tests/unit/design-system-tokens.test.ts`:

```ts
describe("data marks step by mode (design delta 06)", () => {
  it("steps every domain mark from its 600 tone to its 400 tone in dark", () => {
    // Domain 600 goes muddy on dark surfaces. DOMAIN_COLORS is a fixed-hex
    // TypeScript object read at render time, so no call site can express this
    // — it has to be a custom property. Asserted as an exhaustive pair map
    // rather than four loose assertions, so adding a fifth domain without a
    // dark step fails here rather than shipping a muddy mark.
    expect({
      economic: light["--domain-economic"],
      power: light["--domain-power"],
      society: light["--domain-society"],
      world: light["--domain-world"],
    }).toEqual({
      economic: "var(--stone-600)",
      power: "var(--slate-600)",
      society: "var(--sage-600)",
      world: "var(--clay-600)",
    });
    expect({
      economic: dark["--domain-economic"],
      power: dark["--domain-power"],
      society: dark["--domain-society"],
      world: dark["--domain-world"],
    }).toEqual({
      economic: "var(--stone-400)",
      power: "var(--slate-400)",
      society: "var(--sage-400)",
      world: "var(--clay-400)",
    });
  });

  it("steps the unified mark alongside the domains", () => {
    // The radar polygons and the mini radar's user shape are one Stone mark,
    // not a domain one, and they step on the same schedule.
    expect(light["--mark-primary"]).toBe("var(--stone-600)");
    expect(dark["--mark-primary"]).toBe("var(--stone-400)");
  });

  it("exports the marks so Tailwind compiles their colour utilities", () => {
    // The setup for the bug this project has shipped three times: a token
    // declared with a dark inversion but never exposed, so a call site reaches
    // for a ramp literal because the inverting token appears not to exist.
    for (const name of ["economic", "power", "society", "world"]) {
      expect(theme[`--color-domain-${name}`]).toBe(`var(--domain-${name})`);
    }
    expect(theme["--color-mark-primary"]).toBe("var(--mark-primary)");
  });

  it("caps the results column at the mock's 820px", () => {
    expect(theme["--container-results"]).toBe("820px");
  });
});

describe("body-s (design delta 01)", () => {
  it("names the delta's most-used sans size so the pair cannot drift", () => {
    // Nine call sites carried `text-[13.5px] leading-[1.6]` by convention
    // alone, and phase 3's guard on the pairing passes vacuously where the
    // size is deleted outright — measured, deleting the pair at each of the
    // nine sites reddened the suite at only three.
    const utility = utilities.find((entry) => entry.name === "body-s");

    expect(utility, "body-s utility is missing").toBeDefined();
    expect(utility!.body).toMatch(/font-size:\s*13\.5px/);
    expect(utility!.body).toMatch(/line-height:\s*1\.6/);
    expect(utility!.body).toMatch(/font-family:\s*var\(--font-sans\)/);
    // Distinct from caption-italic, which is 13.5px SERIF italic and declares
    // its own colour. body-s declares no colour: it is layered with a
    // text-* class at every call site.
    expect(utility!.body).not.toMatch(/color:/);
    expect(utility!.body).not.toMatch(/font-style:/);
  });
});
```

If `theme` is not already a parsed record of the `@theme inline` block in this file, add it beside the existing `light`/`dark` parsers using the same `decls(block(globalsCss, "@theme inline"))` shape those use.

- [x] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/design-system-tokens.test.ts`
Expected: FAIL — five new tests, reporting `undefined` for each token and `body-s utility is missing`.

- [x] **Step 3: Add the tokens to `globals.css`**

In the light `:root` block, immediately **before** the `/* --- Contextual (light mode) --- */` comment:

```css
  /* --- Data marks (design delta 06) ---
     Dots, tracks, domain rules and domain labels. Domain 600 goes muddy on a
     dark ground, so each mark steps to its 400 tone below. This cannot be
     spelled from DOMAIN_COLORS at the call site: that object holds fixed
     hexes read at render time, and a fixed hex cannot invert. No new colour
     value — every entry aliases a ramp token already declared above. */
  --domain-economic: var(--stone-600);
  --domain-power:    var(--slate-600);
  --domain-society:  var(--sage-600);
  --domain-world:    var(--clay-600);

  /* The unified data mark: the radar's single polygon, the mini radar's user
     shape, and the budget allocation fill. Value-identical to
     --domain-economic in BOTH modes, because the Economic domain is the Stone
     accent — so a swap between the two is undetectable by rendering. Guarded
     by source assertion in tests/unit/results-chrome.test.ts instead. */
  --mark-primary: var(--stone-600);
```

In the `@media (prefers-color-scheme: dark)` block, immediately **before** `--contour-opacity: 0.05;`:

```css
    /* Design delta 06: the marks step to their 400 tones. */
    --domain-economic: var(--stone-400);
    --domain-power:    var(--slate-400);
    --domain-society:  var(--sage-400);
    --domain-world:    var(--clay-400);
    --mark-primary:    var(--stone-400);
```

In `@theme inline`, immediately **after** the `--color-button-primary-fg` line:

```css
  --color-domain-economic: var(--domain-economic);
  --color-domain-power:    var(--domain-power);
  --color-domain-society:  var(--domain-society);
  --color-domain-world:    var(--domain-world);
  --color-mark-primary:    var(--mark-primary);
```

And immediately **after** the `--container-shell: 1040px;` declaration and its comment:

```css
  /* Results column width, from mock 7a. Narrower than the chrome shell above,
     which NavBar and Footer keep. */
  --container-results: 820px;
```

- [x] **Step 4: Add the `body-s` role**

In `globals.css`, immediately **after** the `body-lead` utility:

```css
/* The delta's workhorse prose size, at 13.5px/1.6. Named here rather than
   carried as `text-[13.5px] leading-[1.6]` because that pair travelled by
   convention across nine call sites and its guard could only catch drift
   WITHIN the pair, never a deleted size. Sans, and declaring no colour — it
   is layered with a text-* class everywhere. Its serif italic counterpart at
   the same size is `caption-italic`, which is a different role, not a
   variant. */
@utility body-s {
  font-family: var(--font-sans);
  font-size: 13.5px;
  line-height: 1.6;
}
```

- [x] **Step 5: Add the accessor to `design-tokens.ts`**

Append to `src/lib/design-tokens.ts`:

```ts
/**
 * Domain marks as CSS custom-property references, for inline styles and SVG
 * fills.
 *
 * `getDomainColor600` returns a fixed hex, which is correct for the static
 * reference pages but wrong for anything the respondent's own data draws:
 * design delta 06 steps every mark to its 400 tone on a dark ground, and a
 * hex cannot invert. Use this for dots, tracks, domain rules and domain
 * labels; use `getDomainColor600` only where the 600 tone is genuinely
 * intended in both modes.
 */
export const DOMAIN_MARK_VARS: Record<DomainKey, string> = {
  economic: 'var(--domain-economic)',
  power: 'var(--domain-power)',
  society: 'var(--domain-society)',
  world: 'var(--domain-world)',
};

export function getDomainMarkVar(axisId: number): string {
  return DOMAIN_MARK_VARS[getDomainForAxis(axisId)];
}
```

- [x] **Step 6: Cover the accessor**

Append to `tests/unit/design-system-tokens.test.ts`, inside the `data marks step by mode` describe:

```ts
  it("maps each axis to its domain's mark variable", () => {
    // Axis 1-2 economic, 3-6 power, 7-9 society, 10-12 world. Asserted across
    // all twelve rather than one per domain, because an off-by-one in
    // AXIS_TO_DOMAIN would put a Slate dot on an Economic row and nothing
    // else would fail.
    expect(Array.from({ length: 12 }, (_, i) => getDomainMarkVar(i + 1))).toEqual([
      "var(--domain-economic)", "var(--domain-economic)",
      "var(--domain-power)", "var(--domain-power)", "var(--domain-power)", "var(--domain-power)",
      "var(--domain-society)", "var(--domain-society)", "var(--domain-society)",
      "var(--domain-world)", "var(--domain-world)", "var(--domain-world)",
    ]);
  });
```

Add `getDomainMarkVar` to the file's imports from `@/lib/design-tokens`.

- [x] **Step 7: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/design-system-tokens.test.ts`
Expected: PASS, six new tests.

- [x] **Step 8: Commit**

```bash
git add src/app/globals.css src/lib/design-tokens.ts tests/unit/design-system-tokens.test.ts
git commit -m "feat(design): add mode-stepping data-mark tokens, body-s, and the results container"
```

---

### Task 2: Sweep the quiz's two carried-over items

**Files:**
- Modify: `src/components/quiz/ForcedChoiceCard.tsx` (1 site), `ScaledQuestionCard.tsx` (1), `PhaseTransition.tsx` (2), `QuizFlow.tsx` (4), `ComputingMessages.tsx` (1)
- Modify: `src/components/quiz/BudgetSimulator.tsx` — the allocation fill
- Modify: `tests/unit/quiz-chrome.test.ts` — the pairing guard and two source pins

**Interfaces:**
- Consumes: `body-s` and `--mark-primary` from Task 1.
- Produces: nothing new. This closes both items phase 3 deliberately deferred to phase 4 (issue #135, comment 2).

**Why this is second.** Both items were deferred *to this phase* by name, and doing them before the results page grows new `text-[13.5px]` call sites is the whole point — otherwise the results page adds to a convention nobody can enforce. It also keeps the quiz diff out of the results-page tasks that follow.

- [x] **Step 1: Replace the pairing guard with a presence guard**

In `tests/unit/quiz-chrome.test.ts`, replace the whole `it("keeps the delta's prose size and its line-height together", ...)` test with:

```ts
  it("routes the delta's prose size through body-s, not an arbitrary pair", () => {
    // `text-[13.5px] leading-[1.6]` was this directory's most-repeated literal
    // — nine occurrences across five files — and the only size in the delta
    // with no named role, so the pair travelled by convention alone.
    //
    // The guard it replaces could only catch drift WITHIN the pair: it
    // inspected the matches it found, so deleting the size outright passed
    // vacuously. Measured, deleting the pair at each of the nine call sites in
    // turn reddened the suite at only three. `body-s` makes the size a single
    // token, so a deletion is a deletion and this assertion sees it.
    const offenders = quizSources
      .filter(({ text }) => /text-\[13\.5px\]|leading-\[1\.6\]/.test(text))
      .map(({ name }) => name);

    expect(offenders).toEqual([]);
    // And the positive: the role is actually in use, so the test above cannot
    // pass by the class having been dropped everywhere.
    expect(quizSources.filter(({ text }) => text.includes("body-s"))).toHaveLength(5);
  });
```

- [x] **Step 2: Update the two source pins that spell the old literal**

Still in `tests/unit/quiz-chrome.test.ts`, inside `it("pins the replaced values on screens nothing mounts", ...)`:

```ts
    // Renders only when encodeResponses throws. No test, no sweep, no human.
    expect(quizFlow).toMatch(/rounded-sharp border-l-2 border-warning bg-warning-bg/);
```

stays as-is, and the `computing` assertion becomes:

```ts
    // 12px sans tertiary -> body-s secondary, on screen for 1800ms before the
    // redirect fires. The class named here is the replacement, so the negative
    // below is what carries the information.
    expect(computing).toMatch(/body-s text-text-secondary/);
    expect(computing).not.toMatch(/text-\[13\.5px\]/);
```

Then add a guard for the budget track, in the same `describe("quiz chrome drift guards")`:

```ts
  it("draws the budget allocation fill as a real data mark", () => {
    // Phase 3 left this as var(--stone-600) at opacity 0.5, which measures
    // ~1.69:1 against its own track and is, at half opacity, no longer Stone
    // 600 — while the brief reserves Stone 600 *for* data marks. Phase 4
    // settles what a data mark is, so the fill takes the token at full
    // opacity. The negative is the load-bearing half: the old spelling still
    // looks correct to a reviewer.
    const budget = quizSources.find((s) => s.name === "BudgetSimulator.tsx")!.text;

    expect(budget).toMatch(/var\(--mark-primary\)/);
    expect(budget).not.toMatch(/opacity:\s*0?\.5/);
  });
```

- [x] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/quiz-chrome.test.ts`
Expected: FAIL — the presence guard lists all five files, and the budget guard reports no `--mark-primary`.

- [x] **Step 4: Sweep the nine call sites**

In each of the five files, replace `text-[13.5px] leading-[1.6]` with `body-s`, leaving every other class in the string untouched and in place. The nine strings become:

| File | Before | After |
| --- | --- | --- |
| `ForcedChoiceCard.tsx` | `text-[13.5px] leading-[1.6] text-text-secondary` | `body-s text-text-secondary` |
| `ScaledQuestionCard.tsx` | `text-[13.5px] leading-[1.6] text-text-secondary` | `body-s text-text-secondary` |
| `PhaseTransition.tsx` | `text-[13.5px] leading-[1.6] text-text-secondary mb-6` | `body-s text-text-secondary mb-6` |
| `PhaseTransition.tsx` | `text-[13.5px] leading-[1.6] text-text-secondary mb-4` | `body-s text-text-secondary mb-4` |
| `QuizFlow.tsx` ×2 | `text-[13.5px] leading-[1.6] text-text-secondary mb-8` | `body-s text-text-secondary mb-8` |
| `QuizFlow.tsx` | `text-[13.5px] leading-[1.6] text-text-secondary mb-4` | `body-s text-text-secondary mb-4` |
| `QuizFlow.tsx` | `mb-4 rounded-sharp border-l-2 border-warning bg-warning-bg px-4 py-3 text-[13.5px] leading-[1.6] text-warning-text` | `mb-4 rounded-sharp border-l-2 border-warning bg-warning-bg px-4 py-3 body-s text-warning-text` |
| `ComputingMessages.tsx` | `text-[13.5px] leading-[1.6] text-text-secondary transition-opacity duration-200` | `body-s text-text-secondary transition-opacity duration-200` |

Verify the count before and after:

```bash
grep -rc "body-s" src/components/quiz/ | grep -v ":0"
grep -rn "text-\[13.5px\]\|leading-\[1.6\]" src/components/quiz/ || echo "clean"
```

Expected: five files listed (`QuizFlow.tsx:4`, `PhaseTransition.tsx:2`, and 1 each for the other three), then `clean`.

- [x] **Step 5: Retire the budget track's half-opacity Stone**

In `src/components/quiz/BudgetSimulator.tsx`, find the allocation fill inside the element carrying `data-budget-track` and replace its inline style:

```tsx
              style={{ backgroundColor: "var(--mark-primary)" }}
```

Delete the `opacity: 0.5` entry from that same style object. Leave the track element (`--border-secondary`) and both `rounded-sharp` corners alone.

- [x] **Step 6: Run the quiz suites to verify they pass**

Run: `npx vitest run tests/unit/quiz-chrome.test.ts tests/unit/quiz-interactions.test.ts tests/unit/budget-simulator-stepper.test.ts`
Expected: PASS, all three files. `quiz-interactions` and `budget-simulator-stepper` are behaviour suites and must be green **unmodified** — if either reddens, the sweep touched behaviour and must be narrowed.

- [x] **Step 7: Commit**

```bash
git add src/components/quiz tests/unit/quiz-chrome.test.ts
git commit -m "refactor(design): sweep the quiz onto body-s and the canonical data mark"
```

---

### Task 3: `PairedAxisScale` — a real description, respondent names, a stepping dot

**Files:**
- Modify: `src/components/PairedAxisScale.tsx`
- Modify: `src/app/page.tsx` — the single `PairedAxisScale` call site (around line 130)
- Modify: `tests/unit/paired-axis-scale.test.ts`

**Interfaces:**
- Produces: `describeGap(gap)`, `describePosition(score, poleA, poleB)`, `describeScale(...)`, and the `axisName` / `respondentALabel` / `respondentBLabel` props.
- Consumed by: Tasks 4, 5 and 6, which make this the only score bar in the repo.

**Why now.** `role="img"` makes the whole subtree presentational, so the visible endpoint text is removed from the accessibility tree and replaced wholesale by the `aria-label`. Today that label names only the axis and its poles, so **everything the component exists to communicate — where each respondent sits, and whether they agree — reaches a screen-reader user through two `aria-hidden` dots and nothing else.** That was tolerable on the home page, where surrounding copy carries the meaning. It stops being tolerable the moment this primitive renders a respondent's own twelve axes, which is Task 6. Raised independently by phase 2's implementer, its spec reviewer, and the phase 4 planning note (issue #135, comment 1).

- [x] **Step 1: Write the failing tests**

In `tests/unit/paired-axis-scale.test.ts`, replace the existing test titled `"describes the scale for assistive tech rather than leaving bare dots"` — its name overstates what it verifies, since it confirms the poles are *named*, not that the scale is *described* — with:

```ts
  it("states each respondent's position and their relationship, not just the poles", () => {
    const container = render(
      createElement(PairedAxisScale, {
        ...base,
        axisName: "Governance Structure",
        scoreA: -0.5,
        scoreB: -0.9,
      }),
    );
    const label = container.querySelector("[role='img']")!.getAttribute("aria-label")!;

    // The old label was "Distributed to Centralized" — an axis inventory the
    // domain footer already gives in cleaner form, twelve times over. Both
    // dots are aria-hidden, so this string is the ONLY path to the data.
    expect(label).toContain("Governance Structure");
    expect(label).toContain("Respondent A moderately toward Distributed");
    expect(label).toContain("Respondent B strongly toward Distributed");
    expect(label).toContain("some distance");
  });

  it("names the respondents as the caller does", () => {
    const container = render(
      createElement(PairedAxisScale, {
        ...base,
        axisName: "Governance Structure",
        scoreB: 0.9,
        respondentALabel: "You",
        respondentBLabel: "Them",
      }),
    );
    const label = container.querySelector("[role='img']")!.getAttribute("aria-label")!;

    expect(label).toContain("You moderately toward Distributed");
    expect(label).toContain("Them strongly toward Centralized");
    expect(label).toContain("far apart");
    expect(label).not.toContain("Respondent");
  });

  it("describes the single-respondent variant without inventing a relationship", () => {
    const container = render(
      createElement(PairedAxisScale, { ...base, axisName: "Governance Structure" }),
    );
    const label = container.querySelector("[role='img']")!.getAttribute("aria-label")!;

    expect(label).toBe("Governance Structure: moderately toward Distributed");
    // No second respondent, so no gap phrase to append.
    expect(label).not.toContain(";");
  });

  it("keeps the label prop as the escape hatch", () => {
    const container = render(
      createElement(PairedAxisScale, { ...base, axisName: "Ignored", label: "Custom" }),
    );

    expect(container.querySelector("[role='img']")!.getAttribute("aria-label")).toBe("Custom");
  });

  it("steps respondent A's dot to its domain mark rather than a fixed hex", () => {
    // Domain 600 goes muddy on a dark ground (delta 06). A hex read from
    // DOMAIN_COLORS cannot invert, so this must be the custom property — and
    // in LIGHT mode the two render identically, which is exactly why the
    // assertion is on the declaration rather than the computed colour.
    const container = render(createElement(PairedAxisScale, base));
    const dotA = container.querySelector("[data-respondent='a']") as HTMLElement;

    expect(dotA.style.backgroundColor).toBe("var(--domain-power)");
  });
```

And append a describe for the two exported bucket helpers:

```ts
describe("describePosition", () => {
  it("buckets magnitude into four phrases, with the midpoint naming no pole", () => {
    expect(describePosition(0.05, "Liberty", "Security")).toBe("near the midpoint");
    expect(describePosition(0.3, "Liberty", "Security")).toBe("slightly toward Security");
    expect(describePosition(-0.6, "Liberty", "Security")).toBe("moderately toward Liberty");
    expect(describePosition(0.95, "Liberty", "Security")).toBe("strongly toward Security");
  });

  it("puts each boundary in the bucket above it", () => {
    // Stated explicitly because an off-by-one here is silent: the phrase is
    // still grammatical and still names the right pole.
    expect(describePosition(0.15, "A", "B")).toBe("slightly toward B");
    expect(describePosition(0.45, "A", "B")).toBe("moderately toward B");
    expect(describePosition(0.75, "A", "B")).toBe("strongly toward B");
  });
});

describe("describeGap", () => {
  it("keeps ComparisonScoreBar's shipped thresholds", () => {
    // These four buckets were ComparisonScoreBar's `deltaLabel`. They move
    // here so the visible label and the accessible description are the same
    // computation and cannot drift apart.
    expect(describeGap(0.2)).toBe("close agreement");
    expect(describeGap(0.5)).toBe("some distance");
    expect(describeGap(1.0)).toBe("significant gap");
    expect(describeGap(1.5)).toBe("far apart");
  });

  it("takes an unsigned gap and is symmetric in its arguments", () => {
    expect(describeGap(Math.abs(-0.5 - 0.9))).toBe(describeGap(Math.abs(0.9 - -0.5)));
  });
});
```

Add `describeGap, describePosition` to the file's import from `@/components/PairedAxisScale`.

- [x] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/paired-axis-scale.test.ts`
Expected: FAIL — `describePosition is not a function`, plus the label and dot assertions.

- [x] **Step 3: Implement**

Replace `src/components/PairedAxisScale.tsx` in full:

```tsx
import { DOMAIN_COLORS, getDomainForAxis, getDomainMarkVar } from "@/lib/design-tokens";

/**
 * One axis rendered as a scale, for one or two respondents (design delta 05).
 *
 * Renders only the scale — endpoints, track, midline, dots. Callers own the
 * surrounding row, because the home page, the results breakdown, the
 * comparison view and the group view wrap it in different grids.
 */
export interface PairedAxisScaleProps {
  /** 1-12; selects the domain colour. */
  axisId: number;
  poleALabel: string;
  poleBLabel: string;
  scoreA: number;
  /** Omit for the single-respondent variant. */
  scoreB?: number;
  /** Endpoints sit above the track on desktop, below it when stacked. */
  endpoints?: "above" | "below";
  /** Names the axis in the generated description. Pass this, not `label`. */
  axisName?: string;
  respondentALabel?: string;
  respondentBLabel?: string;
  /** Escape hatch: replaces the generated description outright. */
  label?: string;
}

/**
 * Maps a -1..1 score to a percentage across the track.
 *
 * The range is 6%..94% rather than 0%..100% so a dot at a pole still sits
 * fully on the track instead of clipping its end.
 */
export function scoreToTrackPercent(score: number): number {
  const clamped = Math.max(-1, Math.min(1, score));
  return Math.round((50 + clamped * 44) * 10) / 10;
}

/**
 * One respondent's position, in words.
 *
 * `role="img"` makes this component's subtree presentational, so the visible
 * endpoint text never reaches the accessibility tree and both dots are
 * aria-hidden. Everything the scale communicates has to survive in the
 * `aria-label`, which is what these two helpers build.
 */
export function describePosition(score: number, poleALabel: string, poleBLabel: string): string {
  const magnitude = Math.abs(Math.max(-1, Math.min(1, score)));
  if (magnitude < 0.15) return "near the midpoint";
  const pole = score < 0 ? poleALabel : poleBLabel;
  const strength = magnitude < 0.45 ? "slightly" : magnitude < 0.75 ? "moderately" : "strongly";
  return `${strength} toward ${pole}`;
}

/** The relationship between two respondents, from the unsigned gap between
 *  their scores. These are ComparisonScoreBar's shipped thresholds, moved here
 *  so the visible label and the accessible description are one computation. */
export function describeGap(gap: number): string {
  if (gap <= 0.3) return "close agreement";
  if (gap <= 0.7) return "some distance";
  if (gap <= 1.2) return "significant gap";
  return "far apart";
}

export function describeScale({
  axisName,
  poleALabel,
  poleBLabel,
  scoreA,
  scoreB,
  respondentALabel,
  respondentBLabel,
}: {
  /** Omit to get the bare position, with no prefix. */
  axisName?: string;
  poleALabel: string;
  poleBLabel: string;
  scoreA: number;
  scoreB?: number;
  respondentALabel: string;
  respondentBLabel: string;
}): string {
  const prefix = axisName ? `${axisName}: ` : "";
  const a = describePosition(scoreA, poleALabel, poleBLabel);
  if (scoreB === undefined) return `${prefix}${a}`;
  const b = describePosition(scoreB, poleALabel, poleBLabel);
  const relation = describeGap(Math.abs(scoreA - scoreB));
  return `${prefix}${respondentALabel} ${a}, ${respondentBLabel} ${b}; ${relation}`;
}

export function PairedAxisScale({
  axisId,
  poleALabel,
  poleBLabel,
  scoreA,
  scoreB,
  endpoints = "above",
  axisName,
  respondentALabel = "Respondent A",
  respondentBLabel = "Respondent B",
  label,
}: PairedAxisScaleProps) {
  const domain = DOMAIN_COLORS[getDomainForAxis(axisId)];
  const endpointRow = (
    <div
      className={`flex justify-between label-tight text-text-label ${
        endpoints === "above" ? "mb-1" : "mt-1.5"
      }`}
    >
      <span>{poleALabel}</span>
      <span>{poleBLabel}</span>
    </div>
  );

  const description =
    label ??
    describeScale({
      axisName,
      poleALabel,
      poleBLabel,
      scoreA,
      scoreB,
      respondentALabel,
      respondentBLabel,
    });

  return (
    <div role="img" aria-label={description}>
      {endpoints === "above" && endpointRow}
      <div className="relative h-3.5">
        {/* The track keeps the 400 tone as a literal: unlike the dot, its
            value is the same in both modes (mock 7b draws it at 400 too), so
            there is nothing for a custom property to step. */}
        <div
          data-track
          className="absolute left-0 right-0 top-1.5 h-0.5 opacity-50"
          style={{ backgroundColor: domain[400] }}
        />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border-secondary" />
        {scoreB !== undefined && (
          <div
            data-respondent="b"
            aria-hidden="true"
            className="absolute top-px h-3 w-3 -translate-x-1/2 rounded-full border-[1.5px] border-text-label bg-surface-1"
            style={{ left: `${scoreToTrackPercent(scoreB)}%` }}
          />
        )}
        {/* Respondent A steps 600 -> 400 by mode; a hex from DOMAIN_COLORS
            cannot. In light mode the two spellings are pixel-identical, so
            this is guarded on the declaration, not the rendered colour. */}
        <div
          data-respondent="a"
          aria-hidden="true"
          className="absolute top-0.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full"
          style={{ left: `${scoreToTrackPercent(scoreA)}%`, backgroundColor: getDomainMarkVar(axisId) }}
        />
      </div>
      {endpoints === "below" && endpointRow}
    </div>
  );
}
```

- [x] **Step 4: Update the home page's call site**

In `src/app/page.tsx`, the `PairedAxisScale` element currently ends with:

```tsx
                    endpoints="below"
                    label={`${axis.name}: ${axis.poleALabel} to ${axis.poleBLabel}`}
```

Replace those two lines with:

```tsx
                    endpoints="below"
                    axisName={axis.name}
```

The home page's respondents are already anonymous `Respondent A` / `Respondent B` (spec D2), which is the component's default, so no respondent props are needed. The pole labels it passes are `shortPole(...)`-truncated; the description uses those same short forms, which stays meaningful.

- [x] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/paired-axis-scale.test.ts tests/unit/home-page.test.ts`
Expected: PASS. `home-page.test.ts` must be green **unmodified**.

- [x] **Step 6: Commit**

```bash
git add src/components/PairedAxisScale.tsx src/app/page.tsx tests/unit/paired-axis-scale.test.ts
git commit -m "feat(design): describe the paired axis scale in words and step its dot by mode"
```

---

### Task 4: `AxisBreakdownCard` — the `24px 1fr 210px` axis row

**Files:**
- Modify: `src/components/results/AxisBreakdownCard.tsx` (full rewrite)
- Modify: `tests/unit/results-chrome.test.ts` — **create** the file here, with its harness
- Modify: `src/app/globals.css` — adds the `body-xs` utility
- Modify: `tests/unit/design-system-tokens.test.ts` — adds `body-xs` to `TYPE_SCALE`, plus a `body-xs` describe block
- Modify: `src/components/PairedAxisScale.tsx` — comment-only correction

**Interfaces:**
- Consumes: `PairedAxisScale` (Task 3), `body-s` (Task 1).
- Produces: an `AxisBreakdownCardProps` with `alternateRow` **removed**. Task 10 drops the prop from `ResultsView`'s call.
- Stops importing: `ScoreBar`, `getDomainColor600`.

**Why now.** This is the first of `ScoreBar`'s three call sites to move, and it is the one the mock redraws. Task 5 cannot delete `ScoreBar.tsx` until this import is gone.

The mock's row is `grid-template-columns: 24px minmax(0,1fr) 210px`, gap 16px, `padding: 12px 0`, separated by a 1px Stone 200 rule — **no zebra fill and no card radius**. The tagline and the confidence label move out of the left stack into the third column. Below 560px the third column drops beneath the scale rather than squeezing it.

- [x] **Step 1: Create the spec file with its harness and the first assertions**

Create `tests/unit/results-chrome.test.ts`:

```ts
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
```

- [x] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/results-chrome.test.ts`
Expected: FAIL — no `[data-axis-row]`, and the zebra assertions find `bg-surface-2`/`rounded-sharp`.

- [x] **Step 3: Implement**

Replace `src/components/results/AxisBreakdownCard.tsx` in full:

```tsx
"use client";

import { useState } from "react";
import { PairedAxisScale } from "@/components/PairedAxisScale";
import { AXIS_WEIGHT_PROFILES } from "@/lib/scoring-types";

export interface AxisBreakdownCardProps {
  axisId: number;
  name: string;
  poleALabel: string;
  poleBLabel: string;
  tagline: string;
  domain: string;
  finalScore: number;
  confidence: string;
  tension: {
    detected: boolean;
    level: string;
    direction: string | null;
    narrative: string | null;
  };
  components: {
    fc: number;
    sc: number;
    bg: number | null;
  };
  showScoring?: boolean;
}

function formatScore(val: number | null): string {
  if (val === null) return "N/A";
  const clamped = Math.max(-1, Math.min(1, val));
  return (clamped > 0 ? "+" : "") + clamped.toFixed(2);
}

export function AxisBreakdownCard({
  axisId,
  name,
  poleALabel,
  poleBLabel,
  tagline,
  finalScore,
  confidence,
  tension,
  components,
  showScoring = false,
}: AxisBreakdownCardProps) {
  const weights = AXIS_WEIGHT_PROFILES[axisId] ?? { fc: 0.40, sc: 0.35, bg: 0.25 };
  const [expanded, setExpanded] = useState(false);

  const confidenceText =
    confidence === "high"
      ? "High confidence"
      : confidence === "moderate"
        ? "Moderate confidence"
        : confidence === "conflicted"
          ? "Conflicted"
          : "Low confidence";

  return (
    <div className="border-b border-border-secondary">
      {/* `items-start`, not the mock's `align-items:center`: the mock's
          fabricated taglines are one line, so centre and start look
          identical there, but every real tagline in src/data/axes.ts wraps
          in a 210px column, and centre detaches the axis number from the
          name it labels by 11-15px. Deliberate divergence from a static
          prototype, not an oversight. */}
      <div
        data-axis-row
        className="grid grid-cols-[24px_minmax(0,1fr)] min-[560px]:grid-cols-[24px_minmax(0,1fr)_210px] items-start gap-4 py-3"
      >
        <p data-axis-index className="mono-meta text-text-label pt-1">
          {String(axisId).padStart(2, "0")}
        </p>

        <div>
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <p className="body-s text-text-primary">{name}</p>
            <p data-axis-score className="mono-meta text-text-secondary tabular-nums">
              {formatScore(finalScore)}
            </p>
          </div>
          <PairedAxisScale
            axisId={axisId}
            poleALabel={poleALabel}
            poleBLabel={poleBLabel}
            scoreA={finalScore}
            endpoints="below"
            axisName={name}
          />
        </div>

        {/* Third cell on desktop, second on mobile — it drops beneath the
            scale rather than squeezing a 210px column onto a 320px screen. */}
        <div data-axis-meta className="col-start-2 min-[560px]:col-start-3">
          <p data-axis-confidence className="mono-meta text-text-label">{confidenceText}</p>
          {tension.detected && (
            <p data-axis-tension className="mono-meta text-warning-text mt-1">Tension detected</p>
          )}
          <p className="body-xs text-text-label mt-1">{tagline}</p>
        </div>
      </div>

      {/* Scoring breakdown — only reachable when the section-level toggle is on */}
      {showScoring && (
        <div className="pb-3 pl-10">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="label-nav text-text-secondary hover:text-text-primary transition-colors duration-150 focus-ring"
            aria-expanded={expanded}
            aria-label={expanded ? `Hide scoring breakdown for ${name}` : `Show scoring breakdown for ${name}`}
          >
            {expanded ? "▾ Hide scoring breakdown" : "▸ See how this was scored"}
          </button>

          {expanded && (
            <div className="mt-2.5 border-t border-rule-hairline pt-3 space-y-2">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="mono-meta text-text-label mb-0.5">Forced choice</p>
                  <p className="mono-meta text-text-primary tabular-nums">
                    {formatScore(components.fc)}
                  </p>
                </div>
                <div>
                  <p className="mono-meta text-text-label mb-0.5">Calibrated scale</p>
                  <p className="mono-meta text-text-primary tabular-nums">
                    {formatScore(components.sc)}
                  </p>
                </div>
                <div>
                  <p className="mono-meta text-text-label mb-0.5">Budget</p>
                  <p className="mono-meta text-text-primary tabular-nums">
                    {formatScore(components.bg)}
                  </p>
                </div>
              </div>
              <p className="mono-meta text-text-label">
                ({weights.fc.toFixed(2)} &times; {formatScore(components.fc)}) + ({weights.sc.toFixed(2)} &times; {formatScore(components.sc)}){weights.bg > 0 ? ` + (${weights.bg.toFixed(2)} × ${formatScore(components.bg)})` : ""} = {formatScore(finalScore)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [x] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/results-chrome.test.ts`
Expected: PASS, nine tests (two more than planned — see "As shipped" below). `npm run typecheck` will still fail until Task 10 drops `alternateRow` from `ResultsView`'s call — that is expected and is fixed there.

- [x] **Step 5: Commit**

```bash
git add src/components/results/AxisBreakdownCard.tsx tests/unit/results-chrome.test.ts src/app/globals.css tests/unit/design-system-tokens.test.ts src/components/PairedAxisScale.tsx
git commit -m "feat(design): rebuild the axis breakdown row on the mock's three-column grid"
```

**As shipped.** Implementation and two rounds of review moved this task in five ways from the text above:

1. **`items-start`, not `items-center`.** A deliberate divergence from mock 7a, which specifies `align-items:center`. The mock's fabricated taglines are one line so centre and start look identical there; every real tagline in `src/data/axes.ts` wraps in a 210px column, and centre then detaches the axis index from the name it labels by 11-15px (measured: index top 12px, name top 26.9px on a tension row). Same class of judgement as this plan's D12.
2. **`body-xs` added.** The tagline is mock 7a's `font-size:12px;line-height:1.5`, which the plan carried as a raw `text-xs leading-[1.5]` pair. Named as a `@utility` for the same reason `body-s` was: a guard on the pair can catch drift within it but never a deleted size. Task 1 territory, added late because Task 4 is where the mock was actually read.
3. **The `AXIS` fixture's arithmetic was wrong.** Axis 3's real profile is `{ fc: 0.60, sc: 0.40, bg: 0.00 }`, a no-budget axis, but the fixture supplied `components.bg: -0.5` and a `finalScore` that the weights do not produce. Now `{ fc: -0.6, sc: -0.35, bg: null }`, which yields exactly -0.50. Consequence for later tasks: the `weights.bg > 0` formula branch is unreachable from this fixture and needs a second one on axis 1, 2 or 5.
4. **Two extra tests beyond the plan's six** — a tension-detected render and an expanded-disclosure render — plus a source guardrail, taking the file to nine tests. The expanded render matters because the negative `bg-surface-2`/`rounded-sharp` guards only ever saw the collapsed row, and the four card wrappers the rewrite removed live inside the panel.
5. **`PairedAxisScale`'s comment was corrected twice.** It had claimed the axis-name prefix "buys nothing" while both call sites pass it. Resolution: keep the prefix (an `aria-label` on a `role="img"` that only parses against adjacent DOM is a contract nothing enforces) and fix the comment.

---

### Task 5: Retire `ScoreBar`

**Files:**
- Modify: `src/components/groups/GroupScoreBar.tsx`
- Modify: `src/app/groups/[groupId]/page.tsx` (1 line)
- Modify: `src/app/results/[profileId]/[axisId]/page.tsx`
- Modify: `src/components/PairedAxisScale.tsx` (doc widening plus `text-right` on the second endpoint span)
- Delete: `src/components/results/ScoreBar.tsx`
- Modify: `tests/unit/results-dead-code.test.ts`
- Modify: `tests/unit/design-system-tokens.test.ts` (migrated onto the extracted helper)
- Create: `tests/helpers/source-files.ts`
- Create: `tests/unit/group-score-bar.test.ts`

**Interfaces:**
- Produces: `GroupScoreBarProps` gains a required `axisId: number`.
- Removes: the `ScoreBar` module and its `ScoreBarProps` export. Nothing else imports either.

**Why now.** Task 4 took the last call site the mock redraws; these two are D6-deferred screens that keep their layout and only change primitive. Leaving `ScoreBar` in the tree would leave two components drawing the same thing, which is exactly what building `PairedAxisScale` was meant to end.

- [x] **Step 1: Write the failing guardrail**

In `tests/unit/results-dead-code.test.ts`, extend the existing test:

```ts
  it("does not retain unreachable account-save or legacy profile-compare UI", () => {
    const resultsView = readFileSync(resultsViewPath, "utf8");

    expect(existsSync(resolve(process.cwd(), "src/components/results/CompareButton.tsx"))).toBe(false);
    // Phase 4 converged every score bar on PairedAxisScale. ScoreBar's two
    // distinguishing features — a centre-out fill and a score readout floating
    // above the marker — are both things mock 7a removes, so restyling it
    // would have left two primitives drawing one thing.
    expect(existsSync(resolve(process.cwd(), "src/components/results/ScoreBar.tsx"))).toBe(false);
    expect(resultsView).not.toContain("SaveToAccountButton");
    expect(resultsView).not.toContain("saveLastResults");
  });

  it("leaves no importer behind the deleted score bar", () => {
    // The file being gone is not the same as nothing reaching for it: a stale
    // import fails the build, but a stale import inside a string or a comment
    // is the kind of thing that survives a rename and confuses the next reader.
    const offenders = tsxFiles(resolve(process.cwd(), "src")).filter((file) =>
      /from ["'][^"']*results\/ScoreBar["']/.test(readFileSync(file, "utf8")),
    );

    expect(offenders).toEqual([]);
  });
```

Add a local `tsxFiles` helper to this file, copying the shape used in `tests/unit/design-system-tokens.test.ts`:

```ts
function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}
```

and add `readdirSync` to the `node:fs` import.

- [x] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/results-dead-code.test.ts`
Expected: FAIL — `ScoreBar.tsx` still exists, and two importers are listed.

- [x] **Step 3: Move `GroupScoreBar` onto the primitive**

Replace `src/components/groups/GroupScoreBar.tsx` in full:

```tsx
"use client";

import { PairedAxisScale, scoreToTrackPercent } from "@/components/PairedAxisScale";

interface GroupScoreBarProps {
  /** 1-12; selects the domain colour for the average marker. */
  axisId: number;
  axisName: string;
  poleALabel: string;
  poleBLabel: string;
  memberScores: number[];
  average: number | null;
}

export function GroupScoreBar({
  axisId,
  axisName,
  poleALabel,
  poleBLabel,
  memberScores,
  average,
}: GroupScoreBarProps) {
  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-text-primary">{axisName}</span>
        {average !== null && (
          <span className="text-xs font-mono tabular-nums text-text-secondary">
            {average >= 0 ? "+" : ""}
            {average.toFixed(2)}
          </span>
        )}
      </div>

      {/* Member dots bar. Purely illustrative — the accessible position and
          value both live in the PairedAxisScale below and the readout above. */}
      <div
        aria-hidden="true"
        className="relative h-[6px] rounded-[3px] overflow-visible mb-3"
        style={{ backgroundColor: 'var(--border-tertiary)' }}
      >
        {/* Center line */}
        <div
          className="absolute left-1/2 -translate-x-px"
          style={{
            top: -3,
            width: 0.5,
            height: 12,
            backgroundColor: 'var(--border-secondary)',
          }}
        />

        {/* Member score dots */}
        {memberScores.map((score, i) => {
          const left = scoreToTrackPercent(score);
          return (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full"
              style={{
                left: `${left}%`,
                width: 10,
                height: 10,
                border: '2px solid var(--stone-600)',
                backgroundColor: 'var(--surface-1)',
              }}
              title={score.toFixed(2)}
            />
          );
        })}

        {/* Group average marker */}
        {average !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-px"
            style={{
              left: `${scoreToTrackPercent(average)}%`,
              width: 1.5,
              height: 16,
              backgroundColor: 'var(--stone-600)',
              opacity: 0.6,
            }}
            title={`Group avg: ${average.toFixed(2)}`}
          />
        )}
      </div>

      {/* PairedAxisScale for the group average */}
      {average !== null && (
        <PairedAxisScale
          axisId={axisId}
          poleALabel={poleALabel}
          poleBLabel={poleBLabel}
          scoreA={average}
          endpoints="below"
          axisName={`${axisName}, group average`}
        />
      )}
      {average === null && (
        <div className="flex justify-between text-xs text-text-tertiary mt-1">
          <span>{poleALabel}</span>
          <span>No data</span>
          <span>{poleBLabel}</span>
        </div>
      )}
    </div>
  );
}
```

The axis-name qualifier is `, group average`, a comma rather than the em dash originally drafted here — Task 3 deliberately dropped an em dash from exactly this position (`describeScale`'s separator) because most synthesizers speak nothing for U+2014 and don't reliably pause on it, and this plan's own line would have reintroduced it. `scoreToTrackPercent` (imported from `PairedAxisScale`, exported alongside it) replaces the two inline `((clamped + 1) / 2) * 100` mappings on the member dots and the average marker, and the average readout moves out of the (now `aria-hidden`) strip into a visible span above it — see "As shipped" below for why both of those are more than a primitive swap.

- [x] **Step 4: Pass `axisId` at the group call site**

In `src/app/groups/[groupId]/page.tsx`, add one line to the `<GroupScoreBar>` element, immediately after `key={as.axisId}`:

```tsx
                axisId={as.axisId}
```

- [x] **Step 5: Move the per-axis detail page onto the primitive**

In `src/app/results/[profileId]/[axisId]/page.tsx`, replace the `ScoreBar` import with:

```tsx
import { PairedAxisScale } from "@/components/PairedAxisScale";
```

and replace the `<ScoreBar ... />` element with:

```tsx
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-[11px] text-text-label">Composite score</span>
            <span className="font-mono text-sm font-medium text-text-primary tabular-nums">
              {axisScore.finalScore >= 0 ? "+" : ""}
              {axisScore.finalScore.toFixed(2)}
            </span>
          </div>
          <PairedAxisScale
            axisId={axisId}
            poleALabel={axis.poleALabel}
            poleBLabel={axis.poleBLabel}
            scoreA={axisScore.finalScore}
            endpoints="below"
            axisName={axis.name}
          />
```

`axisId` is already in scope on this page — it is parsed from the route params at the top of the component. The `height={12}` prop has no equivalent and is dropped; `PairedAxisScale` is a fixed 14px-tall track by design. The `Composite score` readout above it is not part of the primitive swap `ScoreBar` was doing before — `ScoreBar` rendered the score itself in a positioned span, and this restores that display, which `PairedAxisScale` deliberately does not own. See "As shipped" below.

- [x] **Step 6: Delete the file**

```bash
git rm src/components/results/ScoreBar.tsx
```

- [x] **Step 7: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/results-dead-code.test.ts && npx tsc --noEmit`
Expected: the vitest run PASSes. `tsc` still reports the `alternateRow` prop on `ResultsView`'s `AxisBreakdownCard` call from Task 4 — that single error is expected until Task 10, and **no other error may appear**. If `tsc` reports anything else, a call site was missed.

- [x] **Step 8: Commit**

```bash
git add -A src/components/groups src/app/groups src/app/results src/components/results tests/unit/results-dead-code.test.ts
git commit -m "refactor(design): retire ScoreBar in favour of PairedAxisScale"
```

**As shipped.** Implementation and review moved this task in five ways from the text above:

1. **A coordinate-mapping regression, caught in review.** `GroupScoreBar`'s member-dot strip mapped scores with `((clamped + 1) / 2) * 100` — a 0-100% track — while `PairedAxisScale` uses `scoreToTrackPercent`, `50 + clamped * 44`, a 6-94% track so a dot at a pole doesn't clip. The deleted `ScoreBar` used the strip's mapping, so the two agreed exactly before this task and diverged by roughly 41px at the poles after it, worst where a group has strong consensus. Both strip call sites now import and use `scoreToTrackPercent`.
2. **The composite score vanished from two screens.** `ScoreBar` rendered the number in a positioned span; the primitive deliberately doesn't own a readout, and neither call site added one. The per-axis detail page lost its only display of `finalScore` while still printing the three operands it fuses — on the page whose whole job is showing how a score was produced. On `/groups` the average survived only as a `title` on a 1.5px-wide div: mouse-only, no keyboard or AT path. Both readouts restored, each matching its own screen's idiom rather than the phase's, since both are design-deferred.
3. **`tsxFiles` was extracted** to `tests/helpers/source-files.ts` as `sourceFiles(dir, extensions = [".ts", ".tsx"])` rather than duplicated a second time, and the importer guard's regex widened to Task 4's `/from\s+["'][^"']*\/ScoreBar["']/` — the narrower original let a sibling's `from "./ScoreBar"` through, demonstrated by mutation. The helper prunes `node_modules`, `generated` and dot-directories internally: `src/generated` is 27 committed Prisma files, and `design-system-tokens.test.ts` drives token bans off the same helper, so the first `.ts` pattern ban would otherwise report machine-generated code as design violations.
4. **An accessibility regression added and then fixed in review.** The restored detail-page label first used `text-text-tertiary` (`#9d8b78`, **3.28:1** on white — under AA at 11px) to match three pre-existing siblings on that screen. Changed to `text-text-label` (`#6e5a48`, **6.52:1**). The two tokens are byte-identical in dark mode, where `--text-label` resolves to `--stone-500`, so the fix is a no-op there and only diverges in light. Record the consequence: **no rendered assertion can distinguish these two tokens in dark mode**, so any future guard on this has to be a source assertion.
5. **Five new tests** in `tests/unit/group-score-bar.test.ts` covering the `axisId` plumbing, the `, group average` label composition, and both track mappings — the commit's only new behaviour, previously untested.

---

### Task 6: `ComparisonScoreBar` converges on the primitive

**Files:**
- Modify: `src/components/comparison/ComparisonScoreBar.tsx` (full rewrite)
- Modify: `src/app/compare/page.tsx` — one line of legend copy, and its duplicate `deltaLabel`
- Modify: `tests/unit/results-chrome.test.ts` — append a `describe`

**Interfaces:**
- Consumes: `PairedAxisScale` and `describeGap` (Task 3).
- Removes: the component's `useState`, its two hover tooltips, and its local `deltaLabel` ladder, **and the fourth copy of the same ladder at `src/app/compare/page.tsx:47`**.
- Props are unchanged. `/compare`'s layout is untouched; only the bar converges. Phase 5 restyles the page.

**Why the tooltips go (D10).** They were mouse-only — no keyboard path, no screen-reader path — and they showed exactly the information mock 7a puts permanently on the axis-name line. Two always-visible mono readouts replace them, and `describeGap` puts the same bucket thresholds into the scale's `aria-label`, so for the first time a screen-reader user on `/compare` gets both positions and the relationship.

**There is a fourth copy of these buckets, and it is on the same page.** Task 3's code review found `src/app/compare/page.tsx:47` holds its own `deltaLabel` with the *pre-convergence* strings, rendered visibly at lines 162 and 171 in the "most aligned" / "furthest apart" lists. `describeGap` reworded one bucket — `very close` → `close agreement` — so without this, `/compare` would say `Governance Structure — very close` in its aligned list and `close agreement` on the bar for that same axis, a few hundred pixels apart: same thresholds, same data, two vocabularies. Delete the local function and call `describeGap` at both sites. This is five lines and stays inside "only the bar converges" — D10 defers `/compare`'s *layout* to phase 5, not its correctness. The other three buckets were kept verbatim precisely to keep this fold to one changed string.

Note the two spans at lines 162 and 171 carry `text-text-tertiary`, which this phase's constraints ban. Leave them — `/compare`'s sweep is phase 5, and Task 11's guardrail is scoped to `src/components/results/`.

**The dot roles swap, and the page's legend says so.** Today `ComparisonScoreBar` draws **A as a ring and B as a filled dot**. `PairedAxisScale` draws the reverse — delta 05 specifies respondent A as the filled domain dot and respondent B as the outlined one. `src/app/compare/page.tsx:186` reads *"Ring marker is you, filled dot is them."* and becomes wrong the moment this task lands. Fixing the copy is part of this task, not a follow-up.

- [ ] **Step 1: Write the failing tests**

Append to `tests/unit/results-chrome.test.ts`:

```ts
describe("ComparisonScoreBar", () => {
  const PAIR = {
    axisId: 3,
    axisName: "Governance Structure",
    tagline: "Where should decisions be made?",
    scoreA: -0.5,
    scoreB: 0.9,
    poleALabel: "Distributed Governance",
    poleBLabel: "Centralized Governance",
    delta: 1.4,
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

  it("labels the gap from the shared buckets, not a local ladder", () => {
    // The thresholds moved into PairedAxisScale so the visible label and the
    // accessible description are one computation. A local copy would drift.
    const container = render(createElement(ComparisonScoreBar, { ...PAIR, delta: 0.2 }));

    expect(container.querySelector("[data-gap]")!.textContent).toBe("close agreement");
  });
});
```

Add `import { ComparisonScoreBar } from "@/components/comparison/ComparisonScoreBar";` to the file's imports.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/results-chrome.test.ts`
Expected: FAIL — no `[data-readout]`, two `[data-track]` elements, and the `aria-label` still names only the poles.

- [ ] **Step 3: Implement**

Replace `src/components/comparison/ComparisonScoreBar.tsx` in full. Note the tagline below uses `body-xs text-text-label`, not the raw `text-xs leading-[1.5]` pair — `body-xs` now exists (added in Task 4) precisely so this row does not reintroduce it:

```tsx
"use client";

import { PairedAxisScale, describeGap } from "@/components/PairedAxisScale";

interface ComparisonScoreBarProps {
  axisId: number;
  axisName: string;
  tagline: string;
  scoreA: number;
  scoreB: number;
  poleALabel: string;
  poleBLabel: string;
  delta: number;
  labelA: string;
  labelB: string;
  alternateRow?: boolean;
}

function formatScore(score: number): string {
  const clamped = Math.max(-1, Math.min(1, score));
  return (clamped > 0 ? "+" : "") + clamped.toFixed(2);
}

/**
 * One axis for two respondents, as row chrome around `PairedAxisScale`.
 *
 * The hover tooltips this replaced were mouse-only — no keyboard path, no
 * screen-reader path — and showed the same numbers the readouts below now
 * show permanently. Note that the dot roles are the primitive's, not this
 * component's former ones: respondent A is the FILLED domain dot and
 * respondent B the outlined one, which is the reverse of what shipped. The
 * legend on `/compare` names them in that order.
 */
export function ComparisonScoreBar({
  axisId,
  axisName,
  tagline,
  scoreA,
  scoreB,
  poleALabel,
  poleBLabel,
  delta,
  labelA,
  labelB,
  alternateRow = false,
}: ComparisonScoreBarProps) {
  return (
    <div className={`rounded-sharp px-3 py-[9px] ${alternateRow ? "bg-surface-2" : ""}`}>
      <div className="flex items-baseline justify-between gap-3 mb-0.5">
        <span className="body-s text-text-primary">{axisName}</span>
        <span data-gap className="mono-meta text-text-label">
          {describeGap(delta)}
        </span>
      </div>
      <p className="body-xs text-text-label mb-2">{tagline}</p>

      <div className="flex flex-wrap gap-x-4 mb-1.5 mono-meta text-text-secondary tabular-nums">
        <span data-readout="a">
          {labelA} {formatScore(scoreA)}
        </span>
        <span data-readout="b">
          {labelB} {formatScore(scoreB)}
        </span>
      </div>

      <PairedAxisScale
        axisId={axisId}
        poleALabel={poleALabel}
        poleBLabel={poleBLabel}
        scoreA={scoreA}
        scoreB={scoreB}
        endpoints="below"
        axisName={axisName}
        respondentALabel={labelA}
        respondentBLabel={labelB}
      />
    </div>
  );
}
```

- [ ] **Step 4: Correct the legend copy**

In `src/app/compare/page.tsx`, line 186, replace:

```tsx
              Each bar shows both profiles. Ring marker is you, filled dot is them.
```

with:

```tsx
              Each bar shows both profiles. Filled dot is you, ring marker is them.
```

Then confirm nothing else describes the old order:

```bash
grep -rn "Ring marker\|ring marker" src/ || echo "clean"
```

Expected: `clean`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/results-chrome.test.ts tests/unit/comparison.test.ts tests/unit/comparison-radar-data.test.ts`
Expected: PASS. The two comparison suites are logic tests and must be green **unmodified**.

- [ ] **Step 6: Commit**

```bash
git add src/components/comparison/ComparisonScoreBar.tsx src/app/compare/page.tsx tests/unit/results-chrome.test.ts
git commit -m "refactor(design): converge ComparisonScoreBar on PairedAxisScale"
```

**Addenda from Task 4's code-quality review**, deliberately routed here rather than fixed in Task 4:

- **Unshortened pole labels.** `AxisBreakdownCard` passes `poleALabel`/`poleBLabel` raw where `src/app/page.tsx` passes them through `shortPole(...)`. Between roughly 560 and 600px viewport width the widest pair wraps to two lines. This self-corrects above ~600px, and Task 10's 820px results container widens the axis row further still — but this component's middle column is narrower than the axis row's, so it will hit the wrap harder. Worth checking once this task's grid is in place.
- **Two responsive conventions for the same pattern.** The home page uses a block that becomes `min-[560px]:grid` with `min-[560px]:contents` to re-parent at the breakpoint, while the axis row (Task 4) uses a 2-column grid at all widths with `col-start-2` / `min-[560px]:col-start-3`. Both are valid; settle on one before this task builds a third variant.

---

### Task 7: `ArchetypeCard` — the `1fr 220px` panel

**Files:**
- Modify: `src/components/results/ArchetypeCard.tsx` (full rewrite)
- Modify: `tests/unit/results-chrome.test.ts` — append a `describe`

**Interfaces:**
- Produces: `ArchetypeCardProps` gains `actions?: ReactNode`, rendered at the foot of the left column.
- Consumes: `Button` (phase 1), `body-s`, `--mark-primary` (Task 1).
- Task 10 passes `<CopyLinkButton />` and `<CompareInput />` into the new slot and stops rendering its own action bar.

**Why the slot, not a move (D13).** `CopyLinkButton` owns a 2s timer and `CompareInput` owns the router and the `encoded` prop. Moving them into `ArchetypeCard` would drag `useRouter` into a presentational card and hand it a prop it has no other use for. A `ReactNode` slot puts them where the mock draws them without moving what they own.

Mock 7a's panel: `grid-template-columns: minmax(0,1fr) 220px`, 28px gap. Left column — `Primary archetype` in 11px mono eyebrow with **12px padding-bottom over a 1px Stone 900 rule**, then the match percentage at `display-l`, the archetype name at `display-s`, a 13.5px summary, then the action row. Below the grid, a 1px Stone 50 rule and `Adjacent · <name> — NN% match` in 11px mono. Right column — the 200px mini radar and its two-item legend.

- [ ] **Step 1: Write the failing tests**

Append to `tests/unit/results-chrome.test.ts`:

```ts
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
    userScores: Array.from({ length: 12 }, () => -0.1),
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
    expect(learnMore.getAttribute("aria-expanded")).toBe("false");
    expect(container.textContent).not.toContain("A longer description.");

    act(() => learnMore.click());

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
  });

  it("still describes a distinctive profile without an archetype", () => {
    const container = render(
      createElement(ArchetypeCard, { ...ARCHETYPE, isDistinctive: true }),
    );

    expect(container.textContent).toContain("Distinctive profile");
    expect(container.textContent).toContain("The Social Democrat — 74% match");
  });
});
```

Add `ArchetypeCard` to the file's imports.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/results-chrome.test.ts`
Expected: FAIL — eight new tests, none of the `data-archetype-*` hooks exist.

- [ ] **Step 3: Implement**

Replace `src/components/results/ArchetypeCard.tsx` in full:

```tsx
"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";

interface ArchetypeCardProps {
  primary: {
    id: string;
    name: string;
    matchPercentage: number;
    summary: string;
    description: string;
    tension: string;
    prototype: number[];
  };
  secondary: {
    name: string;
    matchPercentage: number;
    summary: string;
  };
  isBlended: boolean;
  isDistinctive: boolean;
  userScores?: number[]; // 12 axis finalScores for mini radar
  /** Mock 7a draws Copy link / Compare with someone inside the panel, but the
   *  timer and the router belong to ResultsView. It passes them in here. */
  actions?: ReactNode;
}

const MINI_SIZE = 200;
const MINI_CX = MINI_SIZE / 2;
const MINI_CY = MINI_SIZE / 2;
const MINI_R = 80;
const MINI_AXES = 12;

function ringPoints(radius: number): string {
  return Array.from({ length: MINI_AXES }, (_, i) => {
    const angle = (i / MINI_AXES) * 2 * Math.PI - Math.PI / 2;
    return `${MINI_CX + radius * Math.cos(angle)},${MINI_CY + radius * Math.sin(angle)}`;
  }).join(" ");
}

function miniRadarPoints(scores: number[]): string {
  return scores.map((score, i) => {
    const angle = (i / MINI_AXES) * 2 * Math.PI - Math.PI / 2;
    const r = ((score + 1) / 2) * MINI_R;
    return `${MINI_CX + r * Math.cos(angle)},${MINI_CY + r * Math.sin(angle)}`;
  }).join(" ");
}

function MiniRadar({ userScores, prototypeScores }: { userScores: number[]; prototypeScores: number[] }) {
  return (
    <svg viewBox={`0 0 ${MINI_SIZE} ${MINI_SIZE}`} className="w-full max-w-[200px] mx-auto" aria-hidden="true">
      <polygon points={ringPoints(MINI_R)} fill="none" style={{ stroke: 'var(--border-secondary)' }} strokeWidth={0.6} />
      <polygon
        points={ringPoints(MINI_R * 0.5)}
        fill="none" style={{ stroke: 'var(--border-secondary)' }}
        strokeWidth={0.5} strokeDasharray="2 2"
      />
      <polygon
        points={miniRadarPoints(prototypeScores)}
        fill="none" style={{ stroke: 'var(--stone-500)' }}
        strokeWidth={1} strokeDasharray="3 2" opacity={0.5}
      />
      {/* --mark-primary, not var(--stone-600): mock 7b paints this shape Stone
          400 on a dark ground. Deliberately NOT --domain-economic, which holds
          the same value in both modes — see the note in globals.css. */}
      <polygon
        data-mini-user
        points={miniRadarPoints(userScores)}
        style={{ fill: 'var(--mark-primary)', stroke: 'var(--mark-primary)' }}
        fillOpacity={0.12} strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArchetypeCard({
  primary,
  secondary,
  isBlended,
  isDistinctive,
  userScores,
  actions,
}: ArchetypeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const lowMatch = primary.matchPercentage < 55;

  if (isDistinctive) {
    return (
      <div>
        <p className="label-eyebrow text-text-label pb-3 border-b border-rule-strong mb-3.5">
          Distinctive profile
        </p>

        <p className="body-s text-text-secondary mb-4">
          Your governance positions form a combination that doesn&apos;t map
          cleanly to any single archetype. This often reflects considered
          positions that cross traditional ideological lines.
        </p>

        {actions}

        <p className="label-tight text-text-label mt-[18px] pt-3.5 border-t border-rule-hairline mb-1">
          Nearest archetypes
        </p>
        <p className="mono-meta text-text-secondary">
          {primary.name} — {primary.matchPercentage}% match
        </p>
        <p className="mono-meta text-text-label">
          {secondary.name} — {secondary.matchPercentage}% match
        </p>
      </div>
    );
  }

  const showMiniRadar = userScores && primary.prototype.length === 12;

  return (
    <div>
      <div
        data-archetype-grid
        className={`grid gap-7 items-start ${showMiniRadar ? "grid-cols-1 min-[560px]:grid-cols-[minmax(0,1fr)_220px]" : ""}`}
      >
        <div>
          <p
            data-archetype-label
            className="label-eyebrow text-text-label pb-3 border-b border-rule-strong mb-3.5"
          >
            Primary archetype
          </p>

          <p data-archetype-match className="display-l text-text-primary mb-1">
            {primary.matchPercentage}%
          </p>

          <h2 className="display-s text-text-primary mb-3">{primary.name}</h2>

          {isBlended && (
            <p className="mono-meta text-text-label mb-2">
              Blended type — your profile draws nearly equally from both archetypes
            </p>
          )}

          {lowMatch && (
            <p className="mono-meta text-warning-text mb-2">
              Your profile is unusually distributed and doesn&apos;t map cleanly to
              any single governance philosophy.
            </p>
          )}

          <p className="body-s text-text-secondary mb-4">{primary.summary}</p>

          <div className="flex flex-wrap items-center gap-2.5">
            {actions}
            <Button
              variant="tertiary"
              data-archetype-expand
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
              aria-label={expanded ? "Hide archetype details" : "Show archetype details"}
            >
              {expanded ? "Hide details" : "Learn more"}
            </Button>
          </div>

          {expanded && (
            <div className="mt-4 space-y-3">
              <p className="body-s text-text-secondary">{primary.description}</p>
              {primary.tension && (
                <div className="border-l-2 border-border-secondary pl-4">
                  <p className="label text-text-label mb-1">Characteristic tension</p>
                  <p className="body-s text-text-secondary">{primary.tension}</p>
                </div>
              )}
              <Link
                href={`/archetypes#${primary.id}`}
                className="label-nav text-text-secondary border-b border-border-primary pb-[3px] inline-block hover:text-text-primary transition-colors duration-150 focus-ring"
              >
                Read in the archetype reference →
              </Link>
            </div>
          )}
        </div>

        {showMiniRadar && (
          <div className="flex flex-col items-center justify-center">
            <MiniRadar userScores={userScores!} prototypeScores={primary.prototype} />
            <div className="flex justify-center gap-3.5 mt-1.5 mono-meta text-text-label">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-0.5" style={{ backgroundColor: 'var(--mark-primary)' }} />
                You
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="2" aria-hidden="true">
                  <line x1="0" y1="1" x2="12" y2="1" stroke="var(--stone-500)" strokeWidth="1" strokeDasharray="3 2" />
                </svg>
                Prototype
              </span>
            </div>
          </div>
        )}
      </div>

      <p
        data-archetype-adjacent
        className="mono-meta text-text-label mt-[18px] pt-3.5 border-t border-rule-hairline"
      >
        Adjacent · {secondary.name} — {secondary.matchPercentage}% match
      </p>
    </div>
  );
}
```

Note: `Button` forwards unknown props to the underlying `<button>`, so `data-archetype-expand` reaches the DOM. Do **not** pass a `className` carrying colour or padding — the tertiary variant already sets both, and appending does not win (see Global Constraints).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/results-chrome.test.ts`
Expected: PASS. If the `Learn more` assertion on `label-nav` fails, the tertiary variant was overridden — re-read the `className` constraint rather than adding the class by hand.

- [ ] **Step 5: Commit**

```bash
git add src/components/results/ArchetypeCard.tsx tests/unit/results-chrome.test.ts
git commit -m "feat(design): rebuild the archetype panel on the mock's two-column grid"
```

**Addenda from Task 4's code-quality review**, deliberately routed here rather than fixed in Task 4:

- **Unshortened pole labels.** `AxisBreakdownCard` passes `poleALabel`/`poleBLabel` raw where `src/app/page.tsx` passes them through `shortPole(...)`. Between roughly 560 and 600px viewport width the widest pair wraps to two lines. This self-corrects above ~600px, and Task 10's 820px results container widens the axis row further still — but the group row this task's sibling touches has a narrower middle column and will hit the wrap harder. Worth checking once this task's grid is in place.
- **Two responsive conventions for the same pattern.** The home page uses a block that becomes `min-[560px]:grid` with `min-[560px]:contents` to re-parent at the breakpoint, while the axis row (Task 4) uses a 2-column grid at all widths with `col-start-2` / `min-[560px]:col-start-3`. Both are valid; settle on one before this task builds a third variant.

---

### Task 8: `RadarChart` — one polygon, twelve domain dots

**Files:**
- Modify: `src/components/results/RadarChart.tsx` (full rewrite)
- Modify: `tests/unit/results-chrome.test.ts` — append a `describe`

**Interfaces:**
- Props are unchanged (`axisScores: AxisScore[]`).
- Removes: `DOMAIN_SEGMENTS`, `buildDomainPath`, `RING_FRACTIONS`, the twelve domain-tinted triangle fills, the centre dot.
- Keeps: the `((score + 1) / 2) * R` mapping, the visually-hidden score table, and the vertex hover tooltip.

**What changes and why.** Mock 7a draws **one** user polygon in Stone 600 at 10% fill, with a 4px dot per axis in that axis's domain colour. Today the chart draws four domain-coloured stroke *segments* over twelve domain-tinted triangle *fills* — a second colour system layered on the first, which is what makes the current chart read as busy. The rings collapse from four to two (a 0.8px Stone 200 outer ring and a dashed Stone 300 mid-ring), the six diameter lines become twelve 0.6px spokes from the centre, and the labels move from `r+38` in domain colour to `r+22` in 11px mono `--text-label`, prefixed with the axis number.

The tooltip stays. It is behaviour, it is the only way to read an exact score off the chart, and nothing in the issue's "must not change" list implies otherwise — but its `rx={4}` corner drops to `2`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/unit/results-chrome.test.ts`:

```ts
describe("RadarChart", () => {
  const SCORES = Array.from({ length: 12 }, (_, i) => ({
    axisId: i + 1,
    name: `Axis ${i + 1}`,
    poleALabel: `Pole A ${i + 1}`,
    poleBLabel: `Pole B ${i + 1}`,
    domain: "Economic Organization",
    finalScore: 0.2,
    confidence: "high",
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
    expect(container.querySelectorAll("[data-radar-spoke]")).toHaveLength(12);
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
  });
});
```

Add `RadarChart` to the file's imports.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/results-chrome.test.ts`
Expected: FAIL — six new tests; `[data-radar-*]` hooks do not exist and four `path` elements are found.

- [ ] **Step 3: Implement**

Replace `src/components/results/RadarChart.tsx` in full:

```tsx
"use client";

import { useState } from "react";
import { DOMAIN_COLORS, DOMAIN_MARK_VARS, getDomainMarkVar, type DomainKey } from "@/lib/design-tokens";

interface AxisScore {
  axisId: number;
  name: string;
  poleALabel: string;
  poleBLabel: string;
  domain: string;
  finalScore: number;
  confidence: string;
}

interface RadarChartProps {
  axisScores: AxisScore[];
}

const TOTAL_AXES = 12;
const SIZE = 580;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_RADIUS = 170;
// Mock 7a puts the labels at r+22. The old r+38 was sized for two-line
// domain-coloured labels; at 11px mono the ring can close up.
const LABEL_PADDING = 22;

function scoreToRadius(score: number): number {
  // Directional: center = strongest Pole A (-1), perimeter = strongest Pole B (+1)
  return ((score + 1) / 2) * MAX_RADIUS;
}

function spokeAngle(index: number): number {
  return (index / TOTAL_AXES) * 2 * Math.PI - Math.PI / 2;
}

function polarToCart(angle: number, radius: number): [number, number] {
  return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)];
}

function ringPolygonPoints(radiusFraction: number): string {
  const r = MAX_RADIUS * radiusFraction;
  return Array.from({ length: TOTAL_AXES }, (_, i) => {
    const [x, y] = polarToCart(spokeAngle(i), r);
    return `${x},${y}`;
  }).join(" ");
}

/** Split a long label at the space nearest its middle, so a perimeter label
 *  stays inside the viewBox. Unchanged from the chart this replaces. */
function splitLabel(label: string): string[] {
  if (label.includes("/")) return label.split(/[/]/).map((p) => p.trim());
  if (label.length <= 14) return [label];
  const mid = Math.ceil(label.length / 2);
  const spaceAfter = label.indexOf(" ", mid);
  const spaceBefore = label.lastIndexOf(" ", mid);
  const splitAt =
    spaceAfter !== -1 && spaceAfter - mid < mid - spaceBefore ? spaceAfter : spaceBefore;
  return splitAt > 0 ? [label.slice(0, splitAt), label.slice(splitAt + 1)] : [label];
}

export function RadarChart({ axisScores }: RadarChartProps) {
  const sorted = [...axisScores].sort((a, b) => a.axisId - b.axisId);

  const paddedScores: AxisScore[] = Array.from({ length: TOTAL_AXES }, (_, i) => {
    const found = sorted.find((s) => s.axisId === i + 1);
    return (
      found ?? {
        axisId: i + 1,
        name: `Axis ${i + 1}`,
        poleALabel: "",
        poleBLabel: "",
        domain: "",
        finalScore: 0,
        confidence: "low",
      }
    );
  });

  const userPolygon = paddedScores
    .map((axis, i) => {
      const [x, y] = polarToCart(spokeAngle(i), scoreToRadius(axis.finalScore));
      return `${x},${y}`;
    })
    .join(" ");

  const [hoveredAxis, setHoveredAxis] = useState<number | null>(null);

  return (
    <div className="w-full flex flex-col items-center">
      {/* The SVG is aria-hidden, so this table is the entire accessible chart. */}
      <table className="sr-only" aria-label="12-axis governance profile scores">
        <thead>
          <tr><th>Axis</th><th>Score</th><th>Confidence</th></tr>
        </thead>
        <tbody>
          {paddedScores.map((axis) => (
            <tr key={axis.axisId}>
              <td>{axis.name}: {axis.poleALabel} to {axis.poleBLabel}</td>
              <td>{axis.finalScore >= 0 ? "+" : ""}{axis.finalScore.toFixed(2)}</td>
              <td>{axis.confidence}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-xl" aria-hidden="true">
        {/* Outer ring and dashed mid-ring. Four concentric rings became two:
            the mid-ring is the neutral mark the caption describes, and the
            0.33/0.67 rings carried no meaning. */}
        <polygon
          data-radar-ring
          points={ringPolygonPoints(1)}
          fill="none"
          style={{ stroke: 'var(--border-secondary)' }}
          strokeWidth={0.8}
        />
        <polygon
          data-radar-ring
          points={ringPolygonPoints(0.5)}
          fill="none"
          style={{ stroke: 'var(--border-primary)' }}
          strokeWidth={0.8}
          strokeDasharray="3 3"
        />

        {/* Twelve spokes from the centre, not six diameters: a spoke has to be
            present even where the mapping puts its vertex at the origin. */}
        {Array.from({ length: TOTAL_AXES }, (_, i) => {
          const [x, y] = polarToCart(spokeAngle(i), MAX_RADIUS);
          return (
            <line
              key={i}
              data-radar-spoke
              x1={CX} y1={CY} x2={x} y2={y}
              style={{ stroke: 'var(--border-secondary)' }}
              strokeWidth={0.6}
            />
          );
        })}

        {/* One shape. --mark-primary, not var(--stone-600) and not
            --domain-economic: it steps to Stone 400 on a dark ground, and the
            domain token holds the identical value in both modes, which makes
            a swap between them invisible. */}
        <polygon
          data-radar-user
          points={userPolygon}
          style={{ fill: 'var(--mark-primary)', stroke: 'var(--mark-primary)' }}
          fillOpacity={0.1}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />

        {paddedScores.map((axis, i) => {
          const [x, y] = polarToCart(spokeAngle(i), scoreToRadius(axis.finalScore));
          const isHovered = hoveredAxis === axis.axisId;
          return (
            <g key={axis.axisId}>
              <circle
                data-radar-dot
                cx={x}
                cy={y}
                r={isHovered ? 5.5 : 4}
                fill={getDomainMarkVar(axis.axisId)}
                style={{ transition: "r 150ms ease-out" }}
              />
              {/* Larger invisible hit target */}
              <circle
                cx={x}
                cy={y}
                r={14}
                fill="transparent"
                style={{ cursor: "default" }}
                onMouseEnter={() => setHoveredAxis(axis.axisId)}
                onMouseLeave={() => setHoveredAxis(null)}
              />
            </g>
          );
        })}

        {hoveredAxis != null && (() => {
          const axis = paddedScores[hoveredAxis - 1];
          const i = hoveredAxis - 1;
          const [vx, vy] = polarToCart(spokeAngle(i), scoreToRadius(axis.finalScore));
          const score = axis.finalScore;
          const poleName = score >= 0 ? axis.poleBLabel : axis.poleALabel;
          const label = `${Math.abs(score).toFixed(2)}  ${poleName}`;
          const boxW = label.length * 5.5 + 16;
          const boxH = 28;

          const angle = spokeAngle(i);
          let tx = vx + Math.cos(angle) * 20;
          let ty = vy + Math.sin(angle) * 20;
          tx = Math.max(10, Math.min(SIZE - boxW - 2, tx - boxW / 2)) + boxW / 2;
          ty = Math.max(7, Math.min(SIZE - boxH - 2, ty - boxH / 2)) + boxH / 2;

          return (
            <g style={{ pointerEvents: "none" }}>
              <rect
                x={tx - boxW / 2}
                y={ty - boxH / 2}
                width={boxW}
                height={boxH}
                rx={2}
                style={{ fill: "var(--surface-1)", stroke: "var(--border-secondary)" }}
                strokeWidth={0.5}
              />
              <text
                x={tx}
                y={ty}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={11}
                style={{ fill: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
              >
                {label}
              </text>
            </g>
          );
        })()}

        {paddedScores.map((axis, i) => {
          const angle = spokeAngle(i);
          const [x, y] = polarToCart(angle, MAX_RADIUS + LABEL_PADDING);

          let anchor: "start" | "middle" | "end" = "middle";
          const normAngle = (angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
          if (normAngle < Math.PI * 0.1 || normAngle > Math.PI * 1.9) anchor = "middle";
          else if (normAngle < Math.PI * 0.9) anchor = "start";
          else if (normAngle < Math.PI * 1.1) anchor = "middle";
          else anchor = "end";

          const parts = splitLabel(
            `${String(axis.axisId).padStart(2, "0")} ${axis.poleBLabel || axis.name}`,
          );

          return (
            <text
              key={axis.axisId}
              data-radar-label
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="central"
              fontSize={11}
              letterSpacing="0.02em"
              style={{ fill: 'var(--text-label)', fontFamily: 'var(--font-mono)' }}
            >
              {parts.map((part, pi) => (
                <tspan key={pi} x={x} dy={pi === 0 ? (parts.length > 1 ? "-0.5em" : "0") : "1.1em"}>
                  {part}
                </tspan>
              ))}
            </text>
          );
        })}
      </svg>

      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-3">
        {(["economic", "power", "society", "world"] as DomainKey[]).map((key) => (
          <div key={key} className="flex items-center gap-1.5 mono-meta text-text-label">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: DOMAIN_MARK_VARS[key] }}
            />
            {DOMAIN_COLORS[key].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/results-chrome.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/results/RadarChart.tsx tests/unit/results-chrome.test.ts
git commit -m "feat(design): reduce the radar to one polygon and twelve domain dots"
```

---

### Task 9: `CompassPlot` — the 300px square

**Files:**
- Modify: `src/components/results/CompassPlot.tsx`
- Modify: `tests/unit/results-chrome.test.ts` — append a `describe`

**Interfaces:**
- Props are unchanged (`economic`, `cultural`, `primaryArchetypeId?`).
- Removes: the four quadrant tint rects, the dashed moderate-zone rect, the four whisper quadrant labels, the two pulse rings, and the background rect's `rx={6}`.
- Keeps (D11): the four contour paths, the twelve archetype reference markers with their collision suppression, the leader line and the coordinate readout.

**Geometry.** `PADDING` moves from 76 to **50** so `INNER` becomes exactly **300**, giving the mock's 300px square inside the existing 400-unit viewBox, with room for the four mono pole labels *inside* the square at an 8px inset. The contour path formulas are already written in terms of `PADDING` and `INNER` and adapt with no edit. The wrapper's `max-w-sm` becomes `max-w-[400px]` so the square renders at 300px rather than 288px.

**The vertical axis keeps its meaning (D12).** Mock 7a labels the vertical axis `Open` / `Traditional`; the shipped plot labels it `TRADITIONAL` (top) / `PROGRESSIVE` (bottom), and `toY()` maps cultural `+1` to the top. Adopting the mock's labels would invert the meaning of every plotted point without touching `SD_CULTURAL_WEIGHTS`. Keep the existing four names in their existing positions; take only the mono treatment.

- [ ] **Step 1: Write the failing tests**

Append to `tests/unit/results-chrome.test.ts`:

```ts
describe("CompassPlot", () => {
  const PLOT = { economic: -0.4, cultural: 0.3, primaryArchetypeId: "social-democrat" };

  it("draws a 300px plot square with a 50px grid", () => {
    const container = render(createElement(CompassPlot, PLOT));
    const frame = container.querySelector("[data-compass-frame]") as SVGRectElement;

    expect(frame.getAttribute("width")).toBe("300");
    expect(frame.getAttribute("height")).toBe("300");
    // Squared off with the rest of the system: this rect carried rx={6}.
    expect(frame.getAttribute("rx")).toBeNull();
    // Five interior lines each way at 50px spacing.
    expect(container.querySelectorAll("[data-compass-grid]")).toHaveLength(10);
  });

  it("plots the respondent as a 12px ink dot that inverts", () => {
    const container = render(createElement(CompassPlot, PLOT));
    const dot = container.querySelector("[data-compass-dot]") as SVGCircleElement;

    expect(dot.getAttribute("r")).toBe("6");
    // var(--text-primary), not var(--stone-900): Stone 900 ink on a Stone 900
    // ground is invisible, and --text-primary is already the ink pair that
    // inverts (#3d2e1f / #efe9e3).
    expect(dot.style.fill).toBe("var(--text-primary)");
  });

  it("keeps the compass pointing the way the scoring engine does", () => {
    const container = render(createElement(CompassPlot, PLOT));
    const poles = [...container.querySelectorAll("[data-compass-pole]")].map((p) => p.textContent);

    // Mock 7a labels the vertical axis Open / Traditional, which would invert
    // the meaning of every plotted point. SD_CULTURAL_WEIGHTS maps +1 to the
    // top and the shipped labels say Traditional there. The mock is a static
    // prototype with fabricated coordinates; it does not outrank the engine.
    expect(poles).toEqual(["Collective", "Market", "Traditional", "Progressive"]);
    expect(poles).not.toContain("Open");
  });

  it("keeps the contour lines and the archetype markers", () => {
    const container = render(createElement(CompassPlot, PLOT));

    // CLAUDE.md names the contour lines as the design system's one protected
    // decorative exception. The markers are the only thing that says where a
    // respondent sits RELATIVE to the twelve archetypes.
    expect(container.querySelectorAll("[data-compass-contour]")).toHaveLength(4);
    expect(container.querySelectorAll("[data-compass-archetype]")).toHaveLength(12);
  });

  it("drops the decoration the mock is right to cut", () => {
    const container = render(createElement(CompassPlot, PLOT));

    expect(container.querySelector("[data-compass-moderate]")).toBeNull();
    expect(container.querySelector("[data-compass-pulse]")).toBeNull();
    expect(container.textContent).not.toContain("Libertarian left");
  });

  it("still reports the coordinates in words and in numbers", () => {
    const container = render(createElement(CompassPlot, PLOT));

    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Political compass plot. Economic: -0.40, Cultural: +0.30",
    );
    expect(container.querySelector("[data-compass-readout]")!.textContent).toBe("-0.40, +0.30");
  });
});
```

Add `CompassPlot` to the file's imports.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/results-chrome.test.ts`
Expected: FAIL — six new tests; no `data-compass-*` hooks, `INNER` is 248, and the whisper labels are still present.

- [ ] **Step 3: Implement**

In `src/components/results/CompassPlot.tsx`:

1. Change the geometry constant:

```tsx
const SIZE = 400;
// 300px plot square, per mock 7a, inside the existing 400-unit viewBox. The
// 50px margin holds the four mono pole labels at an 8px inset.
const PADDING = 50;
const INNER = SIZE - PADDING * 2;
```

2. Replace the background rect and everything from the quadrant tints down to the cardinal axis labels (that is, the four tint `rect`s, the contour block, the moderate-zone `rect`, the two crosshair `line`s, the four whisper `text`s and the four cardinal `text`s) with:

```tsx
        {/* Plot background */}
        <rect
          data-compass-frame
          x={PADDING}
          y={PADDING}
          width={INNER}
          height={INNER}
          style={{ fill: 'var(--surface-1)', stroke: 'var(--border-secondary)' }}
          strokeWidth={1}
        />

        {/* 50px grid. --rule-hairline is the barely-there pair (Stone 50 /
            Stone 900); a `stroke-stone-50` literal would read as near-white
            hairlines on a dark ground. */}
        {[1, 2, 3, 4, 5].map((k) => (
          <g key={k}>
            <line
              data-compass-grid
              x1={PADDING + k * 50} y1={PADDING} x2={PADDING + k * 50} y2={SIZE - PADDING}
              style={{ stroke: 'var(--rule-hairline)' }}
              strokeWidth={1}
            />
            <line
              data-compass-grid
              x1={PADDING} y1={PADDING + k * 50} x2={SIZE - PADDING} y2={PADDING + k * 50}
              style={{ stroke: 'var(--rule-hairline)' }}
              strokeWidth={1}
            />
          </g>
        ))}

        {/* Contour lines — CLAUDE.md's one protected decorative exception. */}
        {CONTOUR_PATHS.map((d, i) => (
          <path
            key={i}
            data-compass-contour
            d={d}
            fill="none"
            style={{ stroke: 'var(--stone-500)' }}
            strokeWidth={0.6}
            opacity={0.15}
          />
        ))}

        {/* Crosshairs */}
        <line
          x1={CENTER_X} y1={PADDING} x2={CENTER_X} y2={SIZE - PADDING}
          style={{ stroke: 'var(--border-secondary)' }}
          strokeWidth={1}
        />
        <line
          x1={PADDING} y1={CENTER_Y} x2={SIZE - PADDING} y2={CENTER_Y}
          style={{ stroke: 'var(--border-secondary)' }}
          strokeWidth={1}
        />

        {/* Pole labels, inside the square at an 8px inset. The vertical pair
            keeps the engine's orientation, not the mock's — see D12. */}
        <text data-compass-pole x={PADDING + 8} y={CENTER_Y} fontSize={11} letterSpacing="0.02em" dominantBaseline="middle" style={{ fill: 'var(--text-label)', fontFamily: 'var(--font-mono)' }}>
          Collective
        </text>
        <text data-compass-pole x={SIZE - PADDING - 8} y={CENTER_Y} fontSize={11} letterSpacing="0.02em" textAnchor="end" dominantBaseline="middle" style={{ fill: 'var(--text-label)', fontFamily: 'var(--font-mono)' }}>
          Market
        </text>
        <text data-compass-pole x={CENTER_X} y={PADDING + 14} fontSize={11} letterSpacing="0.02em" textAnchor="middle" style={{ fill: 'var(--text-label)', fontFamily: 'var(--font-mono)' }}>
          Traditional
        </text>
        <text data-compass-pole x={CENTER_X} y={SIZE - PADDING - 8} fontSize={11} letterSpacing="0.02em" textAnchor="middle" style={{ fill: 'var(--text-label)', fontFamily: 'var(--font-mono)' }}>
          Progressive
        </text>
```

Delete the now-unused `modInset` / `modX` / `modY` / `modW` / `modH` locals.

3. In the archetype-marker block, tag the group and put its label in mono:

```tsx
              <g key={a.id} data-compass-archetype opacity={isPrimary ? 0.75 : 0.4}>
```

and on the marker's `<text>`, replace `fontFamily="inherit"` with `style={{ fill: 'var(--text-label)', fontFamily: 'var(--font-mono)' }}` (dropping the separate `style` that set only `fill`).

4. Replace the two pulse-ring circles and the respondent dot with a single dot:

```tsx
        {/* 12px ink dot. --text-primary, not var(--stone-900): Stone 900 ink
            on a Stone 900 ground is invisible, and this token is already the
            ink pair that inverts. */}
        <circle data-compass-dot cx={dotX} cy={dotY} r={6} style={{ fill: 'var(--text-primary)' }} />
```

5. Retag the leader line and the coordinate label onto the label colour:

```tsx
        <line
          x1={flipLeader ? dotX - 16 : dotX + 16}
          y1={dotY}
          x2={leaderEndX}
          y2={dotY}
          style={{ stroke: 'var(--text-label)' }}
          strokeWidth={0.6}
        />

        <text
          data-compass-readout
          x={labelX}
          y={dotY}
          textAnchor={labelAnchor}
          fontSize={11}
          letterSpacing="0.02em"
          style={{ fill: 'var(--text-label)', fontFamily: 'var(--font-mono)' }}
          dominantBaseline="middle"
        >
          {economicLabel}, {culturalLabel}
        </text>
```

6. Widen the wrapper so the square renders at its stated size:

```tsx
        className="w-full max-w-[400px]"
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/results-chrome.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/results/CompassPlot.tsx tests/unit/results-chrome.test.ts
git commit -m "feat(design): square the compass plot onto the mock's grid, keeping its contours"
```

---

### Task 10: `ResultsView` — page shell, header, jump nav, sections

**Files:**
- Modify: `src/components/results/ResultsView.tsx` (full rewrite)
- Modify: `tests/unit/results-chrome.test.ts` — append a `describe`

**Interfaces:**
- `ResultsViewProps` is unchanged.
- Passes `actions` into `ArchetypeCard` (Task 7) and drops `alternateRow` from `AxisBreakdownCard` (Task 4). This is the task that clears the expected `tsc` error from Task 5.

**Must not change.** URL-encoded results, `showScoring` toggling, per-card expansion, the copy-confirmation timer, the compare-input flow, `:target` behaviour, and every `FadeInSection` wrapper with its delays. Three Playwright assertions are coupled to copy and roles here and must keep passing verbatim: `getByText("Assessment results")`, `getByRole("button", { name: "Compare with someone" })`, and `getByPlaceholder("Paste their results link")`.

**Layout, from mock 7a.** Body capped at `max-w-results` (820px) with the nav's gutters, 48px top padding. Header: eyebrow → `display-page` title → 16px/1.6 sub → jump nav at 11px mono with a rule above and below. Each section: 40px above, eyebrow → `display-m` → `caption-italic` at `max-w-[60ch]` → a white panel at `p-7`. Domain groups carry a 2px domain rule with the domain name in the domain colour and the axis count right-aligned.

- [ ] **Step 1: Write the failing tests**

Append to `tests/unit/results-chrome.test.ts`:

```ts
describe("ResultsView", () => {
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
    confidence: "high",
    tension: { detected: i === 4, level: "moderate", direction: "principles_A_but_budget_B", narrative: null },
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
      secondary: { name: "The Communitarian Steward", matchPercentage: 61, summary: "" },
      isBlended: false,
      isDistinctive: false,
    },
    encoded: "abc123",
  };

  it("caps the column at the mock's width and takes the nav's gutters", () => {
    const container = render(createElement(ResultsView, PROPS));
    const main = container.querySelector("main")!;
    const column = container.querySelector("[data-results-column]")!;

    // max-w-results (820px), NOT max-w-3xl (768px) and not max-w-shell (1040px,
    // which NavBar and Footer keep).
    expect(classes(column)).toContain("max-w-results");
    expect(classes(main)).toContain("px-[18px]");
    expect(classes(main)).toContain("min-[560px]:px-7");
  });

  it("leads with the eyebrow, the archetype at display-page, and the match sub", () => {
    const container = render(createElement(ResultsView, PROPS));

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
    const container = render(createElement(ResultsView, PROPS));
    const nav = container.querySelector("nav")!;

    expect(classes(nav)).toContain("border-y");
    expect(classes(nav)).toContain("border-border-secondary");
    expect(classes(nav)).toContain("label-nav");
    expect(nav.querySelectorAll("a")).toHaveLength(5);
  });

  it("heads each domain group with a 2px rule in the domain's own colour", () => {
    const container = render(createElement(ResultsView, PROPS));
    const groups = [...container.querySelectorAll("[data-domain-head]")] as HTMLElement[];

    expect(groups).toHaveLength(4);
    expect(groups[1].style.borderTopColor).toBe("var(--domain-power)");
    expect(classes(groups[1])).toContain("border-t-2");
    // The name takes the same mark, so it steps with the rule above it.
    const name = groups[1].querySelector("[data-domain-name]") as HTMLElement;
    expect(name.textContent).toBe("Power and Authority");
    expect(name.style.color).toBe("var(--domain-power)");
    expect(groups[1].querySelector("[data-domain-count]")!.textContent).toBe("4 axes");
  });

  it("draws a tension as a warning-ruled panel, not a badge", () => {
    const container = render(createElement(ResultsView, PROPS));
    const panels = [...container.querySelectorAll("[data-tension-panel]")];

    expect(panels).toHaveLength(1);
    // Delta 04: a 2px domain-or-warning colour on a callout's left edge.
    expect(classes(panels[0])).toContain("border-l-2");
    expect(classes(panels[0])).toContain("border-l-warning");
    expect(panels[0].querySelector("[data-tension-title]")!.textContent).toBe(
      "Moderate tension · Axis 5",
    );
    // The circled "!" glyph it replaced carried no information the title
    // did not already carry.
    expect(container.textContent).not.toContain("!");
  });

  it("hands the copy and compare controls to the archetype panel", () => {
    const container = render(createElement(ResultsView, PROPS));
    const grid = container.querySelector("[data-archetype-grid]")!;

    // Mock 7a draws them inside the panel; they used to sit in a bar below it.
    // The e2e suite drives both by accessible name.
    expect(grid.textContent).toContain("Copy link");
    expect(grid.textContent).toContain("Compare with someone");
  });

  it("toggles the scoring disclosures for every row at once", () => {
    const container = render(createElement(ResultsView, PROPS));
    const toggle = container.querySelector("[data-scoring-toggle]") as HTMLButtonElement;

    expect(container.textContent).not.toContain("See how this was scored");
    act(() => toggle.click());
    expect(container.querySelectorAll("[aria-expanded='false']").length).toBeGreaterThanOrEqual(12);
  });
});
```

Add `ResultsView` to the file's imports.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/results-chrome.test.ts`
Expected: FAIL — eight new tests.

- [ ] **Step 3: Implement**

Replace `src/components/results/ResultsView.tsx` in full. Keep the `AxisDisplayData` and `ResultsViewProps` interfaces byte-identical to today's; only the body below `SECTION_IDS` changes, plus the two action components' classes.

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CompassPlot } from "./CompassPlot";
import { ArchetypeCard } from "./ArchetypeCard";
import { RadarChart } from "./RadarChart";
import { AxisBreakdownCard } from "./AxisBreakdownCard";
import { Button } from "@/components/Button";
import { DOMAIN_COLORS, DOMAIN_MARK_VARS, type DomainKey } from "@/lib/design-tokens";
import { FadeInSection } from "@/components/FadeInSection";
```

(`AxisDisplayData` and `ResultsViewProps` are unchanged — copy them across verbatim.)

```tsx
function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button variant="secondary" onClick={handleCopy}>
      {copied ? "Copied!" : "Copy link"}
    </Button>
  );
}

function CompareInput({ myEncoded }: { myEncoded: string }) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");
  const router = useRouter();

  const handleCompare = () => {
    // Extract the ?r= param from a pasted URL, or use the raw value
    const match = link.match(/[?&]r=([A-Za-z0-9_-]+)/);
    const theirEncoded = match ? match[1] : link.trim();
    if (!theirEncoded) return;
    router.push(`/compare?a=${myEncoded}&b=${theirEncoded}`);
  };

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Compare with someone
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <input
        type="text"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCompare()}
        placeholder="Paste their results link"
        autoFocus
        className="flex-1 min-w-0 rounded-sharp border border-border-primary px-3 py-2 body-s bg-surface-1 text-text-primary placeholder:text-text-label focus-ring"
      />
      <Button variant="secondary" onClick={handleCompare} disabled={!link.trim()}>
        Compare
      </Button>
      <Button variant="tertiary" onClick={() => { setOpen(false); setLink(""); }}>
        Cancel
      </Button>
    </div>
  );
}

const SECTION_IDS = {
  archetype: "archetype",
  radar: "radar",
  tensions: "tensions",
  breakdown: "breakdown",
  compass: "compass",
};

const PANEL = "bg-surface-1 border border-border-secondary rounded-sharp";

/** Eyebrow, heading and caption — the same three-line opener on four sections. */
function SectionHead({ eyebrow, title, caption }: { eyebrow: string; title: string; caption: string }) {
  return (
    <>
      <p className="label-eyebrow text-text-label mb-1.5">{eyebrow}</p>
      <h2 className="display-m text-text-primary mb-1.5">{title}</h2>
      <p className="caption-italic max-w-[60ch] mb-[18px]">{caption}</p>
    </>
  );
}

export function ResultsView({ axisData, compass, archetype, encoded }: ResultsViewProps) {
  const domainKeys: DomainKey[] = ["economic", "power", "society", "world"];
  const domains = domainKeys.map((key) => ({
    key,
    name: DOMAIN_COLORS[key].name,
    mark: DOMAIN_MARK_VARS[key],
    axes: axisData.filter((a) => a.domain === DOMAIN_COLORS[key].name),
  }));

  const tensionAxes = axisData.filter((a) => a.tension.detected);
  const [showScoring, setShowScoring] = useState(false);

  return (
    <main className="min-h-screen pt-12 pb-14 px-[18px] min-[560px]:px-7 overflow-x-hidden">
      <div data-results-column className="mx-auto max-w-results">
        {/* Page header */}
        <FadeInSection>
          <div>
            <p className="label-eyebrow text-text-label mb-3.5">Assessment results</p>
            {archetype.isDistinctive ? (
              <>
                <h1 className="display-page text-text-primary mb-2">A distinctive profile</h1>
                <p data-results-sub className="text-base leading-[1.6] text-text-secondary mb-5">
                  Your positions don&apos;t map to a single governance philosophy — nearest match is {archetype.primary.name} at {archetype.primary.matchPercentage}%.
                </p>
              </>
            ) : (
              <>
                <h1 className="display-page text-text-primary mb-2">{archetype.primary.name}</h1>
                <p data-results-sub className="text-base leading-[1.6] text-text-secondary mb-5">
                  {archetype.primary.matchPercentage}% match — your compass across twelve axes.
                </p>
              </>
            )}
          </div>
        </FadeInSection>

        {/* Section jump links */}
        <FadeInSection delay={100}>
          <nav
            className="flex flex-wrap gap-x-5 gap-y-2 py-3 border-y border-border-secondary label-nav text-text-label"
            aria-label="Page sections"
          >
            <a href={`#${SECTION_IDS.archetype}`} className="hover:text-text-primary transition-colors duration-150 focus-ring">Archetype</a>
            <a href={`#${SECTION_IDS.radar}`} className="hover:text-text-primary transition-colors duration-150 focus-ring">Radar</a>
            <a href={`#${SECTION_IDS.tensions}`} className="hover:text-text-primary transition-colors duration-150 focus-ring">Tensions</a>
            <a href={`#${SECTION_IDS.breakdown}`} className="hover:text-text-primary transition-colors duration-150 focus-ring">Breakdown</a>
            <a href={`#${SECTION_IDS.compass}`} className="hover:text-text-primary transition-colors duration-150 focus-ring">Compass</a>
          </nav>
        </FadeInSection>

        {/* 1. Archetype panel */}
        <FadeInSection delay={200}>
          <section id={SECTION_IDS.archetype} className={`${PANEL} p-[26px] mt-8`}>
            <ArchetypeCard
              primary={archetype.primary}
              secondary={archetype.secondary}
              isBlended={archetype.isBlended}
              isDistinctive={archetype.isDistinctive}
              userScores={axisData.map((a) => a.finalScore)}
              actions={
                <>
                  <CopyLinkButton />
                  {/* Save to account hidden for v1 */}
                  {encoded && <CompareInput myEncoded={encoded} />}
                </>
              }
            />
          </section>
        </FadeInSection>

        {/* 2. Radar */}
        <FadeInSection>
          <section id={SECTION_IDS.radar} className="mt-10">
            <SectionHead
              eyebrow="Full profile"
              title="Twelve-axis radar"
              caption="Each spoke runs from one governance pole at the centre to its counterpart at the perimeter. The dashed ring is neutral; colour groups the axes by domain."
            />
            <div className={`${PANEL} p-7 flex justify-center`}>
              <RadarChart axisScores={axisData} />
            </div>
          </section>
        </FadeInSection>

        {/* 3. Tensions */}
        {tensionAxes.length > 0 && (
          <FadeInSection>
            <section id={SECTION_IDS.tensions} className="mt-10">
              <SectionHead
                eyebrow="Detected tensions"
                title="Principles against priorities"
                caption="A tension is recorded when stated views and budget choices pull in different directions. It is common, and often the most informative part of a profile."
              />
              <div className="space-y-3">
                {tensionAxes.map((axis) => {
                  let narrative = "";
                  if (axis.tension.direction === "principles_B_but_budget_A") {
                    narrative = `Your questionnaire responses lean toward ${axis.poleBLabel}, but your budget priorities suggest ${axis.poleALabel}.`;
                  } else if (axis.tension.direction === "principles_A_but_budget_B") {
                    narrative = `Your questionnaire responses lean toward ${axis.poleALabel}, but your budget priorities suggest ${axis.poleBLabel}.`;
                  }

                  return (
                    <div
                      key={axis.axisId}
                      data-tension-panel
                      className={`${PANEL} border-l-2 border-l-warning px-[22px] py-5`}
                    >
                      <p data-tension-title className="label font-medium text-warning-text mb-1.5 capitalize">
                        {axis.tension.level} tension · {axis.name}
                      </p>
                      {narrative && <p className="body-s text-text-secondary">{narrative}</p>}
                    </div>
                  );
                })}
              </div>
            </section>
          </FadeInSection>
        )}

        {/* 4. Axis breakdown by domain */}
        <FadeInSection>
          <section id={SECTION_IDS.breakdown} className="mt-10">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <h2 className="display-m text-text-primary mb-1.5">Axis breakdown</h2>
              <Button
                variant="tertiary"
                data-scoring-toggle
                onClick={() => setShowScoring((prev) => !prev)}
              >
                {showScoring ? "Hide scoring details" : "Show scoring details"}
              </Button>
            </div>
            <p className="caption-italic max-w-[60ch] mb-[22px]">
              Each axis is scored from −1.00 to +1.00 between its poles, weighted across dilemma choices, scale responses, and the budget allocation.
            </p>

            <div className="flex flex-col gap-[26px]">
              {domains.map((domain) => (
                <div key={domain.key}>
                  <div
                    data-domain-head
                    className="border-t-2 pt-2.5 mb-1.5 flex items-baseline justify-between gap-3"
                    style={{ borderTopColor: domain.mark }}
                  >
                    <p data-domain-name className="label font-medium" style={{ color: domain.mark }}>
                      {domain.name}
                    </p>
                    <p data-domain-count className="mono-meta text-text-label">
                      {domain.axes.length} axes
                    </p>
                  </div>
                  {domain.axes.map((axis) => (
                    <AxisBreakdownCard key={axis.axisId} {...axis} showScoring={showScoring} />
                  ))}
                </div>
              ))}
            </div>
          </section>
        </FadeInSection>

        {/* 5. Compass plot */}
        <FadeInSection>
          <section id={SECTION_IDS.compass} className="mt-10">
            <SectionHead
              eyebrow="Two-dimensional summary"
              title="Compass plot"
              caption="A simplified projection onto two super-dimensions. The twelve-axis radar above remains the primary output."
            />
            <div className={`${PANEL} p-6 flex justify-center`}>
              <CompassPlot
                economic={compass.economic}
                cultural={compass.cultural}
                primaryArchetypeId={archetype.isDistinctive ? undefined : archetype.primary.id}
              />
            </div>
          </section>
        </FadeInSection>
      </div>
    </main>
  );
}
```

Two notes for the implementer:

- The jump nav's `Tensions` link is now unconditional, where it used to be hidden when no tension was detected. That is deliberate: mock 7a rules the nav as a fixed five-item row, and a four-item row with a shifting gap reads as a rendering bug. The anchor simply resolves to nothing when the section is absent, which is the same no-op `:target` behaviour the archetype reference already relies on.
- `border-l-2 border-l-warning` alongside `border border-border-secondary` depends on Tailwind emitting the shorthand width before the longhand. It does in 4.3.3, but this is exactly the kind of ordering subtlety that has bitten this migration — **verify the computed `border-left-width` is `2px` and its colour is `--warning` in the browser during Task 12**, not in jsdom, which computes neither. If it loses, replace those two classes with `style={{ borderLeft: "2px solid var(--warning)" }}` and say so in the PR.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/results-chrome.test.ts && npx tsc --noEmit`
Expected: PASS, and `tsc` is now clean — this task clears the `alternateRow` error Task 5 left standing.

- [ ] **Step 5: Commit**

```bash
git add src/components/results/ResultsView.tsx tests/unit/results-chrome.test.ts
git commit -m "feat(design): restyle the results page shell onto mock 7a"
```

**Addenda from Task 4's code-quality review**, deliberately routed here rather than fixed in Task 4, because both touch the `AxisDisplayData`/`AxisBreakdownCardProps` interface this task owns:

- **Dead surface on `AxisBreakdownCardProps`.** A required `domain: string` is never destructured or used by the component; three `tension` sub-fields (`level`, `direction`, `narrative`) are accepted but never read; and the `AXIS_WEIGHT_PROFILES[axisId] ?? { fc: 0.40, sc: 0.35, bg: 0.25 }` fallback is unreachable in practice and its numbers match none of the three real weight profiles. These were left in Task 4 because the interface is shared with `ResultsView`'s `AxisDisplayData`, which this task owns — trim both together, along with the `alternateRow` removal already scheduled here.
- **`confidence: string` is looser than its source type.** `src/lib/scoring-types.ts:32` defines `"high" | "moderate" | "low" | "conflicted"`, so an unrecognised value currently falls through to `AxisBreakdownCard`'s default branch and silently renders "Low confidence" instead of failing to typecheck. Narrowing it was deferred specifically because doing it in Task 4 would have added a second typecheck error during the Task 4-to-10 interval that this plan already flags as deliberately red (the `alternateRow` removal) — two simultaneous errors would have destroyed the "exactly one error, and it is the expected one" signal that makes that interval safe to leave red. Do this alongside the dead-surface trim above.

---

### Task 11: Drift guards for the results directory

**Files:**
- Modify: `tests/unit/results-chrome.test.ts` — append a final `describe`

**Interfaces:** none. This task adds no source change; it pins what the previous seven tasks established.

**What a guard is for here.** Styling changes resist conventional assertions, and the long-term risk in a token migration is drift, not breakage. Each guard below covers something that, if it regressed, would render *plausibly* — a muddy dot on a dark ground, a label that fails AA, a second primitive quietly reappearing — and would fail nothing else.

- [ ] **Step 1: Write the guards**

Append to `tests/unit/results-chrome.test.ts`:

```ts
describe("results chrome drift guards", () => {
  it("has no source left in the results directory unswept", () => {
    // A sanity check on the sweep itself: if a component is added or renamed,
    // every guard below silently stops covering it. ScoreBar's absence is
    // pinned here as well as in results-dead-code, because this list is what
    // a future author reads when adding a file.
    expect(resultsSources.map((s) => s.name).sort()).toEqual([
      "ArchetypeCard.tsx",
      "AxisBreakdownCard.tsx",
      "CompassPlot.tsx",
      "RadarChart.tsx",
      "ResultsView.tsx",
    ]);
  });

  it("retires text-text-tertiary from the results page", () => {
    // Stone 500 measures 2.73:1 on the page ground and 3.28:1 on the panels —
    // under AA for small text either way. D7 routes the label layer through
    // --text-label; prose moves to --text-secondary. D6 defers layout on
    // undrawn screens, not this.
    const offenders = resultsSources
      .filter(({ text }) => text.includes("text-text-tertiary"))
      .map(({ name }) => name);

    expect(offenders).toEqual([]);
  });

  it("routes every data mark through the stepping tokens", () => {
    // getDomainColor600 returns a fixed hex, which cannot invert. Delta 06
    // steps every dot, track, rule and domain label to its 400 tone on a dark
    // ground. The reference pages (/axes, /questions) keep the fixed accessor
    // deliberately — they are D6-deferred and their 600 tone is intended in
    // both modes — so this guard is scoped to this directory.
    const offenders = resultsSources
      .filter(({ text }) => /getDomainColor600|DOMAIN_COLORS\[[^\]]+\]\[600\]/.test(text))
      .map(({ name }) => name);

    expect(offenders).toEqual([]);
    // The positive half: the stepping accessors are actually in use, so the
    // assertion above cannot pass by every domain colour having been dropped.
    expect(
      resultsSources.filter(({ text }) => /getDomainMarkVar|DOMAIN_MARK_VARS/.test(text)),
    ).toHaveLength(3);
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
    const offenders = resultsSources
      .filter(({ text }) => text.includes("--domain-economic"))
      .map(({ name }) => name);

    expect(offenders).toEqual([]);
    expect(
      resultsSources.filter(({ text }) => text.includes("var(--mark-primary)")).map((s) => s.name).sort(),
    ).toEqual(["ArchetypeCard.tsx", "RadarChart.tsx"]);
  });

  it("keeps fixed ramp literals out of the ink and mark positions", () => {
    // The bug this project has shipped twice: a Stone ramp literal where an
    // inverting token belongs. The ramp is fixed across modes, so
    // var(--stone-900) as a fill reads as near-black ink on a near-black
    // ground. var(--stone-500) survives deliberately — it is the same value in
    // both modes and is the mini radar's prototype stroke.
    const offenders = resultsSources.flatMap(({ name, text }) =>
      [...text.matchAll(/var\(--stone-(900|800|700|600|100|50)\)/g)].map(
        ([match]) => `${name}: ${match}`,
      ),
    );

    expect(offenders).toEqual([]);
  });

  it("never layers a colour over a self-contained role", () => {
    // `caption-italic` declares its own `color`. Layering `text-*` beside it
    // is banned — whether the custom rule wins depends on Tailwind's emitted
    // order, which is too subtle to rely on.
    const offenders = resultsSources.flatMap(({ name, text }) =>
      [...text.matchAll(/className="([^"]*\bcaption-italic\b[^"]*)"/g)]
        .filter(([, classNames]) => /\btext-(?!\[)[a-z-]+\b/.test(classNames))
        .map(([, classNames]) => `${name}: ${classNames}`),
    );

    expect(offenders).toEqual([]);
  });

  it("keeps the zebra fill retired", () => {
    // Delta 04: rules carry structure, and a list separated by 1px Stone 200
    // does not also need an alternating surface. The prop is gone from the
    // interface, so this guard is about the idiom not creeping back in via
    // a nth-child or an index modulo.
    const offenders = resultsSources
      .filter(({ text }) => /alternateRow|i % 2|odd:bg-|even:bg-/.test(text))
      .map(({ name }) => name);

    expect(offenders).toEqual([]);
  });

  it("routes every focus ring and corner through the shared utilities", () => {
    // Duplicated from the repo-wide guardrails on purpose: those scan `src`
    // and would report a violation here as an anonymous path in a long list.
    // This one names the file, which is what a reviewer of THIS phase needs.
    const offenders = resultsSources.flatMap(({ name, text }) =>
      [...text.matchAll(/outline-none|focus-visible:outline-|rounded-(?:lg|xl|\[(?:8|12)px\])/g)].map(
        ([match]) => `${name}: ${match}`,
      ),
    );

    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the guards**

Run: `npx vitest run tests/unit/results-chrome.test.ts`
Expected: PASS. Any red here is a real finding from Tasks 4–10, not a bad guard — fix the source, not the assertion.

- [ ] **Step 3: Prove the guards by mutation**

A guard that passes vacuously is worse than no guard, and this phase's tokens are exactly the kind that make a mutation invisible. Apply each mutation, confirm the expected suite reddens, then revert it. **Record the result of each in the PR description**, including any that fail to redden.

| # | Mutation | Must redden |
| --- | --- | --- |
| 1 | `RadarChart.tsx`: `var(--mark-primary)` → `var(--domain-economic)` on the user polygon | `never names --domain-economic where --mark-primary is meant` |
| 2 | `ArchetypeCard.tsx`: `border-rule-strong` → `border-stone-900` on the label rule | `puts the section label over a hard ink rule` |
| 3 | `AxisBreakdownCard.tsx`: delete `min-[560px]:grid-cols-[24px_minmax(0,1fr)_210px]` | `lays the row out on the mock's three-column grid` |
| 4 | `AxisBreakdownCard.tsx`: re-add `bg-surface-2` to the row wrapper | `separates rows by a rule instead of a zebra fill` |
| 5 | `PairedAxisScale.tsx`: `getDomainMarkVar(axisId)` → `domain[600]` on dot A | `steps respondent A's dot to its domain mark` |
| 6 | `PairedAxisScale.tsx`: in `describePosition`, `0.45` → `0.5` | `puts each boundary in the bucket above it` |
| 7 | `CompassPlot.tsx`: `var(--text-primary)` → `var(--stone-900)` on the dot | `plots the respondent as a 12px ink dot that inverts` **and** `keeps fixed ramp literals out of the ink and mark positions` |
| 8 | `CompassPlot.tsx`: swap the `Traditional` and `Progressive` label positions | `keeps the compass pointing the way the scoring engine does` |
| 9 | `ResultsView.tsx`: `DOMAIN_MARK_VARS[key]` → `DOMAIN_COLORS[key][600]` on the domain rule | `heads each domain group with a 2px rule` **and** `routes every data mark through the stepping tokens` |
| 10 | `globals.css`: dark `--domain-power` → `var(--slate-600)` | `steps every domain mark from its 600 tone to its 400 tone in dark` |
| 11 | `globals.css`: delete `line-height: 1.6` from `body-s` | `names the delta's most-used sans size` |
| 12 | `ComparisonScoreBar.tsx`: reinstate a local `delta <= 0.3 ? "very close" : ...` ladder | `labels the gap from the shared buckets, not a local ladder` |

Mutation 10 is the one worth dwelling on: a guard written against the *light* value only would pass, because that is where the two tokens agree. Every token in this phase has to be asserted on both sides.

- [ ] **Step 4: Commit**

```bash
git add tests/unit/results-chrome.test.ts
git commit -m "test(design): guard the results page against design drift"
```

**Addendum (reconciled after Task 5).** `resultsSources` is built from `readdirSync` scoped to `src/components/results/`, so every guard in this task only ever sees that one directory. Task 5 shipped the gap: its `text-text-tertiary` violation (see Task 5's "As shipped" note) landed at `src/app/results/[profileId]/[axisId]/page.tsx` — the same feature, under `src/app`, not `src/components/results` — and none of these guards would have caught it; it surfaced only because a human review pass happened to look at that file. The eventual guard here should also sweep `src/app/results/**`, not just `src/components/results/`. `tests/helpers/source-files.ts`, extracted in Task 5, already does a recursive extension-filtered sweep with `node_modules`/`generated`/dot-directory pruning built in, so it is the right tool for that recursive sweep rather than a second hand-rolled `readdirSync` walk. Left as an addendum rather than a rewrite of the guards above — this task's implementer should act on it.

---

### Task 12: Full verification and the two-mode visual check

**Files:** none, unless a gate finds something.

**Interfaces:** none.

- [ ] **Step 1: Run all five gates**

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: `npm test` reports **60 files** with **676 + the new tests** passing — `results-chrome.test.ts` is the 61st file, so expect 61 files. Lint runs at `--max-warnings=0`; a new warning is a fix, never a raised threshold.

If the lockfile changed for any reason, run `npm ci` **before** re-running these — a stale `node_modules` makes a local green disagree with CI.

- [ ] **Step 2: Run the e2e suite**

Start the database first, and make sure no other dev server is already holding port 3000 — Playwright will happily adopt a stranger's server and produce a wall of failures that have nothing to do with this diff:

```bash
docker compose up -d --wait postgres
lsof -i :3000 || echo "port 3000 free"
npm run test:e2e
```

Expected: PASS. Three assertions in `tests/e2e/results.spec.ts` are coupled to this phase's markup — `getByText("Assessment results")`, `getByRole("button", { name: "Compare with someone" })` and `getByPlaceholder("Paste their results link")` — and must pass **unmodified**. If a Playwright browser install fails against Google's apt repository in under a minute, that is the known flake, not this diff: re-run.

- [ ] **Step 3: Check `/results` in both colour schemes, on the production build**

The dark pass is where this phase earns its keep. Use the production build — `next dev` reload-loops under a driven browser and resets React state mid-inspection:

```bash
npm run build && npm start
```

Then, for each of `prefers-color-scheme: light` and `dark`, open a URL-encoded result (complete the quiz once, or reuse an `?r=` string from `tests/e2e/results.spec.ts`) and confirm:

1. **No muddy marks.** Every axis dot, every domain rule, every domain name and the radar's twelve vertices are visibly lighter in dark than in light. If any one of them looks the same in both, it is still reading a fixed hex.
2. **The archetype panel.** The `Primary archetype` rule is hard ink in light and near-white in dark, and the `Adjacent ·` rule is barely-there in both.
3. **The tension panel's left border is 2px and `--warning`-coloured.** This is the `border-l-2` ordering question flagged in Task 10 — measure it in devtools rather than eyeballing it, and apply the inline-style fallback if it lost.
4. **The compass square measures 300px** and its grid is visible-but-quiet in both modes.
5. **Keyboard focus.** Tab through the jump nav, `Copy link`, `Compare with someone`, `Learn more`, `Show scoring details` and one row's scoring disclosure. Every one draws a 2px Stone 600 ring at 2px offset; none draws a ring on a mouse click.
6. **Behaviour.** `Copy link` shows `Copied!` for 2s; `Compare with someone` opens the input and a pasted `?r=` URL routes to `/compare`; `Show scoring details` reveals twelve disclosures; each jump link scrolls to its section.
7. **`PairedAxisScale`'s endpoint labels wrap correctly at narrow viewports.** Task 5 moved these to 11px uppercase mono via `label-tight`, replacing sentence-case sans; the longest pole pair may now wrap onto two lines at narrow widths. Task 5 also added `text-right` to the second endpoint span so a wrapped pole B stays right-aligned rather than ragged-left — confirm it actually does.
8. **The per-axis detail page's restored "Composite score" label reads as hierarchy, not mismatch.** Task 5 restored it on `text-text-label`, which in light mode is visibly darker than the three sibling `text-text-tertiary` labels beside it (`Forced choice`, `Scaled`, `Budget`). Confirm that difference reads as intentional emphasis rather than a styling inconsistency; the two tokens are byte-identical in dark mode, so this is a light-mode-only check.

Capture one screenshot per mode for the PR.

- [ ] **Step 4: Reconcile the plan with what shipped**

Before opening the PR, re-read this document against the diff. Plan and artifact drift apart in predictable ways — a comment describing an approach that was replaced, an assertion that verifies less than its title claims, a decision that was revised mid-task without being written down. Correct this file where it no longer describes the code, and note any decision that changed in the PR description.

- [ ] **Step 5: Open the PR**

```bash
git push -u origin feat/design-delta-results
gh pr create --title "feat(design): design system delta — phase 4 results page" --body "..."
```

The body should carry: the issue reference (`Closes #135`), the mutation table results from Task 11 Step 3 with any mutation that failed to redden called out honestly, both screenshots, and an explicit list of the decisions this phase made beyond the issue's scope list (D8–D15 above).

---

## Deferred to later phases

Recorded here so they are not rediscovered as bugs:

- **`/compare`, `/groups` and the per-axis detail page keep their layouts.** Tasks 5 and 6 changed their score-bar primitive and nothing else. Their surrounding chrome — `text-[11px] uppercase tracking-[0.08em]` domain headers, `text-stone-800` literals, zebra rows — is phase 5's sweep under D6.
- **The home domain footer still draws its axis borders from `getDomainColor600`.** `src/app/page.tsx:159` keeps the fixed hex, so those borders stay at the 600 tone on a dark ground. It is a drawn screen that phase 2 shipped; changing it here would be drift into a merged phase. Phase 5 or 6 should sweep it now that `getDomainMarkVar` exists.
- **`ComparisonRadar` keeps `getDomainColor600`** for the same reason, and is a larger job than a token swap because it draws two respondents' polygons.
- **`--container-results` is the second of four page widths the delta implies** (1040 shell, 820 results, 672 quiz, 660 reference). The quiz and reference widths are still spelled as Tailwind literals. Phase 5 should decide whether they become tokens too.

---

## Self-Review

Checked against `docs/superpowers/specs/2026-09-08-design-system-delta-design.md` and issue #135:

- **Issue scope, bullet by bullet.** `ScoreBar`/`ComparisonScoreBar` convergence → Tasks 4, 5, 6. Header, eyebrow, `display-page`, 16px sub, ruled jump nav → Task 10. `ArchetypeCard` grid, ink rule, `display-l` match, action row, adjacent line, 200px mini radar → Task 7. `RadarChart` spokes, rings, polygon, dots, labels, unchanged mapping → Task 8. Tensions panel → Task 10. `AxisBreakdownCard` domain groups and `24px 1fr 210px` rows → Tasks 4 and 10. `CompassPlot` → Task 9. Dark-mode 600→400 step → Task 1, applied throughout. "Write the plan first" → this document. Five gates plus the two-mode visual check → Task 12.
- **Issue comments.** The carried-over `PairedAxisScale` label → Task 3. The unnamed 13.5px role and the budget track → Task 2.
- **Spec deltas.** 01 (mono layer, serif scale) → Tasks 4, 7, 8, 9, 10. 02 (near-square corners) → the `rx` drops in Tasks 8 and 9, guarded in 11. 03 (buttons) → Tasks 7 and 10 route every control through `Button`. 04 (rules carry structure) → the zebra retirement in Task 4, the domain rules and panel borders in Task 10. 05 (paired axis scale) → Tasks 3–6. 06 (dark mode inverts) → Task 1 and every mark that consumes it.
- **Placeholder scan.** No TBDs; every step that changes code shows the code, and every test step shows the assertions.
- **Type consistency.** `getDomainMarkVar(axisId: number): string` and `DOMAIN_MARK_VARS: Record<DomainKey, string>` (Task 1) are used under those exact names in Tasks 3, 4, 8 and 10. `describeGap(gap: number)` and `describePosition(score, poleA, poleB)` (Task 3) are used under those names in Task 6. `ArchetypeCardProps.actions?: ReactNode` (Task 7) is supplied in Task 10. `GroupScoreBarProps.axisId` (Task 5) is supplied at its one call site in the same task. `AxisBreakdownCardProps` loses `alternateRow` in Task 4 and the caller drops it in Task 10 — the one deliberately-red interval in the plan, flagged in both tasks.

**Known gap, stated rather than papered over:** no unit test covers the *rendered* dark-mode appearance of anything in this phase. jsdom computes no custom properties, and Playwright's `colorScheme` option would give a screenshot diff this repo has no baseline infrastructure for. The tokens are asserted on both sides in the stylesheet (Task 1), the call sites are asserted to name the stepping token rather than a hex (Tasks 3, 7, 8, 9, 11), and the composition of the two is verified by hand in Task 12 Step 3. That is the seam, and it is why Step 3 is not optional.

---

## Deferred / non-blocking backlog

Items consciously punted during the build. None block shipping. Listed here so they don't fall out of memory.

- **`tests/unit/results-chrome.test.ts`'s render harness is a fifth near-verbatim copy.** The `render` helper, `classes`, and the `afterEach` cleanup block introduced in Task 4 duplicate the same trio already living in `tests/unit/quiz-chrome.test.ts`, `footer-chrome`, `home-page`, and `account-actions`. `vitest.config.ts` includes only `tests/**/*.test.ts`, so a `tests/helpers/react-dom.ts` module would not itself be collected as a suite and is a clean home for the shared code. Deferred because extracting it mid-phase touches five existing test files at once and makes a red suite ambiguous — whose change broke it. Worth doing after phase 4 lands.
