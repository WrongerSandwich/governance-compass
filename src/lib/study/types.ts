import type { ArchetypeEmergence } from "@/data/archetypes";
export type { ArchetypeEmergence };

export type ClusterId = 0 | 1 | 2 | 3 | 4 | 5;

export type RegionKey =
  | "western_europe"
  | "eastern_europe_central_asia"
  | "north_america"
  | "latin_america"
  | "middle_east_north_africa"
  | "sub_saharan_africa"
  | "south_southeast_asia"
  | "east_asia"
  | "oceania_small_states"
  | "diaspora_transnational";

export type RegionHumanLabel =
  | "Western Europe"
  | "Eastern Europe & Central Asia"
  | "North America"
  | "Latin America"
  | "Middle East & N. Africa"
  | "Sub-Saharan Africa"
  | "South & SE Asia"
  | "East Asia"
  | "Oceania"
  | "Diaspora / Transnational";

// Authoritative source for human-readable region labels
// Used by modal, badges, filter UI, and any component needing region display text.
export const REGION_LABELS: Record<RegionKey, string> = {
  western_europe: "Western Europe",
  eastern_europe_central_asia: "Eastern Europe & Central Asia",
  north_america: "North America",
  latin_america: "Latin America",
  middle_east_north_africa: "Middle East & N. Africa",
  sub_saharan_africa: "Sub-Saharan Africa",
  south_southeast_asia: "South & SE Asia",
  east_asia: "East Asia",
  oceania_small_states: "Oceania",
  diaspora_transnational: "Diaspora / Transnational",
};

export type UrbanRural = "urban" | "peri_urban" | "rural";

export type EconomicPosition =
  | "affluent"
  | "upper_middle_class"
  | "middle_class"
  | "working_class"
  | "struggling"
  | "impoverished";

export type GovernanceExperience =
  | "stable_democracy"
  | "transitional_democracy"
  | "hybrid_regime"
  | "authoritarian"
  | "conflict_affected"
  | "colonial_or_occupied"
  | "stateless_or_displaced";

export type EducationLevel =
  | "primary"
  | "secondary"
  | "vocational"
  | "university"
  | "postgraduate";

export type Gender = "male" | "female" | "non_binary" | "other";

export type AxisScoreKey =
  | "1_economic_model"
  | "2_environmental_policy"
  | "3_governance_structure"
  | "4_decision_authority"
  | "5_rights_balance"
  | "6_legitimacy_basis"
  | "7_social_change"
  | "8_cultural_diversity"
  | "9_human_nature"
  | "10_international_engagement"
  | "11_military_policy"
  | "12_technology_governance";

export type AxisScores = Record<AxisScoreKey, number>;

export type ModalityBreakdown = {
  fc: number | null;
  sc: number | null;
  bg: number | null;
};

export type ModalityScores = Record<AxisScoreKey, ModalityBreakdown>;

export type TensionLevel = "mild" | "moderate" | "strong";

export type AxisTension = {
  axis: number;
  magnitude: number;
  level: TensionLevel;
};

export type ConfidenceLevel = "high" | "moderate" | "low";

export type AxisConfidence = {
  spread: number;
  level: ConfidenceLevel;
};

export type ConfidenceMap = Record<AxisScoreKey, AxisConfidence>;

export type SuperDimensions = {
  economic: number;
  cultural: number;
};

export type PersonaRecord = {
  id: string;
  region: RegionKey;
  batch_index: number;
  generator_model: string;
  generated_at: string;
  name: string;
  age: number;
  location: string;
  urban_rural: UrbanRural;
  occupation: string;
  education: EducationLevel;
  family: string;
  economic_position: EconomicPosition;
  economic_detail: string;
  religious_tradition: string;
  governance_experience: GovernanceExperience;
  governance_detail: string;
  gender: Gender;
  life_narrative: string;
  key_tensions: string;
  full_narrative: string;
};

export type ScoredProfile = {
  persona_id: string;
  model: string;
  axis_scores: AxisScores;
  modality_scores: ModalityScores;
  tensions: AxisTension[];
  super_dimensions: SuperDimensions;
  confidence: ConfidenceMap;
};

export type FCResponse = {
  item: string;
  choice: "A" | "B";
};

export type SCResponse = {
  item: string;
  choice: 1 | 2 | 3 | 4 | 5;
};

export type BudgetAllocation = {
  defense: number;
  public_welfare: number;
  economy_growth: number;
  education_research: number;
  environment: number;
  justice_civil_liberties: number;
  foreign_affairs: number;
};

export type ResponseRecord = {
  persona_id: string;
  fc_responses: FCResponse[];
  sc_responses: SCResponse[];
  budget: BudgetAllocation;
};

export type ResponseFile = {
  model: string;
  total_personas: number;
  complete_personas: number;
  incomplete_persona_ids: string[];
  responses: ResponseRecord[];
};

