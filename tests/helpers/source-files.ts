import { readdirSync } from "node:fs";
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
