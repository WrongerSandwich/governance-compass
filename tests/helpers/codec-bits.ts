/**
 * Bit-level surgery on an encoded response string, standing in for a
 * hand-edited `/results?r=` URL. Shared by the codec unit tests and the
 * materialize e2e spec so both tamper the same way.
 */

export function base64urlToBytes(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function bytesToBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Overwrites the raw 5-bit budget field for `ministry` (1-based). Budget fields
 * start after the version byte, 36 two-bit FC fields, and 24 three-bit SC
 * fields; the stored value is the allocation minus one.
 */
export function setRawBudgetBits(encoded: string, ministry: number, raw: number): string {
  const bytes = base64urlToBytes(encoded);
  const start = 8 + 36 * 2 + 24 * 3 + (ministry - 1) * 5;
  for (let i = 0; i < 5; i++) {
    const pos = start + i;
    const mask = 1 << (7 - (pos % 8));
    bytes[pos >> 3] = (raw >> (4 - i)) & 1 ? bytes[pos >> 3] | mask : bytes[pos >> 3] & ~mask;
  }
  return bytesToBase64url(bytes);
}
