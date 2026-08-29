import { test, expect, type Page } from "@playwright/test";

// Mirrors src/data — the seed reports the same counts.
const FORCED_CHOICE_COUNT = 36;
const SCALED_COUNT = 24;

// Every ministry starts at MIN_ALLOCATION (1) of a 50-point budget, so 43
// points are still unspent when phase 3 opens. See src/lib/quiz-state.ts.
const MINISTRY_COUNT = 7;
const POINTS_TO_SPEND = 43;

/**
 * Walks one phase of question cards.
 *
 * Both card types render their options as `aria-pressed` buttons, and the
 * scaled card renders two responsive copies of its option group — hence the
 * visibility filter, which keeps the click off the hidden variant. Advancing is
 * explicit: there is no auto-advance timer, and the forward button relabels
 * itself on the final item.
 */
async function answerQuestionPhase(page: Page, total: number) {
  for (let index = 0; index < total; index++) {
    // The sr-only live region is the authoritative position marker.
    await expect(page.getByText(`Question ${index + 1} of ${total}`)).toBeAttached();

    await page
      .locator("button[aria-pressed]")
      .filter({ visible: true })
      .first()
      .click();

    const isLast = index === total - 1;
    await page
      .getByRole("button", { name: isLast ? "Continue" : "Next", exact: true })
      .click();
  }
}

test.describe("Governance Compass quiz flow", () => {
  test("completes all three phases and lands on results", async ({ page }) => {
    // ── Landing ───────────────────────────────────────────────────────────────
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "The Governance Compass" })
    ).toBeVisible();
    await page.getByRole("link", { name: "Begin assessment" }).click();

    // ── Quiz intro ────────────────────────────────────────────────────────────
    await expect(
      page.getByRole("heading", { name: "Governance dilemmas" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Begin", exact: true }).click();

    // ── Phase 1: forced-choice dilemmas ───────────────────────────────────────
    await answerQuestionPhase(page, FORCED_CHOICE_COUNT);

    // ── Transition 1 → 2 ──────────────────────────────────────────────────────
    await expect(
      page.getByRole("heading", { name: "Nuanced scales" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Continue", exact: true }).click();

    // ── Phase 2: nuanced scales ───────────────────────────────────────────────
    await answerQuestionPhase(page, SCALED_COUNT);

    // ── Transition 2 → 3 ──────────────────────────────────────────────────────
    await expect(
      page.getByRole("heading", { name: "The Chancellor's Budget" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Continue", exact: true }).click();

    // ── Phase 3: budget simulator ─────────────────────────────────────────────
    const confirmBudget = page.getByRole("button", { name: "Confirm budget" });
    await expect(confirmBudget).toBeDisabled();

    const increaseButtons = page.getByRole("button", { name: /^Increase / });
    await expect(increaseButtons).toHaveCount(MINISTRY_COUNT);

    // Spread the remaining points round-robin: no ministry gets near the
    // 25-point ceiling, so every click actually lands.
    for (let spent = 0; spent < POINTS_TO_SPEND; spent++) {
      await increaseButtons.nth(spent % MINISTRY_COUNT).click();
    }

    await expect(confirmBudget).toBeEnabled();
    await confirmBudget.click();

    // ── Results ───────────────────────────────────────────────────────────────
    // The quiz sits on a "computing" screen for 1.8 s before redirecting.
    await expect(page).toHaveURL(/\/results\?r=/, { timeout: 15_000 });

    await expect(page.getByText(/\d+% match/).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "12-axis radar" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Axis breakdown" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Compass plot" })).toBeVisible();
  });
});
