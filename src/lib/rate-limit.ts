type Clock = () => number;

type RateLimitOptions = {
  limit: number;
  windowMs: number;
  now?: Clock;
};

type Window = {
  count: number;
  resetAt: number;
};

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

/**
 * Keeps a fixed-window quota per process. Production deployments should use a
 * shared rate-limit store when they run more than one application instance.
 */
export function createRateLimiter({ limit, windowMs, now = Date.now }: RateLimitOptions) {
  const windows = new Map<string, Window>();

  return {
    check(identifier: string): RateLimitResult {
      const timestamp = now();
      const current = windows.get(identifier);

      if (!current || timestamp >= current.resetAt) {
        windows.set(identifier, { count: 1, resetAt: timestamp + windowMs });
        return { allowed: true };
      }

      if (current.count >= limit) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - timestamp) / 1_000)),
        };
      }

      current.count += 1;
      return { allowed: true };
    },
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers?.get("x-forwarded-for");
  if (forwarded) {
    const client = forwarded.split(",", 1)[0]?.trim();
    if (client) return client;
  }

  return request.headers?.get("x-real-ip")?.trim() || "unknown";
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return Response.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}
