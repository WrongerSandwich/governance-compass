/**
 * @vitest-environment jsdom
 *
 * Issue #154, sections 2-4: the /study layout defects phase 5b measured and
 * deferred, plus the two layout questions it resolved as "fix, but not
 * here". Each case here names the measurement it closes.
 */
import { createElement } from "react";
import { readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  classStringUnits,
  jsxOpeningTags,
  read,
  sourceFiles,
  stripComments,
} from "../helpers/source-files";
import { AppRouterContext, ROUTER_STUB } from "../helpers/client-component-env";
import { createRenderHarness } from "../helpers/react-dom";
import {
  CorrelationHeatmap,
  heatmapGeometry,
} from "@/components/study/CorrelationHeatmap";
import { Histogram } from "@/components/study/Histogram";
import { ClusterBadge } from "@/components/study/ClusterBadge";

const { cleanup, render } = createRenderHarness({
  wrap: (element) =>
    createElement(AppRouterContext.Provider, { value: ROUTER_STUB }, element),
});

afterEach(cleanup);

// ---------------------------------------------------------------------------
// CorrelationHeatmap — column labels were painted outside the viewBox
// ---------------------------------------------------------------------------

describe("CorrelationHeatmap", () => {
  const labels = Array.from({ length: 12 }, (_, i) => `A${i + 1}`);

  function translateOf(text: Element): { x: number; y: number } {
    const match = /translate\(([\d.]+), ([\d.]+)\)/.exec(text.getAttribute("transform") ?? "");
    expect(match, "bottom label has no translate").not.toBeNull();
    return { x: Number(match![1]), y: Number(match![2]) };
  }

  it("reserves height below the grid for the rotated column labels", () => {
    // The shipped viewBox was LABEL_PAD + gridSize on both axes, with the
    // column labels placed at gridSize + LABEL_PAD + 6: every one of the
    // twelve was clipped by the SVG root, silently.
    const geometry = heatmapGeometry(labels, 56);
    const longest = 3 * 11 * 0.62;
    const hang = (longest + 11) * Math.SQRT1_2;

    expect(geometry.bottomPad).toBeGreaterThanOrEqual(6 + hang);
    expect(geometry.svgH).toBe(geometry.topPad + geometry.gridSize + geometry.bottomPad);
  });

  it("keeps every column label inside the viewBox", () => {
    const container = render(
      createElement(CorrelationHeatmap, {
        matrix: labels.map(() => labels.map(() => 0)),
        labels,
        cellSize: 56,
      }),
    );
    const svg = container.querySelector("svg")!;
    const [, , , height] = svg.getAttribute("viewBox")!.split(" ").map(Number);
    const bottom = Array.from(svg.querySelectorAll("text[transform]"));

    expect(bottom).toHaveLength(12);
    for (const text of bottom) {
      const { y } = translateOf(text);
      const width = text.textContent!.length * 11 * 0.62;
      // A label anchored at its end and rotated -45° hangs below its anchor
      // by the projection of its width plus its own glyph height.
      expect(y + (width + 11) * Math.SQRT1_2).toBeLessThanOrEqual(height);
    }
  });

  it("no longer leaves a dead band above the matrix", () => {
    // 64 units were reserved above the grid for labels that live below it.
    const geometry = heatmapGeometry(labels, 56);
    expect(geometry.topPad).toBeLessThan(56);
  });

  it("sizes the left gutter from the longest label rather than a constant", () => {
    const short = heatmapGeometry(["A1", "A2"], 28);
    const long = heatmapGeometry(["Axis 1 (Economic)", "A2"], 28);
    expect(long.leftPad).toBeGreaterThan(short.leftPad);
    expect(long.bottomPad).toBeGreaterThan(short.bottomPad);
  });
});

// ---------------------------------------------------------------------------
// Histogram — mean and median labels overprinted each other
// ---------------------------------------------------------------------------

describe("Histogram overlays", () => {
  function overlayTexts(container: HTMLElement): SVGTextElement[] {
    return Array.from(container.querySelectorAll("svg > g > text")).filter((t) =>
      /^(mean|median)/.test(t.textContent ?? ""),
    ) as SVGTextElement[];
  }

  const base = {
    bins: [1, 4, 9, 6, 2, 1],
    range: [0.1, 3.5] as [number, number],
  };

  it("staggers two labels whose markers are closer than a label width", () => {
    // The measured case: 1.51 and 1.46 on 0.1-3.5.
    const container = render(
      createElement(Histogram, {
        ...base,
        overlays: [
          { value: 1.51, label: "mean 1.51" },
          { value: 1.46, label: "median 1.46", dashed: true },
        ],
      }),
    );
    const [mean, median] = overlayTexts(container);
    expect(mean.textContent).toBe("mean 1.51");
    expect(median.textContent).toBe("median 1.46");
    expect(Number(mean.getAttribute("y"))).not.toBe(Number(median.getAttribute("y")));
  });

  it("leaves two well-separated labels on one row", () => {
    const container = render(
      createElement(Histogram, {
        ...base,
        overlays: [
          { value: 0.5, label: "mean 0.50" },
          { value: 3.0, label: "median 3.00" },
        ],
      }),
    );
    const [mean, median] = overlayTexts(container);
    expect(mean.getAttribute("y")).toBe(median.getAttribute("y"));
  });

  it("ends a label at its marker when it would run past the plot", () => {
    const container = render(
      createElement(Histogram, {
        ...base,
        overlays: [{ value: 3.4, label: "median 3.40" }],
      }),
    );
    const [label] = overlayTexts(container);
    expect(label.getAttribute("text-anchor")).toBe("end");
  });
});

