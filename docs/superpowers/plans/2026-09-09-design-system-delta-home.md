# Design System Delta — Home Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the paired axis scale — the delta's one net-new component — and rewrite the home page around it, so a visitor sees a real sample of the results payoff before spending fifteen minutes on the quiz.

**Architecture:** The sample profile is real data, not fabricated. A pure selector in `scripts/lib/home-sample.ts` picks a deterministic pair of synthetic-study personas; `scripts/build-synthetic-study.ts` emits `home_sample_pair.json` alongside its other derived outputs. The home page is a server component that reads that committed JSON at build time, so `data/synthetic_study/` never enters a client bundle. `PairedAxisScale` owns only the scale itself — endpoints, track, midline, dots — and callers compose the surrounding row, because the results page (Phase 4) needs the same scale inside a different grid.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4.3.3, Vitest 4 (jsdom via docblock, `vmForks` pool), Playwright.

**Spec:** `docs/superpowers/specs/2026-09-08-design-system-delta-design.md`
**Issue:** #133 · **Reference:** `docs/gov_compass_redesign.zip` → `Home proposals.dc.html`, options **5a** (desktop) and **6a** (mobile 390)

## Global Constraints

Phase 1 (#132, PR #140) landed the token layer. Use it rather than re-spelling values:

- **`text-text-label`, never `text-text-tertiary`, for the mono label layer.** Stone 500 measures 2.73:1 on the light page ground and fails WCAG AA; `--text-label` steps Stone 700 / Stone 500 by mode. Spec decision D7. This applies to every eyebrow, axis endpoint, domain index label, and caption on this page.
- **`max-w-shell`** for the 1040px container, not a literal. `NavBar` and `Footer` already share it.
- **`focus-ring`** for every interactive element. Do not hand-roll `focus:outline-none focus-visible:outline-2` — that spelling never painted, and a source guardrail now fails on it.
- **`rounded-sharp`** for corners; a guardrail bans `rounded-[8px]`/`[12px]`/`lg`/`xl`.
- **Typography roles** (`display-xl`, `display-l`, `body-lead`, `label-eyebrow`, `label`, `mono-meta`, `control`, `caption-italic`) are single self-contained classes. Do not layer a built-in utility over one to vary a property — whether the custom rule wins depends on which properties it declares. Add a named sibling instead.
- **`className` does NOT override variant classes on `Button`/`ButtonLink`.** Appending does not win; Tailwind's emitted order does, and the variant utilities land later in the sheet. Verified by byte offset: `.block` (4660) loses to `.inline-block` (4695). `className` is only for properties no variant sets — margin, width, position. **The concrete trap:** `page.tsx`'s CTA is currently `block mx-auto max-w-xs`; migrating that verbatim silently shrinks it from a 320px block to content width, and it still *looks* centred because the hero is `text-center`. Use `className="w-full max-w-xs"`.
- **The tertiary `Button` variant is uppercase mono** (`label-nav`) by design. It is for the hero's "Methodology" link, not for prose links.
- No new colour values. No Tailwind `dark:` variants — dark mode is `prefers-color-scheme` overriding `:root` custom properties.
- Vitest collects only `tests/**/*.test.ts` and `scripts/__tests__/**/*.test.ts`, never `.tsx`. Component tests use `createElement` with a `@vitest-environment jsdom` docblock.
- Lint runs at `--max-warnings=0`.

**Baseline:** `main` is at 584 unit tests across 55 files, all gates green.

---

### Task 1: Author the divergence and domain copy

**Files:**
- Modify: `src/data/axes.ts` — add `divergenceNote` to the interface and all 12 entries
- Modify: `src/lib/design-tokens.ts` — add `blurb` to all four `DOMAIN_COLORS` entries
- Test: `tests/unit/data-integrity.test.ts` (extend)

**Interfaces:**
- Produces: `AxisData.divergenceNote` and `DOMAIN_COLORS[key].blurb`.
- Consumed by: Task 4's divergence panel and domain footer.

**Why this is data, not page copy.** Spec decisions D3 and D4. The mock hardcodes three divergence sentences, but which three axes actually diverge depends on which persona pair Task 2 selects — so the copy must live per-axis and be decoupled from the pair. Otherwise changing the sample silently orphans the prose.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/data-integrity.test.ts`, inside the existing `describe("data integrity")`:

```ts
  it("gives every axis a divergence note in the right voice", () => {
    for (const axis of axes) {
      expect(axis.divergenceNote, `axis ${axis.id} has no divergenceNote`).toBeTruthy();
      // One sentence describing what a wide gap on this axis means, so the
      // home page's divergence panel reads correctly whichever axes diverge.
      expect(axis.divergenceNote.length).toBeGreaterThan(40);
      expect(axis.divergenceNote.length).toBeLessThan(140);
      expect(axis.divergenceNote.trim()).toMatch(/\.$/);
    }
  });

  it("gives every domain a blurb", () => {
    for (const [key, domain] of Object.entries(DOMAIN_COLORS)) {
      expect(domain.blurb, `domain ${key} has no blurb`).toBeTruthy();
      expect(domain.blurb.length).toBeGreaterThan(30);
      expect(domain.blurb.length).toBeLessThan(120);
    }
  });
```

Add `import { DOMAIN_COLORS } from "@/lib/design-tokens";` to that file's imports.

- [ ] **Step 2: Verify red**

Run: `npm test -- tests/unit/data-integrity.test.ts`

Expected: FAIL on both new tests — `axis 1 has no divergenceNote` and `domain economic has no blurb`.

- [ ] **Step 3: Extend the axis interface and entries**

In `src/data/axes.ts`, add to `AxisData`:

```ts
  /** One sentence on what a wide gap between two respondents means here. */
  divergenceNote: string;
```

Then add `divergenceNote` to each of the 12 entries. Three of these are the
mock's own sentences (axes 4, 9, 11); the rest follow their voice — a
statement about the two respondents, not a restatement of the poles:

```
 1 Economic Model           "One would have the state shape outcomes directly; the other leaves allocation to markets."
 2 Environmental Policy     "A gap over whether ecological limits bind growth, or growth can be reconciled with them."
 3 Governance Structure     "One would push decisions down to local bodies; the other keeps them national."
 4 Decision Authority       "One respondent trusts public judgment; the other places weight on institutional expertise."
 5 Rights Balance           "A wide gap on how much liberty a state may trade away for security."
 6 Legitimacy Basis         "One grounds authority in how leaders are chosen; the other in what they deliver."
 7 Social Change            "Disagreement over whether inherited institutions should be reformed or preserved."
 8 Cultural Diversity       "One treats plurality as a strength; the other prioritises a shared civic identity."
 9 Human Nature             "Disagreement over how far behaviour is shaped by culture rather than fixed."
10 International Engagement "One would bind the nation into deeper cooperation; the other guards independent action."
11 Military Policy          "A wide gap on whether force has a legitimate role beyond national borders."
12 Technology Governance    "One would restrain new technology until it is proven safe; the other would build and correct."
```

- [ ] **Step 4: Add the domain blurbs**

In `src/lib/design-tokens.ts`, add a `blurb` to each `DOMAIN_COLORS` entry,
beside its existing `name` and `axes`:

```ts
  economic: {
    name: 'Economic Organization',
    blurb: 'How production and distribution are organised, and how far the state shapes them.',
    ...
  power:   blurb: 'Where decisions are made, who is trusted to make them, and what limits them.',
  society: blurb: 'How a society handles difference, inheritance, and what it takes people to be.',
  world:   blurb: 'How a state acts beyond its borders — in cooperation, in force, and in technology.',
```

`DOMAIN_COLORS` is `as const`, so the new field is typed automatically; no
interface change is needed.

- [ ] **Step 5: Verify green**

Run: `npm test -- tests/unit/data-integrity.test.ts && npm run typecheck`

Expected: PASS. Typecheck must be clean — `AxisData` gained a required field,
so any construction site that omits it fails here.

- [ ] **Step 6: Commit**

```bash
git add src/data/axes.ts src/lib/design-tokens.ts tests/unit/data-integrity.test.ts
git commit -m "feat(data): add per-axis divergence notes and domain blurbs"
```

---

### Task 2: Emit the home sample pair

**Files:**
- Create: `scripts/lib/home-sample.ts`
- Create: `scripts/__tests__/home-sample.test.ts`
- Modify: `scripts/build-synthetic-study.ts` — add one `writeJson(out(...))` output
- Commit: `public/study/derived/home_sample_pair.json` (derived JSON is git-tracked)

**Interfaces:**
- Produces: `selectHomeSamplePair(personas)` and the emitted `home_sample_pair.json`.
- Consumed by: Task 4's payoff block.

**Why real personas (spec decision D2).** `public/study/derived/personas_slim.json`
already carries `averaged_axis_scores` (12-element, axis-ordered),
`nearest_archetype_id`, and `n_models` for all 1,002 personas.
`data/synthetic_study/scored_profiles.json` carries per-axis `tensions` with
levels. Nothing needs re-scoring.

**The selection is deterministic and was prototyped against the real data.**
Of the 150 personas scored by both models, 967 pairs satisfy the criteria
below; the minimum-distance qualifying pair is **P0252 / P0420**
(`radical-egalitarian` and `popular-egalitarian`, Euclidean distance 1.6879).
They agree within 0.15 on six axes and diverge by ≥0.8 on exactly three —
Legitimacy Basis (0.93), International Engagement (0.88), Governance Structure
(0.85) — which is exactly the three items the divergence panel renders. That
reads as two thoughtful people who mostly agree, which is the story the page
should tell; the more polarised pairs read as caricatures.

- [ ] **Step 1: Write the failing selector test**

Create `scripts/__tests__/home-sample.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { selectHomeSamplePair, type SamplePersona } from "../lib/home-sample";

function persona(id: string, scores: number[], archetype: string): SamplePersona {
  return { id, averaged_axis_scores: scores, nearest_archetype_id: archetype, n_models: 2 };
}

const flat = (v: number) => new Array(12).fill(v);

describe("selectHomeSamplePair", () => {
  it("rejects personas scored by only one model", () => {
    const a = { ...persona("A", flat(0), "x"), n_models: 1 };
    const b = persona("B", flat(0.9), "y");

    expect(() => selectHomeSamplePair([a, b])).toThrow(/no qualifying pair/i);
  });

  it("rejects a pair sharing an archetype", () => {
    const scores = flat(0);
    const other = [...scores];
    for (const i of [0, 1, 2]) other[i] = 0.9;

    expect(() =>
      selectHomeSamplePair([persona("A", scores, "same"), persona("B", other, "same")]),
    ).toThrow(/no qualifying pair/i);
  });

  it("requires at least three strongly divergent and four closely agreeing axes", () => {
    const a = flat(0);
    const onlyTwoDiverge = [...a];
    onlyTwoDiverge[0] = 0.9;
    onlyTwoDiverge[1] = 0.9;

    expect(() =>
      selectHomeSamplePair([persona("A", a, "x"), persona("B", onlyTwoDiverge, "y")]),
    ).toThrow(/no qualifying pair/i);
  });

  it("picks the closest qualifying pair, and orders the ids stably", () => {
    const base = flat(0);
    const near = [...base];
    for (const i of [0, 1, 2]) near[i] = 0.85;
    const far = [...base];
    for (const i of [0, 1, 2, 3]) far[i] = 1;

    const pair = selectHomeSamplePair([
      persona("P0002", far, "c"),
      persona("P0001", base, "a"),
      persona("P0003", near, "b"),
    ]);

    // closest qualifying, and A is the lower id regardless of input order
    expect([pair.a.id, pair.b.id]).toEqual(["P0001", "P0003"]);
    expect(pair.divergentAxisIds).toEqual([1, 2, 3]);
  });

  it("reports divergent axes as 1-based ids, widest gap first", () => {
    const a = flat(0);
    const b = [...a];
    b[4] = 0.85;
    b[9] = 0.95;
    b[2] = 0.9;

    const pair = selectHomeSamplePair([persona("A", a, "x"), persona("B", b, "y")]);

    expect(pair.divergentAxisIds).toEqual([10, 3, 5]);
  });
});
```

- [ ] **Step 2: Verify red**

Run: `npm test -- scripts/__tests__/home-sample.test.ts`

Expected: FAIL resolving `../lib/home-sample` — the module does not exist.

- [ ] **Step 3: Write the selector**

Create `scripts/lib/home-sample.ts`:

```ts
/**
 * Chooses the illustrative persona pair shown on the home page.
 *
 * The page's story is "two people who mostly agree, diverging on a few
 * things", so the criteria demand both: at least three axes that diverge
 * strongly enough to fill the divergence panel, and at least four that agree
 * closely. Among qualifying pairs the closest is chosen, because the more
 * distant ones read as caricatures rather than as two plausible respondents.
 *
 * Deterministic: candidates are scanned in id order and ties break on id, so
 * a rebuild on unchanged data always yields the same pair.
 */
export interface SamplePersona {
  id: string;
  averaged_axis_scores: number[];
  nearest_archetype_id: string;
  n_models: number;
}

export interface HomeSamplePair {
  a: SamplePersona;
  b: SamplePersona;
  distance: number;
  /** 1-based axis ids that diverge by >= STRONG, widest gap first. */
  divergentAxisIds: number[];
}

const STRONG = 0.8;
const CLOSE = 0.15;
const MIN_STRONG_AXES = 3;
const MIN_CLOSE_AXES = 4;

function gaps(a: SamplePersona, b: SamplePersona): number[] {
  return a.averaged_axis_scores.map((score, i) =>
    Math.abs(score - b.averaged_axis_scores[i]),
  );
}

export function selectHomeSamplePair(personas: SamplePersona[]): HomeSamplePair {
  const pool = personas
    .filter((p) => p.n_models === 2 && p.averaged_axis_scores?.length === 12)
    .sort((x, y) => x.id.localeCompare(y.id));

  let best: HomeSamplePair | null = null;

  for (let i = 0; i < pool.length; i += 1) {
    for (let j = i + 1; j < pool.length; j += 1) {
      const a = pool[i];
      const b = pool[j];
      if (a.nearest_archetype_id === b.nearest_archetype_id) continue;

      const g = gaps(a, b);
      const strong = g.filter((v) => v >= STRONG).length;
      const close = g.filter((v) => v <= CLOSE).length;
      if (strong < MIN_STRONG_AXES || close < MIN_CLOSE_AXES) continue;

      const distance = Math.sqrt(g.reduce((sum, v) => sum + v * v, 0));
      if (best && distance >= best.distance) continue;

      best = {
        a,
        b,
        distance,
        divergentAxisIds: g
          .map((gap, index) => ({ gap, id: index + 1 }))
          .filter((entry) => entry.gap >= STRONG)
          .sort((x, y) => y.gap - x.gap || x.id - y.id)
          .map((entry) => entry.id),
      };
    }
  }

  if (!best) throw new Error("home sample: no qualifying pair found");
  return best;
}
```

- [ ] **Step 4: Verify green**

Run: `npm test -- scripts/__tests__/home-sample.test.ts`

Expected: PASS, 5 tests.

- [ ] **Step 5: Wire it into the build**

In `scripts/build-synthetic-study.ts`, after the `case_study_personas.json`
block, import `selectHomeSamplePair` and add:

```ts
  // --------------------------------------------------------------------------
  // Home page illustrative pair (design delta, phase 2)
  // --------------------------------------------------------------------------
  const homePair = selectHomeSamplePair(personasSlim);
  const tensionsFor = (id: string) =>
    profiles
      .filter((p) => p.persona_id === id)
      .flatMap((p) => p.tensions ?? [])
      .filter((t) => t.level === "strong")
      .sort((x, y) => y.magnitude - x.magnitude);

  const strongestTension =
    tensionsFor(homePair.a.id)[0] ?? tensionsFor(homePair.b.id)[0] ?? null;
  if (!strongestTension) {
    throw new Error("home sample: selected pair has no strong tension to show");
  }

  writeJson(out("home_sample_pair.json"), {
    respondent_a: {
      persona_id: homePair.a.id,
      archetype_id: homePair.a.nearest_archetype_id,
      axis_scores: homePair.a.averaged_axis_scores,
    },
    respondent_b: {
      persona_id: homePair.b.id,
      archetype_id: homePair.b.nearest_archetype_id,
      axis_scores: homePair.b.averaged_axis_scores,
    },
    distance: homePair.distance,
    divergent_axis_ids: homePair.divergentAxisIds,
    tension_axis_id: strongestTension.axis,
  });

  console.log(
    `Home sample pair: ${homePair.a.id} / ${homePair.b.id} ` +
      `(dist=${homePair.distance.toFixed(4)}, diverge on ${homePair.divergentAxisIds.join(", ")})`,
  );
```

The `throw` is deliberate and matches the script's existing integrity style —
a pair with no strong tension would leave the "Internal tension" panel empty,
and failing the build is better than shipping a blank panel.

- [ ] **Step 6: Regenerate and inspect**

Run: `npm run build:study`

Expected: the log line reports `P0252 / P0420 (dist=1.6879, diverge on 6, 10, 3)`.
Confirm the emitted file:

```bash
python3 -m json.tool public/study/derived/home_sample_pair.json
```

Expected: exactly three `divergent_axis_ids`, twelve scores per respondent,
two different `archetype_id` values, and a `tension_axis_id` in 1–12. If the
pair differs from `P0252 / P0420`, stop and tell me — the source data has not
changed, so a different pair means the selector diverged from its spec.

- [ ] **Step 7: Commit**

```bash
git add scripts/lib/home-sample.ts scripts/__tests__/home-sample.test.ts \
        scripts/build-synthetic-study.ts public/study/derived/home_sample_pair.json
git commit -m "feat(study): emit a deterministic home sample pair from real personas"
```

---

### Task 3: Build the paired axis scale

**Files:**
- Create: `src/components/PairedAxisScale.tsx`
- Test: `tests/unit/paired-axis-scale.test.ts`

**Interfaces:**
- Produces: `PairedAxisScale`, and `scoreToTrackPercent(score)`.
- Consumed by: Task 4's payoff block now; Phase 4 converges `ScoreBar` and `ComparisonScoreBar` on it.

**Scope of the component (delta 05).** It renders **only the scale** —
endpoint labels, track, midline, and one or two dots. It does *not* render the
axis index or name, because the home page wraps it in a `24px 1fr 158px` grid
while the results page uses `24px 1fr 210px` with entirely different right-hand
content. Owning the row would make it unusable for the second caller.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/paired-axis-scale.test.ts`:

```ts
/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PairedAxisScale, scoreToTrackPercent } from "@/components/PairedAxisScale";

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

describe("scoreToTrackPercent", () => {
  it("maps the poles inside the track so a dot never clips its end", () => {
    // -1..1 maps to 6%..94%, per delta 05.
    expect(scoreToTrackPercent(-1)).toBe(6);
    expect(scoreToTrackPercent(1)).toBe(94);
    expect(scoreToTrackPercent(0)).toBe(50);
  });

  it("is linear between the poles", () => {
    expect(scoreToTrackPercent(0.5)).toBe(72);
    expect(scoreToTrackPercent(-0.5)).toBe(28);
  });

  it("clamps scores outside the range rather than overflowing the track", () => {
    expect(scoreToTrackPercent(1.4)).toBe(94);
    expect(scoreToTrackPercent(-2)).toBe(6);
  });
});

describe("PairedAxisScale", () => {
  const base = {
    axisId: 3,
    poleALabel: "Distributed",
    poleBLabel: "Centralized",
    scoreA: -0.5,
  };

  it("renders both endpoint labels", () => {
    const container = render(createElement(PairedAxisScale, base));

    expect(container.textContent).toContain("Distributed");
    expect(container.textContent).toContain("Centralized");
  });

  it("positions respondent A from its score", () => {
    const container = render(createElement(PairedAxisScale, base));
    const dotA = container.querySelector("[data-respondent='a']") as HTMLElement;

    expect(dotA.style.left).toBe("28%");
  });

  it("omits the outlined dot when there is no second respondent", () => {
    const container = render(createElement(PairedAxisScale, base));

    expect(container.querySelector("[data-respondent='b']")).toBeNull();
  });

  it("renders both dots when a second respondent is given", () => {
    const container = render(
      createElement(PairedAxisScale, { ...base, scoreB: 0.5 }),
    );

    expect((container.querySelector("[data-respondent='a']") as HTMLElement).style.left).toBe("28%");
    expect((container.querySelector("[data-respondent='b']") as HTMLElement).style.left).toBe("72%");
  });

  it("colours the track from the axis's domain", () => {
    // Axis 3 is Power and Authority — Slate. The track uses the 400 tone.
    const container = render(createElement(PairedAxisScale, base));
    const track = container.querySelector("[data-track]") as HTMLElement;

    expect(track.style.backgroundColor).toBe("rgb(157, 174, 187)");
  });

  it("describes the scale for assistive tech rather than leaving bare dots", () => {
    const container = render(
      createElement(PairedAxisScale, { ...base, scoreB: 0.5 }),
    );
    const dotA = container.querySelector("[data-respondent='a']")!;

    expect(dotA.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector("[role='img']")?.getAttribute("aria-label"))
      .toMatch(/Distributed.*Centralized/);
  });
});
```

- [ ] **Step 2: Verify red**

Run: `npm test -- tests/unit/paired-axis-scale.test.ts`

Expected: FAIL resolving `@/components/PairedAxisScale`.

- [ ] **Step 3: Write the component**

Create `src/components/PairedAxisScale.tsx`:

```tsx
import { DOMAIN_COLORS, getDomainForAxis } from "@/lib/design-tokens";

/**
 * One axis rendered as a scale, for one or two respondents (design delta 05).
 *
 * Renders only the scale — endpoints, track, midline, dots. Callers own the
 * surrounding row, because the home page and the results breakdown wrap it in
 * different grids.
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

export function PairedAxisScale({
  axisId,
  poleALabel,
  poleBLabel,
  scoreA,
  scoreB,
  endpoints = "above",
  label,
}: PairedAxisScaleProps) {
  const domain = DOMAIN_COLORS[getDomainForAxis(axisId)];
  const endpointRow = (
    <div
      className={`flex justify-between label text-text-label tracking-[0.02em] ${
        endpoints === "above" ? "mb-1" : "mt-1.5"
      }`}
    >
      <span>{poleALabel}</span>
      <span>{poleBLabel}</span>
    </div>
  );

  return (
    <div
      role="img"
      aria-label={label ?? `${poleALabel} to ${poleBLabel}`}
    >
      {endpoints === "above" && endpointRow}
      <div className="relative h-3.5">
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
        <div
          data-respondent="a"
          aria-hidden="true"
          className="absolute top-0.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full"
          style={{ left: `${scoreToTrackPercent(scoreA)}%`, backgroundColor: domain[600] }}
        />
      </div>
      {endpoints === "below" && endpointRow}
    </div>
  );
}
```

- [ ] **Step 4: Verify green**

Run: `npm test -- tests/unit/paired-axis-scale.test.ts`

Expected: PASS, 9 tests.

- [ ] **Step 5: Prove the mapping is real**

Change `50 + clamped * 44` to `50 + clamped * 50`, run the test, confirm the
pole test fails with `expected 100 to be 94`, then revert. Report the result —
this mapping is the component's entire reason for existing.

- [ ] **Step 6: Commit**

```bash
git add src/components/PairedAxisScale.tsx tests/unit/paired-axis-scale.test.ts
git commit -m "feat(design): add the paired axis scale primitive"
```

---

### Task 4: Rewrite the home page

**Files:**
- Rewrite: `src/app/page.tsx`
- Test: `tests/unit/home-page.test.ts`

**Interfaces:**
- Consumes: Task 1's copy, Task 2's `home_sample_pair.json`, Task 3's `PairedAxisScale`, and Phase 1's `ButtonLink`, `max-w-shell`, `text-text-label`, typography roles.

**Reading the sample data.** `page.tsx` is a server component. Import the
committed JSON directly (`import homeSample from "../../public/study/derived/home_sample_pair.json"`)
or read it with `fs` at module scope — either keeps it server-side. Do **not**
fetch it, and do not import anything from `data/synthetic_study/`.

**This task delivers both widths.** The page is one component, so the mobile
variants are written inline with `min-[560px]:` prefixes rather than added in a
second pass — splitting them across two tasks would mean writing the markup
twice. Mock 6a at 390px: single column, 18px gutters, `display-l` headline,
full-width primary, an **outlined secondary** `Methodology` beneath it (not the
desktop's tertiary link), the paired table as one ruled list with the axis name
above the scale and endpoints beneath, and domain columns stacked.

**Structure (mock 5a), max-width 1040 via `max-w-shell`, 56px gutters:**

1. **Hero** — 66px top padding, max-width 800px.
   - eyebrow `label-eyebrow text-text-label`: `A twelve-axis self-assessment`
   - `h1` at `display-xl`, `max-w-[11em]`: `Locating a political position across twelve axes.`
   - lead at `body-lead text-text-secondary max-w-[34em]`
   - secondary at `text-sm text-text-label max-w-[34em]`
   - button row, 20px gap: primary `ButtonLink` to `/quiz` (`Begin the assessment`), tertiary `ButtonLink` to `/methodology` (`Methodology`), then `caption-italic`: `~15 min · no account required`
   - keep `<ReturningUserLink />`
2. **Payoff block** — 44px top padding, `grid grid-cols-[1fr_356px] gap-7 items-start`.
   - *Left panel*: `bg-surface-1 border border-border-secondary rounded-sharp p-6`. Header row `Illustrative profile` (`label-eyebrow text-text-label`) plus an A/B legend, over a `border-b border-stone-900` rule. Then 12 rows, each `grid grid-cols-[24px_1fr_158px] gap-3.5 items-center py-2.5 border-t border-stone-50`: index in `label text-text-label`, `<PairedAxisScale>`, axis name at `text-[12.5px]`.
   - *Right column*, 20px gap: "Where the two diverge" panel — the three axes from `divergent_axis_ids`, each with a 2px domain-coloured left border, a 14px serif title (axis name) and the axis's `divergenceNote` at 12.5px. Then an "Internal tension" panel on `bg-surface-2` naming the `tension_axis_id` axis.
3. **Domain footer** on `bg-surface-1`: label `The twelve axes, by domain`, then `grid grid-cols-4 gap-[30px]`; each column `border-t-2` in its domain colour, a domain index label, 15px serif name, the `blurb` at 12.5px, and its axes as `label` rows `NN PoleA ←→ PoleB`.

**Exact copy** — the hero strings are fixed by the handoff:

- Eyebrow: `A twelve-axis self-assessment`
- H1: `Locating a political position across twelve axes.`
- Lead: `Economic organization, the distribution of authority, social and cultural questions, and a state's conduct abroad — each measured separately, reported with its reasoning, and comparable with another respondent's.`
- Secondary: `Fifteen minutes of applied dilemmas, calibration scales, and budget allocations produce a surveyed position on all twelve axes.`
- Buttons: `Begin the assessment` · `Methodology` · meta `~15 min · no account required`

**Two deviations from the mock, both deliberate:**

- The mock labels the panel `Illustrative profile` while showing invented
  data. Ours shows two real personas but still says `Illustrative profile`,
  and keeps them anonymous as `Respondent A` / `Respondent B` — persona
  identity means nothing outside the study section (spec D2).
- Mock 6a shortens the lead paragraph on mobile. Serving different copy per
  viewport needs duplicated DOM or JS; use the desktop copy at every width and
  vary only the sizes. Noted in Task 5.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/home-page.test.ts`:

```ts
/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import Home from "@/app/page";
import { axes } from "@/data/axes";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: { container: HTMLDivElement; root: Root }[] = [];

function renderHome() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(createElement(Home)));
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

describe("home page", () => {
  it("leads with the delta's headline and eyebrow", () => {
    const container = renderHome();

    expect(container.querySelector("h1")!.textContent).toBe(
      "Locating a political position across twelve axes.",
    );
    expect(container.textContent).toContain("A twelve-axis self-assessment");
  });

  it("sends the primary call to action to the quiz without shrinking it", () => {
    const container = renderHome();
    const cta = [...container.querySelectorAll("a")].find(
      (a) => a.textContent?.trim() === "Begin the assessment",
    )!;
    const classes = cta.className.split(/\s+/);

    expect(cta.getAttribute("href")).toBe("/quiz");
    // `block` would lose to the variant's `inline-block`; `w-full` does not.
    expect(classes).not.toContain("block");
    expect(classes).toContain("w-full");
  });

  it("shows one paired scale per axis", () => {
    const container = renderHome();

    expect(container.querySelectorAll("[data-track]")).toHaveLength(12);
    expect(container.querySelectorAll("[data-respondent='b']")).toHaveLength(12);
  });

  it("names three diverging axes, and uses each axis's own note", () => {
    const container = renderHome();
    const panel = container.querySelector("[data-divergence]")!;
    const items = panel.querySelectorAll("[data-divergence-item]");

    expect(items).toHaveLength(3);
    for (const item of items) {
      const axis = axes.find((a) => item.textContent!.includes(a.name))!;
      expect(axis, "divergence item names no known axis").toBeTruthy();
      expect(item.textContent).toContain(axis.divergenceNote);
    }
  });

  it("lists all twelve axes under their four domains", () => {
    const container = renderHome();
    const columns = container.querySelectorAll("[data-domain]");

    expect(columns).toHaveLength(4);
    for (const axis of axes) {
      expect(container.textContent).toContain(axis.poleALabel.split(" ")[0]);
    }
  });

  it("offers Methodology as an outlined button on mobile and a tertiary link above it", () => {
    const container = renderHome();
    const methodology = [...container.querySelectorAll("a")].filter(
      (a) => a.textContent?.trim() === "Methodology",
    );

    // Mock 6a switches variant by breakpoint, so both render and CSS picks one.
    expect(methodology).toHaveLength(2);
    expect(methodology[0].className).toContain("min-[560px]:hidden");
    expect(methodology[1].className).toContain("hidden");
  });

  it("labels the sample as illustrative and keeps respondents anonymous", () => {
    const container = renderHome();

    expect(container.textContent).toContain("Illustrative profile");
    expect(container.textContent).toContain("Respondent A");
    expect(container.textContent).not.toMatch(/P0\d{3}/);
  });
});
```

- [ ] **Step 2: Verify red**

Run: `npm test -- tests/unit/home-page.test.ts`

Expected: FAIL on the first test — the current `h1` reads
`The Governance Compass`.

- [ ] **Step 3: Write the page**

Replace `src/app/page.tsx` entirely:

```tsx
import { ButtonLink } from "@/components/Button";
import { PairedAxisScale } from "@/components/PairedAxisScale";
import { ReturningUserLink } from "@/components/ReturningUserLink";
import { axes } from "@/data/axes";
import { DOMAIN_COLORS, type DomainKey } from "@/lib/design-tokens";
import homeSample from "../../public/study/derived/home_sample_pair.json";

// Read at build time from committed derived JSON. This is a server component,
// so `data/synthetic_study/` never reaches a client bundle.
const DOMAIN_ORDER: DomainKey[] = ["economic", "power", "society", "world"];

const axisById = new Map(axes.map((axis) => [axis.id, axis]));
const shortPole = (label: string) => label.split(" ")[0];

export default function Home() {
  const { respondent_a: a, respondent_b: b } = homeSample;
  const diverging = homeSample.divergent_axis_ids.map((id) => axisById.get(id)!);
  const tensionAxis = axisById.get(homeSample.tension_axis_id)!;

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="max-w-shell mx-auto px-[18px] min-[560px]:px-14 pt-[66px]">
        <div className="max-w-[800px]">
          <p className="label-eyebrow text-text-label mb-[22px]">
            A twelve-axis self-assessment
          </p>
          <h1 className="display-l min-[560px]:display-xl max-w-[11em] mb-[26px]">
            Locating a political position across twelve axes.
          </h1>
          <p className="body-lead text-text-secondary max-w-[34em] mb-5">
            Economic organization, the distribution of authority, social and
            cultural questions, and a state&apos;s conduct abroad &mdash; each
            measured separately, reported with its reasoning, and comparable
            with another respondent&apos;s.
          </p>
          <p className="text-sm leading-[1.62] text-text-label max-w-[34em] mb-8">
            Fifteen minutes of applied dilemmas, calibration scales, and budget
            allocations produce a surveyed position on all twelve axes.
          </p>
          <div className="flex flex-col min-[560px]:flex-row min-[560px]:items-center gap-2.5 min-[560px]:gap-5">
            <ButtonLink href="/quiz" className="w-full min-[560px]:w-auto max-w-xs">
              Begin the assessment
            </ButtonLink>
            <ButtonLink
              href="/methodology"
              variant="secondary"
              className="w-full min-[560px]:hidden max-w-xs"
            >
              Methodology
            </ButtonLink>
            <ButtonLink
              href="/methodology"
              variant="tertiary"
              className="hidden min-[560px]:inline-block"
            >
              Methodology
            </ButtonLink>
            <span className="caption-italic">~15 min &middot; no account required</span>
          </div>
          <ReturningUserLink />
        </div>
      </div>

      {/* Payoff block */}
      <div className="max-w-shell mx-auto px-[18px] min-[560px]:px-14 pt-11 pb-[52px] grid grid-cols-1 min-[900px]:grid-cols-[1fr_356px] gap-5 min-[900px]:gap-7 items-start">
        <div className="bg-surface-1 border border-border-secondary rounded-sharp px-[26px] py-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-stone-900 mb-3.5">
            <p className="label-eyebrow text-text-label">Illustrative profile</p>
            <div className="flex gap-[18px] label text-text-secondary tracking-[0.02em]">
              <span className="flex items-center gap-1.5">
                <span className="h-[9px] w-[9px] rounded-full bg-stone-900" />
                Respondent A
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-[9px] w-[9px] rounded-full border-[1.5px] border-text-label" />
                Respondent B
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            {axes.map((axis, index) => (
              <div
                key={axis.id}
                className="py-2.5 border-t border-stone-50 min-[560px]:grid min-[560px]:grid-cols-[24px_1fr_158px] min-[560px]:gap-3.5 min-[560px]:items-center"
              >
                <div className="flex items-baseline gap-2 mb-1.5 min-[560px]:mb-0 min-[560px]:contents">
                  <p className="label text-text-label">
                    {String(axis.id).padStart(2, "0")}
                  </p>
                  <p className="text-[12.5px] leading-[1.3] min-[560px]:order-last">
                    {axis.name}
                  </p>
                </div>
                <PairedAxisScale
                  axisId={axis.id}
                  poleALabel={shortPole(axis.poleALabel)}
                  poleBLabel={shortPole(axis.poleBLabel)}
                  scoreA={a.axis_scores[index]}
                  scoreB={b.axis_scores[index]}
                  endpoints="below"
                  label={`${axis.name}: ${axis.poleALabel} to ${axis.poleBLabel}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div
            data-divergence
            className="bg-surface-1 border border-border-secondary rounded-sharp p-[22px]"
          >
            <p className="label-eyebrow text-text-label pb-3 border-b border-stone-900 mb-3.5">
              Where the two diverge
            </p>
            <div className="flex flex-col gap-4">
              {diverging.map((axis) => (
                <div
                  key={axis.id}
                  data-divergence-item
                  className="border-l-2 pl-3"
                  style={{ borderColor: DOMAIN_COLORS[domainOf(axis.id)][600] }}
                >
                  <p className="font-serif font-medium text-sm">{axis.name}</p>
                  <p className="mt-1 text-[12.5px] leading-[1.55] text-text-secondary">
                    {axis.divergenceNote}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface-2 border border-border-secondary rounded-sharp p-[22px]">
            <p className="label-eyebrow text-text-label mb-3">Internal tension</p>
            <p className="text-[13px] leading-[1.6] text-text-secondary">
              One respondent&apos;s stated and revealed preferences pull against
              each other on {tensionAxis.name.toLowerCase()}. The report names
              the conflict and shows the items that produced it.
            </p>
          </div>
        </div>
      </div>

      {/* Domain footer */}
      <div className="bg-surface-1 border-t border-border-secondary">
        <div className="max-w-shell mx-auto px-[18px] min-[560px]:px-14 pt-7 pb-12">
          <p className="label-eyebrow text-text-label mb-[26px]">
            The twelve axes, by domain
          </p>
          <div className="grid grid-cols-1 min-[560px]:grid-cols-4 gap-[22px] min-[560px]:gap-[30px]">
            {DOMAIN_ORDER.map((key, index) => {
              const domain = DOMAIN_COLORS[key];
              return (
                <div
                  key={key}
                  data-domain={key}
                  className="border-t-2 pt-3.5"
                  style={{ borderColor: domain[600] }}
                >
                  <p className="label-nav text-text-label mb-1">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="font-serif font-medium text-[15px] mb-2.5">
                    {domain.name}
                  </p>
                  <p className="text-[12.5px] leading-[1.55] text-text-secondary mb-3.5">
                    {domain.blurb}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {domain.axes.map((axisId) => {
                      const axis = axisById.get(axisId)!;
                      return (
                        <p key={axisId} className="label text-text-label leading-[1.4]">
                          {String(axis.id).padStart(2, "0")}&nbsp;&nbsp;
                          {shortPole(axis.poleALabel)} &larr;&rarr;{" "}
                          {shortPole(axis.poleBLabel)}
                        </p>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
```

Add this helper beside `shortPole`, so the divergence panel can colour its
left border from the axis's domain:

```tsx
import { getDomainForAxis } from "@/lib/design-tokens";

const domainOf = (axisId: number) => getDomainForAxis(axisId);
```

`CountUp` and `StaggeredList` are no longer used by this layout. Leave the
components in place — later phases may want them — but drop the imports.

**On the archetype names.** The handoff's own deferred decision asks for a
real archetype name instead of the invented one in *earlier* iterations.
Option 5a, the chosen direction, shows no archetype name at all, so there is
nothing to replace: `archetype_id` is emitted because the selector requires
the two respondents to differ, not for display. Respondents stay anonymous
per spec D2.

- [ ] **Step 4: Verify green**

Run: `npm test -- tests/unit/home-page.test.ts && npm run typecheck && npm run lint`

Expected: tests PASS (6), typecheck and lint clean.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx tests/unit/home-page.test.ts
git commit -m "feat(design): rebuild the home page around the paired axis scale"
```

---

### Task 5: Responsive nav chrome

**Files:**
- Modify: `src/components/NavBar.tsx`
- Modify: `src/app/globals.css` — one `wordmark-sm` sibling role
- Test: `tests/unit/navbar-chrome.test.ts` (extend)

**Interfaces:**
- Consumes: Phase 1's nav and typography roles.

Mock 6a draws the bar at 52px with 18px gutters, a 20px mark, and the wordmark
at 11px / 0.13em, against 5a's 54px / 28px / 22px / 12px / 0.16em. Task 4
already handled the page's own responsive behaviour; this is the chrome only.

**No hamburger.** Mock 6a shows one, and it was considered and deferred to its
own issue: a panel with open/close, focus trapping and Escape is new
interaction rather than layout, and the nav already works at 390px with the
mark plus two compact mono links.

- [ ] **Step 1: Write the failing test**

Append inside the existing top-level `describe` in `tests/unit/navbar-chrome.test.ts`:

```ts
  it("uses the mobile bar metrics below the breakpoint", async () => {
    const container = await renderNav();
    const bar = container.querySelector(".max-w-shell")!;
    const classes = bar.className.split(/\s+/);

    // 52px at mobile, 54px from the breakpoint up (mock 6a vs 5a).
    expect(classes).toContain("h-[52px]");
    expect(classes).toContain("min-[560px]:h-[54px]");
  });

  it("steps the wordmark down a size on mobile via a sibling role", async () => {
    const container = await renderNav();
    const wordmark = container.querySelector(".wordmark-sm")!;

    // `wordmark` is self-contained; layering a built-in over it is unreliable,
    // so the smaller variant is its own role.
    expect(wordmark).not.toBeNull();
    expect(wordmark.className).toContain("min-[560px]:wordmark");
  });
```

- [ ] **Step 2: Verify red**

Run: `npm test -- tests/unit/navbar-chrome.test.ts`

Expected: FAIL on both — the bar is `h-[54px]` unconditionally and no
`wordmark-sm` exists.

- [ ] **Step 3: Add the `wordmark-sm` role**

In `src/app/globals.css`, beside the existing `wordmark` utility:

```css
@utility wordmark-sm {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}
```

This is a 15th `@utility`, so add `"wordmark-sm"` to `TYPE_SCALE` in
`tests/unit/design-system-tokens.test.ts` — otherwise the type-scale test
fails on an unclassified utility, which is exactly what it is for.

- [ ] **Step 4: Make the nav responsive**

In `src/components/NavBar.tsx`:

```tsx
    <nav
      aria-label="Main"
      className="bg-surface-1 border-b border-border-secondary px-[18px] min-[560px]:px-7"
    >
      <div className="max-w-shell mx-auto flex items-stretch justify-between h-[52px] min-[560px]:h-[54px]">
```

and in the brand link:

```tsx
          <GovernanceCompassMark size={20} className="min-[560px]:hidden" />
          <GovernanceCompassMark size={22} className="hidden min-[560px]:block" />
          <span className="hidden min-[480px]:inline wordmark-sm min-[560px]:wordmark text-text-primary">
            Governance Compass
          </span>
```

`GovernanceCompassMark` already accepts and forwards `className`
(`GovernanceCompassMark.tsx:14,72,84`), so no passthrough is needed — verified,
rather than assumed.

- [ ] **Step 5: Verify green**

Run: `npm test && npm run typecheck && npm run lint`

Expected: all clean. The full suite must stay green — the type-scale test is
sensitive to the new utility.

- [ ] **Step 6: Commit**

```bash
git add src/components/NavBar.tsx src/app/globals.css \
        tests/unit/navbar-chrome.test.ts tests/unit/design-system-tokens.test.ts
git commit -m "feat(design): step the nav chrome down to mock 6a's mobile metrics"
```

---

### Task 6: Update e2e and verify the phase

**Files:**
- Modify: `tests/e2e/quiz-flow.spec.ts:42,44`

- [ ] **Step 1: Update the two coupled assertions**

This is the only e2e coupling to home copy. Replace:

```ts
    await expect(
      page.getByRole("heading", { name: "The Governance Compass" })
    ).toBeVisible();
    await page.getByRole("link", { name: "Begin assessment" }).click();
```

with:

```ts
    await expect(
      page.getByRole("heading", {
        name: "Locating a political position across twelve axes.",
      })
    ).toBeVisible();
    await page.getByRole("link", { name: "Begin the assessment" }).click();
```

- [ ] **Step 2: Run every gate**

```bash
npm test && npm run typecheck && npm run lint && npm run build && npm run test:e2e
```

Expected: unit suite up from 584 by roughly 25 (2 data + 5 selector + 9 scale
+ 7 home + 2 nav, plus any added during review); typecheck, lint, build clean;
e2e 21 passing.

Before running e2e, confirm nothing else holds port 3000 — a stray dev server
gets adopted by Playwright and produces a wall of unrelated failures.
`NEXTAUTH_URL` is hardcoded to port 3000, so do not set `PLAYWRIGHT_PORT`.

- [ ] **Step 3: Review the page in a browser, in both colour schemes**

Use the **production build** (`npm run build && npx next start -p 3100`), not
`npm run dev`: a failing HMR socket puts the dev server in a reload loop that
resets React state and makes interactive checks unreliable.

Measure rather than eyeball, at 1440 and at 390:
- every paired dot sits within 6%–94% of its track
- the three divergence items match `divergent_axis_ids`
- no mono label uses `--text-tertiary` — labels must compute to Stone 700 in
  light (`rgb(110, 90, 72)`) and Stone 500 in dark (`rgb(157, 139, 120)`)
- the hero CTA is the ink primary and legible in dark mode, where it inverts
  to Stone 300 on Stone 900 text
- the CTA is full width at its `max-w-xs` cap and has not collapsed to content
  width — the `block`-vs-`inline-block` trap
- tab through: every interactive element shows the 2px Stone 600 ring

- [ ] **Step 4: Commit and open the PR**

```bash
git switch -c feat/design-delta-home
git push -u origin feat/design-delta-home
gh pr create --title "feat(design): design system delta — phase 2 home page" \
  --body "Implements #133 per docs/superpowers/plans/2026-09-09-design-system-delta-home.md"
```

---

## Out of scope for this phase

- **The mobile hamburger nav** from mock 6a. Deferred to its own issue: a
  panel with open/close, focus trapping and Escape is new interaction, not
  home-page layout, and it deserves its own tests.
- **Migrating other screens' buttons** onto `Button`/`ButtonLink`. Each
  screen's own phase does that; this phase migrates only the two hero actions.
- **`ScoreBar`/`ComparisonScoreBar` converging on `PairedAxisScale`.** That is
  Phase 4 (#135), where the results breakdown is rebuilt.
- **The remaining sub-11px literals and the bare-`rounded` sweep** (#139).
- **Aligning page shells to the chrome's gutter.** The chrome is `px-7` at
  `max-w-shell`; the other six page shells are still `px-4` at `max-w-xl`/`2xl`/`3xl`,
  a 12px mismatch at 390px. This phase aligns only the home page; the rest
  follow as each is restyled.
