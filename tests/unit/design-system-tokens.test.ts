import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getDomainMarkVar } from "@/lib/design-tokens";
import {
  classNameTokenLists,
  cssBlock,
  cssUtilities,
  sourceFiles,
  stripComments,
  stripCssComments,
} from "../helpers/source-files";

// Comments are stripped once, here, so every helper below sees declaration
// text only. cssBlock() is the reason this belongs at the top rather than
// inside decls(): it locates blocks by indexOf and matches braces by depth, so
// a comment that merely mentions `:root` or contains a stray `}` would
// silently anchor it to the wrong place.
const globalsCss = stripCssComments(
  readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8"),
);

/** Custom-property declarations in a block, whitespace-normalised. */
function decls(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [, name, value] of css.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) {
    out[name] = value.trim();
  }
  return out;
}

const light = decls(cssBlock(globalsCss, ":root"));
const dark = decls(
  cssBlock(cssBlock(globalsCss, "@media (prefers-color-scheme: dark)"), ":root"),
);
const theme = decls(cssBlock(globalsCss, "@theme inline"));

// Bodies are brace-matched rather than regexed to the first `}`: `focus-ring`
// nests `&:focus` blocks, and a `[^}]*` body would truncate at the inner brace.
// `cssUtilities` is the shared implementation — this file and
// `design-docs.test.ts` carried two copies of it that had already drifted
// (one passed the opener with a `{`, the other without).
const utilities = cssUtilities(globalsCss);

// Utilities that are deliberately not typography roles. A new utility must
// be listed here or in TYPE_SCALE, or the type-scale test fails on it.
const NON_TYPOGRAPHY_UTILITIES = ["focus-ring", "focus-ring-child"];

const typographyUtilities = () =>
  utilities.filter(
    (utility) => !NON_TYPOGRAPHY_UTILITIES.includes(utility.name),
  );

const TYPE_SCALE = [
  "display-xl",
  "display-page",
  "display-l",
  "display-m",
  "display-entry",
  "display-s",
  "body-lead",
  "body-s",
  "body-xs",
  "label",
  "label-eyebrow",
  "label-nav",
  "label-tight",
  "mono-meta",
  "control",
  "wordmark",
  "wordmark-sm",
  "caption-italic",
];

describe("design delta token layer", () => {
  it("defines the near-square radius and exposes it to Tailwind", () => {
    expect(light["--radius"]).toBe("2px");
    expect(theme["--radius-sharp"]).toBe("var(--radius)");
  });

  it("inverts the primary button in dark mode instead of darkening it", () => {
    // Stone 900 ink on a Stone 900 ground would be invisible, so dark mode
    // reverses the relationship rather than darkening it. Asserted per block,
    // because a whole-file substring match passes even when the two are swapped.
    expect(light["--button-primary"]).toBe("var(--stone-900)");
    expect(light["--button-primary-hover"]).toBe("var(--stone-800)");
    expect(light["--button-primary-fg"]).toBe("var(--stone-50)");

    expect(dark["--button-primary"]).toBe("var(--stone-300)");
    expect(dark["--button-primary-hover"]).toBe("var(--stone-200)");
    expect(dark["--button-primary-fg"]).toBe("var(--stone-900)");
  });

  it("steps the label colour by mode so it clears AA in both", () => {
    // Stone 500 measures 2.73:1 on the light ground — under AA's 4.5:1 and
    // under even the 3:1 large-text floor — while clearing it comfortably on
    // dark. No single ramp value passes both, so this token is mode-dependent
    // even though the handoff describes the label colour as identical in both.
    expect(light["--text-label"]).toBe("var(--stone-700)");
    expect(dark["--text-label"]).toBe("var(--stone-500)");
    expect(theme["--color-text-label"]).toBe("var(--text-label)");
  });

  it("inverts the panel rules by mode instead of freezing them on the Stone ramp", () => {
    // The Stone ramp is fixed across modes, so `border-stone-900`/`-50` at a
    // call site swap roles in dark: the header rule drops to 1.21:1 (gone) and
    // the twelve row separators jump to 14.41:1 (twelve near-white hairlines).
    // These two tokens carry the intent instead of the value — strong stays
    // ~13:1 on its ground in both modes, hairline stays ~1.1-1.2:1.
    expect(light["--rule-strong"]).toBe("var(--stone-900)");
    expect(light["--rule-hairline"]).toBe("var(--stone-50)");
    expect(dark["--rule-strong"]).toBe("var(--stone-100)");
    expect(dark["--rule-hairline"]).toBe("var(--stone-900)");
    expect(theme["--color-rule-strong"]).toBe("var(--rule-strong)");
    expect(theme["--color-rule-hairline"]).toBe("var(--rule-hairline)");
  });

  it("keeps the home page's rules and marks off the fixed Stone ramp", () => {
    // The guardrail that would have caught the inversion above: any bare
    // `border-stone-*` / `bg-stone-*` on the restyled home page is a value that
    // cannot follow the surface. Scoped to page.tsx because the unrestyled
    // screens still carry Stone literals until their own phase sweeps them.
    const page = readFileSync(resolve(process.cwd(), "src/app/page.tsx"), "utf8");
    const offenders = page.match(/(?:border|bg)-stone-\d{2,3}(?![\w-])/g) ?? [];

    expect(offenders).toEqual([]);
  });

  it("keeps the returning-user link off the sub-AA tertiary text token", () => {
    // It renders only for visitors with stored results, so no render test on
    // the home page reaches it — this is asserted at the source. --text-tertiary
    // is #9d8b78 in BOTH modes: 3.28:1 on surface-1, under AA's 4.5:1 for the
    // 12px text it styles. --text-label steps by mode precisely to clear it.
    const source = readFileSync(
      resolve(process.cwd(), "src/components/ReturningUserLink.tsx"),
      "utf8",
    );

    expect(source).toContain("text-text-label");
    expect(source).not.toContain("text-text-tertiary");
  });

  it("keeps every button token mode-aware and mapped into the colour namespace", () => {
    // Structural invariant: any button token a later phase adds must carry a
    // dark override and a Tailwind mapping, or this fails.
    const buttonTokens = Object.keys(light).filter((key) =>
      key.startsWith("--button-"),
    );

    expect(buttonTokens.length).toBeGreaterThan(0);
    for (const token of buttonTokens) {
      expect(dark, `${token} has no dark-mode override`).toHaveProperty(token);
      expect(theme[`--color-${token.slice(2)}`]).toBe(`var(${token})`);
    }
  });

  it("declares exactly the type scale's typography roles", () => {
    expect(typographyUtilities().map((utility) => utility.name).sort()).toEqual(
      [...TYPE_SCALE].sort(),
    );
  });

  it("holds the 11px type floor across every typography role", () => {
    const sizes = typographyUtilities().map((utility) => {
      const match = utility.body.match(/font-size:\s*([0-9.]+)px/);
      expect(match, `${utility.name} declares no font-size`).not.toBeNull();
      return Number(match![1]);
    });

    expect(sizes).toHaveLength(TYPE_SCALE.length);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(11);
  });
});

