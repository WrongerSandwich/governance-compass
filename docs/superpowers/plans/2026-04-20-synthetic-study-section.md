# Synthetic Study Section — Implementation Plan

> **Status: Shipped** — all 15 phases (Phase 0 through Phase 7) delivered on `feature/synthetic-study` (commits `2708e54..`). Subsequent polish rounds added editorial refinement (atlas-style landing, gazetteer persona index, Patterns reframe, Model Agreement typography + layout normalization, Research nav dropdown, full mobile pass on each page and modal). Keeping this plan for reference.

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a top-level Synthetic Study section to governance-compass.org that surfaces the April 2026 dataset (1,002 Gemini-generated personas administered by Claude Sonnet 4.6 and Gemini 2.5 Flash). The section adds four pages — Overview, Personas, Patterns, Model Agreement — under `/study/*`, plus a public JSON download.

**Specs:** All authoritative content/layout decisions live in `docs/system_proposal/synthetic_study_spec/`:
- `README.md` — bundle overview, build order, open questions
- `data_contract.md` — source files, derived data, URL state, download format, integrity checks
- `map_spec.md` — interactive + static world maps, region taxonomy, cluster colors
- `overview_page.md` — entry-point prose
- `patterns_page.md` — six-section analytical reading surface
- `model_agreement_page.md` — five-section comparison
- `persona_modal.md` — deepest single view

When prose, layouts, or thresholds are specified, use them verbatim — do **not** redesign. When the spec says "compute from data," use the value from the build-time script.

**Source data:** `data/synthetic_study/*.json` and `cluster_labels.csv` — pulled from the pipeline. Do not modify these in place.

---

## Architecture decisions

### Routing
Place all four pages under `/study/`:
- `/study` — Overview (entry point)
- `/study/personas` — faceted browser + map
- `/study/patterns` — analytical reading surface
- `/study/model-agreement` — Claude vs. Gemini comparison
- `/study/personas?persona=P0042` — modal opens layered over the page; `?persona=…&model=claude|gemini` toggles dual-model view
- `/study/personas?compare=P0001,P0042,…` — compare view (max 4)

Section nav lives in the existing top NavBar as a single new tab labeled **"Synthetic Study"**, alongside Methodology and References.

### Data layer (the load-bearing decision)
Three data tiers, never crossed:

1. **Slim catalog (~150 KB gzipped, shipped to client)** — `personas_slim.json` containing one entry per persona with only the fields needed for filtering, the grid, the map, and the cluster/archetype badge: `id, name, region, country_iso, age, gender, education, urban_rural, economic_position, governance_experience, cluster, n_models, averaged_axis_scores, nearest_archetype_id`. This is what the Personas grid + filters + maps consume.
2. **Per-persona detail (loaded on demand)** — when the modal opens or a compare slot fills, fetch that single persona's full record (bio, raw responses for one or both models, scored profile with confidence/tensions/modality breakdowns) via a Next.js Route Handler at `GET /api/study/persona/[id]`. This avoids ever shipping the 4 MB scored_profiles or 2.6 MB-each response files into a client bundle.
3. **Public download (~10 MB JSON)** — assembled at build time, written to `public/data/synthetic_study_v1.json`, linked from Overview.

### Build-time preprocessing
A new script `scripts/build-synthetic-study.ts` (run via `npm run build:study`, also invoked from `prebuild`) does all of this in one pass:
- Country normalization → `country_iso`
- Country-to-region mapping verification (every persona must map cleanly)
- Slim catalog assembly
- Regional and country aggregates (counts, top-3 archetypes, dominant cluster + share, mean axis scores, cluster distribution)
- Demographic aggregates (cluster distribution per category for urban_rural, economic_position, governance_experience, education)
- Model-agreement-by-attribute means
- 12×12 axis correlation matrix
- 12 axis distribution histograms (20 bins, -1.0 to +1.0)
- Public download JSON
- Data integrity checks (counts, axis bounds, archetype mappings) — fail the build on violation

Outputs land in `public/study/derived/` (consumed by client) and `public/data/` (download). Source data files in `data/synthetic_study/` are read by the script and the per-persona API route only — never imported into client bundles.

### Map library
- Install `react-simple-maps@3`, `d3-geo`, `d3-geo-projection`, `topojson-client`.
- TopoJSON: Natural Earth 110m, served from `public/geo/`. Region-level TopoJSON derived from country aggregation at build time (via the same preprocessing script, or a one-time committed artifact).

