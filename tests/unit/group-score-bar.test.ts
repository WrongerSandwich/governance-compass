/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { GroupScoreBar } from "@/components/groups/GroupScoreBar";
import { scoreToTrackPercent } from "@/components/PairedAxisScale";

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

const base = {
  axisId: 3,
  axisName: "Power Distribution",
  poleALabel: "Centralized",
  poleBLabel: "Distributed",
  memberScores: [-0.4, 0.1, 0.6],
};

describe("GroupScoreBar", () => {
  it("passes axisId through to PairedAxisScale so the average marker gets the axis's domain colour", () => {
    // Axis 3 is Power and Authority. paired-axis-scale.test.ts pins the same
    // axis's mark colour to "var(--domain-power)"; asserting it again here,
    // through GroupScoreBar's own axisId prop, is what actually proves the
    // prop is forwarded rather than silently defaulting to axisId 1's
    // (economic) mark, which a required-but-unused prop wouldn't catch.
    const container = render(createElement(GroupScoreBar, { ...base, average: -0.5 }));
    const dotA = container.querySelector("[data-respondent='a']") as HTMLElement;

    expect(dotA.style.backgroundColor).toBe("var(--domain-power)");
  });

  it("qualifies the axis name as the group average, not a bare axis position, in the aria-label", () => {
    const container = render(createElement(GroupScoreBar, { ...base, average: -0.5 }));
    const label = container.querySelector("[role='img']")!.getAttribute("aria-label")!;

    // -0.5 has magnitude 0.5, describePosition's "moderately" bucket, toward
    // the negative pole (poleALabel, since -0.5 < 0).
    expect(label).toBe("Power Distribution, group average: moderately toward Centralized");
  });

  it("places the group-average marker at the same track position PairedAxisScale uses for its own dot", () => {
    // This is the coordinate-mapping repair: before it, this marker used a
    // 0-100% mapping while PairedAxisScale's dot (and this same marker's
    // sibling PairedAxisScale below) used scoreToTrackPercent's 6-94% one,
    // so the two disagreed by ~41px at the poles in a 688px container.
    const average = -0.5;
    const container = render(createElement(GroupScoreBar, { ...base, average }));
    const marker = container.querySelector('[title^="Group avg"]') as HTMLElement | null;

    expect(marker).not.toBeNull();
    expect(marker!.style.left).toBe(`${scoreToTrackPercent(average)}%`);
  });

  it("places each member dot at the same track position too", () => {
    const container = render(createElement(GroupScoreBar, { ...base, average: -0.5 }));
    const dot = container.querySelector('[title="0.60"]') as HTMLElement | null;

    expect(dot).not.toBeNull();
    expect(dot!.style.left).toBe(`${scoreToTrackPercent(0.6)}%`);
  });

  it("shows a readable score readout for the group average, not just a 1.5px hover target", () => {
    // Asserted on the specific element, not container.textContent: textContent
    // walks aria-hidden subtrees too, so a readout accidentally placed inside
    // the (aria-hidden) member-dot strip would still satisfy a substring
    // check on the whole container despite being unreachable to assistive
    // tech. closest('[aria-hidden="true"]') is what actually pins that.
    const container = render(createElement(GroupScoreBar, { ...base, average: -0.5 }));
    const readout = Array.from(container.querySelectorAll("span")).find(
      (el) => el.textContent === "-0.50",
    );

    expect(readout).not.toBeUndefined();
    expect(readout!.closest('[aria-hidden="true"]')).toBeNull();
  });
});
