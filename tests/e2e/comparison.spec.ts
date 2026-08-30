import { test, expect, type Browser, type BrowserContext } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { axes } from "@/data/axes";
import { forcedChoiceItems } from "@/data/forced-choice-items";
import { scaledItems } from "@/data/scaled-items";
import { encodeResponses } from "@/lib/response-codec";
import type { QuizResponses } from "@/lib/scoring-types";

/**
 * The comparison page needs two profiles in the database, and profiles are only
 * created by `POST /api/profile/materialize`, which requires a session. So each
 * test signs up through the real credentials form — no Google credentials
 * needed — and posts an encoded response string from the authenticated context
 * rather than walking 67 quiz questions twice.
 *
 * Every run leaves its users and profiles behind. CI starts from a fresh
 * database; locally they accumulate harmlessly under distinct e2e-* emails.
 */

const PASSWORD = "e2e-test-password";

/** Every FC answer on one pole, every scale pinned to one end. */
function buildResponses(
  pole: "A" | "B",
  scaleValue: 1 | 2 | 3 | 4 | 5,
  budget: number[]
): QuizResponses {
  return {
    forcedChoice: Object.fromEntries(
      forcedChoiceItems.map((item) => [item.id, pole])
    ),
    scaled: Object.fromEntries(scaledItems.map((item) => [item.id, scaleValue])),
    budget: Object.fromEntries(
      budget.map((amount, index) => [index + 1, amount])
    ),
  };
}

// Deliberate opposites: pole A with the budget stacked on ministry 1, pole B
// with it stacked on ministry 7. Both budgets spend the full 50 points.
const POLE_A = encodeResponses(buildResponses("A", 1, [25, 4, 4, 4, 4, 4, 5]));
const POLE_B = encodeResponses(buildResponses("B", 5, [5, 4, 4, 4, 4, 4, 25]));

/** Registers a new user through the signup form and returns their session. */
async function signUp(
  browser: Browser,
  label: string
): Promise<{ context: BrowserContext; name: string }> {
  const suffix = randomUUID().slice(0, 8);
  const name = `E2E ${label} ${suffix}`;
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("/auth/signup");
  await page.getByLabel("Name (optional)").fill(name);
  await page.getByLabel("Email").fill(`e2e-${label}-${suffix}@example.test`);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  // Signup signs the new user in and hands off to /account.
  await page.waitForURL("**/account");
  await page.close();

  return { context, name };
}

/** Materializes a profile for the context's signed-in user. */
async function materialize(
  context: BrowserContext,
  encoded: string
): Promise<string> {
  const response = await context.request.post("/api/profile/materialize", {
    data: { encoded },
  });
  expect(response.status(), await response.text()).toBe(201);
  const { profileId } = await response.json();
  return profileId as string;
}

test.describe("Comparison", () => {
  test("shows the alignment score and per-axis breakdown for two profiles", async ({
    browser,
  }) => {
    const [first, second] = await Promise.all([
      signUp(browser, "a"),
      signUp(browser, "b"),
    ]);
    const [profileA, profileB] = await Promise.all([
      materialize(first.context, POLE_A),
      materialize(second.context, POLE_B),
    ]);

    const page = await browser.newPage();
    await page.goto(`/compare/${profileA}/${profileB}`);

    await expect(page.getByRole("heading", { name: "Comparison" })).toBeVisible();
    await expect(page.getByText(`${first.name} vs ${second.name}`)).toBeVisible();

    // Two profiles built from opposite poles sit about 2.0 apart on every axis,
    // which is the bottom of the alignment scale.
    const alignment = page.locator('[aria-label^="Overall alignment:"]');
    await expect(alignment).toBeVisible();
    const score = Number(
      (await alignment.getAttribute("aria-label"))!.match(/(\d+)%/)![1]
    );
    expect(score).toBeLessThan(50);

    // The breakdown names every axis. Scope to the card so a match in the radar
    // legend or the highlight lists cannot stand in for a missing bar.
    const byAxis = page.getByRole("heading", { name: "By axis" }).locator("..");
    for (const axis of axes) {
      await expect(byAxis.getByText(axis.name, { exact: true })).toBeVisible();
    }

    await expect(page.getByRole("heading", { name: "Most aligned" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Most divergent" })).toBeVisible();

    await Promise.all([first.context.close(), second.context.close()]);
  });

  test("scores two identical profiles as fully aligned", async ({ browser }) => {
    // One user can hold several profiles, so a single signup covers both sides.
    const { context } = await signUp(browser, "same");
    const [profileA, profileB] = [
      await materialize(context, POLE_A),
      await materialize(context, POLE_A),
    ];

    const page = await context.newPage();
    await page.goto(`/compare/${profileA}/${profileB}`);

    await expect(
      page.locator('[aria-label="Overall alignment: 100%"]')
    ).toBeVisible();

    await context.close();
  });

  test("shows 404 when a profile does not exist", async ({ page }) => {
    await page.goto("/compare/nonexistent-1/nonexistent-2");
    await expect(page.getByText("404")).toBeVisible();
  });
});
