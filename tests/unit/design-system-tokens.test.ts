import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const globalsCss = readFileSync(
  resolve(process.cwd(), "src/app/globals.css"),
  "utf8",
);

describe("design delta token layer", () => {
  it("defines the near-square radius and exposes it to Tailwind", () => {
    expect(globalsCss).toContain("--radius: 2px;");
    expect(globalsCss).toContain("--radius-panel: var(--radius);");
  });

  it("inverts the primary button in dark mode instead of darkening it", () => {
    // Light: ink on paper. Dark: the same relationship, reversed.
    expect(globalsCss).toContain("--button-primary-bg:       var(--stone-900);");
    expect(globalsCss).toContain("--button-primary-bg:       var(--stone-300);");
    expect(globalsCss).toContain("--button-primary-text:     var(--stone-50);");
    expect(globalsCss).toContain("--button-primary-text:     var(--stone-900);");
  });

  it("maps the button tokens into the Tailwind colour namespace", () => {
    expect(globalsCss).toContain(
      "--color-button-primary-bg:       var(--button-primary-bg);",
    );
    expect(globalsCss).toContain(
      "--color-button-primary-bg-hover: var(--button-primary-bg-hover);",
    );
    expect(globalsCss).toContain(
      "--color-button-primary-text:     var(--button-primary-text);",
    );
  });

  it("declares every typography role from the delta's type scale", () => {
    for (const utility of [
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
    ]) {
      expect(globalsCss).toContain(`@utility ${utility} {`);
    }
  });

  it("holds the 11px type floor across every label role", () => {
    const utilityBlocks = globalsCss.matchAll(
      /@utility [a-z-]+ \{([^}]*)\}/g,
    );
    const sizes: number[] = [];
    for (const [, body] of utilityBlocks) {
      const match = body.match(/font-size:\s*([0-9.]+)px/);
      if (match) sizes.push(Number(match[1]));
    }
    expect(sizes.length).toBeGreaterThan(0);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(11);
  });
});
