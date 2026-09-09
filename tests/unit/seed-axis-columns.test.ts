// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { axes } from "@/data/axes";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

/** Scalar column names of a Prisma model, skipping relations and attributes. */
function scalarColumns(schema: string, model: string): string[] {
  const body = schema.match(new RegExp(`^model ${model} \\{$([\\s\\S]*?)^\\}$`, "m"))?.[1];
  if (!body) throw new Error(`model ${model} not found in schema.prisma`);

  return body
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/, "").trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/))
    .filter(([, type]) => type && /^(Int|String|Boolean|Float|DateTime|Json)\??$/.test(type))
    .map(([name]) => name);
}

/** Keys of the object literal the seed builds for each axis row. */
function seedRowKeys(seed: string): string[] {
  const body = seed.match(/const row = \{([\s\S]*?)\n {4}\};/)?.[1];
  if (!body) throw new Error("axis row literal not found in prisma/seed.ts");

  return [...body.matchAll(/^\s*(\w+):/gm)].map((match) => match[1]);
}

describe("axis seed columns", () => {
  const schemaColumns = scalarColumns(read("prisma/schema.prisma"), "Axis");
  const rowKeys = seedRowKeys(read("prisma/seed.ts"));

  it("writes exactly the Axis model's scalar columns", () => {
    // The seed used to spread AxisData wholesale, so adding presentation-only
    // copy to it (divergenceNote) sent Prisma an unknown argument and failed
    // `prisma db seed` — caught only by CI, after every other gate had passed.
    // This pins both directions: a new schema column the seed forgets to write,
    // and a seed key the schema does not have.
    expect([...rowKeys].sort()).toEqual([...schemaColumns].sort());
  });

  it("keeps presentation-only axis copy out of the database", () => {
    // divergenceNote is read straight from src/data by the home page. If it
    // ever needs to be queried, it needs a migration — not a silent seed spread.
    expect(axes[0]).toHaveProperty("divergenceNote");
    expect(schemaColumns).not.toContain("divergenceNote");
  });
});
