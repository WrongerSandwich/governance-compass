/**
 * @vitest-environment jsdom
 *
 * `/compare`'s chrome after the phase 5 sweep. The score bar itself converged
 * in phase 4 and is covered by results-chrome.test.ts; this file covers the
 * page around it.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { AlignmentScore } from "@/components/comparison/AlignmentScore";
import { AppRouterContext, ROUTER_STUB } from "../helpers/client-component-env";
import { classes, createRenderHarness } from "../helpers/react-dom";

const { cleanup, render } = createRenderHarness({
  wrap: (element) =>
    createElement(AppRouterContext.Provider, { value: ROUTER_STUB }, element),
});

const comparePage = readFileSync(
  resolve(process.cwd(), "src/app/compare/page.tsx"),
  "utf8",
);
const profileComparePage = readFileSync(
  resolve(process.cwd(), "src/app/compare/[profileId1]/[profileId2]/page.tsx"),
  "utf8",
);

afterEach(cleanup);

describe("AlignmentScore", () => {
  it("sets the headline number in the display scale, not a loose literal", () => {
    const container = render(createElement(AlignmentScore, { score: 72 }));

    const value = container.querySelector("[data-alignment-value]")!;
    expect(value.textContent).toBe("72%");
    expect(classes(value)).toContain("display-l");
    expect(classes(value)).not.toContain("text-[36px]");
  });

  it("labels the number in the mono layer at a colour that clears AA", () => {
    const container = render(createElement(AlignmentScore, { score: 72 }));

    const label = container.querySelector("[data-alignment-label]")!;
    expect(classes(label)).toContain("label-eyebrow");
    expect(classes(label)).toContain("text-text-label");
    expect(classes(label)).not.toContain("text-text-tertiary");
  });

  it("still announces the unavailable case", () => {
    const container = render(createElement(AlignmentScore, { score: null }));

    expect(container.querySelector("[data-alignment-value]")!.textContent).toBe("—");
    expect(container.firstElementChild!.getAttribute("aria-label")).toBe(
      "Overall alignment unavailable: no shared axes",
    );
  });
});

describe("/compare chrome", () => {
  it("holds the comparison column on the results measure", () => {
    // Both compare routes show the same twelve-axis breakdown the results page
    // shows, so they take the results width rather than the narrower reference
    // one. Asserted at the source: the page is a client component behind
    // useSearchParams and does not render standalone here.
    expect(comparePage).toContain("max-w-results");
    expect(comparePage).not.toContain("max-w-3xl");
    expect(profileComparePage).toContain("max-w-results");
    expect(profileComparePage).not.toContain("max-w-3xl");
  });

  it("drops the legend sentence the per-readout swatches replaced", () => {
    // Phase 4 Task 6 gave each readout its own swatch, which says what this
    // sentence said. Deleting it was the recorded preference over writing a
    // guard for copy that was already redundant.
    expect(comparePage).not.toContain("Filled dot is you");
  });

  it("draws its domain rules off the stepping token", () => {
    expect(comparePage).toContain("DOMAIN_MARK_VARS");
    expect(comparePage).not.toContain("domain[600]");
  });

  it("keeps no sub-AA tertiary text on either compare route", () => {
    expect(comparePage).not.toContain("text-text-tertiary");
    expect(profileComparePage).not.toContain("text-text-tertiary");
  });

  it("keeps no frozen Stone ramp class on either compare route", () => {
    for (const source of [comparePage, profileComparePage]) {
      expect(source).not.toMatch(/(?:text|bg|border)-stone-\d{2,3}(?![\w-])/);
    }
  });
});
