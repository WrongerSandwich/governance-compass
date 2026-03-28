"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GroupScoreBar } from "@/components/groups/GroupScoreBar";
import { GroupHeatMap } from "@/components/groups/GroupHeatMap";
import { GroupRadar } from "@/components/groups/GroupRadar";

interface AxisStat {
  axisId: number;
  axisName: string;
  poleALabel: string;
  poleBLabel: string;
  domain: string;
  average: number | null;
  spread: number;
  memberScores: number[];
}

interface GroupData {
  group: {
    id: string;
    name: string;
    inviteCode: string;
    showNames: boolean;
    creatorId: string;
  };
  members: {
    userId: string;
    name: string | null;
    scores: { axisId: number; score: number }[];
  }[];
  axisStats: AxisStat[];
}

export default function GroupPage() {
  const params = useParams<{ groupId: string }>();
  const [data, setData] = useState<GroupData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/groups/${params.groupId}/compare`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load group");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [params.groupId]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-text-tertiary">Loading...</p>
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
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[22px] font-serif font-medium text-text-primary">
              {data.group.name}
            </h1>
            <p className="text-text-tertiary text-sm mt-1">
              {data.members.length} members &middot; Invite code:{" "}
              <code className="bg-surface-2 px-2 py-0.5 rounded-[4px] text-xs font-mono text-text-secondary">
                {data.group.inviteCode}
              </code>
            </p>
          </div>
        </div>

        <section className="bg-surface-1 rounded-[12px] border border-border-secondary p-6 mb-8">
          <h2 className="text-[11px] uppercase tracking-[0.08em] text-stone-600 font-medium border-b border-border-secondary pb-1.5 mb-4">
            Group average
          </h2>
          <GroupRadar data={radarData} />
        </section>

        <section className="bg-surface-1 rounded-[12px] border border-border-secondary p-6 mb-8">
          <h2 className="text-[11px] uppercase tracking-[0.08em] text-stone-600 font-medium border-b border-border-secondary pb-1.5 mb-4">
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

        <section className="bg-surface-1 rounded-[12px] border border-border-secondary p-6 mb-8">
          <h2 className="text-[11px] uppercase tracking-[0.08em] text-stone-600 font-medium border-b border-border-secondary pb-1.5 mb-4">
            By axis
          </h2>
          {data.axisStats
            .filter((as) => as.memberScores.length > 0)
            .map((as) => (
              <GroupScoreBar
                key={as.axisId}
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
