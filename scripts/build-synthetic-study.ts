/**
 * build-synthetic-study.ts
 *
 * One-pass preprocessing pipeline for the Synthetic Study section. Reads all
 * source data from data/synthetic_study/, runs integrity checks, normalizes
 * country names, computes derived aggregates, and writes static JSON to
 * public/study/derived/ and public/data/. Fails the build on any integrity
 * violation or normalization failure.
 */

import fs from "fs";
import path from "path";
import { parse as parseCsv } from "csv-parse/sync";
import { normalizeLocation } from "./data/country-name-normalization";
import {
  getRegionForIso3,
  verifyCountryRegionMapping,
} from "./data/country-region-mapping";
import {
  computeEuclideanDistance,
  computeHistogram,
  computeCorrelationMatrix,
  bucketMatchStrength,
  computeMedian,
  computePercentile,
} from "./lib/stats";
import type {
  PersonaRecord,
  ScoredProfile,
  ScoredProfilesFile,
  RegionalAggregate,
  CountryAggregate,
  DemographicAggregate,
  ModelAgreementByAttribute,
  AxisHistogram,
  AxisCorrelationMatrix,
  ClusterArchetypeEntry,
  RegionKey,
} from "../src/lib/study/types";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const DATA_DIR = path.resolve(__dirname, "../data/synthetic_study");
const DERIVED_DIR = path.resolve(__dirname, "../public/study/derived");
const PUBLIC_DATA_DIR = path.resolve(__dirname, "../public/data");

function src(name: string) {
  return path.join(DATA_DIR, name);
}
function out(name: string) {
  return path.join(DERIVED_DIR, name);
}

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

// ---------------------------------------------------------------------------
// Archetype emergence lookup (from archetypes.ts at build time via source text)
// ---------------------------------------------------------------------------

type EmergenceTag = "refined" | "empirical" | "theoretical";

const ARCHETYPE_EMERGENCE: Record<string, EmergenceTag> = {
  "radical-egalitarian": "refined",
  "popular-egalitarian": "empirical",
  "social-democrat": "theoretical",
  "green-communalist": "theoretical",
  "communitarian-steward": "refined",
  "institutional-moderate": "refined",
  "cosmopolitan-technologist": "theoretical",
  "free-marketeer": "theoretical",
  "libertarian-individualist": "theoretical",
  "developmental-modernizer": "refined",
  "nationalist-populist": "refined",
  "authoritarian-traditionalist": "theoretical",
};

const ARCHETYPE_NAMES: Record<string, string> = {
  "radical-egalitarian": "The Radical Egalitarian",
  "popular-egalitarian": "The Popular Egalitarian",
  "social-democrat": "The Social Democrat",
  "green-communalist": "The Green Communalist",
  "communitarian-steward": "The Communitarian Steward",
  "institutional-moderate": "The Institutional Moderate",
  "cosmopolitan-technologist": "The Cosmopolitan Technologist",
  "free-marketeer": "The Free Marketeer",
  "libertarian-individualist": "The Libertarian Individualist",
  "developmental-modernizer": "The Developmental Modernizer",
  "nationalist-populist": "The Nationalist Populist",
  "authoritarian-traditionalist": "The Authoritarian Traditionalist",
};

// Axis metadata for the public download
const AXES_META = [
  { id: 1, name: "Economic Model", low_label: "Collective Provision", high_label: "Market Allocation" },
  { id: 2, name: "Environmental Policy", low_label: "Ecological Limits", high_label: "Growth Imperative" },
  { id: 3, name: "Governance Structure", low_label: "Distributed Governance", high_label: "Centralized Governance" },
  { id: 4, name: "Decision Authority", low_label: "Democratic Participation", high_label: "Institutional Authority" },
  { id: 5, name: "Rights Balance", low_label: "Liberty", high_label: "Security" },
  { id: 6, name: "Legitimacy Basis", low_label: "Rationalist Legitimacy", high_label: "Traditional Legitimacy" },
  { id: 7, name: "Social Change", low_label: "Progressive Change", high_label: "Established Order" },
  { id: 8, name: "Cultural Diversity", low_label: "Pluralism", high_label: "Cohesion" },
  { id: 9, name: "Human Nature", low_label: "Constructivism", high_label: "Essentialism" },
  { id: 10, name: "International Engagement", low_label: "Sovereignty", high_label: "Internationalism" },
  { id: 11, name: "Military Policy", low_label: "Non-Interventionism", high_label: "Active Defense" },
  { id: 12, name: "Technology Governance", low_label: "Precautionary", high_label: "Accelerationist" },
];

