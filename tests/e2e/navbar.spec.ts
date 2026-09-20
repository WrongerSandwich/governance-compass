import { expect, test } from "@playwright/test";

const widths = [320, 390, 559, 560, 1024] as const;

test.describe("responsive navbar", () => {
  for (const width of widths) {
    test(`switches navigation modes without overflowing at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/");

      const mobileTrigger = page.getByRole("button", {
        name: "Open navigation",
      });
      const desktopResearch = page.getByRole("button", { name: /Research/ });

      if (width < 560) {
        await expect(mobileTrigger).toBeVisible();
        await expect(desktopResearch).toBeHidden();
      } else {
        await expect(mobileTrigger).toBeHidden();
        await expect(desktopResearch).toBeVisible();
      }

      const horizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(horizontalOverflow).toBe(0);
    });
  }

  test("closes an open mobile panel when crossing to the desktop breakpoint", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 559, height: 844 });
    await page.goto("/");

    const trigger = page.locator(
      "button[aria-controls='mobile-navigation-panel']",
    );
    await trigger.click();
    const quiz = page.locator("#mobile-navigation-panel a[href='/quiz']");
    await expect(quiz).toBeFocused();

    await page.setViewportSize({ width: 560, height: 844 });

    await expect(page.locator("#mobile-navigation-panel")).toHaveCount(0);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(
      await page.evaluate(
        () =>
          document.activeElement?.closest("#mobile-navigation-panel") === null,
      ),
    ).toBe(true);

    await page.setViewportSize({ width: 559, height: 844 });
    await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
    await expect(page.locator("#mobile-navigation-panel")).toHaveCount(0);
  });
});
