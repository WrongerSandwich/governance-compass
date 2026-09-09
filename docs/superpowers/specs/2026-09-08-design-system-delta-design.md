# Design System Delta Design

Source handoff: `docs/gov_compass_redesign.zip`
(`design_handoff_governance_compass_redesign/`) — read `Design system delta.dc.html`
first, then `Home proposals.dc.html` (options `5a`, `6a`, `6b`) and
`Page mocks.dc.html` (options `7a`, `7b`, `7c`).

## Goal

Apply the handoff's six-part treatment delta to the shipped Cartographic Stone
design system, so the site reads as a surveyed instrument rather than a plain
questionnaire, and so the home page shows a sample of the results payoff before
a visitor spends fifteen minutes on the quiz.

## Scope and constraints

This is a **delta on the treatment layer, not a new design system.**

- **No new colours.** Every hex in the handoff already exists in
  `src/app/globals.css` or `src/lib/design-tokens.ts`. Verified: the bundle
  introduces zero new colour values.
- **No new assets.** The bundle's two `.woff2` files are byte-identical to
  `src/app/fonts/` (matching md5 sums). The compass mark stays
  `GovernanceCompassMark`.
- **Keep every existing component boundary.** `ForcedChoiceCard`,
  `ProgressBar`, `ScoreBar`, `AxisBreakdownCard`, `ArchetypeCard`,
  `ResultsView`, and `QuizFlow` are restyled, not restructured.
- **Keep all existing behaviour.** Seeded shuffle, autosave/resume, skip,
  keyboard 1–5 on scales, glossary annotation, URL-encoded results, and
  reduced-motion handling are untouched.
- **Add tokens to `globals.css`** rather than hard-coding values in components.
- **No new state.** The quiz reducer, resume acknowledgement, `showScoring`,
  per-card expansion, copy-confirmation timer, and compare-input state are
  unchanged.
- The `.dc.html` files are **design references, not production code.** Recreate
  the designs with the codebase's Tailwind/token mechanisms; do not port the
  inline-styled HTML.

## The six deltas

**01 — Mono label layer and a taller serif display scale.** Every section
label, eyebrow, axis endpoint, count, and status becomes uppercase monospace.
Prose stays sans. Headlines stay serif but get larger and tighter. Hard floor:
**11px**; nothing renders below it on any viewport. On prose pages the mono
layer frames but never enters — descriptions, tension and traditions paragraphs
stay sans, and the serif italic lead-ins (`Internal tension.`, `Traditions.`)
in the archetype reference survive deliberately.

**02 — Near-square corners.** `rounded-[12px]` and `rounded-[8px]` both become
`2px`. Circles (dots, compass mark, avatars) are unaffected. The codebase
currently has 89 such literals across 26 files; `src/components/study/` and
`src/app/study/` already use no `rounded-*` classes at all and need no sweep.

**03 — Buttons.** Primary moves from Stone 600 to **Stone 900 ink fill**
(`#3d2e1f`) with Stone 50 text, hover Stone 800, so a call to action reads as
ink on paper rather than a coloured chip. Secondary is a Stone 300 outline.
Both carry the 12px mono uppercase control label. Stone 600 keeps its jobs as
the focus ring and the progress fill. Disabled state is unchanged (50% opacity,
`not-allowed`).

**04 — Rules carry structure; cards stop floating.** Sections separate by
full-bleed rules and alternating surfaces rather than gaps between rounded
panels. Three weights, used consistently: 1px Stone 900 under a card's own
header; 2px domain colour above a domain block or on a callout's left edge; 1px
Stone 200 for section boundaries and Stone 50 for row separators inside a list.
Maximum two surface switches per page.

**05 — New component: the paired axis scale.** One row renders one axis for one
or two respondents, and is the shared primitive behind the home sample, the
results breakdown, compare, and group views. `ScoreBar.tsx` and
`ComparisonScoreBar.tsx` converge on it. Track is 2px domain-400 at 50% opacity
with a 1px Stone 200 midline. Respondent A is a filled 10px dot in Stone 900 or
the domain 600; respondent B is an outlined 12px dot in Stone 500 on a white
fill. Score `-1…1` maps to `6%…94%` of track width (`50 + score * 44`) so a
pole never clips the track end. The single-respondent variant omits the
outlined dot and is otherwise identical.

**06 — Dark mode: the primary inverts rather than darkens.** Stone 900 ink on a
Stone 900 ground is invisible, so the primary button flips to a Stone 300 fill
with Stone 900 text, hover Stone 200. Domain 600 goes muddy on dark surfaces,
so dots, tracks and domain labels step to domain 400. Stone 500 holds as the
label colour in both modes — the one token needing no dark variant. The dark
block in `globals.css` needs **no new tokens**, only correct usage.

## Token additions

Tailwind is v4.3.3, so both mechanisms below are available and variant-capable.

