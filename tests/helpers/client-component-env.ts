/**
 * The two browser-shaped things a Next client component needs before it will
 * mount under jsdom, and which jsdom does not supply.
 *
 * Extracted from tests/unit/results-chrome.test.ts, where they were worked out
 * the hard way. Both are the kind of thing the next suite to mount a client
 * component would otherwise rediscover from scratch, and both pin something
 * upgrade-fragile — a private `next/dist` path and an opaque router field —
 * which is better held in one place than copied.
 */
import { createRequire } from "node:module";
import type { Context } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * The app-router context object, loaded the way `next/navigation` loads it.
 *
 * **Not** a plain `import`. `next/navigation` is a bare CJS specifier, which
 * vitest externalises to Node's own require cache rather than pulling into its
 * module graph. The context `useRouter` reads therefore lives in that cache,
 * and an ESM `import` of the very same path resolves to a SECOND context
 * instance whose Provider publishes to nothing: the mount still throws
 * "invariant expected app router to be mounted", with a provider plainly
 * visible in the tree. Verified by probe against both the CJS and the ESM
 * builds and both extension spellings — all four are distinct instances from
 * the one `useRouter` closes over. `import type` above is erased, so it does
 * not reintroduce the second copy.
 *
 * UPGRADE NOTE: `next/dist/shared/lib/app-router-context.shared-runtime` is a
 * private path. If a Next upgrade moves it, every suite that mounts a
 * router-using client component fails here, in one place, with the invariant
 * above.
 */
export const AppRouterContext = (
  createRequire(import.meta.url)(
    "next/dist/shared/lib/app-router-context.shared-runtime",
  ) as { AppRouterContext: Context<AppRouterInstance | null> }
).AppRouterContext;

/**
 * The smallest object `useRouter` will accept: it throws on a null context and
 * otherwise only reads these fields. Every method is a no-op — a suite that
 * wants to assert on navigation should pass its own spy instead.
 *
 * `bfcacheId` is opaque to callers and merely has to be a string; the `_b_N_`
 * shape mirrors what Next itself materialises.
 */
export const ROUTER_STUB: AppRouterInstance = {
  back: () => {},
  forward: () => {},
  refresh: () => {},
  push: () => {},
  replace: () => {},
  prefetch: () => {},
  bfcacheId: "_b_0_",
};

/** A no-op `IntersectionObserver`, which jsdom does not implement at all. */
class NoopIntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds: readonly number[] = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

/**
 * Installs the no-op observer on `globalThis`.
 *
 * Every reveal wrapper in this repo — `FadeInSection`, `CountUp`,
 * `StaggeredList` — constructs one on mount, and an unhandled `ReferenceError`
 * there fails the whole render, not just the animation. A no-op leaves the
 * children mounted and merely never flips the wrapper to `opacity: 1`, which
 * no assertion in this repo reads.
 *
 * A plain assignment rather than `vi.stubGlobal`: under `vmForks` each test
 * file gets its own VM context, so this cannot leak into the file that runs
 * next the way a module mock does — but it is an explicit call rather than an
 * import side effect, so a reader can see where it happens.
 */
export function installIntersectionObserverStub(): void {
  globalThis.IntersectionObserver =
    NoopIntersectionObserver as unknown as typeof IntersectionObserver;
}
