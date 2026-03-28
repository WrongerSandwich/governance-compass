import { db } from "@/lib/db";
import { QuizFlow } from "@/components/quiz/QuizFlow";
import { QuizProvider } from "@/components/quiz/QuizProvider";

export default async function QuizPage() {
  const forcedChoiceItems = await db.forcedChoiceItem.findMany({
    orderBy: [{ axisId: "asc" }, { itemNumber: "asc" }],
  });
  const scaledItems = await db.scaledItem.findMany({
    orderBy: [{ axisId: "asc" }, { itemNumber: "asc" }],
  });
  const ministries = await db.ministry.findMany({
    orderBy: { id: "asc" },
  });
  const axes = await db.axis.findMany({
    orderBy: { id: "asc" },
    select: { id: true, name: true, poleALabel: true, poleBLabel: true },
  });

  return (
    <main className="min-h-screen px-4">
      <QuizProvider>
        <QuizFlow
          forcedChoiceItems={forcedChoiceItems}
          scaledItems={scaledItems}
          ministries={ministries}
          axes={axes}
        />
      </QuizProvider>
    </main>
  );
}
