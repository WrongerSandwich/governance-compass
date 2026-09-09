/**
 * @vitest-environment jsdom
 *
 * The nav bar's delta-01 treatment, and the IA that must survive it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

// Mutable knobs the mocked hooks read from at call time. `vi.resetModules()`
// forces a fresh import (and thus a fresh call into these factories) per
// render, so tests set these before rendering rather than baking fixed
// values into the mocks.
let mockPathname = "/";
let mockResultsHref: string | null = null;

vi.mock("next/navigation", () => ({ usePathname: () => mockPathname }));
vi.mock("@/lib/last-results", () => ({
  lastResultsHref: () => mockResultsHref,
  useLastResults: () => mockResultsHref,
}));

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: { container: HTMLDivElement; root: Root }[] = [];

async function renderNav() {
  // vmForks shares a module registry per worker, so reset before the dynamic
  // import to keep these mocks from colliding with other specs.
  vi.resetModules();
  const { NavBar } = await import("@/components/NavBar");
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(createElement(NavBar)));
  mounted.push({ container, root });
  return container;
}

function click(target: EventTarget) {
  act(() => target.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

function mousedown(target: EventTarget) {
  act(() => target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })));
}

function escape(target: EventTarget) {
  act(() =>
    target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" })),
  );
}

beforeEach(() => {
  mockPathname = "/";
  mockResultsHref = null;
});

afterEach(() => {
  while (mounted.length) {
    const entry = mounted.pop()!;
    act(() => entry.root.unmount());
    entry.container.remove();
  }
});

describe("nav bar chrome", () => {
  it("sets the wordmark in the mono wordmark role", async () => {
    const container = await renderNav();
    const wordmark = container.querySelector(".wordmark")!;

    expect(wordmark).not.toBeNull();
    expect(wordmark.textContent).toBe("Governance Compass");
  });

  it("stands 54px tall", async () => {
    const container = await renderNav();

    expect(container.querySelector(".h-\\[54px\\]")).not.toBeNull();
  });

  it("labels every nav destination with the 0.10em mono nav role", async () => {
    const container = await renderNav();

    // Closed state has exactly two: the Quiz link and the Research trigger.
    expect(container.querySelectorAll(".label-nav")).toHaveLength(2);
  });

  it("gives every interactive element in the nav the designed focus ring", async () => {
    // The brand link was missed the first time and fell back to the browser
    // default ring, which is exactly the kind of gap a per-element assertion
    // does not catch. Enumerate instead.
    const container = await renderNav();
    const trigger = container.querySelector("button[aria-haspopup='menu']")!;
    act(() => trigger.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    const missing = [...container.querySelectorAll("a, button")]
      .filter((el) => !el.className.split(/\s+/).includes("focus-ring"))
      .map((el) => el.textContent?.trim() ?? el.tagName);

    expect(missing).toEqual([]);
  });

  it("keeps the Research dropdown rather than hoisting its children", async () => {
    const container = await renderNav();
    const trigger = container.querySelector("button[aria-haspopup='menu']")!;

    expect(trigger.textContent).toContain("Research");
    expect(container.querySelector("[role='menu']")).toBeNull();

    act(() => trigger.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    const items = [...container.querySelectorAll("[role='menuitem']")];
    expect(items.map((item) => item.textContent)).toEqual([
      "Methodology",
      "Synthetic Study",
      "References",
    ]);
    for (const item of items) {
      expect(item.className).toContain("label-nav");
    }
  });

  describe("the Quiz/Results conditional link", () => {
    it("shows Quiz and hides Results when there are no stored results", async () => {
      mockResultsHref = null;
      const container = await renderNav();

      const quiz = [...container.querySelectorAll("a")].find(
        (a) => a.textContent === "Quiz",
      );
      expect(quiz).toBeDefined();
      expect(quiz?.getAttribute("href")).toBe("/quiz");

      const results = [...container.querySelectorAll("a")].find(
        (a) => a.textContent === "Results",
      );
      expect(results).toBeUndefined();
    });

    it("shows Results carrying the stored href and hides Quiz once results exist", async () => {
      mockResultsHref = "/results?r=ABC123";
      const container = await renderNav();

      const results = [...container.querySelectorAll("a")].find(
        (a) => a.textContent === "Results",
      );
      expect(results).toBeDefined();
      expect(results?.getAttribute("href")).toBe("/results?r=ABC123");

      const quiz = [...container.querySelectorAll("a")].find(
        (a) => a.textContent === "Quiz",
      );
      expect(quiz).toBeUndefined();
    });
  });

  describe("aria-current", () => {
    it("marks the wordmark link current at /", async () => {
      mockPathname = "/";
      const container = await renderNav();
      const home = container.querySelector("a[href='/']")!;

      expect(home.getAttribute("aria-current")).toBe("page");
    });

    it("marks Quiz current at /quiz", async () => {
      mockPathname = "/quiz";
      mockResultsHref = null;
      const container = await renderNav();
      const quiz = container.querySelector("a[href='/quiz']")!;

      expect(quiz.getAttribute("aria-current")).toBe("page");
    });

    it("marks Results current at /results", async () => {
      mockPathname = "/results";
      mockResultsHref = "/results?r=ABC123";
      const container = await renderNav();
      const results = container.querySelector("a[href='/results?r=ABC123']")!;

      expect(results.getAttribute("aria-current")).toBe("page");
    });
  });

  describe("the Research trigger's active underline", () => {
    const RESEARCH_PATHS = [
      "/methodology",
      "/study",
      "/references",
      "/axes",
      "/questions",
      "/archetypes",
    ];

    it("shows border-b-2 for every research path", async () => {
      for (const path of RESEARCH_PATHS) {
        mockPathname = path;
        mockResultsHref = null;
        const container = await renderNav();
        const trigger = container.querySelector("button[aria-haspopup='menu']")!;

        expect(trigger.className, `path: ${path}`).toContain("border-b-2");
      }
    });

    it("has no active underline outside research paths (/quiz)", async () => {
      mockPathname = "/quiz";
      mockResultsHref = null;
      const container = await renderNav();
      const trigger = container.querySelector("button[aria-haspopup='menu']")!;

      expect(trigger.className).not.toContain("border-b-2");
    });
  });

  describe("outside-click closing", () => {
    it("closes on a mousedown outside the menu wrapper", async () => {
      const container = await renderNav();
      const trigger = container.querySelector("button[aria-haspopup='menu']")!;
      click(trigger);
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
      expect(container.querySelector("[role='menu']")).not.toBeNull();

      mousedown(document.body);

      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      expect(container.querySelector("[role='menu']")).toBeNull();
    });

    it("does not close on a mousedown inside the panel", async () => {
      const container = await renderNav();
      const trigger = container.querySelector("button[aria-haspopup='menu']")!;
      click(trigger);
      const panel = container.querySelector("[role='menu']")!;
      expect(panel).not.toBeNull();

      mousedown(panel);

      expect(trigger.getAttribute("aria-expanded")).toBe("true");
      expect(container.querySelector("[role='menu']")).not.toBeNull();
    });
  });

  describe("Escape closing", () => {
    it("closes the menu and returns focus to the trigger", async () => {
      const container = await renderNav();
      const trigger = container.querySelector(
        "button[aria-haspopup='menu']",
      ) as HTMLButtonElement;
      click(trigger);
      expect(container.querySelector("[role='menu']")).not.toBeNull();

      escape(document);

      expect(container.querySelector("[role='menu']")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });

  describe("key={pathname} remount", () => {
    it("remounts (not merely resets) the Research menu when the pathname changes", async () => {
      const container = await renderNav();
      const { root } = mounted[mounted.length - 1]!;
      const { NavBar } = await import("@/components/NavBar");

      const triggerBefore = container.querySelector(
        "button[aria-haspopup='menu']",
      ) as HTMLButtonElement;
      click(triggerBefore);
      expect(container.querySelector("[role='menu']")).not.toBeNull();

      mockPathname = "/methodology";
      act(() => root.render(createElement(NavBar)));

      expect(container.querySelector("[role='menu']")).toBeNull();
      const triggerAfter = container.querySelector("button[aria-haspopup='menu']");
      expect(triggerAfter).not.toBeNull();
      expect(triggerAfter).not.toBe(triggerBefore);
    });
  });
});
