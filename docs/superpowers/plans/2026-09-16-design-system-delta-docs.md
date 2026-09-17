# Design System Delta — Phase 6: Docs Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `docs/system_proposal/governance_compass_design_spec.md` and `CLAUDE.md`'s Design Context describe the system that shipped, and pin them there with a drift guard so they cannot silently rot again.

**Architecture:** Phase 6 is the last phase of the visual redesign delta (#137, spec `docs/superpowers/specs/2026-09-08-design-system-delta-design.md`). It is deliberately last so the docs describe what shipped rather than what was proposed. The work is one new guard spec (`tests/unit/design-docs.test.ts`) that reads `globals.css` and both documents and fails when they disagree, followed by section-by-section rewrites that turn the guard green. One source change rides along: `--text-tertiary` is retired, which phase 5b deferred here.

**Tech Stack:** Markdown, vitest (`node:fs` source guardrails in the established `tests/unit/design-system-tokens.test.ts` idiom), Tailwind v4.3.3 token layer in `src/app/globals.css`.

---

## Scope, as decided

Issue #137's checklist, plus three decisions taken before this plan was written:

1. **Docs-only, plus `--text-tertiary` retirement.** The other item phase 5b deferred to phase 6 — extracting the `render`/`classes`/`afterEach` harness duplicated across **16** unit specs (it was "nine" when first recorded) — becomes its own ticket. Task 12 opens it. It is a wide test-only refactor and a red suite in the middle of a docs phase is ambiguous, which is the same reason 5b gave for deferring it.
2. **Full reconciliation of the design spec, not just the six deltas.** The document's `PARTIALLY OUTDATED` banner already flags drift that predates the delta (10 ministries vs 7, Georgia vs Source Serif 4, contour mark vs radar rose, results-page ordering). Fixing the six deltas and leaving that standing would produce a document that still has to be read with a caveat, which is the condition phase 6 exists to end. The banner comes off in Task 10 — and it only comes off because Tasks 4–9 earned it.
3. **The zip is the canonical handoff copy.** `docs/gov_compass_redesign.zip` is already git-tracked. Nothing new enters the repo; Task 10 records the unzip command and the three reference filenames. The extracted copy currently at `/tmp/pp-handoff-phase5` is scratch and is not preserved.

### What this phase does NOT touch

- `docs/system_proposal/governance_compass_results_ui_spec.md` carries its own `PARTIALLY OUTDATED` banner and phase 4 redesigned the page it describes. It is **out of scope** — #137 names the design spec and `CLAUDE.md` only. Task 12 opens a ticket rather than widening the phase silently.
- `/study`'s delta 04 gap, the three `/study` layout defects, and the SVG `rx` question are #154. The frozen `var(--stone-600)` mark tones in `comparison/` and `groups/` are #155. Both stay open; Tasks 4 and 6 *describe* them as known debt in the spec rather than fixing them.
- Issue #139 (bare `rounded`, radius namespace) and #141 (mobile nav) stay open. Task 6 cites #139 where the spec's radius section would otherwise overclaim.

---

## The shipped truth, with citations

Every factual claim Tasks 2–10 make has to come from this table, not from memory. Verify a citation before writing prose that leans on it.

| Fact | Evidence |
| --- | --- |
| Radius is one value, `--radius: 2px`; `rounded-sharp` is the utility | `src/app/globals.css:74`, `:254` |
| Circles and pills are exempt, by name not by pattern | `tests/unit/design-system-tokens.test.ts:211` (`ALLOWED_RADII` = `50%`, `999px`, `var(--radius)`) |
| Primary button is Stone 900 ink, Stone 50 text, hover Stone 800 | `src/app/globals.css:79-81` |
| Primary inverts to Stone 300 fill / Stone 900 text in dark, hover Stone 200 | `src/app/globals.css:161-163` |
| Three variants, and `className` cannot beat one | `src/components/Button.tsx:29-39`, `:45-57` |
| Stone 600's surviving jobs: focus ring, progress fill | `src/app/globals.css:71`; `src/components/quiz/ProgressBar.tsx` (`bg-stone-600` on the fill) |
| Forced-choice selection is a 1px `--rule-strong` border, **not** 2px Stone 600 | `src/components/quiz/ForcedChoiceCard.tsx:59-69` |
| Unselected forced-choice cards drop to `opacity-60` | `src/components/quiz/ForcedChoiceCard.tsx:67` |
| Selection also carries a text marker, so the signal is not border-only | `src/components/quiz/ForcedChoiceCard.tsx:106` (`data-selected-marker`) |
| Quiz `Next` is `primary` (ink) — spec D1 | `src/components/quiz/QuizFlow.tsx:334`, `:409` |
| Budget confirm is `primary`, full width | `src/components/quiz/BudgetSimulator.tsx:209` |
| Type scale is `@utility` roles, not `--text-*` | `src/app/globals.css:386-541` |
| The scale: `display-xl` 58, `display-page` 40, `display-l` 34, `display-m` 26, `display-entry` 22, `display-s` 17 (all serif 500); `body-lead` 17, `body-s` 13.5, `body-xs` 12 (sans) | `src/app/globals.css:386-461` |
| Mono layer: `label` .12em, `label-eyebrow` .14em, `label-nav` .10em, `label-tight` .02em, all 11px uppercase; `mono-meta` 11px .06em **sentence case**; `control` 12px/500 .12em; `wordmark` .16em, `wordmark-sm` 11px .13em; `caption-italic` 13.5px serif italic | `src/app/globals.css:463-541`, `:596-602` |
| 11px is the floor for every role in the scale | `src/app/globals.css:381-383` |
| `--text-label` steps Stone 700 → Stone 500; `--text-tertiary` does not step | `src/app/globals.css:29-37`, `:144` |
| Why it steps: Stone 500 is 2.73:1 on the light page ground, under even the 3:1 large-text floor (spec D7) | `src/app/globals.css:29-36`; spec `2026-09-08-design-system-delta-design.md` D7 |
| Rules are a two-step pair, `--rule-strong` / `--rule-hairline`, and both invert | `src/app/globals.css:44-52`, `:150-153` |
| Section boundaries use `--border-secondary` (Stone 200 light / Stone 900 dark) | `src/components/results/AxisBreakdownCard.tsx:67` |
| Strong rule under a card's own header; hairline above the subordinate row | `src/components/results/ArchetypeCard.tsx:174`, `:270` |
| 2px left edge on a callout | `src/components/results/ResultsView.tsx:295`; `src/components/PageHeader.tsx:73` |
| 2px top rule above a domain block | `src/app/page.tsx:193`; `src/components/results/ResultsView.tsx:335` |
| Data marks step 600 → 400 by mode via `--domain-*` / `--mark-primary` | `src/app/globals.css:113-129`, `:195-200` |
| A `DOMAIN_COLORS` hex cannot invert; use `getDomainMarkVar` | `src/lib/design-tokens.ts:77-97` |
| Four domains: Economic (Stone), Power (Slate), Society (Sage), World (Clay), with `blurb` — spec D4 | `src/lib/design-tokens.ts:29-58` |
| Five page measures as tokens: shell 1040, results 820, reference 660, quiz 672, browse 1200 | `src/app/globals.css:256-284` |
| `focus-ring` is one `@utility` using the `outline` **shorthand**; the spelling it replaced never painted | `src/app/globals.css:543-567` |
| `focus-ring-child` reaches a direct `button` child only, for the choice card | `src/app/globals.css:569-594` |
| Serif is Source Serif 4, self-hosted, variable 400–500, latin only | `src/app/layout.tsx:14-28`; `src/app/fonts/` |
| 7 ministries, named | `src/data/ministries.ts:26-98` |
| Results order: archetype → radar → tensions → axis breakdown → compass plot | `src/components/results/ResultsView.tsx:219`, `:239`, `:262`, `:314`, `:355` |
| Match percentage is `display-l` (34px), not 36px | `src/components/results/ArchetypeCard.tsx:179` |
| `PairedAxisScale` maps −1…1 to 6%…94% via `50 + score * 44` | `src/components/PairedAxisScale.tsx` (`scoreToTrackPercent`) |
| `ScoreBar.tsx` is deleted; `PairedAxisScale` is the one primitive | `tests/unit/results-dead-code.test.ts` (the deletion guard) |
| `PairedAxisScale` is `role="img"`; all its text is in the `aria-label` | `src/components/PairedAxisScale.tsx` (`describePosition` / `describeGap` doc comments) |
| Icons are real SVGs now, not text characters: 7 lucide ministry icons plus `X`, `ExternalLink`, `Users`, `Bookmark` | `src/components/quiz/BudgetSimulator.tsx:11-12`; `src/components/study/CompareView.tsx:4`; `PersonaModal.tsx:11`; `ComparePinButton.tsx:3` |
| Section reveal is a 300ms opacity+12px translate on intersection | `src/components/FadeInSection.tsx` |
| Named keyframes: `loading-slide`, `petal-reveal`, `fade-in-up`, `archetype-target-fade` | `src/app/globals.css:309-362` |
| Reduced motion collapses every transition and animation globally | `src/app/globals.css:300-306` |
| `home_sample_pair.json` is a build output — spec D2 | `public/study/derived/home_sample_pair.json`; `scripts/build-synthetic-study.ts` |
| `--text-tertiary`'s only remaining consumers are 2 lines in the dev widget | `src/components/DevRandomResults.tsx:45`, `:57` |

---

## File structure

| File | Responsibility |
| --- | --- |
| `tests/unit/design-docs.test.ts` | **New.** The drift guard. Reads `globals.css`, the design spec and `CLAUDE.md`, and fails when a documented value disagrees with the shipped token, or when a claim the delta falsified is still present. |
| `docs/system_proposal/governance_compass_design_spec.md` | **Rewritten section by section** (Tasks 4–10). Stays the authoritative design-system document; keeps its section order so external links to its headings survive. |
| `CLAUDE.md` | **Three edits** (Tasks 2–3): the Design Context button rule and Stone 600 role, a new token-layer bullet, and `home_sample_pair.json` in Key Directories. |
| `src/components/DevRandomResults.tsx` | **Two lines** (Task 11): the last `text-text-tertiary` call sites. |
| `src/app/globals.css` | **Three lines deleted** (Task 11): `--text-tertiary` in `:root`, in the dark block, and `--color-text-tertiary` in `@theme inline`. |
| `docs/superpowers/specs/2026-09-08-design-system-delta-design.md` | **Phasing table only** (Task 12): mark phase 6 shipped. |

---

## Task 1: The docs-drift guard

The point of this task is that Tasks 4–10 rewrite ~450 lines of prose, and prose has no compiler. The guard converts the claims that *can* be mechanically checked — every number that also exists as a token — into assertions, so a future token change reddens the document instead of quietly outdating it.

**Files:**
- Create: `tests/unit/design-docs.test.ts`

- [ ] **Step 1: Write the failing guard**

Create `tests/unit/design-docs.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Drift guard for the two authoritative design documents.
 *
 * Phase 6 rewrote both to describe what shipped. Prose has no compiler, so
 * every claim in them that is ALSO a token is asserted here against
 * `globals.css` itself rather than against a copy of its values. A token
 * retune therefore reddens this spec, which is the only thing that makes the
 * documents trustworthy six months from now.
 *
 * Two kinds of case, deliberately:
 *   - POSITIVE: the document states the shipped value (read from the CSS, not
 *     hardcoded here — a hardcoded expectation would drift in lockstep).
 *   - NEGATIVE: a claim the delta FALSIFIED is absent. These are the ones that
 *     matter, because a stale sentence reads as authoritative.
 */

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

const globalsCss = read("src/app/globals.css");
const designSpec = read("docs/system_proposal/governance_compass_design_spec.md");
const claudeMd = read("CLAUDE.md");

/** Comment-stripped CSS, so a declaration is never confused with prose about one. */
const css = globalsCss.replace(/\/\*[\s\S]*?\*\//g, "");

/** Every `@utility` role and its declared font-size, straight from the sheet. */
function utilityFontSizes(): Map<string, string> {
  const out = new Map<string, string>();
  for (const [, name, body] of css.matchAll(
    /@utility ([a-z0-9-]+) \{([\s\S]*?)\n\}/g,
  )) {
    const size = body.match(/font-size:\s*([\d.]+px)/);
    if (size) out.set(name, size[1]);
  }
  return out;
}

describe("design docs are not vacuous to guard", () => {
  it("reads all three files with content", () => {
    // Every case below is `expect(text).toContain(...)` or `.not.toContain(...)`.
    // An empty read makes the negatives pass forever and is exactly the failure
    // this case exists to catch. Measured: pointing `read` at a missing path
    // throws, which is the safe failure; pointing it at an empty file does not.
    expect(globalsCss.length).toBeGreaterThan(5000);
    expect(designSpec.length).toBeGreaterThan(5000);
    expect(claudeMd.length).toBeGreaterThan(2000);
  });

  it("finds the type-scale roles it is about to assert on", () => {
    const sizes = utilityFontSizes();
    // Anchors, not a count: if the parser stops seeing these, every type-scale
    // case below passes by reading nothing.
    expect(sizes.get("display-xl")).toBe("58px");
    expect(sizes.get("label")).toBe("11px");
    expect(sizes.get("control")).toBe("12px");
    expect(sizes.size).toBeGreaterThanOrEqual(15);
  });
});

describe("the design spec matches the shipped token layer", () => {
  it("documents the single radius value that globals.css declares", () => {
    const radius = css.match(/--radius:\s*(\d+px)/)?.[1];
    expect(radius, "--radius is missing from :root").toBeDefined();
    expect(designSpec).toContain(radius!);
  });

  it("has retired the 12px/8px radius prescriptions", () => {
    // The old Border Radius section prescribed 12px containers, 8px rows and
    // buttons, 6px compass inner, 3px bar track. Delta 02 collapsed all of it
    // to one token. A reader following the old table would reintroduce 89
    // literals the sweep removed.
    expect(designSpec).not.toMatch(/12px\s+\(large radius/);
    expect(designSpec).not.toMatch(/Buttons:\s+8px/);
    expect(designSpec).not.toMatch(/Axis rows \(alternating\):\s+8px/);
  });

  it("names every type-scale role with its shipped size", () => {
    // The scale is the delta's most-copied reference. A size that disagrees
    // with the sheet is worse than an absent one, because it gets pasted.
    for (const [role, size] of utilityFontSizes()) {
      expect(designSpec, `${role} is missing from the spec's type scale`).toContain(role);
      expect(
        designSpec,
        `${role} is documented at the wrong size (shipped ${size})`,
      ).toMatch(new RegExp(`\`${role}\`[^\\n]*${size.replace(".", "\\.")}`));
    }
  });

  it("states the 11px floor", () => {
    expect(designSpec).toMatch(/11px/);
    expect(designSpec.toLowerCase()).toContain("floor");
  });

  it("documents the mode-stepping tokens the delta introduced", () => {
    for (const token of [
      "--text-label",
      "--rule-strong",
      "--rule-hairline",
      "--button-primary",
      "--mark-primary",
      "--domain-economic",
      "--radius",
      "--focus-ring",
    ]) {
      expect(designSpec, `${token} is undocumented`).toContain(token);
    }
  });

  it("documents all five page-measure tokens", () => {
    for (const token of [
      "--container-shell",
      "--container-results",
      "--container-reference",
      "--container-quiz",
      "--container-browse",
    ]) {
      expect(designSpec, `${token} is undocumented`).toContain(token);
    }
  });

  it("no longer calls Stone 600 the primary accent fill or the brand color", () => {
    // Delta 03 moved the fill to Stone 900 ink. The old spec said Stone 600 was
    // "THE primary accent" and 'the "brand color"' in as many words, and
    // prescribed it as the button background in three separate places.
    expect(designSpec).not.toContain("THE primary accent");
    expect(designSpec).not.toContain('the "brand color"');
    expect(designSpec).not.toMatch(/Stone 600 background/);
  });

  it("no longer claims Stone 600 needs no dark variant for marks", () => {
    // Delta 06: domain 600 goes muddy on a dark ground, so every mark steps to
    // its 400 tone. The old spec said stone-filled elements "remain Stone 600".
    expect(designSpec).not.toMatch(/remain Stone 600/);
  });

  it("describes the shipped serif, not the pre-webfont stack", () => {
    expect(designSpec).toContain("Source Serif 4");
  });

  it("describes 7 ministries", () => {
    expect(designSpec).not.toMatch(/All 10 ministries/);
    expect(designSpec).not.toMatch(/Budget: all 10 ministries/);
  });

  it("no longer prescribes a 2px Stone 600 forced-choice selection", () => {
    // The shipped selection is a 1px --rule-strong border plus a text marker,
    // and the old accessibility note leaned on a border-WIDTH change as the
    // non-colour signal. Both claims are false and the second one is an
    // accessibility claim, which is the worse kind to leave standing.
    expect(designSpec).not.toMatch(/2px — the only place a 2px border is used/);
    expect(designSpec).not.toMatch(/border width change from 0\.5px to 2px/);
  });

  it("no longer claims the site uses almost no icons", () => {
    // 7 lucide ministry icons plus four more in /study. The old section said
    // the three exceptions were all text characters.
    expect(designSpec).not.toMatch(/uses almost no icons/);
  });

  it("names PairedAxisScale and does not prescribe the retired ScoreBar", () => {
    expect(designSpec).toContain("PairedAxisScale");
    expect(designSpec).not.toMatch(/\bScoreBar\b(?!.*retired)/);
  });

  it("carries no stale outdated-banner", () => {
    // The banner is the document's own admission that it cannot be trusted.
    // Phase 6 exists to remove the condition, so the banner goes with it.
    expect(designSpec).not.toContain("PARTIALLY OUTDATED");
  });

  it("records where the handoff bundle lives", () => {
    expect(designSpec).toContain("gov_compass_redesign.zip");
  });
});

