import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parse as parseCsv } from "csv-parse/sync";
import { bucketMatchStrength } from "@/lib/study/matchStrength";
import { postRevisionArchetypeForCluster } from "@/lib/study/archetypeResolution";
import type {
  PersonaRecord,
  ScoredProfile,
  ResponseRecord,
  ClusterId,
  PersonaDetailResponse,
} from "@/lib/study/types";

// ---------------------------------------------------------------------------
// Types for raw file shapes
// ---------------------------------------------------------------------------

interface ClusterLabelRow {
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
  country_iso?: string;
  [key: string]: string | undefined;
}

interface PersonasFile {
  personas: PersonaRecord[];
}

interface PersonaSlimEntry {
  id: string;
  country_iso: string;
}

interface ScoredProfilesFile {
  profiles: ScoredProfile[];
}

interface ResponseFile {
  responses: ResponseRecord[];
}

// ---------------------------------------------------------------------------
// Module-scope cache (lazy init; immutable data)
// ---------------------------------------------------------------------------

interface DataCache {
  personaById: Map<string, PersonaRecord>;
  clusterLabelById: Map<string, ClusterLabelRow>;
  countryIsoById: Map<string, string>;
  profilesByPersona: Map<string, ScoredProfile[]>;
  claudeById: Map<string, ResponseRecord>;
  geminiById: Map<string, ResponseRecord>;
  clusterCentroidById: Map<number, readonly number[]>;
}

let cache: DataCache | null = null;
let cachePromise: Promise<DataCache> | null = null;

const DATA_DIR = path.join(process.cwd(), "data", "synthetic_study");
const DERIVED_DIR = path.join(process.cwd(), "public", "study", "derived");

interface ClusterCentroidRaw {
  cluster: number;
  axis_1: number; axis_2: number; axis_3: number; axis_4: number;
  axis_5: number; axis_6: number; axis_7: number; axis_8: number;
  axis_9: number; axis_10: number; axis_11: number; axis_12: number;
}

