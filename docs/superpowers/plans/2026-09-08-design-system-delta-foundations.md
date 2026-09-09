# Design System Delta — Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the design delta's token layer (radius, serif display scale, mono label scale, inverting button tokens), sweep the 89 legacy radius literals, and restyle the shared chrome — `Button`, `NavBar`, `Footer`.

**Architecture:** All new values live in `src/app/globals.css`. Colour and radius values are plain custom properties on `:root` (overridden in the existing `prefers-color-scheme: dark` block) and exposed to Tailwind through the existing `@theme inline` mapping. Typography roles ship as Tailwind v4 `@utility` rules rather than `--text-*` entries, because the mono layers need `text-transform` and `font-family`, which the `--text-*` namespace cannot express — using one mechanism for the whole scale keeps every role a single self-contained class. A new `src/components/Button.tsx` centralises the three button variants so the ink-primary/dark-invert rule is defined once instead of at nine call sites.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4.3.3, Vitest 4 (jsdom via docblock, `vmForks` pool), Playwright.

**Spec:** `docs/superpowers/specs/2026-09-08-design-system-delta-design.md`

## Global Constraints

- **No new colour values.** Every hex referenced is already in `globals.css`. New custom properties are semantic *aliases* onto the existing Stone ramp.
- **No Tailwind `dark:` variants.** The codebase has zero `dark:` usages; dark mode works entirely through `prefers-color-scheme` overriding `:root` custom properties. Follow that mechanism.
- **11px type floor.** Nothing renders below 11px. Mock `5a`'s footer draws 10.5px mono; that is one of the sub-floor drafts the delta doc explicitly calls out. Use 11px, per the handoff README.
- **Vitest only collects `tests/**/*.test.ts`** — not `.tsx`. Component tests use `createElement` (no JSX) with a `@vitest-environment jsdom` docblock, matching `tests/unit/quiz-interactions.test.ts`.
- Only `rounded-[12px]` and `rounded-[8px]` are in scope for the radius sweep. The 14 `rounded-[3px]`, three `rounded-[6px]`, and one `rounded-[4px]` literals are score-bar tracks and small chips the handoff does not address; leave them for the per-screen phases.
- Home page copy, quiz copy, and results layout are **out of scope** for this phase, so `tests/e2e/quiz-flow.spec.ts` must stay green unmodified.
- Lint runs with `--max-warnings=0`. Fix new warnings; never raise the ceiling.

---

### Task 1: Add the radius, button, and typography token layer

**Files:**
- Modify: `src/app/globals.css` — the existing `:root` block (7-96), the `@media (prefers-color-scheme: dark)` block (98-154), and the `@theme inline` block (156-194); then append the typography utilities at end of file
- Test: `tests/unit/design-system-tokens.test.ts`

**Interfaces:**
- Produces: `--radius`, `--radius-sharp`, `--button-primary-*` custom properties; the `rounded-sharp` utility; and the `display-*`, `body-lead`, `label*`, `mono-meta`, `control`, `wordmark`, `caption-italic` utilities.
- Consumed by: Tasks 2–5 and every later phase.

- [ ] **Step 1: Write the failing token test**

Create `tests/unit/design-system-tokens.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const globalsCss = readFileSync(
  resolve(process.cwd(), "src/app/globals.css"),
  "utf8",
);

/** Body of a top-level block, brace-matched so nested blocks don't truncate it. */
function block(css: string, opener: string): string {
  const start = css.indexOf(opener);
  if (start === -1) throw new Error(`block not found: ${opener}`);
  const braceStart = css.indexOf("{", start);
  let depth = 0;
  for (let i = braceStart; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(braceStart + 1, i);
    }
  }
  throw new Error(`unterminated block: ${opener}`);
}

/** Custom-property declarations in a block, whitespace-normalised. */
function decls(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [, name, value] of css.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) {
    out[name] = value.trim();
  }
  return out;
}

const light = decls(block(globalsCss, ":root"));
const dark = decls(
  block(block(globalsCss, "@media (prefers-color-scheme: dark)"), ":root"),
);
const theme = decls(block(globalsCss, "@theme inline"));

const utilities = [
  ...globalsCss.matchAll(/@utility ([a-z-]+) \{([^}]*)\}/g),
].map(([, name, body]) => ({ name, body }));

const TYPE_SCALE = [
  "display-xl",
  "display-page",
  "display-l",
  "display-m",
  "display-entry",
  "display-s",
  "body-lead",
  "label",
  "label-eyebrow",
  "label-nav",
  "mono-meta",
  "control",
  "wordmark",
  "caption-italic",
];

describe("design delta token layer", () => {
  it("defines the near-square radius and exposes it to Tailwind", () => {
    expect(light["--radius"]).toBe("2px");
    expect(theme["--radius-sharp"]).toBe("var(--radius)");
  });

  it("inverts the primary button in dark mode instead of darkening it", () => {
    // Stone 900 ink on a Stone 900 ground would be invisible, so dark mode
    // reverses the relationship rather than darkening it. Asserted per block,
    // because a whole-file substring match passes even when the two are swapped.
    expect(light["--button-primary"]).toBe("var(--stone-900)");
    expect(light["--button-primary-hover"]).toBe("var(--stone-800)");
    expect(light["--button-primary-fg"]).toBe("var(--stone-50)");

    expect(dark["--button-primary"]).toBe("var(--stone-300)");
    expect(dark["--button-primary-hover"]).toBe("var(--stone-200)");
    expect(dark["--button-primary-fg"]).toBe("var(--stone-900)");
  });

  it("keeps every button token mode-aware and mapped into the colour namespace", () => {
    // Structural invariant: any button token a later phase adds must carry a
    // dark override and a Tailwind mapping, or this fails.
    const buttonTokens = Object.keys(light).filter((key) =>
      key.startsWith("--button-"),
    );

    expect(buttonTokens.length).toBeGreaterThan(0);
    for (const token of buttonTokens) {
      expect(dark, `${token} has no dark-mode override`).toHaveProperty(token);
      expect(theme[`--color-${token.slice(2)}`]).toBe(`var(${token})`);
    }
  });

  it("declares exactly the type scale's typography roles", () => {
    expect(utilities.map((utility) => utility.name).sort()).toEqual(
      [...TYPE_SCALE].sort(),
    );
  });

  it("holds the 11px type floor across every typography role", () => {
    const sizes = utilities.map((utility) => {
      const match = utility.body.match(/font-size:\s*([0-9.]+)px/);
      expect(match, `${utility.name} declares no font-size`).not.toBeNull();
      return Number(match![1]);
    });

    expect(sizes).toHaveLength(TYPE_SCALE.length);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(11);
  });
});
```

