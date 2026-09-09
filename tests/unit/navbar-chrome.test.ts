/**
 * @vitest-environment jsdom
 *
 * The nav bar's delta-01 treatment, and the IA that must survive it.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/lib/last-results", () => ({
  lastResultsHref: () => null,
  useLastResults: () => null,
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
});
