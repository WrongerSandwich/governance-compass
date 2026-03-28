import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { archetypes } from "@/data/archetypes";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params;

  const profile = await db.userProfile.findUnique({
    where: { id: profileId },
    include: {
      axisScores: {
        include: {
          axis: true,
          annotations: true,
        },
        orderBy: { axisId: "asc" },
      },
      compassScore: true,
      archetypeResult: true,
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (!profile.compassScore || !profile.archetypeResult) {
    return NextResponse.json({ error: "Results not yet computed" }, { status: 404 });
  }

  // Look up archetype details
  const primaryArchetype = archetypes.find(a => a.id === profile.archetypeResult!.primaryArchetypeId);
  const secondaryArchetype = archetypes.find(a => a.id === profile.archetypeResult!.secondaryArchetypeId);

  return NextResponse.json({
    profileId: profile.id,
    createdAt: profile.createdAt,
    axes: profile.axisScores.map(s => ({
      id: s.axisId,
      name: s.axis.name,
      poleA: s.axis.poleALabel,
      poleB: s.axis.poleBLabel,
      domain: s.axis.domain,
      score: s.finalScore,
      confidence: s.confidence,
      tension: {
        detected: s.tensionLevel !== "none",
        level: s.tensionLevel,
        direction: s.tensionDirection,
        narrative: s.tensionNarrative,
      },
      components: {
        fc: s.fcScore,
        sc: s.scScore,
        bg: s.bgScore,
      },
      annotations: s.annotations,
    })),
    compass: {
      economic: profile.compassScore.economic,
      cultural: profile.compassScore.cultural,
    },
    archetype: {
      primary: {
        id: profile.archetypeResult.primaryArchetypeId,
        name: primaryArchetype?.name ?? "Unknown",
        matchPercentage: profile.archetypeResult.primaryMatchPct,
        summary: primaryArchetype?.summary ?? "",
        description: primaryArchetype?.description ?? "",
        tension: primaryArchetype?.characteristicTension ?? "",
        prototype: primaryArchetype?.prototype ?? [],
      },
      secondary: {
        id: profile.archetypeResult.secondaryArchetypeId,
        name: secondaryArchetype?.name ?? "Unknown",
        matchPercentage: profile.archetypeResult.secondaryMatchPct,
        summary: secondaryArchetype?.summary ?? "",
      },
      isBlended: profile.archetypeResult.isBlended,
    },
  });
}
