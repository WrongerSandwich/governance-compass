import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Comments are stripped once, here, so every helper below sees declaration
// text only. block() is the reason this belongs at the top rather than inside
// decls(): it locates blocks by indexOf and matches braces by depth, so a
// comment that merely mentions `:root` or contains a stray `}` would silently
// anchor it to the wrong place.
const globalsCss = readFileSync(
  resolve(process.cwd(), "src/app/globals.css"),
  "utf8",
).replace(/\/\*[\s\S]*?\*\//g, "");

/** Body of a top-level block, brace-matched so nested blocks don't truncate it. */
function block(css: string, opener: string): string {
  const start = css.indexOf(opener);
  if (start === -1) throw new Error(`block not found: ${opener}`);
  const braceStart = css.indexOf("{", start);
  let depth = 0;
  for (let i = braceStart; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(braceStart + 1, i);
    }
  }
  throw new Error(`unterminated block: ${opener}`);
}

/** Custom-property declarations in a block, whitespace-normalised. */
function decls(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [, name, value] of css.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) {
    out[name] = value.trim();
  }
  return out;
}

const light = decls(block(globalsCss, ":root"));
const dark = decls(
  block(block(globalsCss, "@media (prefers-color-scheme: dark)"), ":root"),
);
const theme = decls(block(globalsCss, "@theme inline"));

// Bodies are brace-matched rather than regexed to the first `}`: `focus-ring`
// nests `&:focus` blocks, and a `[^}]*` body would truncate at the inner brace.
const utilities = [...globalsCss.matchAll(/@utility ([a-z0-9-]+) \{/g)].map(
  (match) => ({
    name: match[1],
    body: block(globalsCss.slice(match.index!), `@utility ${match[1]}`),
  }),
);

// Utilities that are deliberately not typography roles. A new utility must
// be listed here or in TYPE_SCALE, or the type-scale test fails on it.
const NON_TYPOGRAPHY_UTILITIES = ["focus-ring"];

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

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}

const sources = tsxFiles(resolve(process.cwd(), "src")).map((file) => ({
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
});

describe("focus ring", () => {
  it("routes every focus ring through the focus-ring utility", () => {
    // The hand-rolled spelling this replaced was silently broken:
    // `focus:outline-none` emits `--tw-outline-style: none`, and :focus always
    // matches when :focus-visible does, so `outline-style: var(...)` resolved
    // to `none`. Width and colour applied; the ring never painted. Confirmed
    // in Chromium before the sweep, across all 25 former call sites.
    expect(offenders(/focus:outline-none/, "focus-ring")).toEqual([]);
  });

  it("is the only consumer of the focus-ring token, and paints a real outline", () => {
    const utility = utilities.find((entry) => entry.name === "focus-ring");

    expect(utility, "focus-ring utility is missing").toBeDefined();
    // The `outline` shorthand sets style explicitly, so it cannot be undone by
    // a custom property the way `outline-style: var(--tw-outline-style)` was.
    expect(utility!.body).toMatch(/outline:\s*2px solid var\(--focus-ring\)/);
    expect(light["--focus-ring"]).toBe("var(--stone-600)");
  });
});
