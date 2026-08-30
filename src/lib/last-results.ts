"use client";

import { useStorageValue, writeStorage } from "@/lib/client-storage";

/**
 * localStorage key holding the visitor's most recent results — either the raw
 * encoded response string, or `id:<profileId>` once the profile has been
 * materialized into the database.
 */
export const LAST_RESULTS_KEY = "lastResults";

/** The stored value, or null before hydration and when nothing is stored. */
export function useLastResults(): string | null {
  return useStorageValue("local", LAST_RESULTS_KEY);
}

/** Write the key so every `useLastResults` caller in this tab re-renders. */
export function saveLastResults(value: string): void {
  writeStorage("local", LAST_RESULTS_KEY, value);
}

/** The `/results` URL for a stored value, or null when nothing is stored. */
export function lastResultsHref(stored: string | null): string | null {
  if (!stored) return null;
  if (stored.startsWith("id:")) return `/results/${stored.slice(3)}`;
  return `/results?r=${stored}`;
}

/** The materialized profile id in a stored value, if it has one. */
export function lastResultsProfileId(stored: string | null): string | null {
  return stored?.startsWith("id:") ? stored.slice(3) : null;
}

/** True when results exist locally but have not been saved to an account. */
export function hasUnsavedResults(stored: string | null): boolean {
  return !!stored && !stored.startsWith("id:");
}