- [ ] **Step 2: Verify red**

Run: `npm test -- tests/unit/design-system-tokens.test.ts`

Expected: FAIL, all 5 tests. The first two fail on `undefined` lookups
because no token exists yet; the type-scale tests fail because `utilities` is
empty. If any test *passes* at this point, the assertion is not reaching the
file — investigate before implementing.

- [ ] **Step 3: Add the `:root` tokens**

In `src/app/globals.css`, inside `:root`, immediately after the `--focus-ring`
declaration and before the cluster-colour comment block, insert:

```css
  /* --- Radius (design delta 02: 12px and 8px both collapse to 2px) --- */
  --radius: 2px;

  /* --- Button surfaces (design delta 03: ink-filled primary) ---
     Semantic aliases onto the Stone ramp so delta 06's dark-mode inversion
     is a token override rather than a per-component branch. */
  --button-primary: var(--stone-900);
  --button-primary-hover: var(--stone-800);
  --button-primary-fg: var(--stone-50);
```

- [ ] **Step 4: Add the dark-mode inversion**

In the `@media (prefers-color-scheme: dark)` block, immediately after the
`--warning-border` declaration, insert:

```css
    /* Design delta 06: Stone 900 ink on a Stone 900 ground is invisible, so
       the primary inverts rather than darkens. */
    --button-primary: var(--stone-300);
    --button-primary-hover: var(--stone-200);
    --button-primary-fg: var(--stone-900);
```

- [ ] **Step 5: Extend `@theme inline`**

In the `@theme inline` block, after the `--color-info` line, insert:

```css
  --color-button-primary: var(--button-primary);
  --color-button-primary-hover: var(--button-primary-hover);
  --color-button-primary-fg: var(--button-primary-fg);

  --radius-sharp: var(--radius);
```

- [ ] **Step 6: Add the typography utilities**

At the end of `src/app/globals.css`, append:

```css
/* ============================================
   Typography scale — design delta 01

   One class per role, each self-contained (family, size, line-height,
   tracking, weight). Authored as `@utility` rather than `--text-*` theme
   entries because the mono roles need `text-transform` and `font-family`,
   which the `--text-*` namespace cannot express. Tailwind variants
   (`min-[560px]:display-l`, etc.) work on `@utility` rules.

   `text-wrap: pretty` appears only on the long headline roles
   (display-xl/-page/-l); display-m/-entry/-s and the rest of the scale
   don't need it. That's deliberate, not an oversight — don't "fix" it
   into consistency.

   `caption-italic` additionally sets `color` (Stone tertiary text). That
   colour is part of the role's definition, not a default to override.

   Every role in this scale sits at or above 11px — the delta's floor.
   Pre-existing sub-11px sites elsewhere in the codebase are swept by
   later phases, not this one.
   ============================================ */

@utility display-xl {
  font-family: var(--font-serif);
  font-size: 58px;
  font-weight: 500;
  line-height: 1.04;
  letter-spacing: -0.021em;
  text-wrap: pretty;
}

@utility display-page {
  font-family: var(--font-serif);
  font-size: 40px;
  font-weight: 500;
  line-height: 1.06;
  letter-spacing: -0.02em;
  text-wrap: pretty;
}

@utility display-l {
  font-family: var(--font-serif);
  font-size: 34px;
  font-weight: 500;
  line-height: 1.06;
  letter-spacing: -0.018em;
  text-wrap: pretty;
}

@utility display-m {
  font-family: var(--font-serif);
  font-size: 26px;
  font-weight: 500;
  line-height: 1.2;
}

@utility display-entry {
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
}

@utility display-s {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 500;
  line-height: 1.35;
}

@utility body-lead {
  font-family: var(--font-sans);
  font-size: 17px;
  line-height: 1.62;
}

/* Mono label layer. Tracking is the only difference between the three:
   0.14em on eyebrows, 0.12em inside panels, 0.10em on nav links. */
@utility label {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.4;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

@utility label-eyebrow {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.4;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

@utility label-nav {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.4;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* The footer's provenance row: mono and finely tracked, but sentence case.
   Mock 5a sets no `text-transform` here, so this cannot reuse `label`.
   It is a separate role rather than `label tracking-[0.06em]` because the
   emitted order of a custom `@utility` against a built-in depends on which
   properties the custom rule sets, which is too subtle to rely on. */
@utility mono-meta {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.4;
  letter-spacing: 0.06em;
}

@utility control {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

@utility wordmark {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

@utility caption-italic {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--text-tertiary);
}
```

