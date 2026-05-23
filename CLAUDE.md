@AGENTS.md

# PoliticalPlatform

Political self-assessment web app ("The Governance Compass"). Users complete a 3-phase questionnaire (forced-choice dilemmas, calibrated scales, budget allocation) measuring 12 governance axes, then receive a multi-dimensional profile with visualizations, archetype matching, and tension detection. Supports annotations, one-on-one comparisons, and private group comparisons.

## Quick Start

```bash
# Start the database (Docker must be running)
docker start political-platform-db

# Start the dev server
npm run dev
# Open http://localhost:3000
```

## Development

- **Stack:** Next.js 16 (App Router), TypeScript, PostgreSQL, Prisma, NextAuth v5, Tailwind CSS, Recharts
- **Database:** PostgreSQL in Docker container `political-platform-db` on port 5433
  - Local-only throwaway creds — set your own via `.env` (see `.env.example`) and match them when creating the container.
- **Seed data:** `npx prisma db seed` (12 axes, 60 questions — 36 forced-choice + 24 scaled — plus 7 ministries and 12 archetypes)
- **Prisma:** After schema changes, run `npx prisma migrate dev --name <description>`
- **Synthetic Study preprocessing:** `npm run build:study` and `npm run build:geo` preprocess synthetic study data — run before dev if `data/synthetic_study/` files changed

## Testing

```bash
npm test              # Unit tests (vitest)
npm run test:e2e      # E2E tests (playwright, needs dev server running)
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
- `src/lib/study/` — Study-specific pure logic: data loaders, filter helpers, match-strength buckets, question lookup, types
- `data/synthetic_study/` — Raw pipeline outputs for the synthetic study (personas, scored profiles, cluster labels, model agreement, tension patterns). Do not modify — regenerate upstream.
- `public/study/derived/` — Build-time preprocessed JSON consumed by the pages (slim catalog, regional/demographic aggregates, axis histograms, correlation matrix, case-study picks). Regenerated via `npm run build:study`.
- `public/data/synthetic_study_v1.json` — The ~14 MB public download JSON, assembled at build time.
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
  - **Stone (primary accent)** — Stone 600 (`#85735e`), used for emphasis, selected states, data marks, and the single warm hue that unifies the palette.
  - **Warning (advisory accent)** — the `--warning` token family (amber `#d97706` / `--warning-bg` / `--warning-border` / `--warning-text`), reserved for editorial notices and caution states: spoilers, unanswered-question flags, tension callouts, low-match warnings. Never decorative.

  Domain color marks (slate, sage, clay) appear only on the results page radar/axis breakdown and are not part of the general palette. No other hues are permitted.

  Serious without being cold. Information-dense without being overwhelming.
- **Anti-references:** BuzzFeed-style quizzes (no gamification, no share-bait), political party sites (no partisan color, no persuasion design), social media platforms (no feeds, no engagement metrics, no notification patterns).
- **Theme:** Light and dark mode, both using the same Stone accent. Dark mode inverts surfaces while preserving the cartographic warmth.
- **Typography is the primary design tool.** Serif/sans/mono contrast creates the journal feel. Two weights only (400, 500). Sentence case everywhere except 11px structural labels.
- **Only two filled buttons on the entire site** ("Begin assessment" and "Finalize budget"). Everything else is ghost/outlined. This restraint is deliberate.

### Design Principles
1. **Every element earns its place.** Nothing decorative unless it carries data or establishes hierarchy. The only exception: subtle topographic contour lines on the compass plot, which serve as a thematic signature.
2. **Typography over color.** Use serif/sans contrast, weight, and scale to create hierarchy — not color variety. The Stone palette is near-monochrome by design.
3. **Describe, don't prescribe.** Results are observations ("your positions cluster here"), never labels ("you are a liberal"). The UI should feel like a mirror, not a judgment.
4. **Radical transparency.** Any user can expand to see exactly how their answers produced their score. Weighted formulas, component breakdowns, and tension narratives are always one click away.
5. **Stillness conveys authority.** Minimal animation (150ms selections, 120ms hovers, 200ms expands). No parallax, no springs, no particle effects. The design earns trust through precision, not motion.