### Charting
Stay with hand-rolled SVG (matches the existing `ArchetypeCard` mini-radar pattern). The spec asks for radars, histograms, bar charts, heatmaps, violin plots, and a correlation matrix — all simple shapes. **No charting library.** This keeps bundle size lean and aesthetic consistent.

### Cluster color tokens
Add to `globals.css` alongside the existing domain colors:
- `--cluster-0` (Stone 300, desaturated)
- `--cluster-1` (Clay)
- `--cluster-2` (Stone)
- `--cluster-3` (Sage)
- `--cluster-4` (Clay-rust, warmer/saturated variant of Clay)
- `--cluster-5` (Slate)
- `--map-density-0` … `--map-density-4` (5-step Stone ramp)
- `--map-border`, `--map-hover`, `--map-accent` (warm gold `#8B6914`)
- `--model-claude` (warm stone/clay), `--model-gemini` (cooler slate/sage)

Final tones may need visual iteration — defer to Evan in a critique pass once the maps render.

### Filter state
- URL is the source of truth (per data contract §4).
- Cross-page persistence: a small client-side helper (`src/lib/study/filterState.ts`) mirrors the URL into `sessionStorage` keyed to the Synthetic Study section; on `/study/*` page mount, restore from sessionStorage if URL is empty. Leaving `/study/*` clears.

### Out of scope (per README)
PDF export, server-side filtered downloads, account-bound state, live recomputation, real-time updates.

---

## File structure (new files)

```
data/synthetic_study/                          # already populated by pipeline
docs/system_proposal/synthetic_study_spec/     # already in place

scripts/
  build-synthetic-study.ts                     # NEW — preprocessing pipeline
  data/
    country-region-mapping.ts                  # NEW — authored mapping table
    country-name-normalization.ts              # NEW — alias resolution

public/
  data/
    synthetic_study_v1.json                    # NEW (build output)
  geo/
    world-110m.json                            # NEW — Natural Earth countries
    world-regions-110m.json                    # NEW — aggregated to 10 regions
  study/
    derived/
      personas_slim.json                       # NEW (build output)
      regional_aggregates.json                 # NEW
      country_aggregates.json                  # NEW
      demographic_aggregates.json              # NEW
      model_agreement_by_attribute.json        # NEW
      axis_correlations.json                   # NEW
      axis_histograms.json                     # NEW

src/lib/study/
  types.ts                                     # NEW — shared TS types
  filterState.ts                               # NEW — URL + sessionStorage
  matchStrength.ts                             # NEW — distance → bucket
  questionLookup.ts                            # NEW — id → question text

src/data/
  syntheticStudyClusters.ts                    # NEW — cluster colors, names, descriptors

src/app/study/
  layout.tsx                                   # NEW — section shell
  page.tsx                                     # NEW — Overview
  personas/
    page.tsx                                   # NEW — faceted browser
  patterns/
    page.tsx                                   # NEW
  model-agreement/
    page.tsx                                   # NEW

src/app/api/study/
  persona/[id]/route.ts                        # NEW — per-persona detail loader

src/components/study/
  WorldMap.tsx                                 # NEW — base map (interactive + static modes)
  TransnationalTile.tsx                        # NEW
  MapLegend.tsx                                # NEW
  ClusterBadge.tsx                             # NEW
  ArchetypeBadgeStudy.tsx                      # NEW (distinct from main archetype card)
  PersonaCard.tsx                              # NEW — grid card
  PersonaGrid.tsx                              # NEW
  PersonaFilters.tsx                           # NEW
  PersonaModal.tsx                             # NEW — Zone 1–5 modal
  PersonaModal.RawResponses.tsx                # NEW
  PersonaModal.ScoredProfile.tsx               # NEW
  CompareView.tsx                              # NEW
  ComparePinButton.tsx                         # NEW
  CompareFloatingButton.tsx                    # NEW
  Radar.tsx                                    # NEW — reusable 12-axis radar
  Histogram.tsx                                # NEW
  HorizontalBarChart.tsx                       # NEW
  CorrelationHeatmap.tsx                       # NEW
  ViolinOrRidge.tsx                            # NEW
  TensionMatrix.tsx                            # NEW
  patterns/
    ClusterCard.tsx                            # NEW
    ArchetypeDistribution.tsx                  # NEW
    DemographicAggregates.tsx                  # NEW
  model-agreement/
    DistanceHistogram.tsx                      # NEW
    PerAxisCorrelationChart.tsx                # NEW
    DirectionalDriftCallout.tsx                # NEW
    DisagreementByAttribute.tsx                # NEW
    CaseStudy.tsx                              # NEW
```

---

## Implementation steps

Six phases. Within each phase, steps are ordered for incremental verifiability — finish a phase before moving on.

