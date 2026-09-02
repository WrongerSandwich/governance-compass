import { expect, type Browser, type BrowserContext } from "@playwright/test";
import { randomUUID } from "node:crypto";

export const E2E_PASSWORD = "e2e-test-password";

/** Registers a new user through the signup form and returns their session. */
export async function signUp(
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
  await page.getByLabel("Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  // Signup signs the new user in and hands off to /account.
  await page.waitForURL("**/account");
  await page.close();

  return { context, name };
}

/** Materializes a profile for the context's signed-in user. */
export async function materialize(
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
