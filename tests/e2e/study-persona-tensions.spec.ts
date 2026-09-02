import { test, expect } from "@playwright/test";

/**
 * Issue #61: the persona route dropped the pipeline's tension `magnitude` and
 * never populated `description`, so expanding a tension badge showed either a
 * permanent "no description" placeholder (single-model) or nothing at all
 * (dual-model). These drive the badges the way a reader would.
 */

const PLACEHOLDER = "No description available for this tension.";

test.describe("study persona tension badges", () => {
  test("expanding a tension on a single-model persona shows the narrative", async ({
    page,
  }) => {
    await page.goto("/study/personas?persona=P0002");

    const badge = page
      .getByRole("button", { name: /^(mild|moderate|strong) tension on axis \d+/ })
      .first();
    await expect(badge).toBeVisible();
    await badge.click();

    const detail = page.getByText(/budget allocation (suggests|leans|lands)/).first();
    await expect(detail).toBeVisible();
    await expect(page.getByText(PLACEHOLDER)).toHaveCount(0);
  });

  test("expanding a per-model tension on a shared persona shows that model's narrative", async ({
    page,
  }) => {
    await page.goto("/study/personas?persona=P0001");

    const claudeBadge = page
      .getByRole("button", { name: /^C: (mild|moderate|strong) tension on axis \d+/ })
      .first();
    await expect(claudeBadge).toBeVisible();
    await claudeBadge.click();

    await expect(claudeBadge).toHaveAttribute("aria-expanded", "true");
    const detail = page.getByText(/budget allocation (suggests|leans|lands)/).first();
    await expect(detail).toBeVisible();
    await expect(page.getByText(PLACEHOLDER)).toHaveCount(0);
  });
});
