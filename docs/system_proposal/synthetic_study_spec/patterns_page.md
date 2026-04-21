# Synthetic Study — Patterns Page

The Patterns page is the analytical reading surface of the Synthetic Study section. It characterizes the 1,002 personas as a population: the six empirical clusters, the distribution across the twelve archetypes, regional and demographic aggregates, the shape of each axis, and the correlation structure between axes.

The page uses the "narrative insets" approach agreed in planning: prose between visualizations, pointing at what's visible without summarizing or editorializing. The visualizations are static (no interactions beyond hover tooltips).

## Page structure

Six sections. All included for v1 — compression decisions can be made after launch if the page reads too heavy.

1. The six clusters
2. Archetype distribution
3. Regional and demographic aggregates (three sub-sections)
4. Axis-level distributions
5. Correlations
6. Tension patterns

## Top-of-page intro

Two sentences, set in the same serif-heading scale as the page title. No mission framing, no reading guide.

> This page characterizes the 1,002 personas as a population. Six clusters emerged from the scored profiles; the twelve hand-crafted archetypes were then compared against them. The sections below describe the clusters, where they concentrate regionally and demographically, the shape of each axis across the population, and which axis pairs covary.

---

## Section 1 — The six clusters

The center of gravity for the page. Structure: six cluster cards arranged in a grid (3×2 on desktop, single column on mobile), each containing a small radar thumbnail of the cluster's centroid, the cluster ID, a short prose descriptor drawn from `cluster_narratives.json`, the cluster's size and share, and the nearest-archetype label with its emergence tag.

### Cluster card content

Order cards by size descending (C2 first, C3 last). Each card contains:

- **Radar thumbnail:** 12-axis radar with the cluster centroid, using the cluster's assigned color (see map spec for color assignments).
- **Cluster ID and descriptor:** e.g., "**C2** — Toward sovereignty, tradition, and cohesion"
- **Size and share:** "210 personas · 21.0%"
- **Nearest archetype:** "The Nationalist Populist" with its emergence tag rendered as a small badge
- **Defining axes:** bulleted list of the top 4 axes by magnitude, drawn from `cluster_narratives.json`

### Card-by-card content

**C2 — Toward sovereignty, tradition, and cohesion** (210 personas, 21.0%)
Nearest archetype: **The Nationalist Populist** *(refined)*
Defining axes:
- International engagement strongly toward sovereignty (+0.69)
- Human nature toward essentialism (+0.62)
- Social change toward continuity (+0.60)
- Cultural diversity toward cohesion (+0.57)

The largest cluster in the dataset.

**C4 — Toward collective provision, liberty, and constructivism** (196 personas, 19.6%)
Nearest archetype: **The Radical Egalitarian** *(empirical)*
Defining axes:
- Economic model strongly toward collective provision (-0.77)
- Rights balance toward liberty (-0.75)
- Human nature toward constructivism (-0.72)
- Military policy toward non-interventionism (-0.68)

The empirical anchor for the Radical Egalitarian archetype.

**C1 — Toward non-interventionism and collective provision** (178 personas, 17.8%)
Nearest archetype: **The Popular Egalitarian** *(empirical)*
Defining axes:
- Military policy toward non-interventionism (-0.70)
- Economic model toward collective provision (-0.68)
- Rights balance toward liberty (-0.55)
- Human nature toward constructivism (-0.49)

Shares thematic territory with C4 but at lower intensity and with distinct governance preferences.

**C0 — Toward institutional authority and growth** (161 personas, 16.1%)
Nearest archetype: **The Institutional Moderate** *(refined)*
Defining axes:
- Decision authority toward institutional (+0.57)
- Environmental policy toward growth (+0.53)
- Social change toward progressive (-0.50)
- Governance structure toward centralized (+0.43)

The most axis-balanced cluster — no axis pulls past ±0.60.

**C5 — Toward centralized governance, security, and growth** (141 personas, 14.1%)
Nearest archetype: **The Developmental Modernizer** *(empirical)*
Defining axes:
- Governance structure toward centralized (+0.74)
- Cultural diversity toward cohesion (+0.73)
- Rights balance toward security (+0.72)
- Environmental policy toward growth (+0.67)

The cluster most consistently on the positive side of the axis space.

**C3 — Toward distributed governance and popular sovereignty** (116 personas, 11.6%)
Nearest archetype: **The Communitarian Steward** *(refined)*
Defining axes:
- Governance structure strongly toward distributed (-0.80)
- Military policy toward non-interventionism (-0.76)
- Social change toward continuity (+0.73)
- Decision authority toward popular sovereignty (-0.70)

