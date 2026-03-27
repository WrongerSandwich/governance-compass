import { test, expect } from "@playwright/test";

test.describe("Quiz Flow", () => {
  test("can navigate from landing to quiz to results", async ({ page }) => {
    // Landing page
    await page.goto("/");
    await expect(page.getByText("PoliticalPlatform")).toBeVisible();
    await page.click("text=Take the Quiz");

    // Quiz intro
    await expect(page.getByText("Discover Your Political Profile")).toBeVisible();
    await page.click("text=Start Quiz");

    // First topic - answer at least 2 questions
    await expect(page.getByText("Topic 1 of")).toBeVisible();
    const agreeButtons = page.getByText("Agree", { exact: true });
    const count = await agreeButtons.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      await agreeButtons.nth(i).click();
    }
    await page.click("text=Next Topic");

    // Second topic - answer at least 2
    await expect(page.getByText("Topic 2 of")).toBeVisible();
    const agreeButtons2 = page.getByText("Agree", { exact: true });
    const count2 = await agreeButtons2.count();
    for (let i = 0; i < Math.min(count2, 3); i++) {
      await agreeButtons2.nth(i).click();
    }

    // Skip remaining topics to reach review faster
    for (let i = 2; i < 12; i++) {
      await page.click("text=Next Topic");
    }

    // Review screen
    await page.click("text=Review Answers");
    await expect(page.getByText("Review Your Answers")).toBeVisible();

    // Submit
    await page.click("text=Submit & See Results");

    // Results page
    await expect(page.getByText("Your Political Profile")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Overview")).toBeVisible();
    await expect(page.getByText("By Topic")).toBeVisible();
    await expect(page.getByText("Insights")).toBeVisible();
  });
});
