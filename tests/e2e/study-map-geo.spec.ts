import { test, expect } from "@playwright/test";

/**
 * Regression cover for the study maps' geography fetching.
 *
 * `react-simple-maps`' own `<Geographies>` fetches and parses its file on every
 * mount with no cache, so each map layer paid for `/geo/world-regions-110m.json`
 * separately and re-paid it whenever the selected-region outline mounted.
 */

function trackGeoRequests(page: import("@playwright/test").Page) {
  const urls: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/geo/") && url.endsWith(".json")) urls.push(url);
  });
  return urls;
}

function countOf(urls: string[], file: string): number {
  return urls.filter((u) => u.endsWith(file)).length;
}

test.describe("study map geography loading", () => {
  test("the three maps on the patterns page share one fetch per geography file", async ({
    page,
  }) => {
    const geoRequests = trackGeoRequests(page);

    await page.goto("/study/patterns");
    // Wait until every map has painted its ten region features. Polling on the
    // `<g>` wrappers alone would pass before any fetch had even started.
    await expect
      .poll(async () => page.locator("g.rsm-geographies path").count(), {
        timeout: 20_000,
      })
      .toBeGreaterThanOrEqual(30);

    expect(countOf(geoRequests, "/world-regions-110m.json")).toBe(1);
    expect(countOf(geoRequests, "/world-110m.json")).toBeLessThanOrEqual(1);
  });

  test("selecting a region does not refetch the region geography", async ({
    page,
  }) => {
    const geoRequests = trackGeoRequests(page);

    await page.goto("/study/personas");
    const chip = page.getByRole("button", { name: "North America", exact: true });
    await expect(chip).toBeVisible();
    await expect
      .poll(async () => page.locator("g.rsm-geographies path").count(), {
        timeout: 20_000,
      })
      .toBeGreaterThan(0);

    const before = geoRequests.length;

    await chip.click();
    await expect(page).toHaveURL(/region=north_america/);
    await expect(chip).toHaveAttribute("aria-pressed", "true");

    expect(geoRequests.length).toBe(before);
  });

  test("map regions expose their selected state as aria-pressed", async ({
    page,
  }) => {
    // `aria-selected` is not valid on role="button"; assistive tech ignores it.
    await page.goto("/study/personas?region=north_america");

    const region = page
      .locator('path[role="button"][aria-label^="North America"]')
      .first();
    await expect(region).toHaveAttribute("aria-pressed", "true");
    await expect(region).not.toHaveAttribute("aria-selected", /.*/);
  });
});
