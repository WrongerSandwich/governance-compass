import { defineConfig } from "@playwright/test";

const isCI = !!process.env.CI;

// Port 3000 by default, but overridable so a run can dodge whatever else is
// already bound locally. baseURL and the webServer must agree, so both derive
// from the same value.
const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: 0,
  // The quiz flow answers and advances past 60 questions in a single test, so
  // it needs far more than the 30 s default.
  timeout: 180_000,
  // Locally `next dev` compiles each route on first hit, which can push a
  // post-navigation assertion well past the 5 s default.
  expect: { timeout: 15_000 },
  // `github` annotates failures inline on the PR diff; the HTML report carries
  // the retained traces and is uploaded as a CI artifact.
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  webServer: {
    // In CI the app is built by an earlier step and served in production mode:
    // `next dev` compiles each route on first hit, which makes navigation
    // timings unpredictable on a cold runner.
    command: isCI ? "npm run start" : "npm run dev",
    port,
    // Never adopt a stranger's server in CI — a stale process on the port would
    // silently test the wrong build.
    reuseExistingServer: !isCI,
    // Next reads PORT for both `dev` and `start`.
    env: { PORT: String(port) },
    timeout: 120_000,
  },
});
