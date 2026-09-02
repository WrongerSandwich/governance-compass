"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

/** Most personas that can be pinned at once. */
export const MAX_PINS = 4;

/** Fewest pins the compare view needs before it has anything to compare. */
export const MIN_COMPARE_PINS = 2;

/**
 * Parses `?compare=` into an ordered list of at most {@link MAX_PINS} ids.
 *
 * De-duplicates: a hand-edited or double-submitted `?compare=P0001,P0001`
 * would otherwise render two identical panels under duplicate React keys.
 * Duplicates are collapsed before the cap is applied, so they cannot consume
 * a pin slot.
 */
export function parsePinned(compareParam: string | null | undefined): string[] {
  if (!compareParam) return [];

  const ids = new Set<string>();
  for (const raw of compareParam.split(",")) {
    const id = raw.trim();
    if (!id || ids.has(id)) continue;
    ids.add(id);
    if (ids.size === MAX_PINS) break;
  }
  return [...ids];
}

/**
 * Applies a pin toggle to `params`, returning fresh params — or null when the
 * toggle is refused because the pin set is already full.
 *
 * This owns the whole transition, including dropping `compareView` once too
 * few pins remain to compare, so that one toggle is always exactly one
 * navigation. Splitting it across two `router.replace` calls in a single
 * handler is what broke unpinning from a 2-persona compare view: the second
 * call was built from a render-stale `searchParams` snapshot that still held
 * both ids, and it overwrote the first.
 */
export function togglePinInParams(
  params: URLSearchParams,
  id: string
): URLSearchParams | null {
  const current = parsePinned(params.get("compare"));

  let updated: string[];
  if (current.includes(id)) {
    updated = current.filter((pinned) => pinned !== id);
  } else if (current.length < MAX_PINS) {
    updated = [...current, id];
  } else {
    // Already at max — silently refuse
    return null;
  }

  const next = new URLSearchParams(params.toString());
  if (updated.length > 0) {
    next.set("compare", updated.join(","));
  } else {
    next.delete("compare");
  }
  if (updated.length < MIN_COMPARE_PINS) {
    next.delete("compareView");
  }
  return next;
}

/**
 * URL-backed pin set hook.
 *
 * Reads/writes `?compare=P001,P002,...` (up to {@link MAX_PINS} ids).
 * Preserves all other search params on every write.
 */
export function usePinnedPersonas(): {
  pinned: string[];
  togglePin: (id: string) => void;
  isPinned: (id: string) => boolean;
  canPin: boolean;
  clearAll: () => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const compareParam = searchParams.get("compare") ?? "";
  // Memoised so it is referentially stable across renders — isPinned closes
  // over it, and a fresh array every render would defeat that useCallback.
  const pinned = useMemo(() => parsePinned(compareParam), [compareParam]);

  const canPin = pinned.length < MAX_PINS;

  const replaceParams = useCallback(
    (next: URLSearchParams) => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [router, pathname]
  );

  const togglePin = useCallback(
    (id: string) => {
      const next = togglePinInParams(
        new URLSearchParams(searchParams.toString()),
        id
      );
      if (next) replaceParams(next);
    },
    [searchParams, replaceParams]
  );

  const isPinned = useCallback((id: string) => pinned.includes(id), [pinned]);

  const clearAll = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("compare");
    next.delete("compareView");
    replaceParams(next);
  }, [searchParams, replaceParams]);

  return { pinned, togglePin, isPinned, canPin, clearAll };
}
