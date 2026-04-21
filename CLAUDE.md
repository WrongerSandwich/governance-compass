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
  - User: `ppuser`, Password: `ppdevpass`, DB: `political_platform`
  - If the container doesn't exist: `docker run -d --name political-platform-db -e POSTGRES_USER=ppuser -e POSTGRES_PASSWORD=ppdevpass -e POSTGRES_DB=political_platform -p 5433:5432 postgres:16-alpine`
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
- `src/app/api/` — API routes
- `docs/system_proposal/` — Authoritative specs: design system, scoring engine, results UI, question bank
- `docs/superpowers/plans/2026-03-27-governance-compass-rebuild.md` — Current implementation plan
- `src/app/study/` — Synthetic Study section: four public pages (index, /personas, /patterns, /model-agreement) presenting findings from the 500-persona AI-generated respondent dataset
- `src/components/study/` — All visualization and UI components specific to the Synthetic Study section (WorldMap, CorrelationHeatmap, TensionMatrix, PersonaGrid, etc.)
- `src/lib/study/` — Study-specific pure logic: data loaders, filter helpers, aggregation utilities
- `data/synthetic_study/` — Raw and preprocessed JSON/CSV files for the synthetic study (personas, scored profiles, cluster labels, model agreement, tension patterns)

## Architecture Notes

- Scoring is a 6-stage pipeline: (1) raw scoring per modality — FC maps A/B→±1.0, SC maps Likert 1-5→[-2,+2] then /2, budget uses tanh normalization with k=6; (2) per-axis modality computation; (3) weighted fusion with axis-dependent profiles (bidirectional budget axes: FC 45%, SC 30%, BG 25%; unidirectional: FC 50%, SC 35%, BG 15%; no-budget axes: FC 60%, SC 40%); (4) tension/contradiction detection between stated and revealed preferences; (5) compass super-dimension reduction (economic + cultural-authority); (6) archetype matching via weighted Euclidean distance against 12 prototype vectors.
- Quiz state persists to sessionStorage — users can refresh or leave and resume where they left off. Phase 1 and 2 support skipping questions; the scoring engine treats unanswered items as neutral (0).
- Quiz completion encodes all 67 responses (36 FC + 24 SC + 7 budget) into a ~32-char base64url string and navigates to `/results?r=<encoded>`. Results are computed client-side — no database write for anonymous users. The codec (v3) is in `src/lib/response-codec.ts`.
- Database profiles are created on demand via `POST /api/profile/materialize` when users save to account, join a group, or create an annotation. All materialized profiles are linked to authenticated users.
- The nav bar shows Quiz, Results (conditional on localStorage), Methodology, and Axes links. Account/auth UI is hidden for v1 but the infrastructure exists (sign in/out, save to account via materialize endpoint).
- Groups resolve membership by invite code only (no group ID needed to join).

## Design Context

### Users
Politically engaged individuals seeking nuanced understanding of their governance views — not a quick personality quiz, but a serious self-assessment instrument. Users arrive curious and should leave feeling like they understand themselves better. Initial rollout to friends and family, then public. Supports anonymous casual users and registered users who persist and share profiles.

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
