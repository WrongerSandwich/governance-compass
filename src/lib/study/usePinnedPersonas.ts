"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

/**
 * URL-backed pin set hook.
 *
 * Reads/writes `?compare=P001,P002,...` (up to 4 IDs).
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
  const pinned = compareParam
    ? compareParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 4)
    : [];

  const canPin = pinned.length < 4;

  const togglePin = useCallback(
    (id: string) => {
      const currentCompare = searchParams.get("compare") ?? "";
      const current = currentCompare
        ? currentCompare
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 4)
        : [];

      let updated: string[];
      if (current.includes(id)) {
        updated = current.filter((p) => p !== id);
      } else if (current.length < 4) {
        updated = [...current, id];
      } else {
        // Already at max — silently refuse
        return;
      }
      const next = new URLSearchParams(searchParams.toString());
      if (updated.length > 0) {
        next.set("compare", updated.join(","));
      } else {
        next.delete("compare");
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const isPinned = useCallback(
    (id: string) => pinned.includes(id),
    [pinned]
  );

  const clearAll = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("compare");
    next.delete("compareView");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  return { pinned, togglePin, isPinned, canPin, clearAll };
}
