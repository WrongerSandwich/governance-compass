@AGENTS.md

# PoliticalPlatform

Political self-assessment web app ("The Governance Compass"). Users complete a 3-phase questionnaire (forced-choice dilemmas, calibrated scales, budget allocation) measuring 12 governance axes, then receive a multi-dimensional profile with visualizations, archetype matching, and tension detection. Supports annotations, one-on-one comparisons, and private group comparisons.

## Quick Start

```bash
# Start the database (Docker must be running)
docker compose up -d --wait postgres

# Start the dev server
npm run dev
# Open http://localhost:3000
```

## Development

- **Stack:** Next.js 16 (App Router), TypeScript, PostgreSQL, Prisma, NextAuth v5, Tailwind CSS
- **Database:** PostgreSQL on port 5433, defined in `compose.yaml` (`docker compose up -d --wait postgres`). A pre-compose setup may still have a standalone `governance-compass-db` container bound to the same port — remove it (`docker rm -f governance-compass-db`) before bringing compose up.
  - Local-only throwaway creds. Config lives in `.env`, not `.env.local`: `prisma.config.ts` loads `dotenv/config`, which reads `.env` only, while Next.js reads both. The `.env.example` defaults match `compose.yaml`; change both together.
- **Seed data:** `npx prisma db seed` (12 axes, 60 questions — 36 forced-choice + 24 scaled — plus 7 ministries and 12 archetypes)
- **Prisma:** After schema changes, run `npx prisma migrate dev --name <description>`
- **Synthetic Study preprocessing:** `npm run build:study` and `npm run build:geo` preprocess synthetic study data — run before dev if `data/synthetic_study/` files changed

## Testing

```bash
npm test              # Unit tests (vitest)
npm run typecheck     # TypeScript
npm run test:e2e      # E2E tests (playwright, starts the dev server itself)
```

## Key Directories

- `src/lib/` — Pure logic: scoring, scoring-types, comparison, validation, auth, db, design-tokens
- `src/data/` — Axis, item, ministry, and archetype definitions (edit these to change quiz content)
- `src/components/` — React components organized by feature (quiz, results, comparison, groups, annotations) plus shared NavBar, ReturningUserLink, SessionProvider
- `src/app/api/` — API routes (includes `/api/study/persona/[id]` for the synthetic study modal)
- `docs/system_proposal/` — Authoritative specs: design system, scoring engine, results UI, question bank, synthetic study (under `synthetic_study_spec/`)
- `docs/superpowers/plans/2026-03-27-governance-compass-rebuild.md` — Governance compass rebuild plan (shipped)
- `docs/superpowers/plans/2026-04-20-synthetic-study-section.md` — Synthetic study section plan (shipped); the "Deferred / non-blocking backlog" section at the bottom lists consciously-punted follow-ups
- `src/app/study/` — Synthetic Study section: four public pages (index, /personas, /patterns, /model-agreement) presenting findings from the 1,002-persona AI-generated respondent dataset
- `src/components/study/` — All visualization and UI components specific to the Synthetic Study section (WorldMap, CorrelationHeatmap, TensionMatrix, PersonaGrid, PersonaModal, etc.)
- `src/lib/study/` — Study-specific logic shared across the section: data loaders, filter helpers, match-strength buckets, question lookup, types, the budget strip's ministry fills, plus a handful of hooks and one context provider
- `data/synthetic_study/` — Raw pipeline outputs for the synthetic study (personas, scored profiles, cluster labels, model agreement, tension patterns). Do not modify — regenerate upstream.
- `public/study/derived/` — Build-time preprocessed JSON consumed by the pages (slim catalog, regional/demographic aggregates, axis histograms, correlation matrix, case-study picks), plus `home_sample_pair.json`. Regenerated via `npm run build:study`. `home_sample_pair.json` is the odd one out: it feeds the **home** page's `Illustrative profile` panel, not `/study`. Two synthetic-study respondents, shown anonymously as Respondent A and Respondent B because persona identity carries no meaning off the study section (design-delta spec decision D2).
- `public/data/synthetic_study_v1.json` — The ~6 MB public download JSON, assembled at build time. Derived JSON (here and under `public/study/derived/`) is written minified; `/study` reads the exact byte count from `download_meta.json`.
- `public/geo/` — Natural Earth TopoJSON + derived region-level file used by WorldMap. Regenerated via `npm run build:geo`.
- `scripts/build-synthetic-study.ts` / `scripts/build-geo.ts` — Build-time preprocessing pipelines with integrity checks.

## Architecture Notes

