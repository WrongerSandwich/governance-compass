/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { Footer } from "@/components/Footer";
import { createRenderHarness } from "../helpers/react-dom";

const { cleanup, render } = createRenderHarness();

function renderFooter() {
  return render(createElement(Footer));
}

afterEach(cleanup);

describe("footer chrome", () => {
  it("sets its two groups in the sentence-case mono meta role", () => {
    const container = renderFooter();

    expect(container.querySelector(".mono-meta")).not.toBeNull();
    // `label` would uppercase the claims; mock 5a keeps them sentence case.
    expect(container.querySelector(".label")).toBeNull();
  });

  it("splits privacy claims from provenance rather than centring all four", () => {
    const container = renderFooter();
    const groups = container.querySelectorAll("[data-footer-group]");

    expect(groups.length).toBe(2);
    expect(groups[0].textContent).toBe("Privacy-first · No data sold");
    expect(groups[1].textContent).toContain("Source on GitHub");
    expect(groups[1].textContent).toContain("PolyForm Noncommercial");

    const row = container.querySelector(".mono-meta")!;
    expect(row.className.split(/\s+/)).toContain("justify-between");
  });

  it("gives both links the designed focus ring", () => {
    const container = renderFooter();
    const missing = [...container.querySelectorAll("a")]
      .filter((el) => !el.className.split(/\s+/).includes("focus-ring"))
      .map((el) => el.textContent?.trim() ?? "");

    expect(missing).toEqual([]);
  });

  it("keeps both external links attributed and safe", () => {
    const container = renderFooter();
    const anchors = [...container.querySelectorAll("a")];

    expect(anchors).toHaveLength(2);
    for (const anchor of anchors) {
      expect(anchor.getAttribute("rel")).toBe("noopener noreferrer");
      expect(anchor.getAttribute("target")).toBe("_blank");
    }
    expect(anchors.map((anchor) => anchor.getAttribute("href"))).toEqual([
      "https://github.com/WrongerSandwich/governance-compass",
      "https://polyformproject.org/licenses/noncommercial/1.0.0/",
    ]);
  });
});
