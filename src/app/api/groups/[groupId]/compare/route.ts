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
                  axisScores: { include: { axis: true } },
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

  // Gather hidden axis IDs for each member
  const memberUserIds = group.members.map((m) => m.userId);
  const allVisibilities = await db.axisVisibility.findMany({
    where: { userId: { in: memberUserIds }, hidden: true },
  });
  const hiddenByUser = new Map<string, Set<number>>();
  for (const v of allVisibilities) {
    if (!hiddenByUser.has(v.userId)) hiddenByUser.set(v.userId, new Set());
    hiddenByUser.get(v.userId)!.add(v.axisId);
  }

  const members = group.members.map((m) => {
    const profile = m.user.profiles[0];
    const hidden = hiddenByUser.get(m.userId) || new Set<number>();
    return {
      userId: m.userId,
      name: group.showNames ? m.user.name : null,
      scores:
        profile?.axisScores
          .filter((as) => !hidden.has(as.axisId))
          .map((as) => ({
            axisId: as.axisId,
            axisName: as.axis.name,
            score: as.finalScore,
          })) || [],
    };
  });

  // Calculate per-axis stats
  const axes = await db.axis.findMany({ orderBy: { order: "asc" } });
  const axisStats = axes.map((axis) => {
    const memberScores = members
      .map((m) => m.scores.find((s) => s.axisId === axis.id)?.score)
      .filter((s): s is number => s !== undefined);

    const avg =
      memberScores.length > 0
        ? memberScores.reduce((a, b) => a + b, 0) / memberScores.length
        : null;
    // Spread is max - min; on [-1, +1] scale the max possible spread is 2.0
    const spread =
      memberScores.length > 1
        ? Math.max(...memberScores) - Math.min(...memberScores)
        : 0;

    return {
      axisId: axis.id,
      axisName: axis.name,
      poleALabel: axis.poleALabel,
      poleBLabel: axis.poleBLabel,
      domain: axis.domain,
      average: avg !== null ? Math.round(avg * 1000) / 1000 : null,
      spread: Math.round(spread * 1000) / 1000,
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
    axisStats,
  });
}
