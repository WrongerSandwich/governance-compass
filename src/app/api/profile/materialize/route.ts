import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { decodeResponses } from "@/lib/response-codec";
import { computeFullResults } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const encoded = body.encoded;

  if (typeof encoded !== "string" || !encoded) {
    return NextResponse.json({ error: "Missing encoded responses" }, { status: 400 });
  }

  let responses;
  try {
    responses = decodeResponses(encoded);
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid encoded data", details: err instanceof Error ? err.message : "Unknown" },
      { status: 400 }
    );
  }

  const results = computeFullResults(responses);

  const profile = await db.$transaction(async (tx) => {
    const newProfile = await tx.userProfile.create({
      data: { userId: session.user!.id },
    });

    // FC responses
    const fcEntries = Object.entries(responses.forcedChoice);
    if (fcEntries.length > 0) {
      await tx.forcedChoiceResponse.createMany({
        data: fcEntries.map(([itemId, selectedPole]) => ({
          profileId: newProfile.id,
          itemId,
          selectedPole,
        })),
      });
    }

    // SC responses
    const scEntries = Object.entries(responses.scaled);
    if (scEntries.length > 0) {
      await tx.scaledResponse.createMany({
        data: scEntries.map(([itemId, value]) => ({
          profileId: newProfile.id,
          itemId,
          value,
        })),
      });
    }

    // Budget allocations
    await tx.budgetAllocation.createMany({
      data: Object.entries(responses.budget).map(([ministryId, amount]) => ({
        profileId: newProfile.id,
        ministryId: Number(ministryId),
        amount,
      })),
    });

    // Axis scores
    await tx.axisScore.createMany({
      data: results.axisScores.map((s) => ({
        profileId: newProfile.id,
        axisId: s.axisId,
        fcScore: s.fcScore,
        scScore: s.scScore,
        bgScore: s.bgScore,
        finalScore: s.finalScore,
        confidence: s.confidence,
        tensionLevel: s.tension.level,
        tensionDirection: s.tension.direction,
        tensionNarrative: null,
      })),
    });

    await tx.compassScore.create({
      data: {
        profileId: newProfile.id,
        economic: results.compass.economic,
        cultural: results.compass.cultural,
      },
    });

    await tx.archetypeResult.create({
      data: {
        profileId: newProfile.id,
        primaryArchetypeId: results.archetype.primaryId,
        primaryMatchPct: results.archetype.primaryMatchPct,
        secondaryArchetypeId: results.archetype.secondaryId,
        secondaryMatchPct: results.archetype.secondaryMatchPct,
        isBlended: results.archetype.isBlended,
      },
    });

    return newProfile;
  });

  return NextResponse.json({ profileId: profile.id }, { status: 201 });
}
