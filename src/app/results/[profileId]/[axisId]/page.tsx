import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ScoreBar } from "@/components/results/ScoreBar";
import { AnnotationEditor } from "@/components/annotations/AnnotationEditor";

function getScaledOptionDisplay(
  item: {
    option1Label: string; option1Detail: string;
    option2Label: string; option2Detail: string;
    option3Label: string; option3Detail: string;
    option4Label: string; option4Detail: string;
    option5Label: string; option5Detail: string;
  },
  value: number
): { label: string; detail: string } {
  const map: Record<number, { label: string; detail: string }> = {
    1: { label: item.option1Label, detail: item.option1Detail },
    2: { label: item.option2Label, detail: item.option2Detail },
    3: { label: item.option3Label, detail: item.option3Detail },
    4: { label: item.option4Label, detail: item.option4Detail },
    5: { label: item.option5Label, detail: item.option5Detail },
  };
  return map[value] ?? { label: String(value), detail: "" };
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
    ? axisScore.annotations.find((a) => a.userId === session.user!.id)
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
          <span className="text-[11px] uppercase tracking-[0.08em] text-stone-800 font-medium">
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
            <h2 className="text-[11px] uppercase tracking-[0.08em] text-stone-800 font-medium border-b border-border-secondary pb-1.5 mb-3">
              Forced-choice responses
            </h2>
            <div className="space-y-3">
              {fcResponses.map((r) => (
                <div
                  key={r.id}
                  className="bg-surface-1 rounded-[8px] border border-border-secondary p-4"
                >
                  <div className="grid grid-cols-1 min-[560px]:grid-cols-2 gap-3 text-sm">
                    <div
                      className={`p-2 rounded-[6px] ${r.selectedPole === "A" ? "bg-stone-100 text-stone-800" : "text-text-tertiary"}`}
                    >
                      <p className={`text-[15px] leading-snug ${r.selectedPole === "A" ? "font-medium" : ""}`}>
                        {r.item.headlineA}
                      </p>
                      <p className="text-[13px] text-text-tertiary leading-relaxed mt-1">
                        {r.item.bodyA}
                      </p>
                    </div>
                    <div
                      className={`p-2 rounded-[6px] ${r.selectedPole === "B" ? "bg-stone-100 text-stone-800" : "text-text-tertiary"}`}
                    >
                      <p className={`text-[15px] leading-snug ${r.selectedPole === "B" ? "font-medium" : ""}`}>
                        {r.item.headlineB}
                      </p>
                      <p className="text-[13px] text-text-tertiary leading-relaxed mt-1">
                        {r.item.bodyB}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Calibrated scale responses */}
        {scResponses.length > 0 && (
          <section className="mt-6">
            <h2 className="text-[11px] uppercase tracking-[0.08em] text-stone-800 font-medium border-b border-border-secondary pb-1.5 mb-3">
              Calibrated scale responses
            </h2>
            <div className="space-y-3">
              {scResponses.map((r) => {
                const { label, detail } = getScaledOptionDisplay(r.item, r.value);
                return (
                  <div
                    key={r.id}
                    className="bg-surface-1 rounded-[8px] border border-border-secondary p-4"
                  >
                    <p className="text-text-primary text-sm mb-2">
                      {r.item.questionStem}
                    </p>
                    <p className="text-sm font-medium text-stone-600">
                      {label}
                    </p>
                    {detail && (
                      <p className="text-[13px] text-text-tertiary mt-1">
                        {detail}
                      </p>
                    )}
                  </div>
                );
              })}
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
