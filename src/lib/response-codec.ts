/**
 * Response Codec — packs 82 quiz response values into a compact, URL-safe string.
 *
 * Layout (258 bits = 33 bytes → ~44 chars base64url):
 *   - 1 byte version prefix (0x01)
 *   - 36 FC responses: 2 bits each (00=skip, 01=A, 10=B)
 *   - 36 SC responses: 3 bits each (000=skip, 001–101 = values 1–5)
 *   - 10 budget allocations: 7 bits each (unsigned, offset -5, so 5→0, 95→90)
 *
 * Items are encoded in axis order (axis 1–12, items 1–3 per axis).
 * Budget allocations are encoded in ministry ID order (1–10).
 *
 * Design notes:
 * - Budget 7-bit range supports values 5–132. The UI constrains to 5–55
 *   (100 total, 10 ministries, 5 minimum). The extra headroom is harmless —
 *   the scoring engine processes whatever values it receives.
 * - FC bit pattern 0b11 and SC bit patterns 6–7 are unused by the encoder.
 *   On decode they are treated as skips. This is intentional — these patterns
 *   can only appear in hand-crafted or corrupted URLs, and treating them as
 *   skips is the safest graceful degradation.
 */

import type { QuizResponses } from "./scoring-types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VERSION = 0x01;
const AXIS_COUNT = 12;
const ITEMS_PER_AXIS = 3;
const MINISTRY_COUNT = 10;
const BUDGET_OFFSET = 5;

// ---------------------------------------------------------------------------
// BitWriter / BitReader
// ---------------------------------------------------------------------------

class BitWriter {
  private buffer: number[] = [];
  private currentByte = 0;
  private bitPos = 0; // bits written into currentByte (0–7)

  writeBits(value: number, count: number): void {
    for (let i = count - 1; i >= 0; i--) {
      const bit = (value >> i) & 1;
      this.currentByte = (this.currentByte << 1) | bit;
      this.bitPos++;
      if (this.bitPos === 8) {
        this.buffer.push(this.currentByte);
        this.currentByte = 0;
        this.bitPos = 0;
      }
    }
  }

  toBytes(): Uint8Array {
    const bytes = [...this.buffer];
    if (this.bitPos > 0) {
      // Pad remaining bits with zeros on the right
      bytes.push(this.currentByte << (8 - this.bitPos));
    }
    return new Uint8Array(bytes);
  }
}

class BitReader {
  private bytes: Uint8Array;
  private bytePos = 0;
  private bitPos = 0; // next bit to read within current byte (0–7)

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  readBits(count: number): number {
    let value = 0;
    for (let i = 0; i < count; i++) {
      if (this.bytePos >= this.bytes.length) {
        throw new Error("Unexpected end of data");
      }
      const bit = (this.bytes[this.bytePos] >> (7 - this.bitPos)) & 1;
      value = (value << 1) | bit;
      this.bitPos++;
      if (this.bitPos === 8) {
        this.bitPos = 0;
        this.bytePos++;
      }
    }
    return value;
  }
}

// ---------------------------------------------------------------------------
// Base64url helpers
// ---------------------------------------------------------------------------

function bytesToBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

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

// ---------------------------------------------------------------------------
// Encode
// ---------------------------------------------------------------------------

export function encodeResponses(responses: QuizResponses): string {
  const writer = new BitWriter();

  // Version byte (8 bits)
  writer.writeBits(VERSION, 8);

  // 36 FC responses (2 bits each)
  for (let axis = 1; axis <= AXIS_COUNT; axis++) {
    for (let item = 1; item <= ITEMS_PER_AXIS; item++) {
      const key = `fc-${axis}-${item}`;
      const val = responses.forcedChoice[key];
      if (val === "A") {
        writer.writeBits(0b01, 2);
      } else if (val === "B") {
        writer.writeBits(0b10, 2);
      } else {
        writer.writeBits(0b00, 2); // skip
      }
    }
  }

  // 36 SC responses (3 bits each)
  for (let axis = 1; axis <= AXIS_COUNT; axis++) {
    for (let item = 1; item <= ITEMS_PER_AXIS; item++) {
      const key = `sc-${axis}-${item}`;
      const val = responses.scaled[key];
      if (val != null && val >= 1 && val <= 5) {
        writer.writeBits(val, 3); // 001–101
      } else {
        writer.writeBits(0b000, 3); // skip
      }
    }
  }

  // 10 budget allocations (7 bits each)
  for (let m = 1; m <= MINISTRY_COUNT; m++) {
    const val = responses.budget[m] ?? 10; // default to baseline if missing
    if (val < 5 || val > 132) {
      throw new Error(`Budget value ${val} for ministry ${m} is out of encodable range [5, 132]`);
    }
    const encoded = val - BUDGET_OFFSET; // offset so 5→0, 95→90
    writer.writeBits(encoded & 0x7f, 7);
  }

  return bytesToBase64url(writer.toBytes());
}

// ---------------------------------------------------------------------------
// Decode
// ---------------------------------------------------------------------------

export function decodeResponses(encoded: string): QuizResponses {
  if (!encoded || encoded.length === 0) {
    throw new Error("Cannot decode empty string");
  }

  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) {
    throw new Error("Invalid base64url encoding");
  }

  const bytes = base64urlToBytes(encoded);
  const reader = new BitReader(bytes);

  // Version byte
  const version = reader.readBits(8);
  if (version !== VERSION) {
    throw new Error(`Unknown version: ${version}. Expected ${VERSION}`);
  }

  // 36 FC responses
  const forcedChoice: Record<string, "A" | "B"> = {};
  for (let axis = 1; axis <= AXIS_COUNT; axis++) {
    for (let item = 1; item <= ITEMS_PER_AXIS; item++) {
      const bits = reader.readBits(2);
      const key = `fc-${axis}-${item}`;
      if (bits === 0b01) {
        forcedChoice[key] = "A";
      } else if (bits === 0b10) {
        forcedChoice[key] = "B";
      }
      // 00 = skip — omit from record
    }
  }

  // 36 SC responses
  const scaled: Record<string, 1 | 2 | 3 | 4 | 5> = {};
  for (let axis = 1; axis <= AXIS_COUNT; axis++) {
    for (let item = 1; item <= ITEMS_PER_AXIS; item++) {
      const bits = reader.readBits(3);
      const key = `sc-${axis}-${item}`;
      if (bits >= 1 && bits <= 5) {
        scaled[key] = bits as 1 | 2 | 3 | 4 | 5;
      }
      // 000 = skip — omit from record
    }
  }

  // 10 budget allocations
  const budget: Record<number, number> = {};
  for (let m = 1; m <= MINISTRY_COUNT; m++) {
    const bits = reader.readBits(7);
    budget[m] = bits + BUDGET_OFFSET;
  }

  return { forcedChoice, scaled, budget };
}
