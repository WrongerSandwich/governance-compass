import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const resultsViewPath = resolve(process.cwd(), "src/components/results/ResultsView.tsx");

describe("retired results controls", () => {
  it("does not retain unreachable account-save or legacy profile-compare UI", () => {
    const resultsView = readFileSync(resultsViewPath, "utf8");

    expect(existsSync(resolve(process.cwd(), "src/components/results/CompareButton.tsx"))).toBe(false);
    expect(resultsView).not.toContain("SaveToAccountButton");
    expect(resultsView).not.toContain("saveLastResults");
  });
});
