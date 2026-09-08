# Prisma 7 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the application to Prisma 7 and remove its Dependabot major-version holds.

**Architecture:** Prisma generates an ESM client in ignored `src/generated/prisma`. The application and seed script each construct the generated client with a `PrismaPg` adapter, and the Prisma config remains the sole CLI datasource owner.

**Tech Stack:** Next.js 16, TypeScript, Prisma ORM 7, `@prisma/adapter-pg`, `pg`, Vitest, Playwright, PostgreSQL 16.

**Spec:** `docs/superpowers/specs/2026-09-08-prisma-7-migration-design.md`

## Global Constraints

- Use `prisma-client` with `output = "../src/generated/prisma"`; generated code remains untracked.
- Keep the generate-only `DATABASE_URL` placeholder, migrations location, seed command, global client cache, and explicit CI seed workflow.
- The repository already has `.npmrc` `legacy-peer-deps=true` for Auth.js's temporary Prisma ≤6 peer metadata.
- Run final commands on Node 22 or 24; the host's Node 23 is unsupported.

---

### Task 1: Migrate generated client and runtime database connections

**Files:**
- Create: `tests/unit/db.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `prisma/schema.prisma:1-8`
- Modify: `prisma.config.ts:1-31`
- Modify: `src/lib/db.ts`
- Modify: `prisma/seed.ts`

**Interfaces:**
- Consumes: `DATABASE_URL`, `PrismaPg`, and generated `PrismaClient`.
- Produces: adapter-backed cached `db`, adapter-backed seed client, and a Prisma 7 ESM client under `src/generated/prisma`.

- [x] **Step 1: Write a failing DB-client construction test**

```ts
it("creates the shared client with a PostgreSQL adapter", async () => {
  process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/app";
  const { db } = await import("@/lib/db");

  expect(PrismaPg).toHaveBeenCalledWith({
    connectionString: "postgresql://user:pass@localhost:5432/app",
  });
  expect(PrismaClient).toHaveBeenCalledWith({ adapter: expect.anything() });
  expect(db).toBe(PrismaClient.mock.results[0].value);
});
```

The named break is replacing the required adapter with `new PrismaClient()`.
Mock only the generated client and database driver constructors; the assertions
cover this module's construction contract rather than either dependency.

- [x] **Step 2: Verify red**

Run: `npm test -- tests/unit/db.test.ts`

Expected: FAIL resolving `@/generated/prisma/client` because the v7 generator
does not yet produce that module.

- [x] **Step 3: Update packages, ESM metadata, schema, and CLI config**

Run: `npm install @prisma/client@7 @prisma/adapter-pg@7 pg && npm install --save-dev prisma@7`

Add `"type": "module"` to `package.json`. Change the schema generator to:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

The datasource must contain only `provider = "postgresql"`. Remove only
`engine: "classic"` from `prisma.config.ts`, preserving its existing schema,
migrations, seed, and `datasource.url` behavior. Run `npx prisma generate`.

- [x] **Step 4: Implement runtime and seed adapters**

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
export const db = globalForPrisma.prisma || new PrismaClient({ adapter });
```

Use the equivalent relative generated-client import and adapter in
`prisma/seed.ts`, retaining its existing `$disconnect()` lifecycle.

- [x] **Step 5: Verify green and Prisma configuration**

Run: `npx prisma generate && npx prisma validate && npm test -- tests/unit/db.test.ts`

Expected: no P1012 schema error; generation and the focused adapter test pass.

- [x] **Step 6: Commit**

Run: `git add package.json package-lock.json prisma/schema.prisma prisma.config.ts src/lib/db.ts prisma/seed.ts tests/unit/db.test.ts && git commit -m "feat(db): migrate to Prisma 7 adapter"`

### Task 2: Release Dependabot and verify a clean install

**Files:**
- Modify: `.github/dependabot.yml`

**Interfaces:**
- Consumes: the existing npm peer-resolution configuration.
- Produces: Dependabot eligibility for future Prisma majors and a clean install that regenerates the client.

- [x] **Step 1: Remove only Prisma's ignore entries**

Delete the `prisma` and `@prisma/client` major-version entries and their
migration-specific comment. Keep the TypeScript and ESLint entries unchanged.

- [x] **Step 2: Prove clean generation**

Run: `rm -rf node_modules && npm ci && npx prisma generate`

Expected: installation honors `.npmrc`, and generation completes with no
database connection.

- [x] **Step 3: Commit**

Run: `git add .github/dependabot.yml && git commit -m "chore(deps): unblock Prisma Dependabot majors"`

### Task 3: Verify live database operations and app gates

**Files:**
- Modify: `docs/superpowers/specs/2026-09-08-prisma-7-migration-design.md`
- Modify: `docs/superpowers/plans/2026-09-08-prisma-7-migration.md`

**Interfaces:**
- Consumes: Docker PostgreSQL and the Prisma 7 generated client.
- Produces: requirement-by-requirement verification evidence.

- [ ] **Step 1: Exercise migration and seed**

Run: `docker compose up -d --wait postgres && npx prisma migrate deploy && npx prisma db seed`

Expected: migration state applies (or is current) and seed logs 12 axes, 60
questions, 7 ministries, and 12 archetypes.

- [x] **Step 2: Run static and unit gates**

Run: `npm run lint && npm run typecheck && npm test`

Expected: all exit 0 under Node 22 or Node 24.

- [ ] **Step 3: Run production and E2E gates**

Run: `npm run build && CI=true npm run test:e2e`

Expected: the build and all Playwright specs pass against seeded Postgres.

Local result: `npm run build` passed under Node 24. The Docker daemon was not
available, so local `prisma migrate deploy`, `prisma db seed`, and E2E execution
remain for the PR's CI PostgreSQL service.

- [x] **Step 4: Record exact results and commit docs**

Run: `git add docs/superpowers/specs/2026-09-08-prisma-7-migration-design.md docs/superpowers/plans/2026-09-08-prisma-7-migration.md && git commit -m "docs: record Prisma 7 migration verification"`

## Local verification record

- Node runtime: bundled Node 24.19.0.
- `npm ci` ran successfully and its `postinstall` generated Prisma Client 7.10.0.
- `prisma generate` passed without `DATABASE_URL`; `prisma validate` passed with
  CI's dummy PostgreSQL URL.
- `npm run lint` and `npm run typecheck` passed.
- `npm test` passed: 51 files and 542 tests.
- `npm run build` passed.
- Docker was unavailable (`Cannot connect to the Docker daemon`), so migration,
  seed, and E2E results are intentionally not claimed locally.
