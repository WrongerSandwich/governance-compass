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
- Modify: `src/app/globals.css:8-90` (`:root` block), `:135-160` (dark block), `:162-200` (`@theme inline` block)
- Test: `tests/unit/design-system-tokens.test.ts`

**Interfaces:**
- Produces: `--radius`, `--radius-panel`, `--button-primary-*` custom properties; the `rounded-panel` utility; and the `display-*`, `body-lead`, `label*`, `control`, `wordmark`, `caption-italic` utilities.
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

describe("design delta token layer", () => {
  it("defines the near-square radius and exposes it to Tailwind", () => {
    expect(globalsCss).toContain("--radius: 2px;");
    expect(globalsCss).toContain("--radius-panel: var(--radius);");
  });

  it("inverts the primary button in dark mode instead of darkening it", () => {
    // Light: ink on paper. Dark: the same relationship, reversed.
    expect(globalsCss).toContain("--button-primary-bg:       var(--stone-900);");
    expect(globalsCss).toContain("--button-primary-bg:       var(--stone-300);");
    expect(globalsCss).toContain("--button-primary-text:     var(--stone-50);");
    expect(globalsCss).toContain("--button-primary-text:     var(--stone-900);");
  });

  it("maps the button tokens into the Tailwind colour namespace", () => {
    expect(globalsCss).toContain(
      "--color-button-primary-bg:       var(--button-primary-bg);",
    );
    expect(globalsCss).toContain(
      "--color-button-primary-bg-hover: var(--button-primary-bg-hover);",
    );
    expect(globalsCss).toContain(
      "--color-button-primary-text:     var(--button-primary-text);",
    );
  });

  it("declares every typography role from the delta's type scale", () => {
    for (const utility of [
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
    ]) {
      expect(globalsCss).toContain(`@utility ${utility} {`);
    }
  });

  it("holds the 11px type floor across every label role", () => {
    const utilityBlocks = globalsCss.matchAll(
      /@utility [a-z-]+ \{([^}]*)\}/g,
    );
    const sizes: number[] = [];
    for (const [, body] of utilityBlocks) {
      const match = body.match(/font-size:\s*([0-9.]+)px/);
      if (match) sizes.push(Number(match[1]));
    }
    expect(sizes.length).toBeGreaterThan(0);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(11);
  });
});
```

- [ ] **Step 2: Verify red**

Run: `npm test -- tests/unit/design-system-tokens.test.ts`

Expected: FAIL — every assertion misses, starting with
`expect(globalsCss).toContain("--radius: 2px;")`, because no token exists yet.

- [ ] **Step 3: Add the `:root` tokens**

In `src/app/globals.css`, inside `:root`, immediately after the `--focus-ring`
declaration and before the cluster-colour comment block, insert:

```css
  /* --- Radius (design delta 02: 12px and 8px both collapse to 2px) --- */
  --radius: 2px;

  /* --- Button surfaces (design delta 03: ink-filled primary) ---
     Semantic aliases onto the Stone ramp so delta 06's dark-mode inversion
     is a token override rather than a per-component branch. */
  --button-primary-bg:       var(--stone-900);
  --button-primary-bg-hover: var(--stone-800);
  --button-primary-text:     var(--stone-50);
```

- [ ] **Step 4: Add the dark-mode inversion**

In the `@media (prefers-color-scheme: dark)` block, immediately after the
`--warning-border` declaration, insert:

```css
    /* Design delta 06: Stone 900 ink on a Stone 900 ground is invisible, so
       the primary inverts rather than darkens. */
    --button-primary-bg:       var(--stone-300);
    --button-primary-bg-hover: var(--stone-200);
    --button-primary-text:     var(--stone-900);
```

- [ ] **Step 5: Extend `@theme inline`**

In the `@theme inline` block, after the `--color-info` line, insert:

```css
  --color-button-primary-bg:       var(--button-primary-bg);
  --color-button-primary-bg-hover: var(--button-primary-bg-hover);
  --color-button-primary-text:     var(--button-primary-text);

  --radius-panel: var(--radius);
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

   Type floor is 11px. Nothing below it, on any viewport.
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
the `@utility` syntax and the `--radius-panel` theme entry — a malformed
`@theme`/`@utility` rule fails the CSS build, not the unit test.

- [ ] **Step 9: Commit**

```bash
git add src/app/globals.css tests/unit/design-system-tokens.test.ts
git commit -m "feat(design): add radius, button, and typography tokens for the design delta"
```

---

### Task 2: Sweep the legacy radius literals

