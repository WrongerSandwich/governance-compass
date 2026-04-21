# Synthetic Study — Data Contract

This document defines what data each page of the Synthetic Study consumes, what shape that data should be in, what gets stored vs. computed, and what the public download contains. The goal is to give Claude Code a single source of truth so the data layer doesn't have to be negotiated during implementation.

## 1. Source files (pipeline inputs)

Seven files from the synthetic study pipeline feed the site. These are the authoritative sources — the site should not recompute anything they already contain.

**`personas.json`** — Raw persona generation output from Gemini. 1,002 personas with biographical narratives, demographics, region tags. This is the persona master record for all biographical fields.

**`scored_profiles.json`** — Per-administration scored outputs. 1,152 entries (576 Claude + 576 Gemini). Each entry has `persona_id`, `model`, 12-axis scores, per-modality breakdowns (FC/SC/Budget), tensions list, super_dimensions projection, and confidence indicators.

**`claude_responses.json` / `gemini_responses.json`** — Raw question-level responses. One entry per persona per model. Each contains the 36 FC choices, 24 SC choices, and the 7-ministry budget allocation. This is what the modal's raw responses section renders.

**`cluster_labels.csv`** — Authoritative per-persona cluster assignments and flattened master table. 1,002 rows, one per persona. Contains averaged-across-models 12-axis scores, cluster assignment, `n_models` (1 or 2 — indicates shared status), and all demographic fields flattened from the persona record. **This is the canonical joined view that most pages should start from.**

**`cluster_centroids.json`** and **`cluster_narratives.json`** — Six clusters with centroid vectors, sizes, shares, and prose descriptors. Referenced by Patterns cluster cards and the map legend.

**`archetype_comparison.json`** — The cluster-to-archetype mapping with full distance matrices. Referenced by modal archetype badges and the Archetypes page.

**`model_agreement.json`** — Pre-computed Claude-vs-Gemini statistics: per-axis Pearson r, mean differences, Euclidean distance distribution. The Model Agreement page's Section 1 and Section 2 charts read directly from this.

**`tension_patterns.json`** — Per-axis tension frequencies overall (by model) and by cluster. Feeds Patterns Section 6.

## 2. Derived data (computed at build time, cached as static JSON)

A small number of values are not in any source file but are needed by multiple pages. These should be computed once during a build step, stored as a static JSON file (`synthetic_study_derived.json` or similar), and consumed by the pages. Recomputing on every page load is unnecessary and would make the site slower.

### 2a. Regional aggregates

For each of the 10 regions:
- Persona count
- Top-3 archetypes by count (for map tooltips)
- Dominant cluster + share (for the Patterns Section 3a static map)
- Mean score on each of the 12 axes (for the Patterns Section 3b gradient map and any axis-gradient analysis)
- Cluster distribution (one percentage per cluster — matches `regional_distribution.csv` shape)

### 2b. Country-level aggregates

For the 28 countries with n≥10:
- Persona count
- Top-3 archetypes

These feed the country-hover tooltips on the interactive map.

### 2c. Model agreement by persona attribute

The Section 3 finding on the Model Agreement page (does disagreement correlate with persona attributes?) requires computing the mean Claude-Gemini distance for each attribute category. Six attributes × ~4–10 categories each = ~40 precomputed means. Feeds the small-multiples chart.

### 2d. Patterns demographic aggregates

For Patterns Section 3c, compute cluster distribution per demographic category for each of (urban_rural, economic_position, governance_experience, education). Roughly 20 additional precomputed breakdowns.

### 2e. Patterns correlation matrix

12×12 correlation matrix of axis scores computed from averaged axis scores across all 1,002 personas.

### 2f. Axis distribution histograms

For Patterns Section 4, precompute histogram bins for each of the 12 axes from the averaged axis scores, rather than shipping 1,002×12 raw values to the client. Suggested: 20 bins from -1.0 to +1.0.

### 2g. Persona compare view payloads

When a reader pins 2–4 personas for comparison, the compare view needs the scored profiles for those personas side by side. This doesn't require precomputation — it's just a filtered read of `cluster_labels.csv` + `scored_profiles.json` — but worth naming explicitly so Claude Code knows the compare feature doesn't need its own data pipeline.

### 2h. Country name normalization and `country_iso` field

The raw persona data has inconsistent country strings (`USA` vs `United States`, `DR Congo`, malformed entries like `"Italy (rural village)"`). A preprocessing step normalizes these and appends a `country_iso` field (ISO 3166 alpha-3) to each persona record. This preprocessing runs once at build time; the normalized data is what gets consumed by the site.

Specifically:
- Map `USA`, `United States`, `U.S.`, `America` → `USA` and `country_iso: USA`
- Map `Cote d'Ivoire`, `Côte d'Ivoire`, `Ivory Coast` → single normalized form with `country_iso: CIV`
- Map `DR Congo`, `Democratic Republic of Congo`, `Democratic Republic of the Congo` → `country_iso: COD`
- Handle malformed entries (`"Italy (rural village)"`, `"Syria)"`) by parsing the parenthetical/stray character out
- Log any countries that don't normalize cleanly — do not silently coerce

