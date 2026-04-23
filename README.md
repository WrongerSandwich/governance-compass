# The Governance Compass

A political self-assessment web app that measures governance preferences across 12 dimensions. Users complete a 3-phase questionnaire (forced-choice dilemmas, calibrated scales, budget allocation) and receive a multi-dimensional profile with archetype matching, tension detection, and interactive visualizations.

Supports annotations, one-on-one comparisons, and private group comparisons.

## Quick Start

```bash
# Start the database (Docker must be running)
docker start political-platform-db

# If the container doesn't exist:
docker run -d --name political-platform-db \
  -e POSTGRES_USER=ppuser \
  -e POSTGRES_PASSWORD=ppdevpass \
  -e POSTGRES_DB=political_platform \
  -p 5433:5432 postgres:16-alpine

# Install dependencies and seed the database
npm install
npx prisma migrate dev
npx prisma db seed

# Start the dev server
npm run dev
# Open http://localhost:3000
```

## Stack

Next.js 16 (App Router), TypeScript, PostgreSQL, Prisma, NextAuth v5, Tailwind CSS, Recharts

## Testing

```bash
npm test              # Unit tests (vitest)
npm run test:e2e      # E2E tests (playwright, needs dev server running)
```

## Project Structure

- `src/app/` — Next.js App Router pages and API routes, including the `/study/*` Synthetic Study section
- `src/components/` — React components by feature (quiz, results, comparison, groups, annotations, study) plus shared NavBar, SessionProvider
- `src/data/` — Axis, item, ministry, and archetype definitions
- `src/lib/` — Pure logic: scoring, comparison, validation, auth, db, design tokens, study helpers
- `data/synthetic_study/` — Raw pipeline outputs for the Synthetic Study (personas, scored profiles, cluster labels, etc.)
- `public/study/derived/` — Build-time preprocessed JSON for the Synthetic Study pages
- `public/geo/` + `public/data/` — World map TopoJSON and public Synthetic Study download
- `scripts/` — Build-time preprocessing (`build-synthetic-study.ts`, `build-geo.ts`) run via `npm run build:study` / `npm run build:geo` on `prebuild`
- `docs/system_proposal/` — Design specs (scoring engine, results UI, question bank, design system, synthetic study)
- `prisma/` — Database schema and migrations
