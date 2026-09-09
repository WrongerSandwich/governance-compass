/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import Home from "@/app/page";
import { axes } from "@/data/axes";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: { container: HTMLDivElement; root: Root }[] = [];

function renderHome() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(createElement(Home)));
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

describe("home page", () => {
  it("leads with the delta's headline and eyebrow", () => {
    const container = renderHome();

    expect(container.querySelector("h1")!.textContent).toBe(
      "Locating a political position across twelve axes.",
    );
    expect(container.textContent).toContain("A twelve-axis self-assessment");
  });

  it("sends the primary call to action to the quiz without shrinking it", () => {
    const container = renderHome();
    const cta = [...container.querySelectorAll("a")].find(
      (a) => a.textContent?.trim() === "Begin the assessment",
    )!;
    const classes = cta.className.split(/\s+/);

    expect(cta.getAttribute("href")).toBe("/quiz");
    // `block` would lose to the variant's `inline-block`; `w-full` does not.
    expect(classes).not.toContain("block");
    expect(classes).toContain("w-full");
    // Mock 6a draws the mobile primary full-bleed, so no width cap.
    expect(classes).not.toContain("max-w-xs");
    // jsdom cannot measure layout, so this pins the classes rather than the
    // result: without them the row's three items overflow between 560 and
    // ~680px and flex squeezes the primary until its label wraps to two lines.
    expect(classes).toContain("min-[560px]:shrink-0");
    expect(cta.parentElement!.className.split(/\s+/)).toContain("min-[560px]:flex-wrap");
  });

  it("shows one paired scale per axis", () => {
    const container = renderHome();

    expect(container.querySelectorAll("[data-track]")).toHaveLength(12);
    expect(container.querySelectorAll("[data-respondent='b']")).toHaveLength(12);
  });

  it("names three diverging axes, and uses each axis's own note", () => {
    const container = renderHome();
    const panel = container.querySelector("[data-divergence]")!;
    const items = panel.querySelectorAll("[data-divergence-item]");

    expect(items).toHaveLength(3);
    for (const item of items) {
      const axis = axes.find((a) => item.textContent!.includes(a.name))!;
      expect(axis, "divergence item names no known axis").toBeTruthy();
      expect(item.textContent).toContain(axis.divergenceNote);
    }
  });

  it("lists all twelve axes under their four domains", () => {
    const container = renderHome();
    const columns = container.querySelectorAll("[data-domain]");

    expect(columns).toHaveLength(4);
    for (const axis of axes) {
      expect(container.textContent).toContain(axis.poleALabel.split(" ")[0]);
    }
  });

  it("offers Methodology as an outlined button on mobile and a tertiary link above it", () => {
    const container = renderHome();
    const methodology = [...container.querySelectorAll("a")].filter(
      (a) => a.textContent?.trim() === "Methodology",
    );

    // Mock 6a switches variant by breakpoint, so both render and CSS picks one.
    expect(methodology).toHaveLength(2);

    const outlined = methodology[0].className.split(/\s+/);
    const tertiary = methodology[1].className.split(/\s+/);

    expect(outlined).toContain("min-[560px]:hidden");
    // A bare `hidden` cannot hide the tertiary link: unprefixed utilities are
    // emitted in a fixed order and `.hidden` lands before the button variant's
    // own `.inline-block`, so at equal specificity `inline-block` wins at every
    // width. `max-[560px]:hidden` lands in the trailing media-variant block,
    // which is emitted after every unprefixed utility, so it does win. Checked
    // token-wise, because `toContain("hidden")` also passes on the spelling
    // that never paints.
    expect(tertiary).toContain("max-[560px]:hidden");
    expect(tertiary).not.toContain("hidden");
  });

  it("labels the sample as illustrative and keeps respondents anonymous", () => {
    const container = renderHome();

    expect(container.textContent).toContain("Illustrative profile");
    expect(container.textContent).toContain("Respondent A");
    expect(container.textContent).not.toMatch(/P0\d{3}/);
  });
});
