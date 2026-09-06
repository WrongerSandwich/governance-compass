import { describe, it, expect } from "vitest";
import type { NextRequest } from "next/server";

import {
  FOREIGN_KEY_VIOLATION,
  RECORD_NOT_FOUND,
  UNIQUE_VIOLATION,
  prismaErrorCode,
  readJsonBody,
} from "@/lib/api-errors";

function requestWith(json: () => Promise<unknown>) {
  return { json } as unknown as NextRequest;
}

describe("readJsonBody", () => {
  it("returns the parsed body for well-formed JSON", async () => {
    const result = await readJsonBody(requestWith(async () => ({ name: "Book club" })));

    expect(result.ok).toBe(true);
    expect(result.ok && result.data).toEqual({ name: "Book club" });
  });

  it("answers malformed JSON with a 400 instead of letting it throw", async () => {
    const result = await readJsonBody(
      requestWith(async () => {
        throw new SyntaxError("Unexpected end of JSON input");
      })
    );

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected a rejected body");
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({ error: "Malformed JSON body" });
  });

  it("treats an empty body as malformed rather than as null", async () => {
    const result = await readJsonBody(
      requestWith(async () => {
        throw new SyntaxError("Unexpected end of JSON input");
      })
    );

    expect(result.ok).toBe(false);
  });
});

describe("prismaErrorCode", () => {
  it("reads the code off a Prisma known-request error", () => {
    const err = Object.assign(new Error("Unique constraint failed"), { code: UNIQUE_VIOLATION });

    expect(prismaErrorCode(err)).toBe(UNIQUE_VIOLATION);
  });

  it("returns null for an error without a Prisma code", () => {
    expect(prismaErrorCode(new Error("network down"))).toBeNull();
  });

  it("returns null for a non-Prisma-shaped code", () => {
    const err = Object.assign(new Error("dns"), { code: "ENOTFOUND" });

    expect(prismaErrorCode(err)).toBeNull();
  });

  it("returns null for values that are not objects", () => {
    expect(prismaErrorCode("P2002")).toBeNull();
    expect(prismaErrorCode(null)).toBeNull();
    expect(prismaErrorCode(undefined)).toBeNull();
  });

  it("exposes the codes the API maps to specific statuses", () => {
    expect([UNIQUE_VIOLATION, FOREIGN_KEY_VIOLATION, RECORD_NOT_FOUND]).toEqual([
      "P2002",
      "P2003",
      "P2025",
    ]);
  });
});
