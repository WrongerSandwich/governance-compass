import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { RadarChart } from "@/components/results/RadarChart";
import { SpectrumBar } from "@/components/results/SpectrumBar";
import { CompareButton } from "@/components/results/CompareButton";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;

  const profile = await db.userProfile.findUnique({
    where: { id: profileId },
    include: {
      axisScores: {
        include: { axis: true },
        orderBy: { axis: { order: "asc" } },
      },
    },
  });

  if (!profile) notFound();

  const radarData = profile.axisScores.map((as) => ({
    axisId: as.axisId,
    name: as.axis.name,
    poleALabel: as.axis.poleALabel,
    poleBLabel: as.axis.poleBLabel,
    domain: as.axis.domain,
    finalScore: as.finalScore,
    confidence: as.confidence,
  }));

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Your Political Profile
            </h1>
            <p className="text-gray-500 mt-1">
              Based on your responses across {profile.axisScores.length} axes
            </p>
          </div>
          <CompareButton profileId={profileId} />
        </div>

        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Overview
          </h2>
          <RadarChart axisScores={radarData} />
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            By Axis
          </h2>
          {profile.axisScores.map((as) => (
            <SpectrumBar
              key={as.axisId}
              topicName={as.axis.name}
              score={as.finalScore}
              labelLeft={as.axis.poleALabel}
              labelRight={as.axis.poleBLabel}
              insufficientData={as.confidence === "low"}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
