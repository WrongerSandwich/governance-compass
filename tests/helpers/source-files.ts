import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

/** Directories a source sweep should never descend into. */
const SKIP_DIRS = new Set(["node_modules", "generated"]);

/**
 * Recursively lists files under `dir` whose name ends with one of
 * `extensions`.
 *
 * Shared by results-dead-code.test.ts and design-system-tokens.test.ts,
 * which used to carry byte-identical `.tsx`-only copies of this. Skips
 * `node_modules`, `generated` (the committed Prisma client — 27 files, most
 * of the bytes a sweep rooted at `src` would otherwise touch) and any
 * dot-directory, so no caller has to remember to exclude generated code from
 * a design-token or import ban.
 */
export function sourceFiles(dir: string, extensions: string[] = [".ts", ".tsx"]): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith(".")) return [];
      return sourceFiles(resolve(dir, entry.name), extensions);
    }
    return extensions.some((ext) => entry.name.endsWith(ext)) ? [resolve(dir, entry.name)] : [];
  });
}

/** Reads a repo-relative path. Comments are stripped: see `stripComments`. */
export function read(path: string): string {
  return stripComments(readFileSync(resolve(process.cwd(), path), "utf8"));
}

/**
 * Every inline `fontSize` still left in a file, as a list. The sweep's unit of
 * progress: a converted file has none, and the message names the ones it has
 * so a failure is actionable without opening the file.
 *
 * Pair it with `read`, not with a raw `readFileSync` — a commented-out
 * `fontSize` ships nothing and must not redden a file that is genuinely done.
 */
export function inlineFontSizes(text: string): string[] {
  return (text.match(/fontSize: *[^,\n]+/g) ?? []).map((match) => match.trim());
}

/**
 * Strip `//` and block comments from TS/TSX source.
 *
 * Every source-scanning guard in this suite bans a literal — a hex, a token
 * name, a class — and a whole-file text scan cannot tell a declaration from
 * prose about a declaration. Without this, a guard passes on its own
 * explanatory comment (Task 8 shipped exactly that) and reddens on a
 * commented-out line that ships nothing (`inlineFontSizes` could).
 *
 * Deliberately not a parser. It skips string literals, template literals and
 * regex literals, and that is the whole of its ambition.
 *
 * REGEX DETECTION IS A HEURISTIC, and the honest statement of what it cannot
 * do matters more than the heuristic: a `/` is read as opening a regex only
 * when the previous non-space character is one of `(,=:[!&|?{;` or the word
 * `return`. That is the set of positions where a division is not grammatical.
 * Everywhere else — after an identifier, a `)`, a `]`, a number — a `/` is
 * division and is left alone.
 *
 * What it therefore still cannot do: a regex opening in a position outside
 * that set is scanned as ordinary text, and if it contains `//` the rest of
 * that line is blanked, or for an unterminated `/*` the rest of the file. The
 * cost is a SILENT FALSE GREEN for any guard reading that region. This is
 * validated rather than asserted: round-tripping every leaf node of the
 * TypeScript AST over `src/` and `tests/` blanks zero code bytes today, and
 * blanked 18 fragments across 5 files before regex literals were handled at
 * all. If it ever stops being zero, widen the preceder set against a fresh
 * round-trip rather than guessing.
 *
 * Comment bodies are replaced by spaces of the SAME LENGTH, and newlines are
 * kept. Byte offsets and line numbers are therefore stable, which matters
 * because at least one guard slices backwards from a match to the nearest
 * `<` and every index after a collapsed comment would otherwise shift.
 */
export function stripComments(text: string): string {
  const out = text.split("");
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      i = skipLiteral(text, i);
      continue;
    }
    // Regex literals before comments. `ExternalLink`'s `/^https?:\/\//i` holds
    // a `//` that no string-literal scan sees, and blanking from there cost
    // the rest of the line. Checked first because neither `//` nor `/*` can
    // OPEN a regex — an empty regex is spelled `/(?:)/` — so nothing that is
    // really a comment is swallowed here.
    if (ch === "/" && text[i + 1] !== "/" && text[i + 1] !== "*") {
      const end = opensRegex(text, i) ? skipRegex(text, i) : null;
      if (end !== null) {
        i = end;
        continue;
      }
    }
    // `[^:]` before `//`: a bare `https://…` in JSX text is not a string
    // literal, so the scanner above never sees it, and without this guard the
    // rest of that line disappears.
    if (ch === "/" && text[i + 1] === "/" && text[i - 1] !== ":") {
      while (i < text.length && text[i] !== "\n") {
        out[i] = " ";
        i += 1;
      }
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      const stop = end === -1 ? text.length : end + 2;
      for (let j = i; j < stop; j += 1) if (out[j] !== "\n") out[j] = " ";
      i = stop;
      continue;
    }
    i += 1;
  }
  return out.join("");
}

