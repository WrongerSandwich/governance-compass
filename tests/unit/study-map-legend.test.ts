/**
 * @vitest-environment jsdom
 *
 * Regression cover for issue #65: MapLegend's axis-gradient variant declared
 * `min`/`max` props but destructured only the labels, so the numbers were
 * silently dropped — and the caller passed values hardcoded to whatever the
 * data happened to say at the time.
 */
import { describe, it, expect, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MapLegend, type MapLegendProps } from "@/components/study/MapLegend";

// React 19 wants this flag set for act() to be recognized.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const mounted: Array<{ root: Root; container: HTMLElement }> = [];

function renderLegend(props: MapLegendProps): HTMLElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  let root!: Root;
  act(() => {
    root = createRoot(container);
    root.render(createElement(MapLegend, props));
  });
  mounted.push({ root, container });
  return container;
}

afterEach(() => {
  for (const { root, container } of mounted.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

const base = {
  variant: "axis-gradient",
  lowLabel: "Pluralism",
  highLabel: "Cohesion",
} as const;

describe("MapLegend axis-gradient", () => {
  it("renders the min and max it is given", () => {
    const el = renderLegend({ ...base, min: -0.37, max: 0.43 });
    expect(el.textContent).toContain("-0.37");
    expect(el.textContent).toContain("+0.43");
  });

  it("reflects a different range rather than a baked-in one", () => {
    const el = renderLegend({ ...base, min: -0.12, max: 0.91 });
    expect(el.textContent).toContain("-0.12");
    expect(el.textContent).toContain("+0.91");
    expect(el.textContent).not.toContain("0.37");
  });

  it("names the range in the accessible label", () => {
    const el = renderLegend({ ...base, min: -0.37, max: 0.43 });
    const label = el.querySelector('[role="img"]')?.getAttribute("aria-label");
    expect(label).toContain("-0.37");
    expect(label).toContain("+0.43");
  });
});
