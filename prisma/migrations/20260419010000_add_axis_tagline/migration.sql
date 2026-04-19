-- Adds the `tagline` column to Axis. The column has been present on the
-- TypeScript side (src/data/axes.ts) since commit daeb080 but was never
-- added to the Prisma schema or a migration. The seed script repopulates
-- real values immediately after this migration runs, so an empty default
-- is fine for any pre-existing rows.

ALTER TABLE "Axis" ADD COLUMN "tagline" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Axis" ALTER COLUMN "tagline" DROP DEFAULT;