### Phase 0 — Setup & data contract scaffolding

- [ ] Install map libraries: `npm install react-simple-maps@^3 d3-geo d3-geo-projection topojson-client && npm install -D @types/d3-geo @types/topojson-client`
- [ ] Add `npm run build:study` script to `package.json` and wire into `prebuild`
- [ ] Create `src/lib/study/types.ts` with TypeScript types for source files (PersonaRecord, ScoredProfile, ResponseRecord, ClusterCentroid, ClusterNarrative, ArchetypeComparison, ModelAgreement, TensionPatterns) and derived shapes (PersonaSlim, RegionalAggregate, CountryAggregate, etc.). Mirror the data contract exactly.
- [ ] Author `scripts/data/country-name-normalization.ts` — alias map from raw `location` strings to canonical country name + ISO 3166 alpha-3. Include the spec's known cases (USA variants, Côte d'Ivoire, DR Congo, malformed parentheticals).
- [ ] Author `scripts/data/country-region-mapping.ts` — every country that appears in `personas.json` gets exactly one of the 10 region keys. **Verification rule:** for each persona, the country's mapped region must equal the persona's authored `region` field. Resolve disagreements by trusting the persona record (per map spec open item).

### Phase 1 — Build-time preprocessing pipeline

- [ ] Implement `scripts/build-synthetic-study.ts`:
  - [ ] Load all source files; assert counts (1,002 personas, 1,152 administrations, 150 shared)
  - [ ] Normalize country names → `country_iso`; log any persona with a null result and **fail the build**
  - [ ] Emit `personas_slim.json` (id, name, region, country_iso, age, gender, education, urban_rural, economic_position, governance_experience, cluster, n_models, averaged_axis_scores, nearest_archetype_id, location)
  - [ ] Compute regional aggregates → `regional_aggregates.json`
  - [ ] Compute country aggregates (n ≥ 10 only) → `country_aggregates.json`
  - [ ] Compute demographic aggregates → `demographic_aggregates.json`
  - [ ] Compute model-agreement-by-attribute means (from the 150 shared personas) → `model_agreement_by_attribute.json`
  - [ ] Compute 12×12 axis correlation matrix → `axis_correlations.json`
  - [ ] Compute 12 axis histograms (20 bins, -1.0 to +1.0) → `axis_histograms.json`
  - [ ] Assemble public download JSON per data contract §5 → `public/data/synthetic_study_v1.json`
  - [ ] Write file size to a small `download_meta.json` so Overview can render the live size
  - [ ] Run integrity checks (count check, axis bounds, archetype mapping completeness, cluster assignment completeness) — fail the build on any violation
- [ ] Add a Vitest unit test that imports the script's pure helpers (normalization, aggregation) and verifies known cases
- [ ] Run the script once locally; commit derived artifacts so dev server doesn't depend on a build step

### Phase 2 — Shared components

- [ ] Add cluster + map + model CSS variables to `src/app/globals.css` (light + dark themes)
- [ ] Build `src/data/syntheticStudyClusters.ts` — id→{label, descriptor, color CSS var, narrative} map drawn from `cluster_narratives.json` and the cluster cards in `patterns_page.md`
- [ ] Build `src/components/study/Radar.tsx` — reusable 12-axis radar SVG. Props: `scores: number[]`, optional `overlayScores`, `size`, `colorVar`, `overlayColorVar`. Used in cluster cards, modal, case studies, persona grid (optionally).
- [ ] Build `src/components/study/ClusterBadge.tsx` and `ArchetypeBadgeStudy.tsx` — small chips with cluster color + emergence tag + tappable navigation
- [ ] Build `src/components/study/Histogram.tsx`, `HorizontalBarChart.tsx`, `CorrelationHeatmap.tsx`, `ViolinOrRidge.tsx`, `TensionMatrix.tsx` — generic SVG primitives. Each takes raw bins/values, renders to project tokens.
- [ ] Build `src/components/study/WorldMap.tsx`:
  - Modes: `interactive | static-density | static-cluster | static-axis-gradient`
  - Loads region-level TopoJSON; renders one path per region with fill from `--map-density-*` or cluster color or diverging axis ramp
  - Country sub-layer (n ≥ 10) renders at 40% opacity for density mode only
  - Hover tooltip + selected state per spec; URL drives selection in interactive mode
  - Mobile tap-to-select with persistent below-map tooltip
  - Full keyboard + ARIA per accessibility section of map spec
