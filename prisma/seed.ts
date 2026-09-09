import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { axes } from "../src/data/axes";
import { forcedChoiceItems } from "../src/data/forced-choice-items";
import { scaledItems } from "../src/data/scaled-items";
import { ministries, ministryAxisMappings } from "../src/data/ministries";
import { archetypes } from "../src/data/archetypes";
import { SEED_COLUMNS, pick } from "./seed-columns";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Upsert axes.
  //
  // Every model below projects its columns via SEED_COLUMNS rather than
  // spreading the src/data object, which also carries presentation-only copy
  // the database does not model. See prisma/seed-columns.ts.
  for (const axis of axes) {
    const row = pick(axis, SEED_COLUMNS.Axis);
    await prisma.axis.upsert({
      where: { id: axis.id },
      update: row,
      create: row,
    });
  }
  console.log(`Seeded ${axes.length} axes.`);

  // Upsert forced-choice items
  for (const item of forcedChoiceItems) {
    const row = pick(item, SEED_COLUMNS.ForcedChoiceItem);
    await prisma.forcedChoiceItem.upsert({
      where: { id: item.id },
      update: row,
      create: row,
    });
  }
  console.log(`Seeded ${forcedChoiceItems.length} forced-choice items.`);

  // Upsert scaled items
  for (const item of scaledItems) {
    const row = pick(item, SEED_COLUMNS.ScaledItem);
    await prisma.scaledItem.upsert({
      where: { id: item.id },
      update: row,
      create: row,
    });
  }
  console.log(`Seeded ${scaledItems.length} scaled items.`);

  // Upsert ministries — map to Prisma schema shape
  for (const ministry of ministries) {
    // belowBaselineWarning is derived, not copied, so this one is written out
    // — the Record type makes a missing column a compile error.
    const data = {
      id: ministry.id,
      name: ministry.name,
      description: ministry.description,
      belowBaselineWarning: ministry.consequences[0].text, // crisis tier as warning
    } satisfies Record<(typeof SEED_COLUMNS.Ministry)[number], unknown>;
    await prisma.ministry.upsert({
      where: { id: ministry.id },
      update: data,
      create: data,
    });
  }
  console.log(`Seeded ${ministries.length} ministries.`);

  // Upsert ministry-axis mappings
  for (const mapping of ministryAxisMappings) {
    await prisma.ministryAxisMapping.upsert({
      where: {
        ministryId_axisId: {
          ministryId: mapping.ministryId,
          axisId: mapping.axisId,
        },
      },
      update: { direction: mapping.direction },
      create: pick(mapping, SEED_COLUMNS.MinistryAxisMapping),
    });
  }
  console.log(`Seeded ${ministryAxisMappings.length} ministry-axis mappings.`);

  // Upsert archetypes
  for (const archetype of archetypes) {
    const row = pick(archetype, SEED_COLUMNS.Archetype);
    await prisma.archetype.upsert({
      where: { id: archetype.id },
      update: row,
      create: row,
    });
  }
  console.log(`Seeded ${archetypes.length} archetypes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
