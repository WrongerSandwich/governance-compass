import { db } from "@/lib/db";
import { QuizFlow } from "@/components/quiz/QuizFlow";
import { QuizProvider } from "@/components/quiz/QuizProvider";
import { ministries } from "@/data/ministries";

export default async function QuizPage() {
  const forcedChoiceItems = await db.forcedChoiceItem.findMany({
    orderBy: [{ axisId: "asc" }, { itemNumber: "asc" }],
  });
  const scaledItems = await db.scaledItem.findMany({
    orderBy: [{ axisId: "asc" }, { itemNumber: "asc" }],
  });

  return (
    <main className="min-h-screen px-4">
      <QuizProvider>
        <QuizFlow
          forcedChoiceItems={forcedChoiceItems}
          scaledItems={scaledItems}
          ministries={ministries}
        />
      </QuizProvider>
    </main>
  );
}
