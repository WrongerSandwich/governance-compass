import type {
  EconomicPosition,
  EducationLevel,
  Gender,
  GovernanceExperience,
  UrbanRural,
} from "@/lib/study/types";

// Display labels for the persona category vocabulary. These are keyed by the
// type unions in types.ts, so adding or renaming a category there forces every
// map here to be updated. tests/unit/study-labels.test.ts pins both to the
// vocabulary actually present in the derived catalog.
//
// Chart-specific components (DemographicAggregates, the model-agreement page)
// keep their own shorter labels where axis width demands it.

/** Title-case a snake_case data key as a last-resort label. */
export function humanizeKey(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Look up a display label, falling back to a humanized key. */
export function labelFor(
  map: Record<string, string>,
  key: string | undefined
): string {
  if (!key) return "";
  return map[key] ?? humanizeKey(key);
}

export const GOVERNANCE_LABELS: Record<GovernanceExperience, string> = {
  stable_democracy: "Stable democracy",
  flawed_democracy: "Flawed democracy",
  hybrid_regime: "Hybrid regime",
  authoritarian_state: "Authoritarian state",
  conflict_zone: "Conflict zone",
  colonial_post_colonial_transition: "Post-colonial transition",
};

export const ECONOMIC_LABELS: Record<EconomicPosition, string> = {
  wealthy: "Wealthy",
  affluent: "Affluent",
  middle_class: "Middle class",
  working_class: "Working class",
  struggling: "Struggling",
};

export const EDUCATION_LABELS: Record<EducationLevel, string> = {
  none: "No formal schooling",
  primary: "Primary",
  secondary: "Secondary",
  university: "University",
  postgraduate: "Postgraduate",
};

export const URBAN_RURAL_LABELS: Record<UrbanRural, string> = {
  urban: "Urban",
  peri_urban: "Peri-urban",
  rural: "Rural",
};

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Male",
  female: "Female",
  non_binary: "Non-binary",
};
