# Design System Delta — Archetype Reference and Remaining Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land mock 7c — the archetype reference, the densest prose page in the product — and extend the delta's system by inference across every remaining undrawn page except `/study`, retiring the sub-AA tertiary text token, the non-inverting Stone-ramp buttons, and the two off-palette hues from all of them.

**Architecture:** Two halves that share one idiom. The first half rebuilds `/archetypes` against mock 7c, whose one structural demand is that the entry rows go **full-bleed** — so the page splits from a single `<article>` into three siblings: a 660px header block, a full-width zebra band with its own 660px inner column, and a 660px footer block. The second half sweeps nine pages onto the primitives phases 1–4 already shipped (`Button`, the typography roles, `PairedAxisScale`, `radar-geometry`), extracting the two blocks that the reference-family pages repeat verbatim — a page header and a footer CTA — into shared components rather than fixing the same markup four times. Two pre-existing hues die on the way: `text-red-600` at six sites and a `#b5942e` literal on `/questions`, neither of which the palette permits.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4.3.3, Vitest 4 (jsdom via docblock, `vmForks` pool), Playwright.

**Spec:** `docs/superpowers/specs/2026-09-08-design-system-delta-design.md`
**Issue:** #136 · **Reference:** `docs/gov_compass_redesign.zip` → `Page mocks.dc.html`, option **7c**

---

## Global Constraints

Phases 1 (#132, PR #140), 2 (#133, PR #143), 3 (#134, PR #145) and 4 (#135, PR #150) landed the token layer, the `Button` primitive, `PairedAxisScale`, `radar-geometry`, and the page idiom. Use them rather than re-spelling values. Everything in phase 4's Global Constraints block still applies; these are the ones this phase adds or leans on hardest.

- **`text-text-tertiary` is retired from every file this phase touches.** `--text-tertiary` is `#9d8b78` in **both** modes and measures 3.28:1 on `--surface-1` — under AA's 4.5:1 for every size it is used at here. There are two replacements and choosing between them is not a matter of taste:
  - **The mono label layer** (uppercase 11px eyebrows, section labels, nav links, disclosure summaries, numeric readouts) → `text-text-label`.
  - **Prose, links, captions, counts, and anything sentence-case** → `text-text-secondary`.

  Never use `text-text-label` to express *de-emphasis* against `text-text-secondary`: the two resolve to the same `#6e5a48` in light mode, so the distinction renders as nothing and no light-mode check can catch a wrong pick. Task 13 guards the ban directory-wide.
- **No third hue.** The palette is Stone plus the `--warning` family, and the spec says so in as many words. `text-red-600` (6 sites) and `#b5942e` / `rgba(181, 148, 46, 0.08)` (`/questions`) are both outside it. They converge onto `--warning-text` / `--warning`; see D16 and D22. Do **not** add a `--danger` token — that is a new colour value, which the delta bans outright.
- **A fixed hex cannot invert.** `getDomainColor600()` returns the same hex in both modes. Every *mark* — a dot, a rule, a border, a domain label — routes through `getDomainMarkVar()`. `DOMAIN_COLORS[key].name` and `DOMAIN_COLORS[key][400]` are unaffected.
- **`bg-stone-600 text-white` is not a button.** It is the pre-delta CTA, it appears at four reference-family sites, and it does not invert: on a dark ground it stays a mid-brown fill under white text. Every control in this phase goes through `Button` / `ButtonLink`. Filled `primary` is reserved for assessment actions — "Begin the assessment" / "Take the assessment" qualify, per CLAUDE.md; "Save current results", "Sign in", "Delete account" do not and take `secondary`.
- **`className` does NOT override variant classes on `Button`/`ButtonLink`.** Appending does not win; Tailwind's emitted order does. `className` is only for properties no variant sets — margin, width, position. Never pass `px-*`, `text-*`, or `block`. `w-full` is verified conflict-free.
- **Typography roles are single self-contained classes.** Do not layer a built-in utility over one to vary a property the role already sets. Layering a property the role does **not** set is safe — `label` declares no `font-weight`, so `label font-medium` is fine; `caption-italic` declares `color`, so a colour class beside it is banned and guarded.
- **`rounded-sharp`** for corners. Bare `rounded` is deferred to #139 and is **not** in scope — except where this phase is already rewriting the line, in which case spell it `rounded-sharp` rather than leaving a literal behind.
- **`focus-ring`** for every interactive element. Never hand-roll `outline-none` + `outline-2`.
- The codebase's single responsive breakpoint is `min-[560px]`.
- Vitest collects only `tests/**/*.test.ts` and `scripts/__tests__/**/*.test.ts`, never `.tsx`. Component tests use `createElement` with a `@vitest-environment jsdom` docblock.
- **`vmForks` shares a module registry per worker.** Any spec that calls `vi.mock` must `vi.resetModules()` and dynamically `import()` the component under test.
- **Pin a value when, if it were wrong, nothing else would fail and the wrongness would be silent.** Pin: a fixed ramp value where an inverting token belongs, a structural coupling, and any value that *replaced* a different value. Skip: anything a repo-wide guardrail already covers, and anything whose wrongness is loud enough that opening the page catches it. Pair every positive assertion with the negative of the value it replaced — that negative carries the information.
- **Assert class tokens, never substrings.** `expect(el.className).toContain("label")` also passes on `label-nav`. Split on whitespace, or use `element.classList`, and assert with `toContain` on the resulting array.
- Lint runs at `--max-warnings=0`.

**Baseline:** `main` at `b514c9f`, **793 unit tests across 64 files**, all gates green.

**Branch:** `feat/design-delta-reference` off `main`.

---

## Decisions

Continuing phase 4's numbering (D8–D15 live in that plan).

**D16 — Error text joins the warning family.** Six sites spell their error state `text-red-600`. There is no error token and the spec permits no third hue, so adding `--danger` is out. They move to `text-warning-text`, whose declared role — "caution states" — covers them. This is a real semantic compression: an error is not an advisory. It is acceptable because *the hue was never what carried the severity* — what an assistive-technology user acts on is `role="alert"` or an enclosing `aria-live` region, not the colour. A sighted user reading amber-on-cream still sees a marked, non-body-coloured string in the place an error goes. Recorded rather than quietly swapped, because "we turned the error message the same colour as the spoiler notice" is a sentence someone will want the reasoning for.

**D16, amended after implementation.** This decision originally asserted that *every one of the six sites already has* `role="alert"` *or sits inside an* `aria-live` *region*. That was checked against three of them and generalised to six, and it was false at the other three: `/groups/[groupId]`, `/auth/signin` and `/auth/signup` had neither. Swapping the hue at those sites would have removed the only cue a sighted user had and supplied nothing in its place — the argument for the swap was load-bearing on a premise that did not hold. `role="alert"` was added at all three as part of Task 10's and Task 11's colour swap, so the decision is now true of the code rather than merely asserted about it, and two tests pin the pairing going forward (`group-chrome`'s *marks the error state with role=alert since this site had no live region before* and `account-actions`' *pairs every warning-ink error message with an alert role or a live region*). The lesson generalises past this decision: a premise of the form "every site already does X" is a claim about six files, and writing it down is not the same as opening them.

**D17 — The four page widths all become tokens.** Phase 4 left this open. `--container-shell` (1040) and `--container-results` (820) exist; this phase adds `--container-reference` (660, mock 7c) and `--container-quiz` (672, the current `max-w-2xl`). Four widths, four tokens, no literals. The quiz swap is value-identical (`max-w-2xl` is 672px) so it is a rename, not a restyle, and it does not reopen phase 3.

**D18 — Full-bleed zebra forces the page to split.** Mock 7c runs each entry's background edge-to-edge with a 1px Stone 200 separator, while the prose inside stays on the 660px measure. The current page fakes this with `-mx-4` inside a capped `<article>`, which bleeds exactly 16px. There is no way to get true full-bleed from inside a centred column, so `/archetypes` becomes three siblings of `<main>`: a header block at 660px, an entries band at full width with its own 660px inner column per row, and a footer block at 660px. This is the only structural change in the first half of the phase.

**D19 — The archetype index flattens and the tier moves into the entry.** Today the index is three tier-grouped blocks with a heading each; mock 7c draws **one** two-column grid, with the tier carried per-row by its glyph, and prints the tier *name* as a mono line under each entry's heading instead. Adopt the mock. The information does not move out of the page — it moves to where a reader needs it, which is beside the entry they are reading rather than in a nav they have scrolled past. The glyphs keep their accessible names, so the tier stays reachable from the index for a screen-reader user too.

**D20 — The reference family shares a header and a footer.** `/references`, `/axes`, `/questions`, `/methodology` and `/archetypes` all open with a kicker (an eyebrow or a `← Reference` back-link) above a `display-page` h1, and four of them close with a byte-identical CTA block — including a byte-identical *bug*, the non-inverting `bg-stone-600` fill. Two small components, `PageHeader` and `ReferenceCta`, replace both. Extracting is the cheaper of the two options here precisely because the duplicated markup is already known to propagate defects.

**D21 — `/study` is deferred to its own phase.** Issue #136 lists it among the undrawn pages, but `/study/*` is 11,078 lines across 32 files against roughly 1,900 for every other undrawn page combined — six times the rest of the phase. It is a self-contained section with its own spec (`docs/system_proposal/synthetic_study_spec/`) and its own plan, and folding it in would make this phase larger than phases 2–4 together. Task 14 opens the follow-up issue rather than leaving the deferral implicit.

**D22 — The `/questions` spoiler notice converges on the archetype one.** `/questions` draws its own spoiler with an off-palette `#b5942e` border over an `rgba(181, 148, 46, 0.08)` wash. `/archetypes` draws the same advisory with a 2px `--warning` left border and no fill, which is what mock 7c specifies. One idiom, defined once in `PageHeader`'s sibling `SpoilerNote`, used at both sites.

---

### Task 1: Token layer — the two remaining container widths

**Files:**
- Modify: `src/app/globals.css` — the `@theme inline` block, after `--container-results` (line 263)
- Modify: `src/components/quiz/QuizFlow.tsx:79`
- Test: `tests/unit/design-system-tokens.test.ts`

**Interfaces:**
- Produces: `--container-reference` (660px) and `--container-quiz` (672px), and with them the `max-w-reference` / `max-w-quiz` Tailwind classes.
- Consumed by: Tasks 2–8 (`max-w-reference`), and `QuizFlow` in this task (`max-w-quiz`).

- [ ] **Step 1: Write the failing test**

Append to the `describe("design delta token layer", ...)` block in `tests/unit/design-system-tokens.test.ts`, beside the existing `caps the results column at the mock's 820px` case:

```ts
  it("names all four page widths as tokens, so none is spelled as a literal", () => {
    // Phase 4 left two of the four as Tailwind literals. A width spelled
    // `max-w-2xl` reads as a generic size rather than as "the quiz column",
    // so a later phase retunes one page and silently desyncs it from the
    // other on the same measure. 660 is mock 7c's; 672 is what `max-w-2xl`
    // already resolved to, so that one is a rename and must not move.
    expect(theme["--container-shell"]).toBe("1040px");
    expect(theme["--container-results"]).toBe("820px");
    expect(theme["--container-reference"]).toBe("660px");
    expect(theme["--container-quiz"]).toBe("672px");
  });

  it("holds the quiz column on its token rather than the generic Tailwind size", () => {
    const quizFlow = readFileSync(
      resolve(process.cwd(), "src/components/quiz/QuizFlow.tsx"),
      "utf8",
    );

    expect(quizFlow).toContain("max-w-quiz");
    expect(quizFlow).not.toContain("max-w-2xl");
  });
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/design-system-tokens.test.ts -t "page widths"
```

Expected: FAIL — `expected undefined to be "660px"`.

- [ ] **Step 3: Add the tokens**

In `src/app/globals.css`, immediately after the `--container-results: 820px;` declaration and its comment:

```css
  /* Reference column width, from mock 7c. The narrowest of the four: this is
     the long-prose measure, and 660px holds it near 75 characters at the
     15px intro size. `/archetypes` runs its zebra band edge-to-edge and
     re-applies this width to the content inside each row, so the measure
     survives a full-bleed background. */
  --container-reference: 660px;

  /* Quiz column width. Value-identical to the `max-w-2xl` it replaces —
     this is a naming change, not a retune. Spelled as a token so the four
     page measures are all visible in one place and none of them reads as an
     incidental Tailwind size. */
  --container-quiz: 672px;
```

- [ ] **Step 4: Move `QuizFlow` onto the token**

In `src/components/quiz/QuizFlow.tsx:79`:

```ts
const QUESTION_SHELL = "mx-auto max-w-quiz pt-9 pb-[52px]";
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npx vitest run tests/unit/design-system-tokens.test.ts tests/unit/quiz-chrome.test.ts
```

Expected: PASS, both files.

- [ ] **Step 6: Verify the quiz swap changed nothing visually**

`max-w-2xl` is 672px and `--container-quiz` is 672px, so this must be a no-op on screen. Confirm the class actually compiles — a `@theme inline` entry that is misnamed produces no class at all, and a missing `max-w-*` silently leaves the column uncapped, which looks like a layout bug several tasks later:

```bash
npm run build 2>&1 | tail -5
grep -rn "max-w-quiz\|max-w-reference" .next/static/css/*.css | head -3
```

Expected: the build succeeds and both classes appear in the emitted stylesheet with `max-width: var(--container-quiz)` / `var(--container-reference)`. If `grep` finds nothing, the token name and the class name have diverged — Tailwind generates `max-w-quiz` from `--container-quiz`, so check the prefix.

- [ ] **Step 7: Commit**

```bash
git add src/app/globals.css src/components/quiz/QuizFlow.tsx tests/unit/design-system-tokens.test.ts
git commit -m "feat(design): name the reference and quiz column widths as tokens"
```

---

### Task 2: `PageHeader`, `SpoilerNote` and `ReferenceCta`

**Files:**
- Create: `src/components/PageHeader.tsx`
- Create: `src/components/ReferenceCta.tsx`
- Test: `tests/unit/reference-chrome.test.ts`

**Interfaces:**
- Produces: `PageHeader`, `SpoilerNote`, `ReferenceCta`.
- Consumed by: Tasks 3–8. `/archetypes`, `/references`, `/axes`, `/questions`, `/methodology`.

The kicker above the h1 is an eyebrow on some pages and a back-link on others. Both render at the same size, tracking and colour; only one is interactive. `PageHeader` takes `kicker` plus an optional `kickerHref` rather than two props or a `ReactNode`, so a caller cannot produce a third spelling.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/reference-chrome.test.ts`:

```ts
/**
 * @vitest-environment jsdom
 *
 * The shared reference-page chrome (design delta phase 5, mock 7c): the
 * header, the spoiler advisory, and the footer CTA that four pages repeat.
 */
import { afterEach, describe, expect, it } from "vitest";
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PageHeader, SpoilerNote } from "@/components/PageHeader";
import { ReferenceCta } from "@/components/ReferenceCta";
import { AppRouterContext, ROUTER_STUB } from "../helpers/client-component-env";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: { container: HTMLDivElement; root: Root }[] = [];

function render(element: ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  mounted.push({ container, root });
  act(() =>
    root.render(
      createElement(AppRouterContext.Provider, { value: ROUTER_STUB }, element),
    ),
  );
  return container;
}

/** Class tokens of an element, so assertions cannot pass on a substring. */
function classes(el: Element): string[] {
  return Array.from(el.classList);
}

afterEach(() => {
  for (const { container, root } of mounted) {
    act(() => root.unmount());
    container.remove();
  }
  mounted.length = 0;
});

describe("PageHeader", () => {
  it("renders a plain eyebrow when given no href", () => {
    const container = render(
      createElement(PageHeader, { kicker: "Reference", title: "References" }),
    );

    const kicker = container.querySelector("[data-page-kicker]")!;
    expect(kicker.tagName).toBe("P");
    expect(container.querySelector("[data-page-kicker] a")).toBeNull();
    expect(kicker.textContent).toBe("Reference");
    expect(classes(kicker)).toContain("label-eyebrow");
    expect(classes(kicker)).toContain("text-text-label");
    // The token this replaced. It is 3.28:1 on surface-1 in BOTH modes, so
    // the swap is the whole point of the assertion above.
    expect(classes(kicker)).not.toContain("text-text-tertiary");
  });

  it("renders the kicker as a back-link when given an href", () => {
    const container = render(
      createElement(PageHeader, {
        kicker: "← Reference",
        kickerHref: "/references",
        title: "The twelve axes",
      }),
    );

    const link = container.querySelector("[data-page-kicker] a")!;
    expect(link.getAttribute("href")).toBe("/references");
    expect(link.textContent).toBe("← Reference");
    expect(classes(link)).toContain("label-eyebrow");
    expect(classes(link)).toContain("focus-ring");
  });

  it("sets the title at the page display size", () => {
    const container = render(
      createElement(PageHeader, { kicker: "Reference", title: "References" }),
    );

    const h1 = container.querySelector("h1")!;
    expect(h1.textContent).toBe("References");
    expect(classes(h1)).toContain("display-page");
    // 28px was the pre-delta size at all five call sites; 7c draws 40px, and
    // `display-page` is the only role that carries it.
    expect(classes(h1)).not.toContain("text-[28px]");
  });

  it("renders lead paragraphs at the mock's 15px, not the 14px they were", () => {
    const container = render(
      createElement(PageHeader, {
        kicker: "Reference",
        title: "Governance archetypes",
        lead: ["First paragraph.", "Second paragraph."],
      }),
    );

    const leads = container.querySelectorAll("[data-page-lead]");
    expect(leads.length).toBe(2);
    expect(leads[0].textContent).toBe("First paragraph.");
    expect(leads[1].textContent).toBe("Second paragraph.");
    expect(classes(leads[0])).toContain("text-[15px]");
    expect(classes(leads[0])).toContain("text-text-secondary");
  });

  it("omits the lead block entirely when there is no lead", () => {
    const container = render(
      createElement(PageHeader, { kicker: "Methodology", title: "How it works" }),
    );

    expect(container.querySelectorAll("[data-page-lead]").length).toBe(0);
  });
});

