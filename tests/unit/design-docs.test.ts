import { existsSync, readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { cssUtilities, sourceFiles, stripComments, stripCssComments } from "../helpers/source-files";

/**
 * Drift guard for the two authoritative design documents.
 *
 * Phase 6 rewrote both to describe what shipped. Prose has no compiler, so
 * every claim in them that is ALSO a token is asserted here against
 * `globals.css` itself rather than against a copy of its values. A token
 * retune therefore reddens this spec, which is the only thing that makes the
 * documents trustworthy six months from now.
 *
 * Two kinds of case, deliberately:
 *   - POSITIVE: the document states the shipped value (read from the CSS, not
 *     hardcoded here — a hardcoded expectation would drift in lockstep).
 *   - NEGATIVE: a claim the delta FALSIFIED is absent. These are the ones that
 *     matter, because a stale sentence reads as authoritative.
 *
 * EVERY ASSERTION BELOW WAS MEASURED AGAINST THE DOCUMENTS BEFORE IT WAS
 * WRITTEN, in BOTH directions. A `not.toContain` for a string that was never
 * there is green forever; a `toContain` for a word the un-rewritten document
 * already uses is green for the wrong reason. Six of the plan's drafted
 * assertions were one or the other when measured — the radius value, the
 * `11px` in the floor case, `Source Serif 4`, the bare role names `label` and
 * `control`, `the "brand color"`, and `ScoreBar`. Each carries a comment at
 * the site naming what was wrong and what replaced it.
 *
 * THREE MATCHING RULES, and every case is built from them rather than from an
 * inline regex, so the anti-vacuity block below proves the expression the
 * cases actually run:
 *   - `tokenRef`  — a custom-property name that a longer sibling cannot satisfy
 *   - `pxLiteral` — a px length that a longer number cannot satisfy
 *   - `sameLine`  — two of the above landing on ONE line, which is what turns
 *                   "the word appears somewhere" into "the document says it"
 *
 * Failures report OFFENDING LINES, never the whole document. Tasks 2-10 read
 * this suite's output as a to-do list, and a 500-line diff per case buries
 * the one line that is actionable.
 */

/**
 * Reads a repo-relative file VERBATIM.
 *
 * Deliberately not `tests/helpers/source-files.ts`'s `read`, which strips
 * comments: that helper exists for TS/TSX guards, and running it over CSS
 * would delete the very `/* ... *\/` the sheet documents its tokens in, while
 * over markdown its regex-literal heuristic has no meaning at all. The CSS
 * comment stripper from that module IS the right tool and is used below.
 */
const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

const globalsCss = read("src/app/globals.css");
const designSpec = read("docs/system_proposal/governance_compass_design_spec.md");
const claudeMd = read("CLAUDE.md");

/** Comment-stripped CSS, so a declaration is never confused with prose about one. */
const css = stripCssComments(globalsCss);

/** Literal-safe interpolation into a RegExp. */
const esc = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * A px length, escaped and left-anchored so it cannot match inside a longer
 * number. Without the lookbehind, `12px` is satisfied by a documented
 * `112px` and `2px` by `12px` — the exact class of substring collision this
 * suite has shipped three defects on (see `assert-tailwind-classes-token-wise`).
 */
const pxLiteral = (value: string) => `(?<![\\d.])${esc(value)}`;

/**
 * A custom-property name that a LONGER sibling cannot satisfy.
 *
 * Measured against `globals.css`: six of the eight tokens these cases assert
 * have a real superset sibling — `--radius`/`--radius-sharp`,
 * `--focus-ring`/`--focus-ring-child`, `--button-primary`/`-fg`/`-hover`, and
 * the `@theme inline` aliases `--color-text-label`, `--color-mark-primary`,
 * `--color-domain-economic`. Task 4 is likely to document that alias layer,
 * so a bare `toContain("--text-label")` could have gone green off prose that
 * never named a single base token. Same failure class as the two tokens that
 * shared a value and made a mutation undetectable.
 */
const tokenRef = (token: string) => `${esc(token)}(?![\\w-])`;

/** Two fragments landing on ONE line, in order. The difference between "this
 *  word appears somewhere in 500 lines" and "the document states this". */
const sameLine = (left: string, right: string) =>
  new RegExp(`${left}[^\\n]*${right}`);

/** The markdown table row Task 5 writes for one type-scale role. Module-scope
 *  so the anti-vacuity case below and the type-scale case prove and use the
 *  SAME expression — two copies would let an edit to one silently orphan the
 *  other's proof. */
const rowFor = (role: string, size: string) =>
  sameLine(`\`${esc(role)}\``, pxLiteral(size));

/** Lines of `text` that `pattern` matches. A `/g` pattern carries `lastIndex`
 *  across `.test` calls and would skip every other line, so the flag is
 *  dropped here rather than left as a footgun for callers. */
const linesMatching = (text: string, pattern: RegExp) => {
  const scoped = new RegExp(pattern.source, pattern.flags.replace("g", ""));
  return text.split("\n").filter((line) => scoped.test(line));
};

const rx = (needle: string | RegExp) =>
  typeof needle === "string" ? new RegExp(esc(needle)) : needle;

/** `needle` appears on at least one line. Failure prints the message, not the
 *  document. */
const present = (text: string, needle: string | RegExp, why: string) =>
  expect(linesMatching(text, rx(needle)).length, why).toBeGreaterThan(0);

/** `needle` appears nowhere. Failure prints the OFFENDING LINES, which is the
 *  actionable half — a whole-document `not.toMatch` prints 500 lines of diff
 *  and buries it. */
const absent = (text: string, needle: string | RegExp, why: string) =>
  expect(linesMatching(text, rx(needle)), why).toEqual([]);

/** Every `@utility` role and its declared font-size, straight from the sheet. */
function utilityFontSizes(): Map<string, string> {
  const out = new Map<string, string>();
  for (const { name, body } of cssUtilities(css)) {
    const size = body.match(/font-size:\s*([\d.]+px)/);
    if (size) out.set(name, size[1]);
  }
  return out;
}

/** The type scale's smallest declared size, as the sheet spells it. */
function typeFloor(): string {
  const sizes = [...utilityFontSizes().values()];
  const min = Math.min(...sizes.map((size) => Number.parseFloat(size)));
  return `${min}px`;
}

/** The two `@utility` rules that are not typography roles. */
const NON_TYPOGRAPHY_UTILITIES = ["focus-ring", "focus-ring-child"];

/** The handoff bundle the provenance header points readers at. */
const HANDOFF_ZIP = resolve(process.cwd(), "docs/gov_compass_redesign.zip");

/**
 * Byte offset of a zip's end-of-central-directory record.
 *
 * The archive is READ, not extracted. The guard needs filenames and nothing
 * else, and the two alternatives both cost more than a 40-line parser:
 * shelling out to `unzip` adds a binary dependency CI has no other reason to
 * carry, and `mkdtemp` + extract adds cleanup that a throwing assertion skips.
 * Neither buys anything, because file CONTENTS are not part of any claim here.
 *
 * Scanned backwards because the record is last but variable-position — a
 * trailing archive comment of up to 64 KiB may follow it.
 */
function eocdOffset(buf: Buffer): number {
  for (let i = buf.length - 22; i >= 0; i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) return i;
  }
  throw new Error(`not a zip archive: ${HANDOFF_ZIP}`);
}

