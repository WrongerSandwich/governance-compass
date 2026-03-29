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
- **Seed data:** `npx prisma db seed` (12 axes, 72 questions — 36 forced-choice + 36 scaled — plus 10 ministries and 12 archetypes)
- **Prisma:** After schema changes, run `npx prisma migrate dev --name <description>`

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

## Architecture Notes

- Scoring is a 6-stage pipeline: (1) raw scoring per modality — FC maps A/B→±1.0, SC maps Likert 1-5→[-2,+2] then /2, budget uses tanh normalization; (2) per-axis modality computation; (3) weighted fusion (FC 40%, SC 35%, Budget 25%, adjusted for coverage); (4) tension/contradiction detection between stated and revealed preferences; (5) compass super-dimension reduction (economic + cultural-authority); (6) archetype matching via weighted Euclidean distance against 12 prototype vectors.
- Quiz state persists to sessionStorage — users can refresh or leave and resume where they left off. Phase 1 and 2 support skipping questions; the scoring engine treats unanswered items as neutral (0).
- Quiz completion encodes all 82 responses into a ~44-char base64url string and navigates to `/results?r=<encoded>`. Results are computed client-side — no database write for anonymous users. The codec is in `src/lib/response-codec.ts`.
- Database profiles are created on demand via `POST /api/profile/materialize` when users save to account, join a group, or create an annotation. All materialized profiles are linked to authenticated users.
- The nav bar is auth-aware: shows "Sign in" for anonymous users, the user's name + "Sign out" for authenticated users. A conditional "Results" link appears when localStorage has results (encoded or materialized).
- Groups resolve membership by invite code only (no group ID needed to join).

## Design Context

### Users
Politically engaged individuals seeking nuanced understanding of their governance views — not a quick personality quiz, but a serious self-assessment instrument. Users arrive curious and should leave feeling like they understand themselves better. Initial rollout to friends and family, then public. Supports anonymous casual users and registered users who persist and share profiles.

### Brand Personality
**Scholarly, precise, warm.** The site feels like a well-made atlas crossed with a policy journal. It draws from three traditions: cartographic surveying (earth tones, contour lines, monospace coordinates), editorial publishing (serif headings, large typographic numbers, layered surfaces), and Swiss modernist data design (strict grids, alternating rows, no decoration without information). Authority comes from stillness and restraint, not from color or animation.

### Aesthetic Direction
- **Visual tone:** Near-monochrome with a single warm accent (Stone 600: `#85735e`). Serious without being cold. Information-dense without being overwhelming.
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
