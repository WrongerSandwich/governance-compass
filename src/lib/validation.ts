import { z } from "zod";

import type { QuizResponses } from "./scoring-types";

export const forcedChoiceResponseSchema = z.object({
  itemId: z.string(),
  selectedPole: z.enum(["A", "B"]),
});

export const scaledResponseSchema = z.object({
  itemId: z.string(),
  value: z.number().int().min(1).max(5),
});

export const budgetAllocationSchema = z.object({
  ministryId: z.number().int().min(1).max(7),
  amount: z.number().int().min(1).max(25),
});

/**
 * Turns decoded quiz responses into the rows `POST /api/profile/materialize`
 * inserts, validating each against the schemas above. Nothing in Postgres
 * constrains these columns, so this is the only thing standing between a
 * hand-crafted `encoded` payload and permanently skewed persisted scores.
 *
 * Throws `ZodError` on the first row that breaks contract.
 */
export function toProfileRows(responses: QuizResponses) {
  return {
    forcedChoice: Object.entries(responses.forcedChoice).map(([itemId, selectedPole]) =>
      forcedChoiceResponseSchema.parse({ itemId, selectedPole })
    ),
    scaled: Object.entries(responses.scaled).map(([itemId, value]) =>
      scaledResponseSchema.parse({ itemId, value })
    ),
    budget: Object.entries(responses.budget).map(([ministryId, amount]) =>
      budgetAllocationSchema.parse({ ministryId: Number(ministryId), amount })
    ),
  };
}

export const annotationSchema = z.object({
  axisScoreId: z.string().uuid(),
  text: z.string().min(1).max(5000),
});

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
});

export const joinGroupSchema = z.object({
  inviteCode: z.string().min(1),
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100).optional(),
});
