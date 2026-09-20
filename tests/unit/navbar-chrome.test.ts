/**
 * @vitest-environment jsdom
 *
 * The nav bar's delta-01 treatment, and the IA that must survive it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRenderHarness } from "../helpers/react-dom";

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

const { cleanup, render, rerender } = createRenderHarness();

async function renderNav() {
  vi.resetModules();
  const { NavBar } = await import("@/components/NavBar");
  return render(createElement(NavBar));
}

function click(target: EventTarget) {
  act(() =>
    target.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    ),
  );
}

function mousedown(target: EventTarget) {
  act(() => target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })));
}

function escape(target: EventTarget) {
  act(() =>
    target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" })),
  );
}

function tab(target: EventTarget, shiftKey = false) {
  act(() =>
    target.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "Tab",
        shiftKey,
      }),
    ),
  );
}

beforeEach(() => {
  mockPathname = "/";
  mockResultsHref = null;
});

afterEach(cleanup);

describe("nav bar chrome", () => {
  it("sets the wordmark in the mono wordmark role", async () => {
    const container = await renderNav();
    // `wordmark-sm` is the unprefixed base; `wordmark` now only arrives
    // through the 560px variant, so it is not a class token on its own.
    const wordmark = container.querySelector(".wordmark-sm")!;

    expect(wordmark).not.toBeNull();
    expect(wordmark.textContent).toBe("Governance Compass");
  });

  it("uses the mobile bar metrics below the breakpoint", async () => {
    const container = await renderNav();
    const bar = container.querySelector(".max-w-shell")!;
    const classes = bar.className.split(/\s+/);

    // 52px at mobile, 54px from the breakpoint up (mock 6a vs 5a).
    expect(classes).toContain("h-[52px]");
    expect(classes).toContain("min-[560px]:h-[54px]");
  });

  it("exposes a 44px mobile menu trigger with its panel relationship", async () => {
    const container = await renderNav();
    const trigger = container.querySelector(
      "button[aria-controls='mobile-navigation-panel']",
    )!;

    expect(trigger).not.toBeNull();
    expect(trigger.getAttribute("aria-label")).toBe("Open navigation");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");

    const classes = trigger.className.split(/\s+/);
    expect(classes).toContain("h-11");
    expect(classes).toContain("w-11");
    expect(classes).toContain("focus-ring");
    expect(classes).toContain("min-[560px]:hidden");

    const bars = trigger.querySelectorAll("[aria-hidden='true'] > span");
    expect(bars).toHaveLength(2);
    for (const bar of bars) {
      expect(bar.className.split(/\s+/)).toContain("h-[1.5px]");
    }
  });

  it("switches from horizontal destinations to the trigger at 560px", async () => {
    const container = await renderNav();
    const desktopResearch = container.querySelector(
      "button[aria-haspopup='menu']",
    )!;
    const desktopGroup = desktopResearch.parentElement!.parentElement!;
    const trigger = container.querySelector(
      "button[aria-controls='mobile-navigation-panel']",
    )!;

    expect(desktopGroup.className.split(/\s+/)).toEqual(
      expect.arrayContaining(["hidden", "min-[560px]:flex"]),
    );
    expect(trigger.className.split(/\s+/)).toEqual(
      expect.arrayContaining(["flex", "min-[560px]:hidden"]),
    );
  });

  it("opens a flat mobile panel with the desktop destinations", async () => {
    const container = await renderNav();
    const trigger = container.querySelector(
      "button[aria-controls='mobile-navigation-panel']",
    )!;

    expect(container.querySelector("#mobile-navigation-panel")).toBeNull();
    click(trigger);

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-label")).toBe("Close navigation");
    const panel = container.querySelector("#mobile-navigation-panel")!;
    expect(panel).not.toBeNull();
    expect(panel.getAttribute("role")).toBe("dialog");
    expect(panel.getAttribute("aria-modal")).toBe("true");
    expect(panel.getAttribute("aria-label")).toBe("Navigation menu");
    expect(panel.querySelector("[role='menu']")).toBeNull();

    const links = [...panel.querySelectorAll("a")];
    expect(links.map((link) => link.textContent?.trim())).toEqual([
      "Quiz",
      "Methodology",
      "Synthetic Study",
      "References",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/quiz",
      "/methodology",
      "/study",
      "/references",
    ]);
    for (const link of links) {
      expect(link.className.split(/\s+/)).toEqual(
        expect.arrayContaining(["min-h-11", "focus-ring"]),
      );
    }
  });

  it("closes the mobile panel from the same trigger", async () => {
    const container = await renderNav();
    const trigger = container.querySelector(
      "button[aria-controls='mobile-navigation-panel']",
    )!;

    click(trigger);
    expect(container.querySelector("#mobile-navigation-panel")).not.toBeNull();

    click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector("#mobile-navigation-panel")).toBeNull();
  });

  it("carries the stored Results destination into the mobile panel", async () => {
    mockResultsHref = "/results?r=ABC123";
    const container = await renderNav();
    const trigger = container.querySelector(
      "button[aria-controls='mobile-navigation-panel']",
    )!;

    click(trigger);
    const panel = container.querySelector("#mobile-navigation-panel")!;
    const results = [...panel.querySelectorAll("a")].find(
      (link) => link.textContent?.trim() === "Results",
    );

    expect(results?.getAttribute("href")).toBe("/results?r=ABC123");
    expect(
      [...panel.querySelectorAll("a")].some(
        (link) => link.textContent?.trim() === "Quiz",
      ),
    ).toBe(false);
  });

  it("marks the stored Results destination current without comparing its query", async () => {
    mockPathname = "/results";
    mockResultsHref = "/results?r=ABC123";
    const container = await renderNav();
    const trigger = container.querySelector(
      "button[aria-controls='mobile-navigation-panel']",
    )!;

    click(trigger);
    const results = container.querySelector(
      "#mobile-navigation-panel a[href='/results?r=ABC123']",
    )!;

    expect(results.getAttribute("aria-current")).toBe("page");
  });

  it("closes the mobile panel only on an outside mousedown", async () => {
    const container = await renderNav();
    const trigger = container.querySelector(
      "button[aria-controls='mobile-navigation-panel']",
    )!;

    click(trigger);
    const panel = container.querySelector("#mobile-navigation-panel")!;
    mousedown(panel);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    mousedown(document.body);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector("#mobile-navigation-panel")).toBeNull();
  });

  it("moves focus to the first mobile destination when the panel opens", async () => {
    const container = await renderNav();
    const trigger = container.querySelector(
      "button[aria-controls='mobile-navigation-panel']",
    ) as HTMLButtonElement;

    trigger.focus();
    click(trigger);

    const firstLink = container.querySelector(
      "#mobile-navigation-panel a",
    ) as HTMLAnchorElement;
    expect(document.activeElement).toBe(firstLink);
    expect(firstLink.textContent?.trim()).toBe("Quiz");
  });

  it("closes the mobile panel on Escape and returns focus to its trigger", async () => {
    const container = await renderNav();
    const trigger = container.querySelector(
      "button[aria-controls='mobile-navigation-panel']",
    ) as HTMLButtonElement;
    click(trigger);
    expect(document.activeElement?.textContent?.trim()).toBe("Quiz");

    escape(document);

    expect(container.querySelector("#mobile-navigation-panel")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("traps focus within the mobile panel in both directions", async () => {
    const container = await renderNav();
    const trigger = container.querySelector(
      "button[aria-controls='mobile-navigation-panel']",
    )!;
    click(trigger);
    const links = [
      ...container.querySelectorAll<HTMLAnchorElement>(
        "#mobile-navigation-panel a",
      ),
    ];

    expect(document.activeElement).toBe(links[0]);
    tab(links[0], true);
    expect(document.activeElement).toBe(links.at(-1));

    tab(links.at(-1)!);
    expect(document.activeElement).toBe(links[0]);
  });

  it("remounts the mobile menu closed when the pathname changes", async () => {
    const container = await renderNav();
    const { NavBar } = await import("@/components/NavBar");
    const triggerBefore = container.querySelector(
      "button[aria-controls='mobile-navigation-panel']",
    )!;
    click(triggerBefore);
    expect(container.querySelector("#mobile-navigation-panel")).not.toBeNull();

    mockPathname = "/methodology";
    rerender(container, createElement(NavBar));

    expect(container.querySelector("#mobile-navigation-panel")).toBeNull();
    const triggerAfter = container.querySelector(
      "button[aria-controls='mobile-navigation-panel']",
    );
    expect(triggerAfter).not.toBe(triggerBefore);
  });

  it("closes the mobile panel when a destination is selected", async () => {
    const container = await renderNav();
    const trigger = container.querySelector(
      "button[aria-controls='mobile-navigation-panel']",
    )!;
    click(trigger);
    const methodology = container.querySelector(
      "#mobile-navigation-panel a[href='/methodology']",
    )!;

    methodology.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
    click(methodology);

    expect(container.querySelector("#mobile-navigation-panel")).toBeNull();
  });

  it("steps the wordmark down a size on mobile via a sibling role", async () => {
    const container = await renderNav();
    const wordmark = container.querySelector(".wordmark-sm")!;

    // `wordmark` is self-contained; layering a built-in over it is unreliable,
    // so the smaller variant is its own role. Compared token-wise, because a
    // substring match here would also accept the `-sm` variant of this class,
    // which is the opposite of what the breakpoint is for. (Spelling that
    // wrong class out in a comment is enough for Tailwind's scanner to emit
    // a dead rule for it, so it is described rather than written.)
    expect(wordmark).not.toBeNull();
    expect(wordmark.className.split(/\s+/)).toContain("min-[560px]:wordmark");
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
      const { NavBar } = await import("@/components/NavBar");

      const triggerBefore = container.querySelector(
        "button[aria-haspopup='menu']",
      ) as HTMLButtonElement;
      click(triggerBefore);
      expect(container.querySelector("[role='menu']")).not.toBeNull();

      mockPathname = "/methodology";
      rerender(container, createElement(NavBar));

      expect(container.querySelector("[role='menu']")).toBeNull();
      const triggerAfter = container.querySelector("button[aria-haspopup='menu']");
      expect(triggerAfter).not.toBeNull();
      expect(triggerAfter).not.toBe(triggerBefore);
    });
  });
});
