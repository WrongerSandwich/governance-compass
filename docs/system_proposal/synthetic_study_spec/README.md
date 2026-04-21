# Synthetic Study — Implementation Spec Bundle

This folder contains everything Claude Code needs to implement the **Synthetic Study** section of governance-compass.org.

The Synthetic Study section adds a new top-level area to the site (alongside Methodology and References) that makes the April 2026 synthetic population study's dataset — 1,002 Gemini-generated personas, administered the Governance Compass by both Claude Sonnet 4.6 and Gemini 2.5 Flash — available for browsing, analysis, and download.

## Structure

The section has four pages:

- **Overview** — load-bearing entry point: what the study is, how it was built, scope of claims, download link.
- **Personas** — faceted browser for all 1,002 personas with a world map as primary spatial entry point, faceted filters, persona grid, and detail modal.
- **Patterns** — analytical reading surface covering the six empirical clusters, archetype distribution, regional/demographic aggregates, axis distributions, correlations, and tension patterns.
- **Model Agreement** — comparison of Claude-vs-Gemini scoring on the 150 shared personas: overall distance, per-axis correlation, directional drift, disagreement by persona attribute, and individual case studies.

## Files in this bundle

Read in this order:

1. **`synthetic_study_data_contract.md`** — Foundation. Defines source files, derived data, per-page dependencies, URL state, and the public download format. Read this first; everything else assumes it.
2. **`synthetic_study_map_spec.md`** — The world map component used on Personas (interactive) and Patterns (static). Includes region taxonomy, color treatment, interactions, mobile behavior, and accessibility.
3. **`synthetic_study_overview_page.md`** — Overview page content and layout.
4. **`synthetic_study_personas_page.md`** — *Not included as a separate spec file; the Personas page layout and behavior are covered implicitly by the map spec + persona modal spec + standard faceted browser patterns. See notes at the bottom of this README.*
5. **`synthetic_study_patterns_page.md`** — Patterns page content, section by section, with prose and visualization specs.
6. **`synthetic_study_model_agreement_page.md`** — Model Agreement page content, section by section.
7. **`synthetic_study_persona_modal.md`** — Detailed spec for the persona detail modal, used on the Personas page.

## Prerequisites

The site already has:

- A design system with the warm stone / cartographic-editorial aesthetic. Four domain colors (Stone, Slate, Sage, Clay) are defined as CSS variables. The Synthetic Study section should reuse these and extend with six cluster-specific color tokens (see map spec).
- A question bank with the 36 forced-choice items, 24 scaled items, and 7-ministry Chancellor's Budget. The modal's raw responses section requires an ID-to-text lookup against this question bank.
- An Archetypes page with the 12 archetypes and their emergence tags (empirical / refined / theoretical). The Synthetic Study section references these consistently.
- An existing logo and favicon system (Radar Rose SVG). Not affected by this section.

## Data sources

The pipeline outputs consumed by this section are:

- `personas.json`
- `scored_profiles.json`
- `claude_responses.json`
- `gemini_responses.json`
- `cluster_labels.csv`
- `cluster_centroids.json`
- `cluster_narratives.json`
- `archetype_comparison.json`
- `model_agreement.json`
- `tension_patterns.json`
- `regional_distribution.csv` (or derived equivalent)

See the data contract for how each is consumed.

## Scope for v1

**In scope:**
- All four pages
- The interactive map on Personas and the three static maps on Patterns
- The persona detail modal with dual-model support for the 150 shared personas
- Compare feature (pin up to 4 personas, view their profiles side by side)
- Full-dataset JSON download
- Stable URLs for individual personas
- Session-persistent filter state within the Synthetic Study section

**Out of scope for v1:**
- Per-persona PDF/image export
- Server-side filtered dataset downloads
- User accounts or saved browsing state across sessions
- Live recomputation of clusters or archetypes (these are fixed pipeline outputs)
- Real-time data updates (the dataset is a static release; re-runs of the pipeline would be separate releases)

## Note on the Personas page layout

The Personas page is the most complex surface in the section, but its layout emerges naturally from three already-specced components: the **interactive map** (map spec), the **persona detail modal** (persona modal spec), and a standard **faceted browser** pattern (a filter panel, a persona grid, pagination or infinite scroll).

High-level Personas page structure:

```
[Map, full width]
[Transnational legend tile, alongside map on desktop, below on mobile]
[Active filter chips, if any, with "Clear all" action]
[Facet filter panel, collapsible on mobile]
[Persona grid: name, region, age, archetype badge, cluster chip per card]
[Pagination or "Load more"]
```

Filter state is URL-driven (see data contract Section 4). Clicking a persona card opens the modal. The map, filter panel, and grid all reflect the same filter state.

Compare feature: a small "pin" icon on each persona card adds that persona to the compare set (max 4). A floating "Compare (N)" button appears when pins exist; tapping opens a compare view with the pinned personas' profiles side by side. Clearing the compare set is possible from both the floating button and the compare view.

If Claude Code has specific questions about the Personas page layout beyond what's implied here, those should surface during implementation rather than being over-specced upfront — it's a conventional faceted browser with three content components plugged in.

## Implementation priorities

Suggested build order:

1. **Data pipeline preprocessing** — normalization (country_iso), derived aggregates computation, build-time integrity checks. (Data contract.)
2. **Shared components** — the world map component (used on Personas and Patterns), the cluster color tokens, the radar chart component (used on persona modal and Patterns).
3. **Overview page** — lightest page, good warm-up, validates shared components work.
4. **Personas page + modal** — largest surface, highest user value.
5. **Patterns page** — most content-heavy, but largely self-contained once shared components exist.
6. **Model Agreement page** — smallest, most bounded, good closer.

## Open questions that may come up during implementation

- Specific CSS variable naming for cluster tokens (suggested in map spec, but should match existing site conventions).
- Exact cluster color assignments — map spec gives the framework (C2→Stone, C5→Slate, C3→Sage, C1→Clay, C0→Stone 300, C4→Clay-rust) but the final tones may need visual iteration.
- Individual persona selection for Model Agreement Section 4 case studies — Claude Code can pick these from the data based on distance distribution (one at ~0.5, one at ~1.5, one at ~2.5+, one showing directional drift).
- Pagination vs. infinite scroll on the Personas grid.

Any additional clarifications should be surfaced to Evan directly rather than guessed at.
