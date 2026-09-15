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
