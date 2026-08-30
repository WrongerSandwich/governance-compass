/**
 * @vitest-environment jsdom
 *
 * Cover for the storage store behind the nav Results link and the
 * returning-user link. Two things have to hold: the value has to be present
 * on the very first client render (the point of moving off a read-in-effect),
 * and hydrating over server HTML that could not see storage must not produce
 * a mismatch — the failure mode is on the first page a returning visitor hits.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  readStorage,
  removeStorage,
  writeStorage,
} from "@/lib/client-storage";
import {
  LAST_RESULTS_KEY,
  hasUnsavedResults,
  lastResultsHref,
  lastResultsProfileId,
  saveLastResults,
  useLastResults,
} from "@/lib/last-results";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/** Mirrors ReturningUserLink without pulling in next/link's router context. */
let renderCount = 0;
function ResultsLink() {
  renderCount++;
  const href = lastResultsHref(useLastResults());
  if (!href) return null;
  return createElement("a", { href }, "view your existing results");
}

let container: HTMLDivElement;
let root: Root | null = null;

beforeEach(() => {
  renderCount = 0;
  localStorage.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  if (root) act(() => root!.unmount());
  root = null;
  container.remove();
});

function mount(element: React.ReactElement) {
  act(() => {
    root = createRoot(container);
    root.render(element);
  });
}

describe("useStorageValue", () => {
  it("has the stored value on the first client render, with no null pass", () => {
    localStorage.setItem(LAST_RESULTS_KEY, "AbC123");

    mount(createElement(ResultsLink));

    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "/results?r=AbC123"
    );
    // The read-in-an-effect version this replaced rendered twice: once empty,
    // once with the link. Anything above 1 means the cascade came back.
    expect(renderCount).toBe(1);
  });

  it("re-renders readers when the key is written in the same tab", () => {
    mount(createElement(ResultsLink));
    expect(container.querySelector("a")).toBeNull();

    act(() => saveLastResults("id:profile-9"));

    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "/results/profile-9"
    );
  });

  it("re-renders readers when the key is removed", () => {
    localStorage.setItem(LAST_RESULTS_KEY, "AbC123");
    mount(createElement(ResultsLink));
    expect(container.querySelector("a")).not.toBeNull();

    act(() => removeStorage("local", LAST_RESULTS_KEY));

    expect(container.querySelector("a")).toBeNull();
  });

  it("picks up a write from another tab via the storage event", () => {
    mount(createElement(ResultsLink));

    act(() => {
      localStorage.setItem(LAST_RESULTS_KEY, "fromOtherTab");
      window.dispatchEvent(new StorageEvent("storage", { key: LAST_RESULTS_KEY }));
    });

    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "/results?r=fromOtherTab"
    );
  });

  it("stops listening once unmounted", () => {
    mount(createElement(ResultsLink));
    act(() => root!.unmount());
    root = null;

    // A write with no live subscriber must not throw or touch the DOM.
    expect(() => act(() => saveLastResults("AbC123"))).not.toThrow();
    expect(container.querySelector("a")).toBeNull();
  });

  it("reads local and session storage independently", () => {
    localStorage.setItem("shared-key", "from-local");
    sessionStorage.setItem("shared-key", "from-session");

    expect(readStorage("local", "shared-key")).toBe("from-local");
    expect(readStorage("session", "shared-key")).toBe("from-session");

    writeStorage("session", "shared-key", "rewritten");
    expect(sessionStorage.getItem("shared-key")).toBe("rewritten");
    expect(localStorage.getItem("shared-key")).toBe("from-local");

    sessionStorage.clear();
  });

  it("treats unavailable storage as an absent key rather than throwing", () => {
    const getItem = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new DOMException("denied", "SecurityError");
      });
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("denied", "SecurityError");
      });

    try {
      expect(readStorage("local", LAST_RESULTS_KEY)).toBeNull();
      expect(() => writeStorage("local", LAST_RESULTS_KEY, "x")).not.toThrow();
      mount(createElement(ResultsLink));
      expect(container.querySelector("a")).toBeNull();
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });

  it("hydrates server HTML that could not see storage without a mismatch", () => {
    const serverHtml = renderToString(createElement(ResultsLink));
    // The server has no storage, so it must render the empty branch.
    expect(serverHtml).toBe("");

    localStorage.setItem(LAST_RESULTS_KEY, "id:profile-9");
    container.innerHTML = serverHtml;

    // React reports a hydration mismatch through onRecoverableError, which is
    // deterministic; the console.error it also emits is not, so it is only
    // silenced here rather than asserted on.
    const recovered: string[] = [];
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      act(() => {
        root = hydrateRoot(container, createElement(ResultsLink), {
          onRecoverableError: (err) => recovered.push(String(err)),
        });
      });
    } finally {
      consoleError.mockRestore();
    }

    expect(recovered).toEqual([]);
    // React re-reads the client snapshot after hydration and swaps the link in.
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "/results/profile-9"
    );
  });
});

describe("last-results helpers", () => {
  it("maps a raw encoded value to the query-param results URL", () => {
    expect(lastResultsHref("AbC123")).toBe("/results?r=AbC123");
    expect(lastResultsProfileId("AbC123")).toBeNull();
    expect(hasUnsavedResults("AbC123")).toBe(true);
  });

  it("maps a materialized pointer to the profile results URL", () => {
    expect(lastResultsHref("id:profile-9")).toBe("/results/profile-9");
    expect(lastResultsProfileId("id:profile-9")).toBe("profile-9");
    expect(hasUnsavedResults("id:profile-9")).toBe(false);
  });

  it("reports nothing stored as nothing to link to or save", () => {
    expect(lastResultsHref(null)).toBeNull();
    expect(lastResultsProfileId(null)).toBeNull();
    expect(hasUnsavedResults(null)).toBe(false);
  });
});
