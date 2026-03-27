import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [profile, allTopics, visibilities, groups] = await Promise.all([
    db.userProfile.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    }),
    db.topic.findMany({ orderBy: { order: "asc" } }),
    db.topicVisibility.findMany({ where: { userId } }),
    db.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: { _count: { select: { members: true } } },
        },
      },
    }),
  ]);

  const hiddenSet = new Set(visibilities.filter((v) => v.hidden).map((v) => v.topicId));

  return NextResponse.json({
    profileId: profile?.id || null,
    topicVisibility: allTopics.map((t) => ({
      topicId: t.id,
      topicName: t.name,
      hidden: hiddenSet.has(t.id),
    })),
    groups: groups.map((gm) => ({
      id: gm.group.id,
      name: gm.group.name,
      inviteCode: gm.group.inviteCode,
      memberCount: gm.group._count.members,
    })),
  });
}
