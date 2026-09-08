import { type NextRequest } from "next/server";
import { handlers } from "@/lib/auth";
import { createRateLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const credentialsLimiter = createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1_000 });

export const GET = handlers.GET;

export async function POST(request: NextRequest) {
  const limit = credentialsLimiter.check(getClientIp(request));
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

  return handlers.POST(request);
}
