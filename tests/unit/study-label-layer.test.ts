import { describe, expect, it } from "vitest";
import {
  classTokens,
  inlineFontSizes,
  jsxOpeningTags,
  read,
} from "../helpers/source-files";

// `read` strips comments (Task 14 Step 3b). Four describe blocks here scan
// source for a banned literal, and a text scan cannot tell a declaration from
// prose about one: without stripping, `inlineFontSizes` reddens a genuinely
// converted file on a commented-out line, and every "does not contain" case
// below is satisfiable by an explanation of itself.

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

  it("marks the modal's error state so it is not carried by colour alone", () => {
    // Phase 5's D16 amendment: `text-red-600` was swapped for the warning
    // ink at six sites on the premise that every one already had
    // `role="alert"` or a live region, and that premise was false at three
    // of them. The modal's fetch-error string had neither, and it now
    // carries the same amber an advisory notice does — so the cue a sighted
    // user had would get weaker with nothing put in its place.
    //
    // Comments are stripped and the assertion is bound to the OPENING TAG of
    // the element, because a whole-file text scan cannot tell a declaration
    // from prose about a declaration: a window wide enough to catch the
    // attribute is wide enough to catch a comment naming it, and then the
    // guard passes after the attribute is deleted.
    const text = read(FILE);

    const sites = text.split("{error}").length - 1;
    expect(
      sites,
      "one error path, one guard — a second one needs its own assertion, " +
        "not a scan that silently pins whichever comes first",
    ).toBe(1);

    // Back to the nearest `<`: with comments gone, that is the start of the
    // opening tag enclosing the expression, and nothing else.
    const at = text.indexOf("{error}");
    const openingTag = text.slice(text.lastIndexOf("<", at), at);
    expect(openingTag, "expected an element opening tag").toMatch(
      /^<[a-zA-Z][^<]*>\s*$/,
    );

    expect(openingTag).toContain('role="alert"');
    // The half that makes the role load-bearing: D16's swap is what removed
    // the colour cue, and the two have to arrive on the same element.
    expect(classTokens(openingTag)).toContain("text-warning-text");
  });
});

describe("the persona modal's scored profile converges on the shared scale", () => {
  const FILE = "src/components/study/PersonaModal.tsx";

  it("leaves no inline font size anywhere in the file", () => {
    // 65 of them when this phase started — a third of the section's type
    // sites in one file.
    expect(inlineFontSizes(read(FILE))).toEqual([]);
  });

  it("leaves no reference to the sub-AA tertiary token, in any spelling", () => {
    // The TOKEN, not one syntax for it. Three spellings reach the same
    // colour and a scan for any one of them misses the other two:
    // `var(--text-tertiary)`, the bare `"--text-tertiary"` a caller
    // interpolates into `var(...)` later, and the Tailwind class
    // `text-text-tertiary`. Note the class carries a SINGLE hyphen before
    // `text-tertiary`, so a `/--text-tertiary/` pattern — the obvious
    // widening — silently misses it. Both alternatives are mutation-checked.
    expect(read(FILE)).not.toMatch(/(?:--|text-)text-tertiary/);
  });

  it("declares no local score bar of its own", () => {
    // Phase 5 deleted ScoreBar.tsx and guarded the IMPORT. A local
    // `function ScoreBar` passed that guard, kept the retired
    // ((score+1)/2)*100 mapping alive, and clipped a dot at either pole.
    const text = read(FILE);

    expect(text).not.toMatch(/function ScoreBar\b/);
    expect(text).not.toContain("(score + 1) / 2");
    expect(text).toContain('from "@/components/PairedAxisScale"');
  });
});

describe("the study charts' text joins the label layer", () => {
  const CHARTS = [
    "src/components/study/Histogram.tsx",
    "src/components/study/ViolinOrRidge.tsx",
    "src/components/study/TensionMatrix.tsx",
    "src/components/study/HorizontalBarChart.tsx",
    "src/components/study/CorrelationHeatmap.tsx",
    "src/components/study/Radar.tsx",
  ];

  it("fills no chart label from the sub-AA tertiary token", () => {
    // These are the sites the class-scanning half of the shipped guard could
    // never reach: `fill` takes no Tailwind colour class, so SVG text names
    // its token inline or not at all.
    const offenders = CHARTS.flatMap((file) =>
      read(file).includes("var(--text-tertiary)") ? [file] : [],
    );

    expect(offenders).toEqual([]);
  });

  it("puts every chart label on the mono label layer, per element", () => {
    // The POSITIVE half, and the reason it exists: reverting one `<text>`
    // fill to `var(--text-secondary)` left all 924 tests green. Every case in
    // this spec until now says only what must NOT be there, so the substance
    // of the task — that the label layer is actually applied — was asserted
    // nowhere.
    //
    // Parsed per ELEMENT rather than scanned per file. A whole-file scan can
    // only tell you that SOME line carries the family; it is structurally
    // incapable of telling you that every `<text>` does, which is the claim.
    //
    // Fills are a permitted SET, not one value, because two of these are ink
    // printed ON a filled cell and are chosen for contrast against the fill
    // (the same carve-out D24 grants chart text). An expression that names no
    // string literal is a computed fill and passes: three charts colour a
    // label to match the series it annotates.
    const PERMITTED_FILL = new Set([
      "var(--text-label)",
      "var(--surface-1)",
      "var(--stone-50)",
    ]);

    const labels = CHARTS.flatMap((file) =>
      jsxOpeningTags(read(file), "text").map((tag) => ({ file, tag })),
    );
    // `[].flatMap(f)` is `[]`: without this the loop below asserts nothing.
    expect(labels.length).toBeGreaterThanOrEqual(20);

    const offenders = labels.flatMap(({ file, tag }) => {
      const at = `${file}: ${tag.split("\n")[1]?.trim() ?? tag.slice(0, 40)}`;
      const problems: string[] = [];
      if (!/fontFamily[:=] *"var\(--font-mono\)"/.test(tag)) {
        problems.push(`${at} — not on the mono label layer`);
      }
      if (!/letterSpacing[:=] *"0\.02em"/.test(tag)) {
        problems.push(`${at} — not at the label layer's tracking`);
      }
      const fill = tag.match(/fill[:=] *([^,\n}]+)/);
      if (!fill) {
        problems.push(`${at} — no fill at all`);
      } else {
        const quoted = [...fill[1].matchAll(/"([^"]*)"/g)].map((m) => m[1]);
        const banned = quoted.filter((value) => !PERMITTED_FILL.has(value));
        if (banned.length) problems.push(`${at} — fill ${banned.join(", ")}`);
      }
      return problems;
    });

    expect(offenders).toEqual([]);
  });

  it("keeps the charts' own sizes, which is the exemption D24 grants", () => {
    // Not an oversight and not laziness. All six SVGs are
    // `width: 100%; maxWidth: <intrinsic>px` over a viewBox, so a label
    // sized in user units renders at or BELOW its nominal size and shrinks
    // with the viewport — an 11px floor in rendered device pixels is
    // unsatisfiable without either stopping the charts scaling or moving
    // every tick into overlaid HTML. The shipped /results charts carry
    // fontSize={9} and {6.5} for the same reason, reviewed and landed. This
    // case exists so that a later reader finds a decision here rather than
    // an inconsistency.
    const sized = CHARTS.filter((file) => /fontSize/.test(read(file)));

    expect(sized).toEqual(CHARTS);
  });
});
