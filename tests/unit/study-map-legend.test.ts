/**
 * @vitest-environment jsdom
 *
 * Regression cover for issue #65: MapLegend's axis-gradient variant declared
 * `min`/`max` props but destructured only the labels, so the numbers were
 * silently dropped — and the caller passed values hardcoded to whatever the
 * data happened to say at the time.
 */
import { describe, it, expect, afterEach } from "vitest";
import { createElement } from "react";
import { MapLegend, type MapLegendProps } from "@/components/study/MapLegend";
import { createRenderHarness } from "../helpers/react-dom";

const { cleanup, render } = createRenderHarness();

function renderLegend(props: MapLegendProps): HTMLElement {
  return render(createElement(MapLegend, props));
}

afterEach(cleanup);

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
