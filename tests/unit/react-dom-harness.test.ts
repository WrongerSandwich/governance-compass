/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode, useEffect } from "react";
import { classes, createRenderHarness } from "../helpers/react-dom";

const harness = createRenderHarness();

afterEach(harness.cleanup);

describe("createRenderHarness", () => {
  it("mounts a real React node in an attached container", () => {
    const container = harness.render(
      createElement("p", { className: "body-s" }, "Mounted content"),
    );

    expect(container.isConnected).toBe(true);
    expect(container.querySelector("p")?.textContent).toBe("Mounted content");
  });

  it("rerenders through the root belonging to a container", () => {
    const container = harness.render(createElement("p", null, "Before"));

    harness.rerender(container, createElement("p", null, "After"));

    expect(container.textContent).toBe("After");
  });

  it("rejects rerendering a container owned elsewhere", () => {
    const foreignContainer = document.createElement("div");

    expect(() =>
      harness.rerender(foreignContainer, createElement("p", null, "After")),
    ).toThrow("Cannot rerender a container this harness did not mount");
  });

  it("applies a wrapper on the initial render and rerender", () => {
    const wrapped = createRenderHarness({
      wrap: (element: ReactNode) =>
        createElement("section", { "data-wrapper": "router" }, element),
    });

    try {
      const container = wrapped.render(createElement("p", null, "Before"));
      wrapped.rerender(container, createElement("p", null, "After"));

      expect(container.querySelector("[data-wrapper='router']")?.textContent).toBe("After");
    } finally {
      wrapped.cleanup();
    }
  });

  it("removes every mounted container during cleanup", () => {
    const first = harness.render(createElement("p", null, "First"));
    const second = harness.render(createElement("p", null, "Second"));

    harness.cleanup();

    expect(first.isConnected).toBe(false);
    expect(second.isConnected).toBe(false);
  });

  it("cleans a registered root after the wrapper throws during render", () => {
    const renderError = new Error("render failed");
    const failing = createRenderHarness({
      wrap: () => {
        throw renderError;
      },
    });
    const originalChildCount = document.body.childElementCount;

    expect(() => failing.render(createElement("p", null, "Never rendered"))).toThrow(
      renderError,
    );
    expect(document.body.childElementCount).toBe(originalChildCount + 1);

    failing.cleanup();

    expect(document.body.childElementCount).toBe(originalChildCount);
  });

  it("drains every container before propagating an unmount error", () => {
    const unmountError = new Error("unmount failed");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    function ThrowsOnUnmount() {
      useEffect(() => () => {
        throw unmountError;
      }, []);
      return createElement("p", null, "Throws on unmount");
    }

    try {
      const first = harness.render(createElement("p", null, "First"));
      const second = harness.render(createElement(ThrowsOnUnmount));

      expect(() => harness.cleanup()).toThrow(unmountError);
      expect(first.isConnected).toBe(false);
      expect(second.isConnected).toBe(false);
    } finally {
      consoleError.mockRestore();
    }
  });
});

describe("classes", () => {
  it("returns whole class tokens from HTML and SVG elements", () => {
    const container = harness.render(
      createElement(
        "div",
        { className: "label-nav text-text-label" },
        createElement("svg", { className: "chart-mark opacity-60" }),
      ),
    );

    expect(classes(container.firstElementChild!)).toEqual([
      "label-nav",
      "text-text-label",
    ]);
    expect(classes(container.querySelector("svg")!)).toEqual([
      "chart-mark",
      "opacity-60",
    ]);
  });
});
