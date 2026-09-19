import { expect, test, type Page } from "@playwright/test";

async function openNarrowPage(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
}

test.describe("DevRandomResults", () => {
  test("sits below the navbar on narrow screens instead of occupying the bottom action area", async ({
    page,
  }) => {
    await openNarrowPage(page);

    const widget = page.getByText("Testing", { exact: true }).locator("..");
    const navbar = page.getByRole("navigation", { name: "Main" });

    await expect(widget).toBeVisible();
    const [widgetBox, navbarBox] = await Promise.all([
      widget.boundingBox(),
      navbar.boundingBox(),
    ]);

    expect(widgetBox).not.toBeNull();
    expect(navbarBox).not.toBeNull();

    expect(widgetBox!.x + widgetBox!.width).toBeCloseTo(390 - 16, 0);
    expect(widgetBox!.y).toBeCloseTo(navbarBox!.y + navbarBox!.height + 16, 0);
  });

  test("uses the design-system type floor and radius", async ({ page }) => {
    await openNarrowPage(page);

    const label = page.getByText("Testing", { exact: true });
    const button = page.getByRole("button", { name: "Random results" });

    await expect(label).toHaveCSS("font-size", "11px");
    await expect(button).toHaveCSS("font-size", "11px");
    await expect(button).toHaveCSS("border-radius", "2px");
  });
});
