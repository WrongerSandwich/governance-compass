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

  test("regions paint their data fill instead of the SVG default", async ({
    page,
  }) => {
    // react-simple-maps v5 ignores `style={{ default, hover, pressed }}`, which
    // left every path with no fill and rendered the maps solid black (#110).
    // Counting painted paths alone would not have caught that.
    await page.goto("/study/patterns");
    // evaluateAll on an empty match returns 0 without waiting, so the maps have
    // to have painted before the count means anything.
    await expect
      .poll(async () => page.locator("g.rsm-geographies path").count(), {
        timeout: 20_000,
      })
      .toBeGreaterThanOrEqual(30);

    const black = await page
      .locator("g.rsm-geographies path")
      .evaluateAll((paths) =>
        paths.filter((p) => getComputedStyle(p).fill === "rgb(0, 0, 0)").length
      );

    expect(black).toBe(0);
  });

  test("hovering a region swaps to its hover fill and back", async ({
    page,
  }) => {
    // The cluster map on /study/patterns carries no country overlay, so a
    // pointer over a region reaches the region path itself.
    await page.goto("/study/patterns");
    await expect
      .poll(async () => page.locator("g.rsm-geographies path").count(), {
        timeout: 20_000,
      })
      .toBeGreaterThanOrEqual(30);

    // elementFromPoint only resolves inside the viewport, and the cluster map
    // sits well down the page.
    await page.locator("svg.rsm-svg").nth(1).scrollIntoViewIfNeeded();

    // Region outlines are multipolygons, so a bounding-box centre often falls
    // outside the shape. Probe for a point that actually hit-tests to a path.
    const point = await page.evaluate(() => {
      const svg = document.querySelectorAll("svg.rsm-svg")[1];
      const paths = [...svg.querySelectorAll("g.rsm-geographies path")];
      const offsets = [0.3, 0.4, 0.5, 0.6, 0.7];
      for (const path of paths) {
        const box = path.getBoundingClientRect();
        for (const fx of offsets) {
          for (const fy of offsets) {
            const x = box.left + box.width * fx;
            const y = box.top + box.height * fy;
            if (
              x < 0 ||
              y < 0 ||
              x > window.innerWidth ||
              y > window.innerHeight
            ) {
              continue;
            }
            if (document.elementFromPoint(x, y) === path) {
              path.setAttribute("data-hover-probe", "");
              return { x, y };
            }
          }
        }
      }
      return null;
    });
    expect(point).not.toBeNull();

    const probe = page.locator("[data-hover-probe]");
    const fill = () => probe.evaluate((el) => getComputedStyle(el).fill);
    const resting = await fill();

    await page.mouse.move(point!.x, point!.y);
    await expect.poll(fill).not.toBe(resting);

    await page.mouse.move(0, 0);
    await expect.poll(fill).toBe(resting);
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
