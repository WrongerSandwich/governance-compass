# Design System Delta — Quiz Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle every quiz surface onto the Phase 1 token layer so the assessment reads as the same surveyed instrument as the home page — and fix the choice card's focus ring, which has never painted.

**Architecture:** Restyle only. No component is added, removed, split, or given new state; the quiz reducer, the seeded shuffle, autosave/resume, skip, and keyboard 1–5 are untouched. The work is class-level: mono label layer, `display-*` serif roles, `Button` at every call site, 1px rules instead of 2px borders, and ink-fill selection. One new `@utility` (`focus-ring-child`) joins `focus-ring` in `globals.css` because the choice card draws its ring on a wrapper while the focusable element is the `sr-only` button inside it.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4.3.3, Vitest 4 (jsdom via docblock, `vmForks` pool), Playwright.

**Spec:** `docs/superpowers/specs/2026-09-08-design-system-delta-design.md`
**Issue:** #134 · **Reference:** `docs/gov_compass_redesign.zip` → `Home proposals.dc.html`, option **6b** (the only quiz screen drawn)

---

## Global Constraints

Phases 1 (#132, PR #140) and 2 (#133, PR #143) landed the token layer, the `Button` primitive, and the page idiom. Use them rather than re-spelling values.

- **`text-text-label`, never `text-text-tertiary`, for the mono label layer.** Stone 500 measures 2.73:1 on the light page ground and fails WCAG AA; `--text-label` steps Stone 700 / Stone 500 by mode. Spec decision D7.
- **The `text-text-tertiary` sweep for the quiz happens here.** D6 defers *layout* on undrawn screens, not the label layer. Every `text-text-tertiary` in `src/components/quiz/` moves to `text-text-label` when it dresses a label and `text-text-secondary` when it dresses prose. Nothing in the quiz directory keeps `text-text-tertiary` after this phase; a guardrail in Task 8 pins that.
- **`className` does NOT override variant classes on `Button`/`ButtonLink`.** Appending does not win; Tailwind's emitted order does, and the variant utilities land later in the sheet. `className` is only for properties no variant sets — margin, width, position. `w-full` is the verified conflict-free way to go full-width. Never pass `block`, `px-*`, or a text colour.
- **Typography roles** (`display-s`, `display-entry`, `body-lead`, `label`, `label-nav`, `label-eyebrow`, `label-tight`, `control`, `caption-italic`) are single self-contained classes. Do not layer a built-in utility over one to vary a property the role already sets. Layering a property the role does **not** set is safe — `label` declares no `font-weight`, so `label font-medium` is fine, and `caption-italic` declares `color`, so a colour class next to it is not.
- **`rounded-sharp`** for corners; a guardrail bans `rounded-[8px]`/`[12px]`/`lg`/`xl`. The `rounded-[3px]` literals in `BudgetSimulator` are in scope for this phase (Task 7) but retiring them does not close #139.
- **`focus-ring`** (or, from Task 1, `focus-ring-child`) for every interactive element. Never hand-roll `outline-none` + `outline-2`; a source guardrail fails on both spellings after Task 1.
- No new colour values. No Tailwind `dark:` variants — dark mode is `prefers-color-scheme` overriding `:root` custom properties. Watch for the inverse of that: a hard-coded ramp value like `text-stone-800` reads as near-black on a dark ground. Task 5 fixes one.
- The codebase's single responsive breakpoint is `min-[560px]`. `sm:` (640px) appears once in the quiz, in `BudgetSimulator`; Task 7 converts it.
- Vitest collects only `tests/**/*.test.ts` and `scripts/__tests__/**/*.test.ts`, never `.tsx`. Component tests use `createElement` with a `@vitest-environment jsdom` docblock.
- **`vmForks` shares a module registry per worker.** Any spec that calls `vi.mock` must `vi.resetModules()` and dynamically `import()` the component under test, the way `tests/unit/navbar-chrome.test.ts` does. A spec that mocks at module scope and imports statically passes alone and fails in a full run.
- **Assert class tokens, never substrings.** `expect(el.className).toContain("label")` also passes on `label-nav`, and `toContain("hidden")` passes on `min-[560px]:hidden`. Split on whitespace and use `expect(classes).toContain(...)`.
- Lint runs at `--max-warnings=0`.

**Baseline:** `main` at `d01fb37`, 632 unit tests across 59 files, all gates green.

**Branch:** `feat/design-delta-quiz` off `main`.

---

## File Structure

| File | Change | Responsibility after this phase |
| --- | --- | --- |
| `src/app/globals.css` | Modify (append one `@utility`) | Adds `focus-ring-child` beside `focus-ring`. |
| `src/app/quiz/page.tsx` | Modify (1 line) | Owns the quiz gutters (18px / 28px), matching the nav. |
| `src/components/quiz/ProgressBar.tsx` | Modify | Mock 6b's label row + three 3px segments. |
| `src/components/quiz/ForcedChoiceCard.tsx` | Modify | Mock 6b's prompt, two-column option grid, and the three card states. |
| `src/components/quiz/QuizFlow.tsx` | Modify | Shell metrics, the `Button` nav row, skip link, glossary hint, and the four interstitial screens. |
| `src/components/quiz/PhaseTransition.tsx` | Modify | The between-phase panel, by extension from 6b. |
| `src/components/quiz/ScaledQuestionCard.tsx` | Modify | Phase 2's scale, by extension from 6b. |
| `src/components/quiz/BudgetSimulator.tsx` | Modify | Phase 3's budget, by extension from 6b. |
| `src/components/quiz/ComputingMessages.tsx` | Modify (1 line) | Its rotating sentence, off `text-text-tertiary`. |
| `tests/unit/quiz-chrome.test.ts` | **Create** | Every rendered assertion and quiz-directory guardrail for this phase. |
| `tests/unit/design-system-tokens.test.ts` | Modify | Extends the focus-ring guardrail to the `focus-within` spelling. |

`QuizProvider.tsx` is untouched. `tests/unit/quiz-interactions.test.ts` and `tests/unit/budget-simulator-stepper.test.ts` must stay green unmodified — they pin behaviour this phase must not change.

---

### Task 1: Fix the choice card's focus ring

**Files:**
- Modify: `src/app/globals.css` — append after the `focus-ring` utility (ends line 472)
- Modify: `src/components/quiz/ForcedChoiceCard.tsx:52`
- Modify: `tests/unit/design-system-tokens.test.ts` — the `describe("focus ring")` block

**Interfaces:**
- Produces: the `focus-ring-child` utility.
- Consumed by: `ForcedChoiceCard` here, and Task 3's card restyle.

**Why this is first.** It is the phase's only behavioural fix, and it is the same defect Phase 1 found in `focus:outline-none`, wearing a different variant. Compiled against this repo's Tailwind 4.3.3, the four classes on `ForcedChoiceCard:52` emit:

```
.focus-within\:outline-2:focus-within    { outline-style: var(--tw-outline-style); outline-width: 2px }
.focus-within\:outline-none:focus-within { --tw-outline-style: none; outline-style: none }
```

`outline-none` is emitted **after** `outline-2`, both match at the same time, and equal specificity means the later rule wins: `outline-style: none`. Width and colour apply; no ring is ever drawn. Every keyboard user tabbing through a dilemma gets no visible focus indicator.

- [ ] **Step 1: Write the failing guardrail**

In `tests/unit/design-system-tokens.test.ts`, replace the body of the first test in `describe("focus ring")` so it reads:

```ts
  it("bans the broken outline-none focus spellings", () => {
    // The hand-rolled spelling this replaced was silently broken:
    // `focus:outline-none` emits `--tw-outline-style: none`, and :focus always
    // matches when :focus-visible does, so `outline-style: var(...)` resolved
    // to `none`. Width and colour applied; the ring never painted. Confirmed
    // in Chromium before the sweep, across all 25 former call sites.
    expect(offenders(/focus:outline-none/, "focus-ring")).toEqual([]);
    // Same defect, different variant. Tailwind 4.3.3 emits
    // `.focus-within\:outline-none:focus-within` (which sets
    // `outline-style: none` outright) AFTER
    // `.focus-within\:outline-2:focus-within`; both match at once, so the
    // later rule wins. Verified by compiling both classes against this repo's
    // Tailwind, not inferred from the :focus/:focus-visible case.
    expect(offenders(/focus-within:outline-none/, "focus-ring-child")).toEqual([]);
  });
```

Also rename the test that follows it. Its title claims `focus-ring` "is the only
consumer of the focus-ring token", which this task makes false — and its body
never asserted uniqueness in the first place, so the name always overclaimed.
Retitle it to what it checks, and pin the offset while you are in there:

```ts
  it("paints a real outline off the focus-ring token", () => {
    const utility = utilities.find((entry) => entry.name === "focus-ring");

    expect(utility, "focus-ring utility is missing").toBeDefined();
    // The `outline` shorthand sets style explicitly, so it cannot be undone by
    // a custom property the way `outline-style: var(--tw-outline-style)` was.
    expect(utility!.body).toMatch(/outline:\s*2px solid var\(--focus-ring\)/);
    // The offset is the one declaration that could drift silently — deleting it
    // left the suite green before this assertion existed.
    expect(utility!.body).toMatch(/outline-offset:\s*2px/);
    expect(light["--focus-ring"]).toBe("var(--stone-600)");
  });
```

Then append a third test inside the same `describe`:

```ts
  it("draws the card ring on the wrapper, for its own control only", () => {
    const utility = utilities.find((entry) => entry.name === "focus-ring-child");

    expect(utility, "focus-ring-child utility is missing").toBeDefined();
    // `:focus-visible` rather than `:focus-within`: the ring belongs to the
    // card, but the focusable element is the sr-only button inside it, and a
    // mouse click on a card must not leave a ring behind.
    expect(utility!.body).not.toMatch(/&:focus-within/);
    // Scoped to a DIRECT BUTTON child, not any descendant. The card's prose
    // runs through AnnotatedText -> GlossaryTerm, whose trigger is a
    // `span[role=button][tabindex=0]` — focusable, and carrying no ring of its
    // own. An unscoped `:has(:focus-visible)` rings the whole card while focus
    // sits on an inline glossary term, which points the only affordance on
    // screen at the wrong control.
    expect(utility!.body).toMatch(/:has\(\s*>\s*button:focus-visible\s*\)/);
    // The `outline` shorthand sets style explicitly, so it cannot be undone by
    // a custom property the way `outline-style: var(--tw-outline-style)` was.
    expect(utility!.body).toMatch(/outline:\s*2px solid var\(--focus-ring\)/);
    expect(utility!.body).toMatch(/outline-offset:\s*2px/);
  });
```

- [ ] **Step 2: Verify red**

Run: `npm test -- tests/unit/design-system-tokens.test.ts`

Expected: FAIL — the guardrail reports `src/components/quiz/ForcedChoiceCard.tsx: focus-within:outline-none (use focus-ring-child instead)`, and `focus-ring-child utility is missing`. The retitled `focus-ring` test fails too, on the new `outline-offset` assertion only if that declaration is absent; it should pass, since `focus-ring` already sets it.

- [ ] **Step 3: Add the utility**

Append to `src/app/globals.css`, immediately after the closing brace of `@utility focus-ring` and before `@utility caption-italic`:

```css
/* The choice card's sibling of `focus-ring`. The ring belongs on the card, but
   the focusable element is the sr-only button inside it, so the selector has to
   reach downward.

   `:focus-visible` rather than `:focus-within`, because :focus-within matches a
   plain :focus too — a mouse click on a dilemma would leave a ring behind,
   which is exactly the behaviour `focus-ring` exists to avoid.

   Scoped to a DIRECT BUTTON child rather than any descendant. The card's prose
   runs through AnnotatedText into GlossaryTerm, whose trigger is a focusable
   `span[role="button"][tabindex="0"]` carrying no ring of its own — fifteen
   glossary terms match text in the forced-choice bank. An unscoped
   `:has(:focus-visible)` would ring the entire card while focus sat on an
   inline term, pointing the only affordance on screen at the wrong control.

   The spelling this replaces was broken the same way `focus:outline-none` was.
   Tailwind 4.3.3 emits `.focus-within\:outline-none:focus-within` — which sets
   `outline-style: none` outright — after `.focus-within\:outline-2:focus-within`,
   and both match at once, so the later rule won and the ring never painted.
   Verified by compiling the four classes against this repo's Tailwind. */
@utility focus-ring-child {
  &:has(> button:focus-visible) {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }
}
```

Then correct the `focus-ring` banner comment above it, which claims `focus-ring`
"is the only consumer of `--focus-ring`". This task makes that false; the two
ring utilities are now its only consumers.

Registering the new name in the test file's `NON_TYPOGRAPHY_UTILITIES` array is
part of this step, not optional — that array's own comment states a new utility
must be listed there or in `TYPE_SCALE`, and two type-scale tests fail otherwise.

- [ ] **Step 4: Swap the call site**

In `src/components/quiz/ForcedChoiceCard.tsx`, replace the `base` string in `cardClasses` (line 51–52):

```ts
    const base =
      "rounded-sharp p-6 border-2 cursor-pointer transition-colors duration-150 focus-ring-child";
```

(The border weight and the rest of the card are Task 3's business; this step changes only the focus classes.)

- [ ] **Step 5: Verify green**

Run: `npm test -- tests/unit/design-system-tokens.test.ts`

Expected: PASS, all tests in the file.

- [ ] **Step 6: Prove the guardrails are not vacuous**

Run four mutations, restoring after each, and confirm every one reddens its intended test **and only that one**:

1. Re-add `focus-within:outline-none` to `ForcedChoiceCard.tsx:52` — expect FAIL on the guardrail test.
2. Change `:has(> button:focus-visible)` to `&:focus-within` in `globals.css` — expect FAIL on the `focus-ring-child` test.
3. Widen it to `:has(:focus-visible)` — expect FAIL on the same test's scoping assertion. This is the mutation that matters most; it is the defect the first attempt shipped.
4. Delete `outline-offset: 2px` from **each** ring utility in turn — expect FAIL on that utility's test. Before this pass, deleting the offset left the whole suite green.

A token test that fails by passing vacuously proves nothing; this step is the proof.

- [ ] **Step 7: Confirm the ring actually paints**

Run: `npm run build && npx next start -p 3100`

In a browser at `http://localhost:3100/quiz`, click `Begin`, then press Tab until focus lands on a dilemma card. Expect a 2px Stone 600 outline at 2px offset around the card. Read the computed `outlineStyle`/`outlineWidth`/`outlineColor`/`outlineOffset` longhands rather than the shorthand — Chromium serialises `color` into the shorthand and it reads as the wrong colour.

Then, still on the keyboard, Tab once more so focus lands on a **glossary term inside that card** (a dotted-underlined phrase; the forced-choice bank has fifteen). Confirm the card's outline goes back to `none` — the ring must not follow focus onto an inline term.

Then click a card with the mouse and confirm **no** ring appears on either card. Stop the server.

Stop it by killing the PID you started, not with `pkill -f`. This machine runs several Next servers and other long-lived containers; a broad pattern kill has already taken down an unrelated one.

Verify on the production build, not `next dev` — `next dev` reload-loops under a driven browser and resets React state mid-check.

- [ ] **Step 8: Commit**

```bash
git add src/app/globals.css src/components/quiz/ForcedChoiceCard.tsx tests/unit/design-system-tokens.test.ts
git commit -m "fix(design): paint the choice card's focus ring, which never did"
```

---

### Task 2: ProgressBar

**Files:**
- Modify: `src/components/quiz/ProgressBar.tsx` (whole file)
- Test: `tests/unit/quiz-chrome.test.ts` (create)

**Interfaces:**
- Props are unchanged: `{ currentPhase: 1 | 2 | 3; currentIndex: number; totalInPhase: number }`.
- Consumed by: `QuizFlow` at three call sites, unchanged.

**Mock 6b measurements.** Label row `Phase 1 · Dilemmas` left, `2 of 36` right, both 11px mono uppercase 0.10em (`label-nav`) in Stone 700 (`--text-label`), 10px above the segments. Three equal segments, 3px tall, 4px gap, track `--border-secondary`, fill Stone 600 at `(index + 1) / total`; completed segments 100%. 32px below the bar.

Two drifts from what ships today: the track is `bg-border-tertiary` (a step too faint), and completed segments carry `brightness-125`, which lightens Stone 600 into a tone the palette does not contain.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/quiz-chrome.test.ts`:

```ts
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

    // Without the `totalInPhase > 0` guard the width computes to "Infinity%",
    // which jsdom's style setter rejects outright, so the observed value is ""
    // rather than "Infinity%". Either way this assertion fails — but don't
    // write the comment as if "Infinity%" is what you'd see. A rewrite that
    // claims to preserve a guard should pin the guard.
    expect(fills[0].style.width).toBe("0%");
  });
});
```

- [ ] **Step 2: Verify red**

Run: `npm test -- tests/unit/quiz-chrome.test.ts`

Expected: FAIL on all six tests — `container.querySelector("[data-progress-label]")` is `null`, because the hooks do not exist yet.

- [ ] **Step 3: Rewrite the component**

Replace the whole of `src/components/quiz/ProgressBar.tsx`:

```tsx
"use client";

