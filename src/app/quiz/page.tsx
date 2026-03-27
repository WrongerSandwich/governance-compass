import { db } from "@/lib/db";
import { QuizClient } from "@/components/quiz/QuizClient";

export default async function QuizPage() {
  const topics = await db.topic.findMany({
    orderBy: { order: "asc" },
    include: {
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, text: true, context: true, order: true },
      },
    },
  });

  return (
    <main className="min-h-screen bg-gray-50 px-4">
      <QuizClient topics={topics} />
    </main>
  );
}