const AXIS_KEYS = [
  "1_economic_model",
  "2_environmental_policy",
  "3_governance_structure",
  "4_decision_authority",
  "5_rights_balance",
  "6_legitimacy_basis",
  "7_social_change",
  "8_cultural_diversity",
  "9_human_nature",
  "10_international_engagement",
  "11_military_policy",
  "12_technology_governance",
] as const;

// ---------------------------------------------------------------------------
// CSV row type
// ---------------------------------------------------------------------------

type ClusterLabelRow = {
  persona_id: string;
  axis_1: string;
  axis_2: string;
  axis_3: string;
  axis_4: string;
  axis_5: string;
  axis_6: string;
  axis_7: string;
  axis_8: string;
  axis_9: string;
  axis_10: string;
  axis_11: string;
  axis_12: string;
  n_models: string;
  cluster: string;
  region: string;
  urban_rural: string;
  age: string;
  gender: string;
  education: string;
  economic_position: string;
  governance_experience: string;
  religious_tradition: string;
  occupation: string;
  location: string;
  name: string;
};

function axisVecFromRow(row: ClusterLabelRow): number[] {
  return [
    parseFloat(row.axis_1),
    parseFloat(row.axis_2),
    parseFloat(row.axis_3),
    parseFloat(row.axis_4),
    parseFloat(row.axis_5),
    parseFloat(row.axis_6),
    parseFloat(row.axis_7),
    parseFloat(row.axis_8),
    parseFloat(row.axis_9),
    parseFloat(row.axis_10),
    parseFloat(row.axis_11),
    parseFloat(row.axis_12),
  ];
}

function axisVecFromProfile(profile: ScoredProfile): number[] {
  return AXIS_KEYS.map((k) => profile.axis_scores[k]);
}

// ---------------------------------------------------------------------------
// Helper: top-N by count
// ---------------------------------------------------------------------------

