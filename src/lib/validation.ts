import { z } from "zod";

export const answerSchema = z.object({
  questionId: z.string(),
  value: z.number().int().min(-2).max(2).nullable(),
  skipped: z.boolean(),
});

export const quizSubmitSchema = z.object({
  answers: z.array(answerSchema).min(1),
  anonymousToken: z.string().uuid().optional(),
});

export const answerUpdateSchema = z.object({
  answers: z.array(answerSchema).min(1),
  anonymousToken: z.string().uuid().optional(),
});

export const annotationSchema = z.object({
  topicScoreId: z.string().uuid(),
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