/** Characters after which a `/` cannot be division, so it opens a regex. */
const REGEX_PRECEDERS = new Set(["(", ",", "=", ":", "[", "!", "&", "|", "?", "{", ";"]);

/** Whether the `/` at `at` is in a position where a regex literal can start. */
function opensRegex(text: string, at: number): boolean {
  let i = at - 1;
  while (i >= 0 && /\s/.test(text[i])) i -= 1;
  if (i < 0) return true;
  if (REGEX_PRECEDERS.has(text[i])) return true;
  return /(?:^|[^\w$])return$/.test(text.slice(Math.max(0, i - 6), i + 1));
}

/** Index just past the regex literal at `start`, or null if it is not one. */
function skipRegex(text: string, start: number): number | null {
  let i = start + 1;
  let inClass = false;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    // A regex literal cannot span a line. Hitting one means this `/` was
    // something else after all, and the caller falls through untouched.
    if (ch === "\n") return null;
    if (inClass) {
      if (ch === "]") inClass = false;
    } else if (ch === "[") {
      inClass = true;
    } else if (ch === "/") {
      i += 1;
      while (i < text.length && /[a-z]/.test(text[i])) i += 1;
      return i;
    }
    i += 1;
  }
  return null;
}

/** Index just past the literal opening at `start`. Handles `${…}` nesting. */
function skipLiteral(text: string, start: number): number {
  const quote = text[start];
  let i = start + 1;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (ch === quote) return i + 1;
    // An unterminated quote is a scan artefact (an apostrophe in JSX text),
    // not a literal. Stopping at the newline keeps it local to one line.
    if (quote !== "`" && ch === "\n") return i;
    if (quote === "`" && ch === "$" && text[i + 1] === "{") {
      i = skipBraced(text, i + 1);
      continue;
    }
    i += 1;
  }
  return i;
}

/** Index just past the `{…}` opening at `start`, skipping nested literals. */
function skipBraced(text: string, start: number): number {
  let depth = 0;
  let i = start;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      i = skipLiteral(text, i);
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
    i += 1;
  }
  return i;
}

/**
 * Opening tags for a JSX element, scanned to the first `>` at brace depth 0 and
 * outside string literals.
 *
 * The naive `/<button\b[^>]*>/g` ends at the `>` of an `onClick={() => …}` arrow,
 * which truncates the tag for any element whose handlers precede its className. That
 * cannot produce a false pass, but it silently makes attribute order load-bearing —
 * and a guard that reddens on a reorder, with a message that says only "3 of 3",
 * costs more to debug than it is worth.
 */
export function jsxOpeningTags(text: string, tag: string): string[] {
  const opener = new RegExp(`<${tag}(?![\\w-])`, "g");
  const tags: string[] = [];
  for (const match of text.matchAll(opener)) {
    const start = match.index!;
    let i = start + match[0].length;
    while (i < text.length) {
      const ch = text[i];
      if (ch === '"' || ch === "'" || ch === "`") {
        i = skipLiteral(text, i);
        continue;
      }
      if (ch === "{") {
        i = skipBraced(text, i);
        continue;
      }
      if (ch === ">") {
        i += 1;
        break;
      }
      i += 1;
    }
    tags.push(text.slice(start, i));
  }
  return tags;
}

/**
 * Whitespace-split class tokens from a JSX opening tag (`className="a b c"`).
 *
 * Every spelling, not the one that happened to be written first. The quoted
 * form is the common one, but `ComparePinButton` builds its className as a
 * template literal, and a helper that returned `[]` for that would report a
 * correctly-ringed control as ringless — a guard that cries wolf on correct
 * code gets deleted.
 *
 * The union of every branch, which is the right answer for "does this element
 * carry X at all" and the wrong one for "do X and Y land together" — use
 * `classNameTokenLists` for the second.
 */
export function classTokens(openingTag: string): string[] {
  return [...new Set(classNameWorlds(openingTag).flatMap(tokensOf))];
}