describe("CLAUDE.md Design Context matches what shipped", () => {
  it("has retired the count-based filled-button rule (spec D1)", () => {
    // Mock 6b makes the quiz Next an ink fill — 60 filled buttons per sitting —
    // so a rule phrased as a reservation could not survive the delta.
    expect(claudeMd).not.toContain("Filled buttons are reserved");
  });

  it("states the three-tier button system by variant name", () => {
    for (const variant of ["primary", "secondary", "tertiary"]) {
      expect(claudeMd, `variant ${variant} is undocumented`).toContain(`\`${variant}\``);
    }
    expect(claudeMd).toContain("Stone 900");
  });

  it("states the variant names the Button component actually exports", () => {
    // Pins the doc to the type, so renaming a variant reddens the doc.
    const source = read("src/components/Button.tsx");
    const union = source.match(/export type ButtonVariant =([^;]+);/)?.[1];
    expect(union, "ButtonVariant union not found").toBeDefined();
    for (const [, name] of union!.matchAll(/"([a-z]+)"/g)) {
      expect(claudeMd, `variant ${name} is undocumented`).toContain(`\`${name}\``);
    }
  });

  it("no longer credits Stone 600 with the selected state", () => {
    // The forced-choice selection is --rule-strong ink, not Stone 600.
    expect(claudeMd).not.toMatch(/Stone 600[^\n]*selected states/);
  });

  it("gives Stone 600 its surviving jobs", () => {
    expect(claudeMd).toContain("focus ring");
    expect(claudeMd).toMatch(/progress fill/);
  });

  it("documents the token layer and the named-sibling rule", () => {
    expect(claudeMd).toContain("@utility");
    expect(claudeMd).toContain("@theme inline");
    // The rule itself, not just the mechanism: a built-in utility layered over
    // a custom one wins or loses depending on which properties the custom rule
    // declares, so roles get named siblings instead.
    expect(claudeMd).toMatch(/named sibling/);
  });

  it("notes home_sample_pair.json alongside the other derived outputs", () => {
    expect(claudeMd).toContain("home_sample_pair.json");
  });
});
```

- [ ] **Step 2: Run it and confirm it fails for the right reasons**

Run: `npx vitest run tests/unit/design-docs.test.ts`

Expected: the two `describe("design docs are not vacuous")` cases PASS (they only need the files to exist and the parser to work). Most cases in the other two blocks FAIL. Read the failure list and confirm it names the real gaps — e.g. `--text-label is undocumented`, `Filled buttons are reserved`, `display-xl is missing from the spec's type scale`. **If a case in the last two blocks passes before any doc is edited, that case is vacuous — fix it now, not later.** Paste the pass/fail split into the commit message.

- [ ] **Step 3: Prove the positives are not self-satisfying**

The `not.toContain` cases are the easy half. The `toContain` cases are the ones that can pass by accident. Confirm two by mutation:

```bash
# M1 — the type-scale case must redden when a role's documented size is wrong.
# (Run AFTER Task 5 lands; record the result there.)
# M2 — the radius case must redden when the token changes.
sed -i 's/--radius: 2px/--radius: 3px/' src/app/globals.css
npx vitest run tests/unit/design-docs.test.ts -t "documents the single radius value"
# Expected: FAIL. The spec says 2px; the sheet now says 3px.
git checkout -- src/app/globals.css
npx vitest run tests/unit/design-docs.test.ts -t "documents the single radius value"
# Expected: still FAIL at this point (the spec has not been rewritten yet) — which
# is why M2 is only conclusive once the two runs DIFFER. Re-run M2 after Task 6.
```

