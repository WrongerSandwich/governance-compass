/**
 * @vitest-environment jsdom
 *
 * The shared reference-page chrome (design delta phase 5, mock 7c): the
 * header, the spoiler advisory, and the footer CTA that four pages repeat.
 */
import { afterEach, describe, expect, it } from "vitest";
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PageHeader, SpoilerNote } from "@/components/PageHeader";
import { ReferenceCta } from "@/components/ReferenceCta";
import { AppRouterContext, ROUTER_STUB } from "../helpers/client-component-env";
import ReferencesPage from "@/app/references/page";
import MethodologyPage from "@/app/methodology/page";
import AxesPage from "@/app/axes/page";
import QuestionsPage from "@/app/questions/page";
import { DOMAIN_MARK_VARS } from "@/lib/design-tokens";

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

/** Class tokens of an element, so assertions cannot pass on a substring. */
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

describe("PageHeader", () => {
  it("renders a plain eyebrow when given no href", () => {
    const container = render(
      createElement(PageHeader, { kicker: "Reference", title: "References" }),
    );

    const kicker = container.querySelector("[data-page-kicker]")!;
    expect(kicker.tagName).toBe("P");
    expect(container.querySelector("[data-page-kicker] a")).toBeNull();
    expect(kicker.textContent).toBe("Reference");
    expect(classes(kicker)).toContain("label-eyebrow");
    expect(classes(kicker)).toContain("text-text-label");
    // The token this replaced. It is 3.28:1 on surface-1 in BOTH modes, so
    // the swap is the whole point of the assertion above.
    expect(classes(kicker)).not.toContain("text-text-tertiary");
  });

  it("renders the kicker as a back-link when given an href", () => {
    const container = render(
      createElement(PageHeader, {
        kicker: "← Reference",
        kickerHref: "/references",
        title: "The twelve axes",
      }),
    );

    const link = container.querySelector("[data-page-kicker] a")!;
    expect(link.getAttribute("href")).toBe("/references");
    expect(link.textContent).toBe("← Reference");
    expect(classes(link)).toContain("label-eyebrow");
    expect(classes(link)).toContain("focus-ring");
  });

  it("sets the title at the page display size", () => {
    const container = render(
      createElement(PageHeader, { kicker: "Reference", title: "References" }),
    );

    const h1 = container.querySelector("h1")!;
    expect(h1.textContent).toBe("References");
    expect(classes(h1)).toContain("display-page");
    // 28px was the pre-delta size at all five call sites; 7c draws 40px, and
    // `display-page` is the only role that carries it.
    expect(classes(h1)).not.toContain("text-[28px]");
  });

  it("renders lead paragraphs at the mock's 15px, not the 14px they were", () => {
    const container = render(
      createElement(PageHeader, {
        kicker: "Reference",
        title: "Governance archetypes",
        lead: ["First paragraph.", "Second paragraph."],
      }),
    );

    const leads = container.querySelectorAll("[data-page-lead]");
    expect(leads.length).toBe(2);
    expect(leads[0].textContent).toBe("First paragraph.");
    expect(leads[1].textContent).toBe("Second paragraph.");
    expect(classes(leads[0])).toContain("text-[15px]");
    expect(classes(leads[0])).toContain("text-text-secondary");
  });

  it("omits the lead block entirely when there is no lead", () => {
    const container = render(
      createElement(PageHeader, { kicker: "Methodology", title: "How it works" }),
    );

    expect(container.querySelectorAll("[data-page-lead]").length).toBe(0);
  });
});

describe("SpoilerNote", () => {
  it("draws the advisory as a warning stripe with no fill", () => {
    // createElement's typed overload requires `children` in the props object
    // here; the rule assumes JSX, where this would be the third argument
    // instead.
    // eslint-disable-next-line react/no-children-prop
    const container = render(createElement(SpoilerNote, { children: "body" }));

    const note = container.querySelector("[data-spoiler-note]")!;
    expect(classes(note)).toContain("border-l-2");
    expect(classes(note)).toContain("border-warning");
    // Mock 7c draws a stripe over the page ground. The tinted wash that
    // `/questions` carried is what this must NOT reintroduce, and it is the
    // half of the convergence a border assertion alone would miss.
    expect(classes(note).some((c) => c.startsWith("bg-"))).toBe(false);
    expect(note.getAttribute("style")).toBeNull();
  });

  it("sets the serif italic lead-in in the warning ink", () => {
    // See the sibling test above.
    const container = render(
      // eslint-disable-next-line react/no-children-prop
      createElement(SpoilerNote, {
        leadIn: "A note before reading —",
        children: "body",
      }),
    );

    const em = container.querySelector("[data-spoiler-note] em")!;
    expect(em.textContent).toBe("A note before reading —");
    expect(classes(em)).toContain("font-serif");
    expect(classes(em)).toContain("italic");
    expect(classes(em)).toContain("text-warning-text");
  });
});

