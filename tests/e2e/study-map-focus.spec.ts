import { test, expect } from "@playwright/test";

/**
 * Issue #154: the study map's keyboard focus cue. An `outline` on an SVG path
 * is drawn around its bounding box, which the map's own SVG clipped on four of
 * nine regions and which read as two horizontal rules across the map on the
 * wide ones. The cue is a stroke that follows the geometry, drawn by the
 * `focus-stroke` utility. No unit test computes a stylesheet rule — jsdom does
 * not — so this is the only thing that proves the stroke paints and the
 * outline does not.
 */
test.describe("study map keyboard focus", () => {
  test("a focused region takes the stroke cue and no bounding-box outline", async ({
    page,
  }) => {
    await page.goto("/study/personas");
    const regions = page.locator("path.rsm-geography[tabindex='0']");
    await expect
      .poll(async () => regions.count(), { timeout: 20_000 })
      .toBeGreaterThan(0);

    // Keyboard, not `locator.focus()`: `:focus-visible` is what the cue hangs
    // on, and only a real key press is guaranteed to set it.
    const first = regions.first();
    const ariaLabel = await first.getAttribute("aria-label");
    for (let i = 0; i < 80; i += 1) {
      await page.keyboard.press("Tab");
      const active = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? el.getAttribute("aria-label") : null;
      });
      if (active === ariaLabel) break;
    }
    await expect(first).toBeFocused();

    const computed = await first.evaluate((el) => {
      const cs = getComputedStyle(el);
      const ring = getComputedStyle(document.documentElement)
        .getPropertyValue("--focus-ring")
        .trim();
      const probe = document.createElement("div");
      probe.style.color = ring;
      document.body.appendChild(probe);
      const ringRgb = getComputedStyle(probe).color;
      probe.remove();
      return {
        stroke: cs.stroke,
        strokeWidth: cs.strokeWidth,
        outlineStyle: cs.outlineStyle,
        focusVisible: el.matches(":focus-visible"),
        ringRgb,
      };
    });

    expect(computed.focusVisible).toBe(true);
    expect(computed.stroke).toBe(computed.ringRgb);
    expect(computed.strokeWidth).toBe("2px");
    expect(computed.outlineStyle).toBe("none");
  });
});