- Scoring is a 6-stage pipeline: (1) raw scoring per modality — FC maps A/B→±1.0, SC maps Likert 1-5→[-2,+2] then /2, budget uses tanh normalization with k=6; (2) per-axis modality computation; (3) weighted fusion with axis-dependent profiles (bidirectional budget axes: FC 45%, SC 30%, BG 25%; unidirectional: FC 50%, SC 35%, BG 15%; no-budget axes: FC 60%, SC 40%); (4) tension/contradiction detection between stated and revealed preferences; (5) compass super-dimension reduction (economic + cultural-authority); (6) archetype matching via weighted Euclidean distance against 12 prototype vectors.
- Quiz state persists to sessionStorage — users can refresh or leave and resume where they left off. Phase 1 and 2 support skipping questions; the scoring engine treats unanswered items as neutral (0).
- Quiz completion encodes all 67 responses (36 FC + 24 SC + 7 budget) into a ~32-char base64url string and navigates to `/results?r=<encoded>`. Results are computed client-side — no database write for anonymous users. The codec (v3) is in `src/lib/response-codec.ts`.
- Database profiles are created on demand via `POST /api/profile/materialize` when users save to account, join a group, or create an annotation. All materialized profiles are linked to authenticated users.
- The nav bar shows Quiz (or Results, conditional on localStorage — mutually exclusive) plus a "Research" dropdown grouping Methodology, Synthetic Study, and References. Account/auth UI is hidden for v1 but the infrastructure exists (sign in/out, save to account via materialize endpoint). Sub-pages of Research (Reference children at `/axes`, `/questions`, `/archetypes`; study children at `/study/*`) use a linked `← Section` kicker at the top as a breadcrumb back to the section landing.
- Groups resolve membership by invite code only (no group ID needed to join).
- **Synthetic Study section** (`/study/*`): four pages consume build-time-preprocessed JSON from `public/study/derived/`. The source data at `data/synthetic_study/` is never imported into a client bundle — the per-persona modal fetches detail from `GET /api/study/persona/[id]` which reads source files server-side with module-scope caching. The build script `scripts/build-synthetic-study.ts` runs on `prebuild`, emits all derived files, assembles the public download, and fails the build on integrity violations. A parallel `scripts/build-geo.ts` produces the region-level TopoJSON from Natural Earth countries + a country-to-region mapping authored in `scripts/data/`.
- **URL state on `/study/personas`**: every filter (region, cluster, archetype, governance, economic, urban_rural, education, age range, gender, shared-persona status, search, sort, page) lives in the URL. The compare flow uses `?compare=P0001,P0042,...` (pins) and `?compareView=open` (display). Modal deep-links use `?persona=<id>&model=claude|gemini`. Cross-page navigation within `/study/*` preserves filter state via sessionStorage mirror (key: `study:filters`).

## Design Context

### Users
Politically engaged individuals seeking nuanced understanding of their governance views — not a quick personality quiz, but a serious self-assessment instrument. Users arrive curious and should leave feeling like they understand themselves better. Supports anonymous casual users and registered users who persist and share profiles.

### Brand Personality
**Scholarly, precise, warm.** The site feels like a well-made atlas crossed with a policy journal. It draws from three traditions: cartographic surveying (earth tones, contour lines, monospace coordinates), editorial publishing (serif headings, large typographic numbers, layered surfaces), and Swiss modernist data design (strict grids, alternating rows, no decoration without information). Authority comes from stillness and restraint, not from color or animation.

### Aesthetic Direction
- **Visual tone:** Near-monochrome. Two accents, each with a defined role:
  - **Stone (primary accent)** — Stone 600 (`#85735e`), the single warm hue that unifies the palette. Its surviving jobs are the focus ring (`--focus-ring`), the quiz progress fill, data marks, and small accents like the nav's active underline and the choice card's hover border. It is **not** the primary button fill and **not** the selected state: the delta moved the fill to Stone 900 ink (`--button-primary`), and the forced-choice card's selection is a `--rule-strong` border. New marks reach it through `--mark-primary` or `--domain-*`, never a `--stone-600` literal — the Stone ramp is frozen across modes, while `--mark-primary` and the `--domain-*` marks step to their 400 tones on a dark ground. That step is the domain marks' rule only — the study's `--cluster-*` tones are retuned by hand, so never derive a cluster's dark value from it. Stone 600 literals do survive at unswept call sites; legacy, not exemplary.
  - **Warning (advisory accent)** — the `--warning` token family (amber `#d97706` / `--warning-bg` / `--warning-border` / `--warning-text`), reserved for editorial notices and caution states: spoilers, unanswered-question flags, tension callouts, low-match warnings. Never decorative.

  Domain color marks are **data**, not palette: they encode which of the four axis domains a mark belongs to — Economic's being the Stone accent itself, which is why the domain hues are usually named as the three that are not Stone (slate, sage, clay). The rule is the scope: a domain color is permitted **wherever an axis is drawn, and nowhere else**. It carries meaning, so it never appears as decoration and never on chrome. Outside that job the palette is Stone and the warning family; no other hues are permitted.

  Serious without being cold. Information-dense without being overwhelming.