**Files:**
- Modify (26 files, 89 literals): `src/app/account/page.tsx`, `src/app/archetypes/page.tsx`, `src/app/auth/signin/page.tsx`, `src/app/auth/signup/page.tsx`, `src/app/axes/page.tsx`, `src/app/compare/page.tsx`, `src/app/compare/[profileId1]/[profileId2]/page.tsx`, `src/app/groups/[groupId]/page.tsx`, `src/app/methodology/page.tsx`, `src/app/page.tsx`, `src/app/questions/page.tsx`, `src/app/references/page.tsx`, `src/app/results/[profileId]/[axisId]/page.tsx`, `src/components/annotations/AnnotationEditor.tsx`, `src/components/comparison/BudgetComparison.tsx`, `src/components/comparison/ComparisonScoreBar.tsx`, `src/components/GlossaryTerm.tsx`, `src/components/groups/GroupHeatMap.tsx`, `src/components/quiz/BudgetSimulator.tsx`, `src/components/quiz/ForcedChoiceCard.tsx`, `src/components/quiz/PhaseTransition.tsx`, `src/components/quiz/QuizFlow.tsx`, `src/components/quiz/ScaledQuestionCard.tsx`, `src/components/results/ArchetypeCard.tsx`, `src/components/results/AxisBreakdownCard.tsx`, `src/components/results/ResultsView.tsx`
- Test: `tests/unit/design-system-tokens.test.ts` (extend)

**Interfaces:**
- Consumes: the `rounded-panel` utility from Task 1.
- Produces: a source-wide guardrail against the reintroduction of 12px/8px radii.

- [ ] **Step 1: Write the failing guardrail test**

Append to `tests/unit/design-system-tokens.test.ts`:

```ts
import { readdirSync } from "node:fs";

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}

describe("near-square corners (design delta 02)", () => {
  it("has retired every 12px and 8px radius literal from src", () => {
    const offenders = tsxFiles(resolve(process.cwd(), "src")).filter((file) =>
      /rounded-\[(?:12|8)px\]/.test(readFileSync(file, "utf8")),
    );

    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Verify red**

Run: `npm test -- tests/unit/design-system-tokens.test.ts`

Expected: FAIL — `offenders` lists 26 absolute file paths.

- [ ] **Step 3: Run the sweep**

Both literals map to the same new utility, and there are no directional
variants (`rounded-t-[8px]` and friends do not appear in `src`), so this is a
safe two-pattern replace:

```bash
grep -rl --include='*.tsx' -E 'rounded-\[(12|8)px\]' src \
  | xargs sed -i -E 's/rounded-\[(12|8)px\]/rounded-panel/g'
```

- [ ] **Step 4: Confirm the sweep was total and left nothing else behind**

Run:

```bash
grep -rn --include='*.tsx' -E 'rounded-\[(12|8)px\]' src | wc -l
grep -roh --include='*.tsx' 'rounded-panel' src | wc -l
```

Expected: `0` then `89`.

- [ ] **Step 5: Verify green**

Run: `npm test -- tests/unit/design-system-tokens.test.ts && npm run typecheck && npm run lint`

Expected: tests PASS (6 tests), typecheck clean, lint clean at
`--max-warnings=0`.

- [ ] **Step 6: Commit**

```bash
git add src tests/unit/design-system-tokens.test.ts
git commit -m "refactor(design): collapse 12px and 8px radii to the 2px panel token"
```

---

### Task 3: Extract the button primitive

**Files:**
- Create: `src/components/Button.tsx`
- Test: `tests/unit/button.test.ts`

**Interfaces:**
- Produces: `buttonClasses(variant)`, `Button` (renders `<button>`), `ButtonLink` (renders a `next/link` anchor), and the `ButtonVariant` type.
- Consumes: `control`, `label-nav`, `rounded-panel`, and the `button-primary-*` colours from Task 1.
- Consumed by: Task 4 (`NavBar` has no buttons, but Phases 2–5 replace all nine inline button call sites with these).

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

    expect(classes).toContain("bg-button-primary-bg");
    expect(classes).toContain("text-button-primary-text");
    expect(classes).toContain("hover:bg-button-primary-bg-hover");
    // Stone 600 keeps its jobs as focus ring and progress fill only.
    expect(classes).not.toContain("bg-stone-600");
    expect(classes).not.toContain("bg-stone-900");
  });

  it("outlines the secondary and never fills it", () => {
    const classes = buttonClasses("secondary");

    expect(classes).toContain("border-border-primary");
    expect(classes).not.toContain("bg-button-primary-bg");
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
    "control rounded-panel bg-button-primary-bg text-button-primary-text " +
    "px-[34px] py-[15px] hover:bg-button-primary-bg-hover",
  secondary:
    "control rounded-panel border border-border-primary text-text-secondary " +
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

Expected: PASS at 564 tests across 52 files. The baseline on `main` is 543
tests across 51 files (verified 2026-09-08), and this phase adds 21: 5 token +
1 radius guardrail + 8 button + 4 navbar + 3 footer. Confirm no pre-existing
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

- [ ] **Step 5: Commit any fixes and open the PR**

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
  literals. The 3px ones are score-bar and budget-bar tracks that Phase 4
  replaces outright with the paired axis scale's 2px track.
- `CLAUDE.md` and `docs/system_proposal/governance_compass_design_spec.md`
  updates, including the filled-button rule rewrite from spec decision D1 —
  Phase 6, so the docs describe what actually shipped.
