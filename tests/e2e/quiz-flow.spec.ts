import { test, expect } from "@playwright/test";

test.describe("Governance Compass Quiz Flow", () => {
  test("can complete the full 3-phase assessment", async ({ page }) => {
    // ── Landing page ──────────────────────────────────────────────────────────
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "The Governance Compass" })).toBeVisible();
    await page.click("text=Take the Assessment");

    // ── Quiz intro (phase === "intro") ────────────────────────────────────────
    // QuizFlow renders an h1 "The Governance Compass" + "Begin Assessment" button
    await expect(page.getByRole("button", { name: "Begin Assessment" })).toBeVisible({
      timeout: 5000,
    });
    await page.click("text=Begin Assessment");

    // ── Phase 1: Forced-Choice (36 items, auto-advance after 400 ms) ──────────
    // ForcedChoiceCard renders two <button aria-pressed> siblings.
    // Clicking either one triggers handleFCSelect, which schedules auto-advance
    // after 400 ms (or moves to transition1 on the last item).
    for (let i = 0; i < 36; i++) {
      // Wait for at least one aria-pressed button to appear (new item rendered)
      const firstOption = page.locator('button[aria-pressed]').first();
      await firstOption.waitFor({ state: "visible", timeout: 5000 });
      await firstOption.click();
      // Allow the 400 ms auto-advance timer to fire
      await page.waitForTimeout(600);
    }

    // ── Phase transition 1 → 2 ───────────────────────────────────────────────
    // PhaseTransition renders a "Continue" button after phase1 completes
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole("button", { name: "Continue" }).click();

    // ── Phase 2: Scaled questions (36 items, auto-advance after 400 ms) ───────
    // ScaledQuestionCard renders <button aria-pressed> for each of the 5 options.
    // Clicking one triggers handleSCSelect, which schedules auto-advance after 400 ms.
    for (let i = 0; i < 36; i++) {
      // Wait for the question's aria-pressed buttons to appear
      const firstOption = page.locator('button[aria-pressed]').first();
      await firstOption.waitFor({ state: "visible", timeout: 5000 });
      // Click the first option (value 1) — consistent enough for test purposes
      await firstOption.click();
      // Allow the 400 ms auto-advance timer to fire
      await page.waitForTimeout(600);
    }

    // ── Phase transition 2 → 3 ───────────────────────────────────────────────
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole("button", { name: "Continue" }).click();

    // ── Phase 3: Budget Simulator ─────────────────────────────────────────────
    // QuizProvider pre-populates all 10 ministries at 10 units each (= 100 total),
    // so canFinalize is true immediately — no stepper adjustments needed.
    await expect(page.getByRole("heading", { name: "The Chancellor's Budget" })).toBeVisible({
      timeout: 5000,
    });
    // "Finalize Budget" is enabled from the start (remaining === 0)
    const finalizeButton = page.getByRole("button", { name: "Finalize Budget" });
    await expect(finalizeButton).toBeEnabled();
    await finalizeButton.click();

    // ── Results page — all 4 layers ───────────────────────────────────────────
    // Layer 1: Compass Plot — coordinate readout "Economic: ..."
    await expect(
      page.getByRole("heading", { name: "Your Governance Compass" })
    ).toBeVisible({ timeout: 15000 });

    // Layer 1: Compass coordinate readout (CompassPlot renders "Economic: <val> · Cultural: <val>")
    await expect(page.getByText(/Economic:/).first()).toBeVisible();

    // Layer 2: Archetype Card — ArchetypeCard renders "<N>% match" badge
    await expect(page.getByText(/\d+% match/).first()).toBeVisible();

    // Layer 4: Axis Breakdown domain headers (rendered directly in ResultsPage)
    await expect(page.getByText("Economic Organization")).toBeVisible();
    await expect(page.getByText("Power and Authority")).toBeVisible();
    await expect(page.getByText("Society and Identity")).toBeVisible();
  });
});
