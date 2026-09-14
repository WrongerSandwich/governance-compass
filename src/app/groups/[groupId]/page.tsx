"use client";

import { useParams } from "next/navigation";
import { GroupScoreBar } from "@/components/groups/GroupScoreBar";
import { GroupHeatMap } from "@/components/groups/GroupHeatMap";
import { GroupRadar } from "@/components/groups/GroupRadar";
import { useGroupComparison } from "@/lib/useGroupComparison";

export default function GroupPage() {
  const params = useParams<{ groupId: string }>();
  const { data, error } = useGroupComparison(params.groupId);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p role="alert" className="body-s text-warning-text">
          {error}
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="body-s text-text-secondary">Loading...</p>
      </main>
    );
  }

  const radarData = data.axisStats
    .filter((as) => as.average !== null)
    .map((as) => ({
      axisId: as.axisId,
      axisName: as.axisName,
      poleALabel: as.poleALabel,
      poleBLabel: as.poleBLabel,
      domain: as.domain,
      average: as.average!,
    }));

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-results mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="display-m text-text-primary">{data.group.name}</h1>
            <p className="mono-meta text-text-label mt-1.5">
              {data.members.length} members &middot; Invite code:{" "}
              <code className="bg-surface-2 px-2 py-0.5 rounded-sharp text-xs font-mono text-text-secondary">
                {data.group.inviteCode}
              </code>
            </p>
          </div>
        </div>

        <section className="bg-surface-1 rounded-sharp border border-border-secondary p-6 mb-8">
          <h2 className="label font-medium text-text-label border-b border-border-secondary pb-2 mb-4">
            Group average
          </h2>
          <GroupRadar data={radarData} />
        </section>

        <section className="bg-surface-1 rounded-sharp border border-border-secondary p-6 mb-8">
          <h2 className="label font-medium text-text-label border-b border-border-secondary pb-2 mb-4">
            Agreement and spread
          </h2>
          <GroupHeatMap
            stats={data.axisStats
              .filter((as) => as.average !== null)
              .map((as) => ({
                axisName: as.axisName,
                spread: as.spread,
              }))}
          />
        </section>

        <section className="bg-surface-1 rounded-sharp border border-border-secondary p-6 mb-8">
          <h2 className="label font-medium text-text-label border-b border-border-secondary pb-2 mb-4">
            By axis
          </h2>
          {data.axisStats
            .filter((as) => as.memberScores.length > 0)
            .map((as) => (
              <GroupScoreBar
                key={as.axisId}
                axisId={as.axisId}
                axisName={as.axisName}
                poleALabel={as.poleALabel}
                poleBLabel={as.poleBLabel}
                memberScores={as.memberScores}
                average={as.average}
              />
            ))}
        </section>
      </div>
    </main>
  );
}
