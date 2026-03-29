// Response input types
export interface QuizResponses {
  forcedChoice: Record<string, "A" | "B">;
  scaled: Record<string, 1 | 2 | 3 | 4 | 5>;
  budget: Record<number, number>; // ministryId → amount
}

// Per-axis modality scores before fusion
export interface PerModalityScores {
  [axisId: number]: {
    fc: number;         // [-1.0, +1.0]
    sc: number;         // [-1.0, +1.0]
    bg: number | null;  // [-1.0, +1.0] or null
  };
}

// Tension/contradiction info
export interface TensionInfo {
  detected: boolean;
  magnitude: number; // 0.0 to 2.0
  level: "none" | "mild" | "moderate" | "strong";
  direction: "principles_A_but_budget_B" | "principles_B_but_budget_A" | null;
}

// Single axis result
export interface AxisScoreResult {
  axisId: number;
  fcScore: number;
  scScore: number;
  bgScore: number | null;
  finalScore: number;
  confidence: "high" | "moderate" | "low" | "conflicted";
  tension: TensionInfo;
}

// Compass plot coordinates
export interface CompassResult {
  economic: number; // [-1.0, +1.0]
  cultural: number; // [-1.0, +1.0]
}

// Archetype match result
export interface ArchetypeMatch {
  primaryId: string;
  primaryMatchPct: number;
  secondaryId: string;
  secondaryMatchPct: number;
  isBlended: boolean;
  isDistinctive: boolean; // true when profile doesn't map to any single archetype
}

// Full results package
export interface QuizResults {
  axisScores: AxisScoreResult[];
  compass: CompassResult;
  archetype: ArchetypeMatch;
}

// Weight profile for modality fusion
export interface AxisWeightProfile {
  fc: number;
  sc: number;
  bg: number;
}

// Budget scoring constants
export const BUDGET_BASELINE = 10;
export const BUDGET_MINIMUM = 5;
export const BUDGET_SIGMOID_K = 10;

// Axis weight profiles for modality fusion (Stage 3)
export const AXIS_WEIGHT_PROFILES: Record<number, AxisWeightProfile> = {
  1:  { fc: 0.40, sc: 0.35, bg: 0.25 }, // Full budget (2 ministries, both directions)
  2:  { fc: 0.40, sc: 0.35, bg: 0.25 }, // Full budget (3 ministries)
  3:  { fc: 0.55, sc: 0.45, bg: 0.00 }, // No budget mapping
  4:  { fc: 0.45, sc: 0.40, bg: 0.15 }, // Partial (Education, one direction)
  5:  { fc: 0.40, sc: 0.35, bg: 0.25 }, // Full budget (2 ministries, both directions)
  6:  { fc: 0.45, sc: 0.40, bg: 0.15 }, // Partial (Civil Liberties, one direction)
  7:  { fc: 0.45, sc: 0.40, bg: 0.15 }, // Partial (Cultural Heritage, one direction)
  8:  { fc: 0.45, sc: 0.40, bg: 0.15 }, // Partial (Cultural Heritage, one direction)
  9:  { fc: 0.55, sc: 0.45, bg: 0.00 }, // No budget mapping
  10: { fc: 0.45, sc: 0.40, bg: 0.15 }, // Partial (Foreign Affairs, one direction)
  11: { fc: 0.45, sc: 0.40, bg: 0.15 }, // Partial (Defense, one direction)
  12: { fc: 0.40, sc: 0.35, bg: 0.25 }, // Full budget (2 ministries + Education partial)
};

// Tension thresholds (Stage 4)
export const TENSION_THRESHOLDS = {
  mild: 0.51,
  moderate: 1.01,
  strong: 1.51,
} as const;

// Stated preference weights (FC and SC renormalized without budget)
export const STATED_FC_WEIGHT = 0.53; // 0.40/0.75
export const STATED_SC_WEIGHT = 0.47; // 0.35/0.75

// Super-dimension weights (Stage 5)
export const SD_ECONOMIC_WEIGHTS: Record<number, number> = {
  1: 0.65,
  2: 0.35,
};

export const SD_CULTURAL_WEIGHTS: Record<number, number> = {
  7: 0.30,
  8: 0.20,
  9: 0.20,
  5: 0.15,
  4: 0.15,
};

// Archetype matching constants (Stage 6)
export const MAX_ARCHETYPE_DISTANCE = Math.sqrt(48); // sqrt(12 * 2^2)
export const BLENDED_THRESHOLD_PCT = 10; // top 2 within 10% distance
export const LOW_MATCH_THRESHOLD_PCT = 55; // below this = unusual profile
export const DISTINCTIVE_MATCH_CEILING = 72; // below this match % AND...
export const DISTINCTIVE_STDDEV_FLOOR = 0.4; // ...above this std dev = distinctive profile

// Confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  high: 0.40,     // spread 0.00-0.40
  moderate: 0.80, // spread 0.41-0.80
  low: 1.20,      // spread 0.81-1.20
  // above 1.20 = conflicted
} as const;
