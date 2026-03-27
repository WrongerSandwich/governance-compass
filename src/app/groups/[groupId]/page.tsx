"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GroupSpectrum } from "@/components/groups/GroupSpectrum";
import { GroupHeatMap } from "@/components/groups/GroupHeatMap";
import { GroupRadar } from "@/components/groups/GroupRadar";

interface TopicStat {
  topicId: string;
  topicName: string;
  spectrumLabelLeft: string;
  spectrumLabelRight: string;
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
  members: { userId: string; name: string | null; scores: { topicId: string; score: number }[] }[];
  topicStats: TopicStat[];
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
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  const radarData = data.topicStats
    .filter((ts) => ts.average !== null)
    .map((ts) => ({ topic: ts.topicName, average: ts.average! }));

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {data.group.name}
            </h1>
            <p className="text-gray-500 mt-1">
              {data.members.length} members &middot; Invite code:{" "}
              <code className="bg-gray-100 px-2 py-0.5 rounded text-sm">
                {data.group.inviteCode}
              </code>
            </p>
          </div>
        </div>

        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Group Average
          </h2>
          <GroupRadar data={radarData} />
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Agreement & Spread
          </h2>
          <GroupHeatMap
            stats={data.topicStats
              .filter((ts) => ts.average !== null)
              .map((ts) => ({
                topicName: ts.topicName,
                spread: ts.spread,
              }))}
          />
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            By Topic
          </h2>
          {data.topicStats
            .filter((ts) => ts.memberScores.length > 0)
            .map((ts) => (
              <GroupSpectrum
                key={ts.topicId}
                topicName={ts.topicName}
                labelLeft={ts.spectrumLabelLeft}
                labelRight={ts.spectrumLabelRight}
                memberScores={ts.memberScores}
                average={ts.average}
              />
            ))}
        </section>
      </div>
    </main>
  );
}