const sources = sourceFiles(resolve(process.cwd(), "src"), [".tsx"]).map((file) => ({
  file,
  text: readFileSync(file, "utf8"),
}));

/** Offending sources for a banned pattern, reported with the fix to use. */
function offenders(pattern: RegExp, replacement: string): string[] {
  return sources.flatMap(({ file, text }) => {
    const match = text.match(pattern);
    return match
      ? [`${relative(process.cwd(), file)}: ${match[0]} (use ${replacement} instead)`]
      : [];
  });
}

/**
 * Radius values delta 02 exempts, named rather than pattern-matched: a
 * circle is not a rounded rectangle and a pill is not either, so neither
 * moves onto the token.
 */
const ALLOWED_RADII = new Set(["50%", "999px", "var(--radius)"]);

/**
 * Files the two radius guards below scan. Rooted at `src` rather than at
 * the section being swept: measured across all of `src` there are zero
 * offenders, so the wider root costs nothing today and permanently covers
 * the sections earlier phases swept, which until now leaned only on the
 * value-specific 12px/8px guards above.
 *
 * These roots must never grow to include `tests/`. The guards below spell
 * out the literals they ban in their own comments, and a text scan cannot
 * tell code from prose about code — a root that reached this file would
 * redden it on its own explanation, or (worse) be satisfied by it forever.
 */
const radiusScanFiles = sourceFiles(resolve(process.cwd(), "src"));

