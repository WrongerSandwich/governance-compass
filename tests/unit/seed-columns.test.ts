// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { SEED_COLUMNS } from "../../prisma/seed-columns";
import { axes } from "@/data/axes";

const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");

/** Scalar column names of a Prisma model, skipping relations and attributes. */
function scalarColumns(model: string): string[] {
  const body = schema.match(new RegExp(`^model ${model} \\{$([\\s\\S]*?)^\\}$`, "m"))?.[1];
  if (!body) throw new Error(`model ${model} not found in schema.prisma`);

  return body
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/, "").trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/))
    .filter(([, type]) =>
      type && /^(Int|String|Boolean|Float|DateTime|Json)(\[\]|\?)?$/.test(type),
    )
    .map(([name]) => name);
}

describe("seed columns", () => {
  // The seed used to spread each src/data object wholesale, so adding
  // presentation-only copy to one (AxisData.divergenceNote) sent Prisma an
  // unknown argument and failed `prisma db seed` — caught only by CI's e2e
  // job, after every other gate had passed. This pins both directions for
  // every seeded model: a schema column the seed forgets to write, and a seed
  // key the schema does not have.
  for (const [model, columns] of Object.entries(SEED_COLUMNS)) {
    it(`writes exactly the ${model} model's scalar columns`, () => {
      expect([...columns].sort()).toEqual(scalarColumns(model).sort());
    });
  }

  it("covers every model the seed writes", () => {
    // A new upsert loop added without a SEED_COLUMNS entry would otherwise go
    // unguarded, which is exactly how this class of bug reaches CI.
    const seed = readFileSync(resolve(process.cwd(), "prisma/seed.ts"), "utf8");
    const upserted = [...seed.matchAll(/prisma\.(\w+)\.upsert/g)].map(
      ([, name]) => name[0].toUpperCase() + name.slice(1),
    );

    expect([...new Set(upserted)].sort()).toEqual(Object.keys(SEED_COLUMNS).sort());
  });

  it("keeps presentation-only axis copy out of the database", () => {
    // divergenceNote is read straight from src/data by the home page. If it
    // ever needs querying it needs a migration — not a silent seed spread.
    expect(axes[0]).toHaveProperty("divergenceNote");
    expect(scalarColumns("Axis")).not.toContain("divergenceNote");
  });
});