- [ ] **Step 7: Verify green**

Run: `npm test -- tests/unit/design-system-tokens.test.ts`

Expected: PASS, 5 tests.

- [ ] **Step 8: Prove the utilities actually compile**

Run: `npm run build`

Expected: build succeeds. This is the real check that Tailwind 4.3.3 accepts
the `@utility` syntax and the `--radius-sharp` theme entry — a malformed
`@theme`/`@utility` rule fails the CSS build, not the unit test.

- [ ] **Step 9: Commit**

```bash
git add src/app/globals.css tests/unit/design-system-tokens.test.ts
git commit -m "feat(design): add radius, button, and typography tokens for the design delta"
```

---

### Task 2: Sweep the legacy radius literals

**Files:**
- Modify (26 files, 89 class literals): `src/app/account/page.tsx`, `src/app/archetypes/page.tsx`, `src/app/auth/signin/page.tsx`, `src/app/auth/signup/page.tsx`, `src/app/axes/page.tsx`, `src/app/compare/page.tsx`, `src/app/compare/[profileId1]/[profileId2]/page.tsx`, `src/app/groups/[groupId]/page.tsx`, `src/app/methodology/page.tsx`, `src/app/page.tsx`, `src/app/questions/page.tsx`, `src/app/references/page.tsx`, `src/app/results/[profileId]/[axisId]/page.tsx`, `src/components/annotations/AnnotationEditor.tsx`, `src/components/comparison/BudgetComparison.tsx`, `src/components/comparison/ComparisonScoreBar.tsx`, `src/components/GlossaryTerm.tsx`, `src/components/groups/GroupHeatMap.tsx`, `src/components/quiz/BudgetSimulator.tsx`, `src/components/quiz/ForcedChoiceCard.tsx`, `src/components/quiz/PhaseTransition.tsx`, `src/components/quiz/QuizFlow.tsx`, `src/components/quiz/ScaledQuestionCard.tsx`, `src/components/results/ArchetypeCard.tsx`, `src/components/results/AxisBreakdownCard.tsx`, `src/components/results/ResultsView.tsx`
- Modify (1 inline style): `src/components/study/CompareView.tsx:533`
- Test: `tests/unit/design-system-tokens.test.ts` (extend)

**Interfaces:**
- Consumes: the `rounded-sharp` utility and `--radius` from Task 1.
- Produces: a source-wide guardrail against the reintroduction of 12px/8px radii, in both class and inline-style form.

**Why one inline site is included.** A class-only grep misses `src/components/study/CompareView.tsx:533`, which sets `borderRadius: "8px"` on the compare-view panel via an inline style. That is an in-scope 8px panel radius by any reading of delta 02, and leaving it behind would strand the one study-section element that actually is a panel. It is the *only* such site: the other 36 inline `borderRadius` values in `src/components/study/` are 1px/2px/3px/4px/6px data-viz marks — badges, bars, swatches — which delta 02 does not address, exactly as the class-literal exclusions do not.

- [ ] **Step 1: Write the failing guardrail test**

Merge `readdirSync` into the existing `node:fs` import at the top of
`tests/unit/design-system-tokens.test.ts` so it reads:

```ts
import { readdirSync, readFileSync } from "node:fs";
```

Then apply two hardening edits carried over from Task 1's code review. Both
are prophylactic — neither is a live bug against `globals.css` as it stands —
but both would fail confusingly, so they are cheaper to fix now.

First, `decls()` does not strip comments, so a commented-out declaration is
parsed as live. That matters because disabled button tokens were explicitly
declined and routed to Phase 3, making a note like
`/* --button-primary-disabled: ... deferred */` beside the button block a
plausible thing for someone to write — and it would fail the structural
invariant demanding a dark override for a token that does not exist in the
cascade. Add comment stripping as the function's first line:

```ts
function decls(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  const body = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) {
    out[name] = value.trim();
  }
  return out;
}
```

