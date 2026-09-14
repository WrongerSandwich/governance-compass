/**
 * @vitest-environment jsdom
 *
 * `/archetypes` against mock 7c (design delta phase 5).
 */
import { afterEach, describe, expect, it } from "vitest";
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import ArchetypesPage from "@/app/archetypes/page";
import { archetypes } from "@/data/archetypes";
import { AppRouterContext, ROUTER_STUB } from "../helpers/client-component-env";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: { container: HTMLDivElement; root: Root }[] = [];

function render(element: ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  mounted.push({ container, root });
  act(() =>
    root.render(
      createElement(AppRouterContext.Provider, { value: ROUTER_STUB }, element),
    ),
  );
  return container;
}

function classes(el: Element): string[] {
  return Array.from(el.classList);
}

afterEach(() => {
  for (const { container, root } of mounted) {
    act(() => root.unmount());
    container.remove();
  }
  mounted.length = 0;
});

describe("/archetypes header block", () => {
  it("caps the header on the reference measure", () => {
    const container = render(createElement(ArchetypesPage));

    const header = container.querySelector("[data-archetypes-header]")!;
    expect(classes(header)).toContain("max-w-reference");
    // max-w-2xl is 672px, which is the quiz measure, not this page's 660.
    expect(classes(header)).not.toContain("max-w-2xl");
  });

  it("opens with the reference back-link and the page title", () => {
    const container = render(createElement(ArchetypesPage));

    const link = container.querySelector("[data-page-kicker] a")!;
    expect(link.getAttribute("href")).toBe("/references");
    expect(container.querySelector("h1")!.textContent).toBe("Governance archetypes");
    expect(classes(container.querySelector("h1")!)).toContain("display-page");
  });

  it("states the archetype count from the data rather than a literal", () => {
    const container = render(createElement(ArchetypesPage));

    const lead = container.querySelector("[data-page-lead]")!;
    // The mock's prose says "twelve"; the page must not drift from the data
    // if a thirteenth prototype is ever added.
    expect(lead.textContent).toContain(`${archetypes.length} archetype prototypes`);
  });

  it("carries the spoiler advisory as a warning stripe over the page ground", () => {
    const container = render(createElement(ArchetypesPage));

    const note = container.querySelector("[data-spoiler-note]")!;
    expect(note.textContent).toContain("archetype descriptions may influence how you answer");
    expect(classes(note)).toContain("border-warning");
    // The inline `borderLeftColor: var(--warning)` this replaced. An inline
    // style is invisible to the token guards in Task 13, which is the reason
    // the spelling matters and not just the colour.
    expect(note.getAttribute("style")).toBeNull();
  });

  it("links the spoiler note's escape hatch to the quiz", () => {
    const container = render(createElement(ArchetypesPage));

    const link = container.querySelector("[data-spoiler-note] a")!;
    expect(link.getAttribute("href")).toBe("/quiz");
    expect(link.textContent).toBe("completing it first");
  });

  it("leaves the header block as a sibling of the entries band, not its parent", () => {
    const container = render(createElement(ArchetypesPage));

    const header = container.querySelector("[data-archetypes-header]")!;
    const band = container.querySelector("[data-archetypes-band]")!;
    // The full-bleed zebra in Task 4 is only reachable from outside a capped
    // column. If the band ever moves back inside the header, the rows go on
    // rendering — just 660px wide with the background clipped to them — so
    // nothing else in the suite would catch it.
    expect(header.contains(band)).toBe(false);
    expect(header.parentElement).toBe(band.parentElement);
  });
});