/**
 * Class tokens for every `className` in a file — one list per set of classes
 * that can land on one element AT ONCE.
 *
 * Two things the shipped `/className="[^"]*"/` scan got wrong, and both
 * matter to a guard that asks "does this element rest and hover on the same
 * colour?":
 *
 * 1. It saw only the QUOTED form. `SectionNav` builds its classes as a
 *    ternary inside a template literal, so restoring the aliased hover there
 *    left the phase-5 hover guard green. Match the token, not the syntax.
 * 2. Flattening a ternary invents an element. `isActive ? "text-text-primary"
 *    : "text-text-label hover:text-text-primary"` never renders both
 *    branches, and read as one list it reports a hover over its own resting
 *    value that no user can ever see. A guard that cries wolf on correct code
 *    gets deleted — so a ternary yields one list PER BRANCH.
 *
 * Non-exclusive spellings (`cn("a", flag && "b")`) stay concurrent, which is
 * the conservative direction: a missed pair is a false negative, an invented
 * one is a false positive.
 */
export function classNameTokenLists(text: string): string[][] {
  const lists: string[][] = [];
  for (let at = text.indexOf("className="); at !== -1; at = text.indexOf("className=", at + 1)) {
    lists.push(...classNameWorlds(text.slice(at)).map(tokensOf));
  }
  return lists;
}

/**
 * Class strings that can land on one element AT ONCE, across a whole file —
 * including the ones no `className` attribute spells out.
 *
 * `classNameTokenLists` reads `className` only, and every state-branching class
 * builder in `src/` is written as a `base` const plus one return per state
 * (`ForcedChoiceCard`, `ScaledQuestionCard`, `NavBar`, `Button`). Those reach
 * the element through a call — `className={mobileButtonClasses(v)}` — so a
 * `className` scan finds an unresolvable expression and reports NOTHING for the
 * files where a base and its branches most need reading together. That is how
 * #163 survived: the base named `transition-colors`, a branch sixteen lines
 * later named `hover:opacity-100`, and no guard could see a list holding both.
 *
 * The unit is the semicolon-delimited statement, with one exception: a
 * statement carrying a `className` is read per attribute instead, because a
 * component's whole JSX tree is one `return (…);` and reading that as one unit
 * would merge every element in the subtree onto one imaginary element.
 *
 * Identifiers resolve to the NEAREST PRECEDING binding. That is not lexical
 * scope, but it agrees with it wherever a name is bound before it is used, and
 * `ScaledQuestionCard` is the file that needs it: its two class builders each
 * declare their own `base` with a different transition list, and a
 * last-one-wins environment would read the desktop branch against the mobile
 * base.
 *
 * Two deliberate false negatives, both in the direction this file already
 * prefers — a missed pair costs a guard one catch, an invented pair gets the
 * guard deleted. An object or array initialiser is never bound: `Button`'s
 * `VARIANTS` holds three mutually-exclusive variants, and binding it would land
 * all three on one element at once. And an unbound name contributes the empty
 * string, so a list assembled through a lookup is read without it.
 */
export function classStringUnits(text: string): { classes: string; at: number }[] {
  const units: { classes: string; at: number }[] = [];
  const bindings: { name: string; worlds: string[]; at: number }[] = [];

  for (const statement of statements(text)) {
    const scope: ClassEnv = {};
    for (const binding of bindings) {
      if (binding.at < statement.at) scope[binding.name] = binding.worlds;
    }

    if (statement.text.includes("className=")) {
      for (
        let at = statement.text.indexOf("className=");
        at !== -1;
        at = statement.text.indexOf("className=", at + 1)
      ) {
        for (const classes of classNameWorlds(statement.text.slice(at), scope)) {
          units.push({ classes, at: statement.at + at });
        }
      }
      continue;
    }

    const declaration = DECLARATION.exec(statement.text);
    const worlds = classStrings(declaration ? declaration[2] : statement.text, scope);
    for (const classes of worlds) units.push({ classes, at: statement.at });
    // Read as a unit, but bound only if it is not an object or array: see above.
    if (declaration && !/^\s*[{[]/.test(declaration[2])) {
      bindings.push({ name: declaration[1], worlds, at: statement.at });
    }
  }
  return units;
}

/** A `const`/`let`/`var` declaration, split into its name and its initialiser.
 *  `=(?![=>])` so an `==` or an arrow inside a type annotation cannot be read
 *  as the assignment. */
const DECLARATION =
  /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]*?)?=(?![=>])([\s\S]*)$/;

/** Statements, split on the semicolons that are not inside a literal. */
function statements(text: string): { text: string; at: number }[] {
  const out: { text: string; at: number }[] = [];
  let start = 0;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      i = skipLiteral(text, i);
      continue;
    }
    if (ch === ";") {
      out.push({ text: text.slice(start, i), at: start });
      start = i + 1;
    }
    i += 1;
  }
  out.push({ text: text.slice(start), at: start });
  return out;
}

const tokensOf = (value: string): string[] => value.split(/\s+/).filter(Boolean);