- [ ] Build `src/components/study/TransnationalTile.tsx` — tile that mirrors map region treatment (clickable in interactive mode, display-only in static)
- [ ] Build `src/components/study/MapLegend.tsx` — generic legend (density steps, cluster swatches, or diverging gradient)
- [ ] Visually QA all primitives in isolation by adding a `/study/_devkit` page (gated to dev-only, removed before launch) that renders one of each at sample data

### Phase 3 — Overview page (`/study`)

- [ ] Build `src/app/study/layout.tsx` — section shell, no chrome of its own; restores `sessionStorage` filter state on hydration; clears it on navigation away from `/study/*`
- [ ] Build `src/app/study/page.tsx` — render the prose verbatim from `overview_page.md`
- [ ] Wire download link to `/data/synthetic_study_v1.json`; pull live file size from `download_meta.json`
- [ ] Three deep-link cards at the bottom navigate to Personas / Patterns / Model Agreement
- [ ] Add "Synthetic Study" tab to `src/components/NavBar.tsx`, active-state-aware on any `/study/*` path
- [ ] Smoke test: page renders, links work, download serves the file

### Phase 4 — Personas page + persona detail

- [ ] Build `src/app/api/study/persona/[id]/route.ts` — given an id, return the persona's bio, scored profile(s), and raw response set(s). Read source files lazily; cache parsed source files at module scope. 404 on unknown id.
- [ ] Build `src/lib/study/filterState.ts` — URL ↔ filter-object helpers, sessionStorage mirror, an `useStudyFilters()` hook
- [ ] Build `src/lib/study/matchStrength.ts` (distance → "strong/moderate/close/weak match") and `questionLookup.ts` (item id → text from existing `forced-choice-items.ts` / `scaled-items.ts`)
- [ ] Build `src/components/study/PersonaFilters.tsx` — facet panel for region, cluster, archetype, governance, economic, urban_rural, education, age range, gender, shared status, name search, sort
- [ ] Build `src/components/study/PersonaCard.tsx` (name, region, age, archetype badge, cluster chip, pin button) and `PersonaGrid.tsx` (filtered + sorted list with pagination — start at 60/page; revisit if perf is fine)
- [ ] Build `src/app/study/personas/page.tsx`:
  - Renders the WorldMap (interactive mode) at top with TransnationalTile alongside on desktop, below on mobile
  - Active filter chips strip with "Clear all"
  - Filter panel (collapsible on mobile) → grid → pagination
  - Modal mounts when `?persona=…` is present
  - Compare floating button mounts when ≥ 1 pin is set
- [ ] Build the persona modal (`PersonaModal.tsx`) per `persona_modal.md`:
  - Zone 1 header (name, identity line, three badges)
  - Zone 2 biographical (two columns desktop; narrative-primary mobile)
  - Zone 3 scored profile (radar + axis rows + budget strip + confidence + inline tension badges)
  - Shared-persona dual-model overlay (radar overlays, side-by-side axis values, two budget strips)
  - Zone 4 raw responses (collapsed by default; tabs for shared personas)
  - Zone 5 footer (share, prev/next within current filter set)
  - Modal data fetch on open via the new API route
- [ ] Build `CompareView.tsx`, `ComparePinButton.tsx`, `CompareFloatingButton.tsx` — pin up to 4, floating "Compare (N)" button, side-by-side comparison route at `/study/personas?compare=P…,P…`
- [ ] E2E smoke (Playwright): land on `/study/personas`, apply a region filter, verify URL + grid + map state stay in sync; open a persona modal; toggle Claude/Gemini in a shared persona; pin two personas and open compare

### Phase 5 — Patterns page (`/study/patterns`)

Each section corresponds 1:1 with `patterns_page.md`. Implement top-to-bottom; the visualizations reuse Phase 2 primitives and Phase 4 data.

- [ ] Page scaffold + intro prose
- [ ] **Section 1 — Six clusters:** 6 cluster cards (3×2 desktop). Each card uses Radar (centroid), cluster ID, descriptor, size + share, nearest-archetype with emergence tag, top-4 defining axes from `cluster_narratives.json`. Wired prose beneath.
- [ ] **Section 2 — Archetype distribution:** horizontal bar chart for 12 archetypes; bars colored by cluster; emergence tag badges; six empirical-zero bars rendered as dotted "0" rows. Sub-section prose on the C1/C4 split.
- [ ] **Section 3a — Two static maps:** density (mode `static-density`) + dominant cluster (mode `static-cluster`). Side-by-side desktop, stacked mobile. Spec-supplied prose alongside.
- [ ] **Section 3b — Axis 8 gradient:** WorldMap in `static-axis-gradient` mode with diverging palette + Pluralism/Cohesion legend.
- [ ] **Section 3c — Demographic aggregates:** four small-multiples stacked-bar charts (urban_rural, economic_position, governance_experience, education) from `demographic_aggregates.json`. **Verify spec prose claims hold against computed data; adjust prose if the direction flips.**
- [ ] **Section 4 — Axis distributions:** 12 small ridge/violin plots from `axis_histograms.json`, grouped by domain color. Mean line annotated.
- [ ] **Section 5 — Correlations:** desktop heatmap (lower triangle, 12×12, diverging scale); mobile top-N pairs list. **Verify spec's directional claims against computed matrix and adjust prose.**
- [ ] **Section 6 — Tensions:** matrix from `tension_patterns.json` (axis rows × cluster columns × model sub-rows) plus a per-axis overall mini chart above.

