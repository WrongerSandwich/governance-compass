import { describe, it, expect } from "vitest";
import { encodeResponses, decodeResponses } from "@/lib/response-codec";
import type { QuizResponses } from "@/lib/scoring-types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a complete response set with all 36 FC, 36 SC, and 10 budget items. */
function buildCompleteResponses(): QuizResponses {
  const forcedChoice: Record<string, "A" | "B"> = {};
  const scaled: Record<string, 1 | 2 | 3 | 4 | 5> = {};
  const budget: Record<number, number> = {};

  for (let axis = 1; axis <= 12; axis++) {
    for (let item = 1; item <= 3; item++) {
      forcedChoice[`fc-${axis}-${item}`] = item % 2 === 0 ? "A" : "B";
      scaled[`sc-${axis}-${item}`] = ((item % 5) + 1) as 1 | 2 | 3 | 4 | 5;
    }
  }

  for (let m = 1; m <= 10; m++) {
    budget[m] = 10; // baseline
  }

  return { forcedChoice, scaled, budget };
}

// ---------------------------------------------------------------------------
// Roundtrip
// ---------------------------------------------------------------------------

describe("response-codec", () => {
  it("roundtrips a complete response set", () => {
    const original = buildCompleteResponses();
    const encoded = encodeResponses(original);
    const decoded = decodeResponses(encoded);

    expect(decoded.forcedChoice).toEqual(original.forcedChoice);
    expect(decoded.scaled).toEqual(original.scaled);
    expect(decoded.budget).toEqual(original.budget);
  });

  // -------------------------------------------------------------------------
  // URL-safety and compactness
  // -------------------------------------------------------------------------

  it("produces a URL-safe string under 50 characters", () => {
    const original = buildCompleteResponses();
    const encoded = encodeResponses(original);

    // base64url charset: A-Za-z0-9_-
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encoded.length).toBeLessThanOrEqual(50);
  });

  // -------------------------------------------------------------------------
  // Skip handling
  // -------------------------------------------------------------------------

  it("encodes skipped FC items (missing from record -> skip -> missing on decode)", () => {
    const responses = buildCompleteResponses();
    // Remove some FC items
    delete responses.forcedChoice["fc-3-2"];
    delete responses.forcedChoice["fc-7-1"];
    delete responses.forcedChoice["fc-12-3"];

    const encoded = encodeResponses(responses);
    const decoded = decodeResponses(encoded);

    // Skipped items should not appear in the decoded record
    expect(decoded.forcedChoice).not.toHaveProperty("fc-3-2");
    expect(decoded.forcedChoice).not.toHaveProperty("fc-7-1");
    expect(decoded.forcedChoice).not.toHaveProperty("fc-12-3");

    // Non-skipped items should still be present
    expect(decoded.forcedChoice["fc-1-1"]).toBe(responses.forcedChoice["fc-1-1"]);
  });

  it("encodes skipped SC items (missing from record -> skip -> missing on decode)", () => {
    const responses = buildCompleteResponses();
    // Remove some SC items
    delete responses.scaled["sc-2-1"];
    delete responses.scaled["sc-9-3"];

    const encoded = encodeResponses(responses);
    const decoded = decodeResponses(encoded);

    expect(decoded.scaled).not.toHaveProperty("sc-2-1");
    expect(decoded.scaled).not.toHaveProperty("sc-9-3");

    // Non-skipped items should still be present
    expect(decoded.scaled["sc-1-1"]).toBe(responses.scaled["sc-1-1"]);
  });

  // -------------------------------------------------------------------------
  // Budget boundary values
  // -------------------------------------------------------------------------

  it("preserves budget values at boundaries (5 min, up to 50+)", () => {
    const responses = buildCompleteResponses();
    responses.budget[1] = 5;   // minimum
    responses.budget[2] = 95;  // maximum
    responses.budget[3] = 50;  // mid-range
    responses.budget[4] = 6;   // near minimum
    responses.budget[5] = 94;  // near maximum

    const encoded = encodeResponses(responses);
    const decoded = decodeResponses(encoded);

    expect(decoded.budget[1]).toBe(5);
    expect(decoded.budget[2]).toBe(95);
    expect(decoded.budget[3]).toBe(50);
    expect(decoded.budget[4]).toBe(6);
    expect(decoded.budget[5]).toBe(94);
  });

  // -------------------------------------------------------------------------
  // Determinism
  // -------------------------------------------------------------------------

  it("is deterministic: same input always produces same output", () => {
    const responses = buildCompleteResponses();
    const encoded1 = encodeResponses(responses);
    const encoded2 = encodeResponses(responses);
    const encoded3 = encodeResponses(responses);

    expect(encoded1).toBe(encoded2);
    expect(encoded2).toBe(encoded3);
  });

  // -------------------------------------------------------------------------
  // Error cases
  // -------------------------------------------------------------------------

  it("rejects empty strings", () => {
    expect(() => decodeResponses("")).toThrow();
  });

  it("rejects invalid base64url", () => {
    expect(() => decodeResponses("not!valid@base64")).toThrow();
  });

  it("rejects unknown version byte", () => {
    // Encode a valid response, then corrupt the version byte
    const responses = buildCompleteResponses();
    const encoded = encodeResponses(responses);

    // Decode from base64url, change version byte, re-encode
    const raw = base64urlToBytes(encoded);
    raw[0] = 0xff; // unknown version
    const corrupted = bytesToBase64url(raw);

    expect(() => decodeResponses(corrupted)).toThrow(/version/i);
  });
});

// ---------------------------------------------------------------------------
// Utility for the version byte test
// ---------------------------------------------------------------------------

function base64urlToBytes(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
