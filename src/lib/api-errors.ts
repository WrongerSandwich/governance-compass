import { NextResponse } from "next/server";

/**
 * Prisma known-request-error codes this app maps to a specific HTTP status.
 * Left unmapped they surface as unhandled throws, i.e. a 500 for something the
 * caller did wrong (a stale member id, an axis that does not exist).
 */
export const UNIQUE_VIOLATION = "P2002";
export const FOREIGN_KEY_VIOLATION = "P2003";
export const RECORD_NOT_FOUND = "P2025";

/**
 * Returns the Prisma error code for a caught value, or null if it did not come
 * from Prisma. Matching on shape rather than `instanceof` keeps route handlers
 * off the Prisma runtime error classes, which move between client versions.
 */
export function prismaErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  const code = (error as { code?: unknown }).code;
  if (typeof code !== "string" || !/^P\d{4}$/.test(code)) return null;
  return code;
}

type JsonBody =
  | { ok: true; data: unknown }
  | { ok: false; response: NextResponse };

/**
 * Reads a request body as JSON. A bare `await request.json()` throws on
 * malformed or empty input, which Next.js renders as a 500 — the caller sent
 * bad data, so it should read as a 400.
 */
export async function readJsonBody(
  request: Pick<Request, "json">
): Promise<JsonBody> {
  try {
    return { ok: true, data: (await request.json()) as unknown };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Malformed JSON body" }, { status: 400 }),
    };
  }
}