Record both outcomes. A mutation run that reddens for the wrong reason proves nothing (see the project's history of exactly this).

- [ ] **Step 4: Commit the guard red**

```bash
git add tests/unit/design-docs.test.ts
git commit -m "test(design): add the phase 6 docs-drift guard, red

Reads globals.css and asserts both authoritative design documents against
it. Red on purpose: Tasks 2-10 turn it green. Pass/fail split at authoring
time is in the plan's Task 1 Step 2."
```

---

## Task 2: `CLAUDE.md` — the button rule, Stone 600's real jobs, the token layer

Three of issue #137's five doc bullets. Done together because they are one paragraph block and splitting them would leave the file self-contradictory between commits.

**Files:**
- Modify: `CLAUDE.md:73-85`

- [ ] **Step 1: Replace the Visual tone bullet's Stone sub-bullet**

Replace exactly this line (`CLAUDE.md:74`):

```markdown
  - **Stone (primary accent)** — Stone 600 (`#85735e`), used for emphasis, selected states, data marks, and the single warm hue that unifies the palette.
```

with:

```markdown
  - **Stone (primary accent)** — Stone 600 (`#85735e`), the single warm hue that unifies the palette. Its surviving jobs are the focus ring (`--focus-ring`), the quiz progress fill, and data marks. It is **not** the primary button fill and **not** the selected state: design delta 03 moved the fill to Stone 900 ink, and the forced-choice card's selection is a `--rule-strong` border. Marks reach it through `--mark-primary` and `--domain-*`, never a `--stone-600` literal — the Stone ramp is frozen across modes, while every mark steps to its 400 tone on a dark ground.
```

- [ ] **Step 2: Replace the typography bullet**

Replace exactly this line (`CLAUDE.md:84`):

```markdown
- **Typography is the primary design tool.** Serif/sans/mono contrast creates the journal feel. Two weights only (400, 500). Sentence case everywhere except 11px structural labels.
```

with:

```markdown
- **Typography is the primary design tool.** Serif/sans/mono contrast creates the journal feel. Two weights only (400, 500). Serif is display only and prose stays sans; the mono layer carries every label, eyebrow, axis endpoint, count, status, and button label, uppercase and letter-spaced. On prose pages that layer frames but never enters — descriptions, tension and traditions paragraphs stay sans, and the archetype reference's serif italic lead-ins (`Internal tension.`, `Traditions.`) survive deliberately. Sentence case everywhere except the mono label layer. **Hard floor: 11px** — no role in the type scale renders below it at any viewport.
```

- [ ] **Step 3: Replace the filled-button rule (spec D1)**

Replace exactly this line (`CLAUDE.md:85`):

```markdown
- **Filled buttons are reserved for primary assessment actions** (beginning or resuming the assessment and confirming the budget). Everything else is ghost/outlined. This restraint is deliberate.
```

with:

```markdown
- **Buttons are a three-tier system, not a count.** `src/components/Button.tsx` is the only source of button treatment, and every control picks one of its three variants:
  - **`primary`** — Stone 900 ink fill, Stone 50 text, 12px mono `control` label. Inverts to a Stone 300 fill with Stone 900 text in dark mode, where ink on an ink ground would be invisible. For the page's own call to action: beginning or resuming the assessment, advancing the quiz, confirming the budget.
  - **`secondary`** — Stone 300 outline on the page surface, same `control` label. Everything else that is a button: back, share, copy, reset, expand.
  - **`tertiary`** — an underlined `label-nav` link with no box. Navigation dressed as a control.

  The rule this replaces reserved filled buttons for "beginning or resuming the assessment and confirming the budget." Mock `6b` makes the quiz `Next` an ink fill — 60 filled buttons per sitting — so a count-based rule could not survive the delta. That is spec decision D1. Restraint now lives in the variant boundary rather than in a tally, and the boundary is enforced by more than convention: **`className` cannot override a variant's padding, colour, or display.** Appending does not win — Tailwind's emitted order decides, and the variant utilities land later in the sheet than common classes like `block` or `px-6`. Anything touching those properties needs a variant, not a class. `w-full` is verified conflict-free and is how a caller goes full-width.
```

- [ ] **Step 4: Add the token-layer bullet**

Insert immediately after the `tertiary` block added in Step 3 (i.e. after the D1 paragraph, before the `### Design Principles` heading):

```markdown
- **Design tokens live in `src/app/globals.css`, in three layers.** CSS custom properties on `:root` with a `prefers-color-scheme: dark` override; a `@theme inline` block mapping them into Tailwind's namespaces (`--color-*`, `--radius-sharp`, `--container-*`, `--font-*`); and a set of `@utility` roles for the type scale (`display-*`, `body-*`, `label*`, `control`, `mono-meta`, `wordmark*`, `caption-italic`) and the focus ring. Add tokens here rather than hard-coding values at call sites.

  Each `@utility` role is self-contained — family, size, line-height, tracking, weight. **Never layer a built-in utility over one to vary a property.** Whether a custom `@utility` is emitted before or after a built-in depends on which properties the custom rule declares, so `label tracking-[0.06em]` happens to win while a single-property custom utility would lose to `tracking-*`. That is too subtle to build on. When a role needs a variant, **add a named sibling** — which is why `label-eyebrow`, `label-nav`, `label-tight`, `mono-meta`, and `wordmark-sm` exist as separate roles rather than as modified `label`s.
```

- [ ] **Step 5: Run the guard's CLAUDE.md block**

Run: `npx vitest run tests/unit/design-docs.test.ts -t "CLAUDE.md Design Context"`

Expected: every case PASSES except `notes home_sample_pair.json` (Task 3 does that one).

- [ ] **Step 6: Mutation-check the two cases that could self-satisfy**

```bash
# M3 — the variant-name case must read the TYPE, not a coincidence in prose.
sed -i 's/"primary" | "secondary" | "tertiary"/"primary" | "secondary" | "ghost"/' src/components/Button.tsx
npx vitest run tests/unit/design-docs.test.ts \
  -t "states the three-tier button system by the variant names Button exports"
# Expected: FAIL — "ButtonVariant is no longer the three-tier system:
#   expected [ 'primary', 'secondary', 'ghost' ] to deeply equal
#   [ 'primary', 'secondary', 'tertiary' ]".
git checkout -- src/components/Button.tsx

# M4 — the Stone 600 case must catch the claim, not just the words.
#      Re-add the old phrasing and confirm it reddens.
```

For M4, temporarily re-insert `used for emphasis, selected states, data marks` into the Stone sub-bullet, run `-t "no longer credits Stone 600"`, confirm FAIL, then revert with `git checkout -- CLAUDE.md` and re-apply Steps 1–4. Record both outcomes; a mutation that reddens the wrong case is not evidence.

- [ ] **Step 7: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(design): rewrite the button rule as three tiers, correct Stone 600

Spec D1: mock 6b makes the quiz Next an ink fill, so the count-based
reservation could not hold. Replaces it with the variant system and records
that className cannot beat a variant. Also gives Stone 600 its surviving
jobs (focus ring, progress fill, marks) and documents the three-layer token
system plus the named-sibling rule for @utility roles.

Closes three of issue #137's doc bullets."
```

---

## Task 3: `CLAUDE.md` — note `home_sample_pair.json`

**Files:**
- Modify: `CLAUDE.md:48`

- [ ] **Step 1: Replace the derived-directory line**

Replace exactly this line:

```markdown
- `public/study/derived/` — Build-time preprocessed JSON consumed by the pages (slim catalog, regional/demographic aggregates, axis histograms, correlation matrix, case-study picks). Regenerated via `npm run build:study`.
```

with:

```markdown
- `public/study/derived/` — Build-time preprocessed JSON consumed by the pages (slim catalog, regional/demographic aggregates, axis histograms, correlation matrix, case-study picks, and `home_sample_pair.json`). Regenerated via `npm run build:study`. `home_sample_pair.json` is the odd one out: it feeds the **home** page's paired-axis panel, not `/study`. Two real synthetic-study personas, rendered anonymously as Respondent A and Respondent B because persona identity carries no meaning off the study section (spec decision D2). The home page is a server component and reads it at build time, so `data/synthetic_study/` still never reaches a client bundle.
```

- [ ] **Step 2: Verify the claim before shipping it**

Do not take the sentence above on trust — two of its clauses are checkable:

```bash
# The file exists and is a build output of the study script.
test -f public/study/derived/home_sample_pair.json && echo "exists"
grep -n "home_sample_pair" scripts/build-synthetic-study.ts
# The home page reads it server-side, with no client fetch.
grep -rn "home_sample_pair" src/
```

Expected: the file exists, the script writes it, and the only `src/` reader is a server component. **If the home page turns out to fetch it client-side, fix the sentence, not the code** — and note the discrepancy in the commit message.

- [ ] **Step 3: Run the guard**

Run: `npx vitest run tests/unit/design-docs.test.ts`

Expected: the whole file PASSES for `CLAUDE.md`. The design-spec block still fails — Tasks 4–10.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: note home_sample_pair.json in the derived outputs

The one derived file that feeds the home page rather than /study. Closes
issue #137's fifth doc bullet."
```

---

## Tasks 4–10: the design spec, section by section

**Read this before starting any of them.**

These seven tasks rewrite `docs/system_proposal/governance_compass_design_spec.md`. Each task owns a contiguous section and does not touch another task's lines, so they are independently reviewable and independently revertable.

**Section order is preserved.** Headings are the document's addressable surface; renaming or reordering them breaks every reference to it, including the ones in `CLAUDE.md:41` and in five plan documents.

**The plan gives you, per section: the exact line range, the facts (from the citation table above, which you must verify), the claims the new text MUST make, and the claims it MUST NOT make.** It does not dictate the full prose. That is deliberate and it is the one place this plan departs from the writing-plans default of "show the exact content": reproducing ~450 lines of finished prose inside the plan means writing the document twice and creates a second copy that can drift from the first. The acceptance criteria are mechanical (Task 1's guard) plus a review checkpoint per task, which is stronger than a verbatim transcript nobody diffs.

**Register — decided at Task 4, binding on Tasks 5–10.** The document's untouched sections are a terse prescriptive handoff: code blocks, imperative bullets, no history. Task 4's Color System came out as something better — declarative prose that shows the measurement behind a rule and says plainly when a thing is a trap rather than a shorthand. A reviewer flagged the mismatch and asked for a deliberate call rather than an accident.

**The call: match Task 4's register, not the old one.** Phase 6 exists to record why things shipped as they did, and a spec that states a rule without its reasoning is how the current document became untrustworthy in the first place. Read `## Color System` at HEAD before writing your section and pitch to it, so the document converges instead of splitting into two documents with a visible seam down the middle.

Two constraints on that, both from Task 4's review:

- **Explanation is earned; padding is not.** Task 4 ran ~1669 words against 322 for Typography. That was judged earned *because* every paragraph carries a measurement or a reason. Length that carries neither gets cut.
- **Every section that runs long needs a rule summary.** `### Typography Rules` is the model: four bullets an engineer reads in twenty seconds. If your section's actionable rules end up embedded mid-paragraph inside their own rationale, add a compact rules list in that style. Prose for the why, a list for the what.

Also inherited from Task 4: no named source-file **paths** (unique identifiers like `DOMAIN_COLORS` or `PHASE_5_INLINE_RAMP` are greppable and are fine), no line numbers, and no asserted count that an adjacent code block does not immediately enumerate.

**When the shipped system is worse than what the old spec described, say so and cite the issue.** A design spec that quietly omits known debt is how the debt gets rediscovered. Three places need this: `/study` has not adopted delta 04 (#154), `comparison/` and `groups/` hold 17 frozen Stone 600 mark tones (#155), and bare `rounded` plus SVG `rx` are unswept radius spellings (#139, #154).

---

## Task 4: Design spec — Color System

**Files:**
- Modify: `docs/system_proposal/governance_compass_design_spec.md:17-84`

- [ ] **Step 1: Rewrite the Color System section**

Replace lines 17–84 (from `## Color System` through the end of the `### Dark Mode` subsection, stopping before the `---` on line 85).

Keep the four subsections: `### Primary Accent — "Cartographic Stone"`, `### Surfaces and Text`, `### Semantic Colors`, `### Dark Mode`.

MUST state:
- The Stone ramp, unchanged in value (`globals.css:9-18`), and that it is **frozen across modes** — a `--stone-NNN` literal is one value in light and dark, which is why marks and rules cannot be spelled from it.
- Stone 600's jobs after delta 03: focus ring, progress fill, data marks. Not the button fill. Not "the brand color."
- The ink primary: `--button-primary` / `-hover` / `-fg` = Stone 900 / 800 / 50, inverting to Stone 300 / 200 / 900 in dark (`globals.css:79-81`, `:161-163`), and that the inversion is a token override rather than a per-component branch.
- The surface trio and the text trio, plus **`--text-label` as the fourth text token**, and why it steps Stone 700 → Stone 500 while `--text-tertiary` does not: Stone 500 is 2.73:1 on the light page ground, under even the 3:1 large-text floor, and no single ramp value clears AA in both modes (spec D7, `globals.css:29-36`). Note this is the delta's one knowing departure from the handoff, and that it is an accessibility departure rather than an aesthetic one.
- The rule pair `--rule-strong` / `--rule-hairline` and why they cannot be `border-stone-900` / `border-stone-50` at the call site (`globals.css:44-52`).
- The four domain colours with their `600`/`400` pairs and their `blurb` field (`design-tokens.ts:29-58`), and that **marks read `--domain-*` / `--mark-primary`, never `getDomainColor600`**, because a hex cannot invert (`design-tokens.ts:77-97`).
- Domain colour is **data, not palette** — it encodes which axis domain a mark belongs to, and is permitted wherever an axis is drawn. Mirror `CLAUDE.md:77`; do not restate it as a page list, which is the error `CLAUDE.md:79` records.
- The warning family, all four members, including that `--color-warning-border` is exported so `border-warning-border` compiles (`globals.css:237-241`).
- The study-only token families, named as study-only: cluster, map, axis-gradient, model tones.
- Dark mode: surfaces invert, the primary inverts rather than darkens, marks step 600 → 400, rules swap ends, contour opacity drops 0.08 → 0.05.

MUST NOT contain: `THE primary accent`, `the "brand color"`, `Stone 600 background`, `remain Stone 600`, or `Info (blue)` described as optional-for-a-future-compare-feature (comparison shipped).

MUST record as debt, with issue numbers: the 17 frozen `var(--stone-600)` mark tones in `comparison/` and `groups/` (#155), held by a named `PHASE_5_INLINE_RAMP` exclusion in `tests/unit/design-system-tokens.test.ts`.

- [ ] **Step 2: Verify every citation you used**

For each `globals.css` or `design-tokens.ts` line you leaned on, open it and confirm the value. Line numbers shift; the citation table in this plan was accurate when written and is not self-updating.

```bash
sed -n '9,18p;29,37p;44,52p;76,81p;113,133p;144,163p;195,200p;237,241p' src/app/globals.css
sed -n '29,58p;77,97p' src/lib/design-tokens.ts
```

- [ ] **Step 3: Run the guard**

Run: `npx vitest run tests/unit/design-docs.test.ts -t "design spec"`

Expected: the colour-related cases now PASS — `documents the mode-stepping tokens`, `no longer calls Stone 600 the primary accent`, `no longer claims Stone 600 needs no dark variant`. Type-scale, radius, and banner cases still FAIL.

- [ ] **Step 4: Commit**

```bash
git add docs/system_proposal/governance_compass_design_spec.md
git commit -m "docs(design): reconcile the spec's colour system with the delta

Ink primary and its dark inversion, --text-label and the D7 accessibility
departure, the rule pair, the domain marks as stepping tokens rather than
fixed hexes, and the study-only token families. Retires the claims that
Stone 600 is the brand fill and that marks need no dark variant.

Records the #155 frozen mark tones as known debt rather than omitting them."
```

---

## Task 5: Design spec — Typography

**Files:**
- Modify: `docs/system_proposal/governance_compass_design_spec.md:87-126`

- [ ] **Step 1: Replace the Font Stack subsection**

The shipped serif is Source Serif 4, self-hosted from `src/app/fonts/` via `next/font/local`, variable across 400–500, latin subset, `display: swap`, exposed as `--font-source-serif` and consumed by `--font-serif` (`layout.tsx:14-28`, `globals.css:286-288`). State why it is self-hosted: so the build never reaches the network. Sans and mono remain system stacks — name them from `globals.css:287-288`, not from the old prose.

- [ ] **Step 2: Replace the Type Scale subsection with the shipped roles**

The old scale was a prose list of sizes. The shipped scale is a set of `@utility` roles. Use this table verbatim — it is transcribed from `globals.css:386-541` and `:596-602`, and Task 1's guard asserts each role against the sheet:

```markdown
### Type Scale

The scale is a set of `@utility` roles in `src/app/globals.css`, not a set of
sizes to apply by hand. Each role is self-contained — family, size,
line-height, tracking, weight — and is named for its job rather than its size.

| Role | Size / line-height / tracking | Family | Use |
| --- | --- | --- | --- |
| `display-xl` | 58px / 1.04 / −0.021em | serif 500 | Home headline, desktop. Measure ~11em. |
| `display-page` | 40px / 1.06 / −0.02em | serif 500 | Interior page titles. |
| `display-l` | 34px / 1.06 / −0.018em | serif 500 | Home headline on mobile; large numerals, including the archetype match percentage. |
| `display-m` | 26px / 1.2 | serif 500 | Section headings. **Not** the quiz prompt. |
| `display-entry` | 22px / 1.2 | serif 500 | Entry titles in long reference lists. |
| `display-s` | 17px / 1.35 | serif 500 | Card titles, option headlines, archetype name. |
| `body-lead` | 17px / 1.62 | sans | Lead paragraph. |
| `body-s` | 13.5px / 1.6 | sans | The workhorse prose size. Declares no colour. |
| `body-xs` | 12px / 1.5 | sans | The meta column's subordinate prose. Declares no colour. |
| `label` | 11px / 1.4 / 0.12em, uppercase | mono | The default label, inside panels. |
| `label-eyebrow` | 11px / 1.4 / 0.14em, uppercase | mono | Section eyebrows. |
| `label-nav` | 11px / 1.4 / 0.10em, uppercase | mono | Nav links, tertiary buttons, disclosure summaries. |
| `label-tight` | 11px / 1.4 / 0.02em, uppercase | mono | Where a label sits under a data mark and the airy tracking would overflow its column: axis endpoints, the A/B legend. |
| `mono-meta` | 11px / 1.4 / 0.06em, **sentence case** | mono | Scores, counts, coordinates, the footer's provenance row. The one mono role that is not uppercase. |
| `control` | 12px / 1 / 0.12em, uppercase, 500 | mono | Button labels. |
| `wordmark` | 12px / 1 / 0.16em, uppercase, 500 | mono | The brand wordmark. |
| `wordmark-sm` | 11px / 1 / 0.13em, uppercase, 500 | mono | The wordmark below 560px. |
| `caption-italic` | 13.5px / 1.5, italic | serif | Editorial framing notes. **Sets its own colour** (`--text-label`) — that colour is part of the role, not a default to override. |

**Hard floor: 11px.** No role in this scale renders below it, at any viewport.

`text-wrap: pretty` appears only on the three long-headline roles
(`display-xl`, `display-page`, `display-l`). That is deliberate, not an
oversight in the others.
```

- [ ] **Step 3: Replace the Typography Rules subsection**

MUST state:
- Serif is display and editorial framing only — never UI labels, never button text. **Do NOT carry the old spec's full prohibition over.** It also banned serif for "axis names, or data", and both are false of what shipped: `/axes` sets axis names in `display-s` (serif 500), and the archetype match percentage, the comparison alignment score and the study key figures are all serif `display-l`. This plan told Task 5 to carry the bullet forward verbatim, which was an error — the pre-delta rule was lifted without checking it against the code. Large numerals in serif are a deliberate part of the editorial-publishing tradition, and `CLAUDE.md` says so. Whatever the bullet ends up saying must agree with the type scale's own `display-l` row in the same section.
- **The mono layer is new and larger than "numeric data only."** It carries every label, eyebrow, axis endpoint, count, status, and button label. The old rule confining mono to numbers is false: `control`, `label*`, and `wordmark` are all mono and none of them is numeric.
- On prose pages the mono layer **frames but never enters**: descriptions, tension and traditions paragraphs stay sans, and the archetype reference's serif italic lead-ins (`Internal tension.`, `Traditions.`) survive deliberately. Replacing them with mono labels turns a reference into a spec sheet.
- Sentence case everywhere except the mono label layer. Note `mono-meta` as the one mono role that is sentence case too.
- Two weights only, 400 and 500.
- The named-sibling rule: do not layer a built-in utility over an `@utility` role to vary a property; add a named sibling. Give the reason (emitted order depends on which properties the custom rule declares) and point at `label-eyebrow` / `label-nav` / `label-tight` / `wordmark-sm` as the four siblings that exist for this reason.

> **Formatting contract with Task 1 — read before writing the table.** The guard's type-scale case requires each role's **backticked name and its px size to appear on the same line**, and it reads the expected size from `globals.css` at runtime. The table above satisfies this. A multi-line row shape, an un-backticked role name, or a size written anywhere but on the role's own row will redden the guard. This coupling is deliberate and is pinned from the other side by the guard's own "matches a markdown table row" case. If you need a different table shape, change the guard in the same commit — do not work around it.

- [ ] **Step 4: Run the guard, then mutation M1**

```bash
npx vitest run tests/unit/design-docs.test.ts -t "names every type-scale role"
# Expected: PASS.

# M1 — the case must catch a WRONG size, not just a missing role.
sed -i 's/| `display-m` | 26px/| `display-m` | 24px/' docs/system_proposal/governance_compass_design_spec.md
npx vitest run tests/unit/design-docs.test.ts -t "names every type-scale role"
# Expected: FAIL — "display-m is documented at the wrong size (shipped 26px)".
git checkout -- docs/system_proposal/governance_compass_design_spec.md
```

**`git checkout` reverts the whole Task 5 edit.** Re-apply Steps 1–3 after M1, or run M1 on a stashed copy. Either way, record M1's outcome — an unverified positive case is the failure mode this project has shipped repeatedly.

- [ ] **Step 5: Commit**

```bash
git add docs/system_proposal/governance_compass_design_spec.md
git commit -m "docs(design): replace the type scale with the shipped @utility roles

Source Serif 4 self-hosted, the eighteen named roles with their sizes, the
11px floor, and the mono layer's real extent — the old 'monospace is for
numeric data only' rule was false of control, label*, and wordmark. Records
the named-sibling rule with its reason.

Mutation M1 verified: a wrong documented size reddens the guard."
```

---

## Task 6: Design spec — Layout, Spacing, and Border Radius

**Files:**
- Modify: `docs/system_proposal/governance_compass_design_spec.md:129-198`

- [ ] **Step 1: Rewrite Page Structure**

The ASCII diagram at lines 136–166 describes the pre-phase-4 results page. The shipped order is archetype → radar → tensions → axis breakdown → compass plot (`ResultsView.tsx:219`, `:239`, `:262`, `:314`, `:355`) — the compass moved to the bottom and the hero is no longer a two-column compass+card grid.

Redraw the diagram to match, or replace it with a plain ordered list. **A list is preferable**: the old diagram encoded surface nesting that delta 04 removed, and redrawing it risks smuggling that structure back in.

- [ ] **Step 2: Add a Page Measures subsection**

New content — the five measures are tokens now (`globals.css:256-284`) and the old spec had none of them:

```markdown
### Page Measures

Five widths, all tokens in `@theme inline`, so no page carries an incidental
Tailwind size or an inline `maxWidth` literal.

| Token | Width | Scope |
| --- | --- | --- |
| `--container-shell` | 1040px | The chrome shell. `NavBar`, `Footer`, and the home page. |
| `--container-results` | 820px | The results column. Narrower than the chrome around it. |
| `--container-reference` | 660px | The long-prose measure — ~75 characters at the 15px intro size. `/archetypes` runs its zebra band full-bleed and re-applies this width inside each row, so the measure survives a full-bleed background. |
| `--container-quiz` | 672px | The quiz column. Value-identical to the `max-w-2xl` it replaced; a naming change, not a retune. |
| `--container-browse` | 1200px | `/study/personas` only, and the only measure wider than the chrome shell. Earned rather than inherited: it is a two-column data browser with a filter sidebar, and at 1040px it loses a column of the persona grid at every breakpoint above 960px. |
```

- [ ] **Step 3: Replace Border Radius with delta 02**

The old block (lines 187–198) prescribed seven different radii. Replace with:

```markdown
### Border Radius

One value. `--radius: 2px` in `:root`, exposed as `rounded-sharp` through
`--radius-sharp` in `@theme inline`. Containers, cards, rows, badges, buttons,
and the compass plot's inner rect all take it — delta 02 collapsed the former
12px and 8px literals (89 of them across 26 files) onto the token.

Two exemptions, named rather than pattern-matched, because a circle is not a
rounded rectangle and a pill is not either: `50%` and `999px`. Dots, the
compass mark, and avatars are unaffected.

Use `rounded-sharp` in classes and `var(--radius)` in inline styles and SVG.
A bare `rx="var(--radius)"` **attribute does not resolve** — it needs
`style={{ rx: … }}`.

**Known unswept spellings**, recorded rather than omitted: bare `rounded`
(issue #139, which also locks the radius namespace) and five SVG `rx`
attributes across `TensionMatrix`, `HorizontalBarChart`, `ComparisonRadar`,
and `RadarChart` (issue #154). At a 2px token, "leave them and say so here" is
a legitimate resolution for the `rx` sites; what is not legitimate is a spec
that implies they were swept.
```

- [ ] **Step 4: Add a Rules and Structure subsection (delta 04)**

This is the delta with no representation at all in the old document, which described surfaces and gaps instead. New content:

```markdown
### Rules Carry Structure

Sections separate by full-bleed rules and alternating surfaces, not by gaps
between rounded floating panels. **Maximum two surface switches per page.**

Three weights, used consistently:

| Weight | Token | Job |
| --- | --- | --- |
| 1px strong | `--rule-strong` | Under a card's own header. Hard ink — 13.05:1 in light. |
| 2px domain / warning | `--domain-*`, `--warning` | Above a domain block, or on a callout's left edge. |
| 1px / hairline | `--border-secondary`, `--rule-hairline` | Section boundaries, and row separators inside a list. |

`--rule-strong` and `--rule-hairline` **invert** with the surface: strong is
Stone 900 in light and Stone 100 in dark, hairline is Stone 50 and Stone 900.
This is why they cannot be spelled `border-stone-900` / `border-stone-50` at
the call site — the Stone ramp is frozen across modes, so those literals swap
roles in dark, giving near-white hairlines and a header rule that vanishes.

**`/study` has not adopted this delta** (issue #154). It is the one part of the
six-part delta the synthetic study section has not taken, because it asks for
bespoke layout work and spec decision D6 defers bespoke layout on screens the
handoff never drew. If `/study`'s panels still float, that was a decision.
```

- [ ] **Step 5: Leave Grid and Spacing Tokens**

Lines 169–185 (Grid, Spacing Tokens) are still broadly accurate. Read them and correct only what is false — in particular the axis breakdown's grid is now `[24px | 1fr | 210px]` above 560px, not `[82px | fluid | 82px]` (`AxisBreakdownCard.tsx:76`). Do not rewrite what is merely terse.

- [ ] **Step 6: Run the guard**

Run: `npx vitest run tests/unit/design-docs.test.ts -t "design spec"`

Expected: `documents the single radius value`, `has retired the 12px/8px radius prescriptions`, and `documents all five page-measure tokens` now PASS.

- [ ] **Step 7: Complete mutation M2**

```bash
sed -i 's/--radius: 2px/--radius: 3px/' src/app/globals.css
npx vitest run tests/unit/design-docs.test.ts -t "documents the single radius value"
# Expected: FAIL.
git checkout -- src/app/globals.css
npx vitest run tests/unit/design-docs.test.ts -t "documents the single radius value"
# Expected: PASS.
```

The two runs must now DIFFER — that is what makes M2 conclusive, and it is why Task 1 Step 3 deferred it to here. Record both outcomes.

- [ ] **Step 8: Commit**

```bash
git add docs/system_proposal/governance_compass_design_spec.md
git commit -m "docs(design): one radius, five page measures, and rules carry structure

Collapses the seven prescribed radii onto --radius with its two named
exemptions, adds the five container tokens the spec never had, adds delta
04's three rule weights, and redraws the results structure in shipped order
(compass moved to the bottom in phase 4).

Records the unswept radius spellings (#139, #154) and /study's un-adopted
delta 04 (#154) rather than implying either was done.

Mutation M2 verified conclusive: the two runs differ."
```

---

## Task 7: Design spec — Component Specifications

**Files:**
- Modify: `docs/system_proposal/governance_compass_design_spec.md:202-361`

> **REQUIRED: fix the orphaned "hero region" references.** Task 6 rewrote Page Structure to say flatly that **there is no hero region** — the compass moved to the bottom in phase 4 and delta 04 removed the two-column hero grid. Deleting the old ASCII diagram was correct, but that diagram was the hero's *other* home, and four references in **your** sections are now orphaned and self-contradicting:
>
> - `### The Compass Plot` — "inside the hero region's left column"
> - `### The Archetype Card` — "inside the hero region's right column"
> - `### The Tension Card` — "between the hero and radar sections"
> - `### Share Buttons Row` — "at the bottom of the hero region, inside the Surface 2 container"
>
> **None of these is covered by any guard case.** This task can go fully green while leaving all four standing. Fix them as part of the section rewrites below; do not rely on the guard to tell you when you are done.

> **The guard no longer signals this task.** Task 6's Grid rewrite names `PairedAxisScale` truthfully while explaining why the two 82px pole columns are gone, which turned the `names PairedAxisScale and does not prescribe the retired ScoreBar` case green as a side effect. That case can no longer tell you whether Component Specifications did its job. **Name the component here anyway** — this is where a reader looks for it — and do not treat a green guard as evidence that this task is complete.

- [ ] **Step 1: Add `PairedAxisScale` as the section's first component**

Delta 05's new primitive, and the biggest structural gap in the old document — which specified an "axis bar" per-page instead. MUST state:
- One row renders one axis for one or two respondents, and is the shared primitive behind the home sample, the results breakdown, compare, and group views.
- **How the convergence actually landed**, which is not quite what delta 05 predicted: `ScoreBar.tsx` is **deleted** outright, with a source guard in `tests/unit/results-dead-code.test.ts` against reintroduction. `ComparisonScoreBar.tsx` **survives** — but as row chrome *around* the primitive rather than as a second implementation of it (`ComparisonScoreBar.tsx:1`, `:18`). Say both. A spec claiming two components converged into one, when one of them is still a file with two callers, sends a reader looking for something that is not there.
- One consequence worth recording because it reversed a shipped behaviour: the dot roles are the primitive's, not `ComparisonScoreBar`'s former ones. Respondent A is the filled domain dot and respondent B the outlined one, which is the **reverse** of what shipped before; `/compare`'s legend names them in the new order.
- `ComparisonScoreBar` carries no `"use client"`: with its former hover tooltips gone it has no hooks, handlers, or browser APIs, and the primitive carries no directive either. The tooltips it replaced were mouse-only — no keyboard path, no screen-reader path — and showed the same numbers the permanent readouts now show.
- It renders only the scale — endpoints, track, midline, dots. Callers own the surrounding row, because the four consumers wrap it in different grids.
- Track: 2px domain-400 at 50% opacity, 1px Stone 200 midline. Respondent A: filled 10px dot in the domain 600 (or Stone 900). Respondent B: outlined 12px dot, Stone 500, white fill.
- **The mapping: `−1…1` → `6%…94%`, as `50 + score * 44`**, so a dot at a pole sits fully on the track instead of clipping its end. Name `scoreToTrackPercent`.
- Accessibility: the root is `role="img"`, which makes the whole subtree presentational — the visible endpoint text never reaches the accessibility tree and both dots are `aria-hidden`. **Everything the scale communicates has to survive in the `aria-label`**, built by `describePosition` and `describeGap`. An `endpoints="none"` caller therefore loses a visual affordance only; the announced string is byte-identical.

- [ ] **Step 2: Correct the Archetype Card subsection**

Lines 237–252. The match percentage is `display-l` (34px), not 36px (`ArchetypeCard.tsx:179`). The eyebrow sits over a `--rule-strong` bottom border; the adjacent-archetype row sits under a `--rule-hairline` top border in `mono-meta` (`:174`, `:270`). A mini radar occupies a 220px right column above 560px (`:169`). Keep the "the match percentage is the visual anchor" intent — it survived.

- [ ] **Step 3: Rewrite the Tension Card subsection as a callout**

Lines 254–273. There is no `TensionCard` component: tensions render inline in `ResultsView` as a panel with a 2px `--warning` left edge (`ResultsView.tsx:295`). The section head is `Detected tensions` / `Principles against priorities` (`:265-266`). Describe the shipped callout and drop the 12px-radius bordered-card prescription.

- [ ] **Step 4: Correct the Radar Chart subsection**

Lines 275–303. Shipped values from `RadarChart.tsx`: `SIZE` 580, `MAX_RADIUS` 170, labels at `r+22` in 11px mono (down from `r+38`, which was sized for two-line domain-coloured labels). Polygon fill `--mark-primary` at `fillOpacity` 0.1, stroke 1.6px. Vertex dots r=4, r=5.5 hovered, filled from `getDomainMarkVar` — **per-axis domain colour, not a single Stone 600**. Grid: `--border-secondary` at 0.8px, a dashed `--border-primary` ring, spokes at 0.6px. There is a hover tooltip (`:175-209`) the old spec does not mention, and an `sr-only` table carrying the 12 scores (`:55`).

The "archetype prototype overlay" in dashed info-blue **no longer renders** — verified at plan time: `RadarChart.tsx` contains no `prototype`, no `strokeDasharray` on a second polygon, and no `--info` reference. Say the overlay was dropped; do not leave a prescription for something absent. The old spec's `Info (blue)` semantic entry (line 70) loses its only stated consumer as a result, which Task 4 should reflect.

Likewise the two-item legend the old spec describes below the chart (lines 299–303) described the respondent polygon against that overlay. Read what is actually below the chart now and describe that, or drop the subsection.

- [ ] **Step 5: Rewrite the Axis Breakdown subsection**

Lines 305–330. Shipped: a `[24px | 1fr | 210px]` grid above 560px, collapsing to two columns below (`AxisBreakdownCard.tsx:76`); index in `mono-meta`, axis name in `body-s`, score in `mono-meta tabular-nums`, confidence and tagline in the meta column, tension as a `mono-meta text-warning-text` line rather than a pill badge (`:104`); row boundary is `border-b border-border-secondary` (`:67`). The scale itself is `PairedAxisScale` — cross-reference Step 1 instead of respecifying a bar.

- [ ] **Step 6: Correct the Scoring Breakdown and Share Buttons subsections**

Lines 332–360. **Call it a disclosure toggle, not a "disclosure summary."** Verified during Task 5: it is a `<button type="button" aria-expanded>`, and the repo has only two real `<summary>` elements — the archetype reference's (which takes `label`) and the persona modal's (which takes `body-s`). Neither takes `label-nav`. The scoring toggle does take `label-nav` with a `focus-ring`, and its accessible name is the visible label plus an `sr-only` axis name — the retired `aria-label` shared no words with the visible text, so voice control stopped matching it (`AxisBreakdownCard.tsx:116-138`). The expanded panel is a three-column `mono-meta` grid over a `--rule-hairline` top border, with the weighted formula below (`:142-163`). Share buttons are `Button variant="secondary"`, not hand-rolled 8px-radius chips (`ResultsView.tsx:86`, `:107`, `:124`).

- [ ] **Step 7: Correct the Compass Plot subsection**

Lines 204–235. Shipped from `CompassPlot.tsx`: `SIZE` 400, `PADDING` 50, dot r=6, **pole labels moved inside the square** at 11px (`POLE_FONT`), a 6-step grid rather than one dashed moderate ring, a leader line and a `mono-meta` coordinate readout with collision avoidance (`:111-118`), archetype positions plotted as short labels (`:70-80`), and grid lines on `--rule-hairline` — explicitly **not** `stroke-stone-50`, which would read as near-white hairlines in dark (`:150`). Contour paths survive as the one decorative element, at `--contour-opacity` (0.08 light / 0.05 dark).

- [ ] **Step 8: Verify every citation, then run the guard**

```bash
sed -n '13,60p;110,170p' src/components/results/CompassPlot.tsx
sed -n '27,36p;95,215p' src/components/results/RadarChart.tsx
sed -n '60,170p' src/components/results/AxisBreakdownCard.tsx
sed -n '130,280p' src/components/results/ArchetypeCard.tsx
grep -n "scoreToTrackPercent\|role=\"img\"\|aria-hidden" src/components/PairedAxisScale.tsx
npx vitest run tests/unit/design-docs.test.ts -t "names PairedAxisScale"
```

Expected: the `PairedAxisScale` case PASSES.

- [ ] **Step 9: Commit**

```bash
git add docs/system_proposal/governance_compass_design_spec.md
git commit -m "docs(design): specify PairedAxisScale, correct five component sections

Adds delta 05's shared primitive with its 6%-94% mapping and its role=img
accessibility contract, and corrects the archetype card, tension callout,
radar, axis breakdown, scoring disclosure, share row, and compass plot to
the treatments phase 4 shipped. Retires the per-page 'axis bar' spec that
ScoreBar implemented before it was deleted."
```

---

## Task 8: Design spec — Quiz Phase Theming

**Files:**
- Modify: `docs/system_proposal/governance_compass_design_spec.md:364-416`

- [ ] **Step 1: Correct Phase 1: Forced-Choice**

Lines 368–375. The selected state is **not** a 2px Stone 600 border. Shipped (`ForcedChoiceCard.tsx:59-69`): a 1px border in every state, so the border never changes the card's metrics; selected takes `--rule-strong` (ink), unselected-with-a-selection-present takes `--border-secondary` at `opacity-60` with a hover back to full, and no-selection-yet takes `--border-secondary` with a Stone 600 hover. Selection also renders a `label`-weight text marker (`:106`).

Focus is `focus-ring-child`, not `focus-ring`: the ring belongs on the card but the focusable element is the `sr-only` button inside it. State why it is scoped to a **direct** `button` child — fifteen glossary terms match text in the forced-choice bank, and each is a focusable `span[role="button"]`; an unscoped `:has(:focus-visible)` would ring the whole card while focus sat on an inline term.

`Next` is `variant="primary"` — an ink fill (`QuizFlow.tsx:334`). This is spec decision D1 and it is the reason `CLAUDE.md`'s count-based filled-button rule was rewritten. Say so here too, so a reader of either document finds the decision.

- [ ] **Step 2: Correct Phase 3: Chancellor's Budget**

Lines 390–399. **7 ministries, not 10** (`src/data/ministries.ts:26-98`): Defense, Public Welfare, Economy & Growth, Education & Research, Environment, Justice & Civil Liberties, Foreign Affairs. Each carries a lucide icon. The confirm button is `Button` (primary, ink) at `w-full`, not a Stone 600 background with a 12px radius (`BudgetSimulator.tsx:209`).

- [ ] **Step 3: Correct Progress and Pre-Quiz Introduction**

Lines 401–416. The progress bar is a mono `label-nav` label row (`Phase N · <name>`, and `M of N`) over three equal 3px segments with a 1-unit gap; completed and active segments fill `bg-stone-600`, future segments are transparent on a `--border-secondary` track (`ProgressBar.tsx`). Note the open accessibility gap: it conveys progress to sighted users only (issue #146).

The pre-quiz introduction's title is `display-page`, not 22px. Delete the sentence claiming the begin button is "one of only two filled/primary buttons on the entire site" — that is the exact claim D1 overturned.

- [ ] **Step 4: Correct Phase 2: Scaled Items**

Lines 377–388. Read `src/components/quiz/ScaledQuestionCard.tsx` and correct the segmented-bar description to what phase 3 shipped, including the keyboard 1–5 affordance the old spec omits. Do not invent — if a detail is unclear from the source, describe what is there and leave the rest out.

- [ ] **Step 5: Run the guard**

Run: `npx vitest run tests/unit/design-docs.test.ts -t "design spec"`

Expected: `describes 7 ministries` and `no longer prescribes a 2px Stone 600 forced-choice selection` now PASS.

- [ ] **Step 6: Commit**

```bash
git add docs/system_proposal/governance_compass_design_spec.md
git commit -m "docs(design): correct the quiz theming to what phases 3 shipped

Seven ministries, not ten. The forced-choice selection is a 1px --rule-strong
border plus a text marker, not a 2px Stone 600 border. The ink Next and the
ink budget confirm, with D1 named. focus-ring-child and why it is scoped to a
direct button child.

Deletes the 'one of only two filled buttons on the entire site' claim, which
is the exact sentence D1 overturned. Notes #146 on the progress bar."
```

---

## Task 9: Design spec — Responsive, Animation, Iconography, Accessibility

**Files:**
- Modify: `docs/system_proposal/governance_compass_design_spec.md:420-498`

> **Task 8 handed you four more findings, each verified against source.** Two of them are the *second offenders* keeping guard cases red — which is why Task 8 turned two cases green instead of the four its brief predicted:
>
> - **`Budget: all 10 ministries visible, 2-column grid`** — this is the second offender on `describes 7 ministries, not 10`. There are seven, and the budget is a **single column at every width**, never a 2-column grid.
> - **`the border width change from 0.5px to 2px`** in `## Accessibility Notes` — the second offender on the forced-choice selection case. Both go green when you land.
> - **Every ">768px" breakpoint in this block is wrong.** Forced-choice side-by-side, the segmented bar, and the budget layout all switch at **560px**. Task 8's section now states 560px throughout, so this block currently contradicts it.
> - **`## Animation and Transitions` prescribes a phase crossfade that does not ship.** "Phase transitions: 300ms fade — simple opacity crossfade between phases" — there is no such crossfade; the only 300ms in the quiz is the progress fill's `transition-all`. And "Selection state changes: 150ms — border color, background color" omits **`opacity`**, which both quiz cards had to name explicitly in a `transition-[…]` list because Tailwind's `transition-colors` set excludes it.
>
> **Task 8's review added one more for you.** `## Animation and Transitions` now **duplicates the computing screen** that Task 8's section describes precisely, but with looser numbers — "1.5–2s" against the shipped 1.8s, and "animating across the top" when the line is centred in a `max-w-lg` column. The rewrite created this rot surface by being more accurate than its neighbour. Reconcile the two: keep the precise description where it belongs and make this block point at it rather than restating it worse.
>
> **REQUIRED, and unguarded.** Two further lines in this block were falsified by Task 6 and no guard case covers either:
>
> - **Three separate "Hero grid" lines** — desktop ("2 columns (compass + archetype card)"), tablet ("2 columns still, but tighter gap (1rem)"), and mobile ("single column (compass stacked above archetype card)"). There is no hero region. Phase 4 moved the compass to the bottom and delta 04 removed the two-column grid. Task 6's Page Structure now says so flatly; this line contradicts it.
> - **"Axis breakdown: Pole A/B labels shrink to 64px"** — the two 82px pole columns are **gone**, not resized. The shipped grid is `[24px | minmax(0, 1fr) | 210px]` above 560px, collapsing to two columns below with the meta cell re-entering under the scale. `PairedAxisScale` ate those columns.
>
> Only the 10-ministries line in this block is guarded, so this task can go green with both falsehoods intact. Fix them.

- [ ] **Step 1: Correct Responsive Breakpoints**

Lines 420–448. The codebase's breakpoint is `min-[560px]`, used throughout (`ArchetypeCard.tsx:169`, `AxisBreakdownCard.tsx:76`, `ForcedChoiceCard.tsx:121`), not the 768/560 tablet/desktop trio the old table implies. Correct the budget row to 7 ministries. Note the open mobile-nav gap at 390px (issue #141) and the two measured `/study` overflow defects (issue #154) rather than implying the site is clean at every width.

- [ ] **Step 2: Correct Animation and Transitions**

Lines 452–474. Shipped: the four named keyframes in `globals.css:309-362` (`loading-slide`, `petal-reveal`, `fade-in-up`, `archetype-target-fade`); `FadeInSection`'s 300ms opacity + 12px translate on intersection, with a `delay` prop the results page staggers at 100/200ms; the archetype `:target` rail, which is pure CSS so `/archetypes` stays a server component, and which rides `[data-entry-inner]` rather than the full-bleed `:target` section — anchoring it to the section paints at the viewport edge, hundreds of pixels left of the prose it marks.

MUST state the global reduced-motion rule (`globals.css:300-306`): every transition and animation collapses to 0.01ms. The old section did not mention reduced motion at all, which for a document that prescribes animation is the more serious omission than any wrong duration.

Keep "no parallax, no springs, no particle effects." Delete the radar's optional 600ms vertex-extension animation if it did not ship — **verify before deleting**.

- [ ] **Step 3: Rewrite Iconography**

Lines 478–487. The claim that the site "uses almost no icons" and that its three exceptions are all text characters is false. Shipped: 7 lucide ministry icons in `BudgetSimulator`, mirrored in `BudgetComparison`, plus `X`, `ExternalLink`, `Users`, and `Bookmark` in `/study`. State the surviving rule — line icons at 16px, never filled, never coloured, never larger — and keep the text-character exceptions that are still text characters (`▸`/`▾` disclosures, `−`/`+` steppers, the `!` tension glyph).

- [ ] **Step 4: Rewrite Accessibility Notes**

Lines 491–498. This is the section where a stale claim does the most damage, so rewrite rather than patch.

MUST state:
- `focus-ring` is the app's single focus affordance, and it must use the `outline` **shorthand**. The spelling it replaced — `focus:outline-none focus-visible:outline-2` — **was silently broken in all 25 of its call sites**: `outline-none` emits `--tw-outline-style: none`, `outline-2` emits `outline-style: var(--tw-outline-style)`, and since `:focus` always matches when `:focus-visible` does, the style resolved to `none`. Width and colour applied; no ring was ever drawn. Confirmed in Chromium. A source guardrail now fails on any reintroduction of `focus:outline-none`.
- `focus-ring-child` and its direct-child scoping (cross-reference Task 8 Step 1).
- `--text-label` and the D7 measurement: Stone 500 is 2.73:1 on the light page ground and 3.28:1 on white panels, under AA's 4.5:1 and under the 3:1 large-text floor, while clearing it at 4.81–5.67:1 on dark. Hence the mode step to Stone 700 / Stone 500.
- The 11px floor as an accessibility floor, not only a stylistic one.
- The forced-choice selection's non-colour signal is the **text marker plus the opacity difference**, not a border width change. Delete the old claim.
- `PairedAxisScale`'s `role="img"` contract: the subtree is presentational, so the `aria-label` is the only channel. `RadarChart` carries an `sr-only` table of all 12 scores.
- The open gap: the progress bar conveys progress to sighted users only (#146).

- [ ] **Step 5: Run the guard and the full suite**

```bash
npx vitest run tests/unit/design-docs.test.ts
# Expected: everything PASSES except the banner case (Task 10).
npm test
# Expected: PASS. No source file changed in Tasks 4-9, so a failure here means
# a guard in another spec reads these docs — find it before continuing.
```

- [ ] **Step 6: Commit**

```bash
git add docs/system_proposal/governance_compass_design_spec.md
git commit -m "docs(design): rewrite the accessibility notes, icons, and motion

Records the focus-ring shorthand and the 25-call-site bug the hand-rolled
spelling hid, the D7 contrast measurements behind --text-label, the 11px
floor as an accessibility floor, and PairedAxisScale's role=img contract.
Deletes the false claim that a 0.5px-to-2px border width is the
forced-choice non-colour signal.

Adds the global reduced-motion rule, which a document prescribing animation
should not have omitted. Corrects the icon claim: lucide ships 11 real SVG
icons. Notes #141, #146, #154 rather than implying clean coverage."
```

---

## Task 10: Design spec — drop the banner, record the handoff

The banner comes off last. It is the document's own admission that it cannot be trusted, and removing it before Tasks 4–9 land would be a false claim in the one file this phase exists to make honest.

**Files:**
- Modify: `docs/system_proposal/governance_compass_design_spec.md:1`

- [ ] **Step 1: Read the whole document end to end**

```bash
cat docs/system_proposal/governance_compass_design_spec.md
```

Not a formality. You are about to assert the document is current. Look for: sections Tasks 4–9 did not touch (Design Philosophy at 5–13, File/Asset Summary at 502–512 — the latter claims "the design works with system fonts, no web font loading required", which Source Serif 4 falsifies), internal cross-references that now point at renamed content, and any value that disagrees with the citation table.

Fix what you find. If something is genuinely still unresolved, **the banner stays** and is rewritten to name only that — do not remove it to close a checkbox.

- [ ] **Step 2: Replace the banner with a provenance header**

Replace line 1 with:

```markdown
> **Current as of the design system delta (2026-09).** This document describes
> what ships. The delta's own decision record — including the seven numbered
> decisions D1–D7 this document reflects — is
> `docs/superpowers/specs/2026-09-08-design-system-delta-design.md`, and the
> per-phase plans are `docs/superpowers/plans/2026-09-0*-design-system-delta-*.md`.
>
> **Handoff bundle.** The original mocks are `docs/gov_compass_redesign.zip`,
> which is the canonical copy — no extracted duplicate is tracked. Read them
> with:
>
> ```bash
> unzip -o docs/gov_compass_redesign.zip -d /tmp/gov-compass-handoff
> # design_handoff_governance_compass_redesign/Design system delta.dc.html   — the six deltas
> # design_handoff_governance_compass_redesign/Home proposals.dc.html        — options 5a, 6a, 6b
> # design_handoff_governance_compass_redesign/Page mocks.dc.html            — options 7a, 7b, 7c
> ```
>
> The `.dc.html` files are **design references, not production code.** They are
> inline-styled prototypes; recreate designs with this repo's token and Tailwind
> mechanisms rather than porting their markup.
>
> **Known open work**, so this document does not read as describing a finished
> system: `/study` has not adopted delta 04 and carries three measured layout
> defects (#154); `comparison/` and `groups/` hold 17 frozen Stone 600 mark
> tones that do not step in dark mode (#155); bare `rounded` and the radius
> namespace are unswept (#139); the mobile nav has no hamburger at 390px (#141);
> the progress bar conveys progress to sighted users only (#146).
```

- [ ] **Step 3: Verify the unzip command actually works**

```bash
unzip -o docs/gov_compass_redesign.zip -d /tmp/gov-compass-handoff
ls "/tmp/gov-compass-handoff/design_handoff_governance_compass_redesign/"
```

Expected: the three `.dc.html` filenames, spelled exactly as the header claims. **If a path or filename differs, correct the header** — a documented command that does not run is worse than no command. Then clean up: `rm -rf /tmp/gov-compass-handoff`.

- [ ] **Step 4: Run the guard green**

```bash
npx vitest run tests/unit/design-docs.test.ts
# Expected: ALL PASS.
```

- [ ] **Step 5: Commit**

```bash
git add docs/system_proposal/governance_compass_design_spec.md
git commit -m "docs(design): drop the outdated banner, record the handoff provenance

Tasks 4-9 earned it: every section now describes what ships. Replaces the
banner with a provenance header pointing at the delta spec and the per-phase
plans, records docs/gov_compass_redesign.zip as the canonical handoff copy
with a verified unzip command, and lists the five open issues so the document
does not read as describing a finished system.

Closes issue #137's first and last checkboxes."
```

---

## Task 11: Retire `--text-tertiary`

Phase 5b deferred this here, predicting the token would have zero consumers once that phase landed. It has two, both in the dev-only widget — so this is a small sweep plus a deletion, not the one-liner the prediction assumed. Doing it here is still right: a full release has gone by, which was the actual reason for waiting.

**Files:**
- Modify: `src/components/DevRandomResults.tsx:45`, `:57`
- Modify: `src/app/globals.css:28`, `:143`, `:224`
- Modify: `tests/unit/design-docs.test.ts`

- [ ] **Step 1: Write the failing guard**

Append to `tests/unit/design-docs.test.ts`:

```ts
describe("--text-tertiary is retired (phase 5b deferral)", () => {
  it("declares no --text-tertiary in any layer of the sheet", () => {
    // Three declarations to remove: :root, the dark override, and the
    // @theme inline mapping that generates `text-text-tertiary`. Leaving the
    // mapping behind is the subtle half — the class keeps compiling, to an
    // undefined value, which renders as inherited rather than as a visible
    // break.
    expect(css).not.toMatch(/--text-tertiary\s*:/);
    expect(css).not.toMatch(/--color-text-tertiary\s*:/);
  });

  it("has no consumer of the token left in src", () => {
    // Both spellings. The class carries a SINGLE hyphen before
    // `text-tertiary`, so a /--text-tertiary/ pattern — the obvious one —
    // misses `text-text-tertiary` entirely. That exact miss is recorded in
    // tests/unit/study-label-layer.test.ts:236.
    const offenders = sourceFiles(resolve(process.cwd(), "src")).flatMap((file) => {
      const text = readFileSync(file, "utf8");
      const match = text.match(/(?:--|text-)text-tertiary/);
      return match ? [`${relative(process.cwd(), file)}: ${match[0]}`] : [];
    });

    expect(offenders).toEqual([]);
  });
});
```

Add the imports this needs at the top of the file: `relative` from `node:path`, and `sourceFiles` from `../helpers/source-files`. **Import `sourceFiles` only.** `tests/helpers/source-files.ts` also exports a `read`, and it is not interchangeable with this spec's local one: the helper's `read` **strips comments** (`source-files.ts:28-31`). That is right for scanning source, and wrong here — the design spec shows CSS in fenced code blocks, so a `/* … */` inside one would be silently eaten before the guard ever saw it, and a documented token could go missing without reddening anything. Keep the local `read` raw, and keep the comment-stripping confined to the `css` constant.

- [ ] **Step 1b: Correct two carried-over defects in this file while you are in it**

Both were found by Task 1's re-review, judged non-blocking, and deferred to whichever task next opened the file. That is this one.

**(a) The `tokenRef` rationale comment overstates its own measurement.** The comment at `design-docs.test.ts:75-82` claims "six of the eight tokens these cases assert have a real superset sibling" and names the three `@theme inline` aliases plus `--focus-ring-child`. Measured against the sheet, only **two** of the eight do: `--radius` → `--radius-sharp`, and `--button-primary` → `--button-primary-hover` / `-fg`. The `@theme inline` aliases are prefix-*extensions* (`--color-text-label` does not contain `--text-label`), and `--focus-ring-child` is an `@utility` name, not a custom property — `--focus-ring` is declared once at `globals.css:71` with no sibling.

`tokenRef` is still strictly stronger than the bare `toContain` it replaced, and mutation M6 proved the hazard is real for the genuine suffix siblings — the guard is fine. But this file's header asserts that every assertion was measured in both directions, so a mismeasured rationale is exactly the wrong thing to leave in it. Correct the count to two, and note the forward-looking case (Tasks 2–10 may introduce suffix siblings like `--container-shell-wide`).

Then fix the proof line that proves nothing: `design-docs.test.ts:216` asserts `ref("--text-label").test("\`--color-text-label\` in \`@theme inline\`")` is `false` — but that passes with the lookahead *removed*, so it exercises nothing. Verified by mutation: lines 212, 214 and 215 are load-bearing; 216 is not. Either drop it or replace it with a genuine suffix-sibling case.

**(b) `linesMatching` makes any cross-line needle silently un-matchable.** Three current needles use `\s+`, which matches `\n`. If prose wraps as `12px\n(large radius`, the `absent()` case goes green without the claim having been retired. Harmless today, but Tasks 4–10 added ~450 lines of prose, so the hazard is now live. Add either a one-line note at `linesMatching` that needles must be single-line, or a dev-time assert that the pattern source contains no newline-capable class.

- [ ] **Step 1c: Pin the provenance header — it is the document's last unguarded rot surface**

Task 10 replaced the `PARTIALLY OUTDATED` banner with a provenance header naming the handoff bundle's four `.dc.html` filenames, the decision record's path, and the per-phase plans glob. **The guard pins only the string `gov_compass_redesign.zip`.** Everything else in that header is unpinned prose — which is the exact shape of the claim that cost Task 10 a correction mid-task: the plan asserted three `.dc.html` files and there are four.

Task 10's implementer proposed this guard and then declined to write it, on the grounds that authoring a guard for one's own section on the last commit to a document is self-marking. That judgement was right, which is why it lands here instead.

Add to `tests/unit/design-docs.test.ts`:

- **Unzip `docs/gov_compass_redesign.zip` to a temp dir** (`fs.mkdtempSync(join(tmpdir(), …))`, not a bare `/tmp` path — agents share that namespace here) and assert that **every** `.dc.html` filename it contains appears verbatim in the spec. Derive the list from the archive, never hardcode it: a hardcoded list drifts in lockstep with the prose and pins nothing. Clean the temp dir up in an `afterAll`.
- **`existsSync` on the decision-record path** the header names, so a moved or renamed spec reddens.
- **Assert the plans glob actually matches something**, and ideally that it matches every `design-system-delta` plan on disk — the draft `2026-09-0*` caught 3 of 7 because the phases ran past the 9th.

Two cautions. If unzipping in a test is too slow or brittle for this suite, reading the archive's central directory listing is enough — you only need filenames, not contents. And **check the vacuity trap first**: confirm the assertions can fail, by mutating a filename in the spec and watching it redden, before you trust a green.

- [ ] **Step 2: Run it and confirm it fails**

```bash
npx vitest run tests/unit/design-docs.test.ts -t "text-tertiary is retired"
```

Expected: both cases FAIL. The second must name `src/components/DevRandomResults.tsx: text-text-tertiary`. **If it names any other file, stop** — the sweep is wider than this task scopes, and the extra sites need their own decision.

- [ ] **Step 3: Sweep the two call sites**

In `src/components/DevRandomResults.tsx`, replace `text-text-tertiary` with `text-text-label` at line 45 and line 57 (two occurrences, one each).

Do **not** also fix this file's `text-[10px]`, `text-[9px]`, or `rounded-[6px]` — all three are below the delta's floors and none is caught by an existing guard, but this is a dev-only widget with its own open issue (#147) and widening the diff here buries the token retirement. Step 6 records them.

- [ ] **Step 4: Delete the three declarations**

Remove from `src/app/globals.css`:
- line 28: `  --text-tertiary:  #9d8b78;`
- line 143: `    --text-tertiary:  #9d8b78;`
- line 224: `  --color-text-tertiary:  var(--text-tertiary);`

Then update the `--text-label` comment at `globals.css:29-36`, whose last sentence — "Distinct from `--text-tertiary`, which stays Stone 500 in both modes until the per-screen phases sweep its call sites" — describes a token that no longer exists. Replace that sentence with: `The --text-tertiary token this replaced was Stone 500 in both modes and was retired in phase 6, once every call site had moved.`

- [ ] **Step 5: Run the guards and the full suite**

```bash
npx vitest run tests/unit/design-docs.test.ts
# Expected: ALL PASS.
npm test
# Expected: PASS. Roughly 20 existing cases assert text-text-tertiary is ABSENT
# from a file; none asserts the token EXISTS (verified at plan time). If one
# reddens, it is asserting presence — read it before changing it.
npm run typecheck && npm run lint
# Expected: PASS, --max-warnings=0.
```

- [ ] **Step 6: Mutation-check both new cases**

```bash
# M5 — the declaration case must catch the @theme mapping, not only :root.
#      Restore ONLY the mapping and confirm the case still reddens.
sed -i '/--color-text-secondary/a\  --color-text-tertiary:  var(--text-tertiary);' src/app/globals.css
npx vitest run tests/unit/design-docs.test.ts -t "declares no --text-tertiary"
# Expected: FAIL. A case that only checked :root would pass here — which is
# the whole point of asserting both patterns.
git checkout -- src/app/globals.css   # NOTE: reverts Step 4. Re-apply it.

# M6 — the consumer case must catch the CLASS spelling, not just the var.
sed -i 's/text-text-label/text-text-tertiary/' src/components/DevRandomResults.tsx
npx vitest run tests/unit/design-docs.test.ts -t "no consumer of the token left"
# Expected: FAIL, naming DevRandomResults.tsx.
git checkout -- src/components/DevRandomResults.tsx   # reverts Step 3. Re-apply it.
```

Re-apply Steps 3 and 4 after the mutations and re-run Step 5 before committing. Record both outcomes.

- [ ] **Step 7: Verify the visual result on the production build**

`next dev` reload-loops under a driven browser, so use the production build:

```bash
npm run build && npm start
```

Then load `/` and confirm the dev widget's label and buttons are still legible in both colour schemes. `--text-label` is Stone 700 in light (darker than the Stone 500 it replaces, so contrast improves) and Stone 500 in dark (unchanged). A blank or inherited-colour label means a declaration was removed that something still reads.

- [ ] **Step 8: Commit**

```bash
git add src/app/globals.css src/components/DevRandomResults.tsx tests/unit/design-docs.test.ts
git commit -m "refactor(design): retire --text-tertiary

Phase 5b deferred this to phase 6 predicting zero consumers. There were two,
both in the dev-only widget; they move to --text-label, which is strictly
higher-contrast in light and identical in dark. Removes all three
declarations including the @theme inline mapping — leaving that behind keeps
text-text-tertiary compiling to an undefined value, which inherits rather
than breaks visibly.

Guard asserts both spellings: the class carries a single hyphen before
text-tertiary, so a /--text-tertiary/ pattern misses it entirely.

Mutations M5/M6 verified. DevRandomResults' sub-11px type and rounded-[6px]
are left for #147 rather than buried in this diff."
```

---

## Task 12: Reconcile the delta spec, open the follow-ups, run every gate

**Files:**
- Modify: `docs/superpowers/specs/2026-09-08-design-system-delta-design.md` (phasing table)
- Modify: `docs/superpowers/plans/2026-09-16-design-system-delta-docs.md` (this file)

- [ ] **Step 1: Mark phase 6 shipped in the delta spec's phasing table**

Update the `| 6 | *(to write)* | Docs: … |` row to name this plan document, matching how phases 1–5 were recorded. Check whether the table already reflects the 5/5b split that `2026-09-14-design-system-delta-reference.md:3015` said it should; if not, fix that too — this is the last chance, and the roadmap is what a reader hits first.

- [ ] **Step 1a: Apply the deferred `CLAUDE.md` polish**

Six Minor items from Tasks 2 and 3's reviews, approved-with-findings and deferred here because no intervening task reopens the file. All are wording or trim; none changes a rule.

1. **The `public/study/derived/` parenthetical reads as closed but is not.** The directory holds 11 files; the bullet names 7. Missing: `country_aggregates.json`, `distance_distribution.json`, `model_agreement_by_attribute.json`. Appending `, and \`home_sample_pair.json\`` tightened a loose list into a falsely exhaustive one. One-word fix: `…, case-study picks, plus \`home_sample_pair.json\``.
2. **"paired-axis panel" is a name that exists nowhere in the repo.** The panel's own eyebrow is `Illustrative profile` (`src/app/page.tsx:96`); the code comment calls it the "Payoff block"; `PairedAxisScale` is the component. An agent grepping the phrase finds only `CLAUDE.md` and this plan. Use the greppable string: "the home page's `Illustrative profile` panel".
3. **That bullet is 88 words against neighbours at 18–32.** Its closing sentence restates a claim already in Architecture Notes (`data/synthetic_study/` never reaching a client bundle) and duplicates `page.tsx:6-10` nearly verbatim. Cut to roughly 50 words, keeping the D2 rationale — that part is not recoverable elsewhere.
4. **"(spec decision D2)" is unresolvable where it sits.** The path appears only at `:92`, 44 lines later, and `docs/superpowers/specs/` has no Key Directories entry — while `:41` still labels `docs/system_proposal/` "Authoritative specs." Write "design-delta spec decision D2" at the `:48` site. Whether the specs directory earns its own Key Directories bullet is a judgement call; make it here or record why not.
5. **Carry-over B still rots slowly.** "A few pre-delta call sites still sit below it" goes false unguarded if those three sites are swept — and Task 11 sweeps two of the three. A form that never rots: "Any pre-delta *call sites* below it are unswept, not exceptions." **Do this after Task 11, not before.**
6b. **`CLAUDE.md`'s Design Principle 5 prescribes an expand animation that does not exist.** It reads "Minimal animation (150ms selections, 120ms hovers, **200ms expands**)." Task 9 verified there is **no `max-height` transition and no measured-height animation anywhere** — expandables do not animate at all, and the design spec now says so. The two documents contradict each other on a number, and `CLAUDE.md` is the stale one. Drop the expands figure, or replace it with the fact that disclosure is instantaneous by design.

7. **`CLAUDE.md:77` says "the three axis domains". There are four.** `DOMAIN_COLORS` declares `economic`, `power`, `society`, `world` (`src/lib/design-tokens.ts:30,37,44,51`) and `globals.css` declares four `--domain-*` tokens. The three named hues — slate, sage, clay — cover power, society and world; **Economic's mark is Stone**, which is why the domain colours get miscounted as three. Task 2's review caught the three-vs-four tension and the fix resolved it by dropping the number from the *new* sentence at `:74`, which left the actual error standing one line below. Fix `:77` itself: "which of the four axis domains a mark belongs to — Economic's being the Stone accent, which is why the domain hues are often named as the three that are not Stone."

   While in that sentence: it also carries a **seven-item page list** ("the results radar and axis breakdown, `PairedAxisScale` everywhere it appears, `/axes`, `/questions`, `/compare`, the home page, and `/study/patterns`…"). That is precisely the rot shape Task 2's review stripped from four other places, and this very line is the one whose previous version was wrong about its own scope. Replace the enumeration with the rule it is reaching for: domain colour is permitted wherever an axis is drawn, and nowhere else.

8. **A verification claim behind the `:48` prose was wrong, though the prose survives it.** `home_sample_pair.json` has five top-level keys, not two: the two respondents plus `distance`, `divergent_axis_ids`, and `tension_axis_id`, the last two of which `page.tsx:28-29` actually consumes. Each respondent is `{persona_id, archetype_id, axis_scores}`, not a persona object. "Two real synthetic-study personas" is a defensible gloss for a directory bullet — keep it if you like, but know it is a gloss, and do not let the next task that reads this file re-derive the wrong shape from it.

- [ ] **Step 1a2: Apply the deferred Component Specifications polish**

Eleven items from Task 7's review, which approved the section. No task between 7 and 12 reopens it. **Two are factual errors** in a section whose purpose is factual accuracy — do those first and do not let them slide.

**Important — both are single-clause factual fixes:**

1. **"a two-column home row" is false.** In `### PairedAxisScale`, the sentence listing how consumers wrap the primitive differently says the home page uses a two-column row. `src/app/page.tsx:112` is `min-[560px]:grid-cols-[24px_1fr_158px]` — **three** columns, with its own adjacent comment reading "index, scale, name across the three columns." It is the same shape as the breakdown row it is being contrasted against; they differ only in the third column's width. This is the one checkable number in that paragraph.
2. **"more than a line's worth of offset" is false, and it threw away a measurement.** In `### The Axis Breakdown`, the `items-start` rationale. The source comment says centring detaches the index from the name "by 11-15px". `body-s` is 13.5px/1.6 = a 21.6px line box; `mono-meta` is 11px/1.4 = 15.4px. 11–15px is **less** than either, so the claim is false on both readings — and converting a measured range into an unverifiable qualitative claim is backwards for a register that exists to show the measurement behind the rule. Restore the range.

**Minor:**

3. Radar tooltip stroke is `--border-secondary` at 0.5px, but the text calls it "a hairline stroke". The document uses "hairline" as a token name throughout, so a reader will take it as `--rule-hairline`. Name the actual token.
4. The Component Rules bullet "Domain colour goes on marks, never on chrome… **Not borders**" is over-broad: the domain rule *is* a border (`border-t-2` with the domain mark), and the home page's divergence items use a domain-coloured `border-l-2` outside any domain block, which `CLAUDE.md` explicitly permits.
5. The rule "A disclosure is a `<button aria-expanded>`" contradicts the same section's acknowledgement of real `<summary>` elements and Typography's "disclosure summaries" row. The load-bearing half is the second clause — reduce it to "A disclosure's accessible name contains its visible label."
6. "the only two-column region left on the results page" holds at ≥560px only; below it the axis row is two columns and the archetype grid is one.
7. "`/compare` … has no legend for a dot to appear in" — `/compare` *does* have a legend (`ComparisonRadar`'s two-item line key). Scope it to *dot* legends. Pointed, given the correction it accompanies is itself about legend attribution.
8. The `ComparisonScoreBar` inventory omits the tagline and the `alternateRow` fill it also owns.
9. The `primary`-fill rationale says "reserved for the page's own call to action"; `CLAUDE.md` reserves it for **assessment actions** specifically. The spec is looser than the binding rule.
10. The paragraph beginning "The track is the one place the scale spells a hex" is ~150 words as one chained sentence — the section's only wall. Split it.
**From Task 8's review (Quiz Phase Theming, approved):**

12. **"The mobile list mirrors the forced-choice card exactly" over-claims on the one property the section had just made a point of.** `ForcedChoiceCard`'s base is `transition-[border-color,opacity]`; `ScaledQuestionCard`'s `mobileButtonClasses` is `transition-colors` while still carrying `opacity-60 hover:opacity-100`. So the mobile row's opacity hover **snaps** — precisely the bug the Phase 1 paragraph explains at length. Everything after the em-dash is true, so nothing is false; "exactly" is what papers over a real shipped inconsistency. Half a sentence fixes it.
13. **Two rule-list bullets are broader than the section's own body.** "State is a border tone, an opacity, or the ink fill — **never a new background**" is contradicted three times by the section's own blocks (scale segment hover ×2, stepper hover all use Surface 2); narrow it to a *selection* state. And "Prompts, phase labels and the selected marker take a `label` role" points an implementer back at something deliberately undone: the budget instruction line does **not** take `label`, and `BudgetSimulator` carries the measurement for why — 85 characters at 11px/0.12em wraps to two all-caps lines at every width, and it sat in the identical role, size and colour directly above "Points remaining". **That measurement belongs in the doc**; the reviewer called it the best example on the screen of the register this phase asked for.
14. **The budget track is argued square ("a 6px bar with a corner on it is a pill") while the computing screen's 2px track ships `rounded-full` on both track and line.** The One Radius rule exempts `999px`, so nothing is violated — but the asymmetry is unremarked and a reader will notice it before the spec does.
15. **`D1`, `D6` and `D7` are referenced throughout the design spec with no pointer to where the numbered decisions live.** `CLAUDE.md` names the path; the design spec never does. Pre-existing across all the approved sections. One line in the provenance header Task 10 writes would close it — check whether Task 10 already did before adding a second pointer.

11. `### PairedAxisScale`'s docstring note: the component's own JSDoc claims four consumers; there are six. The spec correctly enumerates all six, so nothing needs changing here — but the stale docstring is source and belongs in the stale-JSDoc ticket alongside `getDomainColor600` and `PairedAxisScale`'s dot-colour comment.

- [ ] **Step 1b: Correct the delta spec's false ordering claim (line 141)**

`docs/superpowers/specs/2026-09-08-design-system-delta-design.md:141` currently reads:

> …depends on which properties the custom rule declares, so `label tracking-[0.06em]` wins but a single-property custom utility would lose to `tracking-*`. Verified against Tailwind 4.3.3 by compiling both cases.

**The second clause is false**, and the "verified by compiling" claim makes it worse — it asserts evidence for something the evidence contradicts. Re-measured during phase 6 by compiling a probe through this repo's own `@tailwindcss/postcss` at Tailwind 4.3.3. Emitted order, by byte offset in the output sheet:

```
.block < .inline-block < .px-6 < .px-[34px] < .labelx < .tracking-[0.06em] < .onlytrack < .uppercase
```

(`labelx` = a multi-property `@utility` mirroring `label`; `onlytrack` = a single-property `@utility` setting only `letter-spacing`.) All are single-class selectors, so specificity is equal and source order decides.

So: the multi-property custom utility lands **before** `tracking-*` and is overridden by it — which is what the spec's first clause describes, from the opposite side. But the single-property custom utility lands **after** `tracking-*` and **wins**, which is the reverse of what the spec claims.

Fix the sentence to state the measured behaviour, and keep the conclusion — it is unchanged and is the only part that matters: the order depends on what the custom rule declares, which is too subtle to build on, so a role that needs a variant gets a named sibling.

Do **not** change the two `globals.css` comments at `:501-503` and `:532-533`. They say only "too subtle to rely on" and make no directional claim, so they are already correct.

- [ ] **Step 1c: Correct D7's contrast overreach in the delta spec**

Task 4's review found that D7 (`docs/superpowers/specs/2026-09-08-design-system-delta-design.md`, around line 200) states Stone 500's light-mode figures — 2.73:1 on the page ground, 2.99:1 on the quiet band, 3.28:1 on white panels — and then qualifies all three with "under AA's 4.5:1 and under even the 3:1 large-text floor."

**3.28 is above 3:1.** The figures are individually exact; the qualifier generalises over all three and breaks on the third. `globals.css:29-32` makes the same claim *correctly* by scoping it to the page ground alone, which is how the error is detectable at all.

Scope the clause to the two figures it holds for. D7's conclusion is unaffected — the token still has to step, because 3.28:1 fails AA's 4.5:1 for the small text it styles regardless of the large-text floor. Fix the sentence, keep the decision.

While in that file, check D7's "its other 141 call sites are swept by the per-screen phases" — there are **two** left, both in the dev-only widget, and Task 11 retires them. Either update the figure or mark it as of-its-time.

- [ ] **Step 1d: Correct issue #154's `rx` premise — it is measurably wrong**

#154's "Smaller items" section states that `rx="var(--radius)"` **as an attribute does not resolve** and needs `style={{ rx: … }}`. Task 6 measured it in real browsers and it is false.

Method (worth repeating if anyone doubts it): with `:root { --r: 20px }`, a `<rect rx="var(--r)">` computes `rx: 20px` and **paints the corner** — `document.elementFromPoint` at the box corner misses the rect, exactly as the `style={{ rx }}` and `rx="20"` controls do, while the no-`rx` control computes `auto` and hits, and `rx="var(--undefined)"` computes `auto`. Verified in **Chromium 151** and **Firefox 153**. WebKit could not be launched on this host (missing system libraries), so that engine is unverified and the ticket should say so.

`rx` is a geometry presentation attribute, and presentation attributes are parsed as CSS values, so `var()` resolving is the expected modern behaviour — the ticket's claim may simply predate the support.

Reproduced independently by a second agent at Playwright 1.62.1 with the same five controls, same 3–2 split, computed style and hit-test agreeing on every row.

**Word the amendment as "resolves in Chromium 151 and Firefox 153; WebKit unverified on this host" — not a flat "resolves."** `rx` works because SVG2 made geometry properties real CSS properties; that is a browser-baseline question, not a universal one, and WebKit genuinely was not measured.

Update #154 to state the measurement and the WebKit gap. This matters beyond tidiness: the ticket offers "leave them, and say so in the spec" as a legitimate resolution for the five `rx` sites, and that judgement was reached partly on the belief that the token spelling was impossible there. It is not.

- [ ] **Step 2: Open the nine follow-up tickets**

Two this phase deliberately declined, and seven its reviews discovered.

```bash
gh issue create \
  --title "Extract the duplicated render/classes test harness across 16 unit specs" \
  --label tech-debt \
  --body "Deferred from phase 6 (#137), which was docs-only by decision.

\`render\`, \`classes\`, and the \`afterEach\` cleanup trio are copied across 16 specs: account-actions, archetypes-page, button, compare-chrome, footer-chrome, group-chrome, group-score-bar, home-page, navbar-chrome, paired-axis-scale, quiz-chrome, quiz-interactions, reference-chrome, results-chrome, study-chrome, study-map-legend.

Recorded first in phase 4 as 'do before phase 6' at nine copies, again in phase 5 at six named specs, and again in phase 5b at twelve. It is now 16. The reason for deferring has held each time and still holds — moving the harness mid-phase makes a red suite ambiguous — which is exactly why it needs a phase of its own rather than another deferral.

\`sourceFiles\` itself is already shared (\`tests/helpers/source-files.ts\`, extracted in phase 4 Task 5). This is the jsdom render harness around it, not that helper.

Note \`vmForks\` leaks module mocks between specs in this repo, so a spec that passes alone can fail after one that mocks the same module. Verify the extraction with a full \`npm test\`, not per-file runs."

gh issue create \
  --title "governance_compass_results_ui_spec.md still carries a PARTIALLY OUTDATED banner" \
  --label docs \
  --body "Phase 6 (#137) reconciled \`governance_compass_design_spec.md\` and \`CLAUDE.md\`. It did not touch \`docs/system_proposal/governance_compass_results_ui_spec.md\`, which carries its own \`PARTIALLY OUTDATED\` banner and describes the results page phase 4 (#150) redesigned.

Out of scope for #137 by decision rather than by oversight — #137 names two documents and widening it silently was the wrong call. But \`CLAUDE.md:41\` points at \`docs/system_proposal/\` as authoritative, so one reconciled document beside one stale one is a trap.

\`governance_compass_scoring_engine.md\` also carries a banner; check whether its drift is real before bundling it in — the scoring pipeline was not part of the visual delta."
```

```bash
gh issue create \
  --title "join-rate-limit flakes when the suite grows: vmForks module-mock leak" \
  --label tech-debt \
  --body "Found during phase 6 (#137) Task 1, by a reviewer running the suite repeatedly rather than once.

\`tests/unit/join-rate-limit.test.ts > throttles repeated invite-code attempts\` fails intermittently with \`expected 404 to be 201\`.

Measured: **with** a 72nd spec file present, 2 of 8 full-suite runs failed. **Without** it, 0 of 5 failed. The file run alone always passes. The new file mocks nothing, so it is not logically the cause — adding a spec perturbs \`vmForks\` worker scheduling enough to surface an existing leak.

Mechanism: \`join-rate-limit.test.ts:9\` mocks \`@/lib/db\`. Under \`vmForks\` this repo leaks module mocks between specs, so a leaked registry makes \`findGroup\` return nothing and the route 404s instead of 201.

**Why this matters beyond one flaky test:** it makes 'the suite is green except the guard I just committed' occasionally untrue, which is exactly the ambiguity that phase-by-phase execution depends on not having. Any phase that adds spec files can trip it.

Fix direction is the pool/isolation config or per-spec mock teardown, not the assertion."
```

```bash
gh issue create \
  --title "Button.tsx's className doc comment overclaims how Tailwind orders utilities" \
  --label tech-debt \
  --body "Found during phase 6 (#137) Task 2, and verified by compiling probes against this repo's own Tailwind 4.3.3.

\`src/components/Button.tsx:45-53\` says appending \`className\` does not win because 'the variant utilities land later in the sheet than common ones like \`block\` or \`px-6\`.'

**That mechanism is wrong.** Emitted order is decided by property bucket first, then by class name within the bucket — never by which rule is a variant. (Bucket order dominates: \`pl-8\` emits after \`py-2\` despite \`pl\` sorting before \`py\`, because \`padding-inline-start\` is a later bucket than \`padding-block\`.) Measured byte offsets, reproduced independently by two probes:

\`\`\`
.block 4739 · .flex 4774 · .hidden 4807 · .inline-block 4842 · .w-full 4891
.bg-button-primary 4924 · .bg-red-500 4982
.p-4 5046 · .px-6 5098 · .px-[26px] 5158 · .px-[34px] 5205 · .py-2 5252 · .pl-8 5311
.text-button-primary-fg 5369 · .text-red-500 5421 · .text-text-secondary 5476 · .text-zinc-500 5525
\`\`\`

So a caller's \`bg-red-500\`, \`text-red-500\` and \`pl-8\` all **beat** the primary variant — while \`text-red-500\` **loses** to the secondary variant, purely because of where the name sorts. Display genuinely is variant-controlled (\`.inline-block\` > \`.block\`), and the specific \`px-6\` case does behave as documented, which is why the claim looked true.

**The prescription is still correct** — use a variant, not a class, for padding/colour/display. Only the stated reason needs replacing, and the true reason is stronger: whether a caller's class wins depends on alphabetical position, which nobody should be reasoning about at a call site.

\`CLAUDE.md\` was corrected in phase 6. This is the source comment it was derived from, left alone because #137 is a docs-only phase. Fix the comment; do not change \`Button.tsx\`'s behaviour."
```

```bash
gh issue create \
  --title "Five source comments describe behaviour the code no longer has" \
  --label tech-debt \
  --body "Both found during phase 6 (#137) while fact-checking the design spec against source. Both are comments, not behaviour — the code is correct and the comments are not. Left alone because #137 is a docs phase and these are \`src/\`.

A third was found in Task 7: **`src/components/PairedAxisScale.tsx`'s own header** says the primitive is \"the shared primitive behind the home sample, the results breakdown, compare, and group views\" — four consumers. There are **six**: it omits the per-axis detail page under `/results` and `/study`'s persona modal. The design spec now enumerates all six by name.

A fourth, found in Task 8 and the most urgent of the set: **`src/app/globals.css`'s `focus-ring-child` comment** says the `GlossaryTerm` trigger carries \"no ring of its own\". It does — `GlossaryTerm.tsx` sets `focus-ring`. The scoping rationale survives, but the failure mode an unscoped `:has(:focus-visible)` would cause is **two rings**, not a misplaced one. The design spec now states the correct version, so this comment is the last place in the repo asserting the wrong one — and it sits directly on the utility it describes, where the next editor of that utility will read it.

A fifth, found in Task 9 and notable because it looked unfalsifiable and was not: **`src/app/globals.css`'s `focus-ring` comment** says the broken spelling it replaced was live \"across all 25 former call sites\". Measured against the tree immediately before the sweep: `git grep -o -E \"(focus|focus-within):outline-none\" <pre-sweep-ref> -- src/` returns **21** (20 of the plain `focus:` spelling across 11 files, plus one `focus-within:`). The count is wrong by four. The evidence had been deleted from HEAD, which is why it read as unverifiable — it was in history the whole time.

They are filed together because they share a failure mode: a stale JSDoc was trusted as a source of truth by someone writing documentation, and the falsehood propagated into a document that claimed to have verified it. That happened twice in one task, and a third instance turned up two tasks later.

**1. \`src/lib/design-tokens.ts:81-85\`** says to use \`getDomainColor600\` 'where the 600 tone is genuinely intended in both modes', naming the static reference pages. \`getDomainColor600\` has **zero call sites in \`src/\`** — it is referenced only by its own JSDoc, by two tests asserting its absence, and by plan documents. The reference pages it names use the stepping tokens instead (\`src/app/axes/page.tsx:135,154\`, \`src/app/questions/page.tsx:91,125\` all read \`DOMAIN_MARK_VARS\`), and \`tests/unit/results-chrome.test.ts:1620\` actively guards against the 600 spelling across the swept set.

Decide whether the export still earns its place. If it does, the comment needs to stop naming a home it no longer has; if it does not, delete it and the comment together.

The JSDoc has a **second reader that repeated its error**: \`docs/superpowers/plans/2026-09-12-design-system-delta-results.md:73\` (D8) names \`/axes\`, \`/questions\`, \`ComparisonRadar\` and the home domain footer as the function's surviving homes. Three of those four now use the stepping tokens. Fix that sentence in the same pass — it is the clearest evidence that the stale comment is actively propagating rather than merely sitting there.

**2. \`src/components/PairedAxisScale.tsx:66-67\`** says \"respondent B's outlined dot is Stone 500 by the spec.\" The code at \`:212\` renders \`rounded-full border-[1.5px] border-text-label bg-surface-1\` — ringed in \`--text-label\`, which is Stone **700** in light and Stone 500 only in dark. The comment is right for dark mode and wrong for light.

Note the behaviour is deliberate and correct (a mode-stepping token rather than a frozen one, consistent with delta 06); only the comment is stale."
```

```bash
gh issue create \
  --title "globals.css container comments contradict the design spec: '75 characters' and 'the four page measures'" \
  --label tech-debt \
  --body "Found during phase 6 (#137) Task 6, by measuring a claim instead of inheriting it.

**1. The measure is wrong.** \`src/app/globals.css\` says 660px 'holds it near 75 characters at the 15px intro size.' Measured across all six shipped \`PageHeader\` lead paragraphs at 660px / 15px / 1.65 in the shipped \`system-ui\` stack: 19 full lines, **mean 83.0, median 84, range 72–89**. The design spec now says ~84 and notes the figure moves with the platform's \`system-ui\`. Source and spec currently disagree.

**2. The count is wrong.** The same block calls \`--container-reference\` 'the narrowest of the four' and refers to 'the four page measures'. There are **five**: \`--container-shell\` 1040, \`--container-results\` 820, \`--container-reference\` 660, \`--container-quiz\` 672, \`--container-browse\` 1200. \`--container-browse\` was added later and the neighbouring comments were not updated.

**3. One inherited claim is unverified.** The same block justifies \`--container-browse\` with 'at 1040px it loses a column of the persona grid at every breakpoint above 960px.' Phase 6 transcribed this rather than re-measuring it. Plausible and presumably measured when the token landed — but the 75-character comment in the very same block proved stale, which is reason enough not to trust its neighbour.

Low urgency; nothing renders wrong. It matters because these comments are read as authoritative by anyone reaching for a measure, and phase 6 has now had a documented claim propagate from a stale source comment into a document that claimed to have verified it — twice."
```

```bash
gh issue create \
  --title "--contour-opacity is declared in both modes and consumed nowhere; the contours do not step" \
  --label tech-debt \
  --body "Found during phase 6 (#137) Task 7, by checking a token's consumers rather than its declarations.

\`--contour-opacity\` is declared twice in \`src/app/globals.css\` — \`0.08\` in light, \`0.05\` in the dark block — and \`grep -rn contour-opacity src/ tests/\` returns **only those two declarations**. Nothing reads it.

\`CompassPlot\` paints the topographic contour paths at a literal \`opacity={0.15}\` over \`var(--stone-500)\` at 0.6px stroke. Because the Stone ramp is frozen across modes, **the contours do not step with the mode at all** — they are the same tone and the same opacity on both grounds, which is precisely what the token was declared to prevent.

This is the design system's one sanctioned decorative element (\`CLAUDE.md\` protects it by name as the cartographic signature), so it is worth getting right rather than deleting.

Three possible resolutions, in rough order of preference:
1. Wire the paths to the token and pick the right value — note the shipped 0.15 is nearly double the token's light-mode 0.08, so adopting the token as declared is a visible change, not a no-op.
2. Retune the token to match what ships and then wire it.
3. Delete the token and document the literal.

Whichever is chosen, the spec was corrected in phase 6 to say the token has no consumer — so the spec will need a matching edit when this lands.

Note the detection gap: every guard in this repo asks whether a *literal* should have been a token. Nothing asks whether a declared token is *read by anyone*, which is how this survived five phases of sweeps."
```

```bash
gh issue create \
  --title "ScaledQuestionCard's mobile option rows snap their opacity hover — the exact bug the file's own comment prevents" \
  --label bug \
  --body "Found during phase 6 (#137) Task 9, while fact-checking a sentence about transition property lists.

\`src/components/quiz/ScaledQuestionCard.tsx\` has two branches, and they disagree:

- **Desktop segmented bar (:69)** — \`transition-[color,background-color,opacity]\`. Correct.
- **Mobile option rows (:94)** — \`transition-colors\`, while carrying \`opacity-60 hover:opacity-100\`.

Tailwind's \`transition-colors\` set covers \`color\`/\`background-color\`/\`border-color\`/\`fill\`/\`stroke\` and **excludes \`opacity\`**. So on the mobile branch the dim snaps back instantly while the border eases over 150ms — a visible inconsistency on every scaled question below 560px.

The file's own comment at **:65** exists to prevent precisely this: \"\`transition-[...]\` names opacity explicitly: \`transition-colors\` does not.\" It was applied to one branch and not the other.

\`ForcedChoiceCard.tsx:59\` gets it right with \`transition-[border-color,opacity]\`, and its comment at :52 explains why. Note that \`ScaledQuestionCard\`'s mobile rows are documented in-code as mirroring the choice card \"exactly\" — they do not, on this one property.

One-line fix: give :94 the same explicit property list. Worth checking whether any other \`opacity-*\` hover in the tree sits on a bare \`transition-colors\`; this was found by reading, not by a guard, and nothing would catch the next one."
```

```bash
gh issue create \
  --title "public/favicon.svg is an unreferenced duplicate of src/app/icon.svg" \
  --label tech-debt \
  --body "Found during phase 6 (#137) Task 10, while reading the File / Asset Summary against what actually ships.

\`public/favicon.svg\` and \`src/app/icon.svg\` are **byte-identical**. Only \`src/app/icon.svg\` is wired — Next's file convention picks it up automatically — and **nothing in the repo references the \`public/\` copy**.

Tracked since \`67d3cb1\`. Left in place by phase 6 because deleting a public asset is a code change and that was a docs-only task.

Two things to confirm before deleting rather than after: that no external consumer hard-links \`/favicon.svg\` (a bookmark or a third-party embed would 404), and that no build step copies or rewrites it. If both are clear, delete the \`public/\` copy; if the hard-link risk is real, keep it and say so in a comment so the next reader doesn't re-file this."
```

Record all nine issue numbers, then reference them in Step 4's commit.

- [ ] **Step 3: Reconcile this plan with what actually shipped**

Read this document against the diff. Where execution diverged — a section that needed more than the plan anticipated, a mutation that came back differently, a citation whose line numbers had moved — amend the plan text to describe what happened. A plan and its artifact drifting apart has bitten this project in three separate ways, and phase 6 is the phase about documents telling the truth.

```bash
git log --oneline main..HEAD
git diff main --stat
```

- [ ] **Step 4: Run every gate**

Task 11 touched source, so the build and e2e gates apply — issue #137's "no source changes expected" no longer holds.

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

Expected: all five PASS. Notes before you read a failure as real:
- If `npm test` disagrees with CI, run `npm ci` first — a stale `node_modules` after a lockfile change is the usual cause.
- A wall of e2e failures is usually another dev server on the port, not this diff. Check for a stranger before debugging.
- The e2e specs backed by signup require port 3000 (`NEXTAUTH_URL` is hardcoded); do not set `PLAYWRIGHT_PORT`.
- `DevRandomResults` covers bottom-right fixed UI in CI too. Task 11 edited that file — if a click starts missing, that is the cause, and the fix is to drive state via URL rather than to move the widget.

- [ ] **Step 5: Commit and open the PR**

```bash
git add docs/superpowers/specs/2026-09-08-design-system-delta-design.md \
        docs/superpowers/plans/2026-09-16-design-system-delta-docs.md
git commit -m "docs(design): mark phase 6 shipped, reconcile the plan

Closes the delta's phasing table. Plan reconciled against the shipped diff."
```

Then open the PR with `Closes #137` and a body that states: the two documents reconciled, the guard that pins them, `--text-tertiary` retired, and the nine follow-up issues opened with their numbers.

---

## Self-review

**Spec coverage against issue #137's five checkboxes:**

| #137 checkbox | Task |
| --- | --- |
| Fold the six deltas into `governance_compass_design_spec.md` | 4 (01 label layer/serif scale, 06 dark inversion), 5 (01), 6 (02 corners, 04 rules), 7 (05 paired scale), 8–9 (03 buttons, 06) |
| Rewrite the filled-button rule as the two-tier system | 2, Step 3 |
| Correct the Stone 600 accent description | 2, Step 1 |
| Document the token layer and the named-sibling rule | 2, Step 4 |
| Note `home_sample_pair.json` | 3 |
| Handoff: durable copy or record the zip as canonical | 10, Step 2 — zip is canonical, per decision |

**Delta coverage:** all six deltas are folded in — 01 across Tasks 4/5, 02 in Task 6, 03 in Tasks 2/4/8, 04 in Task 6, 05 in Task 7, 06 in Task 4. D1 lands in Tasks 2 and 8; D2 in Task 3; D4 in Task 4; D6 in Task 6; D7 in Tasks 4 and 9. D3 and D5 are implementation decisions with no design-spec surface and are deliberately not folded in.

**Deliberate departure from the writing-plans default:** Tasks 4–10 give line ranges, verified citations, and required/forbidden claims rather than ~450 lines of verbatim replacement prose. Reasoned in the preamble to those tasks. The three short high-stakes edits (Tasks 2, 3, 10) and the two tables most likely to be copy-pasted (the type scale in Task 5, the page measures and rule weights in Task 6) **are** given verbatim.

**Known risk this plan carries:** four mutation steps (M1, M4, M5, M6) revert their task's own edit with `git checkout`, and each says so and says to re-apply. If you would rather not, run them on a `git stash` copy. What is not optional is recording each mutation's outcome — an unrecorded mutation run reads as whichever answer you were hoping for.

**A `-t` filter that matches nothing exits 0.** Task 2 hit this: the plan's mutation command used `-t "variant names the Button component"`, which matched no test and printed `Test Files 1 skipped / Tests 25 skipped` at exit 0. A green-looking run that proved nothing — and a mutation that "passes" is read as the mutation being caught, which is the exact inversion of what it means. **Every `-t` invocation in this plan is a guess at a case title, and titles changed during Task 1's fix round.** Before trusting any filtered run, confirm the filter actually selected something: check the summary line says `Tests N passed` or `N failed`, never `N skipped`. When in doubt, run the file unfiltered.

---

## Reconciliation — what actually happened

Written at the close of Task 12, against the shipped diff rather than from memory.

**The plan's factual claims were wrong far more often than they were right.** Across Tasks 2–11, review caught **nine defects in this plan's draft test code** and **roughly a hundred in its draft prose**. That is the headline finding, and it is about this document, not about the people executing it. Three patterns recurred:

1. **Naming something with zero consumers.** `--contour-opacity` (declared in both modes, read by nothing — the contours ship at a literal `0.15`), `display-page` in the quiz (zero call sites; the intro title is `display-s`), `getDomainColor600` (zero call sites; the reference pages it named use the stepping tokens), and the `!` tension glyph (does not ship at all, and an approved section already said so). Every guard in this repo asks "should this literal have been a token?" Nothing asks "is this declared token read by anyone?", which is how `--contour-opacity` survived five phases of sweeps.
2. **Corrections that were themselves wrong.** Three times. Task 5's review noted `display-entry` omitted the quiz interstitials; the relayed fix asserted a role the interstitials do not use, and the false clause sat in the Typography table for three tasks. A suggested Grid fix in Task 6 was the same failure mode one scope narrower. A suggested "three of those four" icon split in Task 9 was wrong the other way, because `X` appears in both roles.
3. **Inheriting a stale source comment as fact.** The `getDomainColor600` JSDoc, `globals.css`'s glossary comment, its `fade-in-up` comment, and its "25 call sites" figure (it is 21 — and the evidence was in git history the whole time, which is why "unverifiable from the current tree" was the wrong stopping point).

**Where the plan was wrong about its own mechanics:**

- **"Expect four cases green" in Task 8 was wrong by two.** Two of those cases had a *second* offending line in Task 9's sections. The guard was working; the brief was not.
- **The guard stopped being a completion signal for Task 7.** Task 6's Grid rewrite satisfied `names PairedAxisScale` as a side effect, so Task 7 could have gone fully green without doing its job. Its brief was amended to say so.
- **A `-t` filter matching nothing exits 0**, and a mutation that "passes" reads as the mutation being caught — the exact inversion.
- **A guard case can be satisfied redundantly by two lines**, making any single-line mutation probe void. Task 5 reported such a probe as proof; Task 8 counted satisfying lines first and found the same trap waiting.
- **Task 5 was told to carry a rule forward verbatim** — "never serif for axis names or data" — and a sweep found it false four times over for axis names, while large numerals turned out to be 4 of `display-l`'s 5 call sites. The prohibited use was the role's dominant job.

**Scope changes taken during execution, all deliberate:**

- `--text-tertiary`'s retirement was predicted to be a one-line deletion; it needed a two-site sweep first.
- Four narrow cross-section exceptions were granted, each to resolve a self-contradiction rather than carry it: the contour line in Color System, the `display-entry` row in Typography, the `--surface-2` job row, and the Font Stack misattribution. Each was one clause.
- Task 11 absorbed a guard for Task 10's provenance header, because the agent that wrote the header correctly declined to mark its own work.
- Task 6 added `### Layout Rules`, Task 8 `### Quiz Rules`, Task 4 `### Color Rules` — a sixth subsection each, upheld on review as parity with `### Typography Rules`.

**What the guard cannot do, and what caught things instead.** The guard went 4/21 → 31/31 and is genuinely load-bearing: every positive reads its expected value from `globals.css` at runtime, and each was mutation-verified. But every Important finding in this phase came from *reading*, not from running. Deleting the ASCII diagram in Task 6 orphaned four "hero region" references and a pole-label line across two other sections, none guarded. A stale "Hero regions" entry in a surface table survived three separate reviews because each reviewer checked their own prose. The guard catches what it was written to catch, and is blind to what a correct edit falsifies elsewhere.

**Nine follow-up tickets** are drafted in Task 12 Step 2 — two this phase deliberately declined, seven its reviews discovered.
