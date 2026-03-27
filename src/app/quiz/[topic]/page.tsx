import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { QuizClient } from "@/components/quiz/QuizClient";

export default async function TopicRetakePage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic: topicId } = await params;

  const topic = await db.topic.findUnique({
    where: { id: topicId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, text: true, context: true, order: true },
      },
    },
  });

  if (!topic) notFound();

  // QuizClient handles single-topic mode when given one topic
  return (
    <main className="min-h-screen bg-gray-50 px-4">
      <QuizClient topics={[topic]} />
    </main>
  );
}
