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
 * Deliberately not a parser. It skips string and template literals so that a
 * `//` inside a URL or a `/*` inside a regex does not eat the rest of the
 * file, and that is the whole of its ambition. Guards run over source we
 * control; if a file ever defeats it, the fix is to simplify the file.
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
 * code gets deleted. So a braced value is scanned for its STATIC literal
 * chunks: quoted strings, template cooked parts, and the literals inside any
 * `${…}` it interpolates.
 *
 * Known limit, narrow and deliberate: a chunk abutting an interpolation is
 * reported as written, so `text-${n}` yields the fragment `text-`. Harmless
 * for token membership (no real utility is a prefix of another AND spelled
 * this way), and the alternative — discarding abutting chunks — would drop
 * the real `focus-ring` in `` `focus-ring${extra}` ``.
 */
export function classTokens(openingTag: string): string[] {
  const at = openingTag.indexOf("className=");
  if (at === -1) return [];
  const start = at + "className=".length;
  if (openingTag[start] === '"') {
    const end = openingTag.indexOf('"', start + 1);
    return openingTag
      .slice(start + 1, end === -1 ? undefined : end)
      .split(/\s+/)
      .filter(Boolean);
  }
  if (openingTag[start] !== "{") return [];
  const expression = openingTag.slice(start, skipBraced(openingTag, start));
  return literalChunks(expression)
    .flatMap((chunk) => chunk.split(/\s+/))
    .filter(Boolean);
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
    const tag = text.slice(at);
    const start = "className=".length;
    if (tag[start] === '"') {
      lists.push(classTokens(tag));
      continue;
    }
    if (tag[start] !== "{") continue;
    const expression = tag.slice(start + 1, Math.max(start + 1, skipBraced(tag, start) - 1));
    for (const world of chunkWorlds(expression)) {
      lists.push(world.flatMap((chunk) => chunk.split(/\s+/)).filter(Boolean));
    }
  }
  return lists;
}

/** Cap on branch combinations per className, past which they are flattened. */
const MAX_WORLDS = 32;

/** Static string chunks an expression can produce, one list per branch world. */
function chunkWorlds(expression: string): string[][] {
  const ternary = splitTernary(expression);
  if (ternary) {
    return [...chunkWorlds(ternary[0]), ...chunkWorlds(ternary[1])];
  }

  const base: string[] = [];
  const alternatives: string[][][] = [];
  let i = 0;
  while (i < expression.length) {
    const ch = expression[i];
    if (ch === '"' || ch === "'") {
      const end = skipLiteral(expression, i);
      base.push(expression.slice(i + 1, Math.max(i + 1, end - 1)));
      i = end;
      continue;
    }
    if (ch === "`") {
      i += 1;
      let cooked = "";
      while (i < expression.length) {
        if (expression[i] === "\\") {
          cooked += expression[i + 1] ?? "";
          i += 2;
          continue;
        }
        if (expression[i] === "`") {
          i += 1;
          break;
        }
        if (expression[i] === "$" && expression[i + 1] === "{") {
          base.push(cooked);
          cooked = "";
          const end = skipBraced(expression, i + 1);
          alternatives.push(chunkWorlds(expression.slice(i + 2, Math.max(i + 2, end - 1))));
          i = end;
          continue;
        }
        cooked += expression[i];
        i += 1;
      }
      base.push(cooked);
      continue;
    }
    i += 1;
  }

  let worlds: string[][] = [base];
  for (const alternative of alternatives) {
    if (worlds.length * alternative.length > MAX_WORLDS) {
      worlds = [worlds.flat().concat(alternative.flat())];
      continue;
    }
    worlds = worlds.flatMap((world) => alternative.map((alt) => [...world, ...alt]));
  }
  return worlds;
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

/** Static string content of every literal in an expression, `${…}` included. */
function literalChunks(expression: string): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < expression.length) {
    const ch = expression[i];
    if (ch === '"' || ch === "'") {
      const end = skipLiteral(expression, i);
      chunks.push(expression.slice(i + 1, Math.max(i + 1, end - 1)));
      i = end;
      continue;
    }
    if (ch === "`") {
      i += 1;
      let cooked = "";
      while (i < expression.length) {
        if (expression[i] === "\\") {
          cooked += expression[i + 1] ?? "";
          i += 2;
          continue;
        }
        if (expression[i] === "`") {
          i += 1;
          break;
        }
        if (expression[i] === "$" && expression[i + 1] === "{") {
          chunks.push(cooked);
          cooked = "";
          const end = skipBraced(expression, i + 1);
          chunks.push(...literalChunks(expression.slice(i + 2, Math.max(i + 2, end - 1))));
          i = end;
          continue;
        }
        cooked += expression[i];
        i += 1;
      }
      chunks.push(cooked);
      continue;
    }
    i += 1;
  }
  return chunks;
}