describe("near-square corners (design delta 02)", () => {
  it("has retired every 12px and 8px radius class literal from src", () => {
    // Covers the arbitrary-value spelling (rounded-[8px]), Tailwind's default
    // idiomatic names for the same corners (rounded-lg is 0.5rem = 8px,
    // rounded-xl is 0.75rem = 12px), and directional variants of both
    // (rounded-t-[8px], rounded-tl-[8px]). Does not match rounded-sharp,
    // rounded-2xl/md/full/none, or bare rounded — those are untouched or
    // deliberately deferred to issue #139.
    const pattern = /rounded(?:-[a-z]{1,2})?-(?:\[(?:12|8)px\]|lg|xl)(?![\w-])/;
    const offenders = sources.flatMap(({ file, text }) => {
      const match = text.match(pattern);
      return match
        ? [
            `${relative(process.cwd(), file)}: ${match[0]} (use rounded-sharp instead)`,
          ]
        : [];
    });

    expect(offenders).toEqual([]);
  });

  it("has retired every 12px and 8px inline border radius from src", () => {
    // A class-only sweep misses inline styles, which is how CompareView's
    // panel kept an 8px corner. Guards the quoted form ("8px", '8px', `8px`)
    // and the unquoted numeric form React accepts (borderRadius: 8), which
    // MapLegend.tsx and DemographicAggregates.tsx already use elsewhere.
    const pattern = /borderRadius:\s*(?:["'`](?:12|8)px["'`]|(?:12|8)\s*[,}])/;
    const offenders = sources.flatMap(({ file, text }) => {
      const match = text.match(pattern);
      return match
        ? [
            `${relative(process.cwd(), file)}: ${match[0]} (use var(--radius) instead)`,
          ]
        : [];
    });

    expect(offenders).toEqual([]);
  });

  it("has retired every 12px and 8px radius from the stylesheet", () => {
    // globals.css is where later phases add shared styling, and the two tests
    // above only scan .tsx files.
    expect(globalsCss).not.toMatch(/border-radius:\s*(?:12|8)px/);
  });

  it("spells every quoted style-prop radius in src as the token", () => {
    // The two shipped cases in this block catch 12px and 8px, which is what
    // the rest of the codebase had. /study had none of those and 39 of
    // something else — 1, 2, 3, 4 and 6px, five spellings of one intent, all
    // invisible to a guard written around the two values the sweep removed.
    // 34 of the 39 were the quoted style-prop form this case reads; the
    // unquoted and CSS-syntax spellings are the case below, and the two are
    // complementary halves rather than one broad scan and one narrow one.
    //
    // All three quote styles, matching the 12px/8px case above: a literal
    // that only a single-quote scan would see is exactly the one that gets
    // written next.
    expect(radiusScanFiles.length).toBeGreaterThan(0);

    const offenders = radiusScanFiles.flatMap((file) => {
      const text = readFileSync(file, "utf8");
      return [...text.matchAll(/borderRadius: *(["'`])([^"'`]*)\1/g)]
        .map(([, , value]) => value)
        .filter((value) => !ALLOWED_RADII.has(value))
        .map((value) => `${relative(process.cwd(), file)}: ${value}`);
    });

    expect(offenders).toEqual([]);
  });

  it("spells every unquoted and CSS-syntax radius in src as the token", () => {
    // Two spellings the case above cannot see, both of which /study had: the
    // unquoted numeric form React accepts, and the CSS property inside a
    // <style>{`…`}</style> block. Five of the 39, and the ones a sweep
    // written around whichever spelling came first leaves standing.
    //
    // The CSS terminator is [;}] rather than ;, so an unterminated final
    // declaration in a block is still seen.
    expect(radiusScanFiles.length).toBeGreaterThan(0);

    const offenders = radiusScanFiles.flatMap((file) => {
      const text = readFileSync(file, "utf8");
      const unquoted = [...text.matchAll(/borderRadius: *([^"'`\s][^,\n}]*)/g)]
        .map(([, value]) => value.trim().replace(/,$/, ""))
        .filter((value) => !ALLOWED_RADII.has(value));
      const css = [...text.matchAll(/border-radius: *([^;}]+)[;}]/g)]
        .map(([, value]) => value.trim().replace(/\s*!important$/, "").trim())
        .filter((value) => !ALLOWED_RADII.has(value));
      return [...unquoted, ...css].map(
        (value) => `${relative(process.cwd(), file)}: ${value}`,
      );
    });

    expect(offenders).toEqual([]);
  });
});

describe("focus ring", () => {
  it("routes every focus ring through the focus-ring utilities", () => {
    // The hand-rolled spelling this replaced was silently broken:
    // `focus:outline-none` emits `--tw-outline-style: none`, and :focus always
    // matches when :focus-visible does, so `outline-style: var(...)` resolved
    // to `none`. Width and colour applied; the ring never painted. Confirmed
    // in Chromium before the sweep, across all 25 former call sites.
    expect(offenders(/focus:outline-none/, "focus-ring")).toEqual([]);
    // Same defect, different variant. Tailwind 4.3.3 emits
    // `.focus-within\:outline-none:focus-within` (which sets
    // `outline-style: none` outright) AFTER
    // `.focus-within\:outline-2:focus-within`; both match at once, so the
    // later rule wins. Verified by compiling both classes against this repo's
    // Tailwind, not inferred from the :focus/:focus-visible case.
    expect(offenders(/focus-within:outline-none/, "focus-ring-child")).toEqual([]);
    // And the spelling that *works* but bypasses the utility. This assertion was
    // deliberately absent until `account/page.tsx` was swept: it hand-rolled a
    // ring that painted correctly but hardcoded `stone-600` instead of reading
    // `var(--focus-ring)`, so the title's "every" was an overclaim. With that
    // gone, `focus-ring` and `focus-ring-child` are the only way a ring is drawn
    // anywhere in src, and the claim is now literally true.
    expect(offenders(/focus-visible:outline-/, "focus-ring")).toEqual([]);
  });

  it("paints a real outline off the focus-ring token", () => {
    const utility = utilities.find((entry) => entry.name === "focus-ring");

    expect(utility, "focus-ring utility is missing").toBeDefined();
    // The `outline` shorthand sets style explicitly, so it cannot be undone by
    // a custom property the way `outline-style: var(--tw-outline-style)` was.
    expect(utility!.body).toMatch(/outline:\s*2px solid var\(--focus-ring\)/);
    // The offset is the one declaration that could drift silently — deleting it
    // left the suite green before this assertion existed.
    expect(utility!.body).toMatch(/outline-offset:\s*2px/);
    expect(light["--focus-ring"]).toBe("var(--stone-600)");
  });

  it("draws the card ring on the wrapper, for its own control only", () => {
    const utility = utilities.find((entry) => entry.name === "focus-ring-child");

    expect(utility, "focus-ring-child utility is missing").toBeDefined();
    // `:focus-visible` rather than `:focus-within`: the ring belongs to the
    // card, but the focusable element is the sr-only button inside it, and a
    // mouse click on a card must not leave a ring behind.
    expect(utility!.body).not.toMatch(/&:focus-within/);
    // Scoped to a DIRECT BUTTON child, not any descendant. The card's prose
    // runs through AnnotatedText -> GlossaryTerm, whose trigger is a
    // `span[role=button][tabindex=0]` — focusable, and carrying no ring of its
    // own. An unscoped `:has(:focus-visible)` rings the whole card while focus
    // sits on an inline glossary term, which points the only affordance on
    // screen at the wrong control.
    expect(utility!.body).toMatch(/:has\(\s*>\s*button:focus-visible\s*\)/);
    // The `outline` shorthand sets style explicitly, so it cannot be undone by
    // a custom property the way `outline-style: var(--tw-outline-style)` was.
    expect(utility!.body).toMatch(/outline:\s*2px solid var\(--focus-ring\)/);
    expect(utility!.body).toMatch(/outline-offset:\s*2px/);
  });
});

describe("data marks step by mode (design delta 06)", () => {
  it("steps every domain mark from its 600 tone to its 400 tone in dark", () => {
    // Domain 600 goes muddy on dark surfaces. DOMAIN_COLORS is a fixed-hex
    // TypeScript object read at render time, so no call site can express this
    // — it has to be a custom property. Asserted as an exhaustive pair map
    // rather than four loose assertions, so adding a fifth domain without a
    // dark step fails here rather than shipping a muddy mark.
    expect({
      economic: light["--domain-economic"],
      power: light["--domain-power"],
      society: light["--domain-society"],
      world: light["--domain-world"],
    }).toEqual({
      economic: "var(--stone-600)",
      power: "var(--slate-600)",
      society: "var(--sage-600)",
      world: "var(--clay-600)",
    });
    expect({
      economic: dark["--domain-economic"],
      power: dark["--domain-power"],
      society: dark["--domain-society"],
      world: dark["--domain-world"],
    }).toEqual({
      economic: "var(--stone-400)",
      power: "var(--slate-400)",
      society: "var(--sage-400)",
      world: "var(--clay-400)",
    });
  });

  it("steps the unified mark alongside the domains", () => {
    // The radar polygons and the mini radar's user shape are one Stone mark,
    // not a domain one, and they step on the same schedule.
    expect(light["--mark-primary"]).toBe("var(--stone-600)");
    expect(dark["--mark-primary"]).toBe("var(--stone-400)");
  });

  it("exports the marks so Tailwind compiles their colour utilities", () => {
    // The setup for the bug this project has shipped three times: a token
    // declared with a dark inversion but never exposed, so a call site reaches
    // for a ramp literal because the inverting token appears not to exist.
    for (const name of ["economic", "power", "society", "world"]) {
      expect(theme[`--color-domain-${name}`]).toBe(`var(--domain-${name})`);
    }
    expect(theme["--color-mark-primary"]).toBe("var(--mark-primary)");
  });

  it("caps the results column at the mock's 820px", () => {
    expect(theme["--container-results"]).toBe("820px");
  });

  it("names all five page measures as tokens, so none is spelled as a literal", () => {
    // A width spelled `max-w-3xl` reads as a generic size rather than as
    // "the study column", so a later phase retunes one page and silently
    // desyncs it from another on the same measure. 1200 is the persona
    // browser's: it is the only measure in the product wider than the chrome
    // shell, and it is wider on purpose (D26) — a two-column data browser,
    // not a prose page.
    expect(theme["--container-shell"]).toBe("1040px");
    expect(theme["--container-results"]).toBe("820px");
    expect(theme["--container-reference"]).toBe("660px");
    expect(theme["--container-quiz"]).toBe("672px");
    expect(theme["--container-browse"]).toBe("1200px");
  });

  it("keeps the browser measure the widest, since that is the only reason it exists", () => {
    // If a later retune drops --container-browse to or below the shell, the
    // token has stopped earning its place and should be deleted rather than
    // left as a second name for 1040px.
    const px = (name: string) => Number.parseInt(theme[name], 10);

    expect(px("--container-browse")).toBeGreaterThan(px("--container-shell"));
  });

  it("holds the quiz column on its token rather than the generic Tailwind size", () => {
    const quizFlow = readFileSync(
      resolve(process.cwd(), "src/components/quiz/QuizFlow.tsx"),
      "utf8",
    );

    expect(quizFlow).toContain("max-w-quiz");
    expect(quizFlow).not.toContain("max-w-2xl");
  });

  it("maps each axis to its domain's mark variable", () => {
    // Axis 1-2 economic, 3-6 power, 7-9 society, 10-12 world. Asserted across
    // all twelve rather than one per domain, because an off-by-one in
    // AXIS_TO_DOMAIN would put a Slate dot on an Economic row and nothing
    // else would fail.
    expect(Array.from({ length: 12 }, (_, i) => getDomainMarkVar(i + 1))).toEqual([
      "var(--domain-economic)", "var(--domain-economic)",
      "var(--domain-power)", "var(--domain-power)", "var(--domain-power)", "var(--domain-power)",
      "var(--domain-society)", "var(--domain-society)", "var(--domain-society)",
      "var(--domain-world)", "var(--domain-world)", "var(--domain-world)",
    ]);
  });
});

describe("body-s (design delta 01)", () => {
  it("names the delta's most-used sans size so the pair cannot drift", () => {
    // Nine call sites carried `text-[13.5px] leading-[1.6]` by convention
    // alone, and phase 3's guard on the pairing passes vacuously where the
    // size is deleted outright — measured, deleting the pair at each of the
    // nine sites reddened the suite at only three.
    const utility = utilities.find((entry) => entry.name === "body-s");

    expect(utility, "body-s utility is missing").toBeDefined();
    expect(utility!.body).toMatch(/font-size:\s*13\.5px/);
    expect(utility!.body).toMatch(/line-height:\s*1\.6/);
    expect(utility!.body).toMatch(/font-family:\s*var\(--font-sans\)/);
    // Distinct from caption-italic, which is 13.5px SERIF italic and declares
    // its own colour. body-s declares no colour: it is layered with a
    // text-* class at every call site.
    expect(utility!.body).not.toMatch(/color:/);
    expect(utility!.body).not.toMatch(/font-style:/);
  });
});

describe("body-xs (design delta 04)", () => {
  it("names the meta column's subordinate prose so its line-height cannot drift unseen", () => {
    // The 11px type-floor test above only reads font-size, so a line-height
    // regression on any role — this one included — passes it vacuously. This
    // block is body-s's, mirrored, because that is what actually pins 1.5.
    const utility = utilities.find((entry) => entry.name === "body-xs");

    expect(utility, "body-xs utility is missing").toBeDefined();
    expect(utility!.body).toMatch(/font-size:\s*12px/);
    expect(utility!.body).toMatch(/line-height:\s*1\.5/);
    expect(utility!.body).toMatch(/font-family:\s*var\(--font-sans\)/);
    // Declares no colour: it is layered with a text-* class at every call site.
    expect(utility!.body).not.toMatch(/color:/);
  });
});

/** Every page and component the delta has swept. Issue #151's instruction is
 *  to widen this "as each directory lands", so phase 5b appends /study's
 *  three directories rather than opening a parallel list. */
const SWEPT = [
  "src/app/archetypes",
  "src/app/references",
  "src/app/axes",
  "src/app/questions",
  "src/app/methodology",
  "src/app/compare",
  "src/app/groups",
  "src/app/account",
  "src/app/auth",
  "src/components/comparison",
  "src/components/groups",
  "src/components/annotations",
  "src/components/PageHeader.tsx",
  "src/components/ReferenceCta.tsx",
  // Phase 5b. `src/lib/study` is included deliberately even though it is
  // pure logic today and clean against all six guards — it is where a
  // colour or a class would go if one of these charts grew a helper, and a
  // directory is cheaper to add now than to remember later.
  "src/app/study",
  "src/components/study",
  "src/lib/study",
];

/** 1-based line number of a byte offset, for an actionable failure message. */
function lineOf(text: string, index: number): number {
  return text.slice(0, index).split("\n").length;
}

function sweptSources(): { file: string; text: string }[] {
  const sources = SWEPT.flatMap((entry) => {
    const path = resolve(process.cwd(), entry);
    const files = entry.endsWith(".tsx") ? [path] : sourceFiles(path);
    // Comments out, once, for every guard below: a whole-file text scan
    // cannot tell a declaration from prose about a declaration, and this
    // block bans literals that its own explanations have to name. Without
    // this, `src/lib/study/budgetColors.ts` reddens the raw-hex case on two
    // hexes that appear only inside a doc comment.
    return files.map((file) => ({
      file,
      text: stripComments(readFileSync(file, "utf8")),
    }));
  });

  // Every guard below is `expect(offenders).toEqual([])` over a flatMap, and
  // `[].flatMap(...)` is `[]` — so an empty sweep leaves all six green while
  // reading nothing. Measured: emptying SWEPT to `[]` reddened none of the
  // six until this throw existed. Raising it here rather than asserting it in
  // each guard keeps the vacuity check in the one place all six share.
  if (sources.length === 0) {
    throw new Error("SWEPT resolved to no files — every guard below would pass vacuously");
  }

  return sources;
}

describe("phase 5 sweep holds (design delta D20)", () => {
  it("actually reaches the swept files, so the six guards below cannot pass vacuously", () => {
    // SWEPT is the single point of failure for all six guards at once, and
    // every one of them is `expect(offenders).toEqual([])` over a flatMap —
    // which is green on an empty file list. Naming a directory that does not
    // exist is the safe failure (`sourceFiles` throws, loudly). Naming one
    // that exists and holds nothing relevant is the silent one, and no guard
    // below can detect it. This case is the only thing that does, so it is
    // load-bearing for the whole block rather than a tidiness check.
    //
    // Anchors, not just a count: these are the files the phase's own
    // mutation testing targets. If the sweep cannot see them, the evidence
    // that the guards work does not transfer to the guards that shipped.
    const swept = sweptSources().map(({ file }) => relative(process.cwd(), file));

    expect(swept.length).toBeGreaterThanOrEqual(50);
    for (const anchor of [
      "src/app/questions/page.tsx",
      "src/app/compare/page.tsx",
      "src/app/compare/[profileId1]/[profileId2]/page.tsx",
      "src/app/auth/signin/page.tsx",
      "src/components/annotations/AnnotationEditor.tsx",
      "src/components/groups/GroupRadar.tsx",
      "src/components/ReferenceCta.tsx",
      "src/components/PageHeader.tsx",
      "src/app/study/patterns/page.tsx",
      "src/components/study/PersonaModal.tsx",
      "src/components/study/WorldMap.tsx",
    ]) {
      expect(swept, `sweep does not reach ${anchor}`).toContain(anchor);
    }
  });

  it("keeps the sub-AA tertiary text token off every swept surface", () => {
    // 3.28:1 on surface-1, in BOTH modes. The label layer takes
    // `text-text-label`; prose takes `text-text-secondary`. There is no
    // remaining use for this token on these pages.
    //
    // BOTH spellings. The Tailwind class is how it appears on an element;
    // `var(--text-tertiary)` is how it appears in an inline style, which is
    // the form SVG text needs because `fill` takes no Tailwind colour class.
    // ComparisonRadar's hover tooltip survived this phase's sweep in exactly
    // that form, past a class-only version of this guard, and was found by
    // reading rather than by a test.
    const offenders = sweptSources().flatMap(({ file, text }) => {
      const match = text.match(/text-text-tertiary|var\(--text-tertiary\)/);
      return match ? [`${relative(process.cwd(), file)}: ${match[0]}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("never gives an element a hover that resolves to its resting value", () => {
    // Two of these shipped in this phase before review caught them, by two
    // different routes, so the guard covers the class rather than the pair.
    //
    // The blunt case: a card resting on `bg-surface-2` with
    // `hover:bg-surface-2`. Same token, same value, nothing happens.
    //
    // The subtle case, and the reason this is a guard and not a code review
    // note: `--text-label` is `var(--stone-700)` and `--text-secondary` is
    // `#6e5a48` — the SAME hex in light mode, different in dark. So
    // `text-text-label hover:text-text-secondary` animates for 150ms between
    // two identical colours on a light page and works fine on a dark one.
    // No class-name assertion catches it, because both classes are correct in
    // isolation; only knowing they are aliases does. Hover targets on the
    // label layer go to `text-text-primary`, which differs in both modes.
    const ALIASES: [string, string][] = [["text-text-label", "text-text-secondary"]];
    // A className carrying one of these sits on the label layer even without
    // naming `text-text-label`, because each role declares that colour. Sites
    // that instead INHERIT their rest colour from a labelled parent were made
    // explicit rather than left invisible here — a guard that silently skips
    // the shape it was written for is the failure mode this phase kept hitting.
    const LABEL_ROLES = new Set([
      "label",
      "label-nav",
      "label-eyebrow",
      "label-tight",
      "mono-meta",
    ]);

    // Read per ELEMENT, off class TOKENS, in every spelling of the attribute.
    // The shipped version scanned `/className="[^"]*"/`, which is the quoted
    // form only — so `SectionNav`, whose classes are a ternary inside a
    // template literal, was invisible to it. Measured: restoring the aliased
    // hover there left this case GREEN and only the section's own render test
    // caught it. Same lesson as the ramp and the `<style>` block: match the
    // token, not the syntax.
    const offenders = sweptSources().flatMap(({ file, text }) => {
      const hits: string[] = [];
      for (const tokens of classNameTokenLists(text)) {
        const resting = new Set(tokens.filter((token) => !token.includes(":")));
        for (const token of tokens) {
          if (!token.startsWith("hover:")) continue;
          const target = token.slice("hover:".length);
          if (!/^[a-z]+-[a-z0-9-]+$/.test(target)) continue;
          if (resting.has(target)) hits.push(`${token} over itself`);
          for (const [a, b] of ALIASES) {
            const [rest, want] = target === b ? [a, b] : target === a ? [b, a] : [null, null];
            if (!rest) continue;
            const byRole =
              rest === "text-text-label" && tokens.some((t) => LABEL_ROLES.has(t));
            if (resting.has(rest) || byRole) hits.push(`hover:${want} over ${rest}`);
          }
        }
      }
      return hits.map((h) => `${relative(process.cwd(), file)}: ${h}`);
    });

    expect(offenders).toEqual([]);
  });

  it("keeps the frozen Stone ramp off every swept surface", () => {
    const offenders = sweptSources().flatMap(({ file, text }) => {
      const match = text.match(/(?:text|bg|border)-stone-\d{2,3}(?![\w-])/);
      return match ? [`${relative(process.cwd(), file)}: ${match[0]}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("admits no hue outside Stone and the warning family", () => {
    // The palette is two accents. This catches a Tailwind colour utility from
    // any other family — red, green, blue, amber-by-name — which is how both
    // `text-red-600` and the `#b5942e` spoiler got in.
    const banned =
      /(?:text|bg|border)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?![\w-])/;
    const offenders = sweptSources().flatMap(({ file, text }) => {
      const match = text.match(banned);
      return match ? [`${relative(process.cwd(), file)}: ${match[0]}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("admits no raw hex on a swept surface", () => {
    // `#b5942e` and `#85735e` both shipped as inline literals on /questions.
    // A hex cannot invert, and an inline style is invisible to every
    // class-scanning guard above it.
    //
    // Deliberately broad: this is a whole-file text scan, so it also reddens
    // on a hex in a comment, a URL fragment or an SVG attribute. That is not a
    // false positive worth narrowing away — a hex written anywhere in these
    // files is one copy-paste from being a hex in a `style` prop, and no
    // swept file currently needs one. Narrow it only when a site arrives that
    // genuinely does, and say here what the narrowed pattern stops catching.
    //
    // SCOPE: six or eight digits (eight covers `#00000020`-style alpha). It
    // does NOT catch three-digit shorthand — `#fff` slips through, which
    // matters because hard-coded white ink was one of the defects this phase
    // removed. Extending to `{3,8}` was measured against every swept file and
    // false-positives on nothing today, but it collides with plausible future
    // anchor hrefs (`#def`, `#add`, `#fee` are all valid hex), and a guard
    // that cries wolf on an `href` gets deleted. Six-digit collisions
    // (`#decade`, `#facade`) are the accepted residual risk.
    const offenders = sweptSources().flatMap(({ file, text }) => {
      const match = text.match(/#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?\b/);
      return match ? [`${relative(process.cwd(), file)}: ${match[0]}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("routes every swept control through the button primitive", () => {
    // A hand-rolled control is not merely inconsistent: all nine that this
    // phase replaced froze their hover fill on `bg-stone-100`, a near-white
    // flash on a dark page.
    //
    // SCOPE, stated so this is not mistaken for more than it is: the check is
    // per FILE, not per element. A file holding one `<Button>` and one bare
    // `<button>` passes, because the import is present. It catches a file that
    // is entirely hand-rolled — which is what all nine of the replaced sites
    // were — and nothing finer. A per-element guard would need a parse, not a
    // scan.
    //
    // /study's chrome controls are hand-rolled by decision, not by
    // accident (phase 5b, D27): pagination arrows, a modal close x, pin
    // toggles, tab chips and tension badges. `Button` is a page-level CTA
    // with 34px of horizontal padding, and routing an icon toggle through
    // it produces a 60px-wide close control in the corner of a dialog.
    // Adding a fourth "quiet" variant was the other option and was
    // rejected — the delta specifies three tiers in as many words.
    //
    // What these files ARE held to is the ring, which is the thing that was
    // actually broken: see `tests/unit/study-controls.test.ts`, *gives every
    // hand-rolled control a focus ring*. That case is per ELEMENT, so it is
    // strictly stronger than this one, and it is why excluding them here
    // costs nothing.
    //
    // `CompareFloatingButton.tsx` is named for completeness and is a no-op
    // today: it imports `Button` for its page-level CTA and hand-rolls only
    // the dismiss control beside it, so the per-FILE check above already
    // passes it. Deleting it from this list would not change the result;
    // keeping it records that its bare control is deliberate too.
    const HAND_ROLLED_CHROME = [
      "PersonaModal.tsx",
      "PersonasPageClient.tsx",
      "CompareView.tsx",
      "PersonaGrid.tsx",
      "CompareFloatingButton.tsx",
      "ComparePinButton.tsx",
    ];
    const offenders = sweptSources().flatMap(({ file, text }) => {
      if (HAND_ROLLED_CHROME.some((name) => file.endsWith(name))) return [];
      if (!/<button\b/.test(text)) return [];
      return text.includes('from "@/components/Button"')
        ? []
        : [relative(process.cwd(), file)];
    });

    expect(offenders).toEqual([]);
  });

  it("caps every swept page on a width token rather than a Tailwind size", () => {
    // ComparisonRadar and GroupRadar are excluded from THIS case only. Their
    // `max-w-xl` caps an `<svg>`, not a page measure, so it is not drift of
    // the kind the width tokens exist to prevent — and minting a
    // `max-w-radar` token to satisfy a text scan would trade this drift risk
    // for a worse one: a chart cap that silently tracks a page measure.
    // Both files remain subject to every other guard in this block.
    const SVG_CAPPED = ["ComparisonRadar.tsx", "GroupRadar.tsx"];
    const offenders = sweptSources().flatMap(({ file, text }) => {
      if (SVG_CAPPED.some((name) => file.endsWith(name))) return [];
      const match = text.match(/max-w-(?:2xl|3xl|xl)(?![\w-])/);
      return match ? [`${relative(process.cwd(), file)}: ${match[0]}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("names no custom property that globals.css has never declared", () => {
    // `var(--text-xs, 10px)` appeared at ten sites and five of them
    // disagreed with the other five about the fallback. Every one rendered
    // its fallback, and a reader saw a token name and believed there was a
    // token. Generalised past --text-xs: any `var(--foo)` a swept file names
    // must exist in the stylesheet.
    //
    // Two scope notes, both measured against the whole of src/ rather than
    // reasoned about:
    //
    // 1. The pattern requires a CLOSING `)` or a `,` after the name, which
    //    excludes the dynamic form built by interpolating an id into the
    //    token name. Without that, three prefixes (cluster, map density and
    //    model) report as undeclared at nine sites, all of them correct
    //    code. A guard that cries wolf on correct code gets deleted, so it
    //    does not see the dynamic form at all — and cannot, without
    //    evaluating the template.
    // 2. Three properties are declared outside globals.css and are named
    //    here rather than pattern-matched, so that adding a fourth is a
    //    deliberate act.
    const DECLARED_ELSEWHERE = new Set([
      "--font-source-serif", // next/font, injected on <html>
      "--petal-opacity", // set inline per petal by RadarChart
      "--tw-outline-style", // Tailwind internal
    ]);
    const declared = new Set([
      ...Object.keys(light),
      ...Object.keys(dark),
      ...Object.keys(theme),
      ...DECLARED_ELSEWHERE,
    ]);

    const offenders = sweptSources().flatMap(({ file, text }) => {
      const named = [...text.matchAll(/var\((--[a-z0-9-]+)\s*[,)]/g)].map((m) => m[1]);
      return [...new Set(named)]
        .filter((name) => !declared.has(name))
        .map((name) => `${relative(process.cwd(), file)}: ${name}`);
    });

    expect(offenders).toEqual([]);
  });

  it("keeps the frozen mark tones out of every inline style in the section", () => {
    // The shipped ramp guard above matches `text|bg|border-stone-NNN`, which
    // is a TAILWIND CLASS. /study names the ramp inline instead, wrapped in
    // `var(...)`, at twelve sites across twelve files — invisible to that
    // guard in every one of them.
    //
    // 600 and 400 are the mark tones, and a mark must step by mode:
    // `--mark-primary` is the 600 tone in light and the 400 tone in dark, so
    // either literal freezes it to one of the two.
    //
    // 900 and 50 are deliberately NOT banned. They appear in `TensionMatrix`
    // and `WorldMap` as ink printed ON a filled cell, where the colour is
    // chosen for contrast against the fill rather than as a mark — the same
    // category D24 carves out for chart text. Ban them and the only way to
    // pass is to make that ink illegible.
    //
    // BOTH SPELLINGS, and the second is the one that hides. A component can
    // hold the bare NAME and interpolate it into `var(...)` at the point of
    // use, which no scan for the wrapped form can match. Task 6's
    // implementer found one of those in a file no task's list covered. This
    // is the third time in this phase a guard has been blind to a spelling
    // rather than to a site: the `<style>`-block hover was the first, the
    // inline-vs-class ramp the second. The lesson is the same each time —
    // match the TOKEN, not the syntax somebody happened to write it in.
    //
    // This case no longer has to mind its own comment: `sweptSources()`
    // strips comments, and `tests/` is not a swept root anyway. Task 6's
    // implementer reddened this guard against its own prose before that was
    // true, reworded around it, and then — correctly — mutation-tested the
    // case rather than accepting the green, because a guard that went green
    // when you edited a COMMENT has told you nothing about the code.
    //
    // One file is exempt, and the exemption is narrow on purpose. Task 8
    // extracted the mini budget strip's seven ministry fills — duplicated
    // byte for byte between `PersonaModal` and `CompareView` — into a single
    // module. Six are cluster tokens; the seventh is the 400 tone, and Task 7
    // showed token by token that every mode-stepping value in the stylesheet
    // collides with one of the six beside it. The resolution was NOT to mint
    // a seventh colour — spec "Scope and constraints" opens with "No new
    // colours" — because the premise that collision analysis never tested is
    // the one that settles it: that tone is MODE-INVARIANT. It is declared
    // once in `:root` and never redefined in the dark block, so it does not
    // freeze a mark to one mode; there is no mark here to freeze. It is one
    // categorical fill among seven whose only job is to differ from the six
    // beside it — the same reasoning that leaves 900 and 50 unbanned above.
    const MARK_TONE_EXEMPT = new Set(["src/lib/study/budgetColors.ts"]);

    // FOUND BY THIS GUARD, NOT DECIDED BY ANYONE. Widening the case to the
    // whole sweep — which is what it should be, since the defect is a
    // spelling and not a section — turns up the same frozen literal at
    // seventeen sites in four files phase 5 swept. Phase 5's ramp guard
    // reads classes only, so it never saw them, and this is the first scan
    // that could. They are listed rather than fixed because phase 5b's remit
    // is /study and repainting four shipped charts is a visual change that
    // belongs to its own task; the entry is reported upward as debt.
    //
    // Grow these lists, do not weaken the guard. Naming the files keeps the
    // ban live on the other sixty-five; loosening the pattern would not, and
    // deleting an entry is how a reader learns the debt was paid.
    const PHASE_5_INLINE_RAMP = new Set([
      "src/components/comparison/ComparisonRadar.tsx",
      "src/components/comparison/BudgetComparison.tsx",
      "src/components/groups/GroupRadar.tsx",
      "src/components/groups/GroupScoreBar.tsx",
    ]);

    const offenders = sweptSources().flatMap(({ file, text }) => {
      const rel = relative(process.cwd(), file);
      if (MARK_TONE_EXEMPT.has(rel) || PHASE_5_INLINE_RAMP.has(rel)) return [];
      // Global, so a file with four frozen fills reports four. Every other
      // case in this block reports one site per file, which is survivable
      // when the fix is one edit and misleading when it is twelve.
      return [...text.matchAll(/--stone-(?:600|400)\b/g)].map(
        (match) => `${rel}:${lineOf(text, match.index!)} ${match[0]}`,
      );
    });

    expect(offenders).toEqual([]);
  });

  it("holds the type floor on every swept HTML element", () => {
    // 11px is the delta's hard floor. /study had about twenty-five HTML
    // sites under it — 10px and 9px, inline and as classes.
    //
    // SCOPE, and it is a real one: this reads `fontSize:` in style objects
    // and arbitrary-value text size classes. SVG <text> sizes its labels
    // with a numeric `fontSize` ATTRIBUTE, which this pattern does not
    // match, and that is deliberate per D24 rather than an accident of the
    // regex — read that decision before "fixing" this to catch them.
    //
    // Every px LENGTH in the value, not just a value that IS one. The
    // spelling this section actually shipped was `var(--text-xs, 10px)` at
    // ten sites: a size that renders at 10px through a fallback, and one a
    // `fontSize: "10px"` pattern cannot see. Measured against all of the
    // swept files, reading the whole value adds no false positive.
    const offenders = sweptSources().flatMap(({ file, text }) => {
      const sizes = [
        ...[...text.matchAll(/fontSize: *"([^"]*)"/g)].flatMap(([, value]) =>
          [...value.matchAll(/([\d.]+)px/g)].map((m) => Number(m[1])),
        ),
        ...[...text.matchAll(/text-\[([\d.]+)px\]/g)].map((m) => Number(m[1])),
      ];
      return sizes
        .filter((px) => px < 11)
        .map((px) => `${relative(process.cwd(), file)}: ${px}px`);
    });

    expect(offenders).toEqual([]);
  });
});
