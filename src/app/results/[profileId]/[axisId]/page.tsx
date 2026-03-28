import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ScoreBar } from "@/components/results/ScoreBar";
import { AnnotationEditor } from "@/components/annotations/AnnotationEditor";

function getScaledOptionText(
  item: {
    option1Text: string;
    option2Text: string;
    option3Text: string;
    option4Text: string;
    option5Text: string;
  },
  value: number
): string {
  const map: Record<number, string> = {
    1: item.option1Text,
    2: item.option2Text,
    3: item.option3Text,
    4: item.option4Text,
    5: item.option5Text,
  };
  return map[value] ?? String(value);
}

export default async function AxisDetailPage({
  params,
}: {
  params: Promise<{ profileId: string; axisId: string }>;
}) {
  const { profileId, axisId: axisIdStr } = await params;
  const axisId = parseInt(axisIdStr, 10);
  if (isNaN(axisId)) notFound();

  const axisScore = await db.axisScore.findUnique({
    where: { profileId_axisId: { profileId, axisId } },
    include: {
      axis: true,
      profile: true,
      annotations: { orderBy: { updatedAt: "desc" } },
    },
  });

  if (!axisScore) notFound();

  // Load forced-choice responses for this axis
  const fcResponses = await db.forcedChoiceResponse.findMany({
    where: { profileId, item: { axisId } },
    include: { item: true },
    orderBy: { item: { itemNumber: "asc" } },
  });

  // Load scaled responses for this axis
  const scResponses = await db.scaledResponse.findMany({
    where: { profileId, item: { axisId } },
    include: { item: true },
    orderBy: { item: { itemNumber: "asc" } },
  });

  const session = await auth();
  const isOwner =
    session?.user?.id && axisScore.profile.userId === session.user.id;

  const existingAnnotation = isOwner
    ? axisScore.annotations.find((a) => a.userId === session.user.id)
    : null;

  const { axis } = axisScore;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/results/${profileId}`}
          className="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-block"
        >
          &larr; Back to full results
        </Link>

        <div className="mb-1">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {axis.domain}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{axis.name}</h1>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <ScoreBar
            score={axisScore.finalScore}
            poleALabel={axis.poleALabel}
            poleBLabel={axis.poleBLabel}
            height={12}
          />

          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Forced Choice</div>
              <div className="font-semibold text-gray-800 tabular-nums">
                {axisScore.fcScore >= 0 ? "+" : ""}
                {axisScore.fcScore.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Scaled</div>
              <div className="font-semibold text-gray-800 tabular-nums">
                {axisScore.scScore >= 0 ? "+" : ""}
                {axisScore.scScore.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Budget</div>
              <div className="font-semibold text-gray-800 tabular-nums">
                {axisScore.bgScore != null
                  ? (axisScore.bgScore >= 0 ? "+" : "") +
                    axisScore.bgScore.toFixed(2)
                  : "—"}
              </div>
            </div>
          </div>

          {axisScore.tensionLevel !== "none" && axisScore.tensionNarrative && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">{axisScore.tensionNarrative}</p>
            </div>
          )}
        </div>

        {/* Forced-choice responses */}
        {fcResponses.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Forced-Choice Responses
            </h2>
            <div className="space-y-3">
              {fcResponses.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div
                      className={`p-2 rounded ${r.selectedPole === "A" ? "bg-indigo-100 font-medium text-indigo-900" : "text-gray-500"}`}
                    >
                      {r.item.statementA}
                    </div>
                    <div
                      className={`p-2 rounded ${r.selectedPole === "B" ? "bg-rose-100 font-medium text-rose-900" : "text-gray-500"}`}
                    >
                      {r.item.statementB}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Scaled responses */}
        {scResponses.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Scaled Responses
            </h2>
            <div className="space-y-3">
              {scResponses.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <p className="text-gray-900 text-sm mb-2">
                    {r.item.questionStem}
                  </p>
                  <p className="text-sm font-medium text-indigo-600">
                    {getScaledOptionText(r.item, r.value)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Annotations */}
        {isOwner && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">
              Annotations
            </h2>
            <AnnotationEditor
              axisScoreId={axisScore.id}
              initialText={existingAnnotation?.text || ""}
            />
          </section>
        )}

        {!isOwner && axisScore.annotations.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Notes
            </h2>
            {axisScore.annotations.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-lg border border-gray-200 p-4 text-sm text-gray-700"
              >
                {a.text}
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
