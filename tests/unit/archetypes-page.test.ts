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

describe("/archetypes provenance legend", () => {
  it("labels the legend in the mono eyebrow layer", () => {
    const container = render(createElement(ArchetypesPage));

    const label = container.querySelector("[data-provenance-label]")!;
    expect(label.textContent).toBe("Provenance");
    expect(classes(label)).toContain("label-eyebrow");
    expect(classes(label)).toContain("text-text-label");
    expect(classes(label)).not.toContain("text-text-tertiary");
  });

  it("lists all three tiers as glyph, mono label, prose", () => {
    const container = render(createElement(ArchetypesPage));

    const rows = container.querySelectorAll("[data-provenance-row]");
    expect(rows.length).toBe(3);
    expect(rows[0].textContent).toContain("●");
    expect(rows[1].textContent).toContain("◐");
    expect(rows[2].textContent).toContain("○");

    const firstLabel = rows[0].querySelector("[data-provenance-tier]")!;
    expect(firstLabel.textContent).toBe("Emerged from data");
    expect(classes(firstLabel)).toContain("label-nav");
    expect(classes(firstLabel)).toContain("text-text-primary");
  });

  it("glosses each tier in one line, not in the glyph's long tooltip prose", () => {
    const container = render(createElement(ArchetypesPage));

    const rows = container.querySelectorAll("[data-provenance-row]");
    expect(rows[0].textContent).toContain("identified from an empirical cluster");
    // EMERGENCE_TOOLTIPS is the 40-word form EmergenceGlyph's accessible name
    // uses. Reaching for it here is the natural mistake — it is the only
    // exported per-tier prose — and it renders three paragraphs where 7c
    // draws three lines, which no other assertion in this file would catch.
    expect(rows[0].textContent).not.toContain("Its prototype vector is centered");
    for (const row of rows) expect(row.textContent!.length).toBeLessThan(140);
  });

  it("leaves the legend's own glyphs decorative", () => {
    const container = render(createElement(ArchetypesPage));

    // The row spells the tier out in words beside it, so an accessible name
    // on the glyph would make a screen reader announce the same tier twice.
    // The glyphs that DO carry a name are the ones in the index and the entry
    // headings, where nothing else says what the mark means.
    for (const row of container.querySelectorAll("[data-provenance-row]")) {
      const glyph = row.querySelector("span")!;
      expect(glyph.getAttribute("aria-hidden")).toBe("true");
      expect(glyph.getAttribute("role")).toBeNull();
    }
  });

  it("keeps the long tooltip reachable from the index glyphs", () => {
    const container = render(createElement(ArchetypesPage));

    const glyph = container.querySelector("[data-archetype-index] [role='img']")!;
    expect(glyph.getAttribute("aria-label")).toMatch(
      /Emerged from data|Refined with data|Theoretically derived/,
    );
    // EmergenceGlyph builds its name as "<label>. <tooltip>", so this is the
    // one place the long form stays available to an AT user.
    expect(glyph.getAttribute("aria-label")!.length).toBeGreaterThan(100);
  });
});

describe("/archetypes index", () => {
  it("draws one flat two-column grid rather than three tier-grouped blocks", () => {
    const container = render(createElement(ArchetypesPage));

    const grid = container.querySelector("[data-archetype-index]")!;
    expect(classes(grid)).toContain("grid-cols-2");
    expect(grid.querySelectorAll("a").length).toBe(archetypes.length);
    // The pre-7c index split into three headed groups. Mock 7c carries the
    // tier per row, by glyph, and prints the tier NAME inside each entry.
    expect(container.querySelectorAll("[data-index-tier-group]").length).toBe(0);
  });

  it("numbers every index row in mono, zero-padded, in display order", () => {
    const container = render(createElement(ArchetypesPage));

    const numbers = Array.from(
      container.querySelectorAll("[data-archetype-index] [data-index-number]"),
    ).map((el) => el.textContent);

    expect(numbers[0]).toBe("01");
    expect(numbers[numbers.length - 1]).toBe("12");
    const first = container.querySelector("[data-archetype-index] [data-index-number]")!;
    expect(classes(first)).toContain("font-mono");
    expect(classes(first)).toContain("text-text-label");
  });

  it("points every index row at the entry it names", () => {
    const container = render(createElement(ArchetypesPage));

    const hrefs = Array.from(
      container.querySelectorAll<HTMLAnchorElement>("[data-archetype-index] a"),
    ).map((a) => a.getAttribute("href"));
    const ids = Array.from(container.querySelectorAll("[data-archetype-entry]")).map(
      (el) => `#${el.id}`,
    );

    // Anchor drift is silent: a wrong href scrolls to the top of the page,
    // which reads as "the link did nothing" rather than as a bug.
    expect(hrefs).toEqual(ids);
  });
});

