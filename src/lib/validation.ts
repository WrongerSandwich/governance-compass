import { z } from "zod";

export const forcedChoiceResponseSchema = z.object({
  itemId: z.string(),
  selectedPole: z.enum(["A", "B"]),
});

export const scaledResponseSchema = z.object({
  itemId: z.string(),
  value: z.number().int().min(1).max(5),
});

export const budgetAllocationSchema = z.object({
  ministryId: z.number().int().min(1).max(10),
  amount: z.number().int().min(5),
});

export const quizSubmitSchema = z.object({
  forcedChoiceResponses: z.array(forcedChoiceResponseSchema),
  scaledResponses: z.array(scaledResponseSchema),
  budgetAllocations: z.array(budgetAllocationSchema).length(10)
    .refine((a) => a.reduce((sum, x) => sum + x.amount, 0) === 100,
      "Budget must sum to 100"),
  anonymousToken: z.string().uuid().optional(),
});

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

export const claimProfileSchema = z.object({
  anonymousToken: z.string().uuid(),
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100).optional(),
});