Second, the `@utility` name pattern `([a-z-]+)` cannot match a digit, so a
future `display-2xl` would be silently uncollected and report as a confusing
count mismatch rather than as the real problem. Widen it:

```ts
const utilities = [
  ...globalsCss.matchAll(/@utility ([a-z0-9-]+) \{([^}]*)\}/g),
].map(([, name, body]) => ({ name, body }));
```

Then append this block at end of file:

```ts
describe("near-square corners (design delta 02)", () => {
  function tsxFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) return tsxFiles(path);
      return entry.name.endsWith(".tsx") ? [path] : [];
    });
  }

  const sources = tsxFiles(resolve(process.cwd(), "src")).map((file) => ({
    file,
    text: readFileSync(file, "utf8"),
  }));

  it("has retired every 12px and 8px radius class literal from src", () => {
    const offenders = sources
      .filter(({ text }) => /rounded-\[(?:12|8)px\]/.test(text))
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });

  it("has retired every 12px and 8px inline border radius from src", () => {
    // A class-only sweep misses inline styles, which is how CompareView's
    // panel kept an 8px corner. Guard both spellings, not just the tidy one.
    const offenders = sources
      .filter(({ text }) => /borderRadius:\s*["'](?:12|8)px["']/.test(text))
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Verify red**

Run: `npm test -- tests/unit/design-system-tokens.test.ts`

Expected: FAIL on both new tests — the class test lists 26 absolute paths, the
inline test lists exactly one (`src/components/study/CompareView.tsx`).

- [ ] **Step 3: Sweep the class literals**

Both literals map to the same new utility, and there are no directional
variants (`rounded-t-[8px]` and friends do not appear in `src`), so this is a
safe two-pattern replace:

```bash
grep -rl --include='*.tsx' -E 'rounded-\[(12|8)px\]' src \
  | xargs sed -i -E 's/rounded-\[(12|8)px\]/rounded-sharp/g'
```

- [ ] **Step 4: Sweep the one inline site**

In `src/components/study/CompareView.tsx:533`, change:

```tsx
          borderRadius: "8px",
```

to:

```tsx
          borderRadius: "var(--radius)",
```

This is why Task 1 defines `--radius` on `:root` as well as `--radius-sharp`
in the theme: inline styles cannot reach a Tailwind utility, so they need the
raw custom property.

- [ ] **Step 5: Confirm the sweep was total and left nothing else behind**

Run:

```bash
grep -rn --include='*.tsx' -E 'rounded-\[(12|8)px\]' src | wc -l
grep -roh --include='*.tsx' 'rounded-sharp' src | wc -l
grep -rn --include='*.tsx' -E 'borderRadius:\s*"(12|8)px"' src | wc -l
```

Expected: `0`, then `89`, then `0`.

- [ ] **Step 6: Verify green**

Run: `npm test -- tests/unit/design-system-tokens.test.ts && npm run typecheck && npm run lint`

Expected: tests PASS (7 tests), typecheck clean, lint clean at
`--max-warnings=0`.

- [ ] **Step 7: Commit**

```bash
git add src tests/unit/design-system-tokens.test.ts
git commit -m "refactor(design): collapse 12px and 8px radii onto the 2px token"
```

**Deliberately not in this task.** Seven bare `rounded` classes
(`src/app/questions/page.tsx:176,190,248,315`, `src/app/account/page.tsx:236`,
`src/components/comparison/ComparisonScoreBar.tsx:60,68`) compile to Tailwind's
default 4px and so sit off-system. Sweeping them to 2px is a *visual* change on
chips, a checkbox, and tooltips that the handoff never specified — 4px is
excluded from delta 02 exactly as `rounded-[4px]` is. Locking the namespace
with `--radius-*: initial` to make off-system radii unwritable is attractive
and was verified to work, but it makes bare `rounded` emit nothing *silently*,
so it must land together with those seven sites and a visual review. Both are
tracked as issue #139 rather than smuggled into this phase.

---

### Task 3: Extract the button primitive

**Files:**
- Create: `src/components/Button.tsx`
- Test: `tests/unit/button.test.ts`

**Interfaces:**
- Produces: `buttonClasses(variant)`, `Button` (renders `<button>`), `ButtonLink` (renders a `next/link` anchor), and the `ButtonVariant` type.
- Consumes: `control`, `label-nav`, `rounded-sharp`, and the `button-primary-*` colours from Task 1.
- Consumed by: Task 4 (`NavBar` has no buttons, but Phases 2–5 replace the inline button call sites with these).

**The eight existing filled buttons are compliant — do not "fix" them.**
Task 2's review flagged them as violating `CLAUDE.md`, reading its rule as a
count of two. It is not a count. Line 83 reserves filled buttons for "primary
assessment actions (beginning or resuming the assessment and confirming the
budget)", and all eight fall inside that category: `page.tsx:28`
("Begin assessment"), `axes:184` / `questions:338` / `references:61`
("Take the assessment"), `methodology:194` ("Begin the assessment"),
`QuizFlow:236` ("Continue where I left off"), `QuizFlow:280` ("Begin"), and
`BudgetSimulator:192` ("Confirm budget"). Three further `bg-stone-600` uses —
`QuizFlow:498`, `ProgressBar:46`, `ArchetypeCard:162` — are progress fills and
a rule, which delta 03 explicitly keeps as Stone 600's remaining jobs.

What actually conflicts with that rule is mock `6b`'s ink-filled quiz `Next`,
which advances within the assessment rather than beginning, resuming, or
confirming. That is spec decision D1, and Phase 6 (#137) rewrites the rule to
cover it. Nothing in Phase 1 depends on the rewrite.

**Notes for the Phase 2–5 migrations.** Three things the Task 3 review
established that the migrating phases would otherwise rediscover the hard way:

1. **`className` does not override variant classes.** Appending does not win —
   Tailwind's emitted order decides, and the variant utilities land later in
   the sheet than common ones. Verified by byte offset: `.block` at 4660 loses
   to BASE's `.inline-block` at 4695, and `.px-6` at 4973 loses to
   `.px-[34px]` at 5033. So `className` is only for properties no variant sets
   — margin, width, position. The concrete trap: `src/app/page.tsx:26-30` is
   currently `block mx-auto max-w-xs`, and migrating it verbatim silently
   shrinks the app's flagship CTA from a 320px block to content width. The
   working spelling is `className="w-full max-w-xs"`, which is conflict-free
   and centres via the hero's existing `text-center`. Anything needing
   different padding or display needs a variant, not a class.

2. **The tertiary variant's intended sites.** It is uppercase mono
   (`label-nav`) by design, so it is *not* for prose links or the
   `no-underline` breadcrumb kickers. Mock `5a` uses it for the "Methodology"
   link beside the hero primary (Phase 2); mock `7a` uses it for "Learn more"
   in the archetype panel (Phase 4). Applying it to a sentence-case prose link
   would uppercase the text.

3. **Worth adding once migrations finish (Phase 5, #136):** a source-scanning
   guardrail in the `tests/unit/design-system-tokens.test.ts` idiom asserting
   no `.tsx` outside `Button.tsx` hand-rolls a filled-button recipe. Class
   assertions protect the primitive; only a source scan protects the
   invariant across five phases of migration. It cannot pass until the last
   call site moves, so it belongs at the end.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/button.test.ts`:

