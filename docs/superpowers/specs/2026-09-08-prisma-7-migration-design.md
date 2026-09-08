# Prisma 7 Migration Design

## Goal

Upgrade the application from Prisma ORM 6 to Prisma ORM 7 so Dependabot can
accept future major Prisma updates, while preserving PostgreSQL-backed runtime,
migration, seed, and Auth.js behavior.

## Scope and constraints

- Use Prisma's supported ESM-first, Rust-free `prisma-client` generator.
- Generate the client at `src/generated/prisma`, which is already ignored by
  Git, rather than committing generated artifacts.
- Use PostgreSQL's `@prisma/adapter-pg` driver adapter and `pg` for every
  runtime client instance.
- Keep the existing single-client global cache to prevent development hot
  reloads from creating extra connection pools.
- Keep Prisma CLI configuration in `prisma.config.ts`; it continues to allow
  `prisma generate` without a real database URL and requires `DATABASE_URL` for
  operations that connect.
- Preserve the existing explicit `prisma db seed` workflow in CI.
- Remove Prisma 7's completed entries from Dependabot's major-version ignore
  list.

Prisma 7 requires Node 20.19+, 22.12+, or 24+. CI already uses Node 22. The
current local Node 23 runtime is unsupported by both the existing test toolchain
and Prisma 7, so local verification must use an available supported Node runtime
or be corroborated by CI.

## Package and module migration

`package.json` will declare `"type": "module"`, retain the project's existing
`module: "esnext"` and `moduleResolution: "bundler"` TypeScript configuration,
and upgrade `prisma` and `@prisma/client` together to the same Prisma 7 release.
It will add matching `@prisma/adapter-pg` and `pg` dependencies. The lockfile
will be regenerated using npm's approved legacy-peer resolution because
`@auth/prisma-adapter@2.11.3` currently declares a Prisma peer range only
through v6, despite its runtime API remaining structurally compatible. The
repository will commit the npm setting required for reproducible CI installs.

## Schema and CLI configuration

The datasource block in `prisma/schema.prisma` will retain only
`provider = "postgresql"`. Its generator will change to `prisma-client` with
`output = "../src/generated/prisma"`. The datasource URL remains exclusively
in `prisma.config.ts`; the removed `engine` property will not be replaced.

## Runtime and seed clients

`src/lib/db.ts` and `prisma/seed.ts` will import `PrismaClient` from the
generated client path, instantiate `PrismaPg` with `DATABASE_URL`, and pass the
adapter to `new PrismaClient({ adapter })`. The development global cache will
continue to cache that exact generated-client type. The Auth.js adapter will
receive the same cached client; any necessary type bridge will be minimal and
isolated to its adapter boundary.

## Validation

The change is accepted only if a clean install can generate the client, the
Prisma config and migration commands work against the local PostgreSQL service,
the seed command succeeds, and lint, typecheck, unit tests, production build,
and Playwright E2E tests pass using a supported Node version. The PR will link
issue #15 and state the Auth.js peer-dependency exception explicitly.