**Radius.** Add `--radius: 2px` to `:root` (for inline-style and SVG contexts),
and `--radius-sharp: var(--radius)` inside `@theme inline` to generate a
`rounded-sharp` utility for the sweep.

**Type scale** via the `--text-*` namespace in `@theme inline`, using the
`--line-height`, `--letter-spacing`, and `--font-weight` modifiers (all three
confirmed supported in 4.3.3):

| Utility | Size / line-height / tracking | Use |
| --- | --- | --- |
| `text-display-xl` | 58px / 1.04 / −0.021em, serif 500 | Home headline, desktop. Measure ~11em. |
| `text-display-page` | 40px / 1.06 / −0.02em, serif 500 | Interior page titles. |
| `text-display-l` | 34px / 1.06 / −0.018em, serif 500 | Home headline on mobile; large numerals. |
| `text-display-m` | 26px / 1.2, serif 500 | Section headings. **Not** the quiz prompt. |
| `text-display-entry` | 22px / 1.2, serif 500 | Entry titles in long reference lists. |
| `text-display-s` | 17px / 1.35, serif 500 | Card titles, option headlines, archetype name. |
| `text-body-lead` | 17px / 1.62, sans | Lead paragraph. |

**Colour tokens beyond the button family.**

- `--text-label` — the label layer's colour, and the one token that must be
  mode-dependent: Stone 700 in light, Stone 500 in dark. See D7.
- `--container-shell: 1040px` in `@theme inline`, yielding `max-w-shell`. The
  chrome shell width, shared by `NavBar`, `Footer`, and the home page. The
  mock's own nav is edge-to-edge at a 28px gutter, so the cap is ours rather
  than the handoff's.

