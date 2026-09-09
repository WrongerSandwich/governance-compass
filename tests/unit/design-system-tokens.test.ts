import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const globalsCss = readFileSync(
  resolve(process.cwd(), "src/app/globals.css"),
  "utf8",
);

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
  const body = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) {
    out[name] = value.trim();
  }
  return out;
}

const light = decls(block(globalsCss, ":root"));
const dark = decls(
  block(block(globalsCss, "@media (prefers-color-scheme: dark)"), ":root"),
);
const theme = decls(block(globalsCss, "@theme inline"));

const utilities = [
  ...globalsCss.matchAll(/@utility ([a-z0-9-]+) \{([^}]*)\}/g),
].map(([, name, body]) => ({ name, body }));

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
  "mono-meta",
  "control",
  "wordmark",
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
    expect(utilities.map((utility) => utility.name).sort()).toEqual(
      [...TYPE_SCALE].sort(),
    );
  });

  it("holds the 11px type floor across every typography role", () => {
    const sizes = utilities.map((utility) => {
      const match = utility.body.match(/font-size:\s*([0-9.]+)px/);
      expect(match, `${utility.name} declares no font-size`).not.toBeNull();
      return Number(match![1]);
    });

    expect(sizes).toHaveLength(TYPE_SCALE.length);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(11);
  });
});

describe("near-square corners (design delta 02)", () => {
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

  it("has retired every 12px and 8px radius class literal from src", () => {
    const offenders = sources
      .filter(({ text }) => /rounded-\[(?:12|8)px\]/.test(text))
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });

  it("has retired every 12px and 8px inline border radius from src", () => {
    // A class-only sweep misses inline styles, which is how CompareView's
    // panel kept an 8px corner. Guard both spellings, not just the tidy one.
    const offenders = sources
      .filter(({ text }) => /borderRadius:\s*["'](?:12|8)px["']/.test(text))
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });
});