// ---------------------------------------------------------------------------
// CaseStudy — 30% 35% 35% plus 24px gaps overflowed by 48px
// ---------------------------------------------------------------------------

describe("the case-study grid", () => {
  it("sizes its three columns as shares of the remaining space, not of the container", () => {
    // Percentages already total 100%, so two 24px gaps put the third column
    // 48px past the container; measured as a 16px sideways scroll on
    // /study/model-agreement between ~641 and ~1150px.
    const text = read("src/components/study/model-agreement/CaseStudy.tsx");
    expect(text).toContain('"minmax(0, 30fr) minmax(0, 35fr) minmax(0, 35fr)"');
    expect(text).not.toMatch(/gridTemplateColumns: *"[^"]*%/);
  });
});

// ---------------------------------------------------------------------------
// CompareView — the fourth panel was clipped at every desktop width
// ---------------------------------------------------------------------------

describe("the compare tray", () => {
  it("lets every column shrink to its share rather than its widest child", () => {
    // `1fr` is `minmax(auto, 1fr)`: a track never goes below its content's
    // min-content width, and a nowrap badge row made that 297px. Four of
    // them plus gaps is 1359px in a 1098px tray, so the fourth panel was
    // clipped identically at 1200 and 1440px.
    const text = read("src/components/study/CompareView.tsx");
    const rules = [...text.matchAll(/grid-template-columns: *([^;]+);/g)].map(([, v]) => v.trim());

    expect(rules.length).toBeGreaterThanOrEqual(3);
    for (const rule of rules) {
      expect(rule, `${rule} has an auto minimum`).not.toMatch(/repeat\(\d+, *1fr\)/);
      expect(rule).toMatch(/minmax\(0, *1fr\)/);
    }
  });

  it("lets the cluster badge wrap instead of setting the panel's floor", () => {
    const container = render(
      createElement(ClusterBadge, { clusterId: 1, href: null }),
    );
    const chip = container.firstElementChild as HTMLElement;
    const code = chip.querySelector("span")!;

    expect(chip.style.whiteSpace).toBe("");
    expect(code.textContent).toBe("C1");
    expect(code.style.whiteSpace).toBe("nowrap");
  });
});

// ---------------------------------------------------------------------------
// focus-ring — /study's links, inputs and selects now carry the site's ring
// ---------------------------------------------------------------------------

describe("the study section's interactive elements", () => {
  const STUDY_SOURCES = [
    ...sourceFiles(resolve(process.cwd(), "src/app/study")),
    ...sourceFiles(resolve(process.cwd(), "src/components/study")),
  ].map((file) => ({
    file: relative(process.cwd(), file),
    text: stripComments(readFileSync(file, "utf8")),
  }));

  /** Opening tags of `tag` in `text`, each with its offset. */
  function tagsAt(text: string, tag: string): { tag: string; at: number }[] {
    let from = 0;
    return jsxOpeningTags(text, tag).map((opening) => {
      const at = text.indexOf(opening, from);
      from = at + opening.length;
      return { tag: opening, at };
    });
  }

  it("carry focus-ring on every link, input and select", () => {
    // Six <Link>s, three <a>s and thirteen inputs/selects kept the
    // user-agent ring while 56 call sites elsewhere take the utility.
    // Classes reach these elements through identifiers (`fieldControlClass`)
    // as well as literals, so this reads the file's resolved class units
    // rather than the attribute text — and only the unit AT the tag's
    // `className=`, because a select's `onChange` body is also made of
    // statements and its string arguments would otherwise read as classes.
    const offenders = STUDY_SOURCES.flatMap(({ file, text }) => {
      const units = classStringUnits(text);
      return ["Link", "a", "input", "select"].flatMap((tag) =>
        tagsAt(text, tag).flatMap(({ tag: opening, at }) => {
          const label = `${file}: ${opening.split("\n")[0].trim()}`;
          const attribute = opening.indexOf("className=");
          if (attribute === -1) return [`${label} (no className)`];
          const after = units.filter(
            (u) => u.at >= at + attribute && u.at < at + opening.length,
          );
          if (after.length === 0) return [`${label} (unresolved className)`];
          const first = Math.min(...after.map((u) => u.at));
          const worlds = after.filter((u) => u.at === first);
          const ringed = worlds.every((u) => u.classes.split(/\s+/).includes("focus-ring"));
          return ringed ? [] : [label];
        }),
      );
    });

    expect(offenders).toEqual([]);
  });
});