**`focus-ring` via `@utility`.** The app's single focus affordance: `outline:
none` on `:focus`, `2px solid var(--focus-ring)` at `2px` offset on
`:focus-visible`. It must use the `outline` *shorthand*. The hand-rolled
spelling it replaced — `focus:outline-none focus-visible:outline-2` — was
silently broken in all 25 of its call sites: `outline-none` emits
`--tw-outline-style: none`, `outline-2` emits `outline-style:
var(--tw-outline-style)`, and since `:focus` always matches when
`:focus-visible` does, the style resolved to `none`. Width and colour applied;
no ring was ever drawn. Confirmed in Chromium. A source guardrail now fails on
any reintroduction of `focus:outline-none`.

**Mono layers** via `@utility`, because they need `text-transform` and
`font-family` which the `--text-*` namespace cannot express:

- `label` — 11px mono, uppercase, 0.12em. Siblings `label-eyebrow` (0.14em)
  and `label-nav` (0.10em) cover the two other tracking values.
- `mono-meta` — 11px mono, 0.06em, **sentence case**. The footer's provenance
  row only; mock `5a` sets no `text-transform` there.
- `control` — 12px mono, uppercase, 0.12em, weight 500. Button labels.
  `wordmark` is the same at 0.16em.
- `caption-italic` — 13.5px serif italic, Stone 500.

Each role is one self-contained class. Do **not** plan on layering a built-in
utility over one of these to vary a property: whether a custom `@utility` is
emitted before or after a built-in depends on which properties the custom rule
declares, so `label tracking-[0.06em]` wins but a single-property custom
utility would lose to `tracking-*`. Verified against Tailwind 4.3.3 by
compiling both cases. When a role needs a variant, add a named sibling.

## Decisions

**D1 — Filled buttons.** Mock `6b` renders the quiz `Next` button as an ink
fill, which conflicts with the rule in `CLAUDE.md` reserving filled buttons for
beginning/resuming the assessment and confirming the budget. **Resolution:
follow the mock.** `Next` becomes ink-filled, and the `CLAUDE.md` Design
Context rule is rewritten to describe the new two-tier button system (ink
primary / outlined secondary / tertiary underlined link) instead of a count of
filled buttons.

**D2 — Home sample profile data.** The handoff's payoff block shows a
two-respondent paired profile with fabricated scores, and defers the data
source to implementation. **Resolution: use real personas from the synthetic
study.** `public/study/derived/personas_slim.json` already carries
`averaged_axis_scores` (a 12-element array in axis order),
`nearest_archetype_id`, and persona names for all 1,002 personas;
`data/synthetic_study/scored_profiles.json` carries per-axis `tensions` with
levels. `scripts/build-synthetic-study.ts` gains one more
`writeJson(out(...))` output, `home_sample_pair.json`, following the existing
`case_study_personas.json` pattern. Derived JSON is git-tracked, so the home
page (a server component) reads it at build time with no client fetch and no
import of `data/synthetic_study/` into a client bundle.

The panel keeps the mock's `Illustrative profile` header. Respondents stay
anonymous as `Respondent A` / `Respondent B` rather than surfacing persona
names, because the home page is not the study section and persona identity
carries no meaning there.

**D3 — Divergence copy.** The mock's "Where the two diverge" panel has an
authored sentence per axis ("One respondent trusts public judgment; the other
places weight on institutional expertise."). Hardcoding three sentences would
couple copy to whichever pair the build script picks. **Resolution: add a
`divergenceNote` field to each of the 12 entries in `src/data/axes.ts`** — one
short sentence describing what a wide gap on that axis means. The panel then
renders the notes for the three widest-diverging axes, and the copy survives a
change of sample pair.

**D4 — Domain blurbs.** The home domain footer needs a short blurb per domain
(`d.blurb` in the mock), which exists nowhere in the repo — `DOMAIN_COLORS` has
`name` only. **Resolution: add a `blurb` field to each of the four entries in
`DOMAIN_COLORS`** in `src/lib/design-tokens.ts`, alongside the existing `name`
and `axes`.

**D5 — Nav information architecture.** Mocks `5a` and `6b` show three top-level
nav links (Quiz · Methodology · Research) and no conditional Results link. The
shipped `NavBar` has a conditional Quiz/Results link plus a Research dropdown
grouping Methodology, Synthetic Study, and References. **Resolution: preserve
the shipped IA and restyle only.** The mocks are static prototypes that cannot
render a dropdown or a conditional link, so hoisting Methodology to top level
is prototype simplification rather than an IA decision — and duplicating
Methodology at top level while it also sits inside Research would be worse.
Methodology retains prominence through the hero's tertiary link, which the mock
also shows.

**D7 — The label colour steps by mode.** The handoff states that Stone 500
"holds as the label colour in both modes — the one token needing no dark
variant." Measured against WCAG AA for small text, that cannot hold: Stone 500
is 2.73:1 on the light page ground, 3.28:1 on white panels, and 2.99:1 on the
quiet band — under AA's 4.5:1 and under even the 3:1 large-text floor — while
clearing it comfortably on dark at 4.81–5.67:1. No single value on the Stone
ramp passes both modes (Stone 600 fails both dark surfaces; Stone 700 fails
dark badly at 2.42–2.85:1). **Resolution: `--text-label` steps to Stone 700 in
light and Stone 500 in dark.** It introduces no new colour and uses the
`prefers-color-scheme` mechanism the codebase already relies on.

This is the one place the delta knowingly departs from the handoff, and it is
an accessibility departure rather than an aesthetic one. `--text-tertiary`
keeps Stone 500 in both modes; its other 141 call sites are swept by the
per-screen phases as each adopts `--text-label` for its label layer.

**D6 — Undrawn surfaces.** The handoff draws only home, quiz phase 1, results,
and the archetype reference. **Resolution: apply the global token layer
site-wide now** — radius, buttons, and the mono label layer — so no page looks
half-migrated, but defer bespoke per-page layout work on undrawn screens
(compare, groups, methodology, axes, questions, references, study, auth,
account) to follow-up work.

## Phasing

Each phase produces working, testable software and gets its own plan document.

| Phase | Plan | Covers |
| --- | --- | --- |
| 1 | `2026-09-08-design-system-delta-foundations.md` | Tokens, radius sweep, button primitive, `NavBar`, `Footer` |
| 2 | *(to write)* | `PairedAxisScale`, `home_sample_pair.json`, axis `divergenceNote`, domain `blurb`, home page (`5a`/`6a`) |
| 3 | *(to write)* | Quiz: `ProgressBar`, `ForcedChoiceCard`, `QuizFlow` nav (`6b`), then `ScaledQuestionCard`, `BudgetSimulator`, `PhaseTransition` by extension |
| 4 | *(to write)* | Results: `ScoreBar`/`ComparisonScoreBar` convergence, `AxisBreakdownCard`, `ArchetypeCard`, `RadarChart`, `CompassPlot`, `ResultsView` (`7a`/`7b`) |
| 5 | *(to write)* | Archetype reference (`7c`), then remaining undrawn pages |
| 6 | *(to write)* | Docs: `docs/system_proposal/governance_compass_design_spec.md`, `CLAUDE.md` Design Context |

## Test strategy

Styling changes resist conventional assertions, so each phase leans on three
kinds of test the repo already uses:

1. **Source guardrails** — `node:fs` reads asserting banned literals are absent,
   following the precedent in `tests/unit/results-dead-code.test.ts`. These
   catch drift, which is the real long-term risk in a token migration.
2. **Component tests** — `@testing-library/react` + jsdom for the new
   primitives (`Button`, `PairedAxisScale`), asserting rendered structure and
   the score→percentage mapping rather than colour strings.
3. **Playwright e2e** — the existing specs continue to pass. Only
   `tests/e2e/quiz-flow.spec.ts:42,44` is coupled to changing home copy; every
   other spec is copy-independent.

Verification per phase: `npm test`, `npm run typecheck`, `npm run lint`
(`--max-warnings=0`), `npm run build`, and `npm run test:e2e`.
