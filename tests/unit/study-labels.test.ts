import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  ECONOMIC_LABELS,
  EDUCATION_LABELS,
  GENDER_LABELS,
  GOVERNANCE_LABELS,
  URBAN_RURAL_LABELS,
  humanizeKey,
  labelFor,
} from "@/lib/study/labels";

// The label maps are keyed by the type unions in study/types.ts, so TypeScript
// already forces them to stay in sync with each other. What TypeScript cannot
// see is the pipeline output — these tests pin the maps to the real category
// vocabulary in the derived catalog so a regeneration cannot silently
// reintroduce raw snake_case in the filter UI.

const slimPath = path.join(
  process.cwd(),
  "public/study/derived/personas_slim.json"
);

type SlimPersona = {
  gender: string;
  education: string;
  urban_rural: string;
  economic_position: string;
  governance_experience: string;
};

const personas = JSON.parse(
  fs.readFileSync(slimPath, "utf8")
) as SlimPersona[];

function observed(field: keyof SlimPersona): string[] {
  return [...new Set(personas.map((p) => p[field]))].sort();
}

describe("study label maps cover the derived catalog vocabulary", () => {
  const cases: Array<[keyof SlimPersona, Record<string, string>]> = [
    ["governance_experience", GOVERNANCE_LABELS],
    ["economic_position", ECONOMIC_LABELS],
    ["education", EDUCATION_LABELS],
    ["urban_rural", URBAN_RURAL_LABELS],
    ["gender", GENDER_LABELS],
  ];

  for (const [field, map] of cases) {
    it(`labels every ${field} value present in personas_slim.json`, () => {
      const unlabeled = observed(field).filter((v) => map[v] === undefined);
      expect(unlabeled).toEqual([]);
    });

    it(`declares no ${field} label for a value the catalog never uses`, () => {
      const present = new Set(observed(field));
      const orphans = Object.keys(map).filter((k) => !present.has(k));
      expect(orphans).toEqual([]);
    });
  }
});

describe("labelFor", () => {
  it("returns the mapped label when the key is known", () => {
    expect(labelFor(GOVERNANCE_LABELS, "flawed_democracy")).toBe(
      "Flawed democracy"
    );
  });

  it("humanizes an unknown key rather than showing the raw value", () => {
    expect(labelFor(GOVERNANCE_LABELS, "some_new_category")).toBe(
      "Some New Category"
    );
  });
});

describe("humanizeKey", () => {
  it("title-cases a snake_case key", () => {
    expect(humanizeKey("colonial_post_colonial_transition")).toBe(
      "Colonial Post Colonial Transition"
    );
  });
});