```ts
/**
 * @vitest-environment jsdom
 *
 * Contract coverage for the design delta's three-tier button system.
 */
import { afterEach, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Button, ButtonLink, buttonClasses } from "@/components/Button";

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
  while (mounted.length) {
    const entry = mounted.pop()!;
    act(() => entry.root.unmount());
    entry.container.remove();
  }
});

describe("buttonClasses", () => {
  it("fills the primary with the invertible ink token, never a raw ramp step", () => {
    const classes = buttonClasses("primary");

    expect(classes).toContain("bg-button-primary");
    expect(classes).toContain("text-button-primary-fg");
    expect(classes).toContain("hover:bg-button-primary-hover");
    // Stone 600 keeps its jobs as focus ring and progress fill only.
    expect(classes).not.toContain("bg-stone-600");
    expect(classes).not.toContain("bg-stone-900");
  });

  it("outlines the secondary and never fills it", () => {
    const classes = buttonClasses("secondary");

    expect(classes).toContain("border-border-primary");
    expect(classes).not.toContain("bg-button-primary");
  });

  it("gives the tertiary an underline and no padding box", () => {
    const classes = buttonClasses("tertiary");

    expect(classes).toContain("border-b");
    expect(classes).not.toMatch(/\bpx-/);
  });

  it("labels primary and secondary with the mono control role", () => {
    expect(buttonClasses("primary")).toContain("control");
    expect(buttonClasses("secondary")).toContain("control");
  });

  it("carries the unchanged focus ring and disabled treatment on every variant", () => {
    for (const variant of ["primary", "secondary", "tertiary"] as const) {
      expect(buttonClasses(variant)).toContain("focus-visible:outline-stone-600");
      expect(buttonClasses(variant)).toContain("disabled:opacity-50");
    }
  });
});

describe("Button and ButtonLink", () => {
  it("renders a button element that forwards disabled", () => {
    const container = render(
      createElement(Button, { disabled: true }, "Next"),
    );
    const button = container.querySelector("button")!;

    expect(button.textContent).toBe("Next");
    expect(button.disabled).toBe(true);
  });

  it("renders an anchor for ButtonLink", () => {
    const container = render(
      createElement(ButtonLink, { href: "/quiz" }, "Begin the assessment"),
    );
    const anchor = container.querySelector("a")!;

    expect(anchor.getAttribute("href")).toBe("/quiz");
    expect(anchor.textContent).toBe("Begin the assessment");
  });

  it("appends caller classes after the variant classes so they can override", () => {
    const container = render(
      createElement(Button, { className: "w-full" }, "Finalize budget"),
    );

    expect(container.querySelector("button")!.className).toMatch(/w-full$/);
  });
});
```

