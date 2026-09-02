import { test, expect } from "@playwright/test";

/**
 * Issue #62: two handlers each wrote the URL from its own render-stale
 * `searchParams` snapshot, so the second overwrote the first. These cover the
 * two user-visible symptoms end to end — the pure helpers are unit-tested in
 * tests/unit/study-pinned-personas.test.ts.
 */

function compareIds(url: string): string[] {
  const value = new URL(url).searchParams.get("compare");
  return value ? value.split(",").filter(Boolean) : [];
}

test.describe("study compare view", () => {
  test("unpinning from a two-persona compare view drops exactly that persona", async ({
    page,
  }) => {
    await page.goto("/study/personas");

    const pinButtons = page.getByRole("button", {
      name: /^Pin .+ for comparison$/,
    });
    await expect(pinButtons.first()).toBeVisible();

    // Pinning relabels the button to "Unpin …", so the next unpinned persona
    // is once again the first match.
    await pinButtons.first().click();
    await expect.poll(() => compareIds(page.url()).length).toBe(1);
    await pinButtons.first().click();
    await expect.poll(() => compareIds(page.url()).length).toBe(2);

    const [firstId, secondId] = compareIds(page.url());

    // The floating compare pill sits underneath the dev-only "Testing" widget
    // in every build where NEXT_PUBLIC_VERCEL_ENV !== "production" (which
    // includes CI), so open the view through its URL state instead of the
    // pill — the regression under test is the unpin handler, not the pill.
    await page.goto(
      `/study/personas?compare=${firstId},${secondId}&compareView=open`
    );
    const compareView = page.getByRole("region", { name: /^Compare view:/ });
    await expect(compareView).toBeVisible();

    // The × on the first panel — the persona pinned first.
    await compareView
      .getByRole("button", { name: /^Remove .+ from comparison$/ })
      .first()
      .click();

    await expect(compareView).toBeHidden();
    await expect.poll(() => compareIds(page.url())).toEqual([secondId]);
    expect(compareIds(page.url())).not.toContain(firstId);
    // The view has nothing left to compare, so it must not linger in the URL
    // and re-open the moment a second persona is pinned again.
    expect(new URL(page.url()).searchParams.has("compareView")).toBe(false);
  });

  test("Escape closes the persona modal without clearing the region selection", async ({
    page,
  }) => {
    await page.goto("/study/personas?region=western_europe");

    await page.locator("a.persona-entry-link").first().click();
    await expect(page).toHaveURL(/persona=/);

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(dialog).toBeHidden();
    // The map's own Escape handler must not have fired underneath the modal.
    expect(new URL(page.url()).searchParams.get("region")).toBe(
      "western_europe"
    );
  });
});
