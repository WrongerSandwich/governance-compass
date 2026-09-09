/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PairedAxisScale, scoreToTrackPercent } from "@/components/PairedAxisScale";

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

describe("scoreToTrackPercent", () => {
  it("maps the poles inside the track so a dot never clips its end", () => {
    // -1..1 maps to 6%..94%, per delta 05.
    expect(scoreToTrackPercent(-1)).toBe(6);
    expect(scoreToTrackPercent(1)).toBe(94);
    expect(scoreToTrackPercent(0)).toBe(50);
  });

  it("is linear between the poles", () => {
    expect(scoreToTrackPercent(0.5)).toBe(72);
    expect(scoreToTrackPercent(-0.5)).toBe(28);
  });

  it("clamps scores outside the range rather than overflowing the track", () => {
    expect(scoreToTrackPercent(1.4)).toBe(94);
    expect(scoreToTrackPercent(-2)).toBe(6);
  });
});

describe("PairedAxisScale", () => {
  const base = {
    axisId: 3,
    poleALabel: "Distributed",
    poleBLabel: "Centralized",
    scoreA: -0.5,
  };

  it("renders both endpoint labels", () => {
    const container = render(createElement(PairedAxisScale, base));

    expect(container.textContent).toContain("Distributed");
    expect(container.textContent).toContain("Centralized");
  });

  it("positions respondent A from its score", () => {
    const container = render(createElement(PairedAxisScale, base));
    const dotA = container.querySelector("[data-respondent='a']") as HTMLElement;

    expect(dotA.style.left).toBe("28%");
  });

  it("omits the outlined dot when there is no second respondent", () => {
    const container = render(createElement(PairedAxisScale, base));

    expect(container.querySelector("[data-respondent='b']")).toBeNull();
  });

  it("renders both dots when a second respondent is given", () => {
    const container = render(
      createElement(PairedAxisScale, { ...base, scoreB: 0.5 }),
    );

    expect((container.querySelector("[data-respondent='a']") as HTMLElement).style.left).toBe("28%");
    expect((container.querySelector("[data-respondent='b']") as HTMLElement).style.left).toBe("72%");
  });

  it("colours the track from the axis's domain", () => {
    // Axis 3 is Power and Authority — Slate. The track uses the 400 tone.
    const container = render(createElement(PairedAxisScale, base));
    const track = container.querySelector("[data-track]") as HTMLElement;

    expect(track.style.backgroundColor).toBe("rgb(157, 174, 187)");
  });

  it("describes the scale for assistive tech rather than leaving bare dots", () => {
    const container = render(
      createElement(PairedAxisScale, { ...base, scoreB: 0.5 }),
    );
    const dotA = container.querySelector("[data-respondent='a']")!;

    expect(dotA.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector("[role='img']")?.getAttribute("aria-label"))
      .toMatch(/Distributed.*Centralized/);
  });
});
