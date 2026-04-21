import fs from "node:fs/promises";
import path from "node:path";
import { axes } from "@/data/axes";
import { ModelAgreementClient } from "@/components/study/model-agreement/ModelAgreementClient";
import type { PerAxisEntry, DistanceStats } from "@/components/study/model-agreement/ModelAgreementClient";
import type { AttributePanel, AttributeCategory } from "@/components/study/model-agreement/DisagreementByAttribute";

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

  const [maRaw, distRaw, attrRaw] = await Promise.all([
    fs.readFile(path.join(dataDir, "model_agreement.json"), "utf8"),
    fs.readFile(path.join(derivedDir, "distance_distribution.json"), "utf8"),
    fs.readFile(
      path.join(derivedDir, "model_agreement_by_attribute.json"),
      "utf8"
    ),
  ]);

  const ma: ModelAgreementJson = JSON.parse(maRaw);
  const dist: DistanceDistributionJson = JSON.parse(distRaw);
  const attrRows: AttributeRow[] = JSON.parse(attrRaw);

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

  return (
    <main className="min-h-screen px-4 py-12">
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="mx-auto max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium mb-1">
          Synthetic Study
        </p>
        <h1 className="text-[28px] font-serif font-medium text-text-primary leading-tight mb-6">
          Model agreement
        </h1>

        {/* Intro — verbatim from spec */}
        <p className="text-[17px] font-serif text-text-secondary leading-relaxed mb-12">
          150 personas were administered the Governance Compass twice — once by
          Claude Sonnet 4.6 and once by Gemini 2.5 Flash. This page compares the
          two sets of scored profiles. Agreement is measured at the axis level
          (do the two models score the same persona similarly?), at the persona
          level (how far apart are they in the 12-dimensional axis space?), and
          against persona attributes (does the size of disagreement correlate
          with who the persona is?).
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Client sections 1–3 (+ stubs 4–5)                                  */}
      {/* ------------------------------------------------------------------ */}
      <ModelAgreementClient
        perAxis={perAxis}
        distanceStats={distanceStats}
        attributePanels={attributePanels}
      />
    </main>
  );
}