describe("SpoilerNote", () => {
  it("draws the advisory as a warning stripe with no fill", () => {
    const container = render(
      createElement(SpoilerNote, { children: "body" }),
    );

    const note = container.querySelector("[data-spoiler-note]")!;
    expect(classes(note)).toContain("border-l-2");
    expect(classes(note)).toContain("border-warning");
    // Mock 7c draws a stripe over the page ground. The tinted wash that
    // `/questions` carried is what this must NOT reintroduce, and it is the
    // half of the convergence a border assertion alone would miss.
    expect(classes(note).some((c) => c.startsWith("bg-"))).toBe(false);
    expect(note.getAttribute("style")).toBeNull();
  });

  it("sets the serif italic lead-in in the warning ink", () => {
    const container = render(
      createElement(SpoilerNote, {
        leadIn: "A note before reading —",
        children: "body",
      }),
    );

    const em = container.querySelector("[data-spoiler-note] em")!;
    expect(em.textContent).toBe("A note before reading —");
    expect(classes(em)).toContain("font-serif");
    expect(classes(em)).toContain("italic");
    expect(classes(em)).toContain("text-warning-text");
  });
});

describe("ReferenceCta", () => {
  it("routes the assessment call through the filled primary button", () => {
    const container = render(createElement(ReferenceCta, { secondary: null }));

    const cta = container.querySelector("[data-reference-cta] a")!;
    expect(cta.getAttribute("href")).toBe("/quiz");
    expect(classes(cta)).toContain("bg-button-primary");
    expect(classes(cta)).toContain("control");
    // The pre-delta spelling, which does not invert: on a dark ground it
    // stayed a mid-brown fill under white text.
    expect(classes(cta)).not.toContain("bg-stone-600");
    expect(classes(cta)).not.toContain("text-white");
  });

  it("renders the optional secondary line below the button", () => {
    const container = render(
      createElement(ReferenceCta, {
        secondary: createElement("a", { href: "/methodology" }, "read the methodology"),
      }),
    );

    const secondary = container.querySelector("[data-reference-secondary]")!;
    expect(secondary.textContent).toContain("read the methodology");
    expect(classes(secondary)).toContain("mono-meta");
    expect(classes(secondary)).toContain("text-text-label");
  });

  it("omits the secondary line when there is none", () => {
    const container = render(createElement(ReferenceCta, { secondary: null }));

    expect(container.querySelector("[data-reference-secondary]")).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/reference-chrome.test.ts
```

Expected: FAIL — `Cannot find module '@/components/PageHeader'`.

- [ ] **Step 3: Write `PageHeader`**

Create `src/components/PageHeader.tsx`:

```tsx
import type { ReactNode } from "react";
import Link from "next/link";

interface PageHeaderProps {
  /** The line above the title. Rendered as a link when `kickerHref` is set. */
  kicker: string;
  /** Makes the kicker a back-link. Omit for a plain eyebrow. */
  kickerHref?: string;
  title: string;
  /** Intro paragraphs, at mock 7c's 15px. Omit for a bare header. */
  lead?: string[];
}

/**
 * The opener five pages share: a mono kicker, a `display-page` title, and an
 * optional run of intro paragraphs.
 *
 * `kicker` + optional `kickerHref` rather than two props or a `ReactNode`,
 * because the eyebrow and the back-link are the same line typographically and
 * differ only in whether it is interactive. Handing callers a `ReactNode`
 * invites a third spelling, and a third spelling is how the pre-delta version
 * of this ended up with `tracking-[0.08em]` on four pages and the delta's
 * `0.14em` on none of them.
 */
export function PageHeader({ kicker, kickerHref, title, lead }: PageHeaderProps) {
  return (
    <>
      <p data-page-kicker className="label-eyebrow text-text-label mb-4">
        {kickerHref ? (
          <Link
            href={kickerHref}
            className="label-eyebrow no-underline hover:text-text-secondary transition-colors duration-150 focus-ring"
          >
            {kicker}
          </Link>
        ) : (
          kicker
        )}
      </p>
      <h1 className="display-page text-text-primary mb-[18px]">{title}</h1>
      {lead?.map((paragraph, i) => (
        <p
          key={i}
          data-page-lead
          className="text-[15px] leading-[1.65] text-text-secondary mb-3.5 last:mb-0"
        >
          {paragraph}
        </p>
      ))}
    </>
  );
}

interface SpoilerNoteProps {
  /** Serif italic opener, in the warning ink. */
  leadIn?: string;
  children: ReactNode;
}

/**
 * The advisory stripe: 2px of `--warning` down the left, no fill.
 *
 * No background. `/questions` drew this same advisory over an
 * `rgba(181, 148, 46, 0.08)` wash keyed to a hex outside the palette, and the
 * wash is the part that cannot survive a dark ground — a fixed low-alpha warm
 * tint reads as a smear on Stone 900. Mock 7c draws the stripe alone, and the
 * stripe is the whole device. Spelling it `border-warning` rather than an
 * inline `borderLeftColor` keeps it inside the token namespace the guards
 * scan.
 */
export function SpoilerNote({ leadIn, children }: SpoilerNoteProps) {
  return (
    <div data-spoiler-note className="border-l-2 border-warning pl-4 py-1.5">
      <p className="text-sm leading-[1.65] text-text-secondary">
        {leadIn && (
          <>
            <em className="font-serif italic text-warning-text">{leadIn}</em>{" "}
          </>
        )}
        {children}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Write `ReferenceCta`**

Create `src/components/ReferenceCta.tsx`:

```tsx
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/Button";

interface ReferenceCtaProps {
  /** Button copy. Mock 7c's archetype page says "Begin the assessment". */
  label?: string;
  /** The line under the button — usually one link. Pass null for none. */
  secondary: ReactNode;
}

/**
 * The closing call four reference pages repeat.
 *
 * `primary`, not `secondary`, and that is a rule rather than a preference:
 * CLAUDE.md reserves the filled button for "beginning or resuming the
 * assessment", which is exactly what every one of these four buttons does.
 * The markup it replaces was a hand-rolled `bg-stone-600 text-white` fill —
 * duplicated verbatim at all four sites, including the half of it that does
 * not invert.
 */
export function ReferenceCta({ label = "Begin the assessment", secondary }: ReferenceCtaProps) {
  return (
    <div className="border-t border-border-secondary mt-12 pt-8 text-center">
      <p data-reference-cta>
        <ButtonLink href="/quiz" variant="primary">
          {label}
        </ButtonLink>
      </p>
      {secondary && (
        <p data-reference-secondary className="mt-4 mono-meta text-text-label">
          {secondary}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx vitest run tests/unit/reference-chrome.test.ts
```

Expected: PASS, 10 tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/PageHeader.tsx src/components/ReferenceCta.tsx tests/unit/reference-chrome.test.ts
git commit -m "feat(design): add the shared reference page header, spoiler note and CTA"
```

---

### Task 3: `/archetypes` — the header block (mock 7c)

**Files:**
- Modify: `src/app/archetypes/page.tsx:134-197` — the `<main>` opener through the spoiler notice
- Test: `tests/unit/archetypes-page.test.ts`

**Interfaces:**
- Produces: the 660px header block, and the three-sibling `<main>` that Task 4's full-bleed band needs.
- Consumed by: Task 4 (the entries band is its next sibling), Task 5 (the footer block is the third).

D18 is the reason this task and Task 4 cannot be merged into one edit and also cannot be done in the other order: the band's full-bleed only works once the page has stopped being one capped `<article>`, and that unwrapping happens here.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/archetypes-page.test.ts`:

```ts
/**
 * @vitest-environment jsdom
 *
 * `/archetypes` against mock 7c (design delta phase 5).
 */
import { afterEach, describe, expect, it } from "vitest";
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import ArchetypesPage from "@/app/archetypes/page";
import { archetypes } from "@/data/archetypes";
import { AppRouterContext, ROUTER_STUB } from "../helpers/client-component-env";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: { container: HTMLDivElement; root: Root }[] = [];

function render(element: ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  mounted.push({ container, root });
  act(() =>
    root.render(
      createElement(AppRouterContext.Provider, { value: ROUTER_STUB }, element),
    ),
  );
  return container;
}

function classes(el: Element): string[] {
  return Array.from(el.classList);
}

afterEach(() => {
  for (const { container, root } of mounted) {
    act(() => root.unmount());
    container.remove();
  }
  mounted.length = 0;
});

describe("/archetypes header block", () => {
  it("caps the header on the reference measure", () => {
    const container = render(createElement(ArchetypesPage));

    const header = container.querySelector("[data-archetypes-header]")!;
    expect(classes(header)).toContain("max-w-reference");
    // max-w-2xl is 672px, which is the quiz measure, not this page's 660.
    expect(classes(header)).not.toContain("max-w-2xl");
  });

  it("opens with the reference back-link and the page title", () => {
    const container = render(createElement(ArchetypesPage));

    const link = container.querySelector("[data-page-kicker] a")!;
    expect(link.getAttribute("href")).toBe("/references");
    expect(container.querySelector("h1")!.textContent).toBe("Governance archetypes");
    expect(classes(container.querySelector("h1")!)).toContain("display-page");
  });

  it("states the archetype count from the data rather than a literal", () => {
    const container = render(createElement(ArchetypesPage));

    const lead = container.querySelector("[data-page-lead]")!;
    // The mock's prose says "twelve"; the page must not drift from the data
    // if a thirteenth prototype is ever added.
    expect(lead.textContent).toContain(`${archetypes.length} archetype prototypes`);
  });

  it("carries the spoiler advisory as a warning stripe over the page ground", () => {
    const container = render(createElement(ArchetypesPage));

    const note = container.querySelector("[data-spoiler-note]")!;
    expect(note.textContent).toContain("archetype descriptions may influence how you answer");
    expect(classes(note)).toContain("border-warning");
    // The inline `borderLeftColor: var(--warning)` this replaced. An inline
    // style is invisible to the token guards in Task 13, which is the reason
    // the spelling matters and not just the colour.
    expect(note.getAttribute("style")).toBeNull();
  });

  it("links the spoiler note's escape hatch to the quiz", () => {
    const container = render(createElement(ArchetypesPage));

    const link = container.querySelector("[data-spoiler-note] a")!;
    expect(link.getAttribute("href")).toBe("/quiz");
    expect(link.textContent).toBe("completing it first");
  });

  it("leaves the header block as a sibling of the entries band, not its parent", () => {
    const container = render(createElement(ArchetypesPage));

    const header = container.querySelector("[data-archetypes-header]")!;
    const band = container.querySelector("[data-archetypes-band]")!;
    // The full-bleed zebra in Task 4 is only reachable from outside a capped
    // column. If the band ever moves back inside the header, the rows go on
    // rendering — just 660px wide with the background clipped to them — so
    // nothing else in the suite would catch it.
    expect(header.contains(band)).toBe(false);
    expect(header.parentElement).toBe(band.parentElement);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/archetypes-page.test.ts
```

Expected: FAIL — `data-archetypes-header` is null.

- [ ] **Step 3: Replace the header block**

In `src/app/archetypes/page.tsx`, replace everything from `return (` through the closing `</div>` of the provenance legend's preceding spoiler block — that is, the current lines from `<main className="min-h-screen px-4 py-12">` down to the end of the spoiler `<div>` — with:

```tsx
  return (
    <main id="top" className="min-h-screen pt-11 pb-10">
      <div data-archetypes-header className="mx-auto max-w-reference px-6">
        <PageHeader
          kicker="← Reference"
          kickerHref="/references"
          title="Governance archetypes"
          lead={[
            `After scoring, your twelve-axis profile is compared against ${archetypes.length} archetype prototypes — idealized profiles representing coherent governance philosophies. You are assigned to the nearest, and shown your degree of match, your second-nearest, and a description of each archetype's internal logic.`,
            "Each entry lists the traditions and movements that have historically expressed that orientation. Most prototypes are derived from comparative political philosophy; a subset have been refined toward — or in one case identified directly from — empirical clusters in an April 2026 synthetic population study.",
          ]}
        />

        <div className="mt-[26px] mb-[30px]">
          <SpoilerNote leadIn="A note before reading —">
            archetype descriptions may influence how you answer. If you
            haven&apos;t taken the assessment yet, we recommend{" "}
            <Link
              href="/quiz"
              className="text-text-primary font-medium underline decoration-border-primary underline-offset-2 hover:decoration-text-secondary transition-colors duration-150 focus-ring"
            >
              completing it first
            </Link>
            .
          </SpoilerNote>
        </div>
```

Note that `id="top"` moves from the old `<article>` onto `<main>` — the footer's `↑ back to top` link targets it and Task 5 asserts that it still resolves.

Add the import at the top of the file, beside the existing `Link` import:

```tsx
import { PageHeader, SpoilerNote } from "@/components/PageHeader";
```

- [ ] **Step 4: Close the header block and stub the rest**

The provenance legend, index, entries and footer are Tasks 4 and 5. For this task to compile and for the sibling assertion to have something to find, close the header `<div>` after the spoiler and open a placeholder band immediately after it. Directly below the `</div>` that closes the spoiler wrapper:

```tsx
      </div>

      <div data-archetypes-band className="border-t border-border-secondary">
        {/* Provenance legend, index and entries land here in Task 4. */}
      </div>
```

Then delete the old provenance legend, nav and `archetype-list` markup that followed — Task 4 rewrites all three from scratch rather than editing them in place, and leaving them stranded inside a deleted `<article>` will not compile. Keep the footer block for now, moving it to just before `</main>`; Task 5 rewrites it.

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npx vitest run tests/unit/archetypes-page.test.ts && npm run typecheck
```

Expected: PASS, 6 tests, and a clean typecheck. `EmergenceGlyph`, `EMERGENCE_ORDER`, `numberFor` and `navGroups` are now unreferenced — lint will flag them. Leave them; Task 4 uses all four. If `npm run lint` is run at this point it will report unused bindings, which is expected mid-task and is closed by the end of Task 4.

- [ ] **Step 6: Commit**

```bash
git add src/app/archetypes/page.tsx tests/unit/archetypes-page.test.ts
git commit -m "feat(design): rebuild the archetype reference header on mock 7c"
```

---

### Task 4: `/archetypes` — provenance legend, flat index, full-bleed entries

**Files:**
- Modify: `src/app/archetypes/page.tsx` — the band opened in Task 3
- Test: `tests/unit/archetypes-page.test.ts`

**Interfaces:**
- Consumes: `EMERGENCE_GLYPH`, `EMERGENCE_LABELS`, `EMERGENCE_TOOLTIPS`, `EmergenceGlyph`, `MiniRadar`, `TraditionsProse` — all already in the file.
- Produces: the zebra band. Task 5 appends the footer after it.

D19 applies here: the index flattens to one two-column grid and the tier name moves onto a mono line inside each entry.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/archetypes-page.test.ts`:

```ts
describe("/archetypes provenance legend", () => {
  it("labels the legend in the mono eyebrow layer", () => {
    const container = render(createElement(ArchetypesPage));

    const label = container.querySelector("[data-provenance-label]")!;
    expect(label.textContent).toBe("Provenance");
    expect(classes(label)).toContain("label-eyebrow");
    expect(classes(label)).toContain("text-text-label");
    expect(classes(label)).not.toContain("text-text-tertiary");
  });

  it("lists all three tiers as glyph, mono label, prose", () => {
    const container = render(createElement(ArchetypesPage));

    const rows = container.querySelectorAll("[data-provenance-row]");
    expect(rows.length).toBe(3);
    expect(rows[0].textContent).toContain("●");
    expect(rows[1].textContent).toContain("◐");
    expect(rows[2].textContent).toContain("○");

    const firstLabel = rows[0].querySelector("[data-provenance-tier]")!;
    expect(firstLabel.textContent).toBe("Emerged from data");
    expect(classes(firstLabel)).toContain("label-nav");
    expect(classes(firstLabel)).toContain("text-text-primary");
  });

  it("glosses each tier in one line, not in the glyph's long tooltip prose", () => {
    const container = render(createElement(ArchetypesPage));

    const rows = container.querySelectorAll("[data-provenance-row]");
    expect(rows[0].textContent).toContain("identified from an empirical cluster");
    // EMERGENCE_TOOLTIPS is the 40-word form EmergenceGlyph's accessible name
    // uses. Reaching for it here is the natural mistake — it is the only
    // exported per-tier prose — and it renders three paragraphs where 7c
    // draws three lines, which no other assertion in this file would catch.
    expect(rows[0].textContent).not.toContain("Its prototype vector is centered");
    for (const row of rows) expect(row.textContent!.length).toBeLessThan(140);
  });

  it("leaves the legend's own glyphs decorative", () => {
    const container = render(createElement(ArchetypesPage));

    // The row spells the tier out in words beside it, so an accessible name
    // on the glyph would make a screen reader announce the same tier twice.
    // The glyphs that DO carry a name are the ones in the index and the entry
    // headings, where nothing else says what the mark means.
    for (const row of container.querySelectorAll("[data-provenance-row]")) {
      const glyph = row.querySelector("span")!;
      expect(glyph.getAttribute("aria-hidden")).toBe("true");
      expect(glyph.getAttribute("role")).toBeNull();
    }
  });

  it("keeps the long tooltip reachable from the index glyphs", () => {
    const container = render(createElement(ArchetypesPage));

    const glyph = container.querySelector("[data-archetype-index] [role='img']")!;
    expect(glyph.getAttribute("aria-label")).toMatch(
      /Emerged from data|Refined with data|Theoretically derived/,
    );
    // EmergenceGlyph builds its name as "<label>. <tooltip>", so this is the
    // one place the long form stays available to an AT user.
    expect(glyph.getAttribute("aria-label")!.length).toBeGreaterThan(100);
  });
});

describe("/archetypes index", () => {
  it("draws one flat two-column grid rather than three tier-grouped blocks", () => {
    const container = render(createElement(ArchetypesPage));

    const grid = container.querySelector("[data-archetype-index]")!;
    expect(classes(grid)).toContain("grid-cols-2");
    expect(grid.querySelectorAll("a").length).toBe(archetypes.length);
    // The pre-7c index split into three headed groups. Mock 7c carries the
    // tier per row, by glyph, and prints the tier NAME inside each entry.
    expect(container.querySelectorAll("[data-index-tier-group]").length).toBe(0);
  });

  it("numbers every index row in mono, zero-padded, in display order", () => {
    const container = render(createElement(ArchetypesPage));

    const numbers = Array.from(
      container.querySelectorAll("[data-archetype-index] [data-index-number]"),
    ).map((el) => el.textContent);

    expect(numbers[0]).toBe("01");
    expect(numbers[numbers.length - 1]).toBe("12");
    const first = container.querySelector("[data-archetype-index] [data-index-number]")!;
    expect(classes(first)).toContain("font-mono");
    expect(classes(first)).toContain("text-text-label");
  });

  it("points every index row at the entry it names", () => {
    const container = render(createElement(ArchetypesPage));

    const hrefs = Array.from(
      container.querySelectorAll<HTMLAnchorElement>("[data-archetype-index] a"),
    ).map((a) => a.getAttribute("href"));
    const ids = Array.from(container.querySelectorAll("[data-archetype-entry]")).map(
      (el) => `#${el.id}`,
    );

    // Anchor drift is silent: a wrong href scrolls to the top of the page,
    // which reads as "the link did nothing" rather than as a bug.
    expect(hrefs).toEqual(ids);
  });
});

describe("/archetypes entries", () => {
  it("renders one full-bleed row per archetype, alternating the ground", () => {
    const container = render(createElement(ArchetypesPage));

    const rows = container.querySelectorAll("[data-archetype-entry]");
    expect(rows.length).toBe(archetypes.length);
    expect(classes(rows[0])).not.toContain("bg-surface-2");
    expect(classes(rows[1])).toContain("bg-surface-2");
    // Each row separates from the next with a rule, per 7c.
    expect(classes(rows[0])).toContain("border-b");
    expect(classes(rows[0])).toContain("border-border-secondary");
  });

  it("re-applies the reference measure inside each full-bleed row", () => {
    const container = render(createElement(ArchetypesPage));

    const inner = container.querySelector("[data-archetype-entry] [data-entry-inner]")!;
    // The band is edge-to-edge; the prose is not. Losing this cap is the
    // failure mode of full-bleed: the text runs the width of the viewport and
    // every other assertion here still passes.
    expect(classes(inner)).toContain("max-w-reference");
    expect(classes(inner)).toContain("mx-auto");
  });

  it("sets entry names at the entry display size", () => {
    const container = render(createElement(ArchetypesPage));

    const h2 = container.querySelector("[data-archetype-entry] h2")!;
    expect(classes(h2)).toContain("display-entry");
    expect(classes(h2)).not.toContain("text-[18px]");
  });

  it("prints the provenance tier as a mono line under each entry heading", () => {
    const container = render(createElement(ArchetypesPage));

    const tiers = container.querySelectorAll("[data-entry-tier]");
    expect(tiers.length).toBe(archetypes.length);
    expect(classes(tiers[0])).toContain("label-nav");
    expect(classes(tiers[0])).toContain("text-text-label");
    // D19: this is where the tier name went when the index flattened. If it
    // is absent the tier is reachable only through a glyph's title attribute.
    expect(["Emerged from data", "Refined with data", "Theoretically derived"]).toContain(
      tiers[0].textContent,
    );
  });

  it("keeps the serif italic lead-ins as prose, not mono labels", () => {
    const container = render(createElement(ArchetypesPage));

    const entry = container.querySelector("[data-archetype-entry]")!;
    const leadIns = Array.from(entry.querySelectorAll("em[data-lead-in]"));

    // Issue #136's "the one thing not to redesign". Turning these into mono
    // labels turns a reference into a spec sheet, and nothing else in this
    // file would fail if someone did.
    expect(leadIns.map((el) => el.textContent)).toEqual([
      "Internal tension.",
      "Traditions.",
    ]);
    for (const em of leadIns) {
      expect(classes(em)).toContain("font-serif");
      expect(classes(em)).toContain("italic");
      expect(classes(em)).not.toContain("label");
      expect(classes(em)).not.toContain("label-nav");
    }

    // Selecting every `em` instead would sweep in a different device: markdown
    // emphasis inside the traditions prose. `popular-egalitarian` italicises
    // `*Ujamaa*`, `social-democrat` `*ostpolitik*` — foreign terms inside sans
    // body copy, which `TraditionsProse` renders sans on purpose. Asserting
    // `font-serif` over that set reds the suite on correct markup.
    //
    // Scoped to the band rather than to the first entry: `radical-egalitarian`
    // leads the display order and its traditions carry links only, no emphasis
    // at all. Scoped to the band rather than the page for the opposite reason —
    // `SpoilerNote` in the header renders its own serif italic lead-in, which
    // is a lead-in and not markdown emphasis.
    const bodyEm = Array.from(
      container.querySelectorAll("[data-archetypes-band] em:not([data-lead-in])"),
    );
    expect(bodyEm.length).toBeGreaterThan(0);
    expect(classes(bodyEm[0])).not.toContain("font-serif");
  });

  it("labels the axis-position disclosure in mono", () => {
    const container = render(createElement(ArchetypesPage));

    const summary = container.querySelector("[data-archetype-entry] summary")!;
    expect(summary.textContent).toContain("Axis positions");
    expect(classes(summary)).toContain("label");
    expect(classes(summary)).toContain("text-text-label");
  });

  it("keeps every entry addressable by id for :target deep links", () => {
    const container = render(createElement(ArchetypesPage));

    const ids = Array.from(container.querySelectorAll("[data-archetype-entry]")).map(
      (el) => el.id,
    );

    // `/results#<archetype-id>` relies on these, and issue #136 calls the
    // :target highlight out by name as a thing that must survive.
    expect(ids).toEqual([...archetypes].sort((a, b) => a.displayOrder - b.displayOrder).map((a) => a.id));
    expect(classes(container.querySelector("[data-archetype-entry]")!)).toContain("scroll-mt-20");
  });
});
```

That comment took two corrections to get right, and both are worth keeping because each is a different way of being wrong about the same five lines of data. The first draft looped every `em` in the entry and asserted `font-serif` on each, which reds on *correct* markup: five of the twelve entries carry markdown emphasis inside their traditions prose. The second scoped the negative half to the **first** entry and said that entry italicises `*Ujamaa*` — it does not. `radical-egalitarian` leads the display order and its traditions carry links only, no emphasis at all; `*Ujamaa*` belongs to `popular-egalitarian` at display order 2. Scoping to `[data-archetypes-band]` is what shipped, and it is the only scope that is simultaneously wide enough to be sure of finding emphasis somewhere and narrow enough to exclude `SpoilerNote`'s serif `em` up in the header.

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/archetypes-page.test.ts
```

Expected: FAIL — `data-provenance-label` is null, plus the eleven cases after it.

- [ ] **Step 3a: Name the legend's one-line bodies**

The legend needs a short body per tier and `EMERGENCE_TOOLTIPS` is **not** it. Those are 40-word paragraphs written for the glyph's `title` attribute — dropping one into the legend renders three dense blocks where mock 7c draws three single lines. The short bodies exist today, inlined in the legend markup Task 3 deleted; name them so they survive and so the test can address them. Add beside `EMERGENCE_GLYPH` at the top of `src/app/archetypes/page.tsx`:

```tsx
/** The legend's one-line gloss per tier.
 *
 *  Deliberately not `EMERGENCE_TOOLTIPS`, which is the long form the glyph's
 *  `title` carries — three of those in a row is a wall of prose where mock 7c
 *  draws three lines. Same facts, legend length. */
const PROVENANCE_BLURB: Record<ArchetypeEmergence, string> = {
  empirical: "identified from an empirical cluster in the April 2026 synthetic study",
  refined: "hand-crafted, then adjusted toward a matching empirical centroid",
  theoretical: "grounded in comparative political philosophy, no empirical match surfaced",
};
```

`EMERGENCE_TOOLTIPS` stays imported — `EmergenceGlyph` still builds its accessible name from it, which is what keeps the long form reachable.

- [ ] **Step 3b: Fill the band**

Replace the placeholder band from Task 3 Step 4 with the legend, index and entries. The legend and index sit on the 660px measure and belong above the band's rule; only the entries go full-bleed. Replace:

```tsx
      <div data-archetypes-band className="border-t border-border-secondary">
        {/* Provenance legend, index and entries land here in Task 4. */}
      </div>
```

with:

```tsx
      <div className="mx-auto max-w-reference px-6">
        <p data-provenance-label className="label-eyebrow text-text-label mb-3">
          Provenance
        </p>
        <div className="flex flex-col gap-[7px] mb-[30px]">
          {EMERGENCE_ORDER.map((tier) => (
            <p
              key={tier}
              data-provenance-row
              className="text-[13px] leading-[1.6] text-text-secondary"
            >
              <span aria-hidden="true" className="text-mark-primary">
                {EMERGENCE_GLYPH[tier]}
              </span>{" "}
              <span data-provenance-tier className="label-nav font-medium text-text-primary">
                {EMERGENCE_LABELS[tier]}
              </span>
              {" — "}
              {PROVENANCE_BLURB[tier]}
            </p>
          ))}
        </div>

        <p className="label-eyebrow text-text-label mb-3">
          {sortedArchetypes.length === 12 ? "Twelve archetypes" : "The archetypes"}
        </p>
        <nav
          data-archetype-index
          className="grid grid-cols-2 gap-x-7 gap-y-1.5 mb-2"
          aria-label="Archetype list"
        >
          {sortedArchetypes.map((a) => (
            <a
              key={a.id}
              href={`#${a.id}`}
              className="flex items-baseline gap-2 text-[13px] text-text-secondary no-underline py-[3px] hover:text-text-primary transition-colors duration-150 focus-ring"
            >
              <span data-index-number className="font-mono text-[11px] text-text-label tabular-nums">
                {String(numberFor.get(a.id)).padStart(2, "0")}
              </span>
              <span>{a.name.replace(/^The\s+/, "")}</span>
              <EmergenceGlyph emergence={a.emergence} />
            </a>
          ))}
        </nav>
      </div>

      <div data-archetypes-band className="mt-7 border-t border-border-secondary">
        {sortedArchetypes.map((archetype, i) => (
          <section
            key={archetype.id}
            id={archetype.id}
            data-archetype-entry
            className={`border-b border-border-secondary scroll-mt-20 ${
              i % 2 === 1 ? "bg-surface-2" : ""
            }`}
          >
            <div data-entry-inner className="mx-auto max-w-reference px-6 pt-[30px] pb-8">
              <header className="flex gap-5 items-start mb-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <span className="font-mono text-xs text-text-label tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h2 className="display-entry text-text-primary">{archetype.name}</h2>
                    <EmergenceGlyph emergence={archetype.emergence} />
                  </div>
                  <p data-entry-tier className="label-nav text-text-label mt-1.5">
                    {EMERGENCE_LABELS[archetype.emergence]}
                  </p>
                </div>
                <MiniRadar prototype={archetype.prototype} />
              </header>

              <p className="text-[14.5px] leading-[1.65] text-text-secondary mb-3">
                {archetype.description}
              </p>

              <p className="body-s text-text-secondary mb-3">
                <em data-lead-in className="font-serif italic text-text-primary">Internal tension.</em>{" "}
                {archetype.characteristicTension}
              </p>

              <TraditionsProse
                traditions={archetype.traditions}
                leadIn={
                  <>
                    <em data-lead-in className="font-serif italic text-text-primary">Traditions.</em>{" "}
                  </>
                }
              />

              <details className="group mt-4">
                <summary className="list-none inline-flex items-center gap-1.5 label text-text-label font-medium cursor-pointer hover:text-text-secondary transition-colors duration-150 select-none focus-ring">
                  <span
                    aria-hidden="true"
                    className="inline-block text-[13px] leading-none transition-transform duration-150 group-open:rotate-90"
                  >
                    ▸
                  </span>
                  Axis positions
                </summary>
                <div className="mt-3 space-y-1">
                  {archetype.prototype.map((value, idx) => {
                    const axis = axes.find((a) => a.id === idx + 1)!;
                    return (
                      <div key={axis.id}>
                        <div className="flex items-baseline justify-between mb-0.5">
                          <span className="text-xs text-text-secondary">{axis.name}</span>
                          <span className="mono-meta text-text-label tabular-nums">
                            {value > 0 ? "+" : ""}
                            {value.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="hidden min-[480px]:inline w-16 shrink-0 text-[11px] text-text-label text-right truncate">
                            {axis.poleALabel.split(" ")[0]}
                          </span>
                          <div
                            className="flex-1 h-[6px] rounded-[3px] relative overflow-hidden"
                            style={{ backgroundColor: "var(--border-secondary)" }}
                          >
                            {value !== 0 && (
                              <div
                                className="absolute top-0 h-full rounded-[3px]"
                                style={{
                                  backgroundColor: "var(--mark-primary)",
                                  opacity: 0.4,
                                  left: value < 0 ? `${50 + value * 50}%` : "50%",
                                  width: `${Math.abs(value) * 50}%`,
                                }}
                              />
                            )}
                            <div
                              className="absolute top-0 h-full"
                              style={{
                                left: "50%",
                                width: "1px",
                                backgroundColor: "var(--border-primary)",
                              }}
                            />
                          </div>
                          <span className="hidden min-[480px]:inline w-16 shrink-0 text-[11px] text-text-label truncate">
                            {axis.poleBLabel.split(" ")[0]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            </div>
          </section>
        ))}
      </div>
```

Three things changed inside the disclosure beyond the token swaps, and each is deliberate. The pole labels move from `text-[10px]` to `text-[11px]` — the delta's floor is 11px and 10px was a pre-existing sub-floor site. The score readout moves from `text-[11px] font-mono` to `mono-meta`, which is the same size with the delta's tracking. And the bar fill moves from `var(--stone-600)` to `var(--mark-primary)`, which is the stepping token: Stone 600 is a fixed hex and does not lighten on a dark ground.

- [ ] **Step 4: Retire the now-dead nav grouping**

`navGroups` is no longer referenced — D19 flattened the index. Delete its declaration from the component body:

```tsx
  const navGroups = EMERGENCE_ORDER.map((tier) => ({
    tier,
    items: sortedArchetypes.filter((a) => a.emergence === tier),
  })).filter((g) => g.items.length > 0);
```

`EMERGENCE_ORDER` stays — the provenance legend iterates it.

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npx vitest run tests/unit/archetypes-page.test.ts && npm run typecheck && npm run lint
```

Expected: PASS, **21 tests** (Task 3's 6 plus the 15 above); clean typecheck; clean lint. Step 7 adds the 22nd. If lint still reports an unused binding, it is `numberFor` or `EmergenceGlyph` — both are used above, so a report means the edit landed in the wrong place. (`numberFor` did not survive the phase: review found it had become an identity map over the flat index, and deleted it. See "Review fixes" below.)

- [ ] **Step 6: Commit**

```bash
git add src/app/archetypes/page.tsx tests/unit/archetypes-page.test.ts
git commit -m "feat(design): give the archetype entries a full-bleed zebra band"
```

- [ ] **Step 7: Finish the mark sweep this task started**

Step 3b moved the legend glyph to `text-mark-primary` and the axis-bar fill to
`var(--mark-primary)`, but `EmergenceGlyph` and `MiniRadar` were left on
`var(--stone-600)` — a fixed hex. That is now an inconsistency *this task
introduced*: the index row draws the legend's stepping glyph and the entry's
fixed one side by side, so on a dark ground the same mark renders in two
browns. Close it.

In `EmergenceGlyph`, `style={{ color: "var(--stone-600)" }}` →
`style={{ color: "var(--mark-primary)" }}`. In `MiniRadar`, tag the data
polygon `data-prototype-shape` and swap both of its channels:
`style={{ fill: "var(--mark-primary)", stroke: "var(--mark-primary)" }}`. The
two ring polygons already use `--border-secondary` and are unaffected.

Append to `tests/unit/archetypes-page.test.ts`:

```ts
describe("/archetypes mode-stepping marks", () => {
  it("routes the glyph and the prototype shape through the stepping token", () => {
    const container = render(createElement(ArchetypesPage));

    const glyph = container.querySelector("[data-archetype-index] [role='img']")!;
    expect(glyph.getAttribute("style")).toContain("var(--mark-primary)");
    // `--stone-600` is one hex in both modes. Task 4 moved the legend glyph
    // beside this one onto `text-mark-primary`, which steps 600 → 400 on a
    // dark ground — so leaving these on the fixed value put two different
    // browns on the same row, in a page that draws the same mark three times.
    expect(glyph.getAttribute("style")).not.toContain("var(--stone-600)");

    const shape = container.querySelector("[data-archetype-entry] [data-prototype-shape]")!;
    expect(shape.getAttribute("style")).toContain("var(--mark-primary)");
    expect(shape.getAttribute("style")).not.toContain("var(--stone-600)");
  });
});
```

After this, `grep -n "stone-600" src/app/archetypes/page.tsx` returns nothing.

---

### Task 5: `/archetypes` — the footer block

**Files:**
- Modify: `src/app/archetypes/page.tsx` — the footer following the band
- Test: `tests/unit/archetypes-page.test.ts`

Mock 7c closes with a filled **primary** button — this is the one place in the reference family where the delta's most emphatic control is correct, because beginning the assessment is precisely the action CLAUDE.md reserves it for — above a single mono row of nav links.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/archetypes-page.test.ts`:

```ts
describe("/archetypes footer", () => {
  it("closes with the filled primary assessment button", () => {
    const container = render(createElement(ArchetypesPage));

    const cta = container.querySelector("[data-reference-cta] a")!;
    expect(cta.getAttribute("href")).toBe("/quiz");
    expect(cta.textContent).toBe("Begin the assessment");
    expect(classes(cta)).toContain("bg-button-primary");
    // It shipped as an outlined ghost link. 7c draws ink, and CLAUDE.md
    // reserves ink for exactly this action.
    expect(classes(cta)).not.toContain("border-border-primary");
  });

  it("runs the footer nav as one mono row", () => {
    const container = render(createElement(ArchetypesPage));

    const nav = container.querySelector("[data-reference-secondary]")!;
    expect(classes(nav)).toContain("mono-meta");
    expect(classes(nav)).toContain("text-text-label");
    expect(nav.textContent).toContain("Back to references");
    expect(nav.textContent).toContain("Back to top");
  });

  it("points the back-to-top link at an anchor that exists", () => {
    const container = render(createElement(ArchetypesPage));

    const top = Array.from(
      container.querySelectorAll<HTMLAnchorElement>("[data-reference-secondary] a"),
    ).find((a) => a.getAttribute("href") === "#top");

    expect(top).toBeDefined();
    // Task 3 moved `id="top"` from the deleted <article> onto <main>. If the
    // move were missed the link would still render and still do nothing.
    expect(container.querySelector("#top")).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/archetypes-page.test.ts -t "footer"
```

Expected: FAIL — `data-reference-cta` is null.

- [ ] **Step 3: Replace the footer**

Replace the whole footer `<div>` carried over from Task 3 with:

```tsx
      <div className="mx-auto max-w-reference px-6">
        <ReferenceCta
          secondary={
            <>
              <Link
                href="/references"
                className="no-underline hover:text-text-secondary transition-colors duration-150 focus-ring"
              >
                Back to references
              </Link>
              <span aria-hidden="true" className="opacity-40 mx-2">
                ·
              </span>
              <a
                href="#top"
                className="no-underline hover:text-text-secondary transition-colors duration-150 focus-ring"
              >
                ↑ Back to top
              </a>
              <ReturningUserLink
                as="span"
                wrapperClassName="inline"
                className="no-underline hover:text-text-secondary transition-colors duration-150 focus-ring"
                label="← Back to your results"
                prefix={
                  <span aria-hidden="true" className="opacity-40 mx-2">
                    ·
                  </span>
                }
              />
            </>
          }
        />
      </div>
```

Add the import beside the others:

```tsx
import { ReferenceCta } from "@/components/ReferenceCta";
```

`ReturningUserLink` stays — it renders only for visitors with stored results, and dropping it would remove the only path back to a reader's own results from this page.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx vitest run tests/unit/archetypes-page.test.ts && npm run typecheck && npm run lint
```

Expected: PASS, **25 tests** (22 after Task 4, plus the three above); clean typecheck and lint. The file finishes the phase at 28, the last three arriving with the review fixes recorded below.

- [ ] **Step 5: Re-point the `:target` highlight**

Issue #136 names this explicitly, and Task 4 broke it. `src/app/globals.css:311-318` carries two rules — `.archetype-entry:target` and `.archetype-entry:target::before` — and Task 4 replaced that class with a `data-archetype-entry` attribute, so both selectors now match nothing. This is the failure mode the phase-4 constraint about silence was written for: a dead `:target` rule throws nothing, logs nothing, and leaves the page rendering correctly in every respect except the one the issue asked about.

**What this step originally said, and why it was not enough.** The instruction was to rewrite the two selectors to `[data-archetype-entry]:target` and `[data-archetype-entry]:target::before`, "changing the declaration bodies not at all". That shipped, and it was wrong — not wrong as a rename, but wrong because the rename was the smaller half of the problem. The declaration body was written when the highlighted element was a `px-4` section *inside* a 660px `<article>`, so `position: relative` on the section made the section the positioning context and `left: 0` landed on the prose edge. Task 4 made that same section full-bleed. The rule still matched, still painted, and still animated — it just painted its 2px rail at the viewport edge, roughly 390px left of the entry it was marking on a 1440px viewport. A rename verified by `grep` cannot see that; only loading the page can.

The rail has to ride the element that defines the measure, which after D18 is the inner column, not the row. What shipped:

```css
[data-archetype-entry]:target [data-entry-inner] {
  position: relative;
}
[data-archetype-entry]:target [data-entry-inner]::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--mark-primary);
  animation: archetype-target-fade 2s ease-out forwards;
}
```

Two things changed beyond the selector. The descendant `[data-entry-inner]` moves both the positioning context and the pseudo-element onto the 660px column. And `background` moves from `var(--stone-600)` to `var(--mark-primary)`: Task 4 Step 7 swept this page's marks onto the stepping token but reached only the JSX, so the deep-link rail was left as the one mark on the page that stayed a fixed brown on a dark ground.

The generalisable lesson, which is why this step is written out rather than just corrected: **a selector rename is only safe when nothing about the element it selects has moved.** Task 4 had changed the element's box from a capped child to a full-bleed parent in the same phase, two tasks earlier, and the rename step did not look at the declaration body at all because the instruction told it not to.

```bash
grep -n "archetype-entry" src/app/globals.css
```

Expected after the edit: two hits, both spelled `[data-archetype-entry]:target [data-entry-inner]`, and none spelled `.archetype-entry`. Confirm by hand in Task 14 Step 2 — load `/archetypes#<some-archetype-id>` and check the rail paints **against the prose**, not at the window edge. That last clause is the whole check; "the highlight paints" was the check as originally written, and the defect satisfied it.

- [ ] **Step 6: Commit**

```bash
git add src/app/archetypes/page.tsx src/app/globals.css tests/unit/archetypes-page.test.ts
git commit -m "feat(design): close the archetype reference on the ink assessment CTA"
```

---

### Task 6: `/references` and `/methodology`

**Files:**
- Modify: `src/app/references/page.tsx`
- Modify: `src/app/methodology/page.tsx`
- Test: `tests/unit/reference-chrome.test.ts`

The two simplest consumers of Task 2's components, done together because neither has any structure beyond header, body, CTA.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/reference-chrome.test.ts`:

```ts
import ReferencesPage from "@/app/references/page";
import MethodologyPage from "@/app/methodology/page";

describe("/references", () => {
  it("opens on the shared header at the reference measure", () => {
    const container = render(createElement(ReferencesPage));

    expect(container.querySelector("h1")!.textContent).toBe("References");
    expect(classes(container.querySelector("h1")!)).toContain("display-page");
    expect(classes(container.querySelector("article")!)).toContain("max-w-reference");
  });

  it("routes its CTA through the primary button", () => {
    const container = render(createElement(ReferencesPage));

    const cta = container.querySelector("[data-reference-cta] a")!;
    expect(classes(cta)).toContain("bg-button-primary");
    expect(classes(cta)).not.toContain("bg-stone-600");
  });

  it("sets the card titles at the small display size", () => {
    const container = render(createElement(ReferencesPage));

    const h2 = container.querySelector("h2")!;
    expect(classes(h2)).toContain("display-s");
    expect(classes(h2)).not.toContain("text-[17px]");
  });
});

describe("/methodology", () => {
  it("opens on the shared header", () => {
    const container = render(createElement(MethodologyPage));

    expect(container.querySelector("h1")!.textContent).toBe(
      "How The Governance Compass works",
    );
    expect(classes(container.querySelector("h1")!)).toContain("display-page");
  });

  it("sets its section headings at the entry display size", () => {
    const container = render(createElement(MethodologyPage));

    for (const h2 of container.querySelectorAll("h2")) {
      expect(classes(h2)).toContain("display-entry");
      expect(classes(h2)).not.toContain("text-[18px]");
    }
  });

  it("runs the section jump nav in the mono nav layer", () => {
    const container = render(createElement(MethodologyPage));

    const nav = container.querySelector("nav[aria-label='Page sections']")!;
    expect(classes(nav)).toContain("label-nav");
    expect(classes(nav)).toContain("text-text-label");
    expect(classes(nav)).not.toContain("text-text-tertiary");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/reference-chrome.test.ts -t "/references"
```

Expected: FAIL — `display-page` not among the h1's classes.

- [ ] **Step 3: Rewrite `/references`**

In `src/app/references/page.tsx`, replace the whole `return` with:

```tsx
  return (
    <main className="min-h-screen px-6 pt-11 pb-10">
      <article className="mx-auto max-w-reference">
        <PageHeader
          kicker="Reference"
          title="References"
          lead={[
            "Background material on the assessment — how the axes are defined, how each question maps to scoring, and the methodology behind the instrument.",
          ]}
        />

        <div className="space-y-6 mt-9">
          {PAGES.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="block rounded-sharp border border-border-secondary px-5 py-4 hover:bg-surface-2 transition-colors duration-150 focus-ring"
            >
              <h2 className="display-s text-text-primary mb-1">{page.title}</h2>
              <p className="body-s text-text-secondary">{page.description}</p>
            </Link>
          ))}
        </div>

        <ReferenceCta label="Take the assessment" secondary={null} />
      </article>
    </main>
  );
```

and replace the imports at the top with:

```tsx
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { ReferenceCta } from "@/components/ReferenceCta";
```

- [ ] **Step 4: Rewrite `/methodology`'s chrome**

In `src/app/methodology/page.tsx`, replace the header and jump nav — everything from `<article` through the closing `</nav>` — with:

```tsx
      <article className="mx-auto max-w-reference">
        <PageHeader kicker="Methodology" title="How The Governance Compass works" />

        <nav
          className="flex flex-wrap gap-x-4 gap-y-1 label-nav text-text-label mt-6 mb-9"
          aria-label="Page sections"
        >
          {SECTIONS.map((s, i) => (
            <span key={s.id}>
              <a
                href={`#${s.id}`}
                className="no-underline hover:text-text-secondary transition-colors duration-150 focus-ring"
              >
                {s.label}
              </a>
              {i < SECTIONS.length - 1 && (
                <span aria-hidden="true" className="ml-4 opacity-30">
                  ·
                </span>
              )}
            </span>
          ))}
        </nav>
```

Change the `<main>` above it to `<main className="min-h-screen px-6 pt-11 pb-10">`.

Then replace every one of the five section headings — each currently `<h2 className="text-[18px] font-serif font-medium text-text-primary mb-3">` — with `<h2 className="display-entry text-text-primary mb-3">`. There are exactly five; verify with `grep -c 'text-\[18px\]' src/app/methodology/page.tsx` before and after (5, then 0).

Change the prose wrapper from `className="space-y-10 text-sm text-text-secondary leading-relaxed"` to `className="space-y-10 body-s text-text-secondary"`.

Finally replace the footer block with:

```tsx
        <ReferenceCta
          secondary={
            <Link
              href="/questions"
              className="no-underline hover:text-text-secondary transition-colors duration-150 focus-ring"
            >
              or view the complete question bank
            </Link>
          }
        />
```

and add the two imports.

The `Ready to see where you stand?` line above the old button goes. `ReferenceCta` has no slot for it, and the three sibling pages close without one — a sentence that appears on one of four otherwise-identical footers is drift, not copy.

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npx vitest run tests/unit/reference-chrome.test.ts && npm run typecheck && npm run lint
```

Expected: PASS, **16 tests** (Task 2's 10 plus the 6 above); clean typecheck and lint.

- [ ] **Step 6: Commit**

```bash
git add src/app/references/page.tsx src/app/methodology/page.tsx tests/unit/reference-chrome.test.ts
git commit -m "feat(design): sweep the references and methodology pages onto the shared chrome"
```

---

### Task 7: `/axes`

**Files:**
- Modify: `src/app/axes/page.tsx`
- Test: `tests/unit/reference-chrome.test.ts`

`/axes` is the first page in the sweep with domain marks, so it is the first that needs `getDomainMarkVar`.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/reference-chrome.test.ts`:

```ts
import AxesPage from "@/app/axes/page";
import { DOMAIN_MARK_VARS } from "@/lib/design-tokens";

describe("/axes", () => {
  it("opens on the shared header with a back-link kicker", () => {
    const container = render(createElement(AxesPage));

    const link = container.querySelector("[data-page-kicker] a")!;
    expect(link.getAttribute("href")).toBe("/references");
    expect(classes(container.querySelector("h1")!)).toContain("display-page");
  });

  it("draws every domain mark off the stepping token, not a fixed hex", () => {
    const container = render(createElement(AxesPage));

    const heads = container.querySelectorAll<HTMLElement>("[data-domain-head]");
    expect(heads.length).toBe(4);
    const used = Array.from(heads).map((el) => el.style.color);

    // A fixed hex renders the same in both modes, so a dark-ground check is
    // the only thing that would otherwise catch this — and there isn't one.
    expect(used).toEqual(Object.values(DOMAIN_MARK_VARS));
    for (const value of used) expect(value).not.toMatch(/#[0-9a-f]{6}/i);
  });

  it("sets axis names at the small display size and their questions in the caption role", () => {
    const container = render(createElement(AxesPage));

    const h3 = container.querySelector("h3")!;
    expect(classes(h3)).toContain("display-s");

    const question = container.querySelector("[data-axis-question]")!;
    expect(classes(question)).toContain("caption-italic");
    // `caption-italic` declares its own colour; layering one beside it makes
    // the rendered value depend on Tailwind's emitted order.
    expect(classes(question).some((c) => c.startsWith("text-text-"))).toBe(false);
  });

  it("routes its CTA through the primary button", () => {
    const container = render(createElement(AxesPage));

    const cta = container.querySelector("[data-reference-cta] a")!;
    expect(classes(cta)).toContain("bg-button-primary");
    expect(classes(cta)).not.toContain("bg-stone-600");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/reference-chrome.test.ts -t "/axes"
```

Expected: FAIL — `data-domain-head` matches nothing.

- [ ] **Step 3: Rewrite the page**

In `src/app/axes/page.tsx`, change `<main>` to `className="min-h-screen px-6 pt-11 pb-10"`, then replace the `<article ...>` opener through the closing `</nav>` of the domain jump nav with:

```tsx
      <article className="mx-auto max-w-reference">
        <PageHeader
          kicker="← Reference"
          kickerHref="/references"
          title="The twelve axes"
          lead={[
            "The Governance Compass measures your political philosophy across twelve independent dimensions, organized into four domains. Each axis represents a genuine tension in how human societies can be organized — not a right answer and a wrong answer, but two defensible priorities that pull in different directions.",
          ]}
        />

        <nav
          className="flex flex-wrap gap-x-4 gap-y-1 label-nav mt-6 mb-10"
          aria-label="Domain sections"
        >
          {(["economic", "power", "society", "world"] as DomainKey[]).map((key, i) => (
            <span key={key}>
              <a
                href={`#${key}`}
                className="no-underline hover:opacity-80 transition-opacity duration-150 focus-ring"
                style={{ color: DOMAIN_MARK_VARS[key] }}
              >
                {DOMAIN_COLORS[key].name}
              </a>
              {i < 3 && (
                <span aria-hidden="true" className="ml-4 opacity-30">
                  ·
                </span>
              )}
            </span>
          ))}
        </nav>
```

Replace the domain section heading with:

```tsx
              <h2
                data-domain-head
                className="label font-medium border-b border-border-secondary pb-2 mb-6"
                style={{ color: DOMAIN_MARK_VARS[domain.key] }}
              >
                {DOMAIN_COLORS[domain.key].name}
              </h2>
```

Replace the axis block's three text lines with:

```tsx
                    <h3 className="display-s text-text-primary mb-1">{axis.name}</h3>
                    <p data-axis-question className="caption-italic mb-4">
                      {axis.question}
                    </p>
                    <div className="space-y-3 body-s text-text-secondary">
                      <p>{axis.poleA}</p>
                      <p>{axis.poleB}</p>
                      {axis.note && (
                        <p className="text-xs leading-relaxed text-text-secondary border-l-2 border-border-secondary pl-3">
                          {axis.note}
                        </p>
                      )}
                    </div>
```

Replace the footer with:

```tsx
        <ReferenceCta
          label="Take the assessment"
          secondary={
            <Link
              href="/methodology"
              className="no-underline hover:text-text-secondary transition-colors duration-150 focus-ring"
            >
              or read the methodology
            </Link>
          }
        />
```

Update the imports: add `PageHeader`, `ReferenceCta`, and `DOMAIN_MARK_VARS` from `@/lib/design-tokens`. Keep `DOMAIN_COLORS` — it still supplies `.name`.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx vitest run tests/unit/reference-chrome.test.ts && npm run typecheck && npm run lint
```

Expected: PASS, **20 tests**; clean typecheck and lint.

- [ ] **Step 5: Commit**

```bash
git add src/app/axes/page.tsx tests/unit/reference-chrome.test.ts
git commit -m "feat(design): sweep the axes reference onto the shared chrome and mark tokens"
```

---

### Task 8: `/questions`

**Files:**
- Modify: `src/app/questions/page.tsx`
- Test: `tests/unit/reference-chrome.test.ts`

The densest page in the sweep: 24 `text-text-tertiary` / label sites, the off-palette `#b5942e` spoiler (D22), a hard-coded `#85735e` on the budget heading, and six bare `rounded` chips that this phase is rewriting anyway.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/reference-chrome.test.ts`:

```ts
import QuestionsPage from "@/app/questions/page";

describe("/questions", () => {
  it("opens on the shared header with a back-link kicker", () => {
    const container = render(createElement(QuestionsPage));

    expect(container.querySelector("[data-page-kicker] a")!.getAttribute("href")).toBe(
      "/references",
    );
    expect(classes(container.querySelector("h1")!)).toContain("display-page");
  });

  it("draws the spoiler advisory on the shared warning stripe, with no off-palette wash", () => {
    const container = render(createElement(QuestionsPage));

    const note = container.querySelector("[data-spoiler-note]")!;
    expect(classes(note)).toContain("border-warning");
    // D22. `#b5942e` and its rgba wash are not in the palette at all — the
    // page carried its own third hue, and a fixed low-alpha tint cannot
    // follow the surface into dark mode either way.
    expect(note.getAttribute("style")).toBeNull();
    expect(container.innerHTML).not.toContain("b5942e");
    expect(container.innerHTML).not.toContain("181, 148, 46");
  });

  it("draws every domain mark off the stepping token", () => {
    const container = render(createElement(QuestionsPage));

    const marks = Array.from(
      container.querySelectorAll<HTMLElement>("[data-domain-mark]"),
    ).map((el) => el.style.color);

    expect(marks.length).toBeGreaterThan(0);
    for (const value of marks) {
      expect(value).toMatch(/^var\(--/);
      expect(value).not.toMatch(/#[0-9a-f]{6}/i);
    }
  });

  it("puts the budget heading on the unified mark rather than a Stone literal", () => {
    const container = render(createElement(QuestionsPage));

    const budget = container.querySelector("#budget h2")!;
    // It was `style={{ color: "#85735e" }}` — Stone 600 frozen as a hex, on
    // a heading that sits beside four domain headings that now all step.
    expect((budget as HTMLElement).style.color).toBe("var(--mark-primary)");
    expect(container.innerHTML).not.toContain("85735e");
  });

  it("keeps every scoring chip on a sharp corner", () => {
    const container = render(createElement(QuestionsPage));

    const chips = container.querySelectorAll("[data-scoring-chip]");
    expect(chips.length).toBeGreaterThan(0);
    for (const chip of chips) {
      expect(classes(chip)).toContain("rounded-sharp");
      expect(classes(chip)).not.toContain("rounded");
    }
  });
});
```

Note the last assertion: `classList` holds whole tokens, so `toContain("rounded")` is false for an element carrying only `rounded-sharp`. This is the case the phase-4 constraint about substrings exists for, and it is asserted this way on purpose.

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/reference-chrome.test.ts -t "/questions"
```

Expected: FAIL — `data-spoiler-note` is null.

- [ ] **Step 3: Replace the header and spoiler**

In `src/app/questions/page.tsx`, change `<main>` to `className="min-h-screen px-6 pt-11 pb-10"`, then replace the `<article>` opener through the end of the spoiler `<div>` with:

```tsx
      <article className="mx-auto max-w-reference">
        <PageHeader kicker="← Reference" kickerHref="/references" title="Question bank" />

        <div className="mt-[26px] mb-[30px]">
          <SpoilerNote>
            This page lists every question in the assessment and shows how each
            one maps to the scoring model. If you haven&apos;t taken the quiz
            yet, we recommend{" "}
            <Link
              href="/quiz"
              className="text-text-primary font-medium underline decoration-border-primary underline-offset-2 hover:decoration-text-secondary transition-colors duration-150 focus-ring"
            >
              completing it first
            </Link>{" "}
            &mdash; seeing the questions in advance may influence your responses.
          </SpoilerNote>
        </div>
```

- [ ] **Step 4: Sweep the nav, headings and chips**

In the axis nav, replace the domain link and the axis links:

```tsx
              <a
                href={`#${domain.key}`}
                data-domain-mark
                className="label font-medium no-underline hover:opacity-80 transition-opacity duration-150 focus-ring"
                style={{ color: DOMAIN_MARK_VARS[domain.key] }}
              >
                {DOMAIN_COLORS[domain.key].name}
              </a>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 pl-3 text-xs">
                {domain.axes.map((axis) => (
                  <a
                    key={axis.id}
                    href={`#axis-${axis.id}`}
                    className="text-text-secondary no-underline hover:text-text-primary transition-colors duration-150 focus-ring"
                  >
                    {axis.name}
                  </a>
                ))}
              </div>
```

and the budget nav link:

```tsx
            <a
              href="#budget"
              className="label font-medium text-text-label no-underline hover:text-text-secondary transition-colors duration-150 focus-ring"
            >
              Chancellor&apos;s Budget
            </a>
```

Replace the four domain section headings — the `<h2 className="text-[11px] uppercase tracking-[0.08em] font-medium border-b ...">` form — with:

```tsx
              <h2
                data-domain-mark
                className="label font-medium border-b border-border-secondary pb-2 mb-6"
                style={{ color: DOMAIN_MARK_VARS[domain.key] }}
              >
                {DOMAIN_COLORS[domain.key].name}
              </h2>
```

and the budget heading at `#budget` with:

```tsx
          <h2
            className="label font-medium border-b border-border-secondary pb-2 mb-6"
            style={{ color: "var(--mark-primary)" }}
          >
            Chancellor&apos;s Budget
          </h2>
```

Replace the three scoring-chip spans — all currently `className="inline-block text-[11px] font-mono text-text-tertiary bg-surface-2 rounded px-1.5 py-0.5..."`, at the forced-choice, scaled and ministry sites — with the same class list in each case, preserving whatever trailing positioning classes that particular span already has (`ml-1.5 align-middle` on the scaled one, nothing on the other two):

```tsx
                                        <span
                                          data-scoring-chip
                                          className="inline-block mono-meta text-text-label bg-surface-2 rounded-sharp px-1.5 py-0.5"
                                        >
```

Replace the remaining `text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium` sub-labels ("Forced-choice items", "Scaled items", and the per-item pole label) with `label text-text-label font-medium`, the axis `<h3>`s with `display-s text-text-primary`, and the axis question paragraphs with `caption-italic` (dropping their `text-text-tertiary`, which `caption-italic` supplies itself).

Sweep the remaining prose: every `text-text-tertiary` left in the file becomes `text-text-secondary`. Confirm none survives:

```bash
grep -c "text-text-tertiary" src/app/questions/page.tsx
```

Expected: `0`.

- [ ] **Step 5: Replace the footer**

```tsx
        <ReferenceCta
          label="Take the assessment"
          secondary={
            <Link
              href="/methodology"
              className="no-underline hover:text-text-secondary transition-colors duration-150 focus-ring"
            >
              or read the methodology
            </Link>
          }
        />
```

Add `PageHeader`, `SpoilerNote`, `ReferenceCta` and `DOMAIN_MARK_VARS` to the imports.

- [ ] **Step 6: Run the tests to verify they pass**

```bash
npx vitest run tests/unit/reference-chrome.test.ts && npm run typecheck && npm run lint
```

Expected: PASS, **27 tests**; clean typecheck and lint. Twenty-five of those are this plan's — Task 7 left the file at 20 and the five above bring it to 25 — and two more arrived in between with the `/archetypes` review fixes recorded below, which touched `ReferenceCta` and therefore this file. `reference-chrome` ends the phase at 27.

- [ ] **Step 7: Commit**

```bash
git add src/app/questions/page.tsx tests/unit/reference-chrome.test.ts
git commit -m "feat(design): sweep the question bank onto the shared chrome and retire its off-palette hues"
```

---

### Task 9: `/compare` — both routes

**Files:**
- Modify: `src/app/compare/page.tsx`
- Modify: `src/app/compare/[profileId1]/[profileId2]/page.tsx`
- Modify: `src/components/comparison/AlignmentScore.tsx`
- Modify: `src/components/comparison/BudgetComparison.tsx`
- Test: `tests/unit/compare-chrome.test.ts`

Phase 4 converged `/compare`'s score bar and deferred the page around it. This closes that, including the legend sentence phase 4's backlog flagged as "about to go stale on purpose": Task 6 of phase 4 gave each readout its own swatch, which is what the sentence was there to explain.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/compare-chrome.test.ts`:

```ts
/**
 * @vitest-environment jsdom
 *
 * `/compare`'s chrome after the phase 5 sweep. The score bar itself converged
 * in phase 4 and is covered by results-chrome.test.ts; this file covers the
 * page around it.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AlignmentScore } from "@/components/comparison/AlignmentScore";
import { AppRouterContext, ROUTER_STUB } from "../helpers/client-component-env";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: { container: HTMLDivElement; root: Root }[] = [];

function render(element: ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  mounted.push({ container, root });
  act(() =>
    root.render(
      createElement(AppRouterContext.Provider, { value: ROUTER_STUB }, element),
    ),
  );
  return container;
}

function classes(el: Element): string[] {
  return Array.from(el.classList);
}

const comparePage = readFileSync(
  resolve(process.cwd(), "src/app/compare/page.tsx"),
  "utf8",
);
const profileComparePage = readFileSync(
  resolve(process.cwd(), "src/app/compare/[profileId1]/[profileId2]/page.tsx"),
  "utf8",
);

afterEach(() => {
  for (const { container, root } of mounted) {
    act(() => root.unmount());
    container.remove();
  }
  mounted.length = 0;
});

describe("AlignmentScore", () => {
  it("sets the headline number in the display scale, not a loose literal", () => {
    const container = render(createElement(AlignmentScore, { score: 72 }));

    const value = container.querySelector("[data-alignment-value]")!;
    expect(value.textContent).toBe("72%");
    expect(classes(value)).toContain("display-l");
    expect(classes(value)).not.toContain("text-[36px]");
  });

  it("labels the number in the mono layer at a colour that clears AA", () => {
    const container = render(createElement(AlignmentScore, { score: 72 }));

    const label = container.querySelector("[data-alignment-label]")!;
    expect(classes(label)).toContain("label-eyebrow");
    expect(classes(label)).toContain("text-text-label");
    expect(classes(label)).not.toContain("text-text-tertiary");
  });

  it("still announces the unavailable case", () => {
    const container = render(createElement(AlignmentScore, { score: null }));

    expect(container.querySelector("[data-alignment-value]")!.textContent).toBe("—");
    expect(container.firstElementChild!.getAttribute("aria-label")).toBe(
      "Overall alignment unavailable: no shared axes",
    );
  });
});

describe("/compare chrome", () => {
  it("holds the comparison column on the results measure", () => {
    // Both compare routes show the same twelve-axis breakdown the results page
    // shows, so they take the results width rather than the narrower reference
    // one. Asserted at the source: the page is a client component behind
    // useSearchParams and does not render standalone here.
    expect(comparePage).toContain("max-w-results");
    expect(comparePage).not.toContain("max-w-3xl");
    expect(profileComparePage).toContain("max-w-results");
    expect(profileComparePage).not.toContain("max-w-3xl");
  });

  it("drops the legend sentence the per-readout swatches replaced", () => {
    // Phase 4 Task 6 gave each readout its own swatch, which says what this
    // sentence said. Deleting it was the recorded preference over writing a
    // guard for copy that was already redundant.
    expect(comparePage).not.toContain("Filled dot is you");
  });

  it("draws its domain rules off the stepping token", () => {
    expect(comparePage).toContain("DOMAIN_MARK_VARS");
    expect(comparePage).not.toContain("domain[600]");
  });

  it("keeps no sub-AA tertiary text on either compare route", () => {
    expect(comparePage).not.toContain("text-text-tertiary");
    expect(profileComparePage).not.toContain("text-text-tertiary");
  });

  it("keeps no frozen Stone ramp class on either compare route", () => {
    for (const source of [comparePage, profileComparePage]) {
      expect(source).not.toMatch(/(?:text|bg|border)-stone-\d{2,3}(?![\w-])/);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/compare-chrome.test.ts
```

Expected: FAIL — `data-alignment-value` is null.

- [ ] **Step 3: Restyle `AlignmentScore`**

Replace the body of `src/components/comparison/AlignmentScore.tsx`'s returned markup:

```tsx
      <div data-alignment-value className="display-l text-text-primary">
        {hasScore ? `${score}%` : "—"}
      </div>
      <div data-alignment-label className="label-eyebrow text-text-label mt-2">
        {hasScore ? "Overall alignment" : "No shared axes to compare"}
      </div>
```

`display-l` is 34px against the 36px literal it replaces — the nearest role on the scale, and the delta's position is that a number two pixels off a named role is a literal that will drift.

- [ ] **Step 4: Sweep `/compare/page.tsx`**

Change `max-w-3xl` to `max-w-results` on line 114. Then:

- The back-link: `className="label-nav text-text-label no-underline hover:text-text-secondary transition-colors duration-150 mb-3 inline-block focus-ring"`.
- The eyebrow: `className="label-eyebrow text-text-label mb-1.5"`.
- The h1: `className="display-page text-text-primary"`.
- `CopyLinkButton`: replace its hand-rolled classes by routing through the shared primitive — `import { Button } from "@/components/Button"` and render `createElement`-free JSX `<Button variant="secondary" onClick={handleCopy}>{copied ? "Copied!" : "Copy comparison link"}</Button>`.
- The two summary labels ("Most aligned", "Most divergent"): `className="label-eyebrow text-text-label mb-2"`.
- Their rows: `className="body-s text-text-secondary mb-1"`, and the inner gap span `className="mono-meta text-text-label"`.
- The two section `<h2>`s: `className="display-m text-text-primary mb-1.5"`.
- The two captions: `className="caption-italic max-w-[60ch] mb-6"` — dropping `text-xs font-serif italic text-text-tertiary`, all four properties of which `caption-italic` sets itself.
- **Delete** the axis-breakdown caption's second sentence so it reads: `Each bar shows both profiles.` (D-note: the swatches carry the rest.)
- The domain rule: replace `style={{ color: domain[600] }}` with `style={{ color: DOMAIN_MARK_VARS[domainKey] }}` and the class list with `className="label font-medium border-b border-border-secondary pb-2 mb-2 mt-5 first:mt-0"`.
- The two `text-text-tertiary` fallbacks in the invalid-data and Suspense branches: `text-text-secondary`.

Add `DOMAIN_MARK_VARS` to the `@/lib/design-tokens` import; `DOMAIN_COLORS` stays for `.name` and `.axes`.

- [ ] **Step 5: Sweep `/compare/[profileId1]/[profileId2]/page.tsx`**

Change `max-w-3xl` → `max-w-results`; the h1 from `text-[22px] font-serif font-medium` → `display-m`; the section headings from `text-[11px] uppercase tracking-[0.08em] text-stone-800 font-medium border-b border-border-secondary pb-1.5 mb-4` → `label font-medium text-text-label border-b border-border-secondary pb-2 mb-4`; and any remaining `text-text-tertiary` → `text-text-secondary`.

`text-stone-800` is the one to be most careful with: it is near-black ink on a light ground and stays near-black on a dark one, where the panel behind it is also near-black. It is invisible in dark mode today.

- [ ] **Step 6: Sweep `BudgetComparison`**

Replace its label (`text-[11px] uppercase tracking-[0.08em] text-text-secondary font-medium`) with `label text-text-label font-medium`, its five `text-xs font-serif italic text-text-tertiary leading-relaxed` captions with `caption-italic`, and the `text-text-tertiary` on the respondent-B numeric readout with `text-text-label` — that one **is** the mono label layer, since it is a `font-mono tabular-nums` figure.

- [ ] **Step 7: Run the tests to verify they pass**

```bash
npx vitest run tests/unit/compare-chrome.test.ts tests/unit/results-chrome.test.ts tests/unit/compare-page-redirect.test.ts && npm run typecheck && npm run lint
```

Expected: PASS, all three files; clean typecheck and lint.

- [ ] **Step 8: Commit**

```bash
git add src/app/compare src/components/comparison tests/unit/compare-chrome.test.ts
git commit -m "feat(design): sweep both compare routes onto the delta's chrome and mark tokens"
```

---

### Task 10: `/groups/[groupId]` and `GroupHeatMap`

**Files:**
- Modify: `src/app/groups/[groupId]/page.tsx`
- Modify: `src/components/groups/GroupHeatMap.tsx`
- Test: `tests/unit/group-chrome.test.ts`

`GroupHeatMap` is the only place in the codebase that encodes a *scale* in Stone ramp classes — three steps of `bg-stone-100/200/300` under `text-stone-800/900`. On a dark ground every one of those is a light fill under dark ink, on a dark page. This is the first surface of this phase where the sweep is a legibility fix rather than a token tidy.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/group-chrome.test.ts`:

```ts
/**
 * @vitest-environment jsdom
 *
 * `/groups/[groupId]` and its heat map after the phase 5 sweep.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { GroupHeatMap } from "@/components/groups/GroupHeatMap";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: { container: HTMLDivElement; root: Root }[] = [];

function render(element: ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  mounted.push({ container, root });
  act(() => root.render(element));
  return container;
}

const groupPage = readFileSync(
  resolve(process.cwd(), "src/app/groups/[groupId]/page.tsx"),
  "utf8",
);

afterEach(() => {
  for (const { container, root } of mounted) {
    act(() => root.unmount());
    container.remove();
  }
  mounted.length = 0;
});

describe("GroupHeatMap", () => {
  const stats = [
    { axisName: "Tight agreement", spread: 0.1 },
    { axisName: "Some spread", spread: 0.6 },
    { axisName: "Wide spread", spread: 1.4 },
  ];

  it("encodes the three spread bands on inverting surfaces, not the Stone ramp", () => {
    const container = render(createElement(GroupHeatMap, { stats }));

    const source = readFileSync(
      resolve(process.cwd(), "src/components/groups/GroupHeatMap.tsx"),
      "utf8",
    );
    // bg-stone-100 under text-stone-800 is a light fill with dark ink. On a
    // dark page that is a light fill with dark ink ON A DARK PAGE — it does
    // not invert, and it is the only scale in the codebase spelled this way.
    expect(source).not.toMatch(/(?:text|bg|border)-stone-\d{2,3}(?![\w-])/);
    expect(container.querySelectorAll("[data-spread-cell]").length).toBe(3);
  });

  it("keeps the three bands visually distinct from one another", () => {
    const container = render(createElement(GroupHeatMap, { stats }));

    const backgrounds = Array.from(
      container.querySelectorAll<HTMLElement>("[data-spread-cell]"),
    ).map((el) => el.style.backgroundColor);

    // The point of a heat map is that the bands differ. Collapsing all three
    // onto one token would satisfy the ban above and destroy the chart.
    expect(new Set(backgrounds).size).toBe(3);
  });
});

describe("/groups/[groupId] chrome", () => {
  it("sets the group name at the entry display size", () => {
    expect(groupPage).toContain("display-m");
    expect(groupPage).not.toContain("text-[22px]");
  });

  it("puts the three panel headings in the mono label layer at an AA colour", () => {
    expect(groupPage).toContain("label font-medium text-text-label");
    // Near-black ink, frozen. In dark mode it sits on a near-black panel.
    expect(groupPage).not.toContain("text-stone-800");
  });

  it("routes the error state through the warning ink rather than a third hue", () => {
    // D16. There is no error token and the palette permits no red; the
    // severity is carried by role="alert", not by the colour.
    expect(groupPage).toContain("text-warning-text");
    expect(groupPage).not.toContain("text-red-600");
  });

  it("sharpens the invite-code chip's corner", () => {
    expect(groupPage).toContain("rounded-sharp");
    expect(groupPage).not.toContain("rounded-[4px]");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/group-chrome.test.ts
```

Expected: FAIL — `data-spread-cell` matches nothing, and the Stone ramp is still present.

- [ ] **Step 3: Rewrite `GroupHeatMap`'s band scale**

Replace the three-way class ternary at `src/components/groups/GroupHeatMap.tsx:16-19` with an inline style keyed to the surface tokens, and tag the cell:

```tsx
/** Three spread bands, tight to wide. Surfaces rather than ramp entries, so
 *  the scale inverts with the page: on a dark ground `--surface-2` is a step
 *  lighter than the panel and `--border-secondary` a step lighter again, which
 *  preserves the ordering the light-mode ramp expressed by getting darker. */
const SPREAD_SURFACES = [
  "var(--surface-2)",
  "var(--border-secondary)",
  "var(--border-primary)",
] as const;

function spreadSurface(spread: number): string {
  // Spread on [0, 2.0]; map to intensity, same arithmetic as the old
  // stone-ramp version — the cuts are on intensity, not raw spread.
  const intensity = Math.min(spread / 2.0, 1);
  if (intensity < 0.3) return SPREAD_SURFACES[0];
  if (intensity < 0.6) return SPREAD_SURFACES[1];
  return SPREAD_SURFACES[2];
}
```

and at the cell, replace the `className={...}` ternary with:

```tsx
            data-spread-cell
            className="text-text-primary"
            style={{ backgroundColor: spreadSurface(stat.spread) }}
```

Keep whatever padding, sizing and rounding classes the cell already carries; only the colour pair moves.

The threshold values above are the ones that shipped, and they are not what a first reading of this task would produce. The first draft of this step wrote `< 0.4` and `< 1.0` against raw `spread`, flagged as placeholders with the instruction that the file wins. The file did win: the original ternary computes `const intensity = Math.min(spread / 2.0, 1)` first and cuts at `0.3` / `0.6` on **intensity**, which is raw spread of `0.6` and `1.2` — so the placeholders were not merely approximate, they cut in the wrong place, and a chart retuned by a third would have looked entirely plausible. Carrying the intensity step across rather than folding it into the comparisons is deliberate: it keeps the shipped arithmetic diff-identical to the version being replaced, so the change is provably a recolour and nothing else.

That is also why the shipped spec carries a third `GroupHeatMap` case the block above does not — *preserves the original intensity cut points, tested on raw spread* — which renders at `0.59`/`0.6` and `1.19`/`1.2` and asserts the band changes across each boundary. The two cases above check that the ramp is gone and that the bands still differ; neither would have caught a retune.

- [ ] **Step 4: Sweep the group page**

In `src/app/groups/[groupId]/page.tsx`:

- The error branch: `<p role="alert" className="body-s text-warning-text">{error}</p>`.
- The loading branch: `className="body-s text-text-secondary"`.
- The h1: `className="display-m text-text-primary"`.
- The member line: `className="mono-meta text-text-label mt-1.5"`, and its `<code>` chip `className="bg-surface-2 px-2 py-0.5 rounded-sharp text-xs font-mono text-text-secondary"`.
- All three panel headings: `className="label font-medium text-text-label border-b border-border-secondary pb-2 mb-4"`.
- `max-w-3xl` → `max-w-results`, matching `/compare` — this page also draws a twelve-axis breakdown.

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npx vitest run tests/unit/group-chrome.test.ts tests/unit/group-score-bar.test.ts && npm run typecheck && npm run lint
```

Expected: PASS, both files; clean typecheck and lint.

- [ ] **Step 6: Commit**

```bash
git add src/app/groups src/components/groups/GroupHeatMap.tsx tests/unit/group-chrome.test.ts
git commit -m "feat(design): sweep the group page and make its heat map invert"
```

---

### Task 11: `/account`, `/auth/*` and `AnnotationEditor`

**Files:**
- Modify: `src/app/account/page.tsx`
- Modify: `src/app/auth/signin/page.tsx`
- Modify: `src/app/auth/signup/page.tsx`
- Modify: `src/components/annotations/AnnotationEditor.tsx`
- Test: `tests/unit/account-actions.test.ts`

Nine hand-rolled `border border-stone-600 text-stone-600 ... hover:bg-stone-100` controls across four files. Every one of them is `Button`'s `secondary` variant spelled out by hand, and every one of them freezes on the Stone ramp: `hover:bg-stone-100` is a near-white hover fill, which on a dark page flashes white under Stone 600 text.

These screens are hidden for v1 (CLAUDE.md: "Account/auth UI is hidden for v1 but the infrastructure exists"), so nothing here is on a user path today. They are swept anyway because the infrastructure is live and the next person to unhide them should not inherit nine broken controls.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/account-actions.test.ts`:

```ts
import { sourceFiles } from "../helpers/source-files";
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

describe("account and auth controls (design delta phase 5)", () => {
  const files = [
    "src/app/account/page.tsx",
    "src/app/auth/signin/page.tsx",
    "src/app/auth/signup/page.tsx",
    "src/components/annotations/AnnotationEditor.tsx",
  ];

  it("routes every control through the button primitive", () => {
    const offenders = files.flatMap((file) => {
      const text = readFileSync(resolve(process.cwd(), file), "utf8");
      // The hand-rolled secondary: an outlined Stone 600 control with a
      // near-white hover fill. Nine copies, none of which invert.
      return /border-stone-600|hover:bg-stone-100/.test(text) ? [file] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("imports the button primitive wherever it renders a control", () => {
    for (const file of files) {
      const text = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(text).toContain('from "@/components/Button"');
    }
  });

  it("keeps no frozen Stone ramp class on any of them", () => {
    const offenders = files.flatMap((file) => {
      const text = readFileSync(resolve(process.cwd(), file), "utf8");
      const match = text.match(/(?:text|bg|border)-stone-\d{2,3}(?![\w-])/);
      return match ? [`${file}: ${match[0]}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("routes every error state through the warning ink", () => {
    const offenders = files.flatMap((file) => {
      const text = readFileSync(resolve(process.cwd(), file), "utf8");
      return /text-red-\d{3}/.test(text) ? [file] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("leaves no red utility anywhere in src", () => {
    // The six sites were spread across four features. A per-file list goes
    // stale; this one closes the class of defect rather than the instances.
    const offenders = sourceFiles(resolve(process.cwd(), "src")).flatMap((file) => {
      const match = readFileSync(file, "utf8").match(/(?:text|bg|border)-red-\d{2,3}(?![\w-])/);
      return match ? [`${relative(process.cwd(), file)}: ${match[0]}`] : [];
    });

    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/account-actions.test.ts -t "phase 5"
```

Expected: FAIL — four files listed as offenders.

- [ ] **Step 3: Sweep `/account`**

Replace the four hand-rolled `<button>` controls ("Save current results to account", the two at lines ~288 and ~308, and any sibling) with `<Button variant="secondary" onClick={...}>`, keeping each handler and each `disabled` binding exactly as it is. Then:

- h1 → `className="display-m text-text-primary mb-1"`.
- The email line → `className="mono-meta text-text-label mb-8"`.
- The three `<h2>`s → `className="display-s text-text-primary mb-3"` (keeping each one's existing bottom margin).
- The `<h3>` at line ~221 → `className="label font-medium text-text-label mb-2"`.
- `text-stone-600 hover:text-stone-800 text-sm` on the profile link → `body-s text-text-secondary hover:text-text-primary transition-colors duration-150 focus-ring`.
- The checkbox's `text-stone-600` accent → `accent-[var(--mark-primary)]`, replacing the class outright.
- `hover:bg-stone-100` on the saved-profile card → `hover:bg-surface-2`.
- Both `text-red-600` alerts → `text-warning-text`.
- `max-w-2xl` → `max-w-reference`.

- [ ] **Step 4: Sweep `/auth/signin` and `/auth/signup`**

Identical treatment in both files:

- h1 → `className="display-m text-text-primary mb-6"`.
- The submit `<button>` → `<Button type="submit" variant="secondary" className="w-full">`. `w-full` is the one class verified conflict-free against the variants; nothing else goes in `className`.
- The Google button → `<Button variant="secondary" className="w-full" onClick={...}>`, replacing its hand-rolled outline.
- `text-red-600` → `text-warning-text`.
- The footer link's `text-stone-600 hover:text-stone-800` → `text-text-primary hover:text-text-secondary transition-colors duration-150 focus-ring`.
- The panel `text-text-tertiary` → `text-text-secondary`.

- [ ] **Step 5: Sweep `AnnotationEditor`**

- The save control → `<Button variant="secondary" disabled={...} onClick={...}>`.
- `text-sm text-stone-600` on the status span → `body-s text-text-secondary`.
- `text-sm text-red-600` on the error span → `body-s text-warning-text`.

- [ ] **Step 6: Run the tests to verify they pass**

```bash
npx vitest run tests/unit/account-actions.test.ts tests/unit/button.test.ts tests/unit/annotations-route.test.ts && npm run typecheck && npm run lint
```

Expected: PASS, all three files; clean typecheck and lint.

- [ ] **Step 7: Commit**

```bash
git add src/app/account src/app/auth src/components/annotations tests/unit/account-actions.test.ts
git commit -m "feat(design): route the account and auth controls through the button primitive"
```

---

### Task 12: Radar geometry migration and the last fixed hexes

**Files:**
- Modify: `src/components/comparison/ComparisonRadar.tsx`
- Modify: `src/components/groups/GroupRadar.tsx`
- Modify: `src/app/archetypes/page.tsx` — `MiniRadar`, lines 34-93
- Modify: `src/app/page.tsx:159`
- Modify: `src/lib/comparison-radar-data.ts` — re-export `TOTAL_AXES`
- Test: `tests/unit/radar-geometry.test.ts`

Phase 4 extracted `src/lib/radar-geometry.ts` and left three charts on their own inlined copies. All three are on pages this phase restyles, and all three carry the hydration mismatch that `roundCoord` closes. Phase 4's backlog is explicit that this is a call-site audit rather than an import swap, because both comparison radars take a **fraction** (`ringPolygonPoints(0.5)`) where `ringPoints` takes an **absolute** radius — swap them without converting and every ring rescales, and both charts still render plausibly.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/radar-geometry.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { sourceFiles } from "../helpers/source-files";

describe("radar geometry has one home (design delta phase 5)", () => {
  it("leaves no component with its own copy of the polar helpers", () => {
    // Five copies existed: RadarChart and MiniRadar (migrated in phase 4),
    // ComparisonRadar, GroupRadar, and the archetype page's own MiniRadar.
    // A local copy is not a style problem — each one re-inlines the trig that
    // Node and Chromium disagree about, so each one logs its own hydration
    // mismatch on a server-rendered page.
    const offenders = sourceFiles(resolve(process.cwd(), "src")).flatMap((file) => {
      if (file.endsWith("radar-geometry.ts")) return [];
      const text = readFileSync(file, "utf8");
      const match = text.match(/function (?:polarToCart|spokeAngle|scoreToRadius|ringPolygonPoints)\b/);
      return match ? [`${relative(process.cwd(), file)}: ${match[0]}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("keeps exactly one exported TOTAL_AXES", () => {
    const offenders = sourceFiles(resolve(process.cwd(), "src")).flatMap((file) => {
      if (file.endsWith("radar-geometry.ts")) return [];
      const text = readFileSync(file, "utf8");
      return /export const TOTAL_AXES/.test(text)
        ? [relative(process.cwd(), file)]
        : [];
    });

    expect(offenders).toEqual([]);
  });

  it("rounds every radar coordinate onto the shared decimal grid", () => {
    // The assertion that would have failed before the migration: a component
    // computing its own cos/sin emits an unrounded coordinate.
    const charts = [
      "src/components/comparison/ComparisonRadar.tsx",
      "src/components/groups/GroupRadar.tsx",
      "src/app/archetypes/page.tsx",
    ];

    for (const chart of charts) {
      const text = readFileSync(resolve(process.cwd(), chart), "utf8");
      expect(text).toContain('from "@/lib/radar-geometry"');
      expect(text).not.toMatch(/Math\.(?:cos|sin)\(/);
    }
  });

  it("draws every radar mark off a stepping token, never a fixed hex", () => {
    const charts = [
      "src/components/comparison/ComparisonRadar.tsx",
      "src/components/groups/GroupRadar.tsx",
      "src/app/archetypes/page.tsx",
      "src/app/page.tsx",
    ];

    for (const chart of charts) {
      const text = readFileSync(resolve(process.cwd(), chart), "utf8");
      expect(text).not.toContain("getDomainColor600");
    }
  });
});
```

The `Math.cos`/`Math.sin` ban has one known exception in the codebase — `RadarChart.tsx:202-203`, which offsets a hover tooltip that never exists during hydration. That file is not in the list above, deliberately.

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/radar-geometry.test.ts -t "one home"
```

Expected: FAIL — but **two** files, not three, and both reported as `scoreToRadius` rather than `polarToCart`. The offender list prints `match[0]`, which is the regex's *first* hit in the file, and `ComparisonRadar` and `GroupRadar` both declare `scoreToRadius` above `polarToCart`. The archetype page's copy does not appear in this case's output at all: its helper is named `radarPoints` with the trig inlined, so the `function (?:polarToCart|…)` alternation misses it and it is caught instead by the `Math.cos`/`Math.sin` ban two cases below. Three components carry the duplication; one guard sees two of them and a different guard sees the third. Worth knowing before reading a two-line failure as evidence that only two needed migrating.

- [ ] **Step 3: Migrate `ComparisonRadar`**

Delete its four local helpers (`scoreToRadius`, `spokeAngle`, `polarToCart`, `ringPolygonPoints`) and import the shared ones:

```ts
import {
  TOTAL_AXES,
  polarToCart,
  ringPoints,
  scoreToRadius,
  spokeAngle,
} from "@/lib/radar-geometry";
```

Then convert every call site. The shared helpers take their dimensions as arguments, and `ringPoints` takes an **absolute** radius:

- `spokeAngle(i)` → `spokeAngle(i, TOTAL_AXES)`
- `polarToCart(angle, r)` → `polarToCart(angle, r, CX, CY)`
- `scoreToRadius(score)` → `scoreToRadius(score, MAX_RADIUS)`
- `ringPolygonPoints(frac)` → `ringPoints(MAX_RADIUS * frac, TOTAL_AXES, CX, CY)` — **this is the conversion the fraction/absolute hazard is about.** `RING_FRACTIONS` stays a list of fractions; the multiplication moves to the call site.

Drop the `TOTAL_AXES` import from `@/lib/comparison-radar-data` in favour of the one above.

Replace both `getDomainColor600(i + 1)` marks — the filled dot and the ring — and the axis label `fill` with `getDomainMarkVar(i + 1)`, and change the import accordingly. Change the hidden-label fallback from `"var(--text-tertiary)"` to `"var(--text-label)"`.

- [ ] **Step 4: Migrate `GroupRadar`**

Same conversion. Additionally, replace the local pad-to-twelve loop with the shared normaliser — but note that `GroupRadar`'s element type is `AxisAverage` (`axisName`/`average`), not `radar-geometry`'s `RadarAxisScore` (`name`/`finalScore`), so `normaliseByAxisId` does **not** apply directly. Keep `GroupRadar`'s own pad loop and delete only its `const TOTAL_AXES = 12`, importing the shared one. Adapting the shape is a refactor of the group data pipeline and is out of this phase's scope; record it in the backlog rather than forcing it here.

Change the perimeter labels' `fill` from `var(--text-tertiary)` to `var(--text-label)`.

- [ ] **Step 5: Migrate the archetype page's `MiniRadar`**

Delete `radarPoints` and the two inline ring computations at `src/app/archetypes/page.tsx:39-93`, and rewrite the component against the shared helpers:

```tsx
function MiniRadar({ prototype }: { prototype: number[] }) {
  const outerRing = ringPoints(RADAR_R, AXIS_COUNT, RADAR_CX, RADAR_CY);
  const midRing = ringPoints(RADAR_R * 0.5, AXIS_COUNT, RADAR_CX, RADAR_CY);
  const shape = prototype
    .map((score, i) => {
      const [x, y] = polarToCart(
        spokeAngle(i, AXIS_COUNT),
        scoreToRadius(score, RADAR_R),
        RADAR_CX,
        RADAR_CY,
      );
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}
      className="w-[72px] h-[72px] shrink-0"
      aria-hidden="true"
    >
      <polygon
        points={outerRing}
        fill="none"
        style={{ stroke: "var(--border-secondary)" }}
        strokeWidth={0.6}
      />
      <polygon
        points={midRing}
        fill="none"
        style={{ stroke: "var(--border-secondary)" }}
        strokeWidth={0.5}
        strokeDasharray="1.5 1.5"
      />
      <polygon
        points={shape}
        style={{ fill: "var(--mark-primary)", stroke: "var(--mark-primary)" }}
        fillOpacity={0.14}
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </svg>
  );
}
```

The stroke widths and the dropped `opacity` attributes are mock 7c's — it draws `stroke-width="0.6"` / `"0.5"` with no opacity, where the shipped version carried `0.5`/`0.4` under `opacity={0.6}`/`{0.35}`. The fill moves from `var(--stone-600)` to `var(--mark-primary)`, which is the same value in light mode and steps to Stone 400 in dark.

One attribute went with them that the prose above does not account for: the data polygon's `strokeOpacity={0.6}`. The block is the authority here and the block does not carry it, so the prototype shape now strokes at full opacity. Whether that is 7c's intent or an accident of transcription is unresolved — the prose names only the *rings'* dropped `opacity`, and no test covers the shape's stroke either way. Recorded in "Deferred to later phases" as a thing to hold against the mock rather than silently ratified here.

**This step's `EmergenceGlyph` instruction was correctly skipped.** It read: *change `EmergenceGlyph`'s `style={{ color: "var(--stone-600)" }}` to `className="text-mark-primary"`, dropping the inline style.* By the time Task 12 ran, that instruction described code that no longer existed. Task 4 Step 7 had already moved the glyph to `style={{ color: "var(--mark-primary)" }}` and pinned it with an assertion on the inline style (`expect(glyph.getAttribute("style")).toContain("var(--mark-primary)")`), and the review fixes recorded below had given the component a `name?: "short" | "none"` prop to control whether it contributes an accessible name. Following the instruction literally would have moved the colour to a class, redded that assertion, and traded a working inline style for a class — with no benefit, since the value was already the stepping token. The shipped form is the inline style with `--mark-primary`; the glyph is a `<span>` whose only styling is `color`, and the plan's preference for a class over an inline style was never a rule, just a leftover from when the value was `--stone-600`.

- [ ] **Step 6: Sweep the home domain footer**

`src/app/page.tsx:159` — replace `style={{ borderColor: getDomainColor600(axis.id) }}` with `style={{ borderColor: getDomainMarkVar(axis.id) }}` and update the import. Phase 4's backlog routed this here; it is a drawn screen, so confirm in Step 8 that the light-mode borders are unchanged.

- [ ] **Step 7: Re-export `TOTAL_AXES`**

In `src/lib/comparison-radar-data.ts`, replace its own `export const TOTAL_AXES = 12` with a re-export, so the value has one home:

```ts
export { TOTAL_AXES } from "./radar-geometry";
```

- [ ] **Step 8: Run the tests and check for hydration errors**

```bash
npx vitest run tests/unit/radar-geometry.test.ts tests/unit/comparison-radar-data.test.ts tests/unit/home-page.test.ts tests/unit/archetypes-page.test.ts && npm run typecheck && npm run lint
```

Expected: PASS, all four files; clean typecheck and lint.

Then verify the hydration fix actually landed, which no unit test can do — **build first, because `next dev` reload-loops under a driven browser**:

```bash
npm run build && npm run start &
```

Load `/compare/<a>/<b>` and `/groups/<id>` and confirm the console carries no "didn't match the client properties" error. Count **attributes inside the diff**, not console errors: React batches a whole tree's mismatches into one error, so the same page reports "1 error" whether one attribute diverged or fifty. Before this task `/compare/[a]/[b]` logged one error carrying ten mismatched attributes; after it, zero.

- [ ] **Step 9: Commit**

```bash
git add src/components/comparison/ComparisonRadar.tsx src/components/groups/GroupRadar.tsx src/app/archetypes/page.tsx src/app/page.tsx src/lib/comparison-radar-data.ts tests/unit/radar-geometry.test.ts
git commit -m "feat(design): move the last three radars onto the shared geometry and stepping marks"
```

---

### Task 13: Guardrails and mutation testing

**Files:**
- Modify: `tests/unit/design-system-tokens.test.ts`
- Test: itself

Eleven tasks of sweeping is eleven tasks of drift surface. The guards below are what stop phase 6 — or a Dependabot-adjacent refactor — quietly reintroducing what this phase removed. Each is scoped to the directories this phase actually swept: a repo-wide ban would red on `/study`, which D21 defers.

- [ ] **Step 1: Write the guards**

Append to `tests/unit/design-system-tokens.test.ts`:

```ts
/** Every page and component this phase swept. `/study` is deferred (D21) and
 *  is deliberately absent — widening this list to it is phase 5b's job, not a
 *  tidy-up. */
const SWEPT = [
  "src/app/archetypes",
  "src/app/references",
  "src/app/axes",
  "src/app/questions",
  "src/app/methodology",
  "src/app/compare",
  "src/app/groups",
  "src/app/account",
  "src/app/auth",
  "src/components/comparison",
  "src/components/groups",
  "src/components/annotations",
  "src/components/PageHeader.tsx",
  "src/components/ReferenceCta.tsx",
];

function sweptSources(): { file: string; text: string }[] {
  return SWEPT.flatMap((entry) => {
    const path = resolve(process.cwd(), entry);
    const files = entry.endsWith(".tsx") ? [path] : sourceFiles(path);
    return files.map((file) => ({ file, text: readFileSync(file, "utf8") }));
  });
}

describe("phase 5 sweep holds (design delta D20)", () => {
  it("keeps the sub-AA tertiary text token off every swept surface", () => {
    // 3.28:1 on surface-1, in BOTH modes. The label layer takes
    // `text-text-label`; prose takes `text-text-secondary`. There is no
    // remaining use for this token on these pages.
    const offenders = sweptSources().flatMap(({ file, text }) =>
      text.includes("text-text-tertiary") ? [relative(process.cwd(), file)] : [],
    );

    expect(offenders).toEqual([]);
  });

  it("keeps the frozen Stone ramp off every swept surface", () => {
    const offenders = sweptSources().flatMap(({ file, text }) => {
      const match = text.match(/(?:text|bg|border)-stone-\d{2,3}(?![\w-])/);
      return match ? [`${relative(process.cwd(), file)}: ${match[0]}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("admits no hue outside Stone and the warning family", () => {
    // The palette is two accents. This catches a Tailwind colour utility from
    // any other family — red, green, blue, amber-by-name — which is how both
    // `text-red-600` and the `#b5942e` spoiler got in.
    const banned =
      /(?:text|bg|border)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?![\w-])/;
    const offenders = sweptSources().flatMap(({ file, text }) => {
      const match = text.match(banned);
      return match ? [`${relative(process.cwd(), file)}: ${match[0]}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("admits no raw hex on a swept surface", () => {
    // `#b5942e` and `#85735e` both shipped as inline literals on /questions.
    // A hex cannot invert, and an inline style is invisible to every
    // class-scanning guard above it.
    const offenders = sweptSources().flatMap(({ file, text }) => {
      const match = text.match(/#[0-9a-fA-F]{6}\b/);
      return match ? [`${relative(process.cwd(), file)}: ${match[0]}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("routes every swept control through the button primitive", () => {
    // A hand-rolled control is not merely inconsistent: all nine that this
    // phase replaced froze their hover fill on `bg-stone-100`, a near-white
    // flash on a dark page.
    const offenders = sweptSources().flatMap(({ file, text }) => {
      if (!/<button\b/.test(text)) return [];
      return text.includes('from "@/components/Button"')
        ? []
        : [relative(process.cwd(), file)];
    });

    expect(offenders).toEqual([]);
  });

  it("caps every swept page on a width token rather than a Tailwind size", () => {
    const offenders = sweptSources().flatMap(({ file, text }) => {
      const match = text.match(/max-w-(?:2xl|3xl|xl)(?![\w-])/);
      return match ? [`${relative(process.cwd(), file)}: ${match[0]}`] : [];
    });

    expect(offenders).toEqual([]);
  });
});
```

`max-w-md` on the two auth panels and `max-w-xl` inside the radar SVGs are the known survivors of the last guard — `max-w-md` is a modal-ish card, not a page measure, and is not matched by the pattern.

`max-w-xl` **did** red the guard, and the exclusion shipped. The two excluded files are `ComparisonRadar.tsx` and `GroupRadar.tsx`, and the exclusion is scoped to this one case by filename:

```ts
    // ComparisonRadar and GroupRadar are excluded from THIS case only. Their
    // `max-w-xl` caps an `<svg>`, not a page measure, so it is not drift of
    // the kind the width tokens exist to prevent — and minting a
    // `max-w-radar` token to satisfy a text scan would trade this drift risk
    // for a worse one: a chart cap that silently tracks a page measure.
    // Both files remain subject to every other guard in this block.
    const SVG_CAPPED = ["ComparisonRadar.tsx", "GroupRadar.tsx"];
```

The alternative — moving both to an explicit `max-w-[576px]` — was rejected for the reason given when the choice was posed: renaming an SVG's cap to a literal trades one drift risk for another, and a literal is the harder of the two to notice going stale.

- [ ] **Step 2: Run the guards**

```bash
npx vitest run tests/unit/design-system-tokens.test.ts
```

Expected: PASS. Any failure here is a site Tasks 3–12 missed; fix the site, not the guard.

- [ ] **Step 3: Mutation-test the guards**

A source-scanning guard fails by passing vacuously — a typo'd path list, a regex that matches nothing, a `sourceFiles` call rooted somewhere empty — and a green run proves nothing until each guard has been shown to redden. Apply each mutation, run the named test, confirm it **fails**, then revert.

| # | Mutation | Must redden | Result |
|---|---|---|---|
| M1 | Restore `text-text-tertiary` on one class in `src/app/questions/page.tsx` | `keeps the sub-AA tertiary text token off every swept surface` | Reddened, 1 failure |
| M2 | Restore `text-stone-800` on one heading in `src/app/compare/[profileId1]/[profileId2]/page.tsx` | `keeps the frozen Stone ramp off every swept surface` | Reddened, 1 failure |
| M3 | Restore `text-red-600` on the error span in `AnnotationEditor.tsx` | `admits no hue outside Stone and the warning family` **and** `routes every error state through the warning ink` (Task 11) | Reddened, 3 failures — both named, plus `leaves no red utility anywhere in src` |
| M4 | Restore `style={{ color: "#85735e" }}` on the budget heading in `/questions` | `admits no raw hex on a swept surface` | Reddened, 2 failures — see the note below on why the second one only counts after a separate fix |
| M5 | Replace one `<Button variant="secondary">` in `/auth/signin` with a bare `<button>` and drop the import | `routes every swept control through the button primitive` | Reddened, 1 failure |
| M6 | Change `max-w-results` back to `max-w-3xl` in `src/app/compare/page.tsx` | `caps every swept page on a width token` **and** `holds the comparison column on the results measure` (Task 9) | Reddened, 2 failures |
| M7 | Empty the `SWEPT` list to `[]` | **All six** phase-5 guards. If any still passes on an empty list it is asserting nothing. | **SURVIVED — 0 of 6.** Fixed; now 7 failures. See below. |
| M8 | Reintroduce `function polarToCart` in `GroupRadar.tsx` | `leaves no component with its own copy of the polar helpers` (Task 12) | Reddened, 1 failure |
| M9 | Re-point `SPREAD_SURFACES` so all three entries are `var(--surface-2)` | `keeps the three bands visually distinct from one another` (Task 10) | Reddened, 2 failures — plus `preserves the original intensity cut points` |
| M10 | Restore the deleted `Filled dot is you, ring marker is them.` sentence | `drops the legend sentence the per-readout swatches replaced` (Task 9) | Reddened, 1 failure |

M7 is the one that matters most and the one easiest to skip. A path list is the single point of failure for all six guards at once: if `SWEPT` names a directory that does not exist, `sourceFiles` throws and the suite is loudly red — but if it names one that exists and holds nothing relevant, every guard passes forever. The instruction as written was to run M7 and confirm **six** failures, not five.

#### M7 survived, and it could not have done anything else

This is the single most valuable result of the phase, so it is recorded at length rather than as a table cell.

Emptying `SWEPT` to `[]` reddened **none** of the six guards. All six passed, in single-digit milliseconds, having read zero files. The reason is mechanical and it is visible in the shape every one of them shares:

```ts
const offenders = sweptSources().flatMap(({ file, text }) => /* … */);
expect(offenders).toEqual([]);
```

`[].flatMap(fn)` is `[]`, and `expect([]).toEqual([])` passes. There is no arrangement of those six assertions under which an empty file list produces a failure — the expected outcome the step demanded was not merely unobserved, it was **unreachable**. A run that had gone looking for six failures and found zero would have been read as "the mutation did not apply"; a run that had not been done at all would have left a guard block with a silent single point of failure in it, shipping green forever.

The generalisable form: **a guard that reports offenders as a list and asserts the list is empty cannot distinguish "nothing is wrong" from "nothing was checked."** Every source-scanning guard in this repo is written that way, because it is the shape that produces a useful failure message. The emptiness is not a flaw in the shape; it is a flaw in relying on the shape alone.

The fix has two halves, both shipped:

1. `sweptSources()` throws when it resolves to no files, so the vacuity check lives once in the function all six share rather than being restated in each:

```ts
  if (sources.length === 0) {
    throw new Error("SWEPT resolved to no files — every guard below would pass vacuously");
  }
```

2. A seventh test, first in the block, pins the specific files the sweep must reach — `expect(swept.length).toBeGreaterThanOrEqual(20)` plus eight named anchors, chosen as the files this very mutation table targets. A count alone would pass on twenty of the wrong files; naming the anchors is what makes the evidence from M1–M10 transfer to the guards that shipped.

With both in place, M7 produces **7 failures**: the anchor test plus all six guards, since the throw propagates through each. Re-measured after the fix and confirmed.

One more row is worth reading twice. M4 reddens two tests today, but its second — `/questions`' *puts the budget heading on the unified mark rather than a Stone literal* — was itself dead when this table was written: it asserted `expect(container.innerHTML).not.toContain("85735e")`, and jsdom normalises a hex in an inline style to `rgb()` before it reaches `innerHTML`, so the string could never appear whatever the source said. That was caught separately and is recorded under "Review fixes". Two dead assertions in a phase whose own guard block also passed vacuously is not a coincidence — it is the same failure mode arriving three times, and it is the argument for running mutations against *every* negative assertion rather than only against the ones that look load-bearing.

Record the result of every row. A mutation that does **not** redden is a finding, not a formality — and check that the mutation applied as valid syntax before recording it as survived. A broken template literal makes vitest report no failures at all, which a harness grepping for failed-test lines will happily record as "survived".

- [ ] **Step 4: Commit**

```bash
git add tests/unit/design-system-tokens.test.ts
git commit -m "test(design): guard the phase 5 sweep against reintroduction"
```

---

## Review fixes

Five commits on this branch correspond to no task above, and one finding landed inside two task commits. They are recorded here because without them this document reads as though Tasks 3–5 rebuilt `/archetypes` correctly on the first pass, and they did not — two independent reviews of that rebuild returned twelve issues between them, every one of which rendered without erroring and was therefore invisible to a green suite. That is the phase's second lesson after M7: **the archetype rebuild's defects were all in the class "renders fine, looks wrong", which is exactly the class a unit suite is blind to.** Both review passes were worth more than any additional assertion written in advance would have been.

**`a847cf3` — the zebra pair and the `:target` rail.** Five visual defects. The `:target` geometry is written up at Task 5 Step 5 above. The zebra was the wrong pair *and* the wrong polarity: Task 4's ternary gave odd rows `bg-surface-2` and even rows no background class at all, and an unstyled row is not white — it inherits `body { background: var(--surface-3) }`, Stone 100. The band therefore alternated Stone 100 / Stone 50 and read *lighter* than the page, where issue #136 specifies white / Stone 50 and the mock draws the band darker. Even rows are now explicitly `bg-surface-1`, which inverts correctly too (dark mode's `--surface-1` `#2a2118` is lighter than its `--surface-2` `#1f1812`). `TraditionsProse` was left on the inherited `text-[13px] leading-relaxed` while `Internal tension.` directly above it moved to `body-s` — two consecutive body paragraphs differing by 0.5px and 0.025 line-height read as misregistration rather than as a step, and 13px sits below the 13.5–14.5px band #136 sets; both are `body-s` now. Task 4's axis-position rewrite introduced a `min-[480px]`, a second responsive breakpoint in a codebase whose stated single breakpoint is `min-[560px]`. And the header block and the legend/index block shipped as two adjacent `mx-auto max-w-reference px-6` siblings with nothing full-bleed between them — a Task 3 / Task 4 seam rather than a design, now merged into one, with the band still a separate child of `<main>` because that is what the full-bleed zebra needs.

The zebra assertion this plan specified — `expect(classes(rows[0])).not.toContain("bg-surface-2")` — could not have caught any of it: it passes equally on `bg-surface-1`, on `bg-surface-3`, and on no class at all. It asserts the positive class now, and a new case pins both entry body paragraphs to the same role.

**`2a3a686` — the glyphs announcing the tier twice.** `EmergenceGlyph` named itself `"<label>. <tooltip>"`, and `EMERGENCE_TOOLTIPS.refined` alone is 215 characters. The glyph sits inside each index `<a>`, so all twelve links in `nav[aria-label="Archetype list"]` computed a ~240-character accessible name — pulling up a link list on that nav gave twelve near-identical walls of prose instead of twelve archetype names. The entry heading was worse: it drew the glyph and then, a line and a half below, a `<p data-entry-tier>` printing the same tier in words. That is precisely the double-announce the provenance legend's own test in Task 4 Step 1 guards against, and its comment — *"the glyphs that DO carry a name are the ones in the index and the entry headings, where nothing else says what the mark means"* — stopped being true the moment D19 moved the tier name into the entry. The component also set `title` and an identical `aria-label` on a `role="img"`; `aria-label` wins the name computation but NVDA and JAWS surface `title` as the accessible *description*, so several configurations read the long string and then read it again. `EmergenceGlyph` now takes `name?: "short" | "none"`: the index carries the tier name alone, the entry heading and the legend carry none, and `title` stays at all three as a mouse affordance that is deliberately never the accessible name.

Three more things landed in the same commit. `ReferenceCta` gained an optional `secondaryLabel`, because `/archetypes` had replaced a `<nav aria-label="Page navigation">` with this component's `<p>` and silently removed a landmark — on the one consumer whose footer carries three links; the single-link consumers pass nothing, since a landmark around one link is noise. `numberFor` was deleted: it existed because the pre-7c index was tier-grouped, so an archetype's array position differed from its display number, and the flat index made it an identity map that still carried a live trap — `String(numberFor.get(id))` on a `number | undefined` renders the literal `"undefined"` rather than failing, and `tsc` accepts it because `String()` accepts anything. The 59-line axis-position disclosure moved into a local `AxisPositions` component, and its axis lookup moved to a module-scope `axisById` map: `axes.find()` inside the inner map ran 144 times per page render, and its `!` would have thrown at render time the moment axis ids stopped being a dense 1..12. Verified behaviour-preserving by diffing the `outerHTML` of all twelve rendered `<details>` against the pre-extraction page.

Two test defects went with it. The index-glyph case asserted `aria-label.length > 100`, which enshrined the defect rather than guarding anything — length is the least meaningful property of an accessible name — and now pins the name itself. And Task 4 Step 1's flat-index case asserted `container.querySelectorAll("[data-index-tier-group]").length === 0` against an attribute **that has never existed anywhere in this repo**: the grouped index it was guarding against used a bare `<div key={tier}>`, so no plausible reintroduction would invent that hook and the assertion could not fail against any implementation. It now asserts that the grid contains no heading or paragraph elements, which reds when a tier heading is put back.

**`97b649e` — two dead hex assertions.** Task 8's spec asserted `expect(container.innerHTML).not.toContain("b5942e")` and `not.toContain("85735e")`. jsdom normalises a hex in an inline style to `rgb()` before it reaches `innerHTML`, so neither string could ever appear whatever the source said; both assertions were incapable of failing. Proven rather than argued: reverting the forced-choice card's border to `DOMAIN_COLORS[domain.key][600]`, which is literally `#85735e`, left the suite green. They assert `"133, 115, 94"` and `"181, 148, 46"` / `"rgba(181, 148, 46"` now, which red on exactly that mutation, and a `var()` reference passes through unresolved so the positive assertions beside them do not collide. The same commit corrected a comment in `results-chrome` claiming `/axes` and `/questions` keep the fixed accessor deliberately — Tasks 7 and 8 swept both, so it had stopped being true within this phase.

This is the mutation-blindness lesson in a second costume: a negative assertion phrased in a representation the test environment never produces is indistinguishable from a passing one.

**`b981e08` — a hover that changed nothing.** Task 11 Step 3's literal instruction sent the saved-group card's `hover:bg-stone-100` to `hover:bg-surface-2`. The card *rests* on `bg-surface-2`, so the hover state resolved to the colour it already was and the affordance became invisible. Nothing in the suite inspects a `:hover` variant, so it would have shipped silently. It is `hover:bg-surface-1`, which lifts in both modes, and the card gained the `focus-ring` it was missing as a link. Recorded because the instruction was followed exactly and produced a defect: a per-site colour swap table cannot be applied without knowing what each site sits on.

**`5e82d93` — the last sub-AA ink.** `ComparisonRadar`'s hover tooltip kept `var(--text-tertiary)`, 3.28:1 in both modes. Task 12 Step 3 named the *hidden-label fallback* and the perimeter labels and said nothing about the tooltip, so it was left behind. It takes `--text-label` like the labels beside it. The directory-wide guards in Task 13 do not catch this one: they scan for the Tailwind class `text-text-tertiary`, and this was the CSS variable spelled inside a `fill` attribute.

**D16's premise.** Amended in the decision itself above rather than only here, because a merged plan is read for its decisions and a false premise left standing in one is worse than no premise. Short form: the claim that all six `text-red-600` sites already carried `role="alert"` or an `aria-live` region was false at three — `/groups/[groupId]`, `/auth/signin`, `/auth/signup` — and `role="alert"` was added at each as part of the swap.

**Two smaller drifts from the task text, for completeness.** Task 10's file list omits `src/components/groups/GroupScoreBar.tsx`, which the sweep had to touch anyway: it carried a `text-text-tertiary` and lives under `src/components/groups`, which Task 13's `SWEPT` list covers wholesale. And `ReferenceCta`'s doc comment does not read as Task 2 Step 4 wrote it — the draft spelled the markup it replaces as the literal classes `bg-stone-600 text-white`, which Task 13's ramp guard would have matched *in the comment*, since that guard is a whole-file text scan with no comment-stripping step. The shipped comment names them in prose instead, and says so. A guard that reads comments is a guard whose prose has to obey it.

---

### Task 14: Verification, the deferred issue, and the PR

**Files:**
- Modify: this plan document
- Create: GitHub issue for phase 5b

- [ ] **Step 1: Run all five gates**

```bash
npm test && npm run typecheck && npm run lint && npm run build && npm run test:e2e
```

Expected: all green. Baseline was 793 unit tests across 64 files; this phase adds `reference-chrome`, `archetypes-page`, `compare-chrome` and `group-chrome` plus cases appended to four existing files, so the count rises and no existing test may fall. **Final state: 886 tests across 68 files.** Four new files, 93 new cases — 27 in `reference-chrome`, 28 in `archetypes-page`, 8 in `compare-chrome`, 10 in `group-chrome`, and the remaining 20 appended to three existing files — `design-system-tokens` (+9: two in Task 1, seven in Task 13), `account-actions` (+7) and `radar-geometry` (+4). `results-chrome` and `quiz-chrome` were edited but gained no cases.

Three environment traps, each of which has cost this project an afternoon before:

- **Run `npm ci` first if the lockfile moved.** A stale `node_modules` makes a local run disagree with CI.
- **A wall of e2e failures is usually another dev server**, not the diff. Check for a stray `next dev` on port 3000 before bisecting.
- **The auth-backed e2e specs require port 3000** — `NEXTAUTH_URL` is hard-coded, so `PLAYWRIGHT_PORT` reds them.

- [ ] **Step 2: Verify in a browser, in both colour schemes**

This is not optional and it is not substitutable by a test. jsdom computes no custom properties, so **every dark-mode claim in this plan is unverified until this step runs**. Build first — `next dev` reload-loops under a driven browser and resets React state:

```bash
npm run build && npm run start
```

Walk `/archetypes`, `/references`, `/axes`, `/questions`, `/methodology`, `/compare?a=…&b=…`, `/groups/<id>`, `/account`, `/auth/signin` in light and then in dark (DevTools → Rendering → Emulate `prefers-color-scheme`). Specifically confirm:

1. `/archetypes` zebra rows run edge-to-edge while the prose stays on 660px, in both modes.
2. The archetype entries' mini radars step tone in dark — the shape lightens, it does not stay Stone 600.
3. `GroupHeatMap`'s three bands remain ordered and distinguishable in dark. This is the sweep's highest-risk change: the light-mode ramp encoded intensity by getting *darker*, and the surface tokens encode it by getting *lighter*.
4. The four `ReferenceCta` buttons are Stone 300-on-ink in dark, not brown-on-brown.
5. The `text-warning-text` error states are legible on the dark panel (`--warning-text` steps to `#fbbf24` in dark, so they should read as amber rather than brown).
6. `/questions`'s spoiler note has a stripe and no wash in both modes.

Save screenshots outside the repo so the working tree stays clean.

- [ ] **Step 3: Open the phase 5b issue**

D21 deferred `/study` and the deferral must be a tracked issue, not a paragraph in a merged plan:

```bash
gh issue create \
  --title "Design delta phase 5b: the synthetic study section" \
  --label design,enhancement \
  --body "$(cat <<'EOF'
Split out of #136. Phase 5 covered mock 7c and every other undrawn page; `/study/*` was deferred because it is 11,078 lines across 32 files — roughly six times the rest of that phase combined — and is a self-contained section with its own spec.

**Scope:** the four pages under `src/app/study/` and the ~28 components under `src/components/study/`.

**Carry over from phase 5:**
- `text-text-tertiary` is banned on every swept surface; `/study` is the last holdout. Widen the `SWEPT` list in `tests/unit/design-system-tokens.test.ts` as each directory lands.
- The same applies to the raw-hex, non-palette-hue, hand-rolled-button and page-width guards in that file.
- `src/components/study/Radar.tsx:8-19` inlines a fifth `polarToCart` as `polarToXY`, with the same hydration mismatch phase 5 Task 12 closed elsewhere. `/study/patterns` is prerendered by Node and hydrated by Chromium, which is the worst case for it — measured at fifteen mismatched attributes.
- `/study` pages use `max-w-xl` and a `text-[clamp(32px,5vw,38px)]` h1; the delta's roles are `max-w-reference` and `display-page`.
- `study/page.tsx:92` draws a 10px label, below the delta's 11px floor.

**Spec:** `docs/superpowers/specs/2026-09-08-design-system-delta-design.md`, decision D6.
EOF
)"
```

Then update the spec's phasing table so the roadmap reflects reality — phase 5 splits into 5 and 5b, and phase 6 (#137) now follows 5b.

- [ ] **Step 4: Reconcile this plan with what shipped**

Before opening the PR, re-read this document against the diff. Plan and artifact drift apart in predictable ways — a comment describing an approach that was replaced, an assertion that verifies less than its title claims, a decision that was revised mid-task without being written down. Correct this file where it no longer describes the code, and note any decision that changed in the PR description.

Three places in this plan were written as instructions to *read the code and follow it* rather than as fixed values, and each needed its actual outcome recorded. **All three are now resolved in place** and none of them still hedges:

- `GroupHeatMap`'s spread thresholds (Task 10 Step 3) — the cuts are on `intensity`, not raw spread, at `0.3` / `0.6`. The placeholders were not approximate; they cut in the wrong place.
- The `:target` selector's real form (Task 5 Step 5) — the naive rename shipped first and was insufficient, because Task 4 had made the row full-bleed. The rule rides `[data-entry-inner]` and paints `--mark-primary`.
- The `max-w-xl` exclusion (Task 13 Step 1) — it redded, and the exclusion shipped for `ComparisonRadar.tsx` and `GroupRadar.tsx`.

Beyond those three, this pass corrected: five stated test counts that no longer matched the file; Task 12 Step 2's expected failure (two files, not three, and reported under a different helper name); Task 12 Step 5's `EmergenceGlyph` instruction, which was correctly skipped and now says so; Task 4's lead-in comment, which named the wrong entry; D16's false premise; and the ten-row mutation result, whose M7 row demanded an outcome that was mechanically unreachable. The work with no task attached is written up under "Review fixes" above.

- [ ] **Step 5: Open the PR**

```bash
git push -u origin feat/design-delta-reference
gh pr create --title "feat(design): design system delta — phase 5 archetype reference and remaining pages" --body "..."
```

The body should carry: `Closes #136`, a link to the new phase 5b issue, the mutation table from Task 13 Step 3 with any row that failed to redden called out honestly, the two-mode screenshots, and an explicit list of the decisions this phase made beyond the issue's scope list (D16–D22 above) — particularly D16, which changes what an error message looks like, and D21, which narrows the issue's own scope.

---

## Deferred to later phases

Recorded here so they are not rediscovered as bugs:

- **`/study/*` is phase 5b.** D21, and now its own issue (Task 14 Step 3). Every guard added in Task 13 is scoped around it; widening the `SWEPT` list is how 5b will be measured.
- **`GroupRadar` still carries its own pad-to-twelve loop.** `normaliseByAxisId` does not apply: `GroupRadar`'s element type is `AxisAverage` (`axisName`, `average`) while the shared normaliser's is `RadarAxisScore` (`name`, `finalScore`). Reconciling them is a change to the group comparison data pipeline, not to a chart, and it wants its own task. Task 12 removed the duplicated *geometry* and left this. (Re-verified against the shipped file: the `padded` construction is still there, and it is still the only thing in the component that is not shared.)
- **Two chart files sit outside the page-width guard.** `ComparisonRadar`'s `max-w-xl` and `GroupRadar`'s are SVG caps, not page measures, and are excluded by filename from Task 13's *caps every swept page on a width token* case. The shape of that exclusion matters more than the exclusion: if a third chart appears with its own SVG cap, **the exclusion list grows rather than the guard changing**. Minting a `max-w-radar` token to satisfy a text scan would trade a small drift risk for a worse one — a chart cap that silently tracks a page measure — and moving both to `max-w-[576px]` literals only hides them from the scan. Both files remain subject to every other guard in the block.
- **Task 13's `<button>` guard is per-file, not per-element, and that is how the defect comes back.** The check is: does this file contain `<button` and, if so, does it also import `Button`? A file that already imports the primitive and then grows a new hand-rolled `<button>` beside it passes. That is not a hypothetical shape — it is the *likely* one, because every file this phase swept now imports `Button`, so the guard is disarmed on exactly the files most likely to gain another control. It catches a wholly hand-rolled file, which is what all nine replaced sites were, and nothing finer; a per-element version needs a parse rather than a scan. Stated here rather than only in the test's own comment because whoever reintroduces the defect will read this document, not that comment.
- **The archetype prototype polygon lost its `strokeOpacity={0.6}`.** Task 12 Step 5's code block rewrote `MiniRadar`'s data polygon without it, and it shipped that way — the shape now strokes at full opacity. The step's *prose* accounts only for the two ring polygons' dropped `opacity` attributes, so it is genuinely unclear whether the code block or the prose was authoritative against mock 7c, and no test covers the shape's stroke either way. Check the rendered entry against 7c and either restore the attribute or write down that 7c draws it solid; do not leave it resolved by whichever of the two the next reader happens to believe.
- **`PANEL` is still spelled out at 25 sites across 14 files.** `bg-surface-1 border border-border-secondary rounded-sharp`, named once in `ResultsView` and repeated everywhere else. Phase 4 deferred it; this phase touched nine of those files and deliberately did not fold it in, because promoting it to an `@utility` touches five files phase 5 has no other reason to open — including quiz components, which phase 3 owns.
- **Tailwind's content scanner reads `docs/**/*.md`.** Discovered in Task 1: `max-w-reference` compiled into the production stylesheet with zero source consumers, because this plan document names the class sixteen times and Tailwind v4's auto-detection treats the repo's markdown as a content source. Every class name written in any of the five plan docs is a candidate, so the shipped CSS carries rules nothing renders. Harmless to correctness but it means **a test can never prove a class is absent by grepping the emitted stylesheet** — Task 13's guards scan source for exactly that reason. Fixing it is a `@source` directive in `globals.css`, which is a build-config change and wants its own task.

- **Bare `rounded` is still unswept.** Issue #139. This phase sharpened only the corners on lines it was already rewriting.
- **`RadarChart`'s vertex tooltip remains untested and keyboard-unreachable.** Predates phase 4, untouched here.
- **The `sourceFiles`-based test harness is now duplicated across six specs.** `render`, `classes` and the `afterEach` cleanup trio appear in `reference-chrome`, `archetypes-page`, `compare-chrome`, `group-chrome`, `results-chrome`, `quiz-chrome`, `footer-chrome`, `home-page` and `account-actions`. Phase 4 deferred the extraction for the reason that still holds — moving it mid-phase touches every one of those files at once and makes a red suite ambiguous. This phase added four more copies, which moves it from "worth doing" to "do it before phase 6".

---

## Self-Review

Checked against `docs/superpowers/specs/2026-09-08-design-system-delta-design.md` and issue #136:

- **Issue scope, bullet by bullet.** 660px column, `label-nav` back link, `display-page` h1, two 15px intro paragraphs → Tasks 1, 2, 3. Spoiler note with 2px `--warning` border and serif italic lead-in → Tasks 2, 3. Provenance legend with three glyph/tier/prose rows → Task 4. Two-column index with mono `NN`, 13px sans name, tier glyph → Task 4. Full-bleed zebra entries, Stone 200 separators, `display-entry` names, 72px mini radar, mono `▸ Axis positions` → Tasks 4, 12. Footer ink CTA above tertiary nav → Task 5. Extend by inference to the remaining undrawn pages → Tasks 6–11, minus `/study` per D21. "Write the plan first" → this document. Five gates plus the `:target` check → Tasks 5 and 14.
- **The one thing not to redesign.** Issue #136 is explicit that `Internal tension.` and `Traditions.` stay serif italic in Stone 900 over sans prose, and that the description/tension/traditions paragraphs stay sans at 13.5–14.5px. Task 4 keeps all five — 14.5px on the description, `body-s` (13.5px) on the other two — and asserts the lead-ins are `font-serif italic` and carry no `label` class, which is the mutation that would turn the reference into a spec sheet.
- **Spec deltas.** 01 (mono layer, serif scale) → Tasks 2–11. 02 (near-square corners) → Tasks 8, 10. 03 (buttons) → Tasks 2, 5, 9, 11. 04 (rules carry structure) → the zebra band in Task 4, the domain rules in Tasks 7–9. 06 (dark mode inverts) → Tasks 10, 12, and the whole of D16/D20. 05 (paired axis scale) landed in phase 4 and is untouched here.
- **Phase 4's routed-forward items.** `/compare` and `/groups` layouts → Tasks 9, 10. Home footer `getDomainColor600` → Task 12. `ComparisonRadar`/`GroupRadar` geometry and hydration → Task 12. Container width tokens → Task 1. `/compare`'s legend sentence → Task 9. Two exported `TOTAL_AXES` → Task 12. `PairedAxisScale` outside every guard's scan → Task 13's `SWEPT` list does not add it either; it is a shared primitive with consumers in three features, and phase 4's reasoning for leaving it out has not changed.
- **Placeholder scan.** No TBDs. Two steps deliberately instructed the implementer to read a value out of the existing code rather than restating it — `GroupHeatMap`'s spread thresholds and the `max-w-xl` exclusion decision — and each said explicitly that the file wins and that the outcome must be written back into this plan in Task 14 Step 4. That is a different thing from a placeholder: the instruction is complete, the value is the code's. A third was written that way in the first draft and was made concrete before implementation: the `:target` rules at `globals.css:311-318`, with Task 5 naming both selectors.

  **Reconciled after implementation, and the scorecard is mixed.** Both read-the-code instructions were honoured and both outcomes are now written into the steps themselves, so nothing in this document still hedges. But the third one — the one that *stopped* being a read-the-code instruction and became a concrete rewrite — is the one that shipped a defect. Naming both selectors made the step look complete, and it was complete about the selector and silent about the declaration body, which is where the problem was. The self-review treated "concrete" as strictly better than "go and look", and on this evidence it is not: a step that says *read the file* keeps the implementer's eyes on the file, and a step that spells the answer out invites a find-and-replace. Weigh that next time before promoting an instruction to a literal.
- **One bug caught in self-review, recorded because the next reader will reach for the same thing.** The first draft's provenance legend rendered `EMERGENCE_TOOLTIPS[tier]`, which is the only exported per-tier prose and is therefore the obvious pick — but it is the 40-word form written for the glyph's `title`, so three of them in a column replace mock 7c's three lines with three paragraphs. Task 4 Step 3a names the short form as `PROVENANCE_BLURB` and the test asserts both halves: the short body is present, and the tooltip's distinctive sentence is not.
- **Type consistency.** `PageHeader`'s props (`kicker`, `kickerHref?`, `title`, `lead?: string[]`) are used under those names in Tasks 3, 6, 7, 8. `SpoilerNote`'s (`leadIn?`, `children`) in Tasks 3 and 8. `ReferenceCta`'s (`label?`, `secondary`) in Tasks 5, 6, 7, 8 — note `secondary` is required and takes `null` explicitly, which Task 6's `/references` call passes. `spreadSurface(spread: number): string` (Task 10) is used only in that task. The `radar-geometry` signatures consumed in Task 12 — `spokeAngle(index, total)`, `polarToCart(angle, radius, cx, cy)`, `scoreToRadius(score, maxRadius)`, `ringPoints(radius, total, cx, cy)` — match the shipped module exactly, including `ringPoints`' absolute-radius convention, which is the one the conversion in Steps 3 and 4 exists to honour.

**Known gap, stated rather than papered over:** the same one phase 4 recorded, and this phase widens it. No unit test covers the *rendered* dark-mode appearance of anything here — jsdom computes no custom properties. The tokens are asserted on both sides in the stylesheet, the call sites are asserted to name the stepping token rather than a hex, and the composition of the two is verified by hand in Task 14 Step 2. `GroupHeatMap` is the sharpest instance: Task 10's tests assert that its three bands *differ*, which is a real assertion, but whether the reordering still reads as a heat map on a dark ground is a question only Step 2 answers. That is why Step 2 is not optional.
