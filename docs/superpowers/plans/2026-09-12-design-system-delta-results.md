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

**Amended after Task 7 (commit `39b79ac`).** The scoring disclosure this task shipped carried a WCAG 2.5.3 (Label in Name) defect — a visible `▸ See how this was scored` under `aria-label="Show scoring breakdown for {name}"`, which shares no words with it, so the accessible name replaced the visible label and the control stopped matching by voice. Task 7 hit the identical defect in its own draft, and fixed both: the `aria-label` is gone, the axis name moves to a `sr-only` suffix that *extends* the name, the expanded state is dropped (`aria-expanded` already carries it), and the `▸`/`▾` caret is wrapped in `aria-hidden` to match every other disclosure caret in the repo. The code block in Step 3 above therefore no longer matches `src/components/results/AxisBreakdownCard.tsx` at that one `<button>`; see Task 7's out-of-plan note for the shipped form.

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
- Modify: `src/app/compare/[profileId1]/[profileId2]/page.tsx` — second call site, also stops passing `delta`
- Modify: `src/components/results/AxisBreakdownCard.tsx` — moves onto the shared formatter
- Modify: `src/lib/comparison-radar-data.ts` — drops its own `formatScore`
- Modify: `src/components/comparison/ComparisonRadar.tsx` — imports the shared formatter instead
- Create: `src/lib/format-score.ts`
- Modify: `tests/unit/results-chrome.test.ts` — append a `describe`
- Modify: `tests/unit/comparison-radar-data.test.ts` — moves its pinned formatter test onto the shared import

**Interfaces:**
- Consumes: `PairedAxisScale` and `describeGap` (Task 3).
- Removes: the component's `useState`, its two hover tooltips, and its local `deltaLabel` ladder, **and the fourth copy of the same ladder at `src/app/compare/page.tsx:47`**.
- `delta` is removed from `ComparisonScoreBarProps`. The component derives it as `Math.abs(scoreA - scoreB)` from the two scores it already receives. `/compare`'s layout is untouched; only the bar converges. Phase 5 restyles the page.

**Why the tooltips go (D10).** They were mouse-only — no keyboard path, no screen-reader path — and they showed exactly the information mock 7a puts permanently on the axis-name line. Two always-visible mono readouts replace them, and `describeGap` puts the same bucket thresholds into the scale's `aria-label`, so for the first time a screen-reader user on `/compare` gets both positions and the relationship.

**There is a fourth copy of these buckets, and it is on the same page.** Task 3's code review found `src/app/compare/page.tsx:47` holds its own `deltaLabel` with the *pre-convergence* strings, rendered visibly at lines 162 and 171 in the "most aligned" / "furthest apart" lists. `describeGap` reworded one bucket — `very close` → `close agreement` — so without this, `/compare` would say `Governance Structure — very close` in its aligned list and `close agreement` on the bar for that same axis, a few hundred pixels apart: same thresholds, same data, two vocabularies. Delete the local function and call `describeGap` at both sites. This is five lines and stays inside "only the bar converges" — D10 defers `/compare`'s *layout* to phase 5, not its correctness. The other three buckets were kept verbatim precisely to keep this fold to one changed string.

Note the two spans at lines 162 and 171 carry `text-text-tertiary`, which this phase's constraints ban. Leave them — `/compare`'s sweep is phase 5, and Task 11's guardrail is scoped to `src/components/results/`.

**The dot roles swap, and the page's legend says so.** Today `ComparisonScoreBar` draws **A as a ring and B as a filled dot**. `PairedAxisScale` draws the reverse — delta 05 specifies respondent A as the filled domain dot and respondent B as the outlined one. `src/app/compare/page.tsx:186` reads *"Ring marker is you, filled dot is them."* and becomes wrong the moment this task lands. Fixing the copy is part of this task, not a follow-up.

- [x] **Step 1: Write the failing tests**

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
```

Add `import { ComparisonScoreBar } from "@/components/comparison/ComparisonScoreBar";` and `import { getDomainMarkVar } from "@/lib/design-tokens";` to the file's imports.

- [x] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/results-chrome.test.ts`
Expected: FAIL — no `[data-readout]`, two `[data-track]` elements, and the `aria-label` still names only the poles.

- [x] **Step 3: Implement**

Replace `src/components/comparison/ComparisonScoreBar.tsx` in full. Note the tagline below uses `body-xs text-text-label`, not the raw `text-xs leading-[1.5]` pair — `body-xs` now exists (added in Task 4) precisely so this row does not reintroduce it:

```tsx
"use client";

import { PairedAxisScale, describeGap } from "@/components/PairedAxisScale";
import { getDomainMarkVar } from "@/lib/design-tokens";
import { formatScore } from "@/lib/format-score";

interface ComparisonScoreBarProps {
  axisId: number;
  axisName: string;
  tagline: string;
  scoreA: number;
  scoreB: number;
  poleALabel: string;
  poleBLabel: string;
  labelA: string;
  labelB: string;
  alternateRow?: boolean;
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
 *
 * `delta` is not a prop: it is derived here from the same two scores the
 * scale draws, so the visible gap badge and the scale's `aria-label` can
 * never disagree by construction. (An earlier version of this task kept
 * `delta` as an incoming prop, mirroring `compareProfiles`'s own field of the
 * same name — but that gave the badge and the scale two independent code
 * paths for one number, which is exactly the kind of duplication this
 * convergence exists to remove.)
 */
export function ComparisonScoreBar({
  axisId,
  axisName,
  tagline,
  scoreA,
  scoreB,
  poleALabel,
  poleBLabel,
  labelA,
  labelB,
  alternateRow = false,
}: ComparisonScoreBarProps) {
  const delta = Math.abs(scoreA - scoreB);

  return (
    <div className={`rounded-sharp px-3 py-[9px] ${alternateRow ? "bg-surface-2" : ""}`}>
      <div className="flex items-baseline justify-between gap-3 mb-0.5">
        <span className="body-s text-text-primary">{axisName}</span>
        {/* aria-hidden: byte-identical to the scale's aria-label trailing
            clause below, so a screen reader would otherwise hear it twice
            per row, twelve times down the page. */}
        <span data-gap aria-hidden="true" className="mono-meta text-text-label shrink-0">
          {describeGap(delta)}
        </span>
      </div>
      <p className="body-xs text-text-label mb-2">{tagline}</p>

      {/* The tooltips this replaced were the only thing mapping a
          respondent's name to a specific dot. `/compare/[id]/[id]` has no
          legend at all (it passes real user names), so each readout carries
          its own swatch in the primitive's own mark vocabulary — the
          mode-stepping custom property, not a fixed hex — rather than
          relying on a legend elsewhere on the page. */}
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mb-1.5 mono-meta text-text-secondary tabular-nums">
        <span data-readout="a" className="inline-flex items-center gap-1">
          <span
            data-mark="a"
            aria-hidden="true"
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: getDomainMarkVar(axisId) }}
          />
          {labelA} {formatScore(scoreA)}
        </span>
        <span data-readout="b" className="inline-flex items-center gap-1">
          <span
            data-mark="b"
            aria-hidden="true"
            className="h-2 w-2 rounded-full border-[1.5px] border-text-label bg-surface-1 shrink-0"
          />
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

- [x] **Step 4: Correct the legend copy**

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
grep -rn "Ring marker is you" src/ || echo "clean"
```

Expected: `clean`.

- [x] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/results-chrome.test.ts tests/unit/comparison.test.ts tests/unit/comparison-radar-data.test.ts`
Expected: PASS. The two comparison suites are logic tests and must be green **unmodified**.

- [x] **Step 6: Commit**

```bash
git add src/components/comparison/ComparisonScoreBar.tsx src/app/compare/page.tsx tests/unit/results-chrome.test.ts
git commit -m "refactor(design): converge ComparisonScoreBar on PairedAxisScale"
```

**Addenda from Task 4's code-quality review**, deliberately routed here rather than fixed in Task 4:

- **Unshortened pole labels.** `AxisBreakdownCard` passes `poleALabel`/`poleBLabel` raw where `src/app/page.tsx` passes them through `shortPole(...)`. Between roughly 560 and 600px viewport width the widest pair wraps to two lines. This self-corrects above ~600px, and Task 10's 820px results container widens the axis row further still — but this component's middle column is narrower than the axis row's, so it will hit the wrap harder. Worth checking once this task's grid is in place.
- **Two responsive conventions for the same pattern.** The home page uses a block that becomes `min-[560px]:grid` with `min-[560px]:contents` to re-parent at the breakpoint, while the axis row (Task 4) uses a 2-column grid at all widths with `col-start-2` / `min-[560px]:col-start-3`. Both are valid; settle on one before this task builds a third variant.

**As shipped.** Implementation and review moved this task in six ways from the text above:

1. **The `delta` prop was removed outright**, where the plan kept it as an incoming prop alongside the scores. The Step 1 fixture as drafted passed `delta: 0.2` on a "labels the gap" test while `scoreA`/`scoreB` sat 1.4 apart — a state `compareProfiles` cannot actually produce, since `src/lib/comparison.ts:40` defines `delta` as exactly `Math.abs(scoreA - scoreB)`. Review flagged that the fixture only worked because it never checked the two numbers agreed, and making the component compute the gap itself turned that gap into a reddening test rather than a merely-tolerated one: the test did not just tolerate two code paths landing on one number, its fixture required them to. Deriving `delta` internally makes the visible badge and the `aria-label`'s trailing gap phrase the same number by construction, not by fixture discipline.
2. **The styling half of the rewrite shipped with no guard at all.** Five mutations restored the pre-commit appearance exactly with the whole suite green — including reverting `body-xs` back to the raw `text-xs leading-[1.5]` pair that `body-xs` exists to prevent drifting apart. Guards were added mirroring the ones Task 4 put on this same file one `describe` block above.
3. **The gap badge is now `aria-hidden`.** Its text is byte-identical to the scale's `aria-label` trailing clause, so left exposed a screen-reader user hears the same relationship twice per row, twelve times down the page. This was only safe to do once `delta` stopped being an independent prop — while two code paths existed for the same number, hiding the visible one risked telling sighted and AT users two different things.
4. **Each readout gained its own `aria-hidden` mark swatch** — respondent A filled via `getDomainMarkVar(axisId)`, respondent B outlined with the primitive's own border recipe. The removed hover tooltips were the only thing mapping a respondent's name to a specific dot, and `src/app/compare/[profileId1]/[profileId2]/page.tsx` carries no legend at all, so on that route the mapping had been lost entirely, not just made less accessible.
5. **`formatScore` was consolidated into `src/lib/format-score.ts`**, which the plan's Step 3 still declared as a local function. Three near-identical copies existed; two (this component and `AxisBreakdownCard`) agreed byte-for-byte, but the third, in `comparison-radar-data.ts`, signed an exact zero as `"+0.00"`. That third copy was first kept separate under the name `formatSignedScore`, on the theory that always signing kept decimal points aligned down a `<td>` column — which review found to be wrong: the table at `ComparisonRadar.tsx:139` is `className="sr-only"`, so there is no visible column to align, and the sign on a zero only made a screen reader say "plus zero point zero zero". All three now share `src/lib/format-score.ts`, in a follow-up commit (`966e851`) after this task's own commit (`07e08e4`). `src/components/results/RadarChart.tsx` carries the same inlined `>= 0` convention in its own sr-only table; Task 8 owns that file and its own consolidation.
6. **The badge/label agreement test initially ran only on a close pair.** On `(-0.5, -0.3)` a dropped `Math.abs` yields `-0.2`, which buckets identically to `+0.2` — "close agreement" either way — so that fixture alone could not see the very mutation the test exists to catch. It now also runs on the wide `PAIR` fixture, where that mutation prints "close agreement" beside an `aria-label` reading "far apart".

---

### Task 7: `ArchetypeCard` — the `1fr 220px` panel

**Files:**
- Modify: `src/components/results/ArchetypeCard.tsx` (full rewrite)
- Modify: `tests/unit/results-chrome.test.ts` — append two `describe` blocks (as shipped; the plan drafted one)

**Interfaces:**
- Produces: `ArchetypeCardProps` gains `actions?: ReactNode`, rendered at the foot of the left column in **both** branches (as shipped — the plan placed it only on the archetype branch).
- Consumes: `Button` and `ButtonLink` (phase 1), `body-s`, `--mark-primary` (Task 1).
- Task 10 passes `<CopyLinkButton />` and `<CompareInput />` into the new slot and stops rendering its own action bar.

**Why the slot, not a move (D13).** `CopyLinkButton` owns a 2s timer and `CompareInput` owns the router and the `encoded` prop. Moving them into `ArchetypeCard` would drag `useRouter` into a presentational card and hand it a prop it has no other use for. A `ReactNode` slot puts them where the mock draws them without moving what they own.

Mock 7a's panel: `grid-template-columns: minmax(0,1fr) 220px`, 28px gap. Left column — `Primary archetype` in 11px mono eyebrow with **12px padding-bottom over a 1px Stone 900 rule**, then the match percentage at `display-l`, the archetype name at `display-s`, a 13.5px summary, then the action row. Below the grid, a 1px Stone 50 rule and `Adjacent · <name> — NN% match` in 11px mono. Right column — the 200px mini radar and its two-item legend.

- [x] **Step 1: Write the failing tests**

Append two `describe` blocks to `tests/unit/results-chrome.test.ts` — the component's own, and this phase's first drift guard:

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
      createElement(ArchetypeCard, { ...ARCHETYPE, userScores: [0.1, -0.2, 0.3] }),
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

describe("results chrome drift guards", () => {
  it("keeps the migrated results components off the sub-AA tertiary token", () => {
    // Stone 500 measures 3.28:1 on the card ground — under AA for small text.
    // Phase 4 routes the label layer through --text-label and prose through
    // --text-secondary, but nothing in the per-component tests notices a
    // revert: every `text-text-label` this phase introduces can go back to
    // `text-text-tertiary` with the whole suite green. Mirrors the quiz's
    // guard at tests/unit/quiz-chrome.test.ts.
    //
    // `.sort()` because readdirSync order is not guaranteed, and an unsorted
    // toEqual against an array literal is a flaky test, not a strict one.
    const offenders = resultsSources
      .filter(({ text }) => text.includes("text-text-tertiary"))
      .map(({ name }) => name)
      .sort();

    // Shrinks to [] at Task 10, which owns ResultsView.tsx.
    expect(offenders).toEqual(["ResultsView.tsx"]);
  });
});
```

Add `ArchetypeCard` to the file's imports, and reword the hook-convention comment near the top of the file from `data-axis-*` to `data-*` — the hooks this task adds are not axis-scoped.

- [x] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/results-chrome.test.ts`
Expected: FAIL — the eleven `ArchetypeCard` tests, none of the `data-archetype-*` hooks exist. The twelfth, in the new `results chrome drift guards` block, passes from the outset by design: it pins a pre-existing fact (`ResultsView.tsx` is already the only file in the directory naming `text-text-tertiary`) so that Task 10 cannot quietly change it. See "As shipped" note 8.

- [x] **Step 3: Implement**

Replace `src/components/results/ArchetypeCard.tsx` in full:

```tsx
"use client";

import { useState, type ReactNode } from "react";
import { Button, ButtonLink } from "@/components/Button";

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
  return scores
    .map((score, i) => {
      const angle = (i / MINI_AXES) * 2 * Math.PI - Math.PI / 2;
      const r = ((score + 1) / 2) * MINI_R;
      return `${MINI_CX + r * Math.cos(angle)},${MINI_CY + r * Math.sin(angle)}`;
    })
    .join(" ");
}

