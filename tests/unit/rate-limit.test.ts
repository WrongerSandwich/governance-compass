import { describe, expect, it } from "vitest";

import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  it("rejects the request that exceeds an identifier's window quota", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000, now: () => 10_000 });

    expect(limiter.check("203.0.113.5")).toEqual({ allowed: true });
    expect(limiter.check("203.0.113.5")).toEqual({ allowed: true });
    expect(limiter.check("203.0.113.5")).toEqual({ allowed: false, retryAfterSeconds: 60 });
  });

  it("keeps quotas independent for different identifiers", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, now: () => 10_000 });

    expect(limiter.check("203.0.113.5")).toEqual({ allowed: true });
    expect(limiter.check("203.0.113.6")).toEqual({ allowed: true });
  });

  it("admits requests after the fixed window expires", () => {
    let time = 10_000;
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, now: () => time });

    expect(limiter.check("203.0.113.5")).toEqual({ allowed: true });
    time += 60_000;
    expect(limiter.check("203.0.113.5")).toEqual({ allowed: true });
  });
});

describe("getClientIp", () => {
  it("uses the first address forwarded by the trusted proxy", () => {
    const request = new Request("https://example.com/api/auth/signup", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });

    expect(getClientIp(request)).toBe("203.0.113.5");
  });

  it("falls back to a shared key when no client address is available", () => {
    expect(getClientIp(new Request("https://example.com/api/auth/signup"))).toBe("unknown");
  });
});
