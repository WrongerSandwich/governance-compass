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
import { CLUSTERS } from "@/data/syntheticStudyClusters";
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

describe("MapLegend cluster", () => {
  // Issue #154: six swatch-top columns in a 532px legend gave each cluster
  // descriptor an 80px ellipsised box showing 30-42% of its text, with no
  // `title` to recover the rest for a mouse or for assistive technology.
  const clusterIds = [0, 1, 2, 3, 4, 5] as const;

  it("shows every descriptor in full", () => {
    const el = renderLegend({ variant: "cluster", clusterIds });
    for (const id of clusterIds) {
      const cluster = CLUSTERS.find((c) => c.id === id)!;
      expect(el.textContent).toContain(cluster.code);
      expect(el.textContent).toContain(cluster.label.replace(/^Toward\s+/, ""));
    }
  });

  it("neither truncates nor ellipsises a descriptor", () => {
    const el = renderLegend({ variant: "cluster", clusterIds });
    const clipped = Array.from(el.querySelectorAll<HTMLElement>("*")).filter(
      (node) => node.style.textOverflow === "ellipsis" || node.style.whiteSpace === "nowrap",
    );
    expect(clipped).toEqual([]);
  });

  it("is a list rather than an image, so the text reaches assistive technology", () => {
    const el = renderLegend({ variant: "cluster", clusterIds });
    const list = el.querySelector("ul");
    expect(list).not.toBeNull();
    expect(list!.getAttribute("aria-label")).toBe("Cluster color legend");
    expect(list!.querySelectorAll("li")).toHaveLength(6);
    expect(el.querySelector('[role="img"]')).toBeNull();
  });

  it("honours a descriptor override", () => {
    const el = renderLegend({
      variant: "cluster",
      clusterIds: [2],
      descriptorFn: () => "Toward a custom phrase",
    });
    expect(el.textContent).toContain("a custom phrase");
    expect(el.textContent).not.toContain("Toward");
  });
});
