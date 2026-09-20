/**
 * @vitest-environment jsdom
 *
 * `/groups/[groupId]` and its heat map after the phase 5 sweep.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { GroupHeatMap } from "@/components/groups/GroupHeatMap";
import { createRenderHarness } from "../helpers/react-dom";

const { cleanup, render } = createRenderHarness();

const groupPage = readFileSync(
  resolve(process.cwd(), "src/app/groups/[groupId]/page.tsx"),
  "utf8",
);

afterEach(cleanup);

describe("GroupHeatMap", () => {
  const stats = [
    { axisName: "Tight agreement", spread: 0.1 },
    { axisName: "Some spread", spread: 0.6 },
    { axisName: "Wide spread", spread: 1.4 },
  ];

  it("encodes the three spread bands on inverting surfaces, not the Stone ramp", () => {
    const container = render(createElement(GroupHeatMap, { stats }));

    const source = readFileSync(
      resolve(process.cwd(), "src/components/groups/GroupHeatMap.tsx"),
      "utf8",
    );
    // bg-stone-100 under text-stone-800 is a light fill with dark ink. On a
    // dark page that is a light fill with dark ink ON A DARK PAGE — it does
    // not invert, and it is the only scale in the codebase spelled this way.
    expect(source).not.toMatch(/(?:text|bg|border)-stone-\d{2,3}(?![\w-])/);
    expect(container.querySelectorAll("[data-spread-cell]").length).toBe(3);
  });

  it("keeps the three bands visually distinct from one another", () => {
    const container = render(createElement(GroupHeatMap, { stats }));

    const backgrounds = Array.from(
      container.querySelectorAll<HTMLElement>("[data-spread-cell]"),
    ).map((el) => el.style.backgroundColor);

    // The point of a heat map is that the bands differ. Collapsing all three
    // onto one token would satisfy the ban above and destroy the chart.
    expect(new Set(backgrounds).size).toBe(3);
  });

  it("preserves the original intensity cut points, tested on raw spread", () => {
    // intensity = min(spread / 2, 1); cuts at intensity 0.3 and 0.6, i.e.
    // raw spread 0.6 and 1.2. Values just either side of those must land in
    // the bands the old bg-stone-100/200/300 arithmetic put them in.
    const below06 = render(
      createElement(GroupHeatMap, { stats: [{ axisName: "a", spread: 0.59 }] }),
    );
    const at06 = render(
      createElement(GroupHeatMap, { stats: [{ axisName: "a", spread: 0.6 }] }),
    );
    const below12 = render(
      createElement(GroupHeatMap, { stats: [{ axisName: "a", spread: 1.19 }] }),
    );
    const at12 = render(
      createElement(GroupHeatMap, { stats: [{ axisName: "a", spread: 1.2 }] }),
    );

    const bg = (c: HTMLElement) =>
      c.querySelector<HTMLElement>("[data-spread-cell]")!.style.backgroundColor;

    // 0.59 -> intensity 0.295, band 0. 0.6 -> intensity 0.3, band 1.
    expect(bg(below06)).not.toBe(bg(at06));
    // 1.19 -> intensity 0.595, band 1. 1.2 -> intensity 0.6, band 2.
    expect(bg(below12)).not.toBe(bg(at12));
    // And the band-0/band-2 values should differ (sanity that bands are ordered).
    expect(bg(below06)).not.toBe(bg(at12));
  });
});

describe("/groups/[groupId] chrome", () => {
  it("sets the group name at the entry display size", () => {
    expect(groupPage).toContain("display-m");
    expect(groupPage).not.toContain("text-[22px]");
  });

  it("puts the three panel headings in the mono label layer at an AA colour", () => {
    expect(groupPage).toContain("label font-medium text-text-label");
    // Near-black ink, frozen. In dark mode it sits on a near-black panel.
    expect(groupPage).not.toContain("text-stone-800");
  });

  it("routes the error state through the warning ink rather than a third hue", () => {
    // D16. There is no error token and the palette permits no red; the
    // severity is carried by role="alert", not by the colour.
    expect(groupPage).toContain("text-warning-text");
    expect(groupPage).not.toContain("text-red-600");
  });

  it("marks the error state with role=alert since this site had no live region before", () => {
    // Plan D16 assumed every red-600 error site already carries role="alert"
    // or sits in an aria-live region. That premise is false here — this was
    // a bare <p className="text-red-600">, so the role must be added
    // together with the colour swap, not just the colour swap alone.
    expect(groupPage).toContain('role="alert"');
  });

  it("sharpens the invite-code chip's corner", () => {
    expect(groupPage).toContain("rounded-sharp");
    expect(groupPage).not.toContain("rounded-[4px]");
  });

  it("retires text-text-tertiary from this file", () => {
    expect(groupPage).not.toContain("text-text-tertiary");
  });

  it("widens the content column to match /compare's twelve-axis breakdown", () => {
    expect(groupPage).toContain("max-w-results");
    expect(groupPage).not.toContain("max-w-3xl");
  });
});
