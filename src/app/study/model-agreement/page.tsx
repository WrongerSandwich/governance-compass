import fs from "node:fs/promises";
import path from "node:path";
import { axes } from "@/data/axes";
import { ModelAgreementClient } from "@/components/study/model-agreement/ModelAgreementClient";
import type { PerAxisEntry, DistanceStats } from "@/components/study/model-agreement/ModelAgreementClient";
import type { AttributePanel, AttributeCategory } from "@/components/study/model-agreement/DisagreementByAttribute";
import type { CaseStudyProps } from "@/components/study/model-agreement/CaseStudy";

// ---------------------------------------------------------------------------
// Types for raw JSON files
// ---------------------------------------------------------------------------

interface ModelAgreementJson {
  n_shared_personas: number;
  per_axis: {
    axis: number;
    pearson_r: number;
    mean_diff_gemini_minus_claude: number;
  }[];
  euclidean_distance: {
    mean: number;
    median: number;
    p90: number;
    max: number;
  };
}

interface DistanceDistributionJson {
  distances: number[];
  mean: number;
  median: number;
  p90: number;
  max: number;
  nShared: number;
}

interface AttributeRow {
  attribute: string;
  category: string;
  n: number;
  mean_distance: number;
}

// ---------------------------------------------------------------------------
// Types for case study JSON files
// ---------------------------------------------------------------------------

interface CaseStudyPersonaEntry {
  kind: "high_agreement" | "typical" | "high_disagreement" | "directional_drift";
  persona_id: string;
  distance: number;
  per_axis_diff: number[];
}

interface PersonaRecord {
  id: string;
  name: string;
  age: number;
  location: string;
  occupation: string;
  governance_experience: string;
  life_narrative: string;
  key_tensions: string;
  [key: string]: unknown;
}

interface PersonasJson {
  personas: PersonaRecord[];
  [key: string]: unknown;
}

interface ScoredProfileRecord {
  persona_id: string;
  model: string;
  axis_scores: Record<string, number>;
  [key: string]: unknown;
}