### Phase 6 — Model Agreement page (`/study/model-agreement`)

- [ ] Page scaffold + intro prose
- [ ] **Section 1 — Overall agreement:** three stat tiles + distance histogram (compute distances client-side from `model_agreement.json` + per-persona overlap, OR precompute the distance distribution at build time as a small JSON addition — prefer the build-time route for parity with other sections)
- [ ] Add `model_agreement_distance_distribution.json` to the build script if not yet emitted
- [ ] **Section 2a — Per-axis correlation:** 12-row bar chart from `model_agreement.json.per_axis.pearson_r`, colored by threshold
- [ ] **Section 2b — Directional drift callout:** visually distinguished block (tinted background); diverging bar chart of `mean_diff_gemini_minus_claude`. Prose verbatim.
- [ ] **Section 3 — Disagreement by attribute:** small-multiples (3×2 desktop, single column mobile) reading `model_agreement_by_attribute.json`; reference line at overall mean (1.51); spec prose as-is, but **substitute computed per-category numbers** before display
- [ ] **Section 4 — Individual cases:** at build time, the script picks four persona ids satisfying the four criteria (high-agreement, typical, high-disagreement, directional-drift) and writes `case_study_personas.json` with their ids + computed distance + per-axis Gemini-minus-Claude. Render four `CaseStudy.tsx` components with overlaid radars (Claude vs. Gemini tones). The 2–3 sentence bio + analytical prose for each is hand-written into the page once the four cases are picked — adjust if the picks change
- [ ] **Section 5 — Closer prose:** verbatim from spec
- [ ] Wire each case's "View full profile" link to `/study/personas?persona=<id>` (modal opens)

### Phase 7 — Polish & verify

- [ ] Run `npx tsc --noEmit` → clean
- [ ] Run `npm test` and `npm run test:e2e` → green
- [ ] Lighthouse pass on each new page (mobile + desktop): no client bundle regression > 50 KB on /, /quiz, /results
- [ ] Verify dark mode on all four pages (especially maps, heatmap, model-tinted radars)
- [ ] Run `/critique` (impeccable plugin) on each new page; address P0/P1 items before declaring v1
- [ ] Remove `/study/_devkit` if present
- [ ] Update `CLAUDE.md` Quick Start / Key Directories notes with the new section

---

## Resolved decisions (locked in 2026-04-20)

1. **Country-to-region mapping conflicts** → **warn and trust the persona's `region` field**. The build script logs each conflict but does not fail.
2. **Personas grid** → **pagination, 60/page**.
3. **Cluster color tones** → **ship initial values from the map-spec framework, iterate via `/colorize` pass** once maps render. Don't block Phase 2 on color settling.
4. **Model Agreement Section 4 case studies** → **auto-selection final**. Bios/analysis written against whatever the script picks.
5. **Recharts** → removed from CLAUDE.md. Plan stays with hand-rolled SVG.

---

## Notes for the implementer

- **Never import** `claude_responses.json`, `gemini_responses.json`, `scored_profiles.json`, or `personas.json` from a client component or page. They go through the API route or the build script only.
- The slim catalog (`personas_slim.json`) is the only persona dataset shipped to the client. Keep it under ~250 KB raw / ~80 KB gzipped — that's the perf budget.
- The map's region-level TopoJSON is generated once from the Natural Earth countries file + the country-region mapping. Commit both files; don't regenerate at runtime.
- The "narrative insets" prose throughout Patterns and Model Agreement is spec-supplied. Where the spec says "Note for Claude Code: verify against actual data," **actually verify** — the prose direction must match the computed numbers, otherwise rewrite the affected sentence.
- Modal URL state must layer cleanly over filter state (`?region=…&persona=…&model=…`) without the modal stomping on filters when closed.
- All visualizations should respect `prefers-reduced-motion` — drop the radar polygon draw-in, drop the modal fade.
