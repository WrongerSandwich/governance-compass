/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useGroupComparison } from "@/lib/useGroupComparison";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

const views: { root: Root; container: HTMLDivElement }[] = [];

afterEach(() => {
  while (views.length) {
    const view = views.pop();
    if (!view) continue;
    act(() => view.root.unmount());
    view.container.remove();
  }
  vi.unstubAllGlobals();
});

describe("useGroupComparison", () => {
  it("ignores a slow response for a group that is no longer selected", async () => {
    const oldRequest = deferred<Response>();
    const newRequest = deferred<Response>();
    const fetch = vi.fn()
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(newRequest.promise);
    vi.stubGlobal("fetch", fetch);

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    views.push({ root, container });

    function Probe({ groupId }: { groupId: string }) {
      const { data, error } = useGroupComparison(groupId);
      return createElement("p", null, error || data?.group.name || "loading");
    }

    act(() => root.render(createElement(Probe, { groupId: "old" })));
    act(() => root.render(createElement(Probe, { groupId: "new" })));

    await act(async () => {
      newRequest.resolve(new Response(JSON.stringify({ group: { name: "New group" } }), { status: 200 }));
      await Promise.resolve();
    });
    await act(async () => {
      oldRequest.resolve(new Response(JSON.stringify({ group: { name: "Old group" } }), { status: 200 }));
      await Promise.resolve();
    });

    expect(container.textContent).toBe("New group");
  });
});
