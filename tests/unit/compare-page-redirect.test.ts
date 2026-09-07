/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(),
}));

const { default: ComparePage } = await import("@/app/compare/page");

const views: { root: Root; container: HTMLDivElement }[] = [];

beforeEach(() => replace.mockReset());

afterEach(() => {
  while (views.length) {
    const view = views.pop();
    if (!view) continue;
    act(() => view.root.unmount());
    view.container.remove();
  }
});

describe("ComparePage", () => {
  it("does not redirect while rendering when comparison parameters are missing", () => {
    renderToString(createElement(ComparePage));

    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects after mounting when comparison parameters are missing", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    views.push({ root, container });

    act(() => root.render(createElement(ComparePage)));

    expect(replace).toHaveBeenCalledWith("/");
  });
});
