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
