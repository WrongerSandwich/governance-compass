"use client";

import { useCallback, useSyncExternalStore } from "react";

export type StorageArea = "local" | "session";

/**
 * Web Storage as a `useSyncExternalStore` source.
 *
 * Reading storage in an effect and calling `setState` with the result renders
 * once with the wrong value and then immediately again with the right one —
 * the cascading render `react-hooks/set-state-in-effect` warns about. Reading
 * it through a store instead gives React the value it needs during render.
 *
 * The browser's `storage` event only fires in *other* tabs, so a write from
 * this tab has to announce itself: that is what `writeStorage` and
 * `removeStorage` are for. A key read with `useStorageValue` but written with
 * a bare `setItem` will not re-render its readers.
 */
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function area(which: StorageArea): Storage {
  return which === "local" ? window.localStorage : window.sessionStorage;
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function readStorage(which: StorageArea, key: string): string | null {
  try {
    return area(which).getItem(key);
  } catch {
    // Storage disabled (private mode, blocked cookies) — treat as absent.
    return null;
  }
}

export function writeStorage(
  which: StorageArea,
  key: string,
  value: string
): void {
  try {
    area(which).setItem(key, value);
  } catch {
    // Storage full or unavailable. Callers all have a fallback path.
  }
  emit();
}

export function removeStorage(which: StorageArea, key: string): void {
  try {
    area(which).removeItem(key);
  } catch {
    // Nothing to do — the key is already unreadable.
  }
  emit();
}

/**
 * Read one storage key as React state.
 *
 * The server snapshot is always `null`, so the server HTML and the hydration
 * render agree and React re-renders with the stored value straight after
 * hydration. First paint therefore looks exactly like it did under the old
 * read-in-an-effect pattern — no storage-dependent markup on the server —
 * but without the extra render pass, and without a hydration mismatch on the
 * quiz-resume and results-link paths that depend on it.
 */
export function useStorageValue(
  which: StorageArea,
  key: string
): string | null {
  const getSnapshot = useCallback(() => readStorage(which, key), [which, key]);
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
