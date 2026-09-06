import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { readJsonBody } from "@/lib/api-errors";
import { MAX_PROFILES_PER_USER } from "@/lib/profile-limits";
import { decodeResponses } from "@/lib/response-codec";
import { computeFullResults } from "@/lib/scoring";
import { toProfileRows } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const encoded = (body.data as { encoded?: unknown } | null)?.encoded;

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

  // Defence in depth: the decoder already enforces the quiz contract, but
  // nothing in Postgres does, and a bad row here skews persisted scores for
  // good. Rejecting beats storing something no quiz run could produce.
  let rows;
  try {
    rows = toProfileRows(responses);
  } catch {
    return NextResponse.json({ error: "Responses failed validation" }, { status: 400 });
  }

  const existingProfiles = await db.userProfile.count({
    where: { userId: session.user.id },
  });
  if (existingProfiles >= MAX_PROFILES_PER_USER) {
    return NextResponse.json(
      { error: `Profile limit reached (${MAX_PROFILES_PER_USER} per account)` },
      { status: 429 }
    );
  }

  const results = computeFullResults(responses);

  const profile = await db.$transaction(async (tx) => {
    const newProfile = await tx.userProfile.create({
      data: { userId: session.user!.id },
    });

    // FC responses
    if (rows.forcedChoice.length > 0) {
      await tx.forcedChoiceResponse.createMany({
        data: rows.forcedChoice.map((row) => ({ profileId: newProfile.id, ...row })),
      });
    }

    // SC responses
    if (rows.scaled.length > 0) {
      await tx.scaledResponse.createMany({
        data: rows.scaled.map((row) => ({ profileId: newProfile.id, ...row })),
      });
    }

    // Budget allocations
    await tx.budgetAllocation.createMany({
      data: rows.budget.map((row) => ({ profileId: newProfile.id, ...row })),
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
