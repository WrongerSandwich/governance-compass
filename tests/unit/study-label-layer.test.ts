import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

/** Every inline `fontSize` still left in a file, as a list. The sweep's unit
 *  of progress: a converted file has none, and the message names the ones it
 *  has so a failure is actionable without opening the file. */
function inlineFontSizes(text: string): string[] {
  return (text.match(/fontSize: *[^,\n]+/g) ?? []).map((m) => m.trim());
}

describe("the patterns page joins the label layer", () => {
  const FILES = [
    "src/app/study/patterns/page.tsx",
    "src/components/study/patterns/ClusterCard.tsx",
    "src/components/study/patterns/TopCorrelationsList.tsx",
    "src/components/study/patterns/DemographicAggregates.tsx",
  ];

  it("leaves no inline font size on any of them", () => {
    // The whole point of the phase in one assertion: an inline fontSize is a
    // hand-rolled parallel copy of a role, and there is no spelling of
    // `label` inside a style prop.
    const offenders = FILES.flatMap((file) => {
      const sizes = inlineFontSizes(read(file));
      return sizes.length ? [`${file}: ${sizes.join(", ")}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("routes the cluster domain colours through the stepping mark variable", () => {
    // Four frozen hexes in a local helper. A fixed hex is one brown in both
    // modes, while every other mark in the product steps 600 -> 400 on a
    // dark ground (spec delta 06).
    const page = read("src/app/study/patterns/page.tsx");

    expect(page).toContain("getDomainMarkVar");
    expect(page).not.toContain("domainColorFor");
    expect(page).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });

  it("stops naming a custom property that globals.css has never declared", () => {
    // Ten sites read `var(--text-xs, …)`, and the two fallbacks disagree —
    // five say 10px and five say 11px. Every one renders its fallback. The
    // reference is worse than a literal: it reads as a token.
    const globals = read("src/app/globals.css");
    expect(globals, "if --text-xs now exists, D25 needs rewriting first").not.toContain(
      "--text-xs:",
    );

    const offenders = FILES.flatMap((file) =>
      read(file).includes("--text-xs") ? [file] : [],
    );

    expect(offenders).toEqual([]);
  });
});

describe("model agreement joins the label layer", () => {
  const FILES = [
    "src/components/study/model-agreement/ModelAgreementClient.tsx",
    "src/components/study/model-agreement/CaseStudy.tsx",
    "src/components/study/model-agreement/DisagreementByAttribute.tsx",
  ];

  it("leaves no inline font size on any of them", () => {
    const offenders = FILES.flatMap((file) => {
      const sizes = inlineFontSizes(read(file));
      return sizes.length ? [`${file}: ${sizes.join(", ")}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("sets the case-study prose in sans, not serif", () => {
    // Two analytical paragraphs were 14px serif roman. Spec delta 01 puts
    // prose in sans and keeps serif for headings plus the one italic role;
    // serif roman body is not in the scale. Asserted here rather than left
    // to the fontSize sweep because moving to `body-s` changes the SIZE
    // visibly and the FAMILY invisibly, and the family is the deliberate
    // part.
    const text = read("src/components/study/model-agreement/CaseStudy.tsx");

    expect(text).not.toContain("var(--font-serif)");
  });

  it("gives the italic caption the role that already carries its colour", () => {
    // `caption-italic` declares font-family, style, size, line-height AND
    // color. A `text-*` class beside it is either redundant or fighting it,
    // and phase 5 guarded exactly this shape.
    const text = read("src/components/study/model-agreement/ModelAgreementClient.tsx");

    for (const cls of text.match(/className="[^"]*caption-italic[^"]*"/g) ?? []) {
      expect(cls, "caption-italic already sets its colour").not.toMatch(/\btext-text-/);
    }
  });

  it("fills the model-agreement charts from the stepping mark, not the frozen ramp", () => {
    // `var(--stone-600)` is the mark's LIGHT value. A bar filled with it is
    // one brown in both modes, while every other mark in the product steps
    // 600 -> 400 on a dark ground (spec delta 06). Both sites are chart
    // fills passed as props, so no class-scanning guard could see them.
    const offenders = FILES.flatMap((file) =>
      read(file).includes("var(--stone-600)") ? [file] : [],
    );

    expect(offenders).toEqual([]);
  });
});

describe("the persona browser chrome joins the label layer", () => {
  const FILES = [
    "src/components/study/PersonasPageClient.tsx",
    "src/components/study/PersonaFilters.tsx",
    "src/components/study/PersonaGrid.tsx",
    "src/components/study/PersonaCard.tsx",
    "src/components/study/ClusterBadge.tsx",
    "src/components/study/ArchetypeBadgeStudy.tsx",
    "src/components/study/MapLegend.tsx",
    "src/components/study/TransnationalTile.tsx",
    "src/components/study/CompareFloatingButton.tsx",
  ];

  it("leaves no inline font size on any of them", () => {
    const offenders = FILES.flatMap((file) => {
      const sizes = inlineFontSizes(read(file));
      return sizes.length ? [`${file}: ${sizes.join(", ")}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("puts the mark tone on the token that steps by mode", () => {
    // `var(--stone-600)` is the mark's LIGHT value, frozen. --mark-primary
    // is the same value in light and Stone 400 in dark.
    //
    // SCOPE: this case covers only this task's files. It is NOT the guard —
    // Task 14's section-wide one is. The file-list shape was the plan's
    // original design and it was wrong: Task 5's implementer found a
    // `var(--stone-600)` chart fill in `DisagreementByAttribute.tsx` that no
    // task's list contained, so nothing would ever have caught it. Twelve
    // files in the section carry the spelling. A per-task list can only ever
    // guard the files somebody already remembered.
    const offenders = [...FILES, "src/components/study/ComparePinButton.tsx"].flatMap((file) =>
      read(file).includes("var(--stone-600)") ? [file] : [],
    );

    expect(offenders).toEqual([]);
  });

  it("names the mark token in every spelling, not just the wrapped one", () => {
    // `"--stone-600"` interpolated into `var(...)` later is invisible to a
    // scan for `var(--stone-600)`. Same token, same defect, different
    // spelling — which is how it survived into a file nobody's list covered.
    const offenders = FILES.flatMap((file) =>
      /--stone-600/.test(read(file)) ? [file] : [],
    );

    expect(offenders).toEqual([]);
  });
});

describe("the compare view joins the label layer", () => {
  const FILE = "src/components/study/CompareView.tsx";

  it("leaves no inline font size", () => {
    expect(inlineFontSizes(read(FILE))).toEqual([]);
  });

  it("leaves no reference to the sub-AA tertiary token", () => {
    // Nine sites, all inline, so the class-scanning half of the shipped
    // guard would have missed every one.
    expect(read(FILE)).not.toContain("var(--text-tertiary)");
  });
});

describe("the persona modal's chrome joins the label layer", () => {
  const FILE = "src/components/study/PersonaModal.tsx";

  /** Block and line comments out, so a text scan reads code and not prose.
   *  The `[^:]` guard keeps a `//` inside a URL literal from eating the rest
   *  of its line. */
  function stripComments(text: string): string {
    return text
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
  }

  it("marks the modal's error state so it is not carried by colour alone", () => {
    // Phase 5's D16 amendment: `text-red-600` was swapped for the warning
    // ink at six sites on the premise that every one already had
    // `role="alert"` or a live region, and that premise was false at three
    // of them. The modal's fetch-error string had neither, and it now
    // carries the same amber an advisory notice does — so the cue a sighted
    // user had would get weaker with nothing put in its place.
    //
    // Bound to the OPENING TAG of the element that renders `{error}`, on a
    // comment-stripped copy. The first spelling of this assertion scanned
    // 600 raw characters back from `{error}`, which swallowed the comment
    // standing beside the attribute and passed on the prose alone — the same
    // way Task 6 reddened its own guard by writing a banned literal into a
    // test comment (resolved at 7f91af8). A whole-file text scan cannot tell
    // a comment from code, so the test has to.
    const text = stripComments(read(FILE));

    const at = text.indexOf("{error}");
    expect(at, "nothing in the modal renders {error}").toBeGreaterThan(-1);

    // Back to the nearest `<`: with comments gone, that is the start of the
    // opening tag enclosing the expression, and nothing else.
    const openingTag = text.slice(text.lastIndexOf("<", at), at);
    expect(openingTag, "expected an element opening tag").toMatch(
      /^<[a-zA-Z][^<]*>\s*$/,
    );

    expect(openingTag).toContain('role="alert"');
    // The half that makes the role load-bearing: D16's swap is what removed
    // the colour cue, and the two have to arrive on the same element.
    expect(openingTag).toContain("text-warning-text");
  });
});