- [ ] **Step 2: Verify red**

Run: `npm test -- tests/unit/button.test.ts`

Expected: FAIL resolving `@/components/Button` — the module does not exist.

- [ ] **Step 3: Write the implementation**

Create `src/components/Button.tsx`:

```tsx
import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * The design delta's three-tier button system (delta 03).
 *
 * Primary is an ink fill — Stone 900 on light, and Stone 300 in dark mode,
 * where Stone 900 ink on a Stone 900 ground would be invisible. That inversion
 * lives in the `--button-primary-*` tokens, not here, so this file has no
 * mode-specific branch. Stone 600 keeps its jobs as the focus ring and the
 * progress fill and is deliberately absent as a button fill.
 */
export type ButtonVariant = "primary" | "secondary" | "tertiary";

const BASE =
  "inline-block text-center transition-colors duration-150 " +
  "focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "control rounded-sharp bg-button-primary text-button-primary-fg " +
    "px-[34px] py-[15px] hover:bg-button-primary-hover",
  secondary:
    "control rounded-sharp border border-border-primary text-text-secondary " +
    "px-[26px] py-[15px] hover:bg-surface-2",
  tertiary:
    "label-nav text-text-secondary border-b border-border-primary pb-[3px] " +
    "hover:text-text-primary",
};

export function buttonClasses(variant: ButtonVariant): string {
  return `${BASE} ${VARIANTS[variant]}`;
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant };

export function Button({ variant = "primary", className, ...rest }: ButtonProps) {
  return (
    <button
      className={`${buttonClasses(variant)}${className ? ` ${className}` : ""}`}
      {...rest}
    />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant };

export function ButtonLink({ variant = "primary", className, ...rest }: ButtonLinkProps) {
  return (
    <Link
      className={`${buttonClasses(variant)}${className ? ` ${className}` : ""}`}
      {...rest}
    />
  );
}
```

- [ ] **Step 4: Verify green**