// Mirrors pipeline output shape — flat axis_* keys rather than number[].
export type ClusterCentroid = {
  cluster: number;
  axis_1: number;
  axis_2: number;
  axis_3: number;
  axis_4: number;
  axis_5: number;
  axis_6: number;
  axis_7: number;
  axis_8: number;
  axis_9: number;
  axis_10: number;
  axis_11: number;
  axis_12: number;
  size: number;
  share: number;
};

export type ClusterNarrative = {
  cluster: number;
  size: number;
  share: number;
  top_axes: string[];
};

export type ArchetypeDistance = {
  archetype_id: string;
  archetype_name: string;
  distance: number;
};

export type ClusterArchetypeEntry = {
  cluster: number;
  size: number;
  share: number;
  nearest_archetype: {
    id: string;
    name: string;
    distance: number;
  };
  second_nearest: {
    id: string;
    name: string;
    distance: number;
  };
  all_distances: ArchetypeDistance[];
};

export type ArchetypeComparison = {
  max_distance: number;
  cluster_to_archetype: ClusterArchetypeEntry[];
};

export type PerAxisAgreement = {
  axis: number;
  pearson_r: number;
  mean_diff_gemini_minus_claude: number;
};

export type EuclideanDistanceSummary = {
  mean: number;
  median: number;
  p90: number;
  max: number;
};

export type ModelAgreement = {
  n_shared_personas: number;
  per_axis: PerAxisAgreement[];
  euclidean_distance: EuclideanDistanceSummary;
};

export type OverallTensionEntry = {
  model: string;
  axis: number;
  count: number;
  pct: number;
};

export type ClusterTensionEntry = {
  cluster: number;
  axis: number;
  count: number;
  pct_of_cluster_calls: number;
};

export type TensionPatterns = {
  overall_by_axis: OverallTensionEntry[];
  by_cluster: ClusterTensionEntry[];
};

export type MatchStrength = "strong" | "moderate" | "close" | "weak";

export type PersonaSlim = {
  id: string;
  name: string;
  region: RegionKey;
  country_iso: string;
  location: string;
  age: number;
  gender: Gender;
  education: EducationLevel;
  urban_rural: UrbanRural;
  economic_position: EconomicPosition;
  governance_experience: GovernanceExperience;
  cluster: number;
  n_models: number;
  averaged_axis_scores: number[];
  nearest_archetype_id: string;
};

export type RegionalAggregate = {
  region: RegionKey;
  count: number;
  top_archetypes: Array<{ id: string; name: string; count: number }>;
  dominant_cluster: number;
  dominant_cluster_share: number;
  mean_axis_scores: number[];
  cluster_distribution: Record<string, number>;
};

export type CountryAggregate = {
  country_iso: string;
  country_name: string;
  region: RegionKey;
  count: number;
  top_archetypes: Array<{ id: string; name: string; count: number }>;
};

export type DemographicClusterDistribution = {
  attribute: string;
  category: string;
  count: number;
  cluster_distribution: Record<string, number>;
};

export type DemographicAggregate = {
  urban_rural: DemographicClusterDistribution[];
  economic_position: DemographicClusterDistribution[];
  governance_experience: DemographicClusterDistribution[];
  education: DemographicClusterDistribution[];
};

export type AxisHistogram = {
  axis: number;
  bins: Array<{ min: number; max: number; count: number }>;
  mean: number;
};

export type AxisCorrelationMatrix = {
  axes: string[];
  matrix: number[][];
};

export type ModelAgreementByAttribute = {
  attribute: string;
  category: string;
  n: number;
  mean_distance: number;
};

export type ScoredProfilesFile = {
  generated_at: string;
  total_profiles: number;
  per_model_counts: Record<string, number>;
  profiles: ScoredProfile[];
};

export type PersonasFile = {
  personas: PersonaRecord[];
};

// ---------------------------------------------------------------------------
// API response types
// ---------------------------------------------------------------------------

export interface PersonaDetailResponse {
  persona: PersonaRecord;
  country_iso: string;
  cluster: ClusterId;
  n_models: 1 | 2;
  averaged_axis_scores: number[]; // 12 elements
  nearest_archetype: {
    id: string;
    name: string;
    emergence: ArchetypeEmergence;
    distance: number;
    match_strength: "strong" | "moderate" | "close" | "weak";
  };
  administrations: Array<{
    model: "claude" | "gemini";
    axis_scores: Record<string, number>; // "1_economic_model" etc.
    modality_scores: Record<string, { fc?: number; sc?: number; budget?: number }>;
    tensions: Array<{
      axis: number;
      severity: "mild" | "moderate" | "strong";
      description?: string;
    }>;
    confidence: Record<string, "high" | "moderate" | "low">;
    super_dimensions: { economic: number; cultural: number };
    raw_responses: {
      fc: Array<{ item: string; choice: "A" | "B" }>;
      sc: Array<{ item: string; choice: number }>;
      budget: Record<string, number>;
    };
  }>;
}