async function loadData(): Promise<DataCache> {
  const [personasRaw, scoredRaw, claudeRaw, geminiRaw, csvRaw, centroidsRaw, slimRaw] =
    await Promise.all([
      fs.promises.readFile(path.join(DATA_DIR, "personas.json"), "utf-8"),
      fs.promises.readFile(path.join(DATA_DIR, "scored_profiles.json"), "utf-8"),
      fs.promises.readFile(path.join(DATA_DIR, "claude_responses.json"), "utf-8"),
      fs.promises.readFile(path.join(DATA_DIR, "gemini_responses.json"), "utf-8"),
      fs.promises.readFile(path.join(DATA_DIR, "cluster_labels.csv"), "utf-8"),
      fs.promises.readFile(path.join(DATA_DIR, "cluster_centroids.json"), "utf-8"),
      fs.promises.readFile(path.join(DERIVED_DIR, "personas_slim.json"), "utf-8"),
    ]);

  const personasFile = JSON.parse(personasRaw) as PersonasFile;
  const scoredFile = JSON.parse(scoredRaw) as ScoredProfilesFile;
  const claudeFile = JSON.parse(claudeRaw) as ResponseFile;
  const geminiFile = JSON.parse(geminiRaw) as ResponseFile;
  const centroidsFile = JSON.parse(centroidsRaw) as ClusterCentroidRaw[];
  const slimEntries = JSON.parse(slimRaw) as PersonaSlimEntry[];

  const clusterRows = parseCsv(csvRaw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as ClusterLabelRow[];

  // Build indexes
  const personaById = new Map<string, PersonaRecord>();
  for (const p of personasFile.personas) {
    personaById.set(p.id, p);
  }

  const clusterLabelById = new Map<string, ClusterLabelRow>();
  for (const row of clusterRows) {
    clusterLabelById.set(row.persona_id, row);
  }

  const profilesByPersona = new Map<string, ScoredProfile[]>();
  for (const profile of scoredFile.profiles) {
    const list = profilesByPersona.get(profile.persona_id) ?? [];
    list.push(profile);
    profilesByPersona.set(profile.persona_id, list);
  }

  const claudeById = new Map<string, ResponseRecord>();
  for (const resp of claudeFile.responses) {
    claudeById.set(resp.persona_id, resp);
  }

  const geminiById = new Map<string, ResponseRecord>();
  for (const resp of geminiFile.responses) {
    geminiById.set(resp.persona_id, resp);
  }

  const countryIsoById = new Map<string, string>();
  for (const slim of slimEntries) {
    countryIsoById.set(slim.id, slim.country_iso);
  }

  const clusterCentroidById = new Map<number, readonly number[]>();
  for (const c of centroidsFile) {
    clusterCentroidById.set(c.cluster, [
      c.axis_1, c.axis_2, c.axis_3, c.axis_4, c.axis_5, c.axis_6,
      c.axis_7, c.axis_8, c.axis_9, c.axis_10, c.axis_11, c.axis_12,
    ]);
  }

  return {
    personaById,
    clusterLabelById,
    countryIsoById,
    profilesByPersona,
    claudeById,
    geminiById,
    clusterCentroidById,
  };
}

async function getData(): Promise<DataCache> {
  if (cache) return cache;
  if (!cachePromise) cachePromise = loadData();
  cache = await cachePromise;
  return cache;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

const ID_RE = /^P\d{4}$/;

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid persona id format" }, { status: 400 });
  }

  try {
    const data = await getData();

    const persona = data.personaById.get(id);
    if (!persona) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    const labelRow = data.clusterLabelById.get(id);
    if (!labelRow) {
      return NextResponse.json({ error: "Cluster data not found for persona" }, { status: 500 });
    }

    const cluster = parseInt(labelRow.cluster, 10) as ClusterId;
    const n_models = parseInt(labelRow.n_models, 10) as 1 | 2;

    const averaged_axis_scores = [
      parseFloat(labelRow.axis_1),
      parseFloat(labelRow.axis_2),
      parseFloat(labelRow.axis_3),
      parseFloat(labelRow.axis_4),
      parseFloat(labelRow.axis_5),
      parseFloat(labelRow.axis_6),
      parseFloat(labelRow.axis_7),
      parseFloat(labelRow.axis_8),
      parseFloat(labelRow.axis_9),
      parseFloat(labelRow.axis_10),
      parseFloat(labelRow.axis_11),
      parseFloat(labelRow.axis_12),
    ];

    // country_iso comes from personas_slim.json (not cluster_labels.csv)
    const country_iso = data.countryIsoById.get(id) ?? "";

    // Nearest archetype for this persona's cluster — derived from post-revision
    // catalog via CLUSTERS × archetypes.ts prototypes (no archetype_comparison.json).
    const centroid = data.clusterCentroidById.get(cluster);
    if (!centroid) {
      return NextResponse.json(
        { error: "Centroid data not found for cluster" },
        { status: 500 }
      );
    }

    const archetypeMatch = postRevisionArchetypeForCluster(cluster, centroid);

    const nearest_archetype: PersonaDetailResponse["nearest_archetype"] = {
      id: archetypeMatch.id,
      name: archetypeMatch.name,
      emergence: archetypeMatch.emergence,
      distance: archetypeMatch.distance,
      match_strength: bucketMatchStrength(archetypeMatch.distance),
    };

    // Build administrations from scored profiles + raw responses
    const profiles = data.profilesByPersona.get(id) ?? [];

    const administrations: PersonaDetailResponse["administrations"] = profiles.map((profile) => {
      const model = profile.model as "claude" | "gemini";

      const responseRecord =
        model === "claude"
          ? data.claudeById.get(id)
          : data.geminiById.get(id);

      // Flatten confidence from {axis_key: {spread, level}} to {axis_key: level}
      const confidence: Record<string, "high" | "moderate" | "low"> = {};
      for (const [key, val] of Object.entries(profile.confidence)) {
        confidence[key] = val.level;
      }

      // Flatten modality_scores to omit null values
      const modality_scores: Record<string, { fc?: number; sc?: number; budget?: number }> = {};
      for (const [key, val] of Object.entries(profile.modality_scores)) {
        const entry: { fc?: number; sc?: number; budget?: number } = {};
        if (val.fc !== null && val.fc !== undefined) entry.fc = val.fc;
        if (val.sc !== null && val.sc !== undefined) entry.sc = val.sc;
        if (val.bg !== null && val.bg !== undefined) entry.budget = val.bg;
        modality_scores[key] = entry;
      }

      // Normalize tensions
      const tensions = profile.tensions.map((t) => ({
        axis: t.axis,
        severity: t.level as "mild" | "moderate" | "strong",
      }));

      return {
        model,
        axis_scores: profile.axis_scores as Record<string, number>,
        modality_scores,
        tensions,
        confidence,
        super_dimensions: profile.super_dimensions,
        raw_responses: responseRecord
          ? {
              fc: responseRecord.fc_responses,
              sc: responseRecord.sc_responses.map((r) => ({
                item: r.item,
                choice: r.choice as number,
              })),
              budget: responseRecord.budget as Record<string, number>,
            }
          : { fc: [], sc: [], budget: {} },
      };
    });

    const body: PersonaDetailResponse = {
      persona,
      country_iso,
      cluster,
      n_models,
      averaged_axis_scores,
      nearest_archetype,
      administrations,
    };

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
