/**
 * @vitest-environment jsdom
 *
 * Contract coverage for the design delta's three-tier button system.
 */
import { afterEach, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Button, ButtonLink, buttonClasses } from "@/components/Button";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: { container: HTMLDivElement; root: Root }[] = [];

function render(element: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(element));
  mounted.push({ container, root });
  return container;
}

afterEach(() => {
  while (mounted.length) {
    const entry = mounted.pop()!;
    act(() => entry.root.unmount());
    entry.container.remove();
  }
});

describe("buttonClasses", () => {
  it("fills the primary with the invertible ink token, never a raw ramp step", () => {
    const classes = buttonClasses("primary");

    expect(classes).toContain("bg-button-primary");
    expect(classes).toContain("text-button-primary-fg");
    expect(classes).toContain("hover:bg-button-primary-hover");
    // Stone 600 keeps its jobs as focus ring and progress fill only.
    expect(classes).not.toContain("bg-stone-600");
    expect(classes).not.toContain("bg-stone-900");
  });

  it("outlines the secondary and never fills it", () => {
    const classes = buttonClasses("secondary");

    expect(classes).toContain("border-border-primary");
    expect(classes).not.toContain("bg-button-primary");
  });

  it("gives the tertiary an underline and no padding box", () => {
    const classes = buttonClasses("tertiary");

    expect(classes).toContain("border-b");
    expect(classes).not.toMatch(/\bpx-/);
  });

  it("labels primary and secondary with the mono control role", () => {
    expect(buttonClasses("primary")).toContain("control");
    expect(buttonClasses("secondary")).toContain("control");
  });

  it("carries the unchanged focus ring and disabled treatment on every variant", () => {
    for (const variant of ["primary", "secondary", "tertiary"] as const) {
      expect(buttonClasses(variant)).toContain("focus-visible:outline-stone-600");
      expect(buttonClasses(variant)).toContain("disabled:opacity-50");
    }
  });
});

describe("Button and ButtonLink", () => {
  it("renders a button element that forwards disabled", () => {
    const container = render(
      createElement(Button, { disabled: true }, "Next"),
    );
    const button = container.querySelector("button")!;

    expect(button.textContent).toBe("Next");
    expect(button.disabled).toBe(true);
  });

  it("renders an anchor for ButtonLink", () => {
    const container = render(
      createElement(ButtonLink, { href: "/quiz" }, "Begin the assessment"),
    );
    const anchor = container.querySelector("a")!;

    expect(anchor.getAttribute("href")).toBe("/quiz");
    expect(anchor.textContent).toBe("Begin the assessment");
  });

  it("appends caller classes after the variant classes so they can override", () => {
    const container = render(
      createElement(Button, { className: "w-full" }, "Finalize budget"),
    );

    expect(container.querySelector("button")!.className).toMatch(/w-full$/);
  });
});