## 3. Per-page data dependencies

What each page of the Synthetic Study section reads.

### Overview

- Top-line counts from `personas.json` and `scored_profiles.json`: 1,002 personas, 1,152 administrations, 150 shared, 10 regions, 6 clusters, 12 archetypes.
- Download link points to the public dataset JSON (see Section 5 below).

Overview is the lightest page by far. No charts, no filters.

### Personas

- **Map:** regional aggregates from the derived file; country-level aggregates for country hover (n≥10 only).
- **Facet filters:** read from `cluster_labels.csv` for all filtering attributes (region, governance_experience, economic_position, urban_rural, age, gender, education, cluster, archetype via cluster-to-archetype mapping, shared-persona status via `n_models` field).
- **Persona grid:** filtered view of `cluster_labels.csv` — name, region, age, archetype, cluster per card.
- **Modal:** on open, reads the specific persona's full record from `personas.json` (for bio), `scored_profiles.json` (for one or two administrations depending on shared status), and for shared personas, both response files (`claude_responses.json` and `gemini_responses.json`). The archetype badge reads from `archetype_comparison.json` via the persona's cluster. The question text for raw responses comes from the existing site question bank — this is a dependency on data outside the Synthetic Study pipeline.

The modal is the most data-dense single view in the section. Worth noting that the modal's data loads on open, not on page load — preloading all 1,002 personas' full bios and responses would bloat the initial payload significantly.

### Patterns

- **Section 1 (clusters):** `cluster_centroids.json` and `cluster_narratives.json` for the six cards. Cluster size and share in each card.
- **Section 2 (archetype distribution):** `archetype_comparison.json` for the 12 archetypes and their cluster mappings. Emergence tags come from the archetype revision spec (lives on the Archetypes page — Patterns needs a lookup of which tag applies to which archetype).
- **Section 3a (regional maps):** derived regional aggregates for both the density and dominant-cluster maps.
- **Section 3b (Axis 8 gradient):** derived regional aggregates' Axis 8 means.
- **Section 3c (demographic aggregates):** derived demographic aggregates (Section 2d above).
- **Section 4 (axis distributions):** derived axis histogram bins (Section 2f above).
- **Section 5 (correlations):** derived 12×12 correlation matrix (Section 2e above).
- **Section 6 (tensions):** `tension_patterns.json` directly.

### Model Agreement

- **Section 1 (overall):** `model_agreement.json` directly.
- **Section 2a (per-axis r):** `model_agreement.json` per-axis array.
- **Section 2b (directional drift):** same source, `mean_diff_gemini_minus_claude` field.
- **Section 3 (disagreement by attribute):** derived model-agreement-by-attribute (Section 2c above).
- **Section 4 (individual cases):** four specific personas by ID. Claude Code selects these at build time: one at distance ~0.5 (high agreement), one near the median (~1.5), one at distance ~2.5+ (high disagreement), and one showing directional drift (profiles same shape, Gemini shifted toward tradition/sovereignty). Case study content is hard-coded once personas are chosen.

## 4. Filter state and URL contracts

The Synthetic Study section has stateful UI — filters on Personas, modal open/close, model selection within shared-persona modals. The question is what lives in the URL and what lives in local state.

**Source-of-truth rule:** filter state that meaningfully changes what the reader sees lives in the URL. State that's ephemeral (hover tooltips, modal expand/collapse subsections within a session) does not.

### Personas page URL parameters

- `?region=<region_key>` — active region filter (from map click or facet). One of the 10 region keys, including `diaspora_transnational`.
- `?cluster=<0-5>` — active cluster filter
- `?archetype=<archetype_id>` — active archetype filter
- `?governance=<category>` — governance experience filter
- `?economic=<category>` — economic position filter
- `?urban_rural=<category>` — setting filter
- `?education=<category>` — education filter
- `?age_min=<int>&age_max=<int>` — age range
- `?gender=<category>` — gender filter
- `?shared=<all|shared_only|non_shared_only>` — shared-persona tri-state
- `?q=<search_string>` — name search
- `?sort=<name|age|region|cluster>` — sort order

Multiple filters combine via AND. Clearing a filter removes the parameter from the URL.

### Persona modal URL

- `?persona=<persona_id>` — opens the modal for that persona, layered on top of whatever filter state is present. Closing the modal removes the parameter.
- `?persona=<persona_id>&model=<claude|gemini>` — for shared personas, selects which administration's raw responses are shown. Defaults to Claude if unspecified.

### Compare view URL

- `?compare=<persona_id>,<persona_id>,...` — up to 4 comma-separated persona IDs. Opens the compare view.

### Patterns page

No filter state. The page is a reading surface, not a browsing surface. Cluster or archetype references from prose link to the Archetypes page or scroll to the relevant Patterns section anchor — standard hash links, not filter state.

### Model Agreement page

No filter state in v1. Future versions could support filtering the disagreement analysis by region or governance experience, but v1 ships the static aggregated view.

### Cross-page persistence

