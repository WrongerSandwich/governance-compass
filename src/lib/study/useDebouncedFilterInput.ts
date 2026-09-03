"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Buffers a URL-backed text input locally and commits it once typing settles.
 *
 * Filter state lives in the URL, but binding an input straight to it commits a
 * navigation per keystroke — one history entry per character, and a controlled
 * value that round-trips through async navigation while the user is still
 * typing. This keeps the keystrokes local, commits once, and still yields to
 * the URL when it changes on its own (Back/forward, "Clear all", a chip ×).
 *
 * @param urlValue current value from the URL — the source of truth
 * @param commit   called with the settled value; should navigate with `replace`
 * @param delayMs  quiet period before committing
 */
export function useDebouncedFilterInput(
  urlValue: string,
  commit: (value: string) => void,
  delayMs = 300
): [string, (next: string) => void] {
  const [draft, setDraft] = useState(urlValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The value we last handed to `commit`, so our own commit landing in the URL
  // is not mistaken for an external change.
  const committedRef = useRef(urlValue);
  const commitRef = useRef(commit);
  // Kept current so a queued commit runs against the latest filter state
  // rather than the snapshot from the keystroke that scheduled it.
  useEffect(() => {
    commitRef.current = commit;
  });

  useEffect(() => {
    if (urlValue === committedRef.current) return;
    // The URL moved without us: abandon any queued commit and adopt it.
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    committedRef.current = urlValue;
    setDraft(urlValue);
  }, [urlValue]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const onChange = useCallback(
    (next: string) => {
      setDraft(next);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        committedRef.current = next;
        commitRef.current(next);
      }, delayMs);
    },
    [delayMs]
  );

  return [draft, onChange];
}