- **Anti-references:** BuzzFeed-style quizzes (no gamification, no share-bait), political party sites (no partisan color, no persuasion design), social media platforms (no feeds, no engagement metrics, no notification patterns).
- **Theme:** Light and dark mode, both using the same Stone accent. Dark mode inverts surfaces while preserving the cartographic warmth.
- **Typography is the primary design tool.** Serif/sans/mono contrast creates the journal feel. Two weights only (400, 500). Serif is for display plus a few deliberate italic accents (`caption-italic`, the archetype reference's serif italic `Internal tension.` / `Traditions.` lead-ins); running prose is sans. The mono layer carries the label roles — eyebrows, nav, axis endpoints, counts, status, button labels — uppercase and letter-spaced. `mono-meta` is the one mono role that deliberately stays sentence case. Mono frames prose but never runs as prose: descriptions and the archetype tension/traditions paragraphs stay sans. Sentence case everywhere except the mono label layer. **Hard floor: 11px** — no role in the type scale renders below it at any viewport. Any pre-delta *call sites* below it are unswept, not exceptions.
- **Buttons are a three-tier system, not a count.** `src/components/Button.tsx` is the source of button treatment: a new button takes one of its three variants rather than assembling its own classes.
  - **`primary`** — Stone 900 ink fill, Stone 50 text, 12px mono `control` label. Inverts to a Stone 300 fill with Stone 900 text in dark mode, where ink on an ink ground would be invisible; the inversion lives in the `--button-primary*` tokens, not in the component. For the page's own call to action: beginning or resuming the assessment, advancing the quiz and its phase transitions, confirming the budget.
  - **`secondary`** — a `--border-primary` hairline outline on the page surface (Stone 300 in light, Stone 800 in dark), `--text-secondary` label text, same `control` label role. Everything else that is a button: previous, copy link, save, create account.
  - **`tertiary`** — an underlined `label-nav` label with no box or fill. Low-emphasis controls and navigation dressed as a control: cancel, expand/collapse toggles, `Methodology`.

  Use a bare `<button>` when the control's visual identity is its own content rather than a button treatment — cards, chips, filters. Two places reproduce a variant's treatment inline instead of taking it: the budget steppers and the dev-only widget. Exceptions to point at, not the pattern to copy.

  **Do not restyle a variant through `className`.** Whether a caller's class wins is not something anyone should be reasoning about at a call site: Tailwind's emitted order is decided by property bucket first, then by class name within the bucket — never by authoring order, and never by which rule is custom. So `className="bg-red-500"` overrides `primary`'s fill while `className="text-red-500"` loses to `secondary`'s `text-text-secondary` — two color classes, opposite outcomes, decided by how each sorts against the particular class the variant happens to set. The one caller class that is safe is `w-full` — no variant sets width, and it is how a caller goes full-width; margin and position are free for the same reason. Anything touching display, padding, or color needs a variant, not a class.

  The rule this replaces reserved the filled treatment for "beginning or resuming the assessment and confirming the budget." The quiz's advance button is now an ink fill and renders once per question, so a count-based rule could not survive the redesign. That is spec decision D1; the delta's numbered decisions are recorded in `docs/superpowers/specs/2026-09-08-design-system-delta-design.md`.
- **Design tokens live in `src/app/globals.css`, in three layers.** CSS custom properties on `:root` with a `prefers-color-scheme: dark` override; a `@theme inline` block that maps them into Tailwind's namespaces (`--color-*`, `--radius-sharp`, `--font-*`) and declares the page measures (`--container-*`) outright; and a set of `@utility` roles for the type scale (`display-*`, `body-*`, `label*`, `control`, `mono-meta`, `wordmark*`, `caption-italic`) plus the focus ring (`focus-ring`, `focus-ring-child`). Add tokens here rather than hard-coding values at call sites.

  Each `@utility` role is self-contained — family, size, line-height, and whatever tracking, weight and case the role needs. **Never layer a built-in utility over one to vary a property.** The same bucket-then-name order described above governs custom rules too, so whether a custom `@utility` beats a built-in depends on what it declares: compiled against this repo's Tailwind, the multi-property `label` lands *before* `tracking-*` and is silently overridden by it, while a single-property custom utility lands *after* and wins. Too subtle to build on. When a role needs a variant, **add a named sibling** — hence `label-eyebrow`, `label-nav`, `label-tight` and `mono-meta` beside `label`, and `wordmark-sm` beside `wordmark`.

### Design Principles
1. **Every element earns its place.** Nothing decorative unless it carries data or establishes hierarchy. The only exception: subtle topographic contour lines on the compass plot, which serve as a thematic signature.
2. **Typography over color.** Use serif/sans contrast, weight, and scale to create hierarchy — not color variety. The Stone palette is near-monochrome by design.
3. **Describe, don't prescribe.** Results are observations ("your positions cluster here"), never labels ("you are a liberal"). The UI should feel like a mirror, not a judgment.
4. **Radical transparency.** Any user can expand to see exactly how their answers produced their score. Weighted formulas, component breakdowns, and tension narratives are always one click away.
5. **Stillness conveys authority.** Minimal animation (150ms selections, 120ms hovers). Disclosures do not animate at all — no height transition ships, and that is deliberate rather than unfinished. No parallax, no springs, no particle effects. The design earns trust through precision, not motion.