/**
 * Class strings already bound to a name, so an operand that is only an
 * identifier can contribute the tokens it stands for.
 *
 * Empty for every caller that scans a `className` alone, which is why
 * threading it through changes nothing for them: with no binding in scope the
 * identifier branch in `classStrings` only advances the cursor past a name it
 * was already walking one character at a time.
 */
export type ClassEnv = Record<string, string[]>;

/** Class-string candidates for the FIRST `className` in `text`, one per branch. */
function classNameWorlds(text: string, env: ClassEnv = {}): string[] {
  const at = text.indexOf("className=");
  if (at === -1) return [];
  const start = at + "className=".length;
  if (text[start] === '"') {
    const end = text.indexOf('"', start + 1);
    return [text.slice(start + 1, end === -1 ? undefined : end)];
  }
  if (text[start] !== "{") return [];
  return classStrings(text.slice(start + 1, Math.max(start + 1, skipBraced(text, start) - 1)), env);
}

/** Cap on branch combinations per className, past which branches are dropped. */
const MAX_WORLDS = 32;

/**
 * Class STRINGS an expression can produce, one per branch world.
 *
 * Strings rather than token lists, and that is the whole point of the shape:
 * adjacency is load-bearing. `` `focus-ring${"-child"}` `` renders
 * `focus-ring-child` and NOTHING ELSE, so a chunk model that emitted
 * `focus-ring` and `-child` as two tokens reintroduced, one layer down, the
 * exact substring bug the focus-ring guard exists to kill — and `focus-ring`
 * really is a prefix of the real sibling utility `focus-ring-child`
 * (globals.css:590). Concatenating within a template and separating only
 * across independent operands gets both this and `ComparePinButton`'s real
 * `` `focus-ring${cond ? ` ${extra}` : ""}` `` right: that interpolation's
 * branches begin with a space or are empty, so its `focus-ring` stays whole.
 *
 * Residual limit, stated rather than justified away: an interpolation with no
 * static content at all (`${size}`) contributes the empty string, so
 * `` `text-${size}` `` reads as `text-` and `` `focus-ring${dynamic}` `` reads
 * as `focus-ring`. Resolving that needs evaluation, not scanning.
 */
function classStrings(expression: string, env: ClassEnv = {}): string[] {
  const ternary = splitTernary(expression);
  if (ternary) {
    return [...classStrings(ternary[0], env), ...classStrings(ternary[1], env)];
  }

  let worlds = [""];
  /** A separate operand: joined with whitespace, so its tokens stay distinct. */
  const separate = (pieces: string[]) => {
    worlds = combine(worlds, pieces, (a, b) => (a && b ? `${a} ${b}` : a + b));
  };

  let i = 0;
  while (i < expression.length) {
    const ch = expression[i];
    if (ch === '"' || ch === "'") {
      const end = skipLiteral(expression, i);
      separate([expression.slice(i + 1, Math.max(i + 1, end - 1))]);
      i = end;
      continue;
    }
    if (ch === "`") {
      const end = skipLiteral(expression, i);
      separate(templateStrings(expression.slice(i, end), env));
      i = end;
      continue;
    }
    // A bare identifier stands for the classes it was bound to. `${base} …` is
    // how every state-branching class builder in `src/` is written, and a scan
    // that reads only the literals sees a branch's own tokens without the
    // shared base they land beside. `Object.hasOwn`, not a truthiness test: a
    // variable named `constructor` would otherwise resolve to
    // `Object.prototype`'s member and be spread as if it were a class list.
    if (/[A-Za-z_$]/.test(ch)) {
      const name = /^[\w$]+/.exec(expression.slice(i))![0];
      if (Object.hasOwn(env, name)) separate(env[name]);
      i += name.length;
      continue;
    }
    i += 1;
  }
  return worlds;
}

/** Class strings a template literal can produce. Its pieces are ADJACENT. */
function templateStrings(template: string, env: ClassEnv = {}): string[] {
  let worlds = [""];
  const adjacent = (pieces: string[]) => {
    worlds = combine(worlds, pieces, (a, b) => a + b);
  };

  let cooked = "";
  let i = 1;
  while (i < template.length) {
    const ch = template[i];
    if (ch === "\\") {
      cooked += template[i + 1] ?? "";
      i += 2;
      continue;
    }
    if (ch === "`") break;
    if (ch === "$" && template[i + 1] === "{") {
      adjacent([cooked]);
      cooked = "";
      const end = skipBraced(template, i + 1);
      const inner = classStrings(template.slice(i + 2, Math.max(i + 2, end - 1)), env);
      adjacent(inner.length ? inner : [""]);
      i = end;
      continue;
    }
    cooked += ch;
    i += 1;
  }
  adjacent([cooked]);
  return worlds;
}

