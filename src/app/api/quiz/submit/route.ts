import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quizSubmitSchema } from "@/lib/validation";
import { computeFullResults } from "@/lib/scoring";
import type { QuizResponses } from "@/lib/scoring-types";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = quizSubmitSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { forcedChoiceResponses, scaledResponses, budgetAllocations, anonymousToken } = parsed.data;

  // Verify item IDs exist
  const fcItemIds = forcedChoiceResponses.map(r => r.itemId);
  const fcItems = await db.forcedChoiceItem.findMany({
    where: { id: { in: fcItemIds } },
    select: { id: true },
  });
  if (fcItems.length !== fcItemIds.length) {
    return NextResponse.json({ error: "Invalid forced-choice item IDs" }, { status: 400 });
  }

  const scItemIds = scaledResponses.map(r => r.itemId);
  const scItems = await db.scaledItem.findMany({
    where: { id: { in: scItemIds } },
    select: { id: true },
  });
  if (scItems.length !== scItemIds.length) {
    return NextResponse.json({ error: "Invalid scaled item IDs" }, { status: 400 });
  }

  const ministryIds = budgetAllocations.map(a => a.ministryId);
  const ministries = await db.ministry.findMany({
    where: { id: { in: ministryIds } },
    select: { id: true },
  });
  if (ministries.length !== ministryIds.length) {
    return NextResponse.json({ error: "Invalid ministry IDs" }, { status: 400 });
  }

  // Build QuizResponses for scoring
  const quizResponses: QuizResponses = {
    forcedChoice: Object.fromEntries(
      forcedChoiceResponses.map(r => [r.itemId, r.selectedPole])
    ),
    scaled: Object.fromEntries(
      scaledResponses.map(r => [r.itemId, r.value])
    ),
    budget: Object.fromEntries(
      budgetAllocations.map(a => [a.ministryId, a.amount])
    ),
  };

  const results = computeFullResults(quizResponses);

  // Create everything in a transaction
  const profile = await db.$transaction(async (tx) => {
    const newProfile = await tx.userProfile.create({
      data: {
        anonymousToken: crypto.randomUUID(),
      },
    });

    // Create responses
    await tx.forcedChoiceResponse.createMany({
      data: forcedChoiceResponses.map(r => ({
        profileId: newProfile.id,
        itemId: r.itemId,
        selectedPole: r.selectedPole,
      })),
    });

    await tx.scaledResponse.createMany({
      data: scaledResponses.map(r => ({
        profileId: newProfile.id,
        itemId: r.itemId,
        value: r.value,
      })),
    });

    await tx.budgetAllocation.createMany({
      data: budgetAllocations.map(a => ({
        profileId: newProfile.id,
        ministryId: a.ministryId,
        amount: a.amount,
      })),
    });

    // Create computed scores
    await tx.axisScore.createMany({
      data: results.axisScores.map(s => ({
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

  return NextResponse.json(
    { profileId: profile.id, anonymousToken: profile.anonymousToken },
    { status: 201 }
  );
}