/** Entry count the archive states about ITSELF, for the parse's anti-vacuity check. */
function zipEntryCount(path: string): number {
  const buf = readFileSync(path);
  return buf.readUInt16LE(eocdOffset(buf) + 10);
}

/**
 * Every entry name in a zip's central directory, in stored order.
 *
 * Central-directory headers are a fixed 46 bytes followed by three
 * variable-length fields — name, extra, comment — whose lengths live at
 * offsets 28, 30 and 32. Names are decoded as UTF-8; the bundle's are ASCII,
 * and a zip that set the CP437 flag instead would differ only on bytes no
 * filename in it contains.
 */
function zipEntryNames(path: string): string[] {
  const buf = readFileSync(path);
  const names: string[] = [];
  let at = buf.readUInt32LE(eocdOffset(buf) + 16);
  while (at + 46 <= buf.length && buf.readUInt32LE(at) === 0x02014b50) {
    const nameLength = buf.readUInt16LE(at + 28);
    names.push(buf.toString("utf8", at + 46, at + 46 + nameLength));
    at += 46 + nameLength + buf.readUInt16LE(at + 30) + buf.readUInt16LE(at + 32);
  }
  return names;
}

describe("design docs are not vacuous to guard", () => {
  it("reads all three files with content", () => {
    // Every case below is a substring or line assertion over these three
    // strings. An empty read makes the negatives pass forever and is exactly
    // the failure this case exists to catch. Measured: pointing `read` at a
    // missing path throws, which is the safe failure; pointing it at an empty
    // file does not.
    expect(globalsCss.length).toBeGreaterThan(5000);
    expect(designSpec.length).toBeGreaterThan(5000);
    expect(claudeMd.length).toBeGreaterThan(2000);
  });

  it("reads a font-size for every type-scale role the sheet declares", () => {
    const sizes = utilityFontSizes();

    // COMPLETENESS, not a threshold. `utilityFontSizes` drops any role whose
    // size is not `[\d.]+px`, so restyling one to `rem`, `clamp()` or a var
    // removes it from the map, the type-scale case below silently stops
    // asserting it, and a `>= 15` floor stays green through the hole. Every
    // `@utility` opener in the sheet must therefore be accounted for: as a
    // typography role with a px size, or as one of the two named exceptions.
    //
    // This also covers what a hardcoded `caption-italic` anchor was reaching
    // for — that role is declared AFTER both focus-ring rules, so a parser
    // that truncated on their nested `&:focus` blocks would surface here —
    // and it does so without pinning a value that a legitimate retune moves.
    const openers = [...css.matchAll(/@utility ([a-z0-9-]+) \{/g)].map(([, name]) => name);

    expect(openers.length, "no @utility rules parsed out of globals.css").toBeGreaterThan(0);
    expect([...sizes.keys(), ...NON_TYPOGRAPHY_UTILITIES].sort()).toEqual(
      [...openers].sort(),
    );
    // The two exceptions are exceptions because they declare no font-size,
    // not because they are named here.
    for (const name of NON_TYPOGRAPHY_UTILITIES) {
      expect(sizes.has(name), `${name} unexpectedly declares a font-size`).toBe(false);
    }
  });

  it("matches a markdown table row the way the type-scale case assumes", () => {
    // Task 5 writes the scale as a table, and the case below requires the role
    // and its size on ONE LINE with the role in backticks. The document is not
    // rewritten yet, so the positive cannot be confirmed against it — but
    // `rowFor` is module scope, so what is proved here is the expression the
    // case actually runs.
    const row = "| `body-s` | 13.5px / 1.6 | sans | The workhorse prose size. |";

    expect(rowFor("body-s", "13.5px").test(row)).toBe(true);
    // The escaped `.` must not match an arbitrary character: `1305px` is not
    // `13.5px`. The plan used `size.replace(".", "\\.")`, which is
    // first-occurrence-only for a string pattern — correct for one dot and
    // wrong the moment a size has two. `esc` escapes them all.
    expect(rowFor("body-s", "13.5px").test("| `body-s` | 1305px |")).toBe(false);
    // And it cannot be satisfied from INSIDE a longer number: a row reading
    // `112px` must not answer for a shipped `12px`.
    expect(rowFor("body-xs", "12px").test("| `body-xs` | 112px |")).toBe(false);
    expect(rowFor("body-xs", "12px").test("| `body-xs` | 12px / 1.5 |")).toBe(true);
    // A sibling role must not satisfy its prefix. `label` and `label-nav` are
    // both 11px, so without the closing backtick every `label*` row would
    // answer for every other one.
    expect(rowFor("label", "11px").test("| `label-nav` | 11px / 1.4 |")).toBe(false);
    expect(rowFor("label", "11px").test("| `label` | 11px / 1.4 |")).toBe(true);
  });

  it("does not let a longer token name satisfy a shorter one", () => {
    // `tokenRef`'s proof, and the reason it exists: six of the eight tokens
    // the cases below assert have a real superset sibling in `globals.css`,
    // three of them in the `@theme inline` alias layer Task 4 is likely to
    // document. A bare substring check could go green off prose that never
    // named a base token.
    const ref = (token: string) => new RegExp(tokenRef(token));

    expect(ref("--radius").test("`--radius-sharp` maps it into Tailwind")).toBe(false);
    expect(ref("--radius").test("One value. `--radius: 2px` in `:root`.")).toBe(true);
    expect(ref("--focus-ring").test("`--focus-ring-child` rings the card")).toBe(false);
    expect(ref("--button-primary").test("`--button-primary-fg` is the ink")).toBe(false);
    expect(ref("--text-label").test("`--color-text-label` in `@theme inline`")).toBe(false);
    expect(ref("--text-label").test("`--text-label` steps by mode")).toBe(true);
  });
});

describe("the design spec matches the shipped token layer", () => {
  it("documents the single radius value that globals.css declares", () => {
    const radius = css.match(/--radius:\s*(\d+px)/)?.[1];
    expect(radius, "--radius is missing from :root").toBeDefined();
    // NOT a bare `toContain(radius)`. MEASURED: the un-rewritten spec already
    // says "2px" 38 times (focus-ring widths, the selected-option border, the
    // archetype rail), so a substring check was green before any edit — and
    // stayed green under mutation M2, because the spec says "3px" too. The
    // claim is that the spec names the TOKEN at the shipped value, so the two
    // have to land on one line.
    present(
      designSpec,
      sameLine(tokenRef("--radius"), pxLiteral(radius!)),
      `no line in the spec names --radius at its shipped ${radius}`,
    );
  });

  it("has retired the 12px/8px radius prescriptions", () => {
    // The old Border Radius section prescribed 12px containers, 8px rows and
    // buttons, 6px compass inner, 3px bar track. Delta 02 collapsed all of it
    // to one token. A reader following the old table would reintroduce 89
    // literals the sweep removed. All three strings verified present today.
    absent(designSpec, /12px\s+\(large radius/, "the 12px container radius is still prescribed");
    absent(designSpec, /Buttons:\s+8px/, "the 8px button radius is still prescribed");
    absent(
      designSpec,
      /Axis rows \(alternating\):\s+8px/,
      "the 8px axis-row radius is still prescribed",
    );
  });

  it("names every type-scale role with its shipped size", () => {
    // The scale is the delta's most-copied reference. A size that disagrees
    // with the sheet is worse than an absent one, because it gets pasted.
    for (const [role, size] of utilityFontSizes()) {
      // Backticked, not bare. `label` and `control` are both ordinary English
      // words that the un-rewritten spec already uses 35 and 1 times, so a
      // bare `toContain(role)` passed for them before anything was written.
      present(designSpec, `\`${role}\``, `${role} is missing from the spec's type scale`);
      present(
        designSpec,
        rowFor(role, size),
        `${role} is documented at the wrong size (shipped ${size})`,
      );
    }
  });

  it("states the type floor at the size the scale actually bottoms out at", () => {
    // Was `toMatch(/11px/)` plus a separate `toContain("floor")`. The first
    // half was vacuous: the un-rewritten spec says "11px" at six sites, none
    // of which is a floor. Both have to be on one line, and the value is READ
    // FROM THE SHEET rather than typed here — retune the smallest role and
    // the document reddens instead of quietly becoming wrong.
    //
    // Order-agnostic (so "the floor is 11px" and "11px is the floor" both
    // pass) and therefore not `sameLine`, but the size still goes through
    // `pxLiteral`: a floor line reading `111px` must not satisfy `11px`.
    const floor = typeFloor();
    const size = new RegExp(pxLiteral(floor));
    const stated = linesMatching(designSpec, /\bfloor\b/i).filter((line) => size.test(line));

    expect(stated.length, `the spec states no ${floor} type floor`).toBeGreaterThan(0);
  });

  it("documents the mode-stepping tokens the delta introduced", () => {
    for (const token of [
      "--text-label",
      "--rule-strong",
      "--rule-hairline",
      "--button-primary",
      "--mark-primary",
      "--domain-economic",
      "--radius",
      "--focus-ring",
    ]) {
      // `tokenRef`, not `toContain`: see its doc comment. Six of these eight
      // have a superset sibling that a substring check would accept.
      present(designSpec, new RegExp(tokenRef(token)), `${token} is undocumented`);
    }
  });

  it("documents all five page-measure tokens", () => {
    for (const token of [
      "--container-shell",
      "--container-results",
      "--container-reference",
      "--container-quiz",
      "--container-browse",
    ]) {
      // These five have no superset sibling in the sheet TODAY, which is a
      // fact about the sheet and not about the assertion. Bounded anyway, so
      // the guard does not quietly depend on that continuing to hold.
      present(designSpec, new RegExp(tokenRef(token)), `${token} is undocumented`);
    }
  });

  it("no longer calls Stone 600 the primary accent fill or the brand color", () => {
    // Delta 03 moved the fill to Stone 900 ink. The old spec said Stone 600 was
    // "THE primary accent" and called it the brand color in as many words, and
    // prescribed it as the button background in three separate places.
    absent(designSpec, "THE primary accent", "Stone 600 is still THE primary accent");
    // The plan wrote this as `not.toContain('the "brand color"')`. MEASURED:
    // that string is NOT in the document and never was — line 29 reads
    // `This is the "brand color."`, with the period INSIDE the closing quote,
    // so the drafted assertion was green forever. Anchored on the assertion
    // ("is the \"brand color") rather than the bare phrase, so Task 4 stays
    // free to write a sentence saying it is no longer the brand color.
    absent(designSpec, /is the "brand color/, "Stone 600 is still called the brand color");
    absent(designSpec, /Stone 600 background/, "a Stone 600 button background is still prescribed");
  });

  it("has retired the two-filled-buttons claim (spec D1)", () => {
    // D1's CLAUDE.md side is guarded below, but the spec states the SAME
    // overturned claim in its own words, on the "Begin assessment" button:
    // "one of only two filled/primary buttons on the entire site". The quiz's
    // advance button is now an ink fill, which falsifies it outright.
    //
    // Added because it was the one spec contradiction with nothing pinning it.
    // The line is caught today only by the `/Stone 600 background/` needle in
    // the case above, which a rewrite of that fragment alone would satisfy
    // while leaving the count standing — so the claim needs its own negative.
    //
    // MEASURED: `/only two filled/` matches exactly ONE line of the document
    // today (416). It is therefore red NOW and goes green only when that line
    // is rewritten — not a negative against a string that was never there,
    // which this file's header warns is green forever.
    absent(
      designSpec,
      /only two filled/,
      "the spec still claims the site has only two filled buttons",
    );
  });

  it("no longer claims Stone 600 needs no dark variant for marks", () => {
    // Delta 06: domain 600 goes muddy on a dark ground, so every mark steps to
    // its 400 tone. The old spec said stone-filled elements "remain Stone 600".
    absent(designSpec, /remain Stone 600/, "marks are still said to remain Stone 600 in dark");
  });

  it("describes the shipped serif, not the pre-webfont stack", () => {
    // `toContain("Source Serif 4")` alone was vacuous in the worst way: the
    // ONLY occurrence today is inside the `PARTIALLY OUTDATED` banner, which
    // Task 10 deletes — so the case passed now and would have started failing
    // later, for a reason unrelated to the serif. The negative below is the
    // load-bearing half: the File/Asset Summary still claims the design needs
    // no web font, which Source Serif 4 (self-hosted, `src/app/fonts/`)
    // falsifies outright.
    present(designSpec, "Source Serif 4", "the shipped serif is unnamed");
    absent(
      designSpec,
      /no web font loading required/,
      "the spec still claims the design needs no web font",
    );
  });

  it("describes 7 ministries, not 10", () => {
    // The positive is the half that survives a reworded falsehood: dropping
    // the two exact strings below while writing "all ten ministries" would
    // otherwise leave this green. MEASURED: the only `7 ministries` in the
    // document today is inside the banner Task 10 deletes, so without this
    // the count is on track to vanish with nothing asserting it.
    present(designSpec, /\b7 ministries\b/, "the spec does not state the shipped count of 7");
    absent(designSpec, /All 10 ministries/, "the spec still says 10 ministries");
    absent(designSpec, /Budget: all 10 ministries/, "the budget section still says 10 ministries");
  });

  it("has removed the 2px Stone 600 forced-choice selection prescriptions", () => {
    // Named for what it checks — two exact strings — rather than for the
    // broader claim, which no text scan can establish. The shipped selection
    // is a 1px --rule-strong border plus a text marker, and the old
    // accessibility note leaned on a border-WIDTH change as the non-colour
    // signal. Both claims are false and the second one is an accessibility
    // claim, which is the worse kind to leave standing.
    absent(
      designSpec,
      /2px — the only place a 2px border is used/,
      "the 2px selected border is still prescribed",
    );
    absent(
      designSpec,
      /border width change from 0\.5px to 2px/,
      "the accessibility note still leans on a border-width change",
    );
  });

  it('has removed the "uses almost no icons" claim', () => {
    // Named for the string it checks, not for the broader claim. 7 lucide
    // ministry icons plus four more in /study; the old section said the three
    // exceptions were all text characters.
    absent(designSpec, /uses almost no icons/, "the spec still claims the site has almost no icons");
  });

  it("names PairedAxisScale and does not prescribe the retired ScoreBar", () => {
    present(designSpec, "PairedAxisScale", "the shipped axis component is unnamed");
    // The plan wrote the second half as `not.toMatch(/\bScoreBar\b(?!.*retired)/)`.
    // Two problems, one real and one cosmetic.
    //
    // Cosmetic: `.` does not match a newline, so that lookahead only ever saw
    // the rest of the CURRENT line. That is a defensible intent but not what
    // the expression looks like it says, so it is spelled out per line here.
    //
    // Real, and reported upward rather than hidden: MEASURED, the string
    // "ScoreBar" does not appear in the spec today and never has, so this half
    // is green before any edit. It is kept as a forward guard over the ~450
    // lines Tasks 4-10 write — the component is retired but `ComparisonScoreBar`
    // and `GroupScoreBar` still exist, so the name is live enough to be typed
    // by mistake. `\b` does not match between `n` and `S`, so neither live
    // component false-positives here. The CASE is red today on
    // PairedAxisScale, which the spec does not name.
    const prescriptions = designSpec
      .split("\n")
      .filter((line) => /\bScoreBar\b/.test(line) && !/retired/.test(line));

    expect(
      prescriptions,
      'ScoreBar is retired — name PairedAxisScale instead, or say "retired" on the same line',
    ).toEqual([]);
  });

  it("carries no stale outdated-banner", () => {
    // The banner is the document's own admission that it cannot be trusted.
    // Phase 6 exists to remove the condition, so the banner goes with it.
    absent(designSpec, "PARTIALLY OUTDATED", "the outdated-banner is still on the document");
  });

  it("records where the handoff bundle lives", () => {
    present(designSpec, "gov_compass_redesign.zip", "the handoff bundle's path is unrecorded");
  });

  it("names every .dc.html file the archive actually contains", () => {
    // The header lists the bundle's four design files by name. That list is
    // prose, and the exact shape of the claim it makes is the one that already
    // cost this phase a correction mid-task: the plan asserted THREE .dc.html
    // files and the archive holds four. So the expectation is DERIVED from the
    // archive — a hardcoded list drifts in lockstep with the prose it is
    // supposed to pin, and pins nothing.
    const entries = zipEntryNames(HANDOFF_ZIP);

    // Anti-vacuity, and the only reason to trust the loop below. The parser is
    // hand-rolled, and a parser that silently returns [] makes a `for … of`
    // assertion green forever. Two independent checks: the count the archive
    // states about ITSELF in its end-of-central-directory record, and the
    // existence of at least one design file to assert about.
    expect(entries.length, "no entries parsed out of the handoff bundle").toBe(
      zipEntryCount(HANDOFF_ZIP),
    );

    // The directory everything unpacks into. Stated by the header, and the
    // reason the names below are asserted as basenames.
    const root = "design_handoff_governance_compass_redesign/";
    expect(entries.every((name) => name.startsWith(root))).toBe(true);
    present(designSpec, root, "the bundle's unpack directory is unrecorded");

    const designFiles = entries
      .filter((name) => name.endsWith(".dc.html"))
      .map((name) => name.slice(root.length));
    expect(designFiles.length, "no .dc.html files found in the bundle").toBeGreaterThan(0);

    for (const file of designFiles) {
      present(designSpec, file, `the bundle's ${file} is unlisted in the provenance header`);
    }
  });

  it("names a decision record that exists on disk", () => {
    // D1-D7 are cited by number throughout the document with no other
    // definition, so a moved or renamed record makes every citation dangling.
    const cited = designSpec.match(/docs\/superpowers\/specs\/[\w.-]+\.md/)?.[0];
    expect(cited, "the provenance header cites no decision record").toBeDefined();
    expect(existsSync(resolve(process.cwd(), cited!)), `${cited} does not exist`).toBe(true);
  });

  it("names a plans glob that matches every phase plan on disk", () => {
    // The draft header globbed `2026-09-0*`, which caught 3 of the 7 plans
    // because the phases ran past the ninth. That is the defect this case
    // exists for, so matching "something" is not enough — the glob has to
    // match the WHOLE set, derived from the directory rather than counted here.
    const glob = designSpec.match(/docs\/superpowers\/plans\/[\w*.-]+\.md/)?.[0];
    expect(glob, "the provenance header cites no plans glob").toBeDefined();

    const dir = resolve(process.cwd(), "docs/superpowers/plans");
    const onDisk = readdirSync(dir).filter((name) => name.includes("design-system-delta"));
    expect(onDisk.length, "no design-system-delta plans on disk").toBeGreaterThan(0);

    // `*` is the only glob metacharacter in play; everything else is literal.
    const pattern = new RegExp(
      `^${glob!.split("*").map(esc).join("[^/]*")}$`,
    );
    const unmatched = onDisk.filter(
      (name) => !pattern.test(`docs/superpowers/plans/${name}`),
    );
    expect(unmatched, `the glob ${glob} misses these plans`).toEqual([]);
  });
});

describe("CLAUDE.md Design Context matches what shipped", () => {
  it("has retired the count-based filled-button rule (spec D1)", () => {
    // Mock 6b makes the quiz Next an ink fill — 60 filled buttons per sitting —
    // so a rule phrased as a reservation could not survive the delta.
    absent(claudeMd, "Filled buttons are reserved", "the filled-button reservation still stands");
  });

  it("states the three-tier button system by the variant names Button exports", () => {
    // ONE case, not two. The drafted pair hardcoded the trio in one and
    // derived it in the other, so a legitimate rename false-reds the
    // hardcoded loop with "variant secondary is undocumented" while the
    // document is correct.
    const source = read("src/components/Button.tsx");
    const union = source.match(/export type ButtonVariant =([^;]+);/)?.[1];
    expect(union, "ButtonVariant union not found").toBeDefined();
    const names = [...union!.matchAll(/"([a-z]+)"/g)].map(([, name]) => name);

    // The honest anchor, replacing a `names.length > 0` guard: it pins the
    // parse AND the "three-tier" claim in the case title, and it is the only
    // place the trio is spelled. A rename reddens HERE, naming the rename.
    expect(names, "ButtonVariant is no longer the three-tier system").toEqual([
      "primary",
      "secondary",
      "tertiary",
    ]);
    for (const name of names) {
      present(claudeMd, `\`${name}\``, `variant ${name} is undocumented`);
    }

    // Derived, not hardcoded: this file's own header forbids typing a value
    // the sheet already states. `--button-primary: var(--stone-900)`.
    const ink = css.match(/--button-primary:\s*var\(--stone-(\d+)\)/)?.[1];
    expect(ink, "--button-primary does not alias the Stone ramp").toBeDefined();
    present(claudeMd, `Stone ${ink}`, `the primary fill is not documented as Stone ${ink}`);
  });

  it("no longer credits Stone 600 with the selected state", () => {
    // The forced-choice selection is --rule-strong ink, not Stone 600.
    absent(
      claudeMd,
      /Stone 600[^\n]*selected states/,
      "Stone 600 is still credited with the selected state",
    );
  });

  it("gives Stone 600 its surviving jobs", () => {
    // ATTRIBUTED, not merely mentioned. A bare `toContain("focus ring")` is
    // satisfied by any sentence about focus rings anywhere in the file, which
    // is not the claim — the claim is that these two jobs are Stone 600's.
    // Same shape as the negative case above.
    present(
      claudeMd,
      sameLine("Stone 600", "focus ring"),
      "the focus ring is not attributed to Stone 600",
    );
    present(
      claudeMd,
      sameLine("Stone 600", "progress fill"),
      "the progress fill is not attributed to Stone 600",
    );
  });

  it("documents the token layer and the named-sibling rule", () => {
    present(claudeMd, "@utility", "the @utility type-scale layer is undocumented");
    present(claudeMd, "@theme inline", "the @theme inline alias layer is undocumented");
    // The rule itself, not just the mechanism: a built-in utility layered over
    // a custom one wins or loses depending on which properties the custom rule
    // declares, so roles get named siblings instead.
    present(claudeMd, /named sibling/, "the named-sibling rule is unstated");
  });

  it("notes home_sample_pair.json alongside the other derived outputs", () => {
    present(claudeMd, "home_sample_pair.json", "home_sample_pair.json is unlisted");
  });
});

describe("--text-tertiary is retired (phase 5b deferral)", () => {
  it("declares no --text-tertiary in any layer of the sheet", () => {
    // Three declarations to remove: :root, the dark override, and the
    // @theme inline mapping that generates `text-text-tertiary`. Leaving the
    // mapping behind is the subtle half — the class keeps compiling, to an
    // undefined value, which renders as inherited rather than as a visible
    // break.
    //
    // FIX vs the plan's draft, twice over. It drafted a bare
    // `expect(css).not.toMatch(/--text-tertiary\s*:/)`, which (a) prints the
    // WHOLE 700-line sheet as the diff on failure, the thing this file's
    // header calls out as burying the one actionable line, and (b) anchors on
    // the `:` so it sees declarations only — `var(--text-tertiary)` in the
    // @theme mapping's VALUE would have slipped through if the mapping's own
    // name were ever renamed. `tokenRef` is the file's existing rule for "this
    // custom property, not a longer sibling", and `absent` reports lines.
    // Verified the two patterns do not overlap: `--color-text-tertiary` does
    // NOT contain `--text-tertiary` (one hyphen before `text`, not two), so
    // each case fails for its own reason.
    //
    // `new RegExp(tokenRef(...))`, never the bare string: `tokenRef` returns a
    // PATTERN as a string, and `absent`'s `rx` escapes strings — so passing it
    // raw compiles to a literal `--text-tertiary\(\?!\[\\w-\]\)`, which
    // matches nothing and is green forever. Caught by running this case
    // against the UNSWEPT sheet: it passed. Every other `tokenRef` caller in
    // this file wraps it the same way.
    absent(
      css,
      new RegExp(tokenRef("--text-tertiary")),
      "the sheet still declares or reads --text-tertiary",
    );
    absent(
      css,
      new RegExp(tokenRef("--color-text-tertiary")),
      "the @theme inline mapping still generates text-text-tertiary",
    );
  });

  it("has no consumer of the token left in src", () => {
    // Both spellings. The class carries a SINGLE hyphen before
    // `text-tertiary`, so a /--text-tertiary/ pattern — the obvious one —
    // misses `text-text-tertiary` entirely.
    //
    // FIX vs the plan's draft: it scanned raw `readFileSync` bytes. Every
    // other literal-banning guard over TS/TSX in this suite strips comments
    // first, and for the reason the helper documents — a whole-file text scan
    // cannot tell a consumer from prose about one, so a future
    // `// was text-text-tertiary` note would redden a file that ships
    // nothing, and a guard that cries wolf on correct code gets deleted.
    // `stripComments` blanks in place, so the match still reads as source.
    const offenders = sourceFiles(resolve(process.cwd(), "src")).flatMap((file) => {
      const text = stripComments(readFileSync(file, "utf8"));
      const match = text.match(/(?:--|text-)text-tertiary/);
      return match ? [`${relative(process.cwd(), file)}: ${match[0]}`] : [];
    });

    expect(offenders).toEqual([]);
  });
});