/** Cross product of two world lists, capped. Over the cap, branches are DROPPED
 *  rather than merged: a missed branch is a false negative, and merging two
 *  branches onto one element is the false positive this shape exists to avoid. */
function combine(
  worlds: string[],
  pieces: string[],
  glue: (a: string, b: string) => string,
): string[] {
  return worlds
    .flatMap((world) => pieces.map((piece) => glue(world, piece)))
    .slice(0, MAX_WORLDS);
}

/**
 * The two branches of a top-level ternary, or null.
 *
 * Deliberately shallow: `?.` and `??` are skipped, and only `?`/`:` outside
 * every bracket and literal count, so a TS parameter annotation inside parens
 * cannot be mistaken for the colon. A wrong answer here loses a branch, which
 * costs a false negative and never a false positive.
 */
function splitTernary(expression: string): [string, string] | null {
  let depth = 0;
  let question = -1;
  let nested = 0;
  let i = 0;
  while (i < expression.length) {
    const ch = expression[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      i = skipLiteral(expression, i);
      continue;
    }
    if (ch === "(" || ch === "[" || ch === "{") depth += 1;
    else if (ch === ")" || ch === "]" || ch === "}") depth -= 1;
    else if (depth === 0 && ch === "?") {
      if (expression[i + 1] === "?" || expression[i + 1] === ".") {
        i += 2;
        continue;
      }
      if (question === -1) question = i;
      else nested += 1;
    } else if (depth === 0 && ch === ":" && question !== -1) {
      if (nested > 0) nested -= 1;
      else return [expression.slice(question + 1, i), expression.slice(i + 1)];
    }
    i += 1;
  }
  return null;
}

/**
 * Strips `/* … *\/` comments from a stylesheet.
 *
 * Every CSS guard in this suite reads declarations, and a whole-file scan
 * cannot tell a declaration from prose about a declaration — `globals.css`
 * documents `--radius` as "12px and 8px both collapse to 2px" in a comment
 * directly above it. Separate from `stripComments`, which is a TS/TSX
 * scanner: its regex-literal heuristic has no meaning in CSS, and it would
 * mangle a `content: "//"` declaration.
 */
export function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Body of a top-level CSS block, BRACE-MATCHED rather than regexed.
 *
 * `opener` may include the trailing `{` or not; the scan starts at the first
 * `{` at or after it either way.
 *
 * Shared by `design-system-tokens.test.ts` and `design-docs.test.ts`, which
 * carried near-identical copies that had ALREADY drifted — one passed the
 * opener with a `{`, the other without. Same de-duplication as `sourceFiles`
 * above, and for the same reason.
 *
 * Brace matching, not `[\s\S]*?\n\}`: `focus-ring` and `focus-ring-child`
 * nest `&:focus`-style blocks, and a non-greedy body truncates at the inner
 * brace for any nested rule whose closer is not indented. Depth counting does
 * not depend on whitespace.
 */
export function cssBlock(css: string, opener: string): string {
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

/**
 * Matches an `@utility` opener.
 *
 * Whitespace is `\s+` / `\s*` rather than a literal space on purpose. The
 * spelling this replaced required exactly one space and a same-line brace, so
 * a role authored as `@utility  foo {` or with the brace on the next line
 * dropped out of the parse silently — and because the design-docs completeness
 * check built its own opener list from the SAME pattern, such a role vanished
 * from both sides of that assertion and the check stayed green with a hole in
 * it. Loosening it here fixes both callers at once.
 */
const UTILITY_OPENER = /@utility\s+([a-z0-9-]+)\s*\{/g;

/** Every `@utility` name in a stylesheet, without parsing bodies. */
export function cssUtilityNames(css: string): string[] {
  return [...css.matchAll(UTILITY_OPENER)].map(([, name]) => name);
}

/**
 * Count of `@utility` at-rules by the loosest possible reading.
 *
 * Deliberately independent of `UTILITY_OPENER`: it is the anti-vacuity anchor
 * for a completeness check, and an anchor derived from the pattern it is
 * meant to validate anchors nothing. If these two disagree, a rule exists that
 * the structured parse cannot see.
 */
export function cssUtilityAtRuleCount(css: string): number {
  return (css.match(/@utility\b/g) ?? []).length;
}

/** Every `@utility` rule in a stylesheet, in declaration order. */
export function cssUtilities(css: string): { name: string; body: string }[] {
  return [...css.matchAll(UTILITY_OPENER)].map((match) => ({
    name: match[1],
    body: cssBlock(css.slice(match.index), match[0]),
  }));
}
