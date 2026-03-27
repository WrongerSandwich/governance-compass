import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: {
            include: {
              profiles: {
                include: {
                  topicScores: { include: { topic: true } },
                },
                orderBy: { updatedAt: "desc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const isMember = group.members.some(
    (m) => m.userId === session.user!.id
  );
  if (!isMember) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  // Gather hidden topic IDs for each member
  const memberUserIds = group.members.map((m) => m.userId);
  const allVisibilities = await db.topicVisibility.findMany({
    where: { userId: { in: memberUserIds }, hidden: true },
  });
  const hiddenByUser = new Map<string, Set<string>>();
  for (const v of allVisibilities) {
    if (!hiddenByUser.has(v.userId)) hiddenByUser.set(v.userId, new Set());
    hiddenByUser.get(v.userId)!.add(v.topicId);
  }

  const members = group.members.map((m) => {
    const profile = m.user.profiles[0];
    const hidden = hiddenByUser.get(m.userId) || new Set();
    return {
      userId: m.userId,
      name: group.showNames ? m.user.name : null,
      scores:
        profile?.topicScores
          .filter((ts) => !hidden.has(ts.topicId) && !ts.insufficientData)
          .map((ts) => ({
            topicId: ts.topicId,
            topicName: ts.topic.name,
            score: ts.score,
          })) || [],
    };
  });

  // Calculate per-topic stats
  const topics = await db.topic.findMany({ orderBy: { order: "asc" } });
  const topicStats = topics.map((topic) => {
    const memberScores = members
      .map((m) => m.scores.find((s) => s.topicId === topic.id)?.score)
      .filter((s): s is number => s !== undefined);

    const avg =
      memberScores.length > 0
        ? memberScores.reduce((a, b) => a + b, 0) / memberScores.length
        : null;
    const spread =
      memberScores.length > 1
        ? Math.max(...memberScores) - Math.min(...memberScores)
        : 0;

    return {
      topicId: topic.id,
      topicName: topic.name,
      spectrumLabelLeft: topic.spectrumLabelLeft,
      spectrumLabelRight: topic.spectrumLabelRight,
      average: avg !== null ? Math.round(avg * 100) / 100 : null,
      spread: Math.round(spread * 100) / 100,
      memberScores,
    };
  });

  return NextResponse.json({
    group: {
      id: group.id,
      name: group.name,
      inviteCode: group.inviteCode,
      showNames: group.showNames,
      creatorId: group.creatorId,
    },
    members,
    topicStats,
  });
}
