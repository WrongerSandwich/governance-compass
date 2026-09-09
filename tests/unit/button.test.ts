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

/**
 * True when `className` appears as a whole class, not as a substring of a
 * longer one. `toContain` is unsafe here: "bg-button-primary" is a substring
 * of "hover:bg-button-primary-hover", and "border-b" of
 * "border-border-primary", so substring assertions pass against a primary
 * that never fills at rest and a tertiary with no underline.
 */
function hasClass(classes: string, className: string): boolean {
  return classes.split(/\s+/).includes(className);
}

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

    expect(hasClass(classes, "bg-button-primary")).toBe(true);
    expect(hasClass(classes, "text-button-primary-fg")).toBe(true);
    expect(hasClass(classes, "hover:bg-button-primary-hover")).toBe(true);
    // Stone 600 keeps its jobs as focus ring and progress fill only.
    expect(hasClass(classes, "bg-stone-600")).toBe(false);
    expect(hasClass(classes, "bg-stone-900")).toBe(false);
  });

  it("outlines the secondary and never fills it", () => {
    const classes = buttonClasses("secondary");

    expect(hasClass(classes, "border-border-primary")).toBe(true);
    expect(hasClass(classes, "bg-button-primary")).toBe(false);
  });

  it("gives the tertiary an underline and no padding box", () => {
    const classes = buttonClasses("tertiary");

    expect(hasClass(classes, "border-b")).toBe(true);
    expect(classes).not.toMatch(/\bpx-/);
  });

  it("labels primary and secondary with the mono control role", () => {
    expect(hasClass(buttonClasses("primary"), "control")).toBe(true);
    expect(hasClass(buttonClasses("secondary"), "control")).toBe(true);
  });

  it("carries the unchanged focus ring and disabled treatment on every variant", () => {
    for (const variant of ["primary", "secondary", "tertiary"] as const) {
      expect(hasClass(buttonClasses(variant), "focus-visible:outline-stone-600")).toBe(true);
      expect(hasClass(buttonClasses(variant), "disabled:opacity-50")).toBe(true);
      // House rule (BudgetSimulator.tsx:215-225): bound controls use
      // aria-disabled rather than disabled, to preserve tab order.
      expect(hasClass(buttonClasses(variant), "aria-disabled:opacity-50")).toBe(true);
      expect(hasClass(buttonClasses(variant), "aria-disabled:cursor-not-allowed")).toBe(true);
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

  it("appends caller classes for conflict-free properties", () => {
    const container = render(
      createElement(Button, { className: "w-full" }, "Finalize budget"),
    );

    expect(hasClass(container.querySelector("button")!.className, "w-full")).toBe(true);
  });

  it("defaults to the primary variant and to type=button", () => {
    // A bare <button> would be type=submit, which submits any enclosing form.
    const container = render(createElement(Button, null, "Begin"));
    const button = container.querySelector("button")!;

    expect(button.className).toBe(buttonClasses("primary"));
    expect(button.type).toBe("button");
  });

  it("honours an explicit type and applies variants to ButtonLink", () => {
    const submit = render(
      createElement(Button, { type: "submit" }, "Create account"),
    );
    expect(submit.querySelector("button")!.type).toBe("submit");

    const link = render(
      createElement(ButtonLink, { href: "/quiz", variant: "secondary" }, "Methodology"),
    );
    expect(link.querySelector("a")!.className).toBe(buttonClasses("secondary"));
  });
});
