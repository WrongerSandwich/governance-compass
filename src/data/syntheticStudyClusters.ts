import type { ClusterId } from "@/lib/study/types";
import type { ArchetypeEmergence } from "@/data/archetypes";

export interface SyntheticStudyCluster {
  id: ClusterId;
  code: "C0" | "C1" | "C2" | "C3" | "C4" | "C5";
  label: string;
  size: number;
  share: number;
  colorVar: string;
  topAxes: string[];
  nearestArchetypeId: string;
  nearestArchetypeName: string;
  nearestArchetypeEmergence: ArchetypeEmergence;
  matchDistance: number;
}

// Values sourced from:
//   data/synthetic_study/cluster_narratives.json — size, share, topAxes
//   docs/system_proposal/synthetic_study_spec/patterns_page.md — label, nearestArchetype*
//   src/data/archetypes.ts — emergence tags
//   matchDistance — Euclidean distance from cluster centroid (cluster_centroids.json)
//     to the matched archetype's prototype (archetypes.ts).
//     C0 (institutional-moderate): 0.0585 (post-revision; old pre-revision was 1.1262)
//     C1 (popular-egalitarian): 0.0514 (post-revision; old pre-revision was 1.3933)
//     C2–C5: unchanged from pipeline output (archetypes were not reassigned)

export const CLUSTERS: readonly SyntheticStudyCluster[] = [
  {
    id: 0,
    code: "C0",
    label: "Toward institutional authority and growth",
    size: 161,
    share: 0.1607,
    colorVar: "--cluster-0",
    topAxes: [
      "axis 4 (Decision Authority): +0.57 — toward Institutional Authority",
      "axis 2 (Environmental Policy): +0.53 — toward Growth Imperative",
      "axis 7 (Social Change): -0.50 — toward Progressive Change",
      "axis 3 (Governance Structure): +0.43 — toward Centralized Governance",
    ],
    nearestArchetypeId: "institutional-moderate",
    nearestArchetypeName: "The Institutional Moderate",
    nearestArchetypeEmergence: "refined",
    matchDistance: 0.0585,
  },
  {
    id: 1,
    code: "C1",
    label: "Toward non-interventionism and collective provision",
    size: 178,
    share: 0.1776,
    colorVar: "--cluster-1",
    topAxes: [
      "axis 11 (Military Policy): -0.70 — toward Non-Interventionism",
      "axis 1 (Economic Model): -0.68 — toward Collective Provision",
      "axis 5 (Rights Balance): -0.55 — toward Liberty",
      "axis 9 (Human Nature): -0.49 — toward Constructivism",
    ],
    nearestArchetypeId: "popular-egalitarian",
    nearestArchetypeName: "The Popular Egalitarian",
    nearestArchetypeEmergence: "empirical",
    matchDistance: 0.0514,
  },
  {
    id: 2,
    code: "C2",
    label: "Toward sovereignty, tradition, and cohesion",
    size: 210,
    share: 0.2096,
    colorVar: "--cluster-2",
    topAxes: [
      "axis 10 (International Engagement): +0.69 — toward Sovereignty",
      "axis 9 (Human Nature): +0.62 — toward Essentialism",
      "axis 7 (Social Change): +0.60 — toward Continuity and Tradition",
      "axis 8 (Cultural Diversity): +0.57 — toward Cohesion",
    ],
    nearestArchetypeId: "nationalist-populist",
    nearestArchetypeName: "The Nationalist Populist",
    nearestArchetypeEmergence: "refined",
    matchDistance: 1.4159,
  },
  {
    id: 3,
    code: "C3",
    label: "Toward distributed governance and popular sovereignty",
    size: 116,
    share: 0.1158,
    colorVar: "--cluster-3",
    topAxes: [
      "axis 3 (Governance Structure): -0.80 — toward Distributed Governance",
      "axis 11 (Military Policy): -0.76 — toward Non-Interventionism",
      "axis 7 (Social Change): +0.73 — toward Continuity and Tradition",
      "axis 4 (Decision Authority): -0.70 — toward Popular Sovereignty",
    ],
    nearestArchetypeId: "communitarian-steward",
    nearestArchetypeName: "The Communitarian Steward",
    nearestArchetypeEmergence: "refined",
    matchDistance: 1.089,
  },
  {
    id: 4,
    code: "C4",
    label: "Toward collective provision, liberty, and constructivism",
    size: 196,
    share: 0.1956,
    colorVar: "--cluster-4",
    topAxes: [
      "axis 1 (Economic Model): -0.77 — toward Collective Provision",
      "axis 5 (Rights Balance): -0.75 — toward Liberty",
      "axis 9 (Human Nature): -0.72 — toward Constructivism",
      "axis 11 (Military Policy): -0.68 — toward Non-Interventionism",
    ],
    nearestArchetypeId: "radical-egalitarian",
    nearestArchetypeName: "The Radical Egalitarian",
    nearestArchetypeEmergence: "empirical",
    matchDistance: 0.7841,
  },
  {
    id: 5,
    code: "C5",
    label: "Toward centralized governance, security, and growth",
    size: 141,
    share: 0.1407,
    colorVar: "--cluster-5",
    topAxes: [
      "axis 3 (Governance Structure): +0.74 — toward Centralized Governance",
      "axis 8 (Cultural Diversity): +0.73 — toward Cohesion",
      "axis 5 (Rights Balance): +0.72 — toward Security",
      "axis 2 (Environmental Policy): +0.67 — toward Growth Imperative",
    ],
    nearestArchetypeId: "developmental-modernizer",
    nearestArchetypeName: "The Developmental Modernizer",
    nearestArchetypeEmergence: "refined",
    matchDistance: 1.0175,
  },
] as const;

export function getCluster(id: ClusterId): SyntheticStudyCluster {
  const cluster = CLUSTERS.find((c) => c.id === id);
  if (!cluster) {
    throw new Error(`Cluster ${id} not found`);
  }
  return cluster;
}
