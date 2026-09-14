import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { sourceFiles } from "../helpers/source-files";

const resultsViewPath = resolve(process.cwd(), "src/components/results/ResultsView.tsx");

describe("retired results controls", () => {
  it("does not retain unreachable account-save or legacy profile-compare UI", () => {
    const resultsView = readFileSync(resultsViewPath, "utf8");

    expect(existsSync(resolve(process.cwd(), "src/components/results/CompareButton.tsx"))).toBe(false);
    // Phase 4 converged every score bar on PairedAxisScale. ScoreBar's two
    // distinguishing features — a centre-out fill and a score readout floating
    // above the marker — are both things mock 7a removes, so restyling it
    // would have left two primitives drawing one thing.
    expect(existsSync(resolve(process.cwd(), "src/components/results/ScoreBar.tsx"))).toBe(false);
    expect(resultsView).not.toContain("SaveToAccountButton");
    expect(resultsView).not.toContain("saveLastResults");
  });

  it("leaves no importer behind the deleted score bar", () => {
    // The file being gone is not the same as nothing reaching for it: a stale
    // import fails the build, but a stale import inside a string or a comment
    // is the kind of thing that survives a rename and confuses the next reader.
    // sourceFiles defaults to both .tsx and .ts (a stale .ts re-export would
    // otherwise pass unseen), with the same pattern Task 4 already shipped in
    // results-chrome.test.ts: `\s+` (not a literal space) after `from`, and
    // a `/` required immediately before `ScoreBar` so `GroupScoreBar` and
    // `ComparisonScoreBar` — which have no `/` there — can't false-positive.
    const offenders = sourceFiles(resolve(process.cwd(), "src")).filter((file) =>
      /from\s+["'][^"']*\/ScoreBar["']/.test(readFileSync(file, "utf8")),
    );

    expect(offenders).toEqual([]);
  });
});