The smallest cluster but the one with the sharpest internal coherence.

### Prose beneath the card grid

> Three clusters lean collectivist-egalitarian (C1, C3, C4), two lean traditionalist or authority-oriented (C2, C5), and one sits near the center (C0). C1 and C4 are close neighbors in the radical-egalitarian region of the space; their separation is driven mostly by axes 3 (governance structure) and 4 (decision authority), where C1 leans distributed and popular while C4 sits closer to neutral.

---

## Section 2 — Archetype distribution

### Visualization

Horizontal bar chart showing the twelve archetypes, each bar representing the count of personas whose nearest archetype is that one. Bars for the six empirical-zero archetypes render as zero-length with a faint dotted line and a "0" label.

Each bar is colored by the cluster that nearest-matches that archetype (same colors as Section 1), with the six zero archetypes in a neutral gray. Emergence tags appear next to archetype names as small badges.

### Prose

> Six archetypes have nonzero populations; six have none. The six empirical-zero archetypes — The Civic Institutionalist, The Social Democrat, The Free Marketeer, The Cosmopolitan Technologist, The Authoritarian Traditionalist, The Libertarian Individualist, and The Green Communalist — are all theoretically coherent positions, but no synthetic persona in the dataset landed closest to any of them. This could mean those positions don't exist in the population Gemini generated, or that they exist but get pulled toward a nearest empirical cluster in the 12-axis space. Either way, the gap is worth naming: the archetype catalog covers more philosophical ground than the synthetic population occupies.

### Sub-section: which archetype gets claimed by which cluster

> Two clusters (C1 and C4) both had The Radical Egalitarian as their nearest match before the archetype revision. After revision, C4 remains The Radical Egalitarian and C1 became The Popular Egalitarian — the closest empirical anchor to what had been an unclaimed theoretical region. The other four clusters each map cleanly to a single archetype.

---

## Section 3 — Regional and demographic aggregates

Three sub-sections in sequence.

### 3a — Density and cluster by region

Two static maps, specified fully in the map spec document. Side by side on desktop, stacked on mobile. Prose sits alongside on desktop, below on mobile.

**Prose:**

> Western Europe and Eastern Europe/Central Asia both show strong C2 (Nationalist Populist) dominance at 38% and 37% respectively — the clearest regional-level pattern in the dataset. Latin America, sub-Saharan Africa, and South/Southeast Asia cluster to C1 (Popular Egalitarian), though dominance weakens: S/SE Asia's C1 share is only 21%, barely edging out three other clusters. East Asia and MENA both go to C5 (Developmental Modernizer) at 31% and 36%. North America is the one region where C4 (Radical Egalitarian) dominates. Oceania's dominant cluster is C3 (Communitarian Steward), the only region where that cluster leads. Diaspora is a near-tie between C0 and C4 at 30% each — the page handles this visually by hatching the region.

The key restraint: do not editorialize about *why* a region concentrates where it does. The data shows concentrations; the prose names them; the reader can draw conclusions.

### 3b — Axis 8 gradient

The cultural-diversity choropleth, specified fully in the map spec document.

**Prose:**

> Cultural Diversity (Axis 8, pluralism ↔ cohesion) shows the widest regional range of any axis: 0.80 from endpoint to endpoint. Eastern Europe and Central Asia lean strongest toward cohesion (+0.43), followed by East Asia, Western Europe, and MENA. The Americas and Oceania lean toward pluralism, with the diaspora category at the pluralism extreme (-0.37). The pattern is coherent with the broader literature on immigrant-receiving vs. nation-state-consolidation contexts, but we note the caveat: these are Gemini's personas, not survey respondents.

### 3c — Demographic aggregates

Four small-multiples stacked bar charts, one each for urban/rural, economic position, governance experience, and education. Each chart shows cluster distribution within each demographic category.

Grid layout: 2×2 on desktop, single column on mobile.

**Prose beneath the small multiples:**

> The demographic aggregates show weaker patterning than the regional ones. Governance experience is the most differentiated: personas from stable democracies over-index on C2 and C4, while personas from conflict zones and hybrid regimes skew toward C1 and C3. Economic position shows a modest gradient — wealthier personas over-index on C5, though the effect is smaller than region. Urban/rural and education don't produce strong cluster differentiation.

