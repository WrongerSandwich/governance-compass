import { readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { sourceFiles } from "../helpers/source-files";

const STUDY = [
  ...sourceFiles(resolve(process.cwd(), "src/app/study")),
  ...sourceFiles(resolve(process.cwd(), "src/components/study")),
].map((file) => ({ file: relative(process.cwd(), file), text: readFileSync(file, "utf8") }));

describe("the study section's controls are reachable without a mouse", () => {
  it("reaches files, so the guards below cannot pass vacuously", () => {
    // Phase 5's M7 lesson: every case here is `expect(offenders).toEqual([])`
    // over a flatMap, and `[].flatMap(f)` is `[]`. An empty file list makes
    // all of them green while reading nothing. Named anchors rather than a
    // bare count, because twenty of the wrong files would satisfy a count.
    const files = STUDY.map(({ file }) => file);

    expect(files.length).toBeGreaterThanOrEqual(30);
    for (const anchor of [
      "src/components/study/WorldMap.tsx",
      "src/components/study/PersonaModal.tsx",
      "src/components/study/PersonaGrid.tsx",
    ]) {
      expect(files, `sweep does not reach ${anchor}`).toContain(anchor);
    }
  });

  it("gives every hand-rolled control a focus ring", () => {
    // 22 <button>s, zero focus-ring, before this task. The three variants of
    // `Button` are page-level CTAs and most of these are icon toggles and
    // chips (D27), so the primitive is the wrong fix and the ring is the
    // right one.
    //
    // `[^>]*` stops at the first `>` in the tag, which in JSX means the first
    // `=>` or `>=` inside an attribute expression. So the window this reads is
    // the attributes BEFORE the first arrow function — which is why every
    // control below carries `className` ahead of its handlers. That ordering
    // is load-bearing for this guard, not cosmetic: move a `className` below
    // an `onClick={() => …}` and this case reddens.
    const offenders = STUDY.flatMap(({ file, text }) => {
      if (!/<button\b/.test(text)) return [];
      const buttons = text.match(/<button\b[^>]*>/gs) ?? [];
      const ringless = buttons.filter((b) => !b.includes("focus-ring"));
      return ringless.length ? [`${file}: ${ringless.length} of ${buttons.length}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("stops painting over the focus ring on the map's region paths", () => {
    // WorldMap's interactive geographies are tabIndex=0 role=button, and
    // their default/hover/pressed style objects each set outline: "none",
    // with nothing to put the ring back. What a keyboard user got was
    // `StyledGeography`'s onFocus mapping onto the HOVER state: a cue
    // indistinguishable from mouse hover, which is not a conforming focus
    // indicator, on the section's primary navigation control. (D28's own
    // wording said "no indicator at all"; the plan is amended to match.)
    //
    // Counted, not forbidden: the four NON-interactive branches keep theirs,
    // because an unfocusable path has no ring to suppress. Four branches ×
    // three state keys = 12. If this number moves, a branch changed and
    // somebody has to decide which kind it is.
    const map = STUDY.find(({ file }) => file === "src/components/study/WorldMap.tsx")!;
    const suppressions = (map.text.match(/outline: "none"/g) ?? []).length;

    expect(suppressions).toBe(12);
    // Pinned to the two interactive branches rather than `toContain`, which
    // one occurrence anywhere — including this comment — would satisfy.
    expect((map.text.match(/className="focus-ring"/g) ?? []).length).toBe(2);
  });
});
