import type { PersonaCatalogEntry, PersonaSlim } from "@/lib/study/types";

/**
 * Project a full `PersonaSlim` record down to what the /study/personas catalog
 * actually uses.
 *
 * The page is a server component that hands the whole 1,002-entry catalog to a
 * client component, so every retained field is serialized into the RSC payload
 * twice (HTML + flight data). `averaged_axis_scores` alone is twelve
 * full-precision floats per persona and nothing in the grid, the filters or the
 * compare pins reads it — the persona modal fetches its own detail from
 * `/api/study/persona/[id]`.
 */
export function toCatalogEntry(persona: PersonaSlim): PersonaCatalogEntry {
  return {
    id: persona.id,
    name: persona.name,
    region: persona.region,
    age: persona.age,
    gender: persona.gender,
    education: persona.education,
    urban_rural: persona.urban_rural,
    economic_position: persona.economic_position,
    governance_experience: persona.governance_experience,
    cluster: persona.cluster,
    n_models: persona.n_models,
    nearest_archetype_id: persona.nearest_archetype_id,
  };
}
