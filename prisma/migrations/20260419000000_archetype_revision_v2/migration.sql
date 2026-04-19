-- Archetype revision v2: add `emergence` provenance column,
-- remove `civic-institutionalist`, rename `pragmatic-centrist` →
-- `institutional-moderate`. Existing rows are deleted; the seed
-- script repopulates the table with the v2 archetype set.

-- Detach foreign-key references so we can wipe and re-seed.
DELETE FROM "ArchetypeResult";
DELETE FROM "Archetype";

-- AlterTable
ALTER TABLE "Archetype" ADD COLUMN "emergence" TEXT NOT NULL;