function topN<T extends { count: number }>(arr: T[], n: number): T[] {
  return [...arr].sort((a, b) => b.count - a.count).slice(0, n);
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

function main() {
  // --------------------------------------------------------------------------
  // 1. Load source files
  // --------------------------------------------------------------------------
  console.log("Loading source files...");

  const personasFile = JSON.parse(
    fs.readFileSync(src("personas.json"), "utf8")
  ) as { total: number; personas: PersonaRecord[] };
  const personas: PersonaRecord[] = personasFile.personas;

  const scoredFile = JSON.parse(
    fs.readFileSync(src("scored_profiles.json"), "utf8")
  ) as ScoredProfilesFile;
  const profiles: ScoredProfile[] = scoredFile.profiles;

  const clusterCsv = fs.readFileSync(src("cluster_labels.csv"), "utf8");
  const clusterRows = parseCsv(clusterCsv, {
    columns: true,
    skip_empty_lines: true,
  }) as ClusterLabelRow[];

  const archetypeComparison = JSON.parse(
    fs.readFileSync(src("archetype_comparison.json"), "utf8")
  ) as { cluster_to_archetype: ClusterArchetypeEntry[] };

  const claudeResponsesFile = JSON.parse(
    fs.readFileSync(src("claude_responses.json"), "utf8")
  ) as { responses: Array<{ persona_id: string; fc_responses: unknown[]; sc_responses: unknown[]; budget: unknown }> };

  const geminiResponsesFile = JSON.parse(
    fs.readFileSync(src("gemini_responses.json"), "utf8")
  ) as { responses: Array<{ persona_id: string; fc_responses: unknown[]; sc_responses: unknown[]; budget: unknown }> };

  // --------------------------------------------------------------------------
  // 2. Integrity checks — counts
  // --------------------------------------------------------------------------
  console.log("Running integrity checks...");
  const errors: string[] = [];

  if (personas.length !== 1002) {
    errors.push(`personas.json count: expected 1002, got ${personas.length}`);
  }

  const claudeProfiles = profiles.filter((p) => p.model === "claude");
  const geminiProfiles = profiles.filter((p) => p.model === "gemini");
  if (claudeProfiles.length + geminiProfiles.length !== 1152) {
    errors.push(
      `scored_profiles count: expected 1152, got ${profiles.length} (claude: ${claudeProfiles.length}, gemini: ${geminiProfiles.length})`
    );
  }

  const claudeIds = new Set(claudeProfiles.map((p) => p.persona_id));
  const geminiIds = new Set(geminiProfiles.map((p) => p.persona_id));
  const sharedIds = new Set([...claudeIds].filter((id) => geminiIds.has(id)));
  if (sharedIds.size !== 150) {
    errors.push(`shared persona count: expected 150, got ${sharedIds.size}`);
  }

  // Axis bounds
  let axisViolations = 0;
  for (const row of clusterRows) {
    const vec = axisVecFromRow(row);
    for (const v of vec) {
      if (v < -1.0 - 1e-9 || v > 1.0 + 1e-9) {
        axisViolations++;
      }
    }
  }
  if (axisViolations > 0) {
    errors.push(`axis bounds violations in cluster_labels: ${axisViolations}`);
  }

  for (const p of profiles) {
    for (const k of AXIS_KEYS) {
      const v = p.axis_scores[k];
      if (v < -1.0 - 1e-9 || v > 1.0 + 1e-9) {
        errors.push(`axis ${k} out of bounds for ${p.persona_id} (${p.model}): ${v}`);
      }
    }
  }

  // Cluster assignments 0..5
  for (const row of clusterRows) {
    const c = parseInt(row.cluster, 10);
    if (isNaN(c) || c < 0 || c > 5) {
      errors.push(`invalid cluster for ${row.persona_id}: "${row.cluster}"`);
    }
  }

  // Archetype mapping completeness — every cluster 0..5 must have a nearest
  const clusterToArchetype = new Map<number, ClusterArchetypeEntry>();
  for (const entry of archetypeComparison.cluster_to_archetype) {
    clusterToArchetype.set(entry.cluster, entry);
  }
  for (let c = 0; c < 6; c++) {
    if (!clusterToArchetype.has(c)) {
      errors.push(`cluster ${c} has no archetype mapping`);
    }
  }

  if (errors.length > 0) {
    console.error("\n[INTEGRITY FAIL]");
    for (const e of errors) console.error("  " + e);
    process.exit(1);
  }

  // --------------------------------------------------------------------------
  // 3. Country normalization
  // --------------------------------------------------------------------------
  console.log("Normalizing country names...");

  // Verify region mapping (warn, don't fail)
  const verifyResult = verifyCountryRegionMapping(personas);
  if (verifyResult.warnings.length > 0) {
    console.warn(
      `[country-region] ${verifyResult.warnings.length} region conflict(s) found — trusting authored region.`
    );
  }

  const personaIsoMap = new Map<string, string>(); // persona_id -> iso3
  const personaCountryNameMap = new Map<string, string>(); // persona_id -> canonical country name
  const normFailures: string[] = [];

  for (const persona of personas) {
    const norm = normalizeLocation(persona.location);
    if (!norm) {
      normFailures.push(`  ${persona.id}: "${persona.location}"`);
    } else {
      personaIsoMap.set(persona.id, norm.iso3);
      personaCountryNameMap.set(persona.id, norm.name);
    }
  }

  if (normFailures.length > 0) {
    console.error("[BUILD FAIL] Country normalization failed for:");
    for (const f of normFailures) console.error(f);
    process.exit(1);
  }

  // Build a quick lookup: persona_id -> cluster row
  const clusterRowById = new Map<string, ClusterLabelRow>();
  for (const row of clusterRows) {
    clusterRowById.set(row.persona_id, row);
  }

  // Build persona lookup
  const personaById = new Map<string, PersonaRecord>();
  for (const p of personas) {
    personaById.set(p.id, p);
  }

  // --------------------------------------------------------------------------
  // 4. Build personas_slim.json
  // --------------------------------------------------------------------------
  console.log("Building personas_slim.json...");

  const personasSlim = personas.map((persona) => {
    const row = clusterRowById.get(persona.id)!;
    const cluster = parseInt(row.cluster, 10);
    const entry = clusterToArchetype.get(cluster)!;
    return {
      id: persona.id,
      name: persona.name,
      region: persona.region,
      country_iso: personaIsoMap.get(persona.id)!,
      location: persona.location,
      age: persona.age,
      gender: persona.gender,
      education: persona.education,
      urban_rural: persona.urban_rural,
      economic_position: persona.economic_position,
      governance_experience: persona.governance_experience,
      cluster,
      n_models: parseInt(row.n_models, 10),
      averaged_axis_scores: axisVecFromRow(row),
      nearest_archetype_id: entry.nearest_archetype.id,
    };
  });

  writeJson(out("personas_slim.json"), personasSlim);

  // --------------------------------------------------------------------------
  // 5. Regional aggregates
  // --------------------------------------------------------------------------
  console.log("Computing regional aggregates...");

  type RegionAccum = {
    count: number;
    archetype_counts: Map<string, number>;
    cluster_counts: Map<number, number>;
    axis_sums: number[];
  };

  const regionAccum = new Map<string, RegionAccum>();

  for (const slim of personasSlim) {
    const key = slim.region;
    if (!regionAccum.has(key)) {
      regionAccum.set(key, {
        count: 0,
        archetype_counts: new Map(),
        cluster_counts: new Map(),
        axis_sums: new Array(12).fill(0),
      });
    }
    const acc = regionAccum.get(key)!;
    acc.count++;
    acc.archetype_counts.set(
      slim.nearest_archetype_id,
      (acc.archetype_counts.get(slim.nearest_archetype_id) ?? 0) + 1
    );
    acc.cluster_counts.set(slim.cluster, (acc.cluster_counts.get(slim.cluster) ?? 0) + 1);
    for (let i = 0; i < 12; i++) {
      acc.axis_sums[i] += slim.averaged_axis_scores[i];
    }
  }

  const regionalAggregates: RegionalAggregate[] = [];
  for (const [region, acc] of regionAccum) {
    const top_archetypes = topN(
      [...acc.archetype_counts.entries()].map(([id, count]) => ({
        id,
        name: ARCHETYPE_NAMES[id] ?? id,
        count,
      })),
      3
    );

    let dominantCluster = 0;
    let dominantCount = 0;
    for (const [c, cnt] of acc.cluster_counts) {
      if (cnt > dominantCount) {
        dominantCount = cnt;
        dominantCluster = c;
      }
    }

    const cluster_distribution: Record<string, number> = {};
    for (let c = 0; c < 6; c++) {
      cluster_distribution[String(c)] = (acc.cluster_counts.get(c) ?? 0) / acc.count;
    }

    regionalAggregates.push({
      region: region as RegionKey,
      count: acc.count,
      top_archetypes,
      dominant_cluster: dominantCluster,
      dominant_cluster_share: dominantCount / acc.count,
      mean_axis_scores: acc.axis_sums.map((s) => s / acc.count),
      cluster_distribution,
    });
  }

  writeJson(out("regional_aggregates.json"), regionalAggregates);

  // --------------------------------------------------------------------------
  // 6. Country aggregates (n >= 10)
  // --------------------------------------------------------------------------
  console.log("Computing country aggregates...");

  type CountryAccum = {
    country_iso: string;
    country_name: string;
    region: RegionKey;
    count: number;
    archetype_counts: Map<string, number>;
  };

  const countryAccum = new Map<string, CountryAccum>();

  for (const slim of personasSlim) {
    const iso = slim.country_iso;
    if (!countryAccum.has(iso)) {
      countryAccum.set(iso, {
        country_iso: iso,
        country_name: personaCountryNameMap.get(slim.id) ?? iso,
        region: slim.region,
        count: 0,
        archetype_counts: new Map(),
      });
    }
    const acc = countryAccum.get(iso)!;
    acc.count++;
    acc.archetype_counts.set(
      slim.nearest_archetype_id,
      (acc.archetype_counts.get(slim.nearest_archetype_id) ?? 0) + 1
    );
  }

  const countryAggregates: CountryAggregate[] = [];
  for (const acc of countryAccum.values()) {
    if (acc.count < 10) continue;
    countryAggregates.push({
      country_iso: acc.country_iso,
      country_name: acc.country_name,
      region: acc.region,
      count: acc.count,
      top_archetypes: topN(
        [...acc.archetype_counts.entries()].map(([id, count]) => ({
          id,
          name: ARCHETYPE_NAMES[id] ?? id,
          count,
        })),
        3
      ),
    });
  }

  writeJson(out("country_aggregates.json"), countryAggregates);

  // --------------------------------------------------------------------------
  // 7. Demographic aggregates
  // --------------------------------------------------------------------------
  console.log("Computing demographic aggregates...");

  function buildDemographicAgg(
    attribute: string,
    getValue: (slim: (typeof personasSlim)[0]) => string
  ) {
    const catAccum = new Map<string, { count: number; clusters: Map<number, number> }>();
    for (const slim of personasSlim) {
      const cat = getValue(slim);
      if (!catAccum.has(cat)) {
        catAccum.set(cat, { count: 0, clusters: new Map() });
      }
      const acc = catAccum.get(cat)!;
      acc.count++;
      acc.clusters.set(slim.cluster, (acc.clusters.get(slim.cluster) ?? 0) + 1);
    }
    return [...catAccum.entries()].map(([category, acc]) => {
      const cluster_distribution: Record<string, number> = {};
      for (let c = 0; c < 6; c++) {
        cluster_distribution[String(c)] = (acc.clusters.get(c) ?? 0) / acc.count;
      }
      return { attribute, category, count: acc.count, cluster_distribution };
    });
  }

  const demographicAggregates: DemographicAggregate = {
    urban_rural: buildDemographicAgg("urban_rural", (s) => s.urban_rural),
    economic_position: buildDemographicAgg("economic_position", (s) => s.economic_position),
    governance_experience: buildDemographicAgg("governance_experience", (s) => s.governance_experience),
    education: buildDemographicAgg("education", (s) => s.education),
  };

  writeJson(out("demographic_aggregates.json"), demographicAggregates);

  // --------------------------------------------------------------------------
  // 8. Model-agreement-by-attribute (from 150 shared personas)
  // --------------------------------------------------------------------------
  console.log("Computing model agreement by attribute...");

  const claudeById = new Map<string, ScoredProfile>();
  const geminiById = new Map<string, ScoredProfile>();
  for (const p of claudeProfiles) claudeById.set(p.persona_id, p);
  for (const p of geminiProfiles) geminiById.set(p.persona_id, p);

  // Compute distances for shared personas
  const sharedDistances = new Map<string, number>();
  for (const id of sharedIds) {
    const cv = axisVecFromProfile(claudeById.get(id)!);
    const gv = axisVecFromProfile(geminiById.get(id)!);
    sharedDistances.set(id, computeEuclideanDistance(cv, gv));
  }

  // For each shared slim, build the distance + attributes
  const sharedSlims = personasSlim.filter((s) => sharedIds.has(s.id));

  function buildModelAgreementForAttribute(
    attribute: string,
    getValue: (s: (typeof sharedSlims)[0]) => string
  ): ModelAgreementByAttribute[] {
    const catAccum = new Map<string, number[]>();
    for (const slim of sharedSlims) {
      const cat = getValue(slim);
      if (!catAccum.has(cat)) catAccum.set(cat, []);
      catAccum.get(cat)!.push(sharedDistances.get(slim.id)!);
    }
    return [...catAccum.entries()].map(([category, dists]) => ({
      attribute,
      category,
      n: dists.length,
      mean_distance: dists.reduce((a, b) => a + b, 0) / dists.length,
    }));
  }

  const modelAgreementByAttribute: ModelAgreementByAttribute[] = [
    ...buildModelAgreementForAttribute("region", (s) => s.region),
    ...buildModelAgreementForAttribute("urban_rural", (s) => s.urban_rural),
    ...buildModelAgreementForAttribute("economic_position", (s) => s.economic_position),
    ...buildModelAgreementForAttribute("governance_experience", (s) => s.governance_experience),
    ...buildModelAgreementForAttribute("education", (s) => s.education),
    ...buildModelAgreementForAttribute("gender", (s) => s.gender),
  ];

  writeJson(out("model_agreement_by_attribute.json"), modelAgreementByAttribute);

  // --------------------------------------------------------------------------
  // 9. Axis correlation matrix
  // --------------------------------------------------------------------------
  console.log("Computing axis correlation matrix...");

  const allAxisVecs = personasSlim.map((s) => s.averaged_axis_scores);
  const matrix = computeCorrelationMatrix(allAxisVecs);

  const axisCorrelations: AxisCorrelationMatrix = {
    axes: AXIS_KEYS as unknown as string[],
    matrix,
  };

  writeJson(out("axis_correlations.json"), axisCorrelations);

  // --------------------------------------------------------------------------
  // 10. Axis histograms
  // --------------------------------------------------------------------------
  console.log("Computing axis histograms...");

  const axisHistograms: AxisHistogram[] = AXIS_KEYS.map((key, idx) => {
    const values = personasSlim.map((s) => s.averaged_axis_scores[idx]);
    const counts = computeHistogram(values, -1.0, 1.0, 20);
    const binWidth = 2.0 / 20;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return {
      axis: idx + 1,
      bins: counts.map((count, i) => ({
        min: -1.0 + i * binWidth,
        max: -1.0 + (i + 1) * binWidth,
        count,
      })),
      mean,
    };
  });

  writeJson(out("axis_histograms.json"), axisHistograms);

  // --------------------------------------------------------------------------
  // 11. Distance distribution (for Model Agreement Section 1)
  // --------------------------------------------------------------------------
  console.log("Computing distance distribution...");

  const distances = [...sharedIds].map((id) => sharedDistances.get(id)!);
  const sortedDists = [...distances].sort((a, b) => a - b);
  const distMean = distances.reduce((a, b) => a + b, 0) / distances.length;
  const distMedian = computeMedian(sortedDists);
  const distP90 = computePercentile(sortedDists, 90);
  const distMax = sortedDists[sortedDists.length - 1];

  writeJson(out("distance_distribution.json"), {
    distances: sortedDists,
    mean: distMean,
    median: distMedian,
    p90: distP90,
    max: distMax,
    nShared: sharedIds.size,
  });

  // --------------------------------------------------------------------------
  // 12. Case study personas (4 archetypes for Model Agreement Section 4)
  // --------------------------------------------------------------------------
  console.log("Selecting case study personas...");

  const sharedWithDist = [...sharedIds].map((id) => ({
    id,
    dist: sharedDistances.get(id)!,
    claudeVec: axisVecFromProfile(claudeById.get(id)!),
    geminiVec: axisVecFromProfile(geminiById.get(id)!),
  }));

  // high_agreement: distance closest to 0.5
  const highAgreement = sharedWithDist.reduce((best, cur) =>
    Math.abs(cur.dist - 0.5) < Math.abs(best.dist - 0.5) ? cur : best
  );

  // typical: distance closest to median
  const typical = sharedWithDist.reduce((best, cur) =>
    Math.abs(cur.dist - distMedian) < Math.abs(best.dist - distMedian) ? cur : best
  );

  // high_disagreement: largest distance
  const highDisagreement = sharedWithDist.reduce((best, cur) => (cur.dist > best.dist ? cur : best));

  // directional_drift: among personas within ±0.4 of median, maximize
  //   (gemini axis6 - claude axis6) + (gemini axis7 - claude axis7) + (gemini axis10 - claude axis10)
  // AXIS_KEYS indices: 6→idx5, 7→idx6, 10→idx9
  const idx6 = 5; // "6_legitimacy_basis"
  const idx7 = 6; // "7_social_change"
  const idx10 = 9; // "10_international_engagement"

  const driftCandidates = sharedWithDist.filter(
    (s) => Math.abs(s.dist - distMedian) <= 0.4
  );
  const directionalDrift = driftCandidates.reduce((best, cur) => {
    const curScore =
      (cur.geminiVec[idx6] - cur.claudeVec[idx6]) +
      (cur.geminiVec[idx7] - cur.claudeVec[idx7]) +
      (cur.geminiVec[idx10] - cur.claudeVec[idx10]);
    const bestScore =
      (best.geminiVec[idx6] - best.claudeVec[idx6]) +
      (best.geminiVec[idx7] - best.claudeVec[idx7]) +
      (best.geminiVec[idx10] - best.claudeVec[idx10]);
    return curScore > bestScore ? cur : best;
  }, driftCandidates[0]);

  function caseStudyEntry(kind: string, item: typeof highAgreement) {
    const perAxisDiff = item.geminiVec.map((g, i) => g - item.claudeVec[i]);
    return {
      kind,
      persona_id: item.id,
      distance: item.dist,
      per_axis_diff: perAxisDiff,
    };
  }

  const caseStudyPersonas = [
    caseStudyEntry("high_agreement", highAgreement),
    caseStudyEntry("typical", typical),
    caseStudyEntry("high_disagreement", highDisagreement),
    caseStudyEntry("directional_drift", directionalDrift),
  ];

  writeJson(out("case_study_personas.json"), caseStudyPersonas);

  console.log("Case study selections:");
  for (const cs of caseStudyPersonas) {
    console.log(`  ${cs.kind}: ${cs.persona_id} (dist=${cs.distance.toFixed(4)})`);
  }

  // --------------------------------------------------------------------------
  // 13. Public download JSON (§5)
  // --------------------------------------------------------------------------
  console.log("Assembling public download JSON...");

  const claudeResponsesById = new Map(
    claudeResponsesFile.responses.map((r) => [r.persona_id, r])
  );
  const geminiResponsesById = new Map(
    geminiResponsesFile.responses.map((r) => [r.persona_id, r])
  );

  const slimById = new Map(personasSlim.map((s) => [s.id, s]));

  const publicPersonas = personas.map((persona) => {
    const slim = slimById.get(persona.id)!;
    const clusterEntry = clusterToArchetype.get(slim.cluster)!;
    const archetypeId = clusterEntry.nearest_archetype.id;
    const archetypeDistance = clusterEntry.nearest_archetype.distance;

    const administrations: unknown[] = [];

    const claudeProfile = claudeById.get(persona.id);
    if (claudeProfile) {
      const responses = claudeResponsesById.get(persona.id);
      administrations.push({
        model: "claude",
        axis_scores: claudeProfile.axis_scores,
        modality_scores: claudeProfile.modality_scores,
        tensions: claudeProfile.tensions,
        confidence: claudeProfile.confidence,
        super_dimensions: claudeProfile.super_dimensions,
        raw_responses: responses
          ? {
              fc: responses.fc_responses,
              sc: responses.sc_responses,
              budget: responses.budget,
            }
          : null,
      });
    }

    const geminiProfile = geminiById.get(persona.id);
    if (geminiProfile) {
      const responses = geminiResponsesById.get(persona.id);
      administrations.push({
        model: "gemini",
        axis_scores: geminiProfile.axis_scores,
        modality_scores: geminiProfile.modality_scores,
        tensions: geminiProfile.tensions,
        confidence: geminiProfile.confidence,
        super_dimensions: geminiProfile.super_dimensions,
        raw_responses: responses
          ? {
              fc: responses.fc_responses,
              sc: responses.sc_responses,
              budget: responses.budget,
            }
          : null,
      });
    }

    return {
      id: persona.id,
      name: persona.name,
      demographics: {
        age: persona.age,
        gender: persona.gender,
        location: persona.location,
        urban_rural: persona.urban_rural,
        occupation: persona.occupation,
        education: persona.education,
        family: persona.family,
        economic_position: persona.economic_position,
        economic_detail: persona.economic_detail,
        religious_tradition: persona.religious_tradition,
        governance_experience: persona.governance_experience,
        governance_detail: persona.governance_detail,
      },
      country_iso: slim.country_iso,
      region: persona.region,
      biographical_narrative: persona.life_narrative,
      key_tensions: persona.key_tensions,
      cluster: slim.cluster,
      nearest_archetype: {
        id: archetypeId,
        name: ARCHETYPE_NAMES[archetypeId] ?? archetypeId,
        emergence: ARCHETYPE_EMERGENCE[archetypeId] ?? "theoretical",
        distance: archetypeDistance,
        match_strength: bucketMatchStrength(archetypeDistance),
      },
      averaged_axis_scores: slim.averaged_axis_scores,
      administrations,
    };
  });

  const downloadJson = {
    metadata: {
      version: "1.0",
      generated_at: new Date().toISOString(),
      n_personas: 1002,
      n_administrations: 1152,
      n_shared: 150,
      k_clusters: 6,
      n_archetypes: 12,
      persona_generator: "gemini-2.5-flash",
      administering_models: ["claude-sonnet-4.6", "gemini-2.5-flash"],
      regions: [
        "western_europe",
        "eastern_europe_central_asia",
        "north_america",
        "latin_america",
        "east_asia",
        "south_southeast_asia",
        "middle_east_north_africa",
        "sub_saharan_africa",
        "oceania_small_states",
        "diaspora_transnational",
      ],
      axes: AXES_META,
    },
    personas: publicPersonas,
  };

  const downloadPath = path.join(PUBLIC_DATA_DIR, "synthetic_study_v1.json");
  writeJson(downloadPath, downloadJson);
  const fileSizeBytes = fs.statSync(downloadPath).size;
  console.log(`Public download written: ${(fileSizeBytes / 1024 / 1024).toFixed(2)} MB`);

  // --------------------------------------------------------------------------
  // 14. download_meta.json
  // --------------------------------------------------------------------------
  writeJson(out("download_meta.json"), {
    fileSizeBytes,
    version: "1.0",
    path: "/data/synthetic_study_v1.json",
  });

  // --------------------------------------------------------------------------
  // 15. Final integrity re-check on output
  // --------------------------------------------------------------------------
  console.log("Verifying output integrity...");

  if (personasSlim.length !== 1002) {
    console.error(`[INTEGRITY FAIL] personas_slim has ${personasSlim.length} entries`);
    process.exit(1);
  }

  const nullIsos = personasSlim.filter((s) => !s.country_iso);
  if (nullIsos.length > 0) {
    console.error(`[INTEGRITY FAIL] ${nullIsos.length} personas_slim entries have null country_iso`);
    process.exit(1);
  }

  const outOfBoundsAxis = personasSlim.filter((s) =>
    s.averaged_axis_scores.some((v) => v < -1.0 - 1e-9 || v > 1.0 + 1e-9)
  );
  if (outOfBoundsAxis.length > 0) {
    console.error(`[INTEGRITY FAIL] ${outOfBoundsAxis.length} personas have out-of-bounds averaged axis scores`);
    process.exit(1);
  }

  const invalidClusters = personasSlim.filter((s) => s.cluster < 0 || s.cluster > 5);
  if (invalidClusters.length > 0) {
    console.error(`[INTEGRITY FAIL] ${invalidClusters.length} personas have invalid cluster`);
    process.exit(1);
  }

  const missingArchetypes = personasSlim.filter((s) => !s.nearest_archetype_id);
  if (missingArchetypes.length > 0) {
    console.error(`[INTEGRITY FAIL] ${missingArchetypes.length} personas have missing nearest_archetype_id`);
    process.exit(1);
  }

  // Verify shared count from n_models
  const sharedFromSlim = personasSlim.filter((s) => s.n_models === 2);
  if (sharedFromSlim.length !== 150) {
    console.error(`[INTEGRITY FAIL] n_models==2 count: expected 150, got ${sharedFromSlim.length}`);
    process.exit(1);
  }

  // --------------------------------------------------------------------------
  // Done
  // --------------------------------------------------------------------------
  console.log("\n============================================================");
  console.log("  BUILD SUCCESS — Synthetic Study preprocessing complete");
  console.log("============================================================");
  console.log(`  Personas:          ${personasSlim.length}`);
  console.log(`  Administrations:   ${profiles.length} (claude: ${claudeProfiles.length}, gemini: ${geminiProfiles.length})`);
  console.log(`  Shared personas:   ${sharedIds.size}`);
  console.log(`  Countries (n≥10):  ${countryAggregates.length}`);
  console.log(`  Regions:           ${regionalAggregates.length}`);
  console.log(`  Distance mean:     ${distMean.toFixed(4)}, median: ${distMedian.toFixed(4)}, p90: ${distP90.toFixed(4)}, max: ${distMax.toFixed(4)}`);
  console.log(`  Download size:     ${(fileSizeBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Region conflicts:  ${verifyResult.warnings.length}`);
  console.log("============================================================\n");
}

main();