describe("ReferenceCta", () => {
  it("routes the assessment call through the filled primary button", () => {
    const container = render(createElement(ReferenceCta, { secondary: null }));

    const cta = container.querySelector("[data-reference-cta] a")!;
    expect(cta.getAttribute("href")).toBe("/quiz");
    expect(classes(cta)).toContain("bg-button-primary");
    expect(classes(cta)).toContain("control");
    // The pre-delta spelling, which does not invert: on a dark ground it
    // stayed a mid-brown fill under white text.
    expect(classes(cta)).not.toContain("bg-stone-600");
    expect(classes(cta)).not.toContain("text-white");
  });

  it("renders the optional secondary line below the button", () => {
    const container = render(
      createElement(ReferenceCta, {
        secondary: createElement("a", { href: "/methodology" }, "read the methodology"),
      }),
    );

    const secondary = container.querySelector("[data-reference-secondary]")!;
    expect(secondary.textContent).toContain("read the methodology");
    expect(classes(secondary)).toContain("mono-meta");
    expect(classes(secondary)).toContain("text-text-label");
  });

  it("wraps the secondary links in a navigation landmark when labelled", () => {
    const container = render(
      createElement(ReferenceCta, {
        secondaryLabel: "Page navigation",
        secondary: createElement("a", { href: "/references" }, "Back to references"),
      }),
    );

    const secondary = container.querySelector("[data-reference-secondary]")!;
    // /archetypes replaced a hand-rolled <nav aria-label="Page navigation">
    // with this component. Dropping to a <p> silently removed a landmark a
    // screen-reader user could navigate to, on the one consumer whose footer
    // carries more than one link.
    expect(secondary.tagName).toBe("NAV");
    expect(secondary.getAttribute("aria-label")).toBe("Page navigation");
    expect(classes(secondary)).toContain("mono-meta");
  });

  it("leaves an unlabelled secondary line as a paragraph, not a landmark", () => {
    const container = render(
      createElement(ReferenceCta, {
        secondary: createElement("a", { href: "/methodology" }, "read the methodology"),
      }),
    );

    const secondary = container.querySelector("[data-reference-secondary]")!;
    // A landmark around a single link is noise, so /methodology and /axes
    // pass no label and keep the paragraph.
    expect(secondary.tagName).toBe("P");
    expect(secondary.getAttribute("aria-label")).toBeNull();
  });

  it("omits the secondary line when there is none", () => {
    const container = render(createElement(ReferenceCta, { secondary: null }));

    expect(container.querySelector("[data-reference-secondary]")).toBeNull();
  });
});

describe("/references", () => {
  it("opens on the shared header at the reference measure", () => {
    const container = render(createElement(ReferencesPage));

    expect(container.querySelector("h1")!.textContent).toBe("References");
    expect(classes(container.querySelector("h1")!)).toContain("display-page");
    expect(classes(container.querySelector("article")!)).toContain("max-w-reference");
  });

  it("routes its CTA through the primary button", () => {
    const container = render(createElement(ReferencesPage));

    const cta = container.querySelector("[data-reference-cta] a")!;
    expect(classes(cta)).toContain("bg-button-primary");
    expect(classes(cta)).not.toContain("bg-stone-600");
  });

  it("sets the card titles at the small display size", () => {
    const container = render(createElement(ReferencesPage));

    const h2 = container.querySelector("h2")!;
    expect(classes(h2)).toContain("display-s");
    expect(classes(h2)).not.toContain("text-[17px]");
  });
});

describe("/methodology", () => {
  it("opens on the shared header", () => {
    const container = render(createElement(MethodologyPage));

    expect(container.querySelector("h1")!.textContent).toBe(
      "How The Governance Compass works",
    );
    expect(classes(container.querySelector("h1")!)).toContain("display-page");
  });

  it("sets its section headings at the entry display size", () => {
    const container = render(createElement(MethodologyPage));

    for (const h2 of container.querySelectorAll("h2")) {
      expect(classes(h2)).toContain("display-entry");
      expect(classes(h2)).not.toContain("text-[18px]");
    }
  });

  it("runs the section jump nav in the mono nav layer", () => {
    const container = render(createElement(MethodologyPage));

    const nav = container.querySelector("nav[aria-label='Page sections']")!;
    expect(classes(nav)).toContain("label-nav");
    expect(classes(nav)).toContain("text-text-label");
    expect(classes(nav)).not.toContain("text-text-tertiary");
  });
});

