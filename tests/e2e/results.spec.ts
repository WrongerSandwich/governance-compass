import { test, expect } from "@playwright/test";

test.describe("Results Page", () => {
  test("shows 404 for invalid profile", async ({ page }) => {
    await page.goto("/results/nonexistent-id");
    await expect(page.getByText("404")).toBeVisible();
  });
});
