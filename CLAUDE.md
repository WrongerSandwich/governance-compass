@AGENTS.md

# PoliticalPlatform

Political self-assessment web app. Users take a research-backed questionnaire across 12 topics and receive a multi-dimensional profile with visualizations and plain-language insights. Supports annotations, one-on-one comparisons, and private group comparisons.

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
- **Seed data:** `npx prisma db seed` (12 topics, 60 questions)
- **Prisma:** After schema changes, run `npx prisma migrate dev --name <description>`

## Testing

```bash
npm test              # Unit tests (vitest)
npm run test:e2e      # E2E tests (playwright, needs dev server running)
```

## Key Directories

- `src/lib/` — Pure logic: scoring, insights, comparison, validation, auth, db
- `src/data/` — Topic and question definitions (edit these to change quiz content)
- `src/components/` — React components organized by feature (quiz, results, comparison, groups, annotations)
- `src/app/api/` — API routes
- `docs/superpowers/specs/` — Design spec
- `docs/superpowers/plans/` — Implementation plan

## Architecture Notes

- Scoring: `value * polarity` gives directional score (positive = left endpoint). Normalized via `((2 - mean) / 4) * 100` to 0-100 scale.
- Anonymous users get a UUID token in localStorage. Creating an account lets them "claim" the profile via `/api/auth/claim`.
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
