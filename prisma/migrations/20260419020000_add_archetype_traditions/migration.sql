-- Adds the `traditions` column to Archetype. Existing rows get an empty
-- string default; the seed script repopulates real values immediately
-- after this migration runs.

ALTER TABLE "Archetype" ADD COLUMN "traditions" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Archetype" ALTER COLUMN "traditions" DROP DEFAULT;
