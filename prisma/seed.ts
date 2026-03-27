import { PrismaClient } from "@prisma/client";
import { topics } from "../src/data/topics";
import { questions } from "../src/data/questions";

const prisma = new PrismaClient();

async function main() {
  // Upsert topics
  for (const topic of topics) {
    await prisma.topic.upsert({
      where: { id: topic.id },
      update: topic,
      create: topic,
    });
  }

  // Upsert questions
  for (const question of questions) {
    await prisma.question.upsert({
      where: { id: question.id },
      update: question,
      create: question,
    });
  }

  console.log(`Seeded ${topics.length} topics and ${questions.length} questions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