describe("/archetypes entries", () => {
  it("renders one full-bleed row per archetype, alternating the ground", () => {
    const container = render(createElement(ArchetypesPage));

    const rows = container.querySelectorAll("[data-archetype-entry]");
    expect(rows.length).toBe(archetypes.length);
    expect(classes(rows[0])).not.toContain("bg-surface-2");
    expect(classes(rows[1])).toContain("bg-surface-2");
    // Each row separates from the next with a rule, per 7c.
    expect(classes(rows[0])).toContain("border-b");
    expect(classes(rows[0])).toContain("border-border-secondary");
  });

  it("re-applies the reference measure inside each full-bleed row", () => {
    const container = render(createElement(ArchetypesPage));

    const inner = container.querySelector("[data-archetype-entry] [data-entry-inner]")!;
    // The band is edge-to-edge; the prose is not. Losing this cap is the
    // failure mode of full-bleed: the text runs the width of the viewport and
    // every other assertion here still passes.
    expect(classes(inner)).toContain("max-w-reference");
    expect(classes(inner)).toContain("mx-auto");
  });

  it("sets entry names at the entry display size", () => {
    const container = render(createElement(ArchetypesPage));

    const h2 = container.querySelector("[data-archetype-entry] h2")!;
    expect(classes(h2)).toContain("display-entry");
    expect(classes(h2)).not.toContain("text-[18px]");
  });

  it("prints the provenance tier as a mono line under each entry heading", () => {
    const container = render(createElement(ArchetypesPage));

    const tiers = container.querySelectorAll("[data-entry-tier]");
    expect(tiers.length).toBe(archetypes.length);
    expect(classes(tiers[0])).toContain("label-nav");
    expect(classes(tiers[0])).toContain("text-text-label");
    // D19: this is where the tier name went when the index flattened. If it
    // is absent the tier is reachable only through a glyph's title attribute.
    expect(["Emerged from data", "Refined with data", "Theoretically derived"]).toContain(
      tiers[0].textContent,
    );
  });

  it("keeps the serif italic lead-ins as prose, not mono labels", () => {
    const container = render(createElement(ArchetypesPage));

    const entry = container.querySelector("[data-archetype-entry]")!;
    const leadIns = Array.from(entry.querySelectorAll("em[data-lead-in]"));

    // Issue #136's "the one thing not to redesign". Turning these into mono
    // labels turns a reference into a spec sheet, and nothing else in this
    // file would fail if someone did.
    expect(leadIns.map((el) => el.textContent)).toEqual([
      "Internal tension.",
      "Traditions.",
    ]);
    for (const em of leadIns) {
      expect(classes(em)).toContain("font-serif");
      expect(classes(em)).toContain("italic");
      expect(classes(em)).not.toContain("label");
      expect(classes(em)).not.toContain("label-nav");
    }

    // Selecting every `em` instead would sweep in a different device: markdown
    // emphasis inside the traditions prose. `popular-egalitarian` italicises
    // `*Ujamaa*`, `social-democrat` `*ostpolitik*` — foreign terms inside sans
    // body copy, which `TraditionsProse` renders sans on purpose. Asserting
    // `font-serif` over that set reds the suite on correct markup.
    //
    // Scoped to the band rather than to the first entry: `radical-egalitarian`
    // leads the display order and its traditions carry links only, no emphasis
    // at all. Scoped to the band rather than the page for the opposite reason —
    // `SpoilerNote` in the header renders its own serif italic lead-in, which
    // is a lead-in and not markdown emphasis.
    const bodyEm = Array.from(
      container.querySelectorAll("[data-archetypes-band] em:not([data-lead-in])"),
    );
    expect(bodyEm.length).toBeGreaterThan(0);
    expect(classes(bodyEm[0])).not.toContain("font-serif");
  });

  it("labels the axis-position disclosure in mono", () => {
    const container = render(createElement(ArchetypesPage));

    const summary = container.querySelector("[data-archetype-entry] summary")!;
    expect(summary.textContent).toContain("Axis positions");
    expect(classes(summary)).toContain("label");
    expect(classes(summary)).toContain("text-text-label");
  });

  it("keeps every entry addressable by id for :target deep links", () => {
    const container = render(createElement(ArchetypesPage));

    const ids = Array.from(container.querySelectorAll("[data-archetype-entry]")).map(
      (el) => el.id,
    );

    // `/results#<archetype-id>` relies on these, and issue #136 calls the
    // :target highlight out by name as a thing that must survive.
    expect(ids).toEqual([...archetypes].sort((a, b) => a.displayOrder - b.displayOrder).map((a) => a.id));
    expect(classes(container.querySelector("[data-archetype-entry]")!)).toContain("scroll-mt-20");
  });
});