describe("/axes", () => {
  it("opens on the shared header with a back-link kicker", () => {
    const container = render(createElement(AxesPage));

    const link = container.querySelector("[data-page-kicker] a")!;
    expect(link.getAttribute("href")).toBe("/references");
    expect(classes(container.querySelector("h1")!)).toContain("display-page");
  });

  it("draws every domain mark off the stepping token, not a fixed hex", () => {
    const container = render(createElement(AxesPage));

    const heads = container.querySelectorAll<HTMLElement>("[data-domain-head]");
    expect(heads.length).toBe(4);
    const used = Array.from(heads).map((el) => el.style.color);

    // A fixed hex renders the same in both modes, so a dark-ground check is
    // the only thing that would otherwise catch this — and there isn't one.
    expect(used).toEqual(Object.values(DOMAIN_MARK_VARS));
    for (const value of used) expect(value).not.toMatch(/#[0-9a-f]{6}/i);
  });

  it("sets axis names at the small display size and their questions in the caption role", () => {
    const container = render(createElement(AxesPage));

    const h3 = container.querySelector("h3")!;
    expect(classes(h3)).toContain("display-s");

    const question = container.querySelector("[data-axis-question]")!;
    expect(classes(question)).toContain("caption-italic");
    // `caption-italic` declares its own colour; layering one beside it makes
    // the rendered value depend on Tailwind's emitted order.
    expect(classes(question).some((c) => c.startsWith("text-text-"))).toBe(false);
  });

  it("routes its CTA through the primary button", () => {
    const container = render(createElement(AxesPage));

    const cta = container.querySelector("[data-reference-cta] a")!;
    expect(classes(cta)).toContain("bg-button-primary");
    expect(classes(cta)).not.toContain("bg-stone-600");
  });
});

describe("/questions", () => {
  it("opens on the shared header with a back-link kicker", () => {
    const container = render(createElement(QuestionsPage));

    expect(container.querySelector("[data-page-kicker] a")!.getAttribute("href")).toBe(
      "/references",
    );
    expect(classes(container.querySelector("h1")!)).toContain("display-page");
  });

  it("draws the spoiler advisory on the shared warning stripe, with no off-palette wash", () => {
    const container = render(createElement(QuestionsPage));

    const note = container.querySelector("[data-spoiler-note]")!;
    expect(classes(note)).toContain("border-warning");
    // D22. `#b5942e` and its rgba wash are not in the palette at all — the
    // page carried its own third hue, and a fixed low-alpha tint cannot
    // follow the surface into dark mode either way.
    expect(note.getAttribute("style")).toBeNull();
    // Both halves of the old inline style, spelled the way jsdom serialises
    // them. A hex in an inline style is normalised to `rgb()` before it
    // reaches `innerHTML`, so asserting on `b5942e` would have been dead —
    // it can never appear, whatever the source says.
    expect(container.innerHTML).not.toContain("181, 148, 46");
    expect(container.innerHTML).not.toContain("rgba(181, 148, 46");
  });

  it("draws every domain mark off the stepping token", () => {
    const container = render(createElement(QuestionsPage));

    const marks = Array.from(
      container.querySelectorAll<HTMLElement>("[data-domain-mark]"),
    ).map((el) => el.style.color);

    expect(marks.length).toBeGreaterThan(0);
    for (const value of marks) {
      expect(value).toMatch(/^var\(--/);
      expect(value).not.toMatch(/#[0-9a-f]{6}/i);
    }
  });

  it("puts the budget heading on the unified mark rather than a Stone literal", () => {
    const container = render(createElement(QuestionsPage));

    const budget = container.querySelector("#budget h2")!;
    // It was `style={{ color: "#85735e" }}` — Stone 600 frozen as a hex, on
    // a heading that sits beside four domain headings that now all step.
    expect((budget as HTMLElement).style.color).toBe("var(--mark-primary)");
    // `#85735e` normalised. The hex spelling never survives into innerHTML,
    // so this is the only form of the assertion that can fail. A `var()`
    // reference is passed through unresolved, which is why the positive
    // assertion above and this negative do not contradict each other.
    expect(container.innerHTML).not.toContain("133, 115, 94");
  });

  it("keeps every scoring chip on a sharp corner", () => {
    const container = render(createElement(QuestionsPage));

    const chips = container.querySelectorAll("[data-scoring-chip]");
    expect(chips.length).toBeGreaterThan(0);
    for (const chip of chips) {
      expect(classes(chip)).toContain("rounded-sharp");
      expect(classes(chip)).not.toContain("rounded");
    }
  });
});
