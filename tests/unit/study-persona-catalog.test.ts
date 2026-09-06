import { describe, it, expect } from "vitest";
import { toCatalogEntry } from "@/lib/study/persona-catalog";
import type { PersonaSlim } from "@/lib/study/types";

const SLIM: PersonaSlim = {
  id: "P0001",
  name: "Ada Okonkwo",
  region: "sub_saharan_africa",
  country_iso: "NGA",
  age: 41,
  gender: "female",
  education: "university",
  urban_rural: "urban",
  economic_position: "middle_class",
  governance_experience: "flawed_democracy",
  cluster: 3,
  n_models: 2,
  averaged_axis_scores: [
    0.1, -0.2, 0.3, -0.4, 0.5, -0.6, 0.7, -0.8, 0.9, -1, 0.11, -0.12,
  ],
  nearest_archetype_id: "civic_pragmatist",
};

describe("toCatalogEntry", () => {
  it("keeps every field the catalog UI renders, filters or sorts on", () => {
    const entry = toCatalogEntry(SLIM);

    expect(entry).toEqual({
      id: "P0001",
      name: "Ada Okonkwo",
      region: "sub_saharan_africa",
      age: 41,
      gender: "female",
      education: "university",
      urban_rural: "urban",
      economic_position: "middle_class",
      governance_experience: "flawed_democracy",
      cluster: 3,
      n_models: 2,
      nearest_archetype_id: "civic_pragmatist",
    });
  });

  it("drops the fields no catalog component reads", () => {
    const entry = toCatalogEntry(SLIM) as Record<string, unknown>;

    // These are the bulk of personas_slim.json and were being serialized into
    // the /study/personas RSC payload for all 1,002 personas without being
    // read: country_iso is only used by the persona detail API, and the axis
    // vectors only by the build and that same API.
    expect(entry).not.toHaveProperty("country_iso");
    expect(entry).not.toHaveProperty("averaged_axis_scores");
  });

  it("does not mutate the source record", () => {
    const source = { ...SLIM };
    toCatalogEntry(source);

    expect(source).toEqual(SLIM);
  });
});