interface ScoredProfilesJson {
  profiles: ScoredProfileRecord[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Case study content authored from persona data
// ---------------------------------------------------------------------------

const KIND_LABELS: Record<string, string> = {
  high_agreement: "High agreement",
  typical: "Typical",
  high_disagreement: "High disagreement",
  directional_drift: "Directional drift",
};

// Written content keyed by persona_id
const CASE_STUDY_CONTENT: Record<
  string,
  { bioSummary: string; analyticalProse: string }
> = {
  // P0325 — high_agreement — Jamie Lee, Portland, stable democracy
  P0325: {
    bioSummary:
      "Jamie Lee is a 29-year-old bicycle mechanic living in Portland, Oregon, in a stable democratic context. Working class and secondary-educated, they chose a hands-on trade over university and have watched their city change around them through gentrification and rising rents. Active in local housing and environmental movements, they hold strongly communitarian and decentralized political views.",
    analyticalProse:
      "Both models score Jamie in close agreement across nearly all axes: Economic Model, Governance Structure, Human Nature, and Military Policy are identical, and the remaining differences are minor. The largest divergences occur on axes 12 (Technology Governance, −0.24), 6 (Legitimacy Basis, −0.23), and 7 (Social Change, −0.20), all of which Gemini scores slightly more conservative — consistent with the directional drift identified across the full dataset. The overall profile shape is virtually indistinguishable between models.",
  },
  // P0252 — typical — Sofia Gomez, Mexico City, flawed democracy
  P0252: {
    bioSummary:
      "Sofia Gomez is a 31-year-old graphic designer based in Mexico City, the first in her family to attend university. Living under a flawed democracy marked by inequality and corruption, she maintains a middle-class urban lifestyle while holding concerns about the effectiveness of public governance. She has seen friends emigrate in search of safety, and she weighs a similar question herself.",
    analyticalProse:
      "The two models agree most closely on axes 7 (Social Change, diff = 0.00) and 5 (Rights Balance, −0.07), and diverge most sharply on axis 3 (Governance Structure, −1.20). Claude scores Sofia as strongly preferring distributed governance, while Gemini places her at the centralized end — a full-unit disagreement on a single axis that drives most of the overall distance. Axes 1 (Economic Model, +0.34) and 10 (International Engagement, +0.25) also diverge noticeably, pulling in the opposite direction from axis 3.",
  },
  // P0238 — high_disagreement — Aigul Nurmagambetova, Kazakhstan, authoritarian state
  P0238: {
    bioSummary:
      "Aigul Nurmagambetova is a 52-year-old professor of linguistics at a university in Almaty, Kazakhstan, where she has lived through Soviet-era education, post-independence cultural revival, and decades of authoritarian rule. Affluent and postgraduate-educated, she has benefited from the country's resource-driven economic growth while privately noting the suppression of political dissent and her concerns about her son's generation.",
    analyticalProse:
      "The two models disagree profoundly across almost every axis, producing a total distance of 3.10 — the largest of any persona in the case selection. Claude scores Aigul with mixed, tension-laden positions: moderate on rights (0.20), skeptical of legitimacy (−0.39), and cautious on military (−0.65). Gemini reads her as nearly uniformly affirmative: rights-positive (0.85), strongly pro-legitimacy (0.82), culturally open (0.90), and internationally engaged (0.73). Axes 7 (Social Change, diff = 1.40), 6 (Legitimacy Basis, 1.22), and 9 (Human Nature, 1.20) show the sharpest splits — a pattern consistent with the models resolving Aigul's stated tensions in opposite directions.",
  },
  // P0415 — directional_drift — Carmen Rivera, Acapulco, flawed democracy
  P0415: {
    bioSummary:
      "Carmen Rivera is a 59-year-old hotel housekeeper in Acapulco, Mexico, with primary-level education and working-class income. She grew up when the city was a prosperous tourist resort and has watched organized crime displace that stability. She lost a nephew to gang violence and relies on her local community and church for support and a sense of order.",
    analyticalProse:
      "The disagreement here is not noisy but directional: Gemini consistently shifts Carmen toward more conservative and sovereignty-oriented positions across multiple axes. The largest shifts are on axes 6 (Legitimacy Basis, +1.20 toward alternative legitimacy) and 7 (Social Change, +1.20 toward continuity and tradition), followed by axis 2 (Environmental Policy, +0.30) and axis 1 (Economic Model, +0.23). Axis 4 (Decision Authority) is identical between the two models. Axis 10 (International Engagement) also shifts positive under Gemini (+0.17), consistent with the dataset-wide drift toward sovereignty — though the magnitude here is smaller than on axes 6 and 7.",
  },
};

// ---------------------------------------------------------------------------
// Attribute panel configuration
// ---------------------------------------------------------------------------

const ATTRIBUTE_CONFIGS: {
  key: string;
  title: string;
  labelMap?: Record<string, string>;
}[] = [
  {
    key: "region",
    title: "Region",
    labelMap: {
      western_europe: "Western Europe",
      eastern_europe_central_asia: "E. Europe / C. Asia",
      north_america: "North America",
      latin_america: "Latin America",
      east_asia: "East Asia",
      south_southeast_asia: "S/SE Asia",
      middle_east_north_africa: "MENA",
      sub_saharan_africa: "Sub-Saharan Africa",
      oceania_small_states: "Oceania",
      diaspora_transnational: "Diaspora",
    },
  },
  {
    key: "governance_experience",
    title: "Governance experience",
    labelMap: {
      stable_democracy: "Stable democracy",
      flawed_democracy: "Flawed democracy",
      hybrid_regime: "Hybrid regime",
      authoritarian_state: "Authoritarian state",
      conflict_zone: "Conflict zone",
      colonial_post_colonial_transition: "Post-colonial transition",
    },
  },
  {
    key: "economic_position",
    title: "Economic position",
    labelMap: {
      wealthy: "Wealthy",
      affluent: "Affluent",
      middle_class: "Middle class",
      working_class: "Working class",
      struggling: "Struggling",
    },
  },
  {
    key: "urban_rural",
    title: "Urban / rural",
    labelMap: {
      urban: "Urban",
      peri_urban: "Peri-urban",
      rural: "Rural",
    },
  },
  {
    key: "education",
    title: "Education",
    labelMap: {
      postgraduate: "Postgraduate",
      university: "University",
      secondary: "Secondary",
      primary: "Primary",
      none: "None",
    },
  },
  {
    key: "gender",
    title: "Gender",
    labelMap: {
      female: "Female",
      male: "Male",
      non_binary: "Non-binary",
    },
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ModelAgreementPage() {
  const dataDir = path.join(process.cwd(), "data/synthetic_study");
  const derivedDir = path.join(process.cwd(), "public/study/derived");

  const [maRaw, distRaw, attrRaw, caseRaw, personasRaw, profilesRaw] =
    await Promise.all([
      fs.readFile(path.join(dataDir, "model_agreement.json"), "utf8"),
      fs.readFile(path.join(derivedDir, "distance_distribution.json"), "utf8"),
      fs.readFile(
        path.join(derivedDir, "model_agreement_by_attribute.json"),
        "utf8"
      ),
      fs.readFile(
        path.join(derivedDir, "case_study_personas.json"),
        "utf8"
      ),
      fs.readFile(path.join(dataDir, "personas.json"), "utf8"),
      fs.readFile(path.join(dataDir, "scored_profiles.json"), "utf8"),
    ]);

  const ma: ModelAgreementJson = JSON.parse(maRaw);
  const dist: DistanceDistributionJson = JSON.parse(distRaw);
  const attrRows: AttributeRow[] = JSON.parse(attrRaw);
  const caseEntries: CaseStudyPersonaEntry[] = JSON.parse(caseRaw);
  const personasJson: PersonasJson = JSON.parse(personasRaw);
  const profilesJson: ScoredProfilesJson = JSON.parse(profilesRaw);

  // Build axis name map
  const axisNameMap = new Map(axes.map((a) => [a.id, a.name]));

  // Merge per_axis data with axis names
  const perAxis: PerAxisEntry[] = ma.per_axis.map((a) => ({
    axis: a.axis,
    axisName: axisNameMap.get(a.axis) ?? `Axis ${a.axis}`,
    pearson_r: a.pearson_r,
    mean_diff_gemini_minus_claude: a.mean_diff_gemini_minus_claude,
  }));

  // Build distance stats
  const distanceStats: DistanceStats = {
    mean: dist.mean,
    median: dist.median,
    p90: dist.p90,
    max: dist.max,
    distances: dist.distances,
  };

  // Build attribute panels
  const attributePanels: AttributePanel[] = ATTRIBUTE_CONFIGS.map((config) => {
    const rows = attrRows.filter((r) => r.attribute === config.key);
    const categories: AttributeCategory[] = rows.map((r) => ({
      category: r.category,
      label: config.labelMap?.[r.category] ?? r.category,
      n: r.n,
      mean_distance: r.mean_distance,
    }));
    return {
      attribute: config.key,
      title: config.title,
      categories,
    };
  });

  // ---------------------------------------------------------------------------
  // Build case studies
  // ---------------------------------------------------------------------------

  // Index persona records and scored profiles for fast lookup
  const personaMap = new Map(
    personasJson.personas.map((p) => [p.id, p])
  );

  // The scored_profiles.json may have profiles as top-level array or { profiles: [...] }
  const allProfiles: ScoredProfileRecord[] = Array.isArray(profilesJson)
    ? (profilesJson as unknown as ScoredProfileRecord[])
    : profilesJson.profiles;

  const profileMap = new Map<string, ScoredProfileRecord>();
  for (const p of allProfiles) {
    profileMap.set(`${p.persona_id}:${p.model}`, p);
  }

  // Axis score keys in order
  const AXIS_KEYS = axes.map((a) => `${a.id}_${a.name.toLowerCase().replace(/ /g, "_")}`);

  function getScores(record: ScoredProfileRecord): number[] {
    return AXIS_KEYS.map((k) => {
      // Try exact key first, then find by axis number prefix
      if (k in record.axis_scores) return record.axis_scores[k];
      const axisNum = k.split("_")[0];
      const found = Object.entries(record.axis_scores).find(([key]) =>
        key.startsWith(axisNum + "_")
      );
      return found ? found[1] : 0;
    });
  }

  const caseStudies: CaseStudyProps[] = caseEntries.map((entry) => {
    const persona = personaMap.get(entry.persona_id);
    const claudeProfile = profileMap.get(`${entry.persona_id}:claude`);
    const geminiProfile = profileMap.get(`${entry.persona_id}:gemini`);

    if (!persona || !claudeProfile || !geminiProfile) {
      throw new Error(
        `Missing data for case study persona ${entry.persona_id}`
      );
    }

    const content = CASE_STUDY_CONTENT[entry.persona_id];
    if (!content) {
      throw new Error(`No authored content for persona ${entry.persona_id}`);
    }

    return {
      kind: entry.kind,
      kindLabel: KIND_LABELS[entry.kind] ?? entry.kind,
      personaId: entry.persona_id,
      personaName: persona.name,
      identity: `Age ${persona.age} · ${persona.location} · ${persona.occupation}`,
      bioSummary: content.bioSummary,
      distance: entry.distance,
      claudeScores: getScores(claudeProfile),
      geminiScores: getScores(geminiProfile),
      analyticalProse: content.analyticalProse,
      viewFullProfileHref: `/study/personas?persona=${entry.persona_id}`,
    };
  });

  return (
    <main className="min-h-screen px-4 py-12">
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="mx-auto max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium mb-1">
          Synthetic Study
        </p>
        <h1 className="text-[clamp(32px,5vw,38px)] font-serif font-medium text-text-primary leading-tight mb-6">
          Model agreement
        </h1>

        {/* Intro — verbatim from spec */}
        <p className="text-[17px] font-serif text-text-secondary leading-relaxed mb-6">
          150 personas were administered the Governance Compass twice — once by
          Claude Sonnet 4.6 and once by Gemini 2.5 Flash. This page compares the
          two sets of scored profiles. Agreement is measured at the axis level
          (do the two models score the same persona similarly?), at the persona
          level (how far apart are they in the 12-dimensional axis space?), and
          against persona attributes (does the size of disagreement correlate
          with who the persona is?).
        </p>

        {/* Section nav — quiet atlas-style jump list.
            Each item is an inline-block with nowrap so a single link never
            splits mid-label. Gap-only separation (no · glyph) keeps wrapping
            clean on narrow viewports — no orphaned dots at line starts. */}
        <nav
          aria-label="Sections on this page"
          className="mb-14 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-text-tertiary leading-relaxed"
        >
          {[
            { num: "01", label: "Overall", id: "section-1" },
            { num: "02a", label: "Per-axis correlation", id: "section-2a" },
            { num: "02b", label: "Directional drift", id: "section-2b" },
            { num: "03", label: "By attribute", id: "section-3" },
            { num: "04", label: "Cases", id: "section-4" },
            { num: "05", label: "Instrument", id: "section-5" },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="whitespace-nowrap hover:text-text-secondary transition-colors duration-150"
            >
              <span className="tabular-nums mr-1.5">{item.num}</span>
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Client sections 1–3 (+ stubs 4–5)                                  */}
      {/* ------------------------------------------------------------------ */}
      <ModelAgreementClient
        perAxis={perAxis}
        distanceStats={distanceStats}
        attributePanels={attributePanels}
        caseStudies={caseStudies}
      />
    </main>
  );
}
