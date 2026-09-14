import { test, expect, type Page } from "@playwright/test";
import { forcedChoiceItems } from "@/data/forced-choice-items";
import { scaledItems } from "@/data/scaled-items";
import { LAST_RESULTS_KEY } from "@/lib/last-results";
import { encodeResponses } from "@/lib/response-codec";

/**
 * Two complete, distinct response sets: one standing in for the visitor's own
 * completed quiz, one for the link a friend sent them.
 */
const MINE = encodeResponses({
  forcedChoice: Object.fromEntries(forcedChoiceItems.map((i) => [i.id, "A" as const])),
  scaled: Object.fromEntries(scaledItems.map((i) => [i.id, 2 as const])),
  budget: { 1: 8, 2: 7, 3: 7, 4: 7, 5: 7, 6: 7, 7: 7 },
});

const THEIRS = encodeResponses({
  forcedChoice: Object.fromEntries(forcedChoiceItems.map((i) => [i.id, "B" as const])),
  scaled: Object.fromEntries(scaledItems.map((i) => [i.id, 4 as const])),
  budget: { 1: 7, 2: 7, 3: 7, 4: 7, 5: 7, 6: 7, 7: 8 },
});

function storedResults(page: Page, key: string): Promise<string | null> {
  return page.evaluate((k) => window.localStorage.getItem(k), key);
}

/**
 * Rendered markup is not proof that the page's effects have run — the write
 * this suite is guarding against used to land a beat after "Assessment
 * results" appeared. Toggling the compare input forces a post-mount event
 * through React, which cannot be handled before the mount effects flush.
 */
async function waitForEffects(page: Page): Promise<void> {
  await expect(page.getByText("Assessment results")).toBeVisible();
  await page.getByRole("button", { name: "Compare with someone" }).click();
  await expect(page.getByPlaceholder("Paste their results link")).toBeVisible();
}

test.describe("Results Page", () => {
  test("shows 404 for invalid profile", async ({ page }) => {
    await page.goto("/results/nonexistent-id");
    await expect(page.getByText("404")).toBeVisible();
  });

  /**
   * The compass square is the one piece of this page whose correctness is a
   * LAYOUT fact, and the only gate that can see layout is this one.
   *
   * Task 9 sized it in viewBox units and asserted `max-w-[400px]` on the svg in
   * jsdom, which reads green whatever the element actually renders at. It
   * rendered at 225px: the svg's flex wrapper had no width of its own, so it
   * shrink-wrapped its child and the percentage width resolved against a
   * shrink-to-fit box, falling back to the 300px default of a replaced element.
   *
   * The unit guard now pins the cap and the width to the same element, but that
   * pins CompassPlot's own shape — and the defect was a containing block, which
   * lives at the CALL SITE. Wrapping <CompassPlot/> in a bare <div> reproduces
   * it exactly with the whole unit suite green. Only a real box measurement
   * closes that, so it is asserted here, at a viewport wide enough that the
   * 400px cap is the binding constraint rather than the column.
   */
  test("renders the compass plot square at its full 300px", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto(`/results?r=${MINE}`);
    await expect(page.getByRole("heading", { name: "Compass plot" })).toBeVisible();

    const frame = page.locator("[data-compass-frame]");
    await expect(frame).toBeVisible();
    const box = (await frame.boundingBox())!;

    // 300 viewBox units of a 400-unit box rendered at its 400px cap, plus the
    // frame's own 1px stroke — boundingBox() measures the stroke box, so the
    // observed value is 301, not 300. The window is +/-2 rather than exact so
    // that a stroke-width change is not a false failure; what it has to
    // separate is 300 from the 225 this rendered at before the fix, and from
    // the 288 it would render at if the cap regressed to Tailwind's max-w-sm.
    expect(box.width).toBeGreaterThan(298);
    expect(box.width).toBeLessThan(303);
    expect(box.height).toBeGreaterThan(298);
    expect(box.height).toBeLessThan(303);
  });

  // Issue #58: the page used to persist every `?r=` it rendered, so opening a
  // shared link silently replaced the visitor's own results with the sender's.
  test("opening a shared link leaves your own saved results alone", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(
      ([key, value]) => window.localStorage.setItem(key, value),
      [LAST_RESULTS_KEY, MINE]
    );

    await page.goto(`/results?r=${THEIRS}`);
    await waitForEffects(page);

    expect(await storedResults(page, LAST_RESULTS_KEY)).toBe(MINE);
    await expect(page.getByRole("link", { name: "Results", exact: true })).toHaveAttribute(
      "href",
      `/results?r=${MINE}`
    );
  });

  test("a shared link does not become the results of a visitor who has none", async ({ page }) => {
    await page.goto(`/results?r=${THEIRS}`);
    await waitForEffects(page);

    expect(await storedResults(page, LAST_RESULTS_KEY)).toBeNull();
    // Nothing of their own to return to, so the nav still offers the quiz.
    await expect(page.getByRole("link", { name: "Quiz", exact: true })).toBeVisible();
  });
});
