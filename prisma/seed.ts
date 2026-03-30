import { PrismaClient } from "@prisma/client";
import { axes } from "../src/data/axes";
import { forcedChoiceItems } from "../src/data/forced-choice-items";
import { scaledItems } from "../src/data/scaled-items";
import { ministries, ministryAxisMappings } from "../src/data/ministries";
import { archetypes } from "../src/data/archetypes";

const prisma = new PrismaClient();

async function main() {
  // Upsert axes
  for (const axis of axes) {
    await prisma.axis.upsert({
      where: { id: axis.id },
      update: axis,
      create: axis,
    });
  }
  console.log(`Seeded ${axes.length} axes.`);

  // Upsert forced-choice items
  for (const item of forcedChoiceItems) {
    await prisma.forcedChoiceItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`Seeded ${forcedChoiceItems.length} forced-choice items.`);

  // Upsert scaled items
  for (const item of scaledItems) {
    await prisma.scaledItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`Seeded ${scaledItems.length} scaled items.`);

  // Upsert ministries — map to Prisma schema shape
  for (const ministry of ministries) {
    const data = {
      id: ministry.id,
      name: ministry.name,
      description: ministry.description,
      belowBaselineWarning: ministry.consequences[0].text, // crisis tier as warning
    };
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
      create: mapping,
    });
  }
  console.log(`Seeded ${ministryAxisMappings.length} ministry-axis mappings.`);

  // Upsert archetypes
  for (const archetype of archetypes) {
    await prisma.archetype.upsert({
      where: { id: archetype.id },
      update: archetype,
      create: archetype,
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