describe("/archetypes mode-stepping marks", () => {
  it("routes the glyph and the prototype shape through the stepping token", () => {
    const container = render(createElement(ArchetypesPage));

    const glyph = container.querySelector("[data-archetype-index] [role='img']")!;
    expect(glyph.getAttribute("style")).toContain("var(--mark-primary)");
    // `--stone-600` is one hex in both modes. Task 4 moved the legend glyph
    // beside this one onto `text-mark-primary`, which steps 600 → 400 on a
    // dark ground — so leaving these on the fixed value put two different
    // browns on the same row, in a page that draws the same mark three times.
    expect(glyph.getAttribute("style")).not.toContain("var(--stone-600)");

    const shape = container.querySelector("[data-archetype-entry] [data-prototype-shape]")!;
    expect(shape.getAttribute("style")).toContain("var(--mark-primary)");
    expect(shape.getAttribute("style")).not.toContain("var(--stone-600)");
  });
});

describe("/archetypes footer", () => {
  it("closes with the filled primary assessment button", () => {
    const container = render(createElement(ArchetypesPage));

    const cta = container.querySelector("[data-reference-cta] a")!;
    expect(cta.getAttribute("href")).toBe("/quiz");
    expect(cta.textContent).toBe("Begin the assessment");
    expect(classes(cta)).toContain("bg-button-primary");
    // It shipped as an outlined ghost link. 7c draws ink, and CLAUDE.md
    // reserves ink for exactly this action.
    expect(classes(cta)).not.toContain("border-border-primary");
  });

  it("runs the footer nav as one mono row", () => {
    const container = render(createElement(ArchetypesPage));

    const nav = container.querySelector("[data-reference-secondary]")!;
    expect(classes(nav)).toContain("mono-meta");
    expect(classes(nav)).toContain("text-text-label");
    expect(nav.textContent).toContain("Back to references");
    expect(nav.textContent).toContain("Back to top");
  });

  it("points the back-to-top link at an anchor that exists", () => {
    const container = render(createElement(ArchetypesPage));

    const top = Array.from(
      container.querySelectorAll<HTMLAnchorElement>("[data-reference-secondary] a"),
    ).find((a) => a.getAttribute("href") === "#top");

    expect(top).toBeDefined();
    // Task 3 moved `id="top"` from the deleted <article> onto <main>. If the
    // move were missed the link would still render and still do nothing.
    expect(container.querySelector("#top")).not.toBeNull();
  });
});