function MiniRadar({
  userScores,
  prototypeScores,
}: {
  userScores: number[];
  prototypeScores: number[];
}) {
  return (
    <svg
      viewBox={`0 0 ${MINI_SIZE} ${MINI_SIZE}`}
      className="w-full max-w-[200px] mx-auto"
      aria-hidden="true"
    >
      <polygon
        data-mini-ring="outer"
        points={ringPoints(MINI_R)}
        fill="none"
        style={{ stroke: 'var(--border-secondary)' }}
        strokeWidth={0.6}
      />
      <polygon
        data-mini-ring="mid"
        points={ringPoints(MINI_R * 0.5)}
        fill="none"
        style={{ stroke: 'var(--border-secondary)' }}
        strokeWidth={0.5}
        strokeDasharray="2 2"
      />
      <polygon
        points={miniRadarPoints(prototypeScores)}
        fill="none"
        style={{ stroke: 'var(--stone-500)' }}
        strokeWidth={1}
        strokeDasharray="3 2"
        opacity={0.5}
      />
      {/* --mark-primary, not var(--stone-600): mock 7b paints this shape Stone
          400 on a dark ground. Deliberately NOT --domain-economic, which holds
          the same value in both modes — see the note in globals.css. */}
      <polygon
        data-mini-user
        points={miniRadarPoints(userScores)}
        style={{ fill: 'var(--mark-primary)', stroke: 'var(--mark-primary)' }}
        fillOpacity={0.12}
        strokeWidth={1.4}
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

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 mb-4">{actions}</div>
        )}

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

  const showMiniRadar = userScores?.length === 12 && primary.prototype.length === 12;

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
            >
              {expanded ? "Hide details" : "Learn more"}
              <span className="sr-only"> about {primary.name}</span>
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
              {/* ButtonLink, not a hand-copied class string: the plan spelled
                  the tertiary variant out inline, which forks it from
                  Button.tsx and loses the named transition list that file
                  documents as a deliberate fix over `transition-colors`. */}
              <ButtonLink variant="tertiary" href={`/archetypes#${primary.id}`}>
                Read in the archetype reference →
              </ButtonLink>
            </div>
          )}
        </div>

        {showMiniRadar && (
          <div className="flex flex-col items-center justify-center">
            <MiniRadar userScores={userScores} prototypeScores={primary.prototype} />
            <div
              data-mini-legend
              aria-hidden="true"
              className="flex justify-center gap-3.5 mt-1.5 mono-meta text-text-label"
            >
              <span className="flex items-center gap-1.5">
                <span
                  data-mini-legend-you
                  className="inline-block w-3 h-0.5"
                  style={{ backgroundColor: 'var(--mark-primary)' }}
                />
                You
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="2" aria-hidden="true">
                  <line
                    x1="0"
                    y1="1"
                    x2="12"
                    y2="1"
                    stroke="var(--stone-500)"
                    strokeWidth="1"
                    strokeDasharray="3 2"
                  />
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

Note: `Button` forwards unknown props to the underlying `<button>`, so `data-archetype-expand` reaches the DOM. Do **not** pass a `className` carrying colour or padding — the tertiary variant already sets both, and appending does not win (see Global Constraints). The archetype-reference link goes through `ButtonLink variant="tertiary"` for the same reason in reverse: an earlier draft of this step spelled the tertiary classes out inline, forking them from `Button.tsx` — see "As shipped" note 2.

- [x] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/results-chrome.test.ts`
Expected: PASS. If the `Learn more` assertion on `label-nav` fails, the tertiary variant was overridden — re-read the `className` constraint rather than adding the class by hand.

- [x] **Step 5: Commit**

```bash
git add src/components/results/ArchetypeCard.tsx tests/unit/results-chrome.test.ts
git commit -m "feat(design): rebuild the archetype panel on the mock's two-column grid"
```

Shipped as `55ec6e3`. A second commit, `39b79ac`, followed it — an out-of-plan fix to `AxisBreakdownCard`, recorded at the end of this section.

**Addenda from Task 4's code-quality review**, routed here and now resolved:

- **Unshortened pole labels — investigated, and the original premise was wrong. Do not adopt `shortPole`.** The addendum as written claimed the group row would "hit the wrap harder" because of a narrower middle column. `GroupScoreBar` has no column structure at all: it calls `PairedAxisScale` with `endpoints="below"` at full row width, inside `max-w-3xl` + `px-4` on the page and `p-6` on the section, which leaves ~480px at a 560px viewport for a 301px label pair. It is the *least* squeezed of the three rows, not the most. Measured at spec (11px mono, `letter-spacing: 0.02em`, uppercase): `Distributed Governance` + `Centralized Governance` = 301.1px; `Progressive Change` + `Continuity and Tradition` = 287.4px. The row that *does* wrap is the **axis row**: `AxisBreakdownCard`'s middle column is `min(V − 32, 768) − 266` (24px index + 210px meta + two 16px gaps), which clears 301.1px only at V ≥ 599px, while the 3-column layout engages at `min-[560px]` — so the wrap band is exactly **V ∈ [560, 599)**. Task 10's 820px container does **not** close it: at a 560px viewport the container is viewport-limited, not max-width-limited. And `shortPole` is the wrong instrument regardless — it is a private one-liner at `src/app/page.tsx:16` (not in `src/lib/design-tokens.ts`, as the addendum assumed) and it is lossy, `label.split(" ")[0]` rendering `Continuity and Tradition` as `Continuity` and `Market Allocation` as `Market`. The home page can afford that in a 158px teaser column; the results breakdown, whose whole job is precision, cannot. **If the 39px band is judged worth fixing at all, the fix is a one-token change in `AxisBreakdownCard.tsx` moving the 3-column breakpoint from `min-[560px]` to `min-[600px]`** — routed to Task 10 as optional.
- **Two responsive conventions — resolved: converge on shape C.** Three shapes exist in the tree. **A** — `src/app/page.tsx:112-118`: `min-[560px]:grid` on the row plus a child that goes `min-[560px]:contents` to dissolve and re-parent its own children. **B** — `AxisBreakdownCard.tsx:65,90`: a 2-column grid at all widths with `col-start-2 min-[560px]:col-start-3` on the cell that moves. **C** — this task: `grid` at all widths with `grid-cols-1` stepping to `min-[560px]:grid-cols-[minmax(0,1fr)_220px]`. **The rule, recorded for Tasks 8-11: use C by default; use B only when a child changes column index between breakpoints; reserve A for genuine DOM re-parenting.** B is C plus an explicit column-placement fixup, needed only because the axis row reflows a child *between* columns rather than stacking it. A is genuinely different in kind — `contents` is the only way to change nesting at a breakpoint, and it is load-bearing on the home page because that row reorders across the dissolve (`min-[560px]:order-last` on the name). **A is not gratuitous and must not be flattened into C.** No refactor was made to either file: both are already the right shape under this rule.

**As shipped.** Implementation and two rounds of review moved this task in eight ways from the text above:

1. **`showMiniRadar` guards the *length* of `userScores`, not its presence.** The plan's `userScores && primary.prototype.length === 12` has both halves backwards. `primary.prototype.length === 12` is a tautology — all twelve prototypes in `src/data/archetypes.ts` are 12-element array literals and none can vary — while `userScores` arrives as `axisData.map((a) => a.finalScore)` at `src/components/results/ResultsView.tsx:227`, i.e. at whatever length the caller's axis list happens to be. A short array therefore passed the plan's guard, reached `miniRadarPoints` unchecked, and drew a plausible-looking but wrong polygon against a full 12-vertex prototype. Shipped as `userScores?.length === 12 && primary.prototype.length === 12`, with the tautological half kept as documentation of the pairing and a test pinning the short-array case. The optional-chain form also lets TypeScript narrow `userScores` through the aliased const, so the plan's `userScores!` non-null assertion is gone.
2. **The archetype-reference link is `ButtonLink variant="tertiary"` — and the plan's version was a defect, not just a divergence.** The plan hand-copied `"label-nav text-text-secondary border-b border-border-primary pb-[3px] inline-block hover:text-text-primary transition-colors duration-150 focus-ring"`, a verbatim fork of `VARIANTS.tertiary` in `src/components/Button.tsx` — and in forking it reintroduced `transition-colors`, which that file's own header comment documents as the bug the named `transition-[color,background-color,opacity]` list exists to fix (`transition-colors` does not animate `disabled:opacity-50`, so disabled states snapped while hovers eased). **The plan specified a regression.** `ButtonLink` gets the same rendering from the single source; `Link` is no longer imported by this file.
3. **The `isDistinctive` branch wraps `{actions}`** in `flex flex-wrap items-center gap-2.5 mb-4`, guarded by `{actions && …}`, where the plan rendered the slot bare. Reason: one contract for the slot in both branches, so Task 10 does not have to satisfy two. Spacing is unchanged — the wrapper's `mb-4` (16px) collapses against the following paragraph's `mt-[18px]`, leaving 18px exactly as before.
4. **The expand control's `aria-label` was removed — the plan specified an accessibility violation.** The plan's `aria-label={expanded ? "Hide archetype details" : "Show archetype details"}` is a **WCAG 2.5.3 (Label in Name) failure**: the visible text is `Learn more` / `Hide details`, and an accessible name that contains neither *replaces* the visible label rather than extending it, so a voice-control user saying "click Learn more" gets no match. It also put state in the name, which `aria-expanded` already carries and which ARIA practice keeps out of the name. Shipped instead as `<span className="sr-only"> about {primary.name}</span>` inside the button: a visually-hidden suffix *extends* the accessible name to "Learn more about The Social Democrat", keeping the visible label as a prefix and still distinguishing the control from its siblings.
5. **`aria-hidden="true"` on the mini-radar legend wrapper** (`data-mini-legend`). The `<svg>` was already `aria-hidden`, so an exposed legend left AT reading a bare "You Prototype" describing a chart it could not perceive.
6. **Four `data-*` hooks beyond the plan's:** `data-mini-legend-you`, `data-mini-legend`, `data-mini-ring="outer"`, `data-mini-ring="mid"`. Each exists because a real assertion is read off it, which is this file's stated hook convention. The convention comment near the top of the test file was reworded from `data-axis-*` to `data-*` at the same time, since the hooks are no longer axis-scoped.
7. **The test block grew from the plan's 8 tests to 12** — eleven in `describe("ArchetypeCard")` and one in a new `describe("results chrome drift guards")`. The three added to the component block closed mutations that survived code-quality review: the mark-token guard covered only `fill` when the **stroke** is the visible shape (the fill sits at 12% opacity, the stroke has none, so guarding `fill` alone left the load-bearing half free to revert to Stone 600); the geometry was entirely unpinned, so `miniRadarPoints` could be rescaled, sign-inverted, or lose its −90° offset and `ringPoints` could ignore its radius argument with every class and token assertion still green; and the `{actions}` slot on the distinctive branch was unenforced, which is what item 3 above fixes.
8. **A new `describe("results chrome drift guards")` block**, carrying one ratcheting sub-AA guard: it scans `resultsSources` for `text-text-tertiary` and asserts the sorted offender list equals `["ResultsView.tsx"]`. Stone 500 measures 3.28:1 on the card ground, under AA for small text, and nothing in the per-component tests notices a revert — every `text-text-label` this phase introduces can go back to `text-text-tertiary` with the whole suite green. It mirrors the quiz's guard in `tests/unit/quiz-chrome.test.ts`. **The literal is load-bearing for Tasks 10 and 11** — see the addenda on both.

**Out-of-plan fix shipped alongside, in commit `39b79ac`.** `src/components/results/AxisBreakdownCard.tsx` — a Task 4 artifact — carried the same WCAG 2.5.3 defect as note 4 above: a visible `▸ See how this was scored` under `aria-label="Show scoring breakdown for {name}"`, which shares no words with it. Fixed the same way: the `aria-label` is gone, the axis name moves to `<span className="sr-only"> for {name}</span>`, and the expanded/collapsed state is dropped because `aria-expanded` already carries it. The `▸`/`▾` caret was wrapped in `<span aria-hidden="true">` in the same change — every other disclosure caret in the repo is already `aria-hidden` (`src/components/study/PersonasPageClient.tsx:380`, `src/app/archetypes/page.tsx:315`, `src/components/NavBar.tsx:152`, `src/components/study/PersonaModal.tsx:1888`), so this was the sole outlier and AT was announcing U+25B8 by its Unicode name inside the button's name. The leading space moved inside the adjacent string literal, because JSX collapses whitespace between an element and an adjacent expression container to nothing. One test was added to the existing `AxisBreakdownCard` `describe` — thirteen new tests across the two commits, not twelve. Cross-referenced from Task 4.

---

### Task 8: `RadarChart` — one polygon, twelve domain dots

**Files:**
- Modify: `src/components/results/RadarChart.tsx` (full rewrite)
- Create: `src/lib/radar-geometry.ts` (as shipped; folded in from addendum B below)
- Modify: `src/components/results/ArchetypeCard.tsx` — `MiniRadar` moves onto the shared geometry (as shipped)
- Modify: `tests/unit/results-chrome.test.ts` — append a `describe`
- Create: `tests/unit/radar-geometry.test.ts` (as shipped; addendum E named one assertion, the file holds eleven tests)

**Interfaces:**
- Props are structurally unchanged. The local `AxisScore` interface moves to `src/lib/radar-geometry.ts` as the exported `RadarAxisScore` (as shipped), so the prop reads `axisScores: RadarAxisScore[]`; `ResultsView`'s `AxisDisplayData` still satisfies it structurally and no call site moved.
- Produces: `src/lib/radar-geometry.ts`, exporting `TOTAL_AXES`, `RadarAxisScore`, `spokeAngle(index, total)`, `scoreToRadius(score, maxRadius)`, `polarToCart(angle, radius, cx, cy)`, `ringPoints(radius, total, cx, cy)` and `normaliseByAxisId(axisScores, total?)` (as shipped — addendum B named the last one `padAndSortByAxisId`; see "As shipped" note 2).
- Consumes: `formatScore` from `src/lib/format-score.ts` (Task 6), per addendum A.
- Removes: `DOMAIN_SEGMENTS`, `buildDomainPath`, `RING_FRACTIONS`, the twelve domain-tinted triangle fills, the centre dot.
- Keeps: the `((score + 1) / 2) * R` mapping, the visually-hidden score table, and the vertex hover tooltip.

**What changes and why.** Mock 7a draws **one** user polygon in Stone 600 at 10% fill, with a 4px dot per axis in that axis's domain colour. Today the chart draws four domain-coloured stroke *segments* over twelve domain-tinted triangle *fills* — a second colour system layered on the first, which is what makes the current chart read as busy. The rings collapse from four to two (a 0.8px Stone 200 outer ring and a dashed Stone 300 mid-ring), the six diameter lines become twelve 0.6px spokes from the centre, and the labels move from `r+38` in domain colour to `r+22` in 11px mono `--text-label`, prefixed with the axis number.

The tooltip stays. It is behaviour, it is the only way to read an exact score off the chart, and nothing in the issue's "must not change" list implies otherwise — but its `rx={4}` corner drops to `2`.

- [x] **Step 1: Write the failing tests**

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
```

Add `RadarChart` to the file's imports. A second file, `tests/unit/radar-geometry.test.ts`, is written in the same step — eleven tests pinning the shared module directly, without a mount (addendum E).

- [x] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/results-chrome.test.ts tests/unit/radar-geometry.test.ts`
Expected: FAIL — nine new `RadarChart` tests (the plan drafted six; see "As shipped" note 7), because the `[data-radar-*]` hooks do not exist and four `path` elements are found, plus the whole of `radar-geometry.test.ts`, which cannot resolve `@/lib/radar-geometry` until Step 3.

- [x] **Step 3: Implement**

Extract `src/lib/radar-geometry.ts` first — the module addendum B specifies — then replace `src/components/results/RadarChart.tsx` in full. Note that `ringPoints` takes an **absolute** radius, so this file's former `ringPolygonPoints(1)` / `ringPolygonPoints(0.5)` call sites become `ringPoints(MAX_RADIUS, …)` / `ringPoints(MAX_RADIUS * 0.5, …)`. Passing the old fractions through collapses both rings onto the centre and still renders plausibly — see "As shipped" note 1:

```tsx
"use client";

import { useState } from "react";
import {
  DOMAIN_COLORS,
  DOMAIN_MARK_VARS,
  getDomainForAxis,
  getDomainMarkVar,
  type DomainKey,
} from "@/lib/design-tokens";
import { formatScore } from "@/lib/format-score";
import {
  TOTAL_AXES,
  normaliseByAxisId,
  polarToCart,
  ringPoints,
  scoreToRadius,
  spokeAngle,
  type RadarAxisScore,
} from "@/lib/radar-geometry";

interface RadarChartProps {
  axisScores: RadarAxisScore[];
}

const SIZE = 580;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_RADIUS = 170;
// Mock 7a puts the labels at r+22. The old r+38 was sized for two-line
// domain-coloured labels; at 11px mono the ring can close up.
const LABEL_PADDING = 22;

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
  const paddedScores = normaliseByAxisId(axisScores);

  const userPolygon = paddedScores
    .map((axis, i) => {
      const [x, y] = polarToCart(
        spokeAngle(i, TOTAL_AXES),
        scoreToRadius(axis.finalScore, MAX_RADIUS),
        CX,
        CY,
      );
      return `${x},${y}`;
    })
    .join(" ");

  const [hoveredAxis, setHoveredAxis] = useState<number | null>(null);

  return (
    <div className="w-full flex flex-col items-center">
      {/* The SVG is aria-hidden, so this table is the entire accessible chart. */}
      <table className="sr-only" aria-label="12-axis governance profile scores">
        <thead>
          <tr>
            <th scope="col">Axis</th>
            <th scope="col">Domain</th>
            <th scope="col">Score</th>
            <th scope="col">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {paddedScores.map((axis) => (
            <tr key={axis.axisId}>
              <td>{axis.name}: {axis.poleALabel} to {axis.poleBLabel}</td>
              {/* This task made domain the job of the twelve dots, which a
                  screen reader cannot see — so without this column the one
                  variable the chart gained is the one AT loses.

                  Derived from the axis id, exactly as `getDomainMarkVar`
                  derives the dot beside it, rather than read off
                  `axis.domain`. The two can disagree — a caller sets the
                  string while the dot is computed — and a padded axis has no
                  string at all, though its id still names its domain. */}
              <td>{DOMAIN_COLORS[getDomainForAxis(axis.axisId)].name}</td>
              {/* The shared formatter, not a fourth inline copy of
                  `>= 0 ? "+" : ""`. It also clamps to -1..1, and it does not
                  sign an exact zero — a padded axis reads "0.00", so a screen
                  reader no longer says "plus zero point zero zero" for an
                  axis that carries no signal at all. */}
              <td>{formatScore(axis.finalScore)}</td>
              <td>{axis.confidence}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-xl" aria-hidden="true">
        {/* Outer ring and dashed mid-ring. Four concentric rings became two:
            the mid-ring is the neutral mark the caption describes, and the
            0.33/0.67 rings carried no meaning.

            `ringPoints` takes an ABSOLUTE radius, where the local helper this
            replaces took a fraction of MAX_RADIUS. Passing 1 and 0.5 here
            would collapse both rings to the centre. */}
        <polygon
          data-radar-ring
          points={ringPoints(MAX_RADIUS, TOTAL_AXES, CX, CY)}
          fill="none"
          style={{ stroke: 'var(--border-secondary)' }}
          strokeWidth={0.8}
        />
        <polygon
          data-radar-ring
          points={ringPoints(MAX_RADIUS * 0.5, TOTAL_AXES, CX, CY)}
          fill="none"
          style={{ stroke: 'var(--border-primary)' }}
          strokeWidth={0.8}
          strokeDasharray="3 3"
        />

        {/* Twelve spokes from the centre, not six diameters: a spoke has to be
            present even where the mapping puts its vertex at the origin. */}
        {Array.from({ length: TOTAL_AXES }, (_, i) => {
          const [x, y] = polarToCart(spokeAngle(i, TOTAL_AXES), MAX_RADIUS, CX, CY);
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
          const [x, y] = polarToCart(
            spokeAngle(i, TOTAL_AXES),
            scoreToRadius(axis.finalScore, MAX_RADIUS),
            CX,
            CY,
          );
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
          const angle = spokeAngle(i, TOTAL_AXES);
          const [vx, vy] = polarToCart(
            angle,
            scoreToRadius(axis.finalScore, MAX_RADIUS),
            CX,
            CY,
          );
          const score = axis.finalScore;
          const poleName = score >= 0 ? axis.poleBLabel : axis.poleALabel;
          const label = `${Math.abs(score).toFixed(2)}  ${poleName}`;
          const boxW = label.length * 5.5 + 16;
          const boxH = 28;

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
          const angle = spokeAngle(i, TOTAL_AXES);
          const [x, y] = polarToCart(angle, MAX_RADIUS + LABEL_PADDING, CX, CY);

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

      {/* aria-hidden, like the <svg> it annotates: exposed, it reads as four
          loose domain names with no referent, describing a chart AT cannot
          perceive. The table above carries the same information in rows. */}
      <div
        data-radar-legend
        aria-hidden="true"
        className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-3"
      >
        {(["economic", "power", "society", "world"] as DomainKey[]).map((key) => (
          <div key={key} className="flex items-center gap-1.5 mono-meta text-text-label">
            <span
              data-radar-legend-swatch
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

- [x] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/results-chrome.test.ts tests/unit/radar-geometry.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/lib/radar-geometry.ts src/components/results/RadarChart.tsx src/components/results/ArchetypeCard.tsx tests/unit/results-chrome.test.ts tests/unit/radar-geometry.test.ts
git commit -m "feat(design): reduce the radar to one polygon and twelve domain dots"
```

Shipped as `067888f`, one commit over five files. Verified final state: **750 tests across 63 files**, lint clean at `--max-warnings=0`, and `npx tsc --noEmit` red on exactly one error — `ResultsView.tsx(339,23)`, the expected `alternateRow` mismatch that Task 10 clears. That "exactly one error, and it is the expected one" signal is the whole reason this interval is safe to leave red; if a second error ever appears, stop and fix it rather than carrying two.

**Addendum A, from Task 6 — resolved.** The sr-only score table above still inlines its own always-signed formatter (`axis.finalScore >= 0 ? "+" : ""` against `axis.finalScore.toFixed(2)`) — a fourth instance of the pattern Task 6 found three copies of and consolidated into `src/lib/format-score.ts`. Task 6 deliberately left this one alone, since it owns `ComparisonScoreBar.tsx`, `AxisBreakdownCard.tsx`, and `comparison-radar-data.ts`, not this file. Fold this one onto `formatScore` from `@/lib/format-score` as part of this task's rewrite; doing so also picks up the shared helper's `-1..1` clamping and its `null` → `"N/A"` handling, neither of which the inline version has.

**Addenda from Task 7 — C, E and F resolved; B and D only partly, see "As shipped" note 9.** Task 7 shipped a second radar in this repo — `MiniRadar`, inside `src/components/results/ArchetypeCard.tsx` — and it duplicates this chart's geometry rather than sharing it. Fold that in here, since this is the task that rewrites `RadarChart`:

- **B — Extract `src/lib/radar-geometry.ts`**, exporting `spokeAngle(i, total)`, `scoreToRadius(score, maxRadius)`, `polarToCart(angle, r, cx, cy)`, `ringPoints(radius, total, cx, cy)`, and a `normaliseByAxisId(axisScores)` normaliser (drafted here as `padAndSortByAxisId`); have **both** `MiniRadar` and `RadarChart` consume all five. `MiniRadar` currently re-inlines `spokeAngle` twice, `polarToCart` twice and `scoreToRadius` once, and its `MINI_AXES = 12` duplicates this file's `TOTAL_AXES = 12`.
- **C — Trap to avoid when merging the ring helpers.** `ArchetypeCard`'s `ringPoints(radius)` takes an **absolute radius** (`ringPoints(MINI_R)`, `ringPoints(MINI_R * 0.5)`); `RadarChart`'s `ringPolygonPoints(radiusFraction)` takes a **fraction** of `MAX_RADIUS`. Unifying them by name without reconciling the argument convention silently rescales every ring in one of the two charts, and both still render plausibly.
- **D — A latent axis-ordering misalignment goes with it.** `RadarChart` sorts by `axisId` and pads to twelve; `MiniRadar` consumes `userScores` in whatever order it arrives and overlays a prototype vector that is fixed axis-1-through-12. `src/app/results/page.tsx:77` maps in pipeline order while `src/app/results/[profileId]/page.tsx:20` orders by `axis.order` — the two agree **only** because `order === id` for all twelve rows in `src/data/axes.ts`. Not live today, but if it ever fires, the mini radar's two polygons misalign against *each other*, which is the one comparison the chart exists to make. `normaliseByAxisId` is the fix — applied in `RadarChart`, but **not** in `MiniRadar`, whose prop carries no axis ids; see "As shipped" note 9 and the addendum this routes to Task 10.
- **E — Pin the radius mapping as a pure function.** A test asserting `scoreToRadius(-1) === 0`, `scoreToRadius(0) === R / 2` and `scoreToRadius(1) === R` kills the rescale / sign-flip / offset class of mutation for **both** charts permanently, and does it without a mount. Task 7's `places the radar's vertices where the score and the radius put them` does this the hard way, off rendered `points` attributes, because no shared function existed to test.
- **F — Do not loosen `results-chrome.test.ts`'s `.sr-only` lookup.** The assertion added in commit `39b79ac` is scoped to the button (`button.querySelector(".sr-only")`) precisely because `RadarChart.tsx:106` already renders an `.sr-only` table that this task relocates. A container-wide lookup would start passing on the wrong node without ever reddening.

**As shipped.** Implementation and review moved this task in nine ways from the text above:

1. **The specified tests could not see the specified trap — record this as a plan defect, not merely a divergence.** Addendum C warns that unifying the two ring helpers without converting the argument convention "silently rescales every ring in one of the two charts". It does: passing the old fractional arguments (`1` and `0.5`) into the new absolute-radius `ringPoints` collapses **both** rings onto the centre — and all six specified tests stay green through it, because `reduces to two rings and twelve spokes` only *counts* `[data-radar-ring]` and never reads a vertex. The same gap ran through the label test: `labels each spoke in mono, numbered, at the tightened radius` measures no radius at all, so `LABEL_PADDING` 22 → 38 — the other half of the change its own title advertises — also survived. Two tests close both: `draws the rings and labels at absolute radii, not fractions of one` in this file, and `reads its radius as absolute, not as a fraction of some maximum` in `tests/unit/radar-geometry.test.ts`. Coverage that is specified alongside the trap it cannot detect is worse than no coverage, because it reads as protection.
2. **`padAndSortByAxisId` shipped as `normaliseByAxisId`, and it contains no sort.** The function rebuilds the list index-driven — `find((score) => score.axisId === i + 1)` per slot — which already orders the output, so a preceding `.sort()` is dead code. That makes dropping it an *equivalent mutation by construction*: no test anywhere can distinguish the two forms, so the suite could not decide it and the decision was argued instead, confirmed two independent ways — `Array.prototype.sort` has been required to be stable since ES2019, and 200,000 randomised trials (shuffles, duplicate ids, out-of-range ids, short lists) found zero divergences between the sorting and non-sorting forms. The rename is the point: the old name advertised a `.sort()` that a future reader would be right to "restore", reintroducing a line that provably does nothing. Its docstring also records the two consequences of the id lookup that no caller relies on today — a duplicated `axisId` keeps the first match in input order, and an id outside `1..total` is silently dropped, since nothing ever looks it up.
3. **The local `AxisScore` interface moved to `src/lib/radar-geometry.ts` as `RadarAxisScore`.** It is never exported from `RadarChart.tsx`. The prop shape is structurally unchanged and `ResultsView`'s `AxisDisplayData` still satisfies it, so no call site changed — only this file's own import.
4. **`ArchetypeCard`'s `showMiniRadar` guard reads `TOTAL_AXES`** on both halves, rather than the literal `12` Task 7 shipped. Same value; the literal was the last thing in that file asserting twelve-ness independently of the shared module.
5. **The sr-only score table gained a `Domain` column, and the column is derived from the axis id rather than read from `RadarAxisScore.domain`.** This task made domain the job of the twelve dots, which a screen reader cannot see, so without the column the one variable the chart gained is the one assistive tech loses. The cell is `DOMAIN_COLORS[getDomainForAxis(axis.axisId)].name`, computed exactly as `getDomainMarkVar(axis.axisId)` computes the dot beside it. Reading `axis.domain` instead would let the two disagree — a caller sets that string while the dot is computed from the id — and `normaliseByAxisId` pads a missing axis with `domain: ""`, so the field would print an empty Domain cell next to a dot that still renders a domain colour. Deriving both from the id makes table and chart structurally incapable of disagreeing. **Consequence: `RadarAxisScore.domain` is now read by nobody** — routed to Task 10.
6. **Three accessibility additions beyond the rewrite.** `scope="col"` on the four table headers, so a cell is announced with the column it sits in. `aria-hidden="true"` on the domain legend wrapper (`data-radar-legend`), which had named four domains beside an `aria-hidden` chart — the same defect Task 7 fixed on `ArchetypeCard`'s twin legend one task earlier. And the `<svg>`'s own `aria-hidden` contract, stated in three comments and asserted nowhere, is now pinned: drop the attribute and twelve SVG labels plus the tooltip become a second, duplicate reading of the same twelve axes.
7. **The component's test block grew from the plan's six tests to nine, and a new file holds eleven more.** The three added to `describe("RadarChart")` are `draws the rings and labels at absolute radii, not fractions of one` (note 1), `names each axis's domain in the table and hides the legend that repeats it` (notes 5 and 6 — it also pins the four legend swatches to `DOMAIN_MARK_VARS`, a revert to a fixed 600 hex having been invisible to every test then in place), and `reads the score table through the shared formatter` (note 8). Two of the plan's six also gained assertions: the user polygon's **stroke** is now guarded beside its fill, because the fill sits at 10% opacity while the 1.6px stroke has none, so guarding `fill` alone left the load-bearing half free to revert to a fixed Stone 600; and the spoke test now reads `x1`/`y1`, because counting alone cannot tell twelve spokes from twelve diameters. `tests/unit/radar-geometry.test.ts` holds **eleven** tests across five `describe` blocks, where addendum E named a single three-assertion test.
8. **Addendum A changed a rendered string.** `formatScore` does not sign an exact zero, where the inline `>= 0 ? "+" : ""` did. This is reachable rather than theoretical: `normaliseByAxisId` pads a missing axis to exactly `0`, so a partial result's padded rows now read `0.00` instead of `+0.00` — a screen reader, the table's only consumer, no longer says "plus zero point zero zero" for an axis that carries no signal at all. Intended, and asserted.
9. **Addenda B and D are only partly met; the remainder is routed to Task 10.** `MiniRadar` consumes four of the five shared helpers — `spokeAngle`, `scoreToRadius`, `polarToCart`, `ringPoints` — plus `TOTAL_AXES`, and its `MINI_AXES` is gone. It cannot consume the fifth: `normaliseByAxisId` keys on `axisId`, while `MiniRadar` receives `userScores: number[]`, bare numbers with no ids. Fixing that means widening `ArchetypeCardProps.userScores`, whose sole producer is `src/components/results/ResultsView.tsx:227` — a Task 10 file — so the change belongs in one task rather than split across two. `RadarChart` normalises because its prop already carries `axisId`. The `miniRadarPoints` docstring records the constraint at the exact point where a reader would otherwise reach for the helper.

---

### Task 9: `CompassPlot` — the 300px square

**Files:**
- Modify: `src/components/results/CompassPlot.tsx`
- Modify: `tests/unit/results-chrome.test.ts` — append a `describe`, and (as shipped; the plan drafted the `describe` alone) a `stripComments` helper plus two guards inside the existing `results chrome drift guards` block

**Interfaces:**
- Props are unchanged (`economic`, `cultural`, `primaryArchetypeId?`).
- Removes: the four quadrant tint rects, the dashed moderate-zone rect, the four whisper quadrant labels, the two pulse rings, the background rect's `rx={6}` — and (as shipped) the four outside-the-square cardinal labels, which the pole labels replace rather than supplement; see "As shipped" note 4.
- Keeps (D11): the four contour paths, the twelve archetype reference markers with their collision suppression, the leader line and the coordinate readout.
- Consumes (as shipped): `formatScore` from `@/lib/format-score`, the fifth and sixth inlined copies of that formatter — see "As shipped" note 1.

**Geometry.** `PADDING` moves from 76 to **50** so `INNER` becomes exactly **300**, giving the mock's 300px square inside the existing 400-unit viewBox, with room for the four mono pole labels *inside* the square at an 8px inset. The contour path formulas are already written in terms of `PADDING` and `INNER` and adapt with no edit. The wrapper's `max-w-sm` becomes `max-w-[400px]` so the square renders at 300px rather than 288px.

**The vertical axis keeps its meaning (D12).** Mock 7a labels the vertical axis `Open` / `Traditional`; the shipped plot labels it `TRADITIONAL` (top) / `PROGRESSIVE` (bottom), and `toY()` maps cultural `+1` to the top. Adopting the mock's labels would invert the meaning of every plotted point without touching `SD_CULTURAL_WEIGHTS`. Keep the existing four names in their existing positions; take only the mono treatment.

- [x] **Step 1: Write the failing tests**

Append to `tests/unit/results-chrome.test.ts`:

```ts
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

    // Those are viewBox units, which are only 300 *px* because the 400-unit
    // viewBox renders 400px wide. max-w-sm is 384px, which would draw the
    // square at 288px and the grid at 48px with every assertion above green.
    expect(classes(container.querySelector("svg")!)).toContain("max-w-[400px]");
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
    // never fired against the shipped archetype data -- the closest pair is
    // 23.05 units apart at PADDING = 50, and was 19.06 at the old 76, so this
    // task moved the margin away from the threshold rather than toward it.
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
    // coins hooks that name nothing, against the convention at :56-61. These
    // are positive and hold only after the removal.
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
```

Add `CompassPlot` to the file's imports:

```ts
import { CompassPlot } from "@/components/results/CompassPlot";
```

**And, beyond the plan, a source-scanning helper plus two guards inside the `describe("results chrome drift guards")` block Task 7 opened** — see "As shipped" notes 9 and 10. The helper:

```ts
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
```

The two guards, appended to the existing block rather than to a second one of the same name:

```ts
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
      .map(({ name }) => name)
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
      .map(({ name }) => name)
      .sort();

    expect(hexOffenders).toEqual([]);
  });
```

The existing sub-AA guard in that block is retrofitted onto the helper in the same change — its one filter line becomes `.filter(({ text }) => stripComments(text).includes("text-text-tertiary"))`. That is the only line this task deletes from the test file.

- [x] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/results-chrome.test.ts`
Expected: FAIL — eight new `CompassPlot` tests (the plan drafted six; see notes 2, 3 and 6), because no `data-compass-*` hooks exist, `INNER` is 248 and the whisper labels are still present. **Both new guards also red before Step 3**, on this same file: `CompassPlot.tsx` held four `var(--text-tertiary)` whisper labels at `:127,130,133,136` and four raw-hex quadrant tints, and this task removes all eight. They are genuinely red-then-green, not guards written green.

- [x] **Step 3: Implement**

In `src/components/results/CompassPlot.tsx` — the plan's six edits as shipped, then three the plan did not call for:

1. Change the geometry constants. The plan changed `PADDING` alone; what shipped extracts every geometry number the new markup needs, because the relationships were coincidental rather than expressed — the grid step `50` happened to equal both `INNER / 6` and `PADDING`, and a literal `50` would have drifted off its own frame the moment `PADDING` moved (note 7):

```tsx
const SIZE = 400;
// 300px plot square, per mock 7a, inside the existing 400-unit viewBox. The
// margin holds nothing — the pole labels moved inside the square — but it
// keeps the square off the container edge.
const PADDING = 50;
const INNER = SIZE - PADDING * 2;

// The grid divides the square into six columns. At PADDING = 50 that step is
// 50 units, which equals PADDING and puts a line under the centre crosshair —
// both coincidences of this particular padding, not relationships. Expressing
// the step as a fraction of INNER keeps the grid square and centred if PADDING
// ever moves; a literal 50 would drift off its own frame.
const GRID_STEP = INNER / 6;
const GRID_LINES = [1, 2, 3, 4, 5];

// 12px ink dot at the 400px render width.
const DOT_R = 6;
// Pole labels sit inside the square now, so they must clear a dot parked hard
// against the frame: one dot radius plus 2 units of breath.
const POLE_INSET = DOT_R + 2;
const POLE_FONT = 11;
// Baseline push for the TOP pole only: the other three centre on an axis or
// sit above the bottom edge, while this one hangs off the frame's top edge and
// would otherwise render its cap height outside the square. Hand-tuned by eye
// against POLE_FONT = 11 and NOT derived from it -- move POLE_FONT and this
// needs re-checking rather than recomputing itself.
const POLE_CAP = 6;
// The leader line has to start clear of the dot it points away from, so both
// offsets exceed DOT_R.
const LEADER_START = DOT_R + 10;
const LEADER_END = DOT_R + 22;
// And the readout sits just past the leader's far end.
const READOUT_GAP = 4;
// Nudge the readout clear of the horizontal axis when the dot sits on it —
// see the collision note at the call site.
const READOUT_NUDGE = 12;
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

        {/* Grid. --rule-hairline is the barely-there pair (Stone 50 / Stone
            900); a `stroke-stone-50` literal would read as near-white hairlines
            on a dark ground. */}
        {GRID_LINES.map((k) => (
          <g key={k}>
            <line
              data-compass-grid
              x1={PADDING + k * GRID_STEP} y1={PADDING} x2={PADDING + k * GRID_STEP} y2={SIZE - PADDING}
              style={{ stroke: 'var(--rule-hairline)' }}
              strokeWidth={1}
            />
            <line
              data-compass-grid
              x1={PADDING} y1={PADDING + k * GRID_STEP} x2={SIZE - PADDING} y2={PADDING + k * GRID_STEP}
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

        {/* Pole labels, inside the square at a POLE_INSET gutter. Traditional
            is TOP and Progressive is BOTTOM because toY maps cultural +1 to the
            top and SD_CULTURAL_WEIGHTS is what defines +1 — mock 7a's Open /
            Traditional pair would invert the meaning of every plotted point
            without touching the engine. See D12. */}
        <text data-compass-pole x={PADDING + POLE_INSET} y={CENTER_Y} fontSize={POLE_FONT} letterSpacing="0.02em" dominantBaseline="middle" style={{ fill: 'var(--text-label)', fontFamily: 'var(--font-mono)' }}>
          Collective
        </text>
        <text data-compass-pole x={SIZE - PADDING - POLE_INSET} y={CENTER_Y} fontSize={POLE_FONT} letterSpacing="0.02em" textAnchor="end" dominantBaseline="middle" style={{ fill: 'var(--text-label)', fontFamily: 'var(--font-mono)' }}>
          Market
        </text>
        <text data-compass-pole x={CENTER_X} y={PADDING + POLE_INSET + POLE_CAP} fontSize={POLE_FONT} letterSpacing="0.02em" textAnchor="middle" style={{ fill: 'var(--text-label)', fontFamily: 'var(--font-mono)' }}>
          Traditional
        </text>
        <text data-compass-pole x={CENTER_X} y={SIZE - PADDING - POLE_INSET} fontSize={POLE_FONT} letterSpacing="0.02em" textAnchor="middle" style={{ fill: 'var(--text-label)', fontFamily: 'var(--font-mono)' }}>
          Progressive
        </text>
```

The now-unused `modInset` / `modX` / `modY` / `modW` / `modH` locals are deleted.

3. In the archetype-marker block, tag the group and put its label in mono:

```tsx
              <g key={a.id} data-compass-archetype opacity={isPrimary ? 0.75 : 0.4}>
```

and on the marker's `<text>`, `fontFamily="inherit"` becomes the mono pair (the separate `style` that set only `fill` is dropped):

```tsx
                {showLabel && (
                  <text
                    x={ax}
                    y={labelY}
                    textAnchor="middle"
                    fontSize={isPrimary ? 7.5 : 6.5}
                    style={{ fill: 'var(--text-label)', fontFamily: 'var(--font-mono)' }}
                  >
                    {a.shortLabel}
                  </text>
                )}
```

4. Replace the two pulse-ring circles and the respondent dot with a single dot:

```tsx
        {/* 12px ink dot. --text-primary, not var(--stone-900): Stone 900 ink
            on a Stone 900 ground is invisible, and this token is already the
            ink pair that inverts. */}
        <circle data-compass-dot cx={dotX} cy={dotY} r={DOT_R} style={{ fill: 'var(--text-primary)' }} />
```

5. Retag the leader line and the coordinate label onto the label colour. As shipped both carry constants rather than literals, the leader carries a `data-compass-leader` hook — it is otherwise unfindable among thirteen `<line>` elements — and the readout's `y` is `readoutY`, not `dotY`, which is edit 9 (note 6):

```tsx
        {/* Leader line */}
        <line
          data-compass-leader
          x1={flipLeader ? dotX - LEADER_START : dotX + LEADER_START}
          y1={dotY}
          x2={leaderEndX}
          y2={dotY}
          style={{ stroke: 'var(--text-label)' }}
          strokeWidth={0.6}
        />

        {/* Coordinate label */}
        <text
          data-compass-readout
          x={labelX}
          y={readoutY}
          textAnchor={labelAnchor}
          fontSize={POLE_FONT}
          letterSpacing="0.02em"
          style={{ fill: 'var(--text-label)', fontFamily: 'var(--font-mono)' }}
          dominantBaseline="middle"
        >
          {economicLabel}, {culturalLabel}
        </text>
```

6. Widen the wrapper so the square renders at its stated size. `gap-2` goes with it — inert on a single-child flex column (note 12) — and the `aria-label` gains a pole gloss per coordinate (note 5):

```tsx
  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[400px]"
        aria-label={`Political compass plot. Economic: ${economicLabel} (${poleGloss(economic, "Collective", "Market")}), Cultural: ${culturalLabel} (${poleGloss(cultural, "Progressive", "Traditional")})`}
        role="img"
      >
```

**Three edits beyond the plan's six.**

7. Fold the file's two inlined score formatters onto the shared helper — the fifth and sixth copies of a pattern Task 6 consolidated three of and Task 8 a fourth (note 1):

```tsx
import { formatScore } from "@/lib/format-score";
```

```tsx
  // The shared formatter, not a fifth inlined copy. It signs on `> 0`, so an
  // exact zero reads "0.00" here — matching the axis table beside this plot,
  // and sparing a screen reader "plus zero point zero zero". Its ±1 clamp is
  // a no-op: computeSuperDimensions bounds both outputs to [-1, +1].
  const economicLabel = formatScore(economic);
  const culturalLabel = formatScore(cultural);
```

8. Gloss each coordinate with the pole it leans toward, for the SVG's accessible label — and gloss an exact zero as `centre` rather than as a pole (note 5):

```tsx
/**
 * The pole a score leans toward, for the SVG's accessible label. An exact zero
 * leans to neither: a fully-skipped assessment scores exactly 0 on both axes,
 * so glossing 0 as "Collective" would tell a respondent who answered nothing
 * that they lean collective-progressive.
 */
function poleGloss(v: number, negative: string, positive: string): string {
  if (v === 0) return "centre";
  return v > 0 ? positive : negative;
}
```

9. Nudge the readout clear of the horizontal axis when the dot sits on it, signing the nudge away from centre. This is a real defect found in review, created by moving the pole labels inside the square (note 6):

```tsx
  const flipLeader = dotX > CENTER_X;
  const leaderEndX = flipLeader ? dotX - LEADER_END : dotX + LEADER_END;
  const labelX = flipLeader ? leaderEndX - READOUT_GAP : leaderEndX + READOUT_GAP;
  const labelAnchor = flipLeader ? "end" as const : "start" as const;

  // Moving the pole labels inside the square opened a collision the
  // outside-the-square labels could not have: the readout renders on the dot's
  // own baseline, so a dot sitting on the horizontal axis pushes it straight
  // through "Collective" (economic below about -0.72) or "Market" (above about
  // +0.89). Both are reachable by a consistent respondent. Nudge the readout
  // off the axis, and always AWAY from centre, so the nudge can never carry it
  // onto the label it is avoiding.
  const readoutY =
    Math.abs(dotY - CENTER_Y) < READOUT_NUDGE
      ? dotY + (dotY <= CENTER_Y ? -READOUT_NUDGE : READOUT_NUDGE)
      : dotY;
```

- [x] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/results-chrome.test.ts`
Expected: PASS. `npm run typecheck` stays red on exactly one error — `ResultsView.tsx(339,23)`, the `alternateRow` mismatch Task 10 clears.

- [x] **Step 5: Commit**

```bash
git add src/components/results/CompassPlot.tsx tests/unit/results-chrome.test.ts
git commit -m "feat(design): square the compass plot onto the mock's grid, keeping its contours"
```

Shipped as `ad08639`, one commit over two files. Verified final state: **760 tests across 63 files**, lint clean at `--max-warnings=0`, and `npx tsc --noEmit` red on exactly one error — `ResultsView.tsx(339,23)`, the expected `alternateRow` mismatch that Task 10 clears. Ten tests added: eight in `describe("CompassPlot")` and two guards in the existing drift-guard block.

**As shipped.** Implementation and review moved this task in thirteen ways from the text above:

1. **A fifth inlined score formatter was folded onto `formatScore`, and the plan did not spot it.** `CompassPlot.tsx:54-55` held ``economic >= 0 ? `+${economic.toFixed(2)}` : economic.toFixed(2)`` and its cultural twin — the same always-signed pattern Task 6 consolidated three copies of into `src/lib/format-score.ts` and Task 8 a fourth. **The shared helper's ±1 clamp is provably a no-op here**, not merely harmless: `SD_ECONOMIC_WEIGHTS` (0.65 + 0.35) and `SD_CULTURAL_WEIGHTS` (0.30 + 0.20 + 0.20 + 0.15 + 0.15) each sum to exactly 1.0 against inputs bounded to [-1, +1], and `computeSuperDimensions` documents the resulting bound at `src/lib/scoring.ts:257-258`. The `+0.00` → `0.00` change is **visible on screen** here, unlike Task 8's sr-only case, and it also feeds the SVG's `aria-label`. It is correct because `AxisBreakdownCard`'s visible score column, on the same page, already renders an exact zero unsigned — signing one and not the other is the inconsistency. **Nuance worth recording:** because the compass is a weighted sum of five and two axes, an exact zero requires essentially every contributing axis to be zero. It is reachable — a fully-skipped assessment scores exactly 0 on both — but far rarer than "an axis scored zero", which is what made this the fifth copy rather than the first to be noticed.
2. **The plan's 300px assertion was unfalsifiable without pinning the wrapper class — record this as a plan defect corrected.** `width="300"` is a *unitless viewBox* measurement. At the pre-task `max-w-sm` (384px) the very same green test describes a 288px square on a 48px grid, so the assertion the task is named for could not tell the shipped geometry from the one it replaced. Edit 6 widens the wrapper to `max-w-[400px]` and nothing in the plan verified it. The shipped test pins `max-w-[400px]` on the `<svg>`, and the grid test reads the five vertical and five horizontal line coordinates rather than only counting to ten. **General lesson for the remaining tasks: any assertion on SVG geometry in viewBox units must also pin the class that fixes the render width, or it measures nothing.**
3. **Two plan-specified assertions were unfalsifiable in a second way — also a plan defect corrected.** `expect(container.querySelector("[data-compass-moderate]")).toBeNull()` and the `[data-compass-pulse]` equivalent assert the absence of hooks that **never existed on any version of this file**; both pass against the untouched pre-task code, so neither can tell "removed" from "never present", and both coin hooks that name nothing, against this file's stated hook convention. They were deleted and replaced with positive assertions that hold only after the removal: `svg.querySelectorAll("rect")` has length 1 (there were six — the frame, four quadrant tints and the moderate-zone rect), and exactly one `circle` sits at the dot's own `cx`/`cy` (the two pulse rings sat there too), read off the dot rather than recomputed.
4. **The old cardinal labels carry no hook, so `toEqual` on the four poles could not see them.** `COLLECTIVE` / `MARKET` / `TRADITIONAL` / `PROGRESSIVE` sat outside the square with no `data-*` attribute; leaving them behind would have passed the plan's `expect(poles).toEqual([...])` verbatim while rendering every pole twice. `expect(container.textContent).not.toContain("COLLECTIVE")` and the `PROGRESSIVE` equivalent close it. The same test also gained position assertions — `poleY("Traditional") < poleY("Progressive")`, `poleX("Collective") < poleX("Market")`, each straddling its own axis, and all four inside the frame's measured bounds — because reading `textContent` in DOM order cannot tell Traditional-on-top from Traditional-on-the-bottom, which leaves D12, the decision this task spends a paragraph defending, unguarded.
5. **The `aria-label` now glosses each coordinate with its pole, so the plan's specified string changed.** It reads `"Political compass plot. Economic: -0.40 (Collective), Cultural: +0.30 (Traditional)"`: two bare numbers tell a screen-reader user nothing about which way either axis runs, and the plot's `role="img"` label is the only description they get. **An exact zero glosses as `"centre"`, not as a pole.** A fully-skipped assessment scores exactly 0 on both axes, and glossing that as "Collective" would manufacture a political claim out of no data at all, in the one place where there is no visual to contradict it. This is the same zero-is-not-signed convention already settled for `formatScore` in note 1, applied to words instead of digits.
6. **A real defect found in review and fixed: the readout could print straight through a pole label.** Moving the pole labels *inside* the square created a collision the outside-the-square labels could not have. The readout renders on the dot's own `y` at `dotX + 32`, and `Collective` begins at `x = 58` on the centre line, so past `economic < -0.72` with `cultural ≈ 0` the two overlap; symmetrically past `+0.89` on `Market`. Both are reachable by a consistent respondent and trivially via a crafted `?r=` URL. Fixed with a nudge that **signs away from centre**: a fixed upward nudge would push a dot at `cultural = -0.05` from y 207.5 to 195.5 — *onto* the label it was avoiding. The threshold is expressed geometrically, `Math.abs(dotY - CENTER_Y) < READOUT_NUDGE`, which is identical to `|cultural| < 0.08` at `INNER = 300` but survives a `PADDING` change; the equivalent literal would not. Pinned by a test that renders both the left and the right case.
7. **Nine geometry constants extracted, because the relationships were coincidental rather than expressed.** `GRID_STEP = INNER / 6`, `GRID_LINES`, `DOT_R`, `POLE_INSET = DOT_R + 2`, `POLE_FONT`, `POLE_CAP`, `LEADER_START`, `LEADER_END`, `READOUT_GAP`, `READOUT_NUDGE`. The plan's markup spelled the grid step as a literal `50`, which at `PADDING = 50` happens to equal both `INNER / 6` and `PADDING` — three different quantities wearing the same number, and a `PADDING` change would have silently unhooked the grid from its own frame. The pole inset and both leader offsets are now derived from `DOT_R`, which is what they are actually about: clearing the ink. **Verified render-identical to the literal form across seven prop combinations** before the constants were adopted. One exception is documented as an exception: `POLE_CAP = 6` is hand-tuned by eye against `POLE_FONT = 11` and explicitly **not** derived from it, so moving the font size means re-checking it rather than trusting it to recompute.
8. **New hooks.** `data-compass-leader`, beyond the plan's set, because the leader line is otherwise unfindable among thirteen `<line>` elements (ten grid, two crosshair, one leader). Plus `data-compass-frame`, `-grid`, `-pole`, `-contour`, `-archetype`, `-dot` and `-readout` from the plan itself. Each carries a real assertion, per the convention at the top of the test file.
9. **Two new drift guards, and they belong to this task rather than to Task 11 because this task is what makes them green.** The existing sub-AA guard (Task 7) greps for the Tailwind class `text-text-tertiary` — but all four SVG charts in this phase colour through inline `style={{ fill: 'var(--…)' }}`, so that guard protected none of them, and `CompassPlot` carries no `text-` class at all. A `var(--text-tertiary)` source guard and a raw-hex source guard close both spellings. Neither was written green: pre-task `CompassPlot.tsx` held four `var(--text-tertiary)` whisper labels and four raw-hex quadrant tints (`#6b7d8a`, `#85735e`, `#7a8b6e`, `#96716b`), and a fixed hex cannot invert. Both lists are `[]` today. The hex guard is deliberately source-level rather than DOM-level: after this task the only `fill` *attributes* left are the contours' `fill="none"`, so a DOM check would run over `["none","none","none","none"]` and a tint re-added as `style={{ fill: '#6b7d8a' }}` would sail through.
10. **`stripComments` was extracted for those guards, and it has a documented limitation.** Both new guards — and, retrofitted in the same change, the existing sub-AA one — scan source text through it, because this file family writes `// --mark-primary, not var(--stone-600)` as a matter of style and a raw-text guard reds on prose documenting the very rule it enforces. Two things about it are deliberate and recorded in its docstring. Its line arm is anchored to `^\s*`: an unanchored `\/\/.*$` also eats the tail of any line containing a URL, which was verified to hide a real `#abcdef` sitting after one. And its block arm still spans from a `"/*"` string literal to a `"*/"` one, hiding a real hex in between — left open deliberately, because under-detection is the dangerous direction (a false green ships the defect, a false red merely annoys) and no realistic source triggers it. **Task 11 inherits this helper**; see the addendum there.
11. **The collision-suppression branch is unreachable against shipped data, so it is pinned by its outcome rather than by a contrived fixture.** Rendering all thirteen `primaryArchetypeId` cases (twelve ids plus `undefined`, which Task 10's `isDistinctive` branch passes) yields 12 labels every time, and the markup is byte-identical with the branch forced on. `MIN_DIST` is 18; the closest label pair measures **23.01** units at `PADDING = 50` and **19.02** at the old 76 — 22.70 and 18.72 respectively in the worst case over all thirteen primary selections, since the primary's label sits one unit higher than the rest. Task 9 therefore moved the margin *away* from the threshold. The guard is `[data-compass-archetype] text` → 12, which catches suppression *firing* — the only direction that can ever become observable. **Correction to the shipped code comment:** `tests/unit/results-chrome.test.ts:939-940` states these figures as 23.05 and 19.06; the measured values are 23.0068 and 19.0189. The conclusion is unaffected and the comment is otherwise correct; routed to Task 11 with the other one-line fixes to that file.
12. **`gap-2` was dropped from the plot wrapper.** It was inert — a single-child flex column has no gaps — and left in place it would read as spacing that something depends on.
13. **One stale line reference shipped in a comment, and this task created it.** The `drops the decoration the mock is right to cut` test cites "the convention at :56-61", which was where the hook-convention comment sat when that test was drafted; inserting `stripComments` and its docstring above it pushed the convention to `:72-77`, and `:56-61` now points at the docstring instead. Harmless to the suite and invisible to it — no test reads a comment — but exactly the kind of drift this reconciliation exists to catch. Routed to Task 11, which is the next task to edit this file.

---

### Task 10: `ResultsView` — page shell, header, jump nav, sections

**Files:**
- Modify: `src/components/results/ResultsView.tsx` (full rewrite)
- Modify: `tests/unit/results-chrome.test.ts` — append a `describe`, and (as shipped) one test inside the existing `describe("ArchetypeCard")` for the `userScores` addendum below
- Modify (as shipped, for the nine addenda routed here): `src/components/results/ArchetypeCard.tsx`, `src/components/results/AxisBreakdownCard.tsx`, `src/components/comparison/ComparisonScoreBar.tsx`, `src/lib/scoring-types.ts`, `src/lib/radar-geometry.ts`, `src/app/results/page.tsx`, `src/app/results/[profileId]/page.tsx`, `tests/unit/radar-geometry.test.ts`
- Create (as shipped): `tests/helpers/client-component-env.ts` — see "As shipped" note 13
- Create (as shipped): `tests/unit/scoring-narrowing.test.ts` — see "As shipped" note 9

**Interfaces:**
- `ResultsViewProps` is unchanged — **wrong as shipped, in three ways.** `profileId` is gone, `secondary.summary` is gone, and `confidence` / `tension.level` / `tension.direction` are narrowed onto the scoring engine's unions; `tension.narrative` is gone with them. See "As shipped" notes 10 and 12.
- Passes `actions` into `ArchetypeCard` (Task 7) and drops `alternateRow` from `AxisBreakdownCard` (Task 4). This is the task that clears the expected `tsc` error from Task 4.
- `ArchetypeCardProps.userScores` widens from `number[]` to `RadarAxisScore[]` (as shipped; Task 8's addendum below), and `RadarAxisScore` loses `domain` and narrows `confidence`.
- Produces (as shipped): `AXIS_CONFIDENCES` / `TENSION_LEVELS` / `TENSION_DIRECTIONS` and their narrowings `toAxisConfidence` / `toTensionLevel` / `toTensionDirection`, all exported from `src/lib/scoring-types.ts` — see "As shipped" note 9.

**Must not change.** URL-encoded results, `showScoring` toggling, per-card expansion, the copy-confirmation timer, the compare-input flow, `:target` behaviour, and every `FadeInSection` wrapper with its delays. Three Playwright assertions are coupled to copy and roles here and must keep passing verbatim: `getByText("Assessment results")`, `getByRole("button", { name: "Compare with someone" })`, and `getByPlaceholder("Paste their results link")`.

**Layout, from mock 7a.** Body capped at `max-w-results` (820px) with the nav's gutters, 48px top padding. Header: eyebrow → `display-page` title → 16px/1.6 sub → jump nav at 11px mono with a rule above and below. Each section: 40px above, eyebrow → `display-m` → `caption-italic` at `max-w-[60ch]` → a white panel at `p-7`. Domain groups carry a 2px domain rule with the domain name in the domain colour and the axis count right-aligned.

- [x] **Step 1: Write the failing tests**

Append to `tests/unit/results-chrome.test.ts` (as shipped — the plan drafted seven tests, twelve landed; see "As shipped" notes 1-8):

```ts
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
```

As shipped, the file's imports gain `ResultsView` and `type ResultsViewProps`, plus `AppRouterContext`, `ROUTER_STUB` and `installIntersectionObserverStub` from the new `tests/helpers/client-component-env.ts` (note 13). The plan's line here read "Add `ResultsView` to the file's imports", which is a third of what mounting this component actually needs.

- [x] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/results-chrome.test.ts`
Expected: FAIL — eight new tests. (The plan's own Step 1 drafts **seven**; nineteen landed across two files. See "As shipped" note 3.)

- [x] **Step 3: Implement**

Replace `src/components/results/ResultsView.tsx` in full. The block below is the shipped file in its entirety. The plan drafted the imports and the body separately and said to copy `AxisDisplayData` and `ResultsViewProps` across verbatim — that is not what shipped, because the addenda routed here change both (notes 10 and 12).

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
import type {
  AxisConfidence,
  TensionDirection,
  TensionLevel,
} from "@/lib/scoring-types";

export interface AxisDisplayData {
  axisId: number;
  name: string;
  poleALabel: string;
  poleBLabel: string;
  tagline: string;
  domain: string;
  finalScore: number;
  /** The scoring engine's unions, not bare `string`s. An unrecognised
   *  confidence used to fall through to `AxisBreakdownCard`'s default branch
   *  and render "Low confidence"; an unrecognised `direction` falls through
   *  the narrative ladder below and renders a titled tension panel with no
   *  explanation at all. Both are silent-wrong-output failures that only a
   *  type can catch, since neither throws and both render plausibly. */
  confidence: AxisConfidence;
  tension: {
    detected: boolean;
    level: TensionLevel;
    direction: TensionDirection | null;
  };
  components: { fc: number; sc: number; bg: number | null };
}

export interface ResultsViewProps {
  axisData: AxisDisplayData[];
  compass: { economic: number; cultural: number };
  archetype: {
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
    };
    isBlended: boolean;
    isDistinctive: boolean;
  };
  encoded?: string;
}

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

/** Sentence-cases a tension grade for display.
 *
 *  In JS rather than a `capitalize` class, for two reasons. `text-transform`
 *  does not touch `textContent`, so a CSS-only capital is invisible to a
 *  screen reader and to anything the respondent copies out of the page; and
 *  the title carries the `label` role, which sets `text-transform` itself, so
 *  layering a second one on it would leave the rendered case decided by
 *  Tailwind's emitted order. */
function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
              userScores={axisData}
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

        {/* 3. Tensions.
            Rendered unconditionally, where the parent commit hid the whole
            section when no tension was detected. The plan made the jump nav a
            fixed five-item row and accepted that `Tensions` would then resolve
            to nothing — but an inert item sitting in a rendered nav is not the
            same as an unused `:target`: clicking it sets the hash, scrolls
            nowhere and moves focus nowhere, and nothing distinguishes it from
            the four links that work. The empty state also says something the
            respondent wants to know. "Describe, don't prescribe": the absence
            of tension is itself a result, not silence. */}
        <FadeInSection>
          <section id={SECTION_IDS.tensions} className="mt-10">
            <SectionHead
              eyebrow="Detected tensions"
              title="Principles against priorities"
              caption="A tension is recorded when stated views and budget choices pull in different directions. It is common, and often the most informative part of a profile."
            />
            {tensionAxes.length === 0 ? (
              <div className={`${PANEL} px-[22px] py-5`}>
                <p data-tension-empty className="body-s text-text-secondary">
                  No tensions recorded: your stated views and budget priorities point the same way on all twelve axes.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tensionAxes.map((axis) => {
                  // Exhaustive over TensionDirection, so the two arms cannot be
                  // reached by a value the ladder does not describe. A drifted
                  // direction used to fall through to "" and render a titled
                  // panel with no explanation; a SWAPPED pair renders the exact
                  // opposite of what the respondent answered, which is why both
                  // arms are pinned by name in the suite.
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
                      <p data-tension-title className="label font-medium text-warning-text mb-1.5">
                        {sentenceCase(axis.tension.level)} tension · {axis.name}
                      </p>
                      {narrative && (
                        <p data-tension-narrative className="body-s text-text-secondary">
                          {narrative}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </FadeInSection>

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

- ~~The jump nav's `Tensions` link is now unconditional, where it used to be hidden when no tension was detected. That is deliberate: mock 7a rules the nav as a fixed five-item row, and a four-item row with a shifting gap reads as a rendering bug. The anchor simply resolves to nothing when the section is absent, which is the same no-op `:target` behaviour the archetype reference already relies on.~~ **Overridden as shipped — see "As shipped" note 4.** The nav stays a fixed five-item row, but the *section* is now unconditional too, with an empty state, so every anchor resolves.
- `border-l-2 border-l-warning` alongside `border border-border-secondary` depends on Tailwind emitting the shorthand width before the longhand. It does in 4.3.3, but this is exactly the kind of ordering subtlety that has bitten this migration — **verify the computed `border-left-width` is `2px` and its colour is `--warning` in the browser during Task 12**, not in jsdom, which computes neither. If it loses, replace those two classes with `style={{ borderLeft: "2px solid var(--warning)" }}` and say so in the PR. (**Resolved in Task 12: the class form won.** Computed on the production build, in both schemes: `border-left-width: 2px`, `border-left-color: rgb(217, 119, 6)` — `--warning` exactly — against a `1px` `rgb(224, 214, 204)` / `rgb(61, 46, 31)` top border from the shorthand. No inline-style fallback was needed.)

- [x] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/results-chrome.test.ts && npx tsc --noEmit`
Expected: PASS, and `tsc` is now clean — this task clears the `alternateRow` error Task 4 left standing.

- [x] **Step 5: Commit**

```bash
git add src/components/results/ResultsView.tsx src/components/results/ArchetypeCard.tsx src/components/results/AxisBreakdownCard.tsx src/components/comparison/ComparisonScoreBar.tsx src/app/results/page.tsx "src/app/results/[profileId]/page.tsx" src/lib/scoring-types.ts src/lib/radar-geometry.ts tests/helpers/client-component-env.ts tests/unit/results-chrome.test.ts tests/unit/radar-geometry.test.ts tests/unit/scoring-narrowing.test.ts
git commit -m "feat(design): restyle the results page shell onto mock 7a"
```

Shipped as `70d7909`, one commit over twelve files — the heaviest task in the phase, because the nine addenda routed here from Tasks 4, 6, 7 and 8 all land in it. Verified final state: **779 tests across 64 files**, lint clean at `--max-warnings=0`, `npx tsc --noEmit` **clean** — the deliberately-red interval that opened at Task 4 is closed — `npm run build` succeeds, and `npx playwright test tests/e2e/results.spec.ts` passes 3/3 with its three copy-and-role assertions unmodified. Nineteen tests added: twelve in `describe("ResultsView")`, one in `describe("ArchetypeCard")`, and six in the new `tests/unit/scoring-narrowing.test.ts`.

**As shipped.** Implementation and review moved this task in thirteen ways from the text above.

1. **The tension-title assertion was unsatisfiable — record this as a plan defect, not a divergence.** Step 1 asserted `toBe("Moderate tension · Axis 5")` while Step 3 rendered `{axis.tension.level}` — the engine's literal `"moderate"` — inside a `capitalize` class. CSS `text-transform` never touches `textContent`, so that assertion could not pass against that markup in any browser or any DOM. Compounding it: the title also carries the `label` utility, which **already sets `text-transform: uppercase`** (`src/app/globals.css:436-442`), so a `capitalize` beside it would have left the rendered case to Tailwind's emission order — the same ordering hazard the second implementer's note above flags for the border. Fixed with a `sentenceCase()` helper in JS and the `capitalize` class dropped. The plan's expected string is kept exactly, and it is now what a screen reader announces and what a copy-paste yields, rather than a capital that exists only in the paint.
2. **`expect(container.textContent).not.toContain("!")` was page-wide.** Intended to prove the circled "!" glyph is gone from the tension panels, it reads the entire rendered page — so it also forbade `CopyLinkButton`'s "Copied!" state, which is one `setTimeout` from being on screen, and every future exclamation mark anywhere on `/results`. That is a tripwire for unrelated work, not a guard. Narrowed to `panels[0].textContent`, which is what it was always about.
3. **Step 2 says "eight new tests"; Step 1 contains seven `it()` blocks.** A plain arithmetic error in the plan, and the kind that makes a red run ambiguous — an implementer counting eight would go looking for a test that was never written. Nineteen landed: the seven drafted, five more in `describe("ResultsView")` — four of them closing the gaps in notes 4, 5, 7 and 8, and a fifth (`layers every section panel on the raised surface`) pinning the shared `PANEL` string across all five sections, since one drifted token in that one string restyles the whole page and nothing else notices — one in `describe("ArchetypeCard")` for Task 8's `userScores` addendum, which the plan specified no coverage for at all, and six in the new `scoring-narrowing` file. Note 6's gap was closed by tightening two of the seven rather than by adding a thirteenth.
4. **The jump nav's dead `Tensions` anchor — an explicit plan decision, overridden.** Step 3's first implementer's note considered this and accepted it: *"The anchor simply resolves to nothing when the section is absent, which is the same no-op `:target` behaviour the archetype reference already relies on."* The analogy does not hold. An unused `:target` rule is a stylesheet rule that never matches and that nobody can see; this was a **rendered, focusable control**, visually indistinguishable from the four beside it, that on click set the hash, scrolled nowhere and moved focus nowhere. The rewrite is also what created the problem: it made the *link* unconditional while leaving the *section* conditional, where the parent commit rendered both conditionally and was at least consistent. **Fix: the Tensions section now renders unconditionally, with an empty state** — "No tensions recorded: your stated views and budget priorities point the same way on all twelve axes." That keeps the plan's stable five-item nav, makes every anchor resolve, and is the better product answer under this project's "describe, don't prescribe" and "radical transparency" principles: the absence of tension is itself a result, not silence. Pinned by `records the absence of tension rather than dropping the section`, and kept honest by the anchor test in note 8.

**Notes 5-9 are coverage gaps closed after the code-quality review.** The reviewer approved the task; a mutation pass over the approved state then found **eight of seventeen mutations surviving**. They were closed anyway, on the principle established in Task 8's note 1 — coverage that reads as protection and is not is worse than none.

5. **The tension narrative could invert silently.** Swapping the bodies of the two `direction` arms compiles, renders, and makes every panel on the page tell the respondent the exact opposite of what they answered — with the whole suite green. Both arms are now pinned by pole name, driven from a fixture carrying **two** tension axes of opposite direction. One was insufficient: the arms are mirror images, so a single-direction fixture stays green straight through the swap. The two axes are 5 (Power and Authority) and 8 (Society and Identity) — deliberately in different domains, so the 2/4/3/3 domain counts asserted in the test above are unaffected.
6. **An axis could vanish from the breakdown.** Dropping one rendered eleven rows under four plausible headings and passed 57 of 57, because the domain-head test asserted only one group's count, and the toggle test's `toBeGreaterThanOrEqual(12)` still holds at eleven — `ArchetypeCard`'s own disclosure supplies the twelfth `aria-expanded`. That lower bound was the one loose assertion among the plan's seven tests. It is now an exact count of `[data-axis-row]` elements whose scoring disclosure is present, and all four domain counts and names are asserted rather than group [1]'s alone.
7. **The distinctive branch was wholly uncovered**, including `primaryArchetypeId={archetype.isDistinctive ? undefined : archetype.primary.id}`. Forcing that to pass the id unconditionally gives the compass an emphasised archetype mark for exactly the respondents the copy has just told there is no such match — and nothing else on the page notices. Now covered through `CompassPlot`'s emphasis marks (`opacity="0.75"`, of which the distinctive branch must have zero), with a paired control assertion on the matched branch, so the zero cannot pass by the twelve reference marks having disappeared altogether.
8. **The jump nav's hrefs were unverified.** `expect(nav.querySelectorAll("a")).toHaveLength(5)` passes with a link aimed at an id that is not on the page. A test now reads every `nav a[href^="#"]`, pins the five ids in order, and asserts each target element exists — across all three fixtures (default, no-tension, distinctive). It is what makes note 4's claim checkable rather than merely asserted.
9. **The confidence boundary was untested and could drift from its own union.** `AXIS_CONFIDENCES` is now the `as const` source and `AxisConfidence` is derived from it as `(typeof AXIS_CONFIDENCES)[number]`, both in `src/lib/scoring-types.ts`, with `toAxisConfidence` beside them; `TENSION_LEVELS` and `TENSION_DIRECTIONS` take the same shape. A hand-kept pair drifts silently in one direction only — add a fifth grade to the union and the runtime guard quietly maps it to the fallback, which is the exact failure the narrowing exists to prevent. The new `tests/unit/scoring-narrowing.test.ts` drives the round-trip **off the list itself**, so a fifth grade must be handled rather than silently becoming `"low"`.
10. **Eight of the nine addenda routed here landed as written; the ninth was declined (note 11).** Dead-surface trim on `AxisBreakdownCardProps`; `alternateRow` gone from the call site; `confidence` narrowed; `"use client"` off `ComparisonScoreBar.tsx`; the sub-AA drift-guard literal shrunk to `[]`; `secondary.summary` dropped from `ArchetypeCardProps` and `ResultsViewProps` alike; `LOW_MATCH_THRESHOLD_PCT` imported in place of the bare `< 55`; `ArchetypeCardProps.userScores` widened to `RadarAxisScore[]` with `normaliseByAxisId` applied inside `MiniRadar`, which finishes the half of Task 7's addendum D that Task 8 could not reach; and `domain` dropped from `RadarAxisScore` and from the pad literal in `normaliseByAxisId`. **Narrowing `confidence` exposed a real hole rather than merely tightening a type.** The value arrives from Prisma as a bare `String` at `src/app/results/[profileId]/page.tsx`, where it previously fell through `AxisBreakdownCard`'s trailing `else` and silently rendered "Low confidence" — a made-up reading of a row nobody could read. That trust boundary now validates explicitly, and `tension.level` / `tension.direction` were narrowed the same way with `toTensionLevel` / `toTensionDirection`. The direction is the worst of the three: an unrecognised value falls through the narrative ladder and renders a titled tension panel with no explanation in it at all.
11. **The optional `min-[560px]` → `min-[600px]` breakpoint change was DECLINED.** 560px is load-bearing four times on this page — `AxisBreakdownCard.tsx:76` and `:101`, `ArchetypeCard.tsx:169`, `ResultsView.tsx:180` — and again in `NavBar.tsx`, the quiz page and the home page, so forking one of them would step the page's columns at two different widths and trade a wrap band for a misalignment band. jsdom computes no layout, so the change could not be verified where every other assertion in this task was verified. **The `V ∈ [560, 600)` pole-label wrap band therefore remains open — routed to Task 12**, which has a browser.
12. **Further dead surface trimmed, beyond what the addenda named.** `ResultsViewProps.profileId` (accepted and never read, while both callers dutifully supplied it); `ResultsViewProps.secondary.summary` (it became unused *in this very commit* while still declared required, so both callers were computing `secondaryArchetype?.summary ?? ""` for a consumer that no longer existed); and `AxisDisplayData.tension.narrative` (no reader anywhere, and its only writer — `src/app/results/page.tsx` — stored a literal `null` with a comment explaining that only DB profiles have narratives).
13. **Two test-harness discoveries, now held in `tests/helpers/client-component-env.ts`.** (a) jsdom implements no `IntersectionObserver` and `FadeInSection` constructs one on mount, so the `ReferenceError` fails the whole render rather than just the animation. A no-op stub is installed through an exported function rather than an import side effect, so a reader can see where it happens; `vmForks` was verified empirically to give each spec file its own VM context, so the `globalThis` assignment cannot leak into whichever file runs next. (b) **Mounting any component that calls `useRouter` requires loading the app-router context through `createRequire(import.meta.url)`, not a plain ESM import.** vitest externalises the bare CJS `next/navigation` to Node's own require cache, so an ESM import of `next/dist/shared/lib/app-router-context.shared-runtime` resolves to a *second* context instance whose Provider publishes to nothing — and the mount still throws "invariant expected app router to be mounted", **with a provider plainly visible in the tree**. Verified by probe against both the CJS and the ESM builds and both extension spellings; all four are distinct from the instance `useRouter` closes over. The helper carries an UPGRADE NOTE on that private path and on the stub's opaque `bfcacheId`. Neither discovery uses `vi.mock`, which this repo's `vmForks` pool makes hazardous: a mock of a module as widely imported as `next/navigation` leaks into the spec file that runs next.

**Addenda from Task 4's code-quality review — all three resolved; see "As shipped" notes 10 and 12.** Deliberately routed here rather than fixed in Task 4, because both touch the `AxisDisplayData`/`AxisBreakdownCardProps` interface this task owns:

- **Dead surface on `AxisBreakdownCardProps`.** A required `domain: string` is never destructured or used by the component; three `tension` sub-fields (`level`, `direction`, `narrative`) are accepted but never read; and the `AXIS_WEIGHT_PROFILES[axisId] ?? { fc: 0.40, sc: 0.35, bg: 0.25 }` fallback is unreachable in practice and its numbers match none of the three real weight profiles. These were left in Task 4 because the interface is shared with `ResultsView`'s `AxisDisplayData`, which this task owns — trim both together, along with the `alternateRow` removal already scheduled here. (As shipped: all trimmed, and the unreachable fallback deleted rather than replaced by a guard — see the backlog item on narrowing `AXIS_WEIGHT_PROFILES` to `Record<AxisId, …>`.)
- **`confidence: string` is looser than its source type.** `src/lib/scoring-types.ts` defines `"high" | "moderate" | "low" | "conflicted"`, so an unrecognised value currently falls through to `AxisBreakdownCard`'s default branch and silently renders "Low confidence" instead of failing to typecheck. Narrowing it was deferred specifically because doing it in Task 4 would have added a second typecheck error during the Task 4-to-10 interval that this plan already flags as deliberately red (the `alternateRow` removal) — two simultaneous errors would have destroyed the "exactly one error, and it is the expected one" signal that makes that interval safe to leave red. Do this alongside the dead-surface trim above. (As shipped: done, and it turned out to be a live defect at the database boundary, not just a loose type — note 10.)
- **Orphaned `"use client"` on `ComparisonScoreBar.tsx`, found in Task 6's review.** With the `useState` and mouse handlers gone, the component has no hooks, no event handlers, and no browser APIs — nothing that needs the client boundary — while `PairedAxisScale`, the primitive it now wraps, carries no directive at all. `src/app/compare/[profileId1]/[profileId2]/page.tsx` is a server component, so the directive needlessly pushes its twelve `ComparisonScoreBar` rows across the client boundary and hydrates them for nothing. Routed here rather than fixed in Task 6 because verifying the removal properly needs `npm run build`, which cannot pass until this task clears the `alternateRow` typecheck error. (As shipped: removed, and `npm run build` verified green in the same pass.)

**Addenda from Task 7 — the first three resolved, the fourth declined; see "As shipped" notes 10 and 11.** All in files this task owns:

- **The drift guard's literal must shrink to `[]`.** Task 7 added `describe("results chrome drift guards")` to `tests/unit/results-chrome.test.ts` with one test asserting that the sorted list of files in `src/components/results/` naming `text-text-tertiary` equals `["ResultsView.tsx"]`. `ResultsView.tsx` is the last file in the directory still on that sub-AA token (12 occurrences). This task rewrites it; when it does, the expected array becomes `[]`. The guard fails closed in **both** directions — an unexpected offender reddens it, and so does the expected offender disappearing — so this task **cannot** land without updating the literal. That is deliberate, not a nuisance.
- **`secondary.summary` is declared required on `ArchetypeCardProps` and never read.** Only `.name` and `.matchPercentage` are used, in both branches. `src/components/results/ResultsView.tsx` dutifully supplies it today. Drop it from both sides. Note that the Step 3 block above already passes `secondary={archetype.secondary}` wholesale rather than rebuilding the object, so only the interface side needs the trim — TypeScript's excess-property check does not apply to a variable reference. (As shipped: it came off `ResultsViewProps` and both page callers too — note 12.)
- **`lowMatch`'s `< 55` is an unnamed literal whose named form already exists.** `src/lib/scoring-types.ts` exports `LOW_MATCH_THRESHOLD_PCT = 55` beside its siblings `DISTINCTIVE_MATCH_CEILING = 72` and `DISTINCTIVE_STDDEV_FLOOR = 0.4`, and `tests/unit/scoring-archetypes.test.ts` pins it — but `ArchetypeCard` spells the number out instead of importing it. Correct and reachable, just undiscoverable, and it can now drift from the scoring engine silently. Import the constant. (The addendum as routed here said "hoist it beside its siblings"; the constant is already hoisted — the component simply does not use it.)
- **Optional: close the pole-label wrap band.** Task 7's investigation of the Task 4 addendum (see that section) found the axis row's endpoint labels wrap over exactly `V ∈ [560, 599)`, and that this task's 820px container does not close it, because at a 560px viewport the container is viewport-limited. If it is judged worth fixing, the fix is one token in `AxisBreakdownCard.tsx` — `min-[560px]` to `min-[600px]` on the 3-column breakpoint — and **not** `shortPole`, which is lossy. Explicitly optional. (As shipped: **declined here and routed to Task 12** — note 11.)

**Addenda from Task 8 — both resolved; see "As shipped" note 10.** Both in files or interfaces this task owns:

- **Widen `ArchetypeCardProps.userScores` to carry `axisId`, and apply `normaliseByAxisId` in `MiniRadar`.** This is the unfinished half of Task 7's addenda B and D — see Task 8's "As shipped" note 9. `userScores` is built in `ResultsView` as `axisData.map((a) => a.finalScore)`: bare numbers with no ids, so `MiniRadar` maps vertex `i` to axis `i + 1` positionally and cannot normalise, while `RadarChart` — whose prop carries `axisId` — already does. Without this, the mini radar's user polygon and its fixed axis-1-through-12 prototype can misalign against *each other*, which is the one comparison that chart exists to make. It is latent today only because `order === id` for all twelve rows of `src/data/axes.ts`, while `src/app/results/page.tsx` maps in scoring-pipeline order and `src/app/results/[profileId]/page.tsx` orders by `axis.order`. Widen the prop, update the one call site, and call `normaliseByAxisId` in `MiniRadar`. (As shipped: the call site now passes `axisData` itself, and `puts each axis on its own spoke, whatever order the caller built` pins it with a reversed fixture.)
- **Drop the now-unread `domain` field from `RadarAxisScore`** in `src/lib/radar-geometry.ts`, and from the pad literal inside `normaliseByAxisId`. Task 8's sr-only Domain column derives the domain name from the axis id rather than reading the field, so nothing reads it any more (that task's "As shipped" note 5). A wider object still satisfies the narrower interface, so `AxisDisplayData` keeps passing unchanged. **Warning:** do not confuse the two `domain` fields. `ResultsView` groups the axis breakdown with `axisData.filter((a) => a.domain === DOMAIN_COLORS[key].name)` — that is `AxisDisplayData`'s own `domain`, structurally unrelated to the radar interface and load-bearing for the four domain groups. Dropping the `RadarAxisScore` field must not touch that grouping. (As shipped: dropped, the grouping untouched, and `RadarAxisScore.confidence` narrowed to `AxisConfidence` in the same edit.)

---

### Task 11: Drift guards for the results directory

**Files:**
- Modify: `tests/unit/results-chrome.test.ts` — append a final `describe`

**Interfaces:** none. This task adds no source change; it pins what the previous seven tasks established.

**What a guard is for here.** Styling changes resist conventional assertions, and the long-term risk in a token migration is drift, not breakage. Each guard below covers something that, if it regressed, would render *plausibly* — a muddy dot on a dark ground, a label that fails AA, a second primitive quietly reappearing — and would fail nothing else.

- [x] **Step 1: Write the guards**

Append to `tests/unit/results-chrome.test.ts` — into the `describe` Task 7 opened, not a second one. As shipped, and reproduced here from `c6e6709` rather than as drafted: the sweep spans two directories, two of the drafted guards were wrong, one more guard landed than the draft has to add, and three were strengthened in review. See "As shipped" notes 1-9.

```ts
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
    // 12 occurrences.
    //
    // RATCHET. This list must only ever shrink, and it must reach []. The one
    // entry is what widening the sweep to src/app/results surfaced: eight
    // occurrences in the per-axis detail page, at :108, :115, :122, :153,
    // :158, :163, :168 and :200. They are not one mechanical substitution but
    // three roles — 11px structural labels (-> --text-label), 13px prose
    // (-> --text-secondary), and a DELIBERATE de-emphasis inside
    // `r.selectedPole === "A" ? … : "text-text-tertiary"`, where the token is
    // doing real work distinguishing an unselected pole from a selected one
    // and the replacement has to preserve that contrast relationship. Eight
    // per-line judgement calls want a design review and a contrast
    // measurement in a real browser, which is Task 12's job, not a
    // guards-only task's. Routed there; delete this entry with that fix, and
    // with the one in the Tailwind-ramp guard below — both empty together.
    expect(offenders).toEqual({ "src/app/results/[profileId]/[axisId]/page.tsx": 8 });
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

    // RATCHET, the second in this block and the twin of the sub-AA one above:
    // ten occurrences in the same un-migrated per-axis detail page, at :77
    // (text-stone-600 and text-stone-800), :83, :142, :153 (bg-stone-100 and
    // text-stone-800), :163 (the same pair), :182 and :196. Same reasoning for
    // deferring the fix: the page is not in this phase's scope, the
    // replacements are per-line judgement calls, and Task 12 can measure them
    // in a real browser. Both ratchets should reach {} in that one commit.
    expect(offenders).toEqual({ "src/app/results/[profileId]/[axisId]/page.tsx": 10 });
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
```

- [x] **Step 2: Run the guards**

Run: `npx vitest run tests/unit/results-chrome.test.ts`
Expected: PASS. Any red here is a real finding from Tasks 4–10, not a bad guard — fix the source, not the assertion.

As shipped: PASS, **70 tests** in this file and **787 across 64** for the suite. Two guards did red on first run, and in both cases the finding was real and neither was in the directory the draft scanned — see notes 2 and 3. They are pinned as ratchets and routed to Task 12, which is the first task in this phase with a browser.

- [x] **Step 3: Prove the guards by mutation**

A guard that passes vacuously is worse than no guard, and this phase's tokens are exactly the kind that make a mutation invisible. Apply each mutation, confirm the expected suite reddens, then revert it. **Record the result of each in the PR description**, including any that fail to redden.

| # | Mutation | Must redden |
| --- | --- | --- |
| 1 | `RadarChart.tsx`: `var(--mark-primary)` → `var(--domain-economic)` on the user polygon | `never names --domain-economic where --mark-primary is meant` |
| 2 | `ArchetypeCard.tsx`: `border-rule-strong` → `border-stone-900` on the label rule | `puts the section label over a hard ink rule` |
| 3 | `AxisBreakdownCard.tsx`: delete `min-[560px]:grid-cols-[24px_minmax(0,1fr)_210px]` | `lays the row out on the mock's three-column grid` |
| 4 | `AxisBreakdownCard.tsx`: re-add `bg-surface-2` to the row wrapper | `separates rows by a rule instead of a zebra fill` |
| 5 | `PairedAxisScale.tsx`: `getDomainMarkVar(axisId)` → `domain[600]` on dot A | `steps respondent A's dot to its domain mark rather than a fixed hex` |
| 6 | `PairedAxisScale.tsx`: in `describePosition`, `0.45` → `0.5` | `puts each boundary in the bucket above it` |
| 7 | `CompassPlot.tsx`: `var(--text-primary)` → `var(--stone-900)` on the dot | `plots the respondent as a 12px ink dot the engine positions` **and** `keeps fixed ramp literals out of the ink and mark positions` |
| 8 | `CompassPlot.tsx`: swap the `Traditional` and `Progressive` label positions | `keeps the compass pointing the way the scoring engine does` |
| 9 | `ResultsView.tsx`: `DOMAIN_MARK_VARS[key]` → `DOMAIN_COLORS[key][600]` on the domain rule | `heads each domain group with a 2px rule in the domain's own colour` **and** `routes every data mark through the stepping tokens` |
| 10 | `globals.css`: dark `--domain-power` → `var(--slate-600)` | `steps every domain mark from its 600 tone to its 400 tone in dark` |
| 11 | `globals.css`: delete `line-height: 1.6` from `body-s` | `names the delta's most-used sans size so the pair cannot drift` |
| 12 | `ComparisonScoreBar.tsx`: reinstate a local `delta <= 0.3 ? "very close" : ...` ladder | `derives the gap badge from the same two scores as the scale, not an independent prop` |
| 2b | `ArchetypeCard.tsx`: `border-rule-strong` → `border-stone-900` on the **distinctive** branch's label rule (added in review — see note 5) | `keeps the fixed ramp out of the Tailwind class spelling too` |
| 4b | `AxisBreakdownCard.tsx`: `${axisId % 2 === 0 ? "bg-surface-2" : ""}` on the row wrapper (added in review — see note 8b) | `keeps the zebra fill retired` |
| 9b | `ResultsView.tsx`: `DOMAIN_MARK_VARS[key]` → a literal colour string on the domain rule, **leaving the import in place** (added in review — see note 8a) | `routes every data mark through the stepping tokens` |
| R1 | `src/app/results/[profileId]/[axisId]/page.tsx`: add a ninth `text-text-tertiary` and an eleventh `text-stone-800` **inside the already-pinned file** (added in review) | both ratchets, notes 2 and 3 |

Mutation 10 is the one worth dwelling on: a guard written against the *light* value only would pass, because that is where the two tokens agree. Every token in this phase has to be asserted on both sides.

**Results as shipped: all twelve drafted rows killed, run twice — once by the implementer, once independently by the reviewer — plus the four rows above.** Three things are worth recording rather than just ticking:

- **Row 12 has a documented equivalent mutation, exactly as Task 10's addendum predicted.** A local gap ladder that reproduces `describeGap`'s strings byte-for-byte survives and reddens nothing, because the guard pins the badge's rendered text against the `aria-label`'s trailing clause and both spellings produce the same text. Row 12's kill comes from the *string change* a hand-written ladder almost always carries, not from the ladder's existence. Stated here so a future implementer who applies the byte-identical form does not read a green suite as a bad guard.
- **Rows 2b, 4b and 9b all survived the state the reviewer had already approved**, and each is a distinct class of hole: a branch the mount tests never render (2b), a spelling the regex was too literal to see (4b), and a positive assertion satisfied by a surviving import rather than by a use (9b). All three are killed now, by the guard changes in notes 5, 8b and 8a respectively.
- **R1 is a property demonstration, not a coverage claim.** It shows that the two ratchets fail closed *upward* as well as downward: a pinned file growing a further offence reds them, because they assert per-file counts rather than a file list. That is the whole reason `offenceCounts` exists (note 9).

- [x] **Step 4: Commit**

```bash
git add tests/unit/results-chrome.test.ts
git commit -m "test(design): guard the results page against design drift"
```

Shipped as `c6e6709`, one commit over one file — `tests/unit/results-chrome.test.ts`, +288/−22. Verified final state: **787 tests across 64 files** (70 of them in this file), lint clean at `--max-warnings=0`, `npx tsc --noEmit` clean. The `describe("results chrome drift guards")` block now holds **eleven** guards: three pre-existing — Task 7's sub-AA class guard and the `var(--text-tertiary)` and raw-hex guards Task 9 added — and eight written here. The draft above lists eight, one of which duplicated Task 7's, so seven were owed; the eighth is note 5.

**As shipped.** Implementation and review moved this task in twelve ways from the text above:

1. **The sweep was widened to the whole feature, and the field it exposes was renamed.** It now spans `src/components/results` **and** `src/app/results`, through `tests/helpers/source-files.ts` as the post-Task-5 addendum below directs — eight files, five components and three pages. **The sweep's `name` field became `path`**, carrying a repo-relative POSIX path, because three of the eight files are called `page.tsx` and a bare-basename assertion could therefore pass while naming the wrong file. All three pre-existing guards were converted with it, along with the one non-guard consumer of the sweep — `AxisBreakdownCard`'s ScoreBar-import assertion in `describe("AxisBreakdownCard")`, which now looks the file up by full path. The helper defaults to `.ts` as well as `.tsx`, so a non-component helper dropped into either directory is swept too and the `unswept` guard reds until someone accounts for it.

2. **Ratchet one: eight `text-text-tertiary` occurrences, pinned rather than fixed.** Widening the sweep did exactly what the post-Task-5 addendum said it would — it found the violation that addendum was written about, still live, in `src/app/results/[profileId]/[axisId]/page.tsx` at `:108`, `:115`, `:122`, `:153`, `:158`, `:163`, `:168` and `:200`. It is **not** one mechanical substitution. The eight split across three roles: 11px structural labels that want `--text-label`, 13px prose that wants `--text-secondary`, and `r.selectedPole === "A" ? "bg-stone-100 text-stone-800" : "text-text-tertiary"` at `:153` and `:163`, where the token is carrying a real selected/unselected distinction and any replacement has to preserve that *relationship*, not merely clear AA. Eight per-line contrast judgements need a browser; this task has none. Pinned as a per-file count and **routed to Task 12**.

3. **Ratchet two: ten Tailwind stone-ramp classes, in the same un-migrated file.** The new guard of note 5 found them: `text-stone-800` ×6 at `:77`, `:83`, `:142`, `:153`, `:163`, `:182`; `bg-stone-100` ×2 at `:153` and `:163`; `text-stone-600` ×2 at `:77` and `:196`. Same file, same reasoning, same routing — and deliberately the same commit, since the `:153`/`:163` pairs are two halves of one ternary and fixing the sub-AA arm without the ramp arm would leave the row half-migrated. **Both ratchets must reach `{}` in the same Task 12 commit.**

4. **Two of the drafted guards were wrong against the shipped tree, exactly as the Task 8 and Task 10 addenda predicted.** The stepping-token positive count is **2**, not the draft's `3` — `RadarChart.tsx` (Task 8) and `ResultsView.tsx`'s domain rule (Task 10); the third consumer is `PairedAxisScale`, outside the sweep (note 12). And `never names --domain-economic where --mark-primary is meant` and `keeps fixed ramp literals out of the ink and mark positions` both scanned raw text, where `RadarChart.tsx`, `ArchetypeCard.tsx` and `CompassPlot.tsx` carry deliberate "not this token" notes at exactly the lines the distinction matters; both now scan through the existing `stripComments`. **No source comment was reworded to suit a guard**, which was the addendum's actual instruction and the harder half of it.

5. **An eighth guard was written beyond the draft, and it closes a real hole rather than rounding out a set.** `keeps the fixed ramp out of the Tailwind class spelling too` matches `/\b(?:text|bg|border|fill|stroke|ring|divide|from|via|to)-(?:stone|slate|sage|clay)-(?:50|…|950)\b/` through `stripComments`. The `var()` guard beside it sees no class spelling at all, and `ArchetypeCard`'s **distinctive**-branch label rule was covered by nothing else: `puts the section label over a hard ink rule` only ever mounts the primary branch, so swapping that rule to `border-stone-900` was verified to survive the file as it then stood, all sixty-nine tests of it. **Task 12's browser pass would not have caught it either** — `border-stone-900` and `border-rule-strong` render near-identically in light mode, so it shows only in dark, on a branch that needs a contrived profile to render at all. Verified caught after the fix; it is row 2b of the table above.

6. **The `var()` ramp arm was folded out to all four ramps.** `var(--slate-600)`, `var(--sage-700)` and `var(--clay-800)` are as fixed-across-modes as `var(--stone-900)`, and the draft matched only the Stone family. `500` is spared for **`stone` only** — the documented sparing, which now covers the compass contour strokes (Task 9) as well as the mini radar's prototype stroke, two consumers rather than the one the draft's comment credited. The other three ramps have no such use, so their `500`s stay closed, and the guard still asserts `{}` with no second ratchet needed.

7. **Three guards were strengthened past the draft, each proven non-vacuous by mutation.** The stepping-token positive half stopped being `toHaveLength(3)` — a bare length survives one consumer regressing while another is added, which is the Task 8 legend-swatch failure precisely — and became a per-file count (note 8a). `never layers a colour over a self-contained role` now also asserts `captioned.length > 0`, so it cannot pass by `caption-italic` having disappeared from the page. **Correction to this reconciliation's own brief:** the `var(--mark-primary)` positive half was *already* a sorted file-list assertion in the draft, not a `toHaveLength`; what changed there is `name` → `path` and the routing through `stripComments`. Two guards were strengthened in kind, one in spelling.

8. **Two vacuities were found in review and fixed.** (a) **The stepping-token positive half was satisfied by an unused import.** Replacing `ResultsView`'s only real use with a literal colour string left the guard green, because the draft's identifier-only regex still matched the surviving `import` line, and only the mount test noticed. It now matches at use sites — `/getDomainMarkVar\(|DOMAIN_MARK_VARS\[/` — **and** asserts per-file counts (`RadarChart.tsx: 2`, `ResultsView.tsx: 1`), because use-site matching alone still cannot see the intra-file case where one of `RadarChart`'s two consumers regresses and the other holds the file on the list. (Lint would red the unused import — but lint is a different gate than the one this guard claims to be.) (b) **`keeps the zebra fill retired` matched the literal `i % 2`**, so `${axisId % 2 === 0 ? "bg-surface-2" : ""}` walked straight past it; the rows here are mapped over `axisId` and `index`, never `i`. Broadened to `/\b[A-Za-z_$][\w$]*\s*%\s*2\b/`, whitespace optional on both sides.

9. **A shared `offenceCounts(pattern)` helper now backs the counting guards.** It returns `{ path: count }` with clean files omitted. Both ratchets and the four `{}`-empty guards — stepping-token negative, `var()` ramp literals, zebra, focus-ring/corner — plus the stepping-token positive count assert against it, which is six guards and seven assertions in all. **Correction to this reconciliation's own brief:** the five array-style guards (`var(--text-tertiary)`, raw hex, `unswept`, `--domain-economic` with its `var(--mark-primary)` half, and `caption-italic`) do **not** route through it; they assert sorted path lists, not `{}`. The point of the helper is the direction a file-list ratchet cannot fail in: pinned to a list alone, a ratchet stays green while the file it names gets worse. Pinned to a count, it reds — row R1.

10. **The focus-ring/corner guard adopted the repo-wide pattern verbatim.** The draft's local shorthand `rounded-(?:lg|xl|\[(?:8|12)px\])` matches neither `rounded-t-lg` nor `rounded-tl-[8px]` and has no trailing boundary, so `rounded-lg` could match inside a longer token. It now carries `design-system-tokens.test.ts:210`'s pattern character for character, and the guard's "duplicated from the repo-wide guardrails" comment was reworded to say what the shorthand *would* have missed — a comment claiming a guard mirrors another one is worth only as much as the mirroring.

11. **Three one-line fixes to pre-existing content, deferred here from Task 9's reconciliation — two landed clean, and the third replaced a stale number with another stale number.** The archetype label separation was corrected from 23.05 / 19.06 to **23.0068 / 19.0189**, with the worst case across all thirteen `primaryArchetypeId` selections stated as **22.70 / 18.72**; and the ramp guard's `var(--stone-500)` sparing now credits the compass contours alongside the mini radar's prototype stroke (note 6). The third: the `drops the decoration the mock is right to cut` test's stale `:56-61` hook-convention citation was re-derived and reworded to "the hook convention at the top of this file (`:103-108`)" — and `:103-108` is **wrong at `c6e6709`**, landing inside `offenceCounts`'s body. The convention sits at **`:125-130`**, displaced again by the two helper docstrings this very commit added above it. The reword does most of the work the fix was for, since "at the top of this file" survives any shift; the parenthetical does not. Harmless to the suite — no test reads a comment — and **routed to Task 12**, with a note that the parenthetical is the part that keeps going stale and is worth dropping rather than re-deriving a third time.

12. **`src/components/PairedAxisScale.tsx` remains outside the sweep, deliberately, and the guard that would otherwise over-claim says so.** It draws `AxisBreakdownCard`'s domain dots from outside *both* swept directories, so the one file in this phase that routes a **domain** mark is the one file none of these guards see. Pulling it in would drag a phase-5-deferred shared primitive — three consumers, across results, comparison and groups — under the sub-AA, focus-ring and hex guards at the same time, which changes what a failure here means for two other features. The mark is independently covered: the table's mutation 5 is killed by `tests/unit/paired-axis-scale.test.ts` while every guard in this block stays green. Recorded inside `routes every data mark through the stepping tokens`, next to the count it explains.

**Addendum (reconciled after Task 5) — resolved; see "As shipped" note 1.** `resultsSources` is built from `readdirSync` scoped to `src/components/results/`, so every guard in this task only ever sees that one directory. Task 5 shipped the gap: its `text-text-tertiary` violation (see Task 5's "As shipped" note) landed at `src/app/results/[profileId]/[axisId]/page.tsx` — the same feature, under `src/app`, not `src/components/results` — and none of these guards would have caught it; it surfaced only because a human review pass happened to look at that file. The eventual guard here should also sweep `src/app/results/**`, not just `src/components/results/`. `tests/helpers/source-files.ts`, extracted in Task 5, already does a recursive extension-filtered sweep with `node_modules`/`generated`/dot-directory pruning built in, so it is the right tool for that recursive sweep rather than a second hand-rolled `readdirSync` walk. Left as an addendum rather than a rewrite of the guards above — this task's implementer should act on it.

**Addendum (reconciled after Task 7) — both points honoured; one `describe`, one sub-AA guard.** The `describe("results chrome drift guards")` block in the Step 1 draft above **already exists** in `tests/unit/results-chrome.test.ts` — Task 7 opened it, to hold one guard it needed early. Two consequences for this task:

- **Do not write a second sub-AA guard.** Task 7's `keeps the migrated results components off the sub-AA tertiary token` is the same check as this draft's `retires text-text-tertiary from the results page`, differing only in that Task 7 pinned the then-current offender list (`["ResultsView.tsx"]`) rather than `[]`, and sorted it because `readdirSync` order is not guaranteed. Task 10 shrinks that literal to `[]`. Extend or simply keep the existing test — do not append a duplicate under a new name.
- **Do not re-open the `describe`.** Append the remaining guards into the block Task 7 created rather than declaring a second `describe` of the same name; two same-named blocks run, but they make the reporter ambiguous and hide which one a failure came from.

**Addendum (reconciled after Task 8) — all three resolved; see "As shipped" notes 4 and 8a.** Two of the guards drafted above will now red on their own subject matter, and a third has live work:

- **The two source-text guards red on comments, not on code — strip comments before scanning.** `never names --domain-economic where --mark-primary is meant` does `text.includes("--domain-economic")` over raw file text and expects `[]`; that string now appears in explanatory comments in **both** `RadarChart.tsx:142` and `ArchetypeCard.tsx:99`, each saying the token is deliberately *not* used there. `keeps fixed ramp literals out of the ink and mark positions` matches `/var\(--stone-(900|800|700|600|100|50)\)/` and expects `[]`; `var(--stone-600)` appears in comments in the same two files (`RadarChart.tsx:141`, `ArchetypeCard.tsx:98`). Task 7 introduced the pattern and Task 8 doubled it. **Strip `//` line comments and `/* */` blocks from each file's text before scanning.** Do not reword the comments to suit the guards: they are correct, they sit exactly where a future reader needs them, and a later implementer tempted to weaken a guard that exists to catch a defect this project has already shipped twice is much the worse outcome. (`CompassPlot.tsx:203-226` also holds five *real* `var(--stone-600)` uses; Task 9 removes them, and they must keep redding until it does.)
- **`routes every data mark through the stepping tokens` has live work, and its positive count looks stale.** That half asserts `resultsSources.filter(/getDomainMarkVar|DOMAIN_MARK_VARS/)` has length **3**. Before Task 8 no file in `src/components/results/` matched at all; Task 8 made `RadarChart.tsx` the first, and Task 10's `DOMAIN_MARK_VARS[key]` domain rule makes `ResultsView.tsx` the second. `AxisBreakdownCard` draws no domain mark itself — its dots come from `src/components/PairedAxisScale.tsx`, outside the scanned directory — and `CompassPlot` has none, so the literal should be **2** unless Task 9 or 10 introduces a third. The negative half is live too: during Task 8, reverting the radar's legend swatch from `DOMAIN_MARK_VARS[key]` to a fixed 600 hex was undetectable by every test then in place, which is why that task added a local assertion on the four swatches. This guard is the general form of it.

**Addendum (reconciled after Task 9) — resolved, except that one of its three one-line fixes re-staled; see "As shipped" note 11.** Task 9 shipped part of this task's subject matter, because it is what turned two of these guards green. Five consequences:

- **Step 1 says to "append" a `describe("results chrome drift guards")` that already exists — and it now holds three guards, not one.** Task 7 created the block; Task 9 added the two below. Followed literally, Step 1 produces a second same-named block whose `retires text-text-tertiary from the results page` (`[]`) contradicts the existing `keeps the migrated results components off the sub-AA tertiary token` (`["ResultsView.tsx"]`, shrinking to `[]` at Task 10). **Extend the existing block. Do not open a second one.**
- **`stripComments` already exists**, at `tests/unit/results-chrome.test.ts:56-70` (Task 9), with the `^\s*` anchoring rationale and the `"/*"`-string-literal gap recorded in its docstring. Use it; do not write a second one. It is also the helper Task 8's addendum above says this task needs for the guards-redding-on-prose problem — that work is done, and the pre-existing sub-AA guard was retrofitted onto it in the same change.
- **The `var(--…)` spelling guards already exist.** `keeps them off the sub-AA tertiary token in its OTHER spelling too` (`var(--text-tertiary)`) and `keeps raw colour hexes out of the results components` (`/#[0-9a-fA-F]{3,8}\b/`) both scan through `stripComments` and both assert `[]`. Extend them if this task widens the sweep; do not duplicate them under new names.
- **Two notes above are now settled by Task 9.** The parenthetical about `CompassPlot.tsx:203-226` holding five real `var(--stone-600)` uses is resolved — all five are gone, and the file's only remaining ramp literal is `var(--stone-500)` on the contour strokes. Note that `keeps fixed ramp literals out of the ink and mark positions` justifies sparing `var(--stone-500)` as "the mini radar's prototype stroke"; it is now also the compass contours', so that comment wants a word when this guard is written. And `routes every data mark through the stepping tokens`: Task 9 introduced no domain mark, so the positive count stands at **2** after Task 10, exactly as the note above predicts.
- **Three one-line fixes to this file, found during Task 9's reconciliation and deliberately not made there** (Task 9 was already at review sign-off and these change no behaviour): the `drops the decoration the mock is right to cut` test cites "the convention at :56-61", which `stripComments` displaced to `:72-77`; and `keeps the contour lines and the archetype markers` states the closest archetype label pair as 23.05 units at `PADDING = 50` and 19.06 at the old 76, where the measured values are **23.0068** and **19.0189** (22.70 and 18.72 in the worst case across all thirteen `primaryArchetypeId` selections, since the primary's label sits one unit higher). Every conclusion drawn from those numbers holds — see Task 9's "As shipped" note 11.

**Addendum (reconciled after Task 10) — all four points resolved; see "As shipped" notes 4, 6 and 12, and Step 3's results. Two of the guards drafted above will red against the tree as it now stands, and in both cases it is the guard that is wrong, not the source.**

- **`routes every data mark through the stepping tokens` — the positive half's literal is `3`; the true count is `2`.** The two files in `src/components/results/` naming `getDomainMarkVar` or `DOMAIN_MARK_VARS` are `RadarChart.tsx` (Task 8) and `ResultsView.tsx` (Task 10, the domain rule). The third mark consumer is `src/components/PairedAxisScale.tsx`, which draws `AxisBreakdownCard`'s dots from **outside** the scanned directory and is therefore invisible to every guard in this block — see the backlog item that deliberately leaves it to phase 5. Task 8's addendum above predicted **2**; Tasks 9 and 10 both shipped without adding a third, so this confirms it. Write the literal as `2`, or widen the sweep and write `3` — but not both halves of that as drafted.
- **`never names --domain-economic where --mark-primary is meant` still scans raw text.** The draft above does `text.includes("--domain-economic")`; `stripComments` (Task 9, at the top of this file) exists precisely for this. `RadarChart.tsx:142` and `ArchetypeCard.tsx:107` each carry a deliberate "**not** `--domain-economic`" prose note explaining why the alias is avoided *at that exact line*, so the raw form reports both files as offenders — the guard redding on the documentation of the rule it enforces, which is the precise failure `stripComments` was extracted to prevent. Route this guard, and the ramp-literal guard beside it, through `stripComments(text)` exactly as the three existing guards in the block already do. **Do not reword the comments to suit the guard.** The ramp-literal guard is now worse off than Task 8's addendum recorded: raw, it reds on **three** files, not two — `ArchetypeCard.tsx` and `RadarChart.tsx` on `var(--stone-600)`, and `CompassPlot.tsx` on the `var(--stone-900)` in the ink-dot comment Task 9 shipped ("`--text-primary`, not `var(--stone-900)`: Stone 900 ink on a Stone 900 ground is invisible"). Through `stripComments` all three are clean, and the only ramp literal left in real code across the directory is the `var(--stone-500)` this guard spares — now the compass contours' stroke as well as the mini radar's prototype, as Task 9's addendum notes.
- **Four cells of the mutation table below named a test inaccurately, and are corrected in place.** Mutation 12's `labels the gap from the shared buckets, not a local ladder` names a test that exists nowhere in the suite; the guard that actually reddens on a reinstated local ladder is Task 6's `derives the gap badge from the same two scores as the scale, not an independent prop`, which pins the badge's exact strings against the `aria-label`'s trailing clause. (A local ladder reproducing `describeGap`'s strings byte-for-byte would be an equivalent mutation and reddens nothing — say so in the PR if that is what gets applied.) Mutations 5, 9 and 11 each named their test by a prefix of its shipped title; all three now carry the full title, so the table can be checked by `grep` rather than by memory.
- The sub-AA literal is settled: Task 10 rewrote `ResultsView.tsx` and shrank `keeps the migrated results components off the sub-AA tertiary token` to `[]` in the same commit, as its Task 7 addendum required. There is nothing left for this task to do there beyond not writing a second copy of it.

---

### Task 12: Full verification and the two-mode visual check

**Files:** none, unless a gate finds something.

**Interfaces:** none.

- [x] **Step 1: Run all five gates**

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: `npm test` reports **787 tests across 64 files**, all passing. Lint runs at `--max-warnings=0`; a new warning is a fix, never a raised threshold.

That count is the running total, not a Task 12 target: **four** test files were added over this phase — `tests/unit/results-chrome.test.ts` (Task 4), `tests/unit/group-score-bar.test.ts` (Task 5), `tests/unit/radar-geometry.test.ts` (Task 8) and `tests/unit/scoring-narrowing.test.ts` (Task 10). `tests/helpers/source-files.ts` and `tests/helpers/client-component-env.ts` are helpers and are not collected. Task 9 added ten tests and no new file; Task 10 added nineteen, thirteen of them in `results-chrome.test.ts` and six in the new file above; Task 11 added eight, all guards in `results-chrome.test.ts`, bringing that file to **70**. Task 11 was the last task to add tests, and Task 12 added none — it only edited existing assertions — so 787 / 64 is the number at the end of the phase as well as at its start.

*(This paragraph replaces a "60 files / 676 tests" literal that went stale at Task 5 and a flag beneath it that tracked the drift through Tasks 8-11 without editing the literal. Task 12's reconciliation folded the two together, which is what that flag deferred to here.)*

If the lockfile changed for any reason, run `npm ci` **before** re-running these — a stale `node_modules` makes a local green disagree with CI.

- [x] **Step 2: Run the e2e suite**

Start the database first, and make sure no other dev server is already holding port 3000 — Playwright will happily adopt a stranger's server and produce a wall of failures that have nothing to do with this diff:

```bash
docker compose up -d --wait postgres
lsof -i :3000 || echo "port 3000 free"
npm run test:e2e
```

Expected: PASS. Three assertions in `tests/e2e/results.spec.ts` are coupled to this phase's markup — `getByText("Assessment results")`, `getByRole("button", { name: "Compare with someone" })` and `getByPlaceholder("Paste their results link")` — and must pass **unmodified**. If a Playwright browser install fails against Google's apt repository in under a minute, that is the known flake, not this diff: re-run.

- [x] **Step 3: Check `/results` in both colour schemes, on the production build**

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

**Routed here by Task 10's reconciliation — all three settled; see "As shipped" notes 2, 8 and 11.** Three browser-only items, none of which jsdom could settle:

- **The `V ∈ [560, 600)` pole-label wrap band is still open.** Task 7 found it, Task 10 was offered the one-token fix (`min-[560px]` → `min-[600px]` on `AxisBreakdownCard`'s 3-column breakpoint) and **declined** it: 560px is load-bearing four times on this page — `AxisBreakdownCard.tsx:76` and `:101`, `ArchetypeCard.tsx:169`, `ResultsView.tsx:180` — and again in `NavBar.tsx`, the quiz page and the home page, so forking one of them steps the page's columns at two different widths. Re-measure it in the browser at 560, 575 and 599 CSS px, and apply the change here if it is still wanted, checking the column alignment at the same three widths. See Task 10's "As shipped" note 11. (**Declined again, on measurements — note 8.** At 600px the scale column is 278px and three of twelve rows still wrap; the change relocates the cliff rather than closing it, and wrapping only clears at ~660px. The wrap itself is clean: zero overlap, pole B right-flush, no clipping. **Closed, not routed onward.**)
- **A pre-existing hydration mismatch on `/results`.** `RadarChart`'s `[data-radar-label]` `y` renders `123.72312247338783` server-side and `123.7231224733878` client-side — a float-to-string precision difference, not a logic one. Confirmed to reproduce on unmodified `HEAD`, so it belongs to Task 8's file rather than Task 10's diff. It is a live console error on every load of the page this phase is about, so it belongs in this browser pass. (**Fixed — note 11. The diagnosis above is wrong**: the two engines compute different doubles, because `Math.sin`/`Math.cos` are not required to be correctly rounded and Node and Chromium ship different ports. Six elements were affected, not one, and it reproduces only under `next dev`.)
- **The tension panel's `border-l-2 border-l-warning`** is item 3 of the checklist above. Task 10 shipped the class form rather than the inline-style fallback and could not verify it — jsdom computes neither width nor colour — so the measurement is genuinely outstanding, not a formality. (**Measured — note 2. The class form won**: `2px` / `rgb(217, 119, 6)` in both schemes. No fallback applied.)

**Routed here by Task 11's reconciliation — both done; see "As shipped" notes 9 and 10.** One piece of source work — the last this phase has queued — and one one-line correction:

- **Empty both ratchets, in one commit.** `src/app/results/[profileId]/[axisId]/page.tsx` holds **8** `text-text-tertiary` occurrences (`:108`, `:115`, `:122`, `:153`, `:158`, `:163`, `:168`, `:200`) and **10** Tailwind stone-ramp classes (`text-stone-800` ×6 at `:77`, `:83`, `:142`, `:153`, `:163`, `:182`; `bg-stone-100` ×2 at `:153`, `:163`; `text-stone-600` ×2 at `:77`, `:196`), pinned as the two ratchets in `results-chrome.test.ts` — see Task 11's "As shipped" notes 2 and 3. Fix the source and delete both ratchet entries in the same commit: the `:153` and `:163` pairs are two arms of one ternary, so emptying one ratchet without the other leaves those rows half-migrated. **Measure the contrast in a real browser, in both modes.** The eight are three different roles — 11px structural labels (→ `--text-label`), 13px prose (→ `--text-secondary`), and `r.selectedPole === "A" ? "bg-stone-100 text-stone-800" : "text-text-tertiary"` at `:153` and `:163`, where the token distinguishes an unselected pole from a selected one and the replacement must preserve that **contrast relationship**, not merely clear AA on its own. Both ratchets are written to red if the file is fixed *or* worsened — they assert per-file counts, not a file list — so this cannot land silently in either direction. **Note the interaction with item 8 of the checklist above:** that item asks whether the restored `Composite score` label reads as deliberate emphasis beside "the three sibling `text-text-tertiary` labels" — those siblings are `:108`, `:115` and `:122`, three of the eight. Do item 8 **before** the fix, or it has no comparison left to make; if the three move to `--text-label`, `Composite score` stops being distinguishable from them at all and the question becomes what, if anything, should carry the emphasis instead.
- **A stale line citation in `results-chrome.test.ts`.** The `drops the decoration the mock is right to cut` test cites "the hook convention at the top of this file (`:103-108`)"; at `c6e6709` the convention sits at **`:125-130`** and `:103-108` lands inside `offenceCounts`'s body. This is the second time the citation has gone stale — Task 9 created it as `:56-61`, Task 11 re-derived it and the same commit's own helper docstrings displaced it again. Prefer **dropping the parenthetical**: the reworded prose anchor ("at the top of this file") already survives any shift, and the number is the only part that keeps rotting. See Task 11's "As shipped" note 11. (**Dropped.** The citation's own history — `:56-61`, then `:103-108`, both stale within a commit — now stands in its place, so the omission reads as deliberate rather than as an oversight for a fourth implementer to "fix".)

Capture one screenshot per mode for the PR.

**As shipped.** The browser pass moved this task in eleven ways from the text above, and a round of review added a twelfth. Nothing in it was a formality: five of the eleven are defects the first eleven tasks could not have seen, because none of them ran a browser and four of the five are invisible to jsdom.

1. **The e2e suite was red before this task touched anything, and no task between 10 and 12 would have noticed.** `tests/e2e/quiz-flow.spec.ts:93` asserted `getByRole("heading", { name: "12-axis radar" })`; Task 10 retitled the section **Twelve-axis radar** and nothing pinned the old string outside Playwright, which ran once in twelve tasks — so the break sat latent for two commits. **Correction to this reconciliation's own first draft**, which said "no unit test renders `ResultsView`'s section heads": `results-chrome.test.ts` mounts the whole view in ten tests. What was true is that not one of them asserted a section *title* — only the structural classes around them. A four-string assertion now does, by text rather than by hook (the coupling being protected is to the words, since that is what `getByRole("heading", { name })` reads), and it reds on exactly that rename. Fixed by following the rename; the three assertions this phase's markup is coupled to (`Assessment results`, `Compare with someone`, `Paste their results link`) all passed **unmodified**. Final: **21 passed**.

   A second, separate e2e episode is worth recording because it wasted a cycle and the memory note that predicts it is already written down: a wall of seven failures — every signup-backed spec timing out at 180s — turned out to be **this task's own `npm start` still holding port 3000**, which Playwright adopted instead of starting its own server. `lsof`/`ss` on 3000 before every e2e run, not just the first.

2. **Checklist item 3 — `border-l-2 border-l-warning` — won.** The genuinely open question from Task 10. Computed on the production build, in both schemes: `border-left-width: 2px`, `border-left-color: rgb(217, 119, 6)`, which is `--warning` exactly, against the shorthand's `1px` `--border-secondary` on the other three sides. Tailwind emits the shorthand before the longhand as hoped. **The `style={{ borderLeft: … }}` fallback was not needed and was not applied.**

3. **Checklist item 4 — the compass square was 225 CSS px, not 300, and the first fix was guarded in the wrong place.** Item 4's premise was false, and this is the one item that turned into source work of its own. `w-full max-w-[400px]` sat on the svg alone; its wrapper is a flex item of `${PANEL} … flex justify-center` with no width, so the wrapper shrink-wrapped its child and the svg's percentage width resolved against a shrink-to-fit box, settling on the 300px default width of a replaced element — 300px of svg at 0.75 scale, a 225px square. Moving the cap onto the **wrapper** gives the svg a definite containing block; measured after: svg **400px**, square **300 × 300**. Task 9's guard could not have caught it (jsdom lays nothing out) and its own comment asserted the 400px render as established fact; it now asserts that the cap and the percentage width are on the same element, and says why the size itself is not assertable there.

   **That unit assertion pins `CompassPlot`'s internal shape, and the defect was a containing block — which lives at the call site.** Review demonstrated the gap and it reproduces exactly: wrapping `<CompassPlot/>` in a bare `<div>` in `ResultsView` puts the square back at **225.75px** with all 71 unit tests green. Only a real box measurement closes that class of error, so `results.spec.ts` now measures it — ~301px (300 plus the frame's own 1px stroke, which `boundingBox()` includes) when correct, 225.75 under either mutation. **This retires checklist item 4 from manual inspection permanently**, which is the right end state for the one item on the list that is a layout fact rather than a token fact.

4. **Checklist item 1 — every mark steps, none is stuck on a fixed hex.** Measured as computed colour, all four domain groups × four mark kinds (axis dot, domain head rule, domain name, radar vertex) plus the radar polygon:

   | mark | light | dark | rel. luminance |
   |---|---|---|---|
   | Economic / `--mark-primary` | `#85735e` | `#b5a594` | 0.181 → 0.389 |
   | Power | `#6b7d8a` | `#9daebb` | 0.196 → 0.410 |
   | Society | `#7a8b6e` | `#94a488` | 0.237 → 0.346 |
   | World | `#96716b` | `#c1a7a1` | 0.194 → 0.416 |

   Zero marks render identically in the two modes.

5. **Checklist item 2 — the archetype rules hold their ink/hairline split across the inversion.** `Primary archetype`: `#3d2e1f` on white (**13.05:1**) → `#efe9e3` on `#2a2118` (**13.12:1**). `Adjacent ·`: **1.10:1** light → **1.21:1** dark. Both barely-there, both by intent.

6. **Checklist item 5 — verified over thirteen tab stops, and one incidental discovery.** Every stop (three nav controls, five jump links, `Copy link`, `Compare with someone`, `Learn more`, `Show scoring details`, and a row's scoring disclosure) draws `2px solid rgb(133, 115, 94)` — Stone 600 — at `outline-offset: 2px`, with `:focus-visible` true. A mouse click on `Show scoring details` gives `outline-style: none` and `:focus-visible` false: **no ring on click**. The discovery: Tailwind v4's `transition-colors` includes `outline-color`, so the ring fades in from `currentColor` over 150ms. Reading the computed style synchronously on `focusin` returns the *starting* colour — `rgb(110, 90, 72)` on a `text-text-secondary` control — which is a real trap for anyone re-measuring this. Let it settle first.

7. **Checklist item 6 — all four behaviours confirmed with timings.** `Copy link` flips to `Copied!` on click and back at **exactly 2000ms** (MutationObserver, t=3512 → t=5512). `Compare with someone` opens the input; a pasted `?r=` URL routes to `/compare?a=…&b=…`. `Show scoring details` goes 0 → **12** disclosures and retitles itself `Hide scoring details`. All five jump links scroll their section to viewport top and set the hash (`#compass` lands at 621px only because it is the last section and the document has no more scroll).

8. **Checklist item 7 and the `V ∈ [560, 600)` wrap band — the fix was offered again and DECLINED again, this time on measurements.** The endpoint labels wrap cleanly: at 560, 575 and 599 CSS px there is **zero overlap** between the pole A and pole B spans, pole B is flush to the endpoint row's right edge (`text-align: right`, 0px gap), and nothing clips. Task 5's `text-right` does what it was added for. The band itself:

   | viewport | grid | scale column | rows wrapping |
   |---|---|---|---|
   | 559 | `24px 483px` | 483px | 0 / 12 |
   | 560 | `24px 238px 210px` | 238px | 7 / 12 |
   | 575 | `24px 253px 210px` | 253px | 5 / 12 |
   | 599 | `24px 277px 210px` | 277px | 3 / 12 |
   | **600** | `24px 278px 210px` | 278px | **3 / 12** |
   | 660 | `24px 338px 210px` | 338px | 0 / 12 |

   **`min-[560px]` → `min-[600px]` does not close the band — it moves it.** At 600px the scale column is 278px and three rows still wrap; wrapping only clears at ~660px, a hundred pixels past the shared breakpoint. So the one-token fix buys a cosmetic improvement over a 40px band and costs a page that steps its columns at two different widths (the archetype card's mini-radar column and the page gutters at 560, the breakdown at 600). Declined. **This closes the item — it is not routed onward.**

9. **Checklist item 8, observed before the ratchet fix as instructed — and the answer is "neither".** In light, `Composite score` measured `#6e5a48` on the white panel at **6.52:1**; its three siblings measured `#9d8b78` on `--surface-2` at **2.99:1**. The difference was plainly visible, but it did not read as *the composite being emphasised* — it read as *the three tile labels being too pale*, which the number confirms: 2.99:1 is under AA's 4.5:1 and under even the 3:1 large-text floor. The hierarchy between them was never carried by colour anyway: `Composite score` is an inline baseline row beside a large mono number, the three siblings are centred inside boxed tiles below the scale. So the fix's side effect — the four labels becoming one colour — costs nothing. Layout and the numeral size carry the distinction, as they already did.

10. **Both ratchets emptied in one commit, with the contrast measured in both modes and both guards mutation-checked afterwards.** The eight sub-AA occurrences went to three different tokens by role, and the ternary arms at `:153`/`:163` kept their *relationship* rather than merely clearing AA:

    Each row is against **the ground that element actually sits on**, which is not the same ground for all of them — `body` is `--surface-3` (light `#efe9e3`, dark `#17120d`), the panels are `--surface-1`, and the three modality tiles are `--surface-2`:

    | | ground | before | after |
    |---|---|---|---|
    | tile labels, light | `--surface-2` | 2.99:1 | 5.95:1 |
    | tile labels, dark | `--surface-2` | 5.34:1 | 5.34:1 (identical tokens in dark) |
    | selected pole, light | `--surface-2` | 7.37:1 | 11.90:1 |
    | unselected pole, light | `--surface-1` | 3.28:1 | 6.52:1 |
    | selected pole, dark | `--surface-2` | 7.37:1 (a light beige box on a dark page) | 14.56:1 |
    | unselected pole, dark | `--surface-1` | 4.81:1 | 8.80:1 |
    | section headings `:83`/`:142`/`:182`, dark | **page** (`--surface-3`) | **2.09:1** | 15.45:1 |
    | section headings, light | **page** | 7.37:1 | 10.84:1 |
    | back link `:77`, dark | **page** | 4.09:1 | 10.36:1 |
    | chosen scaled option `:196`, dark | `--surface-1` | 3.47:1 | **13.12:1** |

    The dark section-heading figure is the one that justifies the whole exercise: `text-stone-800` is fixed across modes, so three `<h2>`s all but vanished on the dark page ground. After emptying, restoring a single `text-text-tertiary` reds the first guard and a single `text-stone-600` reds the second — verified, not assumed.

    **Two corrections against this reconciliation's own earlier drafts, both of the same kind.** First: the heading figure was written as **1.63:1**, reasoned from the token table rather than read off the page; measured, the colour pair gives **1.78:1**. Then review caught that 1.78 was *still* wrong, because it is `text-stone-800` against `--surface-1` — and these three headings are not in a panel. Against the page ground they are **2.09:1**. The `:196` row had the mirror error in its "after": 15.45 is the page-ground value, but that element *is* in a panel, so it is **13.12:1**. Every figure in the table above has now been read back off computed styles in both schemes, with the painting element identified rather than assumed. `globals.css:29-36` already states its ratios against the page ground, so the panel-ground figures were the outlier, not the convention. Recorded at length because "asserted without observing" is this phase's signature failure, and a correction commit that itself carried an unmeasured number was very nearly the artifact left behind.

11. **The hydration mismatch was misdiagnosed in the plan, and the real cause changes the fix.** The plan carried it as a float-to-string precision difference. It is not a formatting difference — **the two engines compute different doubles.** `Math.sin`/`Math.cos` are not required by ECMA-262 to be correctly rounded, and Node and Chromium ship different ports of the routine, so `[data-radar-label]`'s `y` is `123.7231224733878` server-side and `123.72312247338783` client-side: 3e-14 SVG units apart, in the 14th significant digit. React reports it and explicitly **does not patch it up**, which is also why it is invisible from the production DOM — the DOM keeps the server value and reads byte-identical to the SSR HTML, and React's hydration warnings are development-only. It has to be seen in `next dev`. Six elements were affected, not one: both `[data-mini-ring]` polygons, `[data-radar-user]`, two `[data-radar-dot]` centres and the label.

    Fixed by rounding inside `polarToCart`, which is the single chokepoint every coordinate on both charts passes through — a helper each emission site must remember to call is the exact duplication `radar-geometry.ts` was extracted to end. `radar-geometry.test.ts` and the Task 7-9 `MiniRadar` vertex assertions are **unchanged and green**. Verified after: zero console errors on `next dev`, where there had been exactly one.

    **`COORD_PLACES` is 7, revised down from 9 in review, and the reasoning matters more than the number.** This is a probability reduction, not a proof: two doubles an ulp apart can still land either side of a rounding boundary, at a rate of roughly (ulp / grid). Measured at the magnitudes these charts use:

    | places | worst rounding error | headroom vs the 5e-7 test tolerance | residual per page render |
    |---|---|---|---|
    | 6 | 4.6e-7 | 1.2× — not headroom | 4.0e-7 |
    | **7** | **3.6e-8** | **16×** | **4.0e-5** |
    | 9 | 2.4e-10 | 2400× | 4.0e-3 |

    Nine was the first choice and was the wrong trade: 2400× of tolerance headroom buys nothing, while the coarser grid leaves about **one page render in 250** still mismatching — a weekly occurrence, not an edge case. Seven keeps 16×, which is ample, and pushes the residual to about one in 25,000. Six is the floor rather than a candidate, and a test now pins that. The original commit message's "four orders of magnitude to spare" was measuring headroom against the *test tolerance* and reading like a bound on the *defect*; those are different quantities and the margin is a rate.

    The genuinely deterministic alternative is a lookup table of the twelve spoke angles' sine and cosine as literal constants: no trig runs at either end, and the remaining arithmetic is IEEE-exact. It was not taken because it is a signature change to general-purpose helpers — `spokeAngle` and `polarToCart` accept arbitrary angles, not just twelfths — for a defect rounding already closes to 4e-5. Recorded in the backlog.

    **Both this fix and the compass fix shipped initially with no test at all**, which review caught and which is worth recording as the phase's own lesson: every *visible* change in this phase got a guard, and the two changes nobody can see in jsdom got none. Five tests now pin the rounding, asserting the **emitted string** rather than the value — the defect is a serialisation one, and `toBeCloseTo`, which is every other assertion on this geometry, passes identically with and without the fix. The headline case needs no second engine: at the label radius, spokes 1 and 11 are mirror images whose y is geometrically one point, but the trig lands on `123.72312247338778` and `123.7231224733878`, one ulp apart, and both now serialise to `"123.7231225"`. Reverting the rounding reds three of the five; lowering `COORD_PLACES` to 6 reds a different three.

12. **Review's finding, and the one this task got wrong on its own terms: the two fixes only Task 12 could make were the two it shipped untested.** Every other change in this phase arrived with a guard. The hydration rounding and the compass sizing did not — reverting either left the suite green — and both are exactly the changes no earlier task could have written a test for, which is how they slipped. Closed in `ff9feef`: five string-level tests on the rounding, a `boundingBox()` assertion on the compass, and a title assertion covering the e2e break of note 1. All three were mutation-checked in both directions rather than merely added.

    The other half of review was record accuracy, and it landed on the same nerve. **Four contrast figures in this reconciliation were stated against the wrong ground** — `body` is `--surface-3`, and the three section headings sit directly on it rather than inside a panel, so the numbers recorded against `--surface-1` described elements that are not there. The 1.63 → 1.78 correction earlier in note 10 fixed the arithmetic and kept the wrong ground, which made the correction commit itself an instance of the failure it was correcting. Every figure in note 10's table has now been read back off computed styles with the painting element identified; see the table's own note. One reviewer figure did not survive checking either: `/compare/[a]/[b]` logs **one** hydration console error containing ten mismatched attributes, not four errors — React batches per tree, not per element. Recorded in the backlog entry with the distinction spelled out, because "count the attributes inside the diff, not the console errors" is the part that is easy to get wrong twice.

- [x] **Step 4: Reconcile the plan with what shipped**

Before opening the PR, re-read this document against the diff. Plan and artifact drift apart in predictable ways — a comment describing an approach that was replaced, an assertion that verifies less than its title claims, a decision that was revised mid-task without being written down. Correct this file where it no longer describes the code, and note any decision that changed in the PR description.

- [ ] **Step 5: Open the PR**

```bash
git push -u origin feat/design-delta-results
gh pr create --title "feat(design): design system delta — phase 4 results page" --body "..."
```

The body should carry: the issue reference (`Closes #135`), the mutation table results from Task 11 Step 3 with any mutation that failed to redden called out honestly, both screenshots, and an explicit list of the decisions this phase made beyond the issue's scope list (D8–D15 above).

**Not executed.** Task 12 stopped after Step 4 — pushing was not authorised, so the branch is local. Everything the body needs is in place, in **`/home/evan/poliplatform-phase4-screenshots/`** — outside the repo, so the working tree stays clean, which is also why a reader looking for them in the tree or in a Playwright artifact directory will not find them. Four files: `results-light.png` and `results-dark.png` for `/results` in both schemes, plus `axis-detail-light.png` and `axis-detail-dark.png` for the per-axis detail page, which is the only surface whose *appearance* this task altered. Add to the drafted body, from Task 12's "As shipped": the five defects the browser pass found that eleven jsdom-only tasks could not (notes 1, 3, 10 and 11), the `border-l-2` verdict (note 2), and the wrap-band decision with the table behind it (note 8). Note also that the screenshots show the `DevRandomResults` widget in the top right: it is gated on `NEXT_PUBLIC_VERCEL_ENV === "production"`, so it is expected locally and on previews and absent in production. It predates this phase.

---

## Deferred to later phases

Recorded here so they are not rediscovered as bugs:

- **`/compare`, `/groups` and the per-axis detail page keep their layouts.** Tasks 5 and 6 changed their score-bar primitive and nothing else. Their surrounding chrome — `text-[11px] uppercase tracking-[0.08em]` domain headers, `text-stone-800` literals, zebra rows — is phase 5's sweep under D6. **Narrowed by Task 11, and closed by Task 12:** widening the drift sweep to `src/app/results/**` pulled the per-axis detail page's *colour* tokens into guard scope, so its 8 `text-text-tertiary` and 10 stone-ramp classes were pinned as ratchets and routed to Task 12 rather than to phase 5. Task 12 emptied both, measured in a browser in both modes (see its "As shipped" note 10). Everything else about that page — the type scale, the layout, the panel idiom — is still phase 5's, and both guards now assert `{}` rather than a count, so phase 5 cannot reintroduce either defect quietly. `/compare` and `/groups` are untouched by this and remain deferred whole.
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
- **`/compare`'s legend sentence is unguarded copy that is about to go stale on purpose.** `src/app/compare/page.tsx:180` ("Filled dot is you, ring marker is them.") has no test pinning word order — reverting it to the wrong order leaves the whole suite green. Now that Task 6 gives each readout its own swatch, the sentence is close to redundant; deleting it in phase 5 is preferable to writing a guard for copy that phase 5 is going to remove anyway.
- **A fifth inlined `polarToCart` lives at `src/components/study/Radar.tsx:8-19`, as `polarToXY`.** Same maths to the character — the same `(index / total) * 2π - π/2` offset and the same `cx + r·cos` / `cy + r·sin` — so it carries the same hydration defect, and it is the worst-placed of the copies: `/study/patterns` is `○ (Static)`, prerendered at build time by Node and hydrated by Chromium, which is precisely the cross-engine pair. **Verified in `next dev`: one hydration console error carrying fifteen mismatched attributes (9 `points`, 6 `y2`).** Outside this phase's scope in every sense — different section, different feature, not a results page — but it was missing from this list entirely, which is the only reason it is here. The nine-line `roundCoord` import closes it without touching anything else.

- **`tests/e2e/study-compare.spec.ts:16` is flaky.** `unpinning from a two-persona compare view drops exactly that persona` failed once in five Task 12 runs of the suite and passed the other four, including two consecutive re-runs immediately after. Not investigated: it is in the synthetic study section, it touches nothing this phase changed, and a one-in-five flake needs its own reproduction loop rather than a guess at the end of an unrelated task. Recorded so the next person to see it red knows it has form and does not spend the afternoon bisecting this phase's diff for it.

- **`ComparisonRadar.tsx` and `GroupRadar.tsx` still carry the hydration mismatch Task 12 fixed on the results page.** Both inline their own `polarToCart`, so neither picked up the nine-place rounding that stopped Node and Chromium disagreeing in the 14th significant digit (Task 12's "As shipped" note 11). `/compare/[profileId1]/[profileId2]` and `/groups/[groupId]` are both server-rendered, so both should be logging the same "won't be patched up" hydration error in development that `/results/[profileId]` was. **Verified for `ComparisonRadar`, measured rather than counted from a test log:** loading `/compare/[a]/[b]` in `next dev` produces **one** hydration console error — React batches a whole tree's mismatches into a single error rather than one per element — and that error carries **ten** mismatched attributes (2 `points`, 6 `cy`, 2 `y`), every one of them inside `ComparisonRadar`. Anyone re-deriving this should count attributes inside the diff, not console errors: the same page reports "1 error" whether one attribute diverged or fifty. `GroupRadar` was not loaded, so that half remains inference from an identical mechanism. **The cheap option exists and was considered, rather than there being no option short of the migration below.** `roundCoord` is exported, so closing this is one import plus two wrapped returns per file — about nine lines, no call-site audit, and no exposure to the `ringPolygonPoints(0.5)` fraction hazard that makes the full migration a larger job. Still deferred, because patching three soon-to-be-deleted copies of `polarToCart` is work the migration throws away and neither page is on the results route this phase owns. But whoever picks this up should know the nine-line version is available and does not require taking the migration on.

- **`ComparisonRadar.tsx` and `GroupRadar.tsx` are the last holders of the duplicated radar geometry.** Task 8 extracted `src/lib/radar-geometry.ts` and moved `RadarChart` and `MiniRadar` onto it; these two still carry their own `RING_FRACTIONS`, `ringPolygonPoints`, `spokeAngle`, `polarToCart` and `scoreToRadius`, plus — at `GroupRadar.tsx:57` — their own copy of the pad-to-twelve loop that `normaliseByAxisId` replaces. Both are still on the **fraction** convention (`ringPolygonPoints(0.5)`), which is exactly the hazard `ringPoints`' docstring warns about, so migrating them is a call-site audit rather than an import swap and wants its own task. Deliberately not folded into Tasks 9-12: neither file is on the results page, and both are D6-deferred to phase 5 already (see "Deferred to later phases", which defers `ComparisonRadar`'s `getDomainColor600` for the same reason).
- **Two exported `TOTAL_AXES` now live in `src/lib/`** — `radar-geometry.ts:15` and `comparison-radar-data.ts:3` — the same value in two homes, with a third, unexported copy at `GroupRadar.tsx:16`. Re-export one from the other; the natural moment is the migration above.
- **`src/components/PairedAxisScale.tsx` sits outside every guard's scan, and it was not Task 11's to fix.** It draws `AxisBreakdownCard`'s domain dots, but it lives in `src/components/`, while every guard in the drift block scans `src/components/results/` and `src/app/results/` — the latter added by Task 11, which closed the recursive-sweep half of this item; only `PairedAxisScale` is still outside. So the one file in this phase that actually routes a *domain* mark is the one file none of the guards see. **This deliberately did not belong to Task 11**, whose guardrail the plan scopes by directory (see its `routes every data mark through the stepping tokens` note, which excludes `PairedAxisScale` from the count for exactly this reason and now says so in the shipped comment). `PairedAxisScale` is a shared primitive with three consumers across results, comparison and groups, so widening a results-scoped guard onto it changes what a failure there means for two other features — and would drag a phase-5-deferred file under the sub-AA, focus-ring and hex guards in the same move. The mark is not unguarded meanwhile: `tests/unit/paired-axis-scale.test.ts` kills the plan's mutation 5. That is a phase-5 decision, alongside the already-deferred `/compare` sweep.
- **Narrow `AXIS_WEIGHT_PROFILES` to `Record<AxisId, …>`**, with `type AxisId = 1 | 2 | … | 12`, the next time the scoring types are touched. Task 10 removed the unreachable `?? { fc: 0.40, sc: 0.35, bg: 0.25 }` fallback in `AxisBreakdownCard` — its numbers matched none of the three real profiles — but the table is still typed `Record<number, AxisWeightProfile>` (`src/lib/scoring-types.ts`), so an out-of-range `axisId` is not compile-flagged at either call site. Deliberately **not** fixed by restoring a runtime guard: that would protect the *display* of a number `src/lib/scoring.ts:130` has already crashed producing, since the engine does the same unguarded lookup one step earlier. And deliberately **not** by enabling `noUncheckedIndexedAccess`, which would ripple across the whole repo for one unreachable branch. The keyed type is the proportionate fix, and it costs nothing at runtime.
- **Promote `PANEL` to an `@utility`.** `ResultsView` names the string once; the same three classes — `bg-surface-1 border border-border-secondary rounded-sharp` — are spelled out verbatim at **25 sites across 14 files**, on `/compare` (5), `/results/[profileId]/[axisId]` (4), `/account` (3), `/groups/[groupId]` (3), the home page (2), `/auth/signin` and `/auth/signup`, `GlossaryTerm`, and four quiz components. A panel is the delta's most-repeated surface and the one most likely to be restyled as a unit.
- **A second copy of `sentenceCase` exists**, inline, at `src/lib/study/tensionDescription.ts:69` (`${level.charAt(0).toUpperCase()}${level.slice(1)}`) — the same one-liner, on the same concept, a tension level. Two copies of a one-liner do not yet justify a shared module; this is noted so that the third copy triggers the extraction rather than starting an argument.
- **The results page's five `<section>` elements are unnamed regions.** None carries `aria-labelledby` pointing at its own `<h2>`, so a screen-reader user's region list reads "section" five times. Compounding it: in the normal case the `h1` and `ArchetypeCard`'s `h2` are both the archetype name, and in the distinctive case section 1 has no heading at all — so a heading-list user sees four of the five sections, one of them named twice. Task 10 left this because naming the regions properly means deciding what section 1's heading is, which is `ArchetypeCard`'s question rather than `ResultsView`'s.
- **`RadarChart`'s vertex tooltip is untested and keyboard-unreachable.** Inverting which pole it names (`score >= 0 ? axis.poleBLabel : axis.poleALabel`) passes the entire suite. It is driven by `onMouseEnter`/`onMouseLeave` on a `<circle>` inside an `aria-hidden` `<svg>`, so a sighted keyboard user cannot read an exact vertex value at all; no AT user loses information, because the sr-only table carries the same twelve numbers in rows. Both facts predate this phase — Task 8 changed only the tooltip's metrics (`fontSize` 10 → 11, `rx` 4 → 2) — so this is recorded rather than fixed here.