interface ProgressBarProps {
  currentPhase: 1 | 2 | 3;
  currentIndex: number;
  totalInPhase: number;
}

const PHASE_LABELS = ["Dilemmas", "Scales", "Budget"];

/**
 * Mock 6b's progress header: a mono label row over three equal segments.
 *
 * The `data-progress-*` hooks exist so the test can address the row, the
 * tracks, and the fills without depending on DOM shape — this is a
 * presentational component whose whole contract is its treatment.
 */
export function ProgressBar({
  currentPhase,
  currentIndex,
  totalInPhase,
}: ProgressBarProps) {
  const progressInPhase =
    totalInPhase > 0 ? ((currentIndex + 1) / totalInPhase) * 100 : 0;

  return (
    <div className="mb-8">
      {/* Phase label and count — 11px mono, 0.10em, at the AA-clearing label
          colour. 10px above the segments, per the mock. */}
      <div
        data-progress-label
        className="flex justify-between label-nav text-text-label mb-2.5"
      >
        <span>
          Phase {currentPhase} &middot; {PHASE_LABELS[currentPhase - 1]}
        </span>
        {totalInPhase > 1 && (
          <span>
            {currentIndex + 1} of {totalInPhase}
          </span>
        )}
      </div>

      {/* 3-segment progress bar */}
      <div className="flex gap-1">
        {[1, 2, 3].map((phase) => {
          const isCompleted = phase < currentPhase;
          const isActive = phase === currentPhase;

          return (
            <div
              key={phase}
              data-progress-track
              className="flex-1 h-[3px] overflow-hidden bg-border-secondary"
            >
              <div
                data-progress-fill
                className={`h-full transition-all duration-300 ${
                  isCompleted || isActive ? "bg-stone-600" : "bg-transparent"
                }`}
                style={{
                  width: isCompleted
                    ? "100%"
                    : isActive
                      ? `${progressInPhase}%`
                      : "0%",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify green**

Run: `npm test -- tests/unit/quiz-chrome.test.ts`

Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/quiz/ProgressBar.tsx tests/unit/quiz-chrome.test.ts
git commit -m "feat(design): restyle the quiz progress bar onto mock 6b"
```

---

### Task 3: ForcedChoiceCard

**Files:**
- Modify: `src/components/quiz/ForcedChoiceCard.tsx`
- Test: `tests/unit/quiz-chrome.test.ts` (extend)

**Interfaces:**
- Props unchanged. The `data-choice-card` attribute, the `sr-only` button with `aria-pressed` and `aria-label`, and the `AnnotatedText` wrapping are load-bearing — `tests/e2e/quiz-flow.spec.ts:25` clicks `[data-choice-card]`, and `tests/unit/quiz-interactions.test.ts:57` asserts no interactive descendant sits inside a `<button>`. Do not restructure any of it.

**Mock 6b measurements.** Prompt: 11px mono uppercase 0.12em (`label`), 18px below. Two-column grid, 16px gap, one column below 560px. Each card: `--surface-1`, 2px radius, 24px padding, **1px** border. Headline 500 17px/1.35 serif (`display-s`), 10px below. Body 13.5px/1.6 Stone 700 (`--text-secondary`). Selected: Stone 900 border (`--rule-strong`, which inverts) plus a `Selected` marker in 11px mono uppercase 500 Stone 900, 14px below the body. Unselected-with-selection: Stone 200 border (`--border-secondary`) at 60% opacity. Hover: Stone 600 border.

**Two departures from the drawn pixels, both already-recorded decisions.** The mock's prompt is Stone 500; D7 puts the whole label layer on `--text-label`, so it is Stone 700 in light. And `--rule-strong` carries the selected border rather than `border-stone-900`, because the Stone ramp is fixed across modes: a literal Stone 900 border would be near-invisible on the dark ground.

- [ ] **Step 1: Write the failing test**

Add to `tests/unit/quiz-chrome.test.ts` — extend the import line and append a new `describe` at the end of the file:

```ts
import { ForcedChoiceCard } from "@/components/quiz/ForcedChoiceCard";
```

```ts
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

  it("sets option headlines in the serif card role and bodies at the delta's prose size", () => {
    const container = renderCard(undefined);
    const card = container.querySelector("[data-choice-card]")!;
    const [headline, body] = card.querySelectorAll("p");

    expect(classes(headline)).toContain("display-s");
    expect(classes(body)).toContain("text-[13.5px]");
    expect(classes(body)).toContain("text-text-secondary");
    expect(classes(body)).not.toContain("text-text-tertiary");
  });
});
```

- [ ] **Step 2: Verify red**

Run: `npm test -- tests/unit/quiz-chrome.test.ts`

Expected: FAIL on the ForcedChoiceCard tests — the prompt still carries `text-[11px] uppercase tracking-[0.08em]`, cards still carry `border-2 border-transparent`, and `[data-selected-marker]` does not exist.

- [ ] **Step 3: Restyle the card**

In `src/components/quiz/ForcedChoiceCard.tsx`, replace `cardClasses` (lines 47–66):

```tsx
  function cardClasses(logicalPole: "A" | "B"): string {
    const isSelected = selectedPole === logicalPole;
    const hasSelection = selectedPole !== undefined;

    // 1px border in every state — the state is carried by the border's tone,
    // not its weight, so choosing does not shift the card's height.
    const base =
      "rounded-sharp p-6 border bg-surface-1 cursor-pointer transition-colors duration-150 focus-ring-child";

    if (isSelected) {
      // --rule-strong is the ink/hairline pair's strong end, so it inverts with
      // the surface. `border-stone-900` would go near-invisible in dark mode.
      return `${base} border-rule-strong`;
    }
    if (hasSelection) {
      return `${base} border-border-secondary opacity-60 hover:opacity-100 hover:border-stone-600`;
    }
    return `${base} border-border-secondary hover:border-stone-600`;
  }
```

Then replace the returned JSX (lines 68–118) with:

```tsx
  function option(logicalPole: "A" | "B", headline: string, body: string) {
    const isSelected = selectedPole === logicalPole;
    return (
      <div
        data-choice-card
        onClick={() => onSelect(logicalPole)}
        className={cardClasses(logicalPole)}
      >
        <button
          type="button"
          aria-pressed={isSelected}
          aria-label={`Select ${headline}`}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(logicalPole);
          }}
          className="sr-only"
        />
        <p className="text-left display-s text-text-primary mb-2.5">
          <AnnotatedText text={headline} />
        </p>
        <p className="text-left text-[13.5px] leading-[1.6] text-text-secondary">
          <AnnotatedText text={body} />
        </p>
        {isSelected && (
          // `label` declares no font-weight, so `font-medium` layers over it
          // safely — the roles only conflict on properties they both set.
          <p data-selected-marker className="mt-3.5 label font-medium text-text-primary">
            Selected
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="mb-[18px] label text-text-label">
        {questionType === "PT"
          ? "Which person’s view is closer to your own?"
          : "Select the position closer to your own view"}
      </p>
      <div className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2">
        {option(firstPole, firstHeadline, firstBody)}
        {option(secondPole, secondHeadline, secondBody)}
      </div>
    </div>
  );
```

- [ ] **Step 4: Verify green, including the behaviour this must not break**

Run: `npm test -- tests/unit/quiz-chrome.test.ts tests/unit/quiz-interactions.test.ts`

Expected: PASS. `quiz-interactions.test.ts` must pass **unmodified** — it pins that no glossary control ends up inside a `<button>`, and that clicking a glossary tooltip does not record a response.

- [ ] **Step 5: Commit**

```bash
git add src/components/quiz/ForcedChoiceCard.tsx tests/unit/quiz-chrome.test.ts
git commit -m "feat(design): restyle the forced-choice card onto mock 6b"
```

---

### Task 4: QuizFlow — shell, navigation, and the interstitial screens

**Files:**
- Modify: `src/app/quiz/page.tsx:15`
- Modify: `src/components/quiz/QuizFlow.tsx`
- Test: `tests/unit/quiz-chrome.test.ts` (extend)

**Interfaces:**
- Produces: nothing new. `QuizFlowProps` is unchanged.
- Consumed by: `src/app/quiz/page.tsx`, unchanged.

**Mock 6b measurements.** Body column 672px (`max-w-2xl`), 36px above, 52px below, 28px gutters. Glossary hint 12.5px centred, 20px below, the highlighted term dotted-underlined in `#C4A84A` at 3px offset. Navigation 32px above the row: outlined `Previous` left, ink-filled `Next` right, both 12px mono uppercase — which is exactly `Button`'s `secondary` and `primary`.

**Gutters move to the page.** The mock draws 28px gutters; `main` currently has `px-4` (16px). Putting the gutters on `main` at `px-[18px] min-[560px]:px-7` matches the nav bar exactly (`NavBar.tsx:47`), so the quiz column lines up with the wordmark at every width. **This is load-bearing for Task 7:** `BudgetSimulator`'s sticky footer bleeds to the gutter edge with `-mx-4`, which stops matching the moment this changes. Task 7 fixes it; between Task 4 and Task 7 the budget footer is 2px narrow on mobile. That is the only intentionally-transient state in this plan.

**Decision — the ink-filled `Next` (spec D1).** Every one of 60 questions now shows a filled button, which breaks `CLAUDE.md`'s rule reserving filled buttons for beginning/resuming the assessment and confirming the budget. Resolved in favour of the mock; #137 (phase 6) rewrites the rule to describe the two-tier system rather than a count.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/quiz-chrome.test.ts`. This spec mocks `next/navigation`, so it must reset modules and import dynamically — `vmForks` shares one module registry per worker, and a static import here would leak the mock into other specs.

```ts
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
```

- [ ] **Step 2: Verify red**

Run: `npm test -- tests/unit/quiz-chrome.test.ts`

Expected: FAIL on all five QuizFlow tests — `Begin` still carries `bg-stone-600`, `Next` is outlined, `Skip this question` has no `focus-ring`, and `[data-quiz-shell]` does not exist.

- [ ] **Step 3: Move the gutters onto the page**

In `src/app/quiz/page.tsx`, line 15:

```tsx
    <main className="min-h-screen px-[18px] min-[560px]:px-7">
```

- [ ] **Step 4: Add the shell constant and the Button import to QuizFlow**

In `src/components/quiz/QuizFlow.tsx`, add to the imports after line 16:

```tsx
import { Button } from "@/components/Button";
```

And add above `function UnrecoverableState` (line 77):

```tsx
/** Mock 6b's body column: 672px wide, 36px above, 52px below. Gutters are the
 *  page's — `src/app/quiz/page.tsx` sets them to the nav's 18/28px so the
 *  column lines up with the wordmark. Extracted so a metric change lands in one
 *  place rather than drifting across the question screens. */
const QUESTION_SHELL = "mx-auto max-w-2xl pt-9 pb-[52px]";
```

Only the three question screens share metrics, so only they get a constant. The
interstitials keep their own inline widths — they are narrower and vertically
centred rather than columnar, and the handoff does not draw them.

- [ ] **Step 5: Restyle `UnrecoverableState`**

Replace lines 77–97:

```tsx
function UnrecoverableState({ onReset }: { onReset: () => void }) {
  return (
    <div className="mx-auto max-w-[640px] py-12 text-center">
      <GovernanceCompassMark size={36} className="mx-auto mb-4" />
      <h1 className="display-entry text-text-primary mb-2">We lost your place</h1>
      <p className="text-[13.5px] leading-[1.6] text-text-secondary mb-8">
        Your saved progress doesn&apos;t match the current assessment, so we can&apos;t pick
        it back up. Starting over takes about 16 minutes.
      </p>
      <Button variant="secondary" onClick={onReset}>
        Start over
      </Button>
    </div>
  );
}
```

- [ ] **Step 6: Restyle the resume screen**

Replace the returned JSX inside `if (hasProgress && ...)` (lines 223–249):

```tsx
    return (
      <div className="mx-auto max-w-[640px] py-12 text-center">
        <GovernanceCompassMark size={36} className="mx-auto mb-4" />
        <h1 className="display-entry text-text-primary mb-2">Welcome back</h1>
        <p className="text-[13.5px] leading-[1.6] text-text-secondary mb-8">
          You have an assessment in progress — {answeredCount} responses recorded, currently in the {phaseLabel} phase.
        </p>
        <div className="flex flex-col items-center gap-3 max-w-xs mx-auto">
          <Button className="w-full" onClick={() => setResumeAcknowledged(true)}>
            Continue where I left off
          </Button>
          <button
            type="button"
            onClick={() => { dispatch({ type: "RESET" }); setResumeAcknowledged(true); }}
            className="label-nav text-text-label hover:text-text-primary transition-colors duration-150 focus-ring"
          >
            Start over
          </button>
        </div>
      </div>
    );
```

- [ ] **Step 7: Restyle the intro interstitial**

Replace lines 255–287:

```tsx
  if (state.phase === "intro") {
    return (
      <div className="mx-auto max-w-lg py-12">
        <div className="rounded-sharp border border-border-secondary bg-surface-1 p-8 text-center">
          <GovernanceCompassMark size={32} className="mx-auto mb-4" animate />

          <p className="label text-text-label mb-2">Phase 1 of 3</p>
          <h1 className="display-s text-text-primary mb-2">Governance dilemmas</h1>
          <p className="text-[13.5px] leading-[1.6] text-text-secondary mb-4">
            This first section presents pairs of statements about how a society
            should be governed. For each pair, choose the statement that comes
            closer to your view — even if neither is a perfect match. There are
            no right answers, and you can&apos;t choose both.
          </p>
          <p className="caption-italic mb-8">
            36 questions &middot; ~8 minutes &middot; Your progress is saved automatically
          </p>

          <Button className="w-full" onClick={() => dispatch({ type: "START_QUIZ" })}>
            Begin
          </Button>
        </div>
      </div>
    );
  }
```

- [ ] **Step 8: Restyle the phase-1 question screen**

Replace lines 296–363 (the `state.phase === "phase1"` return):

```tsx
    return (
      <div data-quiz-shell className={QUESTION_SHELL}>
        <ProgressBar
          currentPhase={1}
          currentIndex={state.currentQuestionIndex}
          totalInPhase={shuffledFC.length}
        />

        <div aria-live="polite" className="sr-only">
          Question {state.currentQuestionIndex + 1} of {shuffledFC.length}
        </div>

        {isFirst && !glossaryHintSeen && (
          <p className="text-[12.5px] leading-[1.6] text-text-secondary text-center mb-5">
            See a{" "}
            <span
              className="text-text-primary"
              style={{
                textDecoration: "underline",
                textDecorationStyle: "dotted",
                textDecorationColor: "#C4A84A",
                textUnderlineOffset: "3px",
              }}
            >
              highlighted term
            </span>
            ? Tap it for a plain-language definition.
          </p>
        )}

        <ForcedChoiceCard
          key={item.id}
          itemId={item.id}
          headlineA={item.headlineA}
          bodyA={item.bodyA}
          headlineB={item.headlineB}
          bodyB={item.bodyB}
          questionType={item.questionType as "FC" | "PT"}
          selectedPole={state.forcedChoiceResponses[item.id]}
          onSelect={(pole) => handleFCSelect(item.id, pole)}
          randomizeOrder
        />

        <div className="mt-8 flex items-center justify-between gap-4">
          <Button variant="secondary" onClick={handlePrev} disabled={isFirst}>
            Previous
          </Button>
          <Button onClick={handleNext} disabled={!hasResponse}>
            {state.currentQuestionIndex === shuffledFC.length - 1
              ? "Continue"
              : "Next"}
          </Button>
        </div>
        {!hasResponse && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={handleNext}
              className="label-nav text-text-label hover:text-text-primary transition-colors duration-150 focus-ring"
            >
              Skip this question
            </button>
          </div>
        )}
      </div>
    );
```

The `#C4A84A` dotted underline is not a new colour — `GlossaryTerm.tsx:81` already uses it, and the mock repeats it. The `3px` offset and the Stone 900 term colour are new, and both come straight from the mock.

- [ ] **Step 9: Restyle the phase-2 question screen**

Replace lines 387–448 (the `state.phase === "phase2"` return):

```tsx
    return (
      <div data-quiz-shell className={QUESTION_SHELL}>
        <ProgressBar
          currentPhase={2}
          currentIndex={state.currentQuestionIndex}
          totalInPhase={shuffledSC.length}
        />

        <div aria-live="polite" className="sr-only">
          Question {state.currentQuestionIndex + 1} of {shuffledSC.length}
        </div>

        <ScaledQuestionCard
          key={item.id}
          questionStem={item.questionStem}
          option1Label={item.option1Label}
          option1Detail={item.option1Detail}
          option2Label={item.option2Label}
          option2Detail={item.option2Detail}
          option3Label={item.option3Label}
          option3Detail={item.option3Detail}
          option4Label={item.option4Label}
          option4Detail={item.option4Detail}
          option5Label={item.option5Label}
          option5Detail={item.option5Detail}
          selectedValue={state.scaledResponses[item.id]}
          onSelect={(value) => handleSCSelect(item.id, value)}
        />

        <div className="mt-8 flex items-center justify-between gap-4">
          <Button variant="secondary" onClick={handlePrev} disabled={isFirst}>
            Previous
          </Button>
          <Button onClick={handleNext} disabled={!hasResponse}>
            {state.currentQuestionIndex === shuffledSC.length - 1
              ? "Continue"
              : "Next"}
          </Button>
        </div>
        {!hasResponse && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={handleNext}
              className="label-nav text-text-label hover:text-text-primary transition-colors duration-150 focus-ring"
            >
              Skip this question
            </button>
          </div>
        )}
      </div>
    );
```

The only differences from phase 1 are the phase number, the `shuffledSC` bound,
and the card. Note that there is no glossary hint here — it is a phase-1-only
affordance, gated on `isFirst && !glossaryHintSeen`, and that stays true.

- [ ] **Step 10: Restyle the phase-3 screen and the finalize alert**

Replace lines 466–488:

```tsx
  if (state.phase === "phase3") {
    return (
      <div data-quiz-shell className={QUESTION_SHELL}>
        <ProgressBar currentPhase={3} currentIndex={0} totalInPhase={1} />

        {finalizeError && (
          <p
            role="alert"
            className="mb-4 border-l-2 border-warning bg-warning-bg px-4 py-3 text-[13.5px] leading-[1.6] text-warning-text"
          >
            Something went wrong finalizing your budget. Your answers are still here — please try again.
          </p>
        )}

        <BudgetSimulator
          ministries={ministries}
          allocations={state.budgetAllocations}
          onAllocate={handleBudgetAllocate}
          onFinalize={handleBudgetFinalize}
        />
      </div>
    );
  }
```

Delta 04 gives callouts a 2px left edge in place of a filled rounded panel; the warning family is the advisory accent this is reserved for.

- [ ] **Step 11: Restyle the computing screen**

In the `state.phase === "computing" || state.phase === "done"` block, change the heading (line 505):

```tsx
        <h2 className="display-s text-text-primary mb-2">Computing your results</h2>
```

Leave the animated Stone 600 line alone — that is the fill's other legitimate
job, alongside the progress bar.

Then, in `src/components/quiz/ComputingMessages.tsx`, take the rotating sentence
off the failing tertiary tone (line 25):

```tsx
      className="text-[13.5px] leading-[1.6] text-text-secondary transition-opacity duration-200"
```

This is the file's only change; its interval and `key={index}` remount are
untouched.

- [ ] **Step 12: Verify green**

Run: `npm test -- tests/unit/quiz-chrome.test.ts && npm run typecheck && npm run lint`

Expected: PASS on all three.

- [ ] **Step 13: Commit**

```bash
git add src/app/quiz/page.tsx src/components/quiz/QuizFlow.tsx src/components/quiz/ComputingMessages.tsx tests/unit/quiz-chrome.test.ts
git commit -m "feat(design): restyle the quiz shell, navigation, and interstitials"
```

---

### Task 5: PhaseTransition

**Files:**
- Modify: `src/components/quiz/PhaseTransition.tsx`
- Test: `tests/unit/quiz-chrome.test.ts` (extend)

**Interfaces:**
- Props unchanged. `QuizFlow` renders it at `transition1` and `transition2` with the same arguments.

**Not drawn in the handoff** — extended from 6b's rules: mono labels, `display-s` heading, 13.5px prose, `caption-italic` meta, and `Button` for the forward action. Continue becomes the ink primary rather than the Stone 600 outline, because it is the same forward action as `Next` (spec D1).

**One real bug goes with it.** The `Up next` label is `text-stone-800`, a fixed ramp value. The Stone ramp does not invert, so on the dark ground (`--surface-1` = `#2a2118`) Stone 800 (`#5a4636`) is near-invisible — 1.4:1. It becomes `text-text-label`, like every other label in this phase.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/quiz-chrome.test.ts`, and extend the imports with:

```ts
import { PhaseTransition } from "@/components/quiz/PhaseTransition";
```

```ts
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
      // The Stone ramp does not invert: text-stone-800 measures 1.4:1 on the
      // dark panel ground, which is where "Up next" used to sit.
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
```

- [ ] **Step 2: Verify red**

Run: `npm test -- tests/unit/quiz-chrome.test.ts`

Expected: FAIL on all three — labels carry `text-[11px] uppercase tracking-[0.08em]` rather than `label`, and the button is the Stone 600 outline.

- [ ] **Step 3: Restyle the component**

Replace the returned JSX of `src/components/quiz/PhaseTransition.tsx` (lines 21–61):

```tsx
  return (
    <div className="mx-auto max-w-lg py-12">
      <div className="rounded-sharp border border-border-secondary bg-surface-1 p-8 text-center">
        {/* Contour mark as chapter break */}
        <GovernanceCompassMark size={32} className="mx-auto mb-4" animate />

        {/* Completion message */}
        <p className="label text-text-label mb-2">Phase {completedPhase} complete</p>
        <p className="text-[13.5px] leading-[1.6] text-text-secondary mb-6">
          Your {completedCount} responses have been recorded.
        </p>

        {/* Divider */}
        <div className="border-t border-border-secondary mb-6" />

        {/* Next phase info. `text-stone-800` used to sit here — a fixed ramp
            value on an inverting surface, so it went near-invisible in dark. */}
        <p className="label text-text-label mb-2">Up next</p>
        <h3 className="display-s text-text-primary mb-2">{nextPhaseTitle}</h3>
        <p className="text-[13.5px] leading-[1.6] text-text-secondary mb-4">
          {nextPhaseDescription}
        </p>
        <p className="caption-italic mb-8">Estimated time: {estimatedTime}</p>

        {/* The same forward action as Next, so the same ink fill (spec D1). */}
        <Button className="w-full" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
```

And add the import at the top, after line 3:

```tsx
import { Button } from "@/components/Button";
```

- [ ] **Step 4: Verify green**

Run: `npm test -- tests/unit/quiz-chrome.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/quiz/PhaseTransition.tsx tests/unit/quiz-chrome.test.ts
git commit -m "feat(design): restyle the phase transition panel"
```

---

### Task 6: ScaledQuestionCard

**Files:**
- Modify: `src/components/quiz/ScaledQuestionCard.tsx`
- Test: `tests/unit/quiz-chrome.test.ts` (extend)

**Interfaces:**
- Props unchanged. The keyboard 1–5 effect, `role="group"` wrappers, and `aria-pressed` buttons are load-bearing: `tests/e2e/quiz-flow.spec.ts:26` selects `button[aria-pressed]`, and `tests/unit/quiz-interactions.test.ts:71` pins that a modified number key is not a shortcut.

**Not drawn in the handoff.** Extended from 6b with two decisions worth stating:

- **The question stem is content, not an instruction.** 6b's mono prompt is an instruction sitting *above* the content; here the stem *is* the content, filling the role 6b's option headlines fill. So it takes `display-s`, the same serif card role, rather than the mono label layer.
- **Selection reads as ink.** The desktop segmented bar has no per-item borders to carry state, so the chosen segment takes the ink fill (`bg-button-primary`), matching the two-tier button system and inverting correctly in dark. The mobile list *does* have borders, so it mirrors the choice card exactly — `border-rule-strong` when chosen, `border-border-secondary` + `opacity-60` for the others.

The detail panel drops its `bg-surface-2` fill for a `border-t` rule. Delta 04 caps a page at two surface switches, and the quiz already spends both (`--surface-3` ground, `--surface-1` cards).

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/quiz-chrome.test.ts`, extending the imports with:

```ts
import { ScaledQuestionCard } from "@/components/quiz/ScaledQuestionCard";
```

```ts
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

  it("separates the detail text with a rule rather than a third surface", () => {
    const container = renderScale(4);
    const detail = container.querySelector("[data-scale-detail]")!;

    expect(detail.textContent).toContain("Detail four.");
    expect(classes(detail)).toContain("border-t");
    // The quiz already spends its two surface switches on the ground and the
    // cards; delta 04 caps it there.
    expect(classes(detail)).not.toContain("bg-surface-2");
  });
});
```

- [ ] **Step 2: Verify red**

Run: `npm test -- tests/unit/quiz-chrome.test.ts`

Expected: FAIL on all five — the stem is `text-[16px] font-medium`, the selected segment is `bg-stone-200`, and `[data-scale-segments]` / `[data-scale-list]` / `[data-scale-detail]` do not exist.

- [ ] **Step 3: Restyle the option classes**

In `src/components/quiz/ScaledQuestionCard.tsx`, replace `buttonClasses` and `mobileButtonClasses` (lines 62–95):

```tsx
  function buttonClasses(value: 1 | 2 | 3 | 4 | 5): string {
    const isSelected = selectedValue === value;
    const hasSelection = selectedValue !== undefined;

    const base =
      "flex flex-1 items-center justify-center px-3 py-3 text-center text-[13px] font-medium transition-colors duration-150 cursor-pointer focus-ring focus-visible:z-10";

    // The segmented bar has no per-item border to carry state, so the chosen
    // segment takes the ink fill — the same token pair as the primary button,
    // which means it inverts correctly on the dark ground.
    if (isSelected) {
      return `${base} bg-button-primary text-button-primary-fg`;
    }
    if (hasSelection) {
      return `${base} bg-surface-1 text-text-label hover:bg-surface-2`;
    }
    return `${base} bg-surface-1 text-text-secondary hover:bg-surface-2 hover:text-text-primary`;
  }

  function mobileButtonClasses(value: 1 | 2 | 3 | 4 | 5): string {
    const isSelected = selectedValue === value;
    const hasSelection = selectedValue !== undefined;

    // The mobile rows do have borders, so they mirror the choice card exactly.
    const base =
      "flex w-full items-center rounded-sharp border px-4 py-3 text-[13px] font-medium transition-colors duration-150 cursor-pointer focus-ring";

    if (isSelected) {
      return `${base} border-rule-strong bg-surface-1 text-text-primary`;
    }
    if (hasSelection) {
      return `${base} border-border-secondary bg-surface-1 text-text-secondary opacity-60 hover:opacity-100 hover:border-stone-600`;
    }
    return `${base} border-border-secondary bg-surface-1 text-text-secondary hover:border-stone-600`;
  }
```

- [ ] **Step 4: Restyle the markup**

Replace the returned JSX (lines 97–150):

```tsx
  return (
    <div className="rounded-sharp border border-border-secondary bg-surface-1 p-6">
      <p className="display-s text-text-primary">
        <AnnotatedText text={questionStem} />
      </p>

      {/* Desktop: horizontal segmented bar */}
      <div
        data-scale-segments
        className="mt-4 hidden min-[560px]:flex overflow-hidden rounded-sharp border border-border-secondary divide-x divide-border-secondary"
        role="group"
        aria-label="Response options"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={selectedValue === option.value}
            onClick={() => onSelect(option.value)}
            className={buttonClasses(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Mobile: vertical list */}
      <div
        data-scale-list
        className="mt-4 flex min-[560px]:hidden flex-col gap-2"
        role="group"
        aria-label="Response options"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={selectedValue === option.value}
            onClick={() => onSelect(option.value)}
            className={mobileButtonClasses(option.value)}
          >
            <span className="text-left">{option.label}</span>
          </button>
        ))}
      </div>

      {/* Detail text / hint */}
      <div aria-live="polite" className="mt-4">
        {selectedDetail ? (
          <div data-scale-detail className="border-t border-border-secondary pt-3">
            <p className="text-[13.5px] leading-[1.6] text-text-secondary">
              {selectedDetail}
            </p>
          </div>
        ) : (
          <p className="label text-text-label text-center">
            Select to see full description
          </p>
        )}
      </div>
    </div>
  );
```

- [ ] **Step 5: Verify green, including the keyboard shortcut**

Run: `npm test -- tests/unit/quiz-chrome.test.ts tests/unit/quiz-interactions.test.ts`

Expected: PASS. `quiz-interactions.test.ts` must pass unmodified.

- [ ] **Step 6: Commit**

```bash
git add src/components/quiz/ScaledQuestionCard.tsx tests/unit/quiz-chrome.test.ts
git commit -m "feat(design): restyle the scaled question card"
```

---

### Task 7: BudgetSimulator

**Files:**
- Modify: `src/components/quiz/BudgetSimulator.tsx`
- Test: `tests/unit/quiz-chrome.test.ts` (extend)

**Interfaces:**
- Props unchanged. `useStepper`, the `aria-disabled` bound handling, `aria-label={\`Increase ${ministry.name} allocation\`}`, and the `hasInteracted` latch are load-bearing — `tests/unit/budget-simulator-stepper.test.ts` has eleven tests on them and `tests/e2e/quiz-flow.spec.ts:76` selects `/^Increase /`. Do not touch the logic; this task is classes only.

**Three fixes ride along with the restyle:**

1. **The sticky footer's gutter bleed.** `-mx-4 px-4` assumed `main`'s `px-4`, which Task 4 changed to `px-[18px]`. It becomes `-mx-[18px] px-[18px]`.
2. **The `sm:` breakpoint.** `sm:` is 640px; the codebase's single breakpoint is `min-[560px]`, which is where the rest of the quiz switches. Convert all six `sm:` classes.
3. **The two `rounded-[3px]` track literals.** Delta 05 draws data tracks square. Retiring these does not close #139 — twelve more `rounded-[3px]` sites live outside the quiz.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/quiz-chrome.test.ts`, extending the imports with:

```ts
import { BudgetSimulator } from "@/components/quiz/BudgetSimulator";
import { ministries } from "@/data/ministries";
```

```ts
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
    expect(classes(counter.querySelector("[data-budget-counter-label]")!)).toContain("label");
  });

  it("bleeds the sticky confirm bar to the page's own gutter", () => {
    const container = renderBudget(fresh);
    const bar = container.querySelector("[data-budget-confirm]")!;

    // main is px-[18px] below the breakpoint (Task 4); -mx-4 would leave a 2px
    // strip of ground either side of the bar.
    expect(classes(bar)).toContain("-mx-[18px]");
    expect(classes(bar)).toContain("px-[18px]");
    // The codebase's single breakpoint is 560px, not Tailwind's sm (640px).
    expect(classes(bar)).toContain("min-[560px]:static");
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
    expect(classes(description)).toContain("text-text-secondary");
    expect(classes(description)).not.toContain("text-text-tertiary");
  });

  it("sets the consequence line in the caption role once the user has moved something", () => {
    const container = renderBudget({ ...fresh, 1: 12 });
    const consequence = container.querySelector("[data-ministry-consequence]")!;

    expect(classes(consequence)).toContain("caption-italic");
  });
});
```

- [ ] **Step 2: Verify red**

Run: `npm test -- tests/unit/quiz-chrome.test.ts`

Expected: FAIL on all six — none of the `data-budget-*` / `data-ministry-*` hooks exist.

- [ ] **Step 3: Restyle the top-level layout**

In `src/components/quiz/BudgetSimulator.tsx`, replace lines 149–198 (the returned JSX of `BudgetSimulator`):

```tsx
  return (
    <div className="flex flex-col gap-6">
      {/* Instruction text — 6b puts the question-screen instruction in the mono
          label layer, and this is the phase-3 equivalent of that line. */}
      <p className="label text-text-label text-center">
        You have {TOTAL_BUDGET} points to fund {ministries.length} ministries — there is not enough to fund everything well
      </p>

      {/* Sticky points-remaining counter. Delta 04: a card's own header sits
          over a 1px ink rule rather than inside a filled panel, and the quiz
          has already spent its two surface switches on ground and cards. */}
      <div
        data-budget-counter
        className="sticky top-0 z-10 flex items-center justify-between border-b border-rule-strong bg-surface-3 py-3"
      >
        <span data-budget-counter-label className="label text-text-label">
          Points remaining
        </span>
        <span className="text-[16px] font-mono font-medium text-text-primary tabular-nums">
          {remaining}
          {canFinalize && (
            <span
              className="ml-2 label text-text-label"
              style={{ animation: "fade-in-up 200ms ease-out both" }}
            >
              All allocated
            </span>
          )}
        </span>
      </div>

      {/* Ministry list */}
      <div className="flex flex-col gap-5">
        {ministries.map((ministry) => (
          <MinistrySlider
            key={ministry.id}
            ministry={ministry}
            value={allocations[ministry.id] ?? MIN_ALLOCATION}
            remaining={remaining}
            hasInteracted={hasInteracted}
            onAllocate={handleAllocate}
          />
        ))}
      </div>

      {/* Confirm button — a primary assessment action. The bleed matches the
          page's own gutter (src/app/quiz/page.tsx), not Tailwind's px-4. */}
      <div
        data-budget-confirm
        className="sticky bottom-0 z-10 -mx-[18px] border-t border-border-secondary bg-surface-1 px-[18px] py-4 min-[560px]:static min-[560px]:mx-0 min-[560px]:border-0 min-[560px]:bg-transparent min-[560px]:px-0 min-[560px]:py-0"
      >
        <Button className="w-full" onClick={onFinalize} disabled={!canFinalize}>
          Confirm budget
        </Button>
      </div>
    </div>
  );
```

And add the import after line 8:

```tsx
import { Button } from "@/components/Button";
```

`Button`'s base already carries `disabled:opacity-50 disabled:cursor-not-allowed`, which is the delta's disabled state; the hand-rolled `disabled:bg-stone-400 disabled:text-stone-200` goes away with it.

- [ ] **Step 4: Restyle the ministry slider**

Replace lines 254–329 (the returned JSX of `MinistrySlider`):

```tsx
  return (
    <div className="bg-surface-1 rounded-sharp border border-border-secondary p-4">
      <div className="mb-1">
        <p
          data-ministry-name
          className="flex items-center gap-1.5 label text-text-primary"
        >
          {(() => { const Icon = MINISTRY_ICONS[ministry.id]; return Icon ? <Icon size={13} strokeWidth={1.5} className="shrink-0" /> : null; })()}
          {ministry.name}
        </p>
        <p
          data-ministry-description
          className="text-[12.5px] leading-[1.5] text-text-secondary mt-1"
        >
          {ministry.description}
        </p>
      </div>

      {/* Stepper + value */}
      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          aria-label={`Decrease ${ministry.name} allocation`}
          onClick={dec.click}
          onPointerDown={dec.start}
          onPointerUp={dec.stop}
          onPointerLeave={dec.stop}
          onPointerCancel={dec.stop}
          aria-disabled={atMin}
          className={stepperClass(atMin)}
        >
          <span className="text-lg leading-none">&minus;</span>
        </button>

        <div className="flex-1 relative">
          {/* Track — square, per delta 05's data marks. */}
          <div
            data-budget-track
            className="w-full h-[6px] overflow-hidden"
            style={{ backgroundColor: 'var(--border-secondary)' }}
          >
            <div
              className="h-full transition-all duration-100"
              style={{
                width: `${Math.min(100, ((value - MIN_ALLOCATION) / (MAX_ALLOCATION - MIN_ALLOCATION)) * 100)}%`,
                backgroundColor: 'var(--stone-600)',
                opacity: 0.5,
              }}
            />
          </div>
        </div>

        <span className="w-7 text-center text-[14px] font-mono font-medium tabular-nums text-text-primary">
          {value}
        </span>

        <button
          type="button"
          aria-label={`Increase ${ministry.name} allocation`}
          onClick={inc.click}
          onPointerDown={inc.start}
          onPointerUp={inc.stop}
          onPointerLeave={inc.stop}
          onPointerCancel={inc.stop}
          aria-disabled={atMax}
          className={stepperClass(atMax)}
        >
          <span className="text-lg leading-none">+</span>
        </button>
      </div>

      {/* Consequence text — the serif italic caption role */}
      {hasInteracted && (
        <p
          key={consequenceText}
          data-ministry-consequence
          className="caption-italic mt-2"
          style={{ animation: "fade-in-up 200ms ease-out both" }}
        >
          <AnnotatedText text={consequenceText} />
        </p>
      )}
    </div>
  );
```

- [ ] **Step 5: Verify green, including the stepper behaviour**

Run: `npm test -- tests/unit/quiz-chrome.test.ts tests/unit/budget-simulator-stepper.test.ts`

Expected: PASS. `budget-simulator-stepper.test.ts` must pass unmodified — its "scales the track fill against the real maximum" test reads the fill's inline width, which this task leaves alone.

- [ ] **Step 6: Commit**

```bash
git add src/components/quiz/BudgetSimulator.tsx tests/unit/quiz-chrome.test.ts
git commit -m "feat(design): restyle the budget simulator, and fix its gutter bleed"
```

---

### Task 8: Guardrails, gates, and the visual sweep

**Files:**
- Modify: `tests/unit/quiz-chrome.test.ts` (append the guardrail `describe`)

**Interfaces:**
- Produces: the drift guards that keep this phase's sweep from unravelling.
- Consumed by: CI.

- [ ] **Step 1: Write the failing guardrails**

Append to `tests/unit/quiz-chrome.test.ts`, extending the imports with:

```ts
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
```

```ts
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
```

- [ ] **Step 2: Verify red, then green**

Run: `npm test -- tests/unit/quiz-chrome.test.ts`

If all five pass on the first run, that is expected — Tasks 1–7 already did the sweep. To prove the guards are not vacuous, temporarily reintroduce `text-text-tertiary` in `ScaledQuestionCard.tsx` and re-run: expect FAIL naming that file. Restore, re-run, expect PASS. Repeat by adding `bg-stone-600` to a `className` in `PhaseTransition.tsx`: expect the counts test to FAIL reporting a third entry.

A guardrail that has never been seen to fail is a comment, not a test.

- [ ] **Step 3: Run every gate**

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: 632 + the new quiz-chrome tests passing, zero type errors, zero warnings, a clean build.

If `npm run lint` reports an unused import in `quiz-chrome.test.ts`, remove it rather than raising the ceiling.

- [ ] **Step 4: Run the e2e suite**

```bash
docker compose up -d --wait postgres
npm run test:e2e
```

Expected: all specs green, `tests/e2e/quiz-flow.spec.ts` **unmodified**. It walks all 60 questions and the budget, clicking `[data-choice-card]`, `button[aria-pressed]`, `Next` / `Continue` / `Confirm budget` by accessible name, and `/^Increase /`. Every one of those hooks survives this phase by design.

The `control` role sets `text-transform: uppercase`, but Playwright's accessible-name computation does not apply it — Phase 2 shipped `Begin the assessment` on the same role and `quiz-flow.spec.ts:46` matches it in CI today. If a name assertion fails anyway, that is the thing to investigate, not to work around.

If Playwright reds in under a minute with no test output, check for the Google apt repository hash mismatch on browser install — that is an infrastructure flake, not this diff. Rerun. If a wall of unrelated specs fails locally, check for another dev server on port 3000 first.

- [ ] **Step 5: Sweep the real pages**

```bash
npm run build && npx next start -p 3100
```

`next dev` reload-loops under a driven browser and resets React state mid-check, so this must be the production build.

At `http://localhost:3100/quiz`, in **both** colour schemes and at **390, 560, 700, 900, and 1280px**, walk: intro → a dilemma (unanswered and answered) → a scale (unanswered and answered) → the phase transition → the budget. Confirm:

- The question column lines up with the nav wordmark at every width.
- The dilemma grid is one column at 390px and two from 560px up; nothing scrolls horizontally at any of the five widths. The 560–700px band is where the home page's CTA row broke in Phase 2 — sample it, do not interpolate.
- `Next` is ink-filled and legible in dark mode (Stone 300 fill, Stone 900 text); `Previous` is outlined.
- The selected dilemma shows the `Selected` marker and an ink border that is visible on the dark ground.
- `Up next` on the transition screen is legible in dark mode.
- The budget's sticky confirm bar reaches both gutter edges at 390px and goes static at 560px.
- The budget instruction line does not run past three lines at 390px.

Stop the server when done.

- [ ] **Step 6: Commit and open the PR**

```bash
git add tests/unit/quiz-chrome.test.ts
git commit -m "test(design): guard the quiz chrome sweep against drift"
git push -u origin feat/design-delta-quiz
gh pr create --title "feat(design): design system delta — phase 3 quiz chrome" --body "$(cat <<'BODY'
Phase 3 of the visual redesign delta. Closes #134.

Restyles every quiz surface onto the Phase 1 token layer, following mock **6b**
(`Home proposals.dc.html`) for phase 1 and extending its rules to the scales,
the budget, and the phase transitions, which the handoff does not draw.

## Restyle

- `ProgressBar` — `label-nav` row over three `--border-secondary` segments; drops `brightness-125`
- `ForcedChoiceCard` — mono prompt, 1px card borders, `display-s` headlines, ink `Selected` marker
- `QuizFlow` — 672px column at the nav's gutters, `Button`-driven `Previous`/`Next`, restyled interstitials
- `PhaseTransition`, `ScaledQuestionCard`, `BudgetSimulator` — same rules, by extension

## Fixes found on the way

- **The choice card's focus ring never painted.** `focus-within:outline-none` is emitted after `focus-within:outline-2` and sets `outline-style: none`; both match at once, so the later rule won. Replaced with a `focus-ring-child` utility on the `outline` shorthand, scoped to the card's own control so the ring does not follow focus onto an inline glossary term, and the Phase 1 guardrail now covers the `focus-within` spelling.
- **`Up next` was `text-stone-800`** — a fixed ramp value on an inverting surface, 1.4:1 on the dark panel.
- **The budget's sticky bar bled to `-mx-4`**, which stopped matching once the page gutters moved to 18px.

## Decisions

- **D1, ink-filled `Next`.** Follows the mock over `CLAUDE.md`'s filled-button rule; #137 rewrites that rule.
- **The scale stem is `display-s`, not a mono label.** 6b's mono prompt is an instruction above the content; a scale's stem *is* the content.
- **Selection reads as ink.** The segmented bar has no border to carry state, so it takes the ink fill; the mobile list mirrors the choice card's borders.

## Unchanged

Seeded shuffle, autosave/resume, skip, keyboard 1–5, `AnnotatedText`/`GlossaryTerm`, the reducer, and every disabled state. `tests/unit/quiz-interactions.test.ts`, `tests/unit/budget-simulator-stepper.test.ts`, and `tests/e2e/quiz-flow.spec.ts` all pass unmodified.

Roadmap — phase 3 of 6: #132 → #133 → **#134** → #135 → #136 → #137
BODY
)"
```

---

## Notes for phase 4

Two things this phase touched that the results page will want:

- **`focus-ring-child`** is now available for any card that draws a ring on a wrapper. `AxisBreakdownCard`'s disclosure rows are the likely next consumer. Note its scope: a direct `button` child, deliberately, so a focusable descendant deeper in the prose does not claim the parent's ring. **A second consumer inherits that requirement with no guardrail of its own** — the utility test pins the selector, not any caller's DOM. Every consumer needs its own `:scope > button` assertion, the way Task 3's card test does.
- **The ink-fill selection pattern** (`bg-button-primary` / `text-button-primary-fg` on a chosen segment) is the inverting way to mark a selected control. `ResultsView`'s jump nav and the compare input's controls will need the same treatment.

`QuizProvider.tsx` was left alone deliberately — it holds the reducer and the
storage lifecycle and renders no markup of its own.

## Follow-up found in this phase, out of its scope

`src/app/account/page.tsx:236` hand-rolls a focus ring —
`focus-visible:outline-2 focus-visible:outline-stone-600
focus-visible:outline-offset-2`. It *paints*, so it is not the broken spelling
the guardrail bans, but it hardcodes Stone 600 instead of reading
`var(--focus-ring)` and bypasses the utility entirely. The account pages are
phase 5's territory (#136), not this phase's; the fix is to swap those three
classes for `focus-ring`. Until then, the guardrail's honest claim is that it
bans the broken spellings, not that every ring routes through a utility — which
is why Task 1 retitles it.