Filter state persists within a session when navigating between Synthetic Study pages. A reader who filters Personas to Western Europe, navigates to Patterns, and returns should see Western Europe still active. Implementation: store filter state in session storage keyed to the Synthetic Study section, restore on page load if the URL doesn't override. Leaving the Synthetic Study section clears the session state.

## 5. Public dataset download

The download is a single JSON file — one request, self-contained. Structure:

```json
{
  "metadata": {
    "version": "1.0",
    "generated_at": "2026-04-19T02:06:44Z",
    "n_personas": 1002,
    "n_administrations": 1152,
    "n_shared": 150,
    "k_clusters": 6,
    "n_archetypes": 12,
    "persona_generator": "gemini-2.5-flash",
    "administering_models": ["claude-sonnet-4.6", "gemini-2.5-flash"],
    "regions": [ "western_europe", "eastern_europe_central_asia", ... ],
    "axes": [
      {"id": 1, "name": "Economic Model", "low_label": "Collective Provision", "high_label": "Market Allocation"},
      { "...12 entries total..." }
    ]
  },
  "personas": [
    {
      "id": "P0001",
      "name": "Eleanor Vance",
      "demographics": { "...all fields from personas.json..." },
      "country_iso": "GBR",
      "biographical_narrative": "...",
      "key_tensions": "...",
      "cluster": 2,
      "nearest_archetype": {
        "id": "nationalist-populist",
        "name": "The Nationalist Populist",
        "distance": 1.42,
        "match_strength": "moderate"
      },
      "averaged_axis_scores": [ "...12 values..." ],
      "administrations": [
        {
          "model": "claude",
          "axis_scores": { "...12 named fields..." },
          "modality_scores": { "...per-axis FC/SC/BG breakdown..." },
          "tensions": [ "...axis-level tensions..." ],
          "confidence": { "...per-axis spread and level..." },
          "super_dimensions": {"economic": 0.0, "cultural": 0.0},
          "raw_responses": {
            "fc": [ {"item": "fc-1-1", "choice": "A"} ],
            "sc": [ {"item": "sc-1-1", "choice": 3} ],
            "budget": {"defense": 4}
          }
        }
      ]
    }
  ]
}
```

### Key design decisions in this structure

The download is **persona-keyed, not administration-keyed.** Each persona has an `administrations` array with one or two entries depending on shared status. This matches the way readers think about the data ("show me this persona's profile") rather than the internal pipeline structure.

`averaged_axis_scores` is included at the persona level even though it's derivable from the administrations, because most downstream analyses will use it and computing it from the administrations is annoying.

`country_iso` is included (result of the normalization step), but the raw `location` string is preserved in `demographics` for display purposes.

`match_strength` is a bucketed version of the archetype distance: "strong match" (d < 1.0), "moderate match" (1.0 ≤ d < 1.5), "close match" (1.5 ≤ d < 2.0), "weak match" (d ≥ 2.0). Raw distance is also included so researchers can set their own thresholds.

### Question text is not bundled

The FC/SC item IDs reference the question bank, which lives on the main site. A separate `question_bank.json` file is linked from the download page — researchers who want to map response codes to question text can pull that too.

### Budget allocations use the current 7-ministry structure

Matching the current Chancellor's Budget (v2). Historical 10-ministry data is not in this dataset — this study was run against v2 of the instrument.

### File size

Roughly 8–12 MB uncompressed, 1–2 MB gzipped over the wire. Acceptable for a direct download. If it grows past 20 MB in future versions, worth splitting into a persona catalog + separate responses file.

## 6. Data integrity checks

A few sanity checks Claude Code should run at build time to catch pipeline issues before they reach the site:

- **Count check:** `personas.json` should have 1,002 entries, matching `cluster_labels.csv` row count.
- **Administration count:** `scored_profiles.json` should have `claude_count + gemini_count == 1152`.
- **Shared count:** personas with `n_models == 2` should number 150.
- **Cluster assignment completeness:** every persona in `cluster_labels.csv` should have a cluster in 0..5.
- **Country normalization:** every persona should have a non-null `country_iso` after preprocessing; any failures should be logged explicitly, not silently coerced.
- **Axis bounds:** all axis scores should fall within [-1.0, +1.0].
- **Archetype mapping:** every cluster should have a valid archetype nearest-match entry in `archetype_comparison.json`.

These are cheap to run, catch the most likely pipeline bugs, and provide a clean error signal if the data shape ever drifts.

## 7. Explicitly out of scope

Three things worth naming so Claude Code doesn't look for them:

- **Per-persona archetype distance charts** (showing distance to all 12 archetypes as a small bar chart in the modal). Discussed as a possible modal addition, ruled out — the archetype badge's match-strength indicator captures the relevant signal.
- **Live recomputation of clusters or archetypes.** The cluster assignments and archetype mappings are fixed outputs of the synthetic study pipeline. The site consumes them; it does not recompute them. If the archetype catalog is revised after launch, a new run of the pipeline produces new mapping files; the site doesn't need to do clustering itself.
- **User-submitted filters on the dataset download.** V1 ships the full dataset only. Filtered subsets can be produced by downloading and filtering locally; we don't need a server-side filter endpoint.
