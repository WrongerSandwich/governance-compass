import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [profile, allAxes, visibilities, groups] = await Promise.all([
    db.userProfile.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    }),
    db.axis.findMany({ orderBy: { order: "asc" } }),
    db.axisVisibility.findMany({ where: { userId } }),
    db.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: { _count: { select: { members: true } } },
        },
      },
    }),
  ]);

  const hiddenSet = new Set(visibilities.filter((v: { hidden: boolean; axisId: number }) => v.hidden).map((v: { axisId: number }) => v.axisId));

  return NextResponse.json({
    profileId: profile?.id || null,
    axisVisibility: allAxes.map((a) => ({
      axisId: a.id,
      axisName: a.name,
      domain: a.domain,
      hidden: hiddenSet.has(a.id),
    })),
    groups: groups.map((gm) => ({
      id: gm.group.id,
      name: gm.group.name,
      inviteCode: gm.group.inviteCode,
      memberCount: gm.group._count.members,
    })),
  });
}
