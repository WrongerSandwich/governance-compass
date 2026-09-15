import { readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  classTokens,
  jsxOpeningTags,
  sourceFiles,
  stripComments,
} from "../helpers/source-files";

const STUDY = [
  ...sourceFiles(resolve(process.cwd(), "src/app/study")),
  ...sourceFiles(resolve(process.cwd(), "src/components/study")),
].map((file) => ({
  file: relative(process.cwd(), file),
  // Comments out (Task 14 Step 3b). Both cases below count occurrences of a
  // class name they also have to write down, and a text scan cannot tell the
  // two apart.
  text: stripComments(readFileSync(file, "utf8")),
}));

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
    // TWO defects fixed here, both in the version this plan prescribed.
    //
    // 1. The window. `/<button\b[^>]*>/gs` stops at the first `>` in the tag,
    //    which in JSX is the first `=>` inside an attribute expression — so
    //    for 9 of these 21 buttons the readable window ended before
    //    `className`. That cannot cause a false pass, but it made attribute
    //    ORDER load-bearing across 21 call sites, enforced by a message that
    //    says only "3 of 3". `jsxOpeningTags` scans to the first `>` outside
    //    a brace or a string literal, so a handler before the className is
    //    now a non-event.
    // 2. The comparison. `!b.includes("focus-ring")` is a SUBSTRING test, and
    //    `focus-ring-child` is a real sibling utility (globals.css:590). A
    //    button carrying only `focus-ring-child` — or a
    //    `data-testid="focus-ring"` — passed this guard with no ring of its
    //    own. Tokens, never substrings: the rule this plan has enforced on
    //    every implementer since Task 2, written into a task's own test text.
    // The brief's own vacuity rule, applied one level down from the file list.
    // The case above anchors the FILES; nothing anchored the ELEMENTS, so
    // mistyping the tag argument made every list `[]` and all three cases in
    // this spec green while reading nothing.
    const allButtons = STUDY.flatMap(({ text }) => jsxOpeningTags(text, "button"));
    expect(
      allButtons.length,
      "no <button> found — the guard below reads nothing",
    ).toBeGreaterThanOrEqual(21);

    const offenders = STUDY.flatMap(({ file, text }) => {
      const buttons = jsxOpeningTags(text, "button");
      const ringless = buttons.filter(
        (tag) => !classTokens(tag).includes("focus-ring"),
      );
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
    // one occurrence anywhere would satisfy. Counted per ELEMENT and on class
    // TOKENS, not on the raw string: the `className="focus-ring"` spelling it
    // used to count is one of several that put the ring on the path, and the
    // count would also have been satisfied by the name appearing twice in a
    // `data-` attribute.
    const ringed = jsxOpeningTags(map.text, "StyledGeography").filter((tag) =>
      classTokens(tag).includes("focus-ring"),
    );

    expect(ringed.length).toBe(2);
  });
});
