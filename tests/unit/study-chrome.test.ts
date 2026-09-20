/**
 * @vitest-environment jsdom
 */
import { createElement } from "react";
import { readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { sourceFiles, stripComments } from "../helpers/source-files";
import { AppRouterContext, ROUTER_STUB } from "../helpers/client-component-env";
import { classes, createRenderHarness } from "../helpers/react-dom";

const { cleanup, render } = createRenderHarness({
  wrap: (element) =>
    createElement(AppRouterContext.Provider, { value: ROUTER_STUB }, element),
});

afterEach(cleanup);

const STUDY_SOURCES = [
  ...sourceFiles(resolve(process.cwd(), "src/app/study")),
  ...sourceFiles(resolve(process.cwd(), "src/components/study")),
].map((file) => ({
  file: relative(process.cwd(), file),
  // Comments out (Task 14 Step 3b): every case below scans this text for a
  // literal it also has to name in its own prose, and a scan cannot tell the
  // two apart. `study-kicker-link` is the sharpest example — the case that
  // bans it says the word twice.
  text: stripComments(readFileSync(file, "utf8")),
}));

const SHELLS = [
  "src/app/study/page.tsx",
  "src/app/study/patterns/page.tsx",
  "src/app/study/model-agreement/page.tsx",
  "src/components/study/PersonasPageClient.tsx",
];

describe("the study section's page shells", () => {
  it("opens every page through the shared header rather than a hand-spelled one", () => {
    // Four pages, four spellings of one block, and the tracking disagreed
    // with the delta on all four (0.08em against label-eyebrow's 0.14em).
    // The h1 was `clamp(32px, 5vw, 38px)` — a fifth display size in a scale
    // that names seven.
    for (const shell of SHELLS) {
      const source = STUDY_SOURCES.find(({ file }) => file === shell);
      expect(source, `${shell} is not in the study sweep`).toBeDefined();
      expect(source!.text, `${shell} does not use PageHeader`).toContain(
        'from "@/components/PageHeader"',
      );
      expect(source!.text, `${shell} still spells its own h1`).not.toContain("clamp(32px");
    }
  });

  it("retires the kicker class whose hover was invisible in light mode", () => {
    // `.study-kicker-link:hover { color: var(--text-secondary) }` lived in a
    // JSX <style> block, over a rest colour of --text-tertiary. The shipped
    // hover guard reads `className` attributes only, so a rule inside a
    // <style> string is invisible to it BY CONSTRUCTION — this is the one
    // site in the section that no scan of class names could ever have found.
    const offenders = STUDY_SOURCES.flatMap(({ file, text }) =>
      text.includes("study-kicker-link") ? [file] : [],
    );

    expect(offenders).toEqual([]);
  });

  it("caps each study page on the measure its content is, not a Tailwind size", () => {
    // Three prose pages on the reference measure; the browser on its own.
    // Scans the WHOLE section, not just the four shells: `ModelAgreementClient`
    // carried the section wrappers for one of those pages, so a shell-only
    // scan reported a page as capped while eleven of its sections were not.
    // Task 5 converted those, which is what lets this widen — and widening it
    // is the point, since scoped to four files it stopped guarding the other
    // forty study components against a new `max-w-2xl` appearing.
    const offenders = STUDY_SOURCES.flatMap(({ file, text }) => {
      const match = text.match(/max-w-(?:2xl|3xl|xl)(?![\w-])|maxWidth: "1200px"/);
      return match ? [`${file}: ${match[0]}`] : [];
    });

    expect(offenders).toEqual([]);
  });
});

describe("the study index page", () => {
  it("renders its kicker and title on the delta's roles", async () => {
    const { default: StudyOverviewPage } = await import("@/app/study/page");

    const container = render(createElement(StudyOverviewPage));

    const heading = container.querySelector("h1")!;
    expect(heading.textContent).toBe("The Synthetic Study");
    expect(classes(heading)).toContain("display-page");

    // The kicker is an eyebrow here, not a back-link: /study IS the section
    // landing, so there is nothing above it to link to. Its three children
    // pass `kickerHref`.
    const kicker = container.querySelector("[data-page-kicker]");
    expect(kicker).not.toBeNull();
    expect(classes(kicker!)).toContain("label-eyebrow");
    expect(kicker!.querySelector("a")).toBeNull();
  });

  it("holds the key-figure labels at the type floor", () => {
    // study/page.tsx:92 drew these at 10px, under the delta's 11px hard
    // floor, and it is the one sub-floor site issue #151 names. There are
    // about twenty-five more; the guard in Task 14 covers the rest.
    const source = STUDY_SOURCES.find(({ file }) => file === "src/app/study/page.tsx")!;

    expect(source.text).not.toContain("text-[10px]");
  });
});

describe("the study section nav", () => {
  it("is declared once, not once per page", () => {
    // /study/model-agreement inlined its own copy: same aria-label, same
    // 11px type, no scroll-spy. The divergence was already visible — one
    // nav highlighted the section you were reading and the other did not.
    const offenders = STUDY_SOURCES.flatMap(({ file, text }) =>
      file !== "src/components/study/patterns/SectionNav.tsx" &&
      text.includes('aria-label="Sections on this page"')
        ? [file]
        : [],
    );

    expect(offenders).toEqual([]);
  });

  it("puts the nav on the label layer with a hover that moves in both modes", async () => {
    const { SectionNav } = await import("@/components/study/patterns/SectionNav");

    const container = render(
      createElement(SectionNav, {
        sections: [{ num: "01", label: "Clusters", short: "Clusters", id: "section-1" }],
      }),
    );

    const link = container.querySelector('a[href="#section-1"]')!;
    const cls = classes(link);

    expect(cls).toContain("label-nav");
    // --text-label and --text-secondary are the same hex in light mode, so
    // the shipped `hover:text-text-secondary` animated between two identical
    // colours on a light page. --text-primary differs in both modes.
    expect(cls).toContain("hover:text-text-primary");
    expect(cls).not.toContain("hover:text-text-secondary");
  });
});
