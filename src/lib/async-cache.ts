/**
 * Memoize an async loader.
 *
 * Concurrent callers share a single in-flight load, and — the point of the
 * helper — a rejected load is *not* remembered. Caching the rejected promise
 * turns one transient failure (EMFILE, a disk hiccup mid-deploy) into a
 * permanent outage, because every later caller re-awaits the same rejection
 * until the process restarts.
 */
export function createAsyncCache<T>(load: () => Promise<T>): () => Promise<T> {
  let value: T;
  let loaded = false;
  let pending: Promise<T> | null = null;

  return async function get(): Promise<T> {
    if (loaded) return value;

    if (!pending) {
      pending = load().catch((err) => {
        pending = null;
        throw err;
      });
    }

    const resolved = await pending;
    value = resolved;
    loaded = true;
    pending = null;
    return resolved;
  };
}
