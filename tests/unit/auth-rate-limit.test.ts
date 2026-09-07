import { describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const postHandler = vi.fn(async () => new Response("ok"));

vi.mock("@/lib/auth", () => ({ handlers: { GET: vi.fn(), POST: postHandler } }));

const { POST } = await import("@/app/api/auth/[...nextauth]/route");

function post(ip: string) {
  return POST(new Request("https://example.com/api/auth/callback/credentials", {
    method: "POST",
    headers: { "x-vercel-forwarded-for": ip },
  }) as unknown as NextRequest);
}

describe("POST /api/auth/[...nextauth]", () => {
  it("throttles repeated credential callback requests from one address", async () => {
    const ip = "203.0.113.56";

    for (let count = 0; count < 10; count += 1) {
      expect((await post(ip)).status).toBe(200);
    }

    const res = await post(ip);
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("900");
  });
});
