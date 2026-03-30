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
  ministryId: z.number().int().min(1).max(7),
  amount: z.number().int().min(1).max(25),
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

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100).optional(),
});