Run: `npm test -- tests/unit/button.test.ts`

Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/Button.tsx tests/unit/button.test.ts
git commit -m "feat(design): extract the three-tier button primitive"
```

---

### Task 4: Restyle the nav bar

**Files:**
- Modify: `src/components/NavBar.tsx:28-82` (`linkClasses`, the `nav` shell) and `:117-120` (the Research trigger classes)
- Test: `tests/unit/navbar-chrome.test.ts`

**Interfaces:**
- Consumes: `wordmark`, `label-nav` from Task 1.
- Preserves: the conditional Quiz/Results link, the Research dropdown and its outside-click/Escape handling, `aria-current`, and the active-state underline (spec decision D5 — the mocks are static prototypes that cannot draw a dropdown, so the shipped IA stands and only the treatment changes).

- [ ] **Step 1: Write the failing test**

Create `tests/unit/navbar-chrome.test.ts`:

```ts
/**
 * @vitest-environment jsdom
 *
 * The nav bar's delta-01 treatment, and the IA that must survive it.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/lib/last-results", () => ({
  lastResultsHref: () => null,
  useLastResults: () => null,
}));

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: { container: HTMLDivElement; root: Root }[] = [];

async function renderNav() {
  // vmForks shares a module registry per worker, so reset before the dynamic
  // import to keep these mocks from colliding with other specs.
  vi.resetModules();
  const { NavBar } = await import("@/components/NavBar");
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(createElement(NavBar)));
  mounted.push({ container, root });
  return container;
}

afterEach(() => {
  while (mounted.length) {
    const entry = mounted.pop()!;
    act(() => entry.root.unmount());
    entry.container.remove();
  }
});

describe("nav bar chrome", () => {
  it("sets the wordmark in the mono wordmark role", async () => {
    const container = await renderNav();
    const wordmark = container.querySelector(".wordmark")!;

    expect(wordmark).not.toBeNull();
    expect(wordmark.textContent).toBe("Governance Compass");
  });

  it("stands 54px tall", async () => {
    const container = await renderNav();

    expect(container.querySelector(".h-\\[54px\\]")).not.toBeNull();
  });

  it("labels every nav destination with the 0.10em mono nav role", async () => {
    const container = await renderNav();

    // Quiz link plus the Research trigger.
    expect(container.querySelectorAll(".label-nav").length).toBeGreaterThanOrEqual(2);
  });

  it("keeps the Research dropdown rather than hoisting its children", async () => {
    const container = await renderNav();
    const trigger = container.querySelector("button[aria-haspopup='menu']")!;

    expect(trigger.textContent).toContain("Research");
    expect(container.querySelector("[role='menu']")).toBeNull();

    act(() => trigger.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    const items = [...container.querySelectorAll("[role='menuitem']")].map(
      (item) => item.textContent,
    );
    expect(items).toEqual(["Methodology", "Synthetic Study", "References"]);
  });
});
```

- [ ] **Step 2: Verify red**

Run: `npm test -- tests/unit/navbar-chrome.test.ts`

Expected: FAIL on the first test — the wordmark currently renders
`text-[17px] font-serif font-medium`, so `.wordmark` matches nothing.

- [ ] **Step 3: Restyle the shell**

In `src/components/NavBar.tsx`, replace the `linkClasses` base and the `nav`
shell (lines 34 and 43–54) with:

```tsx
    const base = "py-2 label-nav transition-colors duration-150";
```

```tsx
    <nav className="bg-surface-1 border-b border-border-secondary px-7">
      <div className="max-w-[1040px] mx-auto flex items-center justify-between h-[54px]">
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-150"
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <GovernanceCompassMark size={22} />
          <span className="hidden min-[480px]:inline wordmark text-text-primary">
            Governance Compass
          </span>
        </Link>
        <div className="flex items-center gap-[22px]">
```

The wordmark keeps its `hidden min-[480px]:inline` guard: mock `6a` is a
390px-wide prototype with no wordmark-collision case to draw, and dropping the
guard would crowd the 22px mark against the nav links on narrow phones.

- [ ] **Step 4: Restyle the Research trigger**

Replace line 117:

```tsx
  const base =
    "py-2 label-nav transition-colors duration-150 flex items-baseline gap-1";
```

- [ ] **Step 5: Restyle the dropdown items**

Replace the `className` on the dropdown `Link` (line 168) with:

```tsx
                className="block px-4 py-2 label-nav transition-colors duration-150 text-text-secondary hover:text-text-primary hover:bg-surface-2"
```

- [ ] **Step 6: Verify green**

Run: `npm test -- tests/unit/navbar-chrome.test.ts`

Expected: PASS, 4 tests.

- [ ] **Step 7: Commit**

```bash
git add src/components/NavBar.tsx tests/unit/navbar-chrome.test.ts
git commit -m "feat(design): restyle the nav bar onto the mono label layer"
```

---

### Task 5: Restyle the footer

**Files:**
- Modify: `src/components/Footer.tsx:3-29`
- Test: `tests/unit/footer-chrome.test.ts`

**Interfaces:**
- Consumes: `mono-meta` from Task 1 — **not** `label`. Mock `5a` sets no `text-transform` on this row, so the footer stays sentence case; `label` would force-uppercase all four claims.
- Preserves: all four privacy/licence claims and both external links. The handoff tightens this copy but never weakens it, so the claims are regrouped, not dropped.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/footer-chrome.test.ts`:

```ts
/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Footer } from "@/components/Footer";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: { container: HTMLDivElement; root: Root }[] = [];

function renderFooter() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(createElement(Footer)));
  mounted.push({ container, root });
  return container;
}

afterEach(() => {
  while (mounted.length) {
    const entry = mounted.pop()!;
    act(() => entry.root.unmount());
    entry.container.remove();
  }
});

describe("footer chrome", () => {
  it("sets its two groups in the sentence-case mono meta role", () => {
    const container = renderFooter();

    expect(container.querySelector(".mono-meta")).not.toBeNull();
    // `label` would uppercase the claims; mock 5a keeps them sentence case.
    expect(container.querySelector(".label")).toBeNull();
  });

  it("splits privacy claims from provenance rather than centring all four", () => {
    const container = renderFooter();
    const groups = container.querySelectorAll("[data-footer-group]");

    expect(groups.length).toBe(2);
    expect(groups[0].textContent).toBe("Privacy-first · No data sold");
    expect(groups[1].textContent).toContain("Source on GitHub");
    expect(groups[1].textContent).toContain("PolyForm Noncommercial");
  });

  it("keeps both external links attributed and safe", () => {
    const container = renderFooter();
    const anchors = [...container.querySelectorAll("a")];

    expect(anchors).toHaveLength(2);
    for (const anchor of anchors) {
      expect(anchor.getAttribute("rel")).toBe("noopener noreferrer");
      expect(anchor.getAttribute("target")).toBe("_blank");
    }
  });
});
```

- [ ] **Step 2: Verify red**

Run: `npm test -- tests/unit/footer-chrome.test.ts`

Expected: FAIL on the first test — the footer renders `text-xs`, so `.label`
matches nothing.

- [ ] **Step 3: Write the implementation**

Replace the whole body of `src/components/Footer.tsx`:

```tsx
export function Footer() {
  return (
    <footer className="border-t border-border-secondary px-7 py-5">
      <div className="max-w-[1040px] mx-auto flex flex-wrap items-center justify-between gap-2 mono-meta text-text-tertiary">
        <span data-footer-group="privacy">Privacy-first &middot; No data sold</span>
        <span data-footer-group="provenance">
          <a
            href="https://github.com/WrongerSandwich/governance-compass"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary transition-colors duration-150"
          >
            Source on GitHub
          </a>
          {" · "}
          <a
            href="https://polyformproject.org/licenses/noncommercial/1.0.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary transition-colors duration-150"
          >
            PolyForm Noncommercial
          </a>
        </span>
      </div>
    </footer>
  );
}
```

Two deliberate departures from mock `5a` here. It draws this row at 10.5px,
which is below the delta's stated 11px floor — one of the sub-floor drafts the
delta doc calls out by name — so `mono-meta` holds 11px. And it sets no
`text-transform`, so this row is the one mono element on the page that stays
sentence case; that is why it is `mono-meta` and not `label`.

- [ ] **Step 4: Verify green**

Run: `npm test -- tests/unit/footer-chrome.test.ts`

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/Footer.tsx tests/unit/footer-chrome.test.ts
git commit -m "feat(design): regroup the footer onto the mono label layer"
```

---

### Task 6: Verify the whole phase

**Files:** none modified.

- [ ] **Step 1: Run the full unit suite**

Run: `npm test`

Expected: PASS at 565 tests across 52 files. The baseline on `main` is 543
tests across 51 files (verified 2026-09-08), and this phase adds 22: 5 token +
2 radius guardrails + 8 button + 4 navbar + 3 footer. Confirm no pre-existing
spec regressed — the `vmForks` pool shares a module registry per worker, so a
spec that passes alone can still fail in the full run.

If `tests/unit/db.test.ts` fails with `Cannot find package
'@prisma/adapter-pg'`, `node_modules` is stale relative to the lockfile. Run
`npm ci` and retest before investigating anything else.

- [ ] **Step 2: Run the static gates**

Run: `npm run typecheck && npm run lint && npm run build`

Expected: all three clean; lint at `--max-warnings=0`.

- [ ] **Step 3: Run the e2e suite**

Run: `npm run test:e2e`

Expected: PASS, unmodified. This phase changes no copy and no interaction, so
`tests/e2e/quiz-flow.spec.ts` — the only spec coupled to home copy — must stay
green without edits. Playwright starts its own dev server; make sure no other
dev server is already holding port 3000, and do not override
`PLAYWRIGHT_PORT`, because `NEXTAUTH_URL` is hardcoded to port 3000.

- [ ] **Step 4: Review the rendered chrome in both modes**

Run: `npm run dev`, then open `http://localhost:3000` and toggle the OS
colour scheme. Confirm by eye: 54px nav with a mono wordmark, mono nav links,
2px corners on the hero CTA, a two-group mono footer, and — critically — that
no ink-primary button has gone invisible in dark mode.

- [ ] **Step 5: Reconcile this plan with what actually shipped**

Review cycles changed several tasks after they were written — Task 1's test
was rewritten, Task 2's guardrail regexes were widened, and token names
changed. Task 1's code blocks were synced at the time; Tasks 2–5 were not, to
avoid churning this document after every task.

Walk each task's code blocks and replace any that drifted with the landed
artifact, so this plan documents what shipped rather than what was intended.
Diff each block against its file rather than eyeballing:

```bash
git log --oneline main..HEAD
git diff main..HEAD -- src tests
```

Known drift to fix:

- Task 2's Step 1 still shows the pre-hardening guardrail block (narrow
  regexes, bare-path offender output) rather than the widened patterns and
  actionable messages in `tests/unit/design-system-tokens.test.ts`.
- Task 3's Step 1 still shows `toContain` class assertions. Those were
  replaced with a `hasClass` whole-token helper, because `bg-button-primary`
  is a substring of `hover:bg-button-primary-hover` and `border-b` of
  `border-border-primary` — so the original assertions passed against a
  primary that never filled at rest and a tertiary with no underline. Both
  are now proven by mutation.

- [ ] **Step 6: Commit any fixes and open the PR**

```bash
git switch -c feat/design-delta-foundations
git push -u origin feat/design-delta-foundations
gh pr create --title "feat(design): design system delta — foundations" \
  --body "Implements phase 1 of docs/superpowers/plans/2026-09-08-design-system-delta-foundations.md"
```

---

## Out of scope for this phase

Deliberately deferred, each to its own plan (see the spec's phasing table):

- `PairedAxisScale`, the `home_sample_pair.json` build output, axis
  `divergenceNote`, domain `blurb`, and the home page rewrite — Phase 2.
- Replacing the nine inline button call sites with `Button`/`ButtonLink`. They
  keep working on their current classes until each screen's phase reaches them;
  the primitive exists first so no phase has to invent it.
- The 14 `rounded-[3px]`, three `rounded-[6px]`, and one `rounded-[4px]`
  literals, plus the 38 inline `borderRadius` marks at 1–6px in
  `src/components/study/` (35 quoted, three unquoted numeric). The 3px ones are score-bar and budget-bar tracks
  that Phase 4 replaces outright with the paired axis scale's 2px track.
- The seven bare `rounded` classes (Tailwind's default 4px) and the
  `--radius-*: initial` namespace lockdown that would make off-system radii
  unwritable. Both are worth doing and were verified to work, but sweeping
  those seven sites is an unspecified visual change and the lockdown makes
  bare `rounded` fail silently, so they belong together in a follow-up with a
  visual review — not smuggled into this phase. Tracked as issue #139; see
  also Task 2's closing note.
- `CLAUDE.md` and `docs/system_proposal/governance_compass_design_spec.md`
  updates, including the filled-button rule rewrite from spec decision D1 —
  Phase 6, so the docs describe what actually shipped.
