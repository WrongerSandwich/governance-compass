import { test, expect } from "@playwright/test";

/**
 * Issue #63: the filter panel spoke a pre-pipeline category vocabulary (so
 * dropdowns and chips showed raw snake_case), and the URL-bound text inputs
 * committed a navigation per keystroke.
 */

test.describe("study persona filters", () => {
  test("governance categories read as prose in the dropdown and the chip", async ({
    page,
  }) => {
    await page.goto("/study/personas");

    const governance = page.getByLabel("Governance experience");
    await expect(governance).toBeVisible();

    // Every option is a real label, not a fallback to the raw catalog key.
    const optionTexts = await governance
      .locator("option")
      .allTextContents();
    expect(optionTexts.length).toBeGreaterThan(1);
    for (const text of optionTexts) {
      expect(text).not.toMatch(/_/);
    }
    expect(optionTexts).toContain("Flawed democracy");

    await governance.selectOption("flawed_democracy");
    await expect
      .poll(() => new URL(page.url()).searchParams.get("governance"))
      .toBe("flawed_democracy");
    await expect(
      page.getByText("Governance: Flawed democracy")
    ).toBeVisible();
  });

  test("typing a name search does not add a history entry per keystroke", async ({
    page,
  }) => {
    await page.goto("/study/personas");
    const search = page.getByLabel("Name", { exact: true });
    await expect(search).toBeVisible();

    // Let the mount-time sessionStorage restore settle before sampling.
    await page.waitForTimeout(500);
    const before = await page.evaluate(() => history.length);

    await search.pressSequentially("sofia", { delay: 40 });
    // The draft is local, so every keystroke is on screen immediately.
    await expect(search).toHaveValue("sofia");

    await expect
      .poll(() => new URL(page.url()).searchParams.get("q"))
      .toBe("sofia");

    // Debounced and committed with `replace`: five characters, no new entries.
    expect(await page.evaluate(() => history.length)).toBe(before);
  });
});
