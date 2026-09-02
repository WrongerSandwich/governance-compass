/**
 * @vitest-environment jsdom
 *
 * Cover for the stacked-Escape-handler defect noted in issue #62: the world
 * map, the compare view and the persona modal each registered their own
 * window-level `keydown` listener, so one Escape press fired all of them and
 * closing the modal also silently cleared the map's region selection.
 * `useEscapeKey` keeps a LIFO stack so only the topmost layer reacts.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useEscapeKey } from "@/lib/study/useEscapeKey";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function Layer({
  onEscape,
  enabled = true,
  children,
}: {
  onEscape: () => void;
  enabled?: boolean;
  children?: ReactNode;
}) {
  useEscapeKey(onEscape, enabled);
  return createElement("div", null, children);
}

let roots: Root[] = [];

function mount(node: ReactNode): Root {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  roots.push(root);
  return root;
}

function unmount(root: Root) {
  act(() => {
    root.unmount();
  });
  roots = roots.filter((r) => r !== root);
}

function pressEscape() {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  });
}

function pressKey(key: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key }));
  });
}

beforeEach(() => {
  for (const root of roots) {
    act(() => root.unmount());
  }
  roots = [];
});

describe("useEscapeKey", () => {
  it("calls the handler on Escape", () => {
    const onEscape = vi.fn();
    mount(createElement(Layer, { onEscape }));

    pressEscape();

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("ignores other keys", () => {
    const onEscape = vi.fn();
    mount(createElement(Layer, { onEscape }));

    pressKey("Enter");
    pressKey("a");

    expect(onEscape).not.toHaveBeenCalled();
  });

  it("delivers Escape only to the most recently mounted layer", () => {
    const background = vi.fn();
    const overlay = vi.fn();
    mount(createElement(Layer, { onEscape: background }));
    mount(createElement(Layer, { onEscape: overlay }));

    pressEscape();

    expect(overlay).toHaveBeenCalledTimes(1);
    expect(background).not.toHaveBeenCalled();
  });

  it("falls back to the layer below once the top layer unmounts", () => {
    const background = vi.fn();
    const overlay = vi.fn();
    mount(createElement(Layer, { onEscape: background }));
    const overlayRoot = mount(createElement(Layer, { onEscape: overlay }));

    unmount(overlayRoot);
    pressEscape();

    expect(background).toHaveBeenCalledTimes(1);
    expect(overlay).not.toHaveBeenCalled();
  });

  it("does not register a disabled layer", () => {
    const background = vi.fn();
    const disabled = vi.fn();
    mount(createElement(Layer, { onEscape: background }));
    mount(createElement(Layer, { onEscape: disabled, enabled: false }));

    pressEscape();

    expect(background).toHaveBeenCalledTimes(1);
    expect(disabled).not.toHaveBeenCalled();
  });

  it("keeps its stack position when the handler identity changes on re-render", () => {
    // The world map rebuilds its Escape handler on every render because it
    // closes over a fresh `mode` object. Re-registering would move it back to
    // the top of the stack and let it steal Escape from an open overlay.
    const overlay = vi.fn();
    const backgroundRoot = mount(
      createElement(Layer, { onEscape: () => {} })
    );
    mount(createElement(Layer, { onEscape: overlay }));

    const background = vi.fn();
    act(() => {
      backgroundRoot.render(createElement(Layer, { onEscape: background }));
    });

    pressEscape();

    expect(overlay).toHaveBeenCalledTimes(1);
    expect(background).not.toHaveBeenCalled();
  });

  it("routes to the newest handler of the top layer after a re-render", () => {
    const first = vi.fn();
    const second = vi.fn();
    const root = mount(createElement(Layer, { onEscape: first }));

    act(() => {
      root.render(createElement(Layer, { onEscape: second }));
    });
    pressEscape();

    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });

  it("stops listening once every layer has unmounted", () => {
    const onEscape = vi.fn();
    const root = mount(createElement(Layer, { onEscape }));
    unmount(root);

    pressEscape();

    expect(onEscape).not.toHaveBeenCalled();
  });
});
