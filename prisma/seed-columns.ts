/**
 * The scalar columns each seeded model actually has.
 *
 * The `src/data/*` objects are the source of truth for quiz content, but they
 * are not row shapes: they also carry presentation-only copy the database does
 * not model (`AxisData.divergenceNote`, read straight from `src/data` by the
 * home page's divergence panel). Spreading them into Prisma sends that copy as
 * an unknown argument and fails `prisma db seed` — which only CI's e2e job
 * runs, so every other gate stays green while seeding is broken.
 *
 * Lives in its own module so `tests/unit/seed-axis-columns.test.ts` can import
 * it; `seed.ts` throws at import time without DATABASE_URL.
 */
export const SEED_COLUMNS = {
  Axis: [
    "id", "name", "poleALabel", "poleBLabel",
    "tagline", "domain", "domainOrder", "order",
  ],
  ForcedChoiceItem: [
    "id", "axisId", "itemNumber", "questionType", "abstractionLevel",
    "headlineA", "bodyA", "headlineB", "bodyB",
  ],
  ScaledItem: [
    "id", "axisId", "itemNumber", "questionStem",
    "option1Label", "option1Detail", "option2Label", "option2Detail",
    "option3Label", "option3Detail", "option4Label", "option4Detail",
    "option5Label", "option5Detail",
  ],
  Ministry: ["id", "name", "description", "belowBaselineWarning"],
  MinistryAxisMapping: ["ministryId", "axisId", "direction"],
  Archetype: [
    "id", "name", "summary", "description", "characteristicTension",
    "traditions", "prototype", "displayOrder", "emergence",
  ],
} as const satisfies Record<string, readonly string[]>;

/** Narrows a `src/data` object to the columns its Prisma model declares. */
export function pick<T, K extends keyof T>(
  source: T,
  keys: readonly K[],
): Pick<T, K> {
  return Object.fromEntries(
    keys.map((key) => [key, source[key]]),
  ) as Pick<T, K>;
}
