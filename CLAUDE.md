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
