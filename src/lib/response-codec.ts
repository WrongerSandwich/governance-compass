/**
 * Response Codec — packs 67 quiz response values into a compact, URL-safe string.
 *
 * Layout v3 (187 bits = 24 bytes → ~32 chars base64url):
 *   - 1 byte version prefix (0x03)
 *   - 36 FC responses: 2 bits each (00=skip, 01=A, 10=B)
 *   - 24 SC responses: 3 bits each (000=skip, 001–101 = values 1–5)
 *   - 7 budget allocations: 5 bits each (unsigned, offset -1, so 1→0, 25→24)
 *
 * Items are encoded in axis order (axis 1–12, items 1–3 per axis).
 * Budget allocations are encoded in ministry ID order (1–7).
 *
 * Design notes:
 * - Budget 5-bit range supports values 1–32, but only 1–25 is in contract
 *   (50 total, 7 ministries, 1 minimum). Both directions enforce that range
 *   and the 50-point total, so a hand-edited `?r=` URL claiming impossible
 *   allocations hits the results error UI instead of rendering as fact.
 * - FC bit pattern 0b11 and SC bit patterns 6–7 are unused by the encoder.
 *   On decode they are treated as skips. This is intentional — these patterns
 *   can only appear in hand-crafted or corrupted URLs, and treating them as
 *   skips is the safest graceful degradation.
 */

import type { QuizResponses } from "./scoring-types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VERSION = 0x03;
const AXIS_COUNT = 12;
const FC_ITEMS_PER_AXIS = 3;
const MINISTRY_COUNT = 7;
const BUDGET_OFFSET = 1; // min allocation is 1, so offset by -1
const BUDGET_BITS = 5; // 5 bits = 0-31, range 1-25 maps to 0-24
const BUDGET_MIN = 1;
const BUDGET_MAX = 25;
const BUDGET_TOTAL = 50; // points the simulator hands out across all ministries

/** Exact payload size: version byte + 36×2 + 24×3 + 7×5 bits, rounded up. */
const PAYLOAD_BYTES = Math.ceil(
  (8 + AXIS_COUNT * FC_ITEMS_PER_AXIS * 2 + 24 * 3 + MINISTRY_COUNT * BUDGET_BITS) / 8
);

/**
 * Rejects allocations the budget simulator could never produce. Shared by both
 * directions so anything `encodeResponses` emits `decodeResponses` accepts.
 */
function assertBudgetInContract(budget: Record<number, number>, source: "encodable" | "decoded"): void {
  let total = 0;
  for (let m = 1; m <= MINISTRY_COUNT; m++) {
    const val = budget[m];
    if (val < BUDGET_MIN || val > BUDGET_MAX) {
      const range = source === "encodable" ? "encodable range" : "range";
      throw new Error(
        `Budget value ${val} for ministry ${m} is out of ${range} [${BUDGET_MIN}, ${BUDGET_MAX}]`
      );
    }
    total += val;
  }
  if (total > BUDGET_TOTAL) {
    throw new Error(`Budget allocations total ${total}, above the ${BUDGET_TOTAL}-point budget`);
  }
}

// SC item IDs in canonical encoding order (2 per axis after reduction)
const SC_ITEM_IDS = [
  "sc-1-1", "sc-1-3",
  "sc-2-1", "sc-2-2",
  "sc-3-1", "sc-3-3",
  "sc-4-1", "sc-4-2",
  "sc-5-1", "sc-5-2",
  "sc-6-1", "sc-6-3",
  "sc-7-1", "sc-7-2",
  "sc-8-1", "sc-8-2",
  "sc-9-1", "sc-9-2",
  "sc-10-1", "sc-10-2",
  "sc-11-2", "sc-11-3",
  "sc-12-1", "sc-12-3",
];

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

  // 36 FC responses (2 bits each) — 3 per axis, items 1-3
  for (let axis = 1; axis <= AXIS_COUNT; axis++) {
    for (let item = 1; item <= FC_ITEMS_PER_AXIS; item++) {
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

  // 24 SC responses (3 bits each) — specific items per SC_ITEM_IDS
  for (const key of SC_ITEM_IDS) {
    const val = responses.scaled[key];
    if (val != null && val >= 1 && val <= 5) {
      writer.writeBits(val, 3);
    } else {
      writer.writeBits(0b000, 3); // skip
    }
  }

  // 7 budget allocations (5 bits each)
  const budget: Record<number, number> = {};
  for (let m = 1; m <= MINISTRY_COUNT; m++) {
    budget[m] = responses.budget[m] ?? BUDGET_MIN;
  }
  assertBudgetInContract(budget, "encodable");
  for (let m = 1; m <= MINISTRY_COUNT; m++) {
    writer.writeBits(budget[m] - BUDGET_OFFSET, BUDGET_BITS);
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
  if (bytes.length !== PAYLOAD_BYTES) {
    throw new Error(`Invalid payload length: ${bytes.length} bytes. Expected ${PAYLOAD_BYTES}`);
  }
  const reader = new BitReader(bytes);

  // Version byte
  const version = reader.readBits(8);
  if (version !== VERSION) {
    throw new Error(`Unknown version: ${version}. Expected ${VERSION}`);
  }

  // 36 FC responses
  const forcedChoice: Record<string, "A" | "B"> = {};
  for (let axis = 1; axis <= AXIS_COUNT; axis++) {
    for (let item = 1; item <= FC_ITEMS_PER_AXIS; item++) {
      const bits = reader.readBits(2);
      const key = `fc-${axis}-${item}`;
      if (bits === 0b01) {
        forcedChoice[key] = "A";
      } else if (bits === 0b10) {
        forcedChoice[key] = "B";
      }
    }
  }

  // 24 SC responses
  const scaled: Record<string, 1 | 2 | 3 | 4 | 5> = {};
  for (const key of SC_ITEM_IDS) {
    const bits = reader.readBits(3);
    if (bits >= 1 && bits <= 5) {
      scaled[key] = bits as 1 | 2 | 3 | 4 | 5;
    }
  }

  // 7 budget allocations. Unlike the FC/SC fields, an out-of-contract budget
  // cannot degrade to a skip — a bogus allocation would silently skew bgScore —
  // so it is rejected outright.
  const budget: Record<number, number> = {};
  for (let m = 1; m <= MINISTRY_COUNT; m++) {
    const bits = reader.readBits(BUDGET_BITS);
    budget[m] = bits + BUDGET_OFFSET;
  }
  assertBudgetInContract(budget, "decoded");

  return { forcedChoice, scaled, budget };
}