Honest about what's there and what isn't. No claim-stretching. (Exact over/under-indexing claims should be verified against computed aggregates at build time and adjusted if the actual data doesn't match — prose scaffolding only where the computed values would hold the direction.)

---

## Section 4 — Axis-level distributions

### Visualization

12 small violin plots (or ridge plot — either works), one per axis, showing the distribution of scores across all 1,002 personas. Annotated with the population mean on each axis. Axes grouped by domain using the four domain colors:

- **Economic Organization:** axes 1, 2 (Stone tones)
- **Power and Authority:** axes 3, 4, 5, 6 (Slate tones)
- **Society and Identity:** axes 7, 8, 9 (Sage tones)
- **The State in the World:** axes 10, 11, 12 (Clay tones)

Mobile: 2×6 grid, or single-column scroll.

### Prose

> Most axes are unimodal — the population spreads along a continuum without clear bimodality. The exceptions worth naming: Axis 3 (Governance Structure) and Axis 6 (Legitimacy Basis) show modest bimodality, which reflects the cluster structure — distributed/popular clusters (C1, C3) versus centralized/institutional clusters (C0, C5). Axis 7 (Social Change) and Axis 8 (Cultural Diversity) show the strongest bimodality, corresponding to the progressive-vs-traditionalist split that separates C2/C5 from the collectivist clusters.
>
> Axis 11 (Military Policy) is worth flagging for its one-sidedness: every regional aggregate is negative, meaning the population leans uniformly non-interventionist with variation only in degree. This says something about the personas Gemini generated rather than about the axis itself.

---

## Section 5 — Correlations

### Desktop visualization

A 12×12 correlation heatmap of the axis scores across the population, with diverging color scale (warm for positive, cool for negative, white at zero). Axis labels on both axes. Lower triangle only — saves space and avoids redundancy.

### Mobile visualization

Replace the heatmap with a **top-N correlated pairs list**: the ~8-10 strongest positive and strongest negative axis-pair correlations, displayed as a list. Each row: axis pair names, correlation value, and a visual indicator of magnitude and direction (small horizontal bar, warm/cool based on sign).

### Prose (same on both desktop and mobile)

> A few axis pairs covary strongly enough to note. Axis 1 (Economic Model) correlates positively with Axis 5 (Rights Balance) and Axis 9 (Human Nature) — collective-provision preferences come packaged with liberty-leaning rights and constructivist views of human nature. Axis 3 (Governance Structure) and Axis 4 (Decision Authority) correlate tightly, which is expected: centralized governance and institutional authority co-occur, distributed governance and popular sovereignty co-occur. Axis 7 (Social Change) and Axis 8 (Cultural Diversity) cluster together in the traditionalism-cohesion region.
>
> Most axes are substantially independent. The 12 axes were designed to capture distinct dimensions of governance philosophy, and the correlation structure suggests they largely succeed — no two axes are so correlated as to be measuring the same thing.

**Note for Claude Code:** the specific directional claims in this prose should be verified against the computed correlation matrix at build time. If a claim doesn't hold (e.g., Axis 1 and Axis 5 actually correlate weakly), adjust the prose. The scaffolding above is calibrated to the patterns I'd expect given the cluster structure, but the actual correlations should drive the final wording.

---

## Section 6 — Tension patterns

### Visualization

A small matrix or heat-strip showing tension percentages by axis and by cluster, drawn from `tension_patterns.json`. Claude and Gemini shown as two panels or as two stacked rows per axis.

Suggested layout: axis rows × cluster columns, with one sub-row per model. Cell color intensity maps to tension percentage. Hovering a cell shows the exact percentage.

A separate small chart above the matrix shows the overall tension rate per axis, both models, to give readers the big picture before they dig into the cluster breakdown.

### Prose

> Tensions surface when a persona's forced-choice answer pulls one direction and their budget allocation pulls another on the same axis. They're a signal about the instrument's internal consistency — where tensions are rare, the modalities converge; where they're frequent, stated preferences and revealed preferences part ways.
>
> Axis 12 (Technology Governance) produces the highest tension rate in the dataset: 85% of Claude administrations and 73% of Gemini's trigger a mild-or-greater tension on that axis. This is a large and consistent divergence between what personas say about technology governance in forced-choice and scaled items versus how they allocate the education-and-research budget that proxies for it. Worth reviewing whether the ministry mapping for Axis 12 is a good proxy for the underlying axis, or whether the axis itself needs tightening.
>
> Axes 4 (Decision Authority) and 6 (Legitimacy Basis) are the next most tension-prone at 60–67% across models. These are axes where the budget's institutional-versus-popular signal consistently pulls against stated preferences. Axes 1, 5, and 11 run quietest, with tension rates under 35%.

---

## Page ends here

No summary section, no takeaways box. The page ends at Section 6. Readers who want to go deeper can download the data or navigate to Personas or Model Agreement.
