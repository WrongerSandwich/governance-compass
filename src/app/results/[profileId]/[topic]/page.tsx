import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { SpectrumBar } from "@/components/results/SpectrumBar";
import { AnnotationEditor } from "@/components/annotations/AnnotationEditor";

const VALUE_LABELS = new Map<number, string>([
  [-2, "Strongly Disagree"],
  [-1, "Disagree"],
  [0, "Neutral"],
  [1, "Agree"],
  [2, "Strongly Agree"],
]);

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ profileId: string; topic: string }>;
}) {
  const { profileId, topic: topicId } = await params;

  const topicScore = await db.topicScore.findUnique({
    where: { profileId_topicId: { profileId, topicId } },
    include: {
      topic: true,
      profile: true,
      annotations: { orderBy: { updatedAt: "desc" } },
    },
  });

  if (!topicScore) notFound();

  const answers = await db.answer.findMany({
    where: {
      profileId,
      question: { topicId },
    },
    include: { question: true },
    orderBy: { question: { order: "asc" } },
  });

  const session = await auth();
  const isOwner =
    session?.user?.id && topicScore.profile.userId === session.user.id;

  const existingAnnotation = isOwner
    ? topicScore.annotations.find((a) => a.userId === session.user.id)
    : null;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/results/${profileId}`}
          className="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-block"
        >
          &larr; Back to full results
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {topicScore.topic.name}
        </h1>
        <p className="text-gray-600 mb-6">{topicScore.topic.description}</p>

        <SpectrumBar
          topicName=""
          score={topicScore.score}
          labelLeft={topicScore.topic.spectrumLabelLeft}
          labelRight={topicScore.topic.spectrumLabelRight}
          insufficientData={topicScore.insufficientData}
        />

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Answers
          </h2>
          <div className="space-y-3">
            {answers.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <p className="text-gray-900">{a.question.text}</p>
                {a.question.context && (
                  <p className="text-sm text-gray-500 italic mt-1">
                    {a.question.context}
                  </p>
                )}
                <p className="text-sm mt-2 font-medium text-indigo-600">
                  {a.skipped
                    ? "Skipped"
                    : a.value !== null
                      ? VALUE_LABELS.get(a.value) ?? "Not answered"
                      : "Not answered"}
                </p>
              </div>
            ))}
          </div>
        </section>

        {isOwner && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">
              Annotations
            </h2>
            <AnnotationEditor
              topicScoreId={topicScore.id}
              initialText={existingAnnotation?.text || ""}
            />
          </section>
        )}

        {!isOwner && topicScore.annotations.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Notes
            </h2>
            {topicScore.annotations.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-lg border border-gray-200 p-4 text-sm text-gray-700"
              >
                {a.text}
              </div>
            ))}
          </section>
        )}

        {isOwner && (
          <div className="mt-6">
            <Link
              href={`/quiz/${topicId}`}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Retake this topic &rarr;
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
