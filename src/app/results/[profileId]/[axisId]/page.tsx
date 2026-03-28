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
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/results/${profileId}`}
          className="text-sm text-stone-600 hover:text-stone-800 mb-4 inline-block"
        >
          &larr; Back to full results
        </Link>

        <div className="mb-1">
          <span className="text-[11px] uppercase tracking-[0.08em] text-stone-600 font-medium">
            {axis.domain}
          </span>
        </div>
        <h1 className="text-[22px] font-serif font-medium text-text-primary mb-6">{axis.name}</h1>

        <div className="bg-surface-1 rounded-[12px] border border-border-secondary p-6 mb-6">
          <ScoreBar
            score={axisScore.finalScore}
            poleALabel={axis.poleALabel}
            poleBLabel={axis.poleBLabel}
            height={12}
          />

          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
            <div className="bg-surface-2 rounded-[8px] p-3">
              <div className="text-[11px] text-text-tertiary mb-1">Forced choice</div>
              <div className="font-mono text-sm font-medium text-text-primary tabular-nums">
                {axisScore.fcScore >= 0 ? "+" : ""}
                {axisScore.fcScore.toFixed(2)}
              </div>
            </div>
            <div className="bg-surface-2 rounded-[8px] p-3">
              <div className="text-[11px] text-text-tertiary mb-1">Scaled</div>
              <div className="font-mono text-sm font-medium text-text-primary tabular-nums">
                {axisScore.scScore >= 0 ? "+" : ""}
                {axisScore.scScore.toFixed(2)}
              </div>
            </div>
            <div className="bg-surface-2 rounded-[8px] p-3">
              <div className="text-[11px] text-text-tertiary mb-1">Budget</div>
              <div className="font-mono text-sm font-medium text-text-primary tabular-nums">
                {axisScore.bgScore != null
                  ? (axisScore.bgScore >= 0 ? "+" : "") +
                    axisScore.bgScore.toFixed(2)
                  : "—"}
              </div>
            </div>
          </div>

          {axisScore.tensionLevel !== "none" && axisScore.tensionNarrative && (
            <div className="mt-4 rounded-[8px] p-3" style={{ backgroundColor: 'var(--warning-bg)', borderColor: 'var(--warning-border)', borderWidth: '1px' }}>
              <p className="text-[13px] text-text-secondary">{axisScore.tensionNarrative}</p>
            </div>
          )}
        </div>

        {/* Forced-choice responses */}
        {fcResponses.length > 0 && (
          <section className="mt-6">
            <h2 className="text-[11px] uppercase tracking-[0.08em] text-stone-600 font-medium border-b border-border-secondary pb-1.5 mb-3">
              Forced-choice responses
            </h2>
            <div className="space-y-3">
              {fcResponses.map((r) => (
                <div
                  key={r.id}
                  className="bg-surface-1 rounded-[8px] border border-border-secondary p-4"
                >
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div
                      className={`p-2 rounded-[6px] ${r.selectedPole === "A" ? "bg-stone-100 font-medium text-stone-800" : "text-text-tertiary"}`}
                    >
                      {r.item.statementA}
                    </div>
                    <div
                      className={`p-2 rounded-[6px] ${r.selectedPole === "B" ? "bg-stone-100 font-medium text-stone-800" : "text-text-tertiary"}`}
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
            <h2 className="text-[11px] uppercase tracking-[0.08em] text-stone-600 font-medium border-b border-border-secondary pb-1.5 mb-3">
              Scaled responses
            </h2>
            <div className="space-y-3">
              {scResponses.map((r) => (
                <div
                  key={r.id}
                  className="bg-surface-1 rounded-[8px] border border-border-secondary p-4"
                >
                  <p className="text-text-primary text-sm mb-2">
                    {r.item.questionStem}
                  </p>
                  <p className="text-sm font-medium text-stone-600">
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
            <h2 className="text-[18px] font-serif font-medium text-text-primary">
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
            <h2 className="text-[18px] font-serif font-medium text-text-primary mb-3">
              Notes
            </h2>
            {axisScore.annotations.map((a) => (
              <div
                key={a.id}
                className="bg-surface-1 rounded-[8px] border border-border-secondary p-4 text-sm text-text-secondary"
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
