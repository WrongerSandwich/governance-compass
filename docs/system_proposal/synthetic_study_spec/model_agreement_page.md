# Synthetic Study — Model Agreement Page

The Model Agreement page compares the two sets of scored profiles produced by Claude Sonnet 4.6 and Gemini 2.5 Flash on the 150 personas administered by both models. Agreement is measured at the axis level, at the persona level, and against persona attributes.

The administration is the atomic unit on this page, distinct from every other page where the persona is the unit.

## Page structure

Five sections:

1. Overall agreement (distance distribution)
2a. Per-axis correlation
2b. Directional drift (dedicated callout)
3. Where disagreement concentrates (by persona attribute)
4. Individual cases
5. What this means for the instrument

## Top-of-page intro

> 150 personas were administered the Governance Compass twice — once by Claude Sonnet 4.6 and once by Gemini 2.5 Flash. This page compares the two sets of scored profiles. Agreement is measured at the axis level (do the two models score the same persona similarly?), at the persona level (how far apart are they in the 12-dimensional axis space?), and against persona attributes (does the size of disagreement correlate with who the persona is?).

---

## Section 1 — Overall agreement

### Visualization

Three statistics displayed prominently at the top of the page, in a horizontal row:

- **Mean Euclidean distance:** 1.51
- **Median distance:** 1.46
- **Maximum possible distance:** √48 ≈ 6.93

Alongside these three stats, a histogram of the 150 per-persona distances. Distance on x-axis (0 to 3.5), count on y-axis. Overlay the mean and median as vertical lines.

### Prose

> Across the 150 shared personas, Claude and Gemini score the same persona at a mean Euclidean distance of 1.51 in the 12-dimensional axis space, with a median of 1.46 and a 90th-percentile distance of 2.35. The theoretical maximum distance in this space is √48 ≈ 6.93, so typical disagreement lands at roughly 22% of the maximum possible. Most personas cluster in the low-to-middle range of the distribution; a small tail of 10–15 personas shows distances above 2.5, and the maximum single-persona disagreement is 3.10.
>
> This is not close agreement. It's also not wild disagreement. Two independent administrations of the instrument produce profiles that share the same broad shape — the 12-axis radar charts are recognizably similar for most personas — but with meaningful axis-level variation around that shape.

---

## Section 2a — Per-axis correlation

### Visualization

A 12-row chart showing Pearson r between Claude and Gemini scores on each axis. Bars horizontal, colored by correlation strength:

- r ≥ 0.80: warm positive tone (high agreement)
- 0.70 ≤ r < 0.80: neutral tone (moderate)
- r < 0.70: cool warning tone (weaker)

Axis label on the left, r value on the right of each bar.

### Prose

> Agreement varies substantially by axis. Four axes reach Pearson r above 0.80: Axis 4 (Decision Authority, r=0.87), Axis 2 (Environmental Policy, r=0.85), Axis 1 (Economic Model, r=0.84), and Axis 8 (Cultural Diversity, r=0.82). On these, the models converge on where a persona sits even if they don't agree on the exact score.
>
> Three axes fall below r=0.70: Axis 10 (International Engagement, r=0.62), Axis 12 (Technology Governance, r=0.65), and Axis 6 (Legitimacy Basis, r=0.66). On these, model identity contributes meaningfully to the scored output — two administrations of the same persona can land noticeably differently.

---

## Section 2b — Directional drift (callout)

This section is visually differentiated from Section 2a — it's a dedicated callout because the finding is important for how the rest of the Synthetic Study should be interpreted. Suggest: soft-tinted background block, or a visual rule above and below, to set it apart.

### Visualization

A horizontal bar chart, one bar per axis, showing the mean Gemini-minus-Claude difference on that axis. Bars diverge from a zero center line. Positive bars (Gemini scores higher) in one tone, negative in another.

Axis labels. Zero line clearly marked. The three largest positive drifts (axes 7, 10, 6) should visually stand out.

### Prose

> Beyond per-axis correlation, there's a second finding worth flagging on its own: the two models don't just disagree noisily, they drift systematically in a specific direction. Gemini scores personas higher than Claude on ten of the twelve axes. The exceptions are Axis 4 (Decision Authority, where Gemini scores 0.16 lower) and Axis 2 (Environmental Policy, essentially tied at +0.002).
>
> The three largest drifts are Axis 7 (Social Change, Gemini +0.34 toward continuity/tradition), Axis 10 (International Engagement, +0.31 toward sovereignty), and Axis 6 (Legitimacy Basis, +0.27 toward alternative legitimacy). Taken together, this is a coherent pattern rather than scattered noise: for a given persona, Gemini reads toward tradition, sovereignty, and alternative legitimacy sources more strongly than Claude does, while Claude reads slightly more toward institutional authority than Gemini.
>
> This shapes how the rest of this page — and the rest of the Synthetic Study — should be read. Claude administered 576 personas in this dataset, Gemini administered 576, and only 150 overlap. The non-shared administrations carry a model-specific drift that the shared-persona comparison makes visible but does not correct for. When reading regional aggregates or cluster characterizations, remember that each cluster contains a roughly even mix of Claude-scored and Gemini-scored personas, and those two halves are systematically different in the directions described above.

The last paragraph is the load-bearing piece — it makes the drift finding consequential rather than just interesting.

---

## Section 3 — Where disagreement concentrates

This section examines whether model disagreement correlates with persona attributes. Explicit scoping language comes before the findings.

### Visualization

Small multiples chart with one panel per attribute: region, governance experience, economic position, urban/rural, education, age bracket.

Each panel shows the mean Claude-Gemini distance for personas in each category of that attribute, with error bars or a distribution indicator. A reference line shows the overall mean distance (1.51) so readers can see which categories run above and below.

Layout: 3×2 grid on desktop, single column on mobile.

### Prose

Scoping first, findings second:

> The following analysis examines whether the size of Claude-Gemini disagreement varies with who the persona is. Before the findings: the sample size is 150 personas, and when this is split across 10 regions or 6 governance-experience categories, individual category means rest on fewer than 25 personas each. The patterns below are suggestive of where the two models may process context differently, not conclusive evidence of model bias against specific populations.
>
> With that scope in mind:
>
> Regional variation is modest. Most regions sit within ±0.2 of the overall mean distance. Two categories run higher than the rest: personas from conflict zones show mean distances around 1.75, and personas from authoritarian states show means around 1.68. Personas from stable democracies sit at the low end, around 1.38. Diaspora personas also sit below average at 1.42.
>
> Governance experience shows the clearest pattern: the more politically contested or repressive the governance context a persona was generated under, the further apart Claude and Gemini score that persona. Stable democracy < flawed democracy < hybrid regime < conflict zone / authoritarian state, roughly in that order.
>
> Urban/rural, economic position, and education show no meaningful differentiation. Age bracket shows a weak upward trend — the oldest personas have slightly higher mean distances — but within the confidence bounds the small sample allows.

**Note for Claude Code:** the specific per-category distances above are illustrative. Actual values must be computed from the scored profiles (the 150 shared personas, Claude-minus-Gemini pairs) and substituted in. If the directional claims don't hold under the real numbers, the prose needs adjustment.

### Closing prose for the section

> Two interpretations are available for the governance-experience pattern, and the data alone doesn't distinguish between them. One: the models genuinely process context from politically complex environments differently, with one or both models reading persona narratives from those environments through divergent frames. Two: personas from complex governance environments simply have more internally contradictory content (someone from a conflict zone is more likely to carry tensions between survival, freedom, authority, and community that any given model will resolve differently), producing more score variance independent of any real model-level difference.
>
> What the data supports: model-level variation matters more for some kinds of personas than others. What it does not support: a claim that either model is "more accurate" or "less biased" — neither model is being compared to ground truth, because there is no ground truth. Both models are responding to the same synthetic biographical text, and both are valid measurements of that text under their respective priors.

The second paragraph is critical. The finding is interesting and publishable; the scoping must hold its weight.

---

## Section 4 — Individual cases

### Structure

Four worked examples. Each shows a single persona: name, region, brief biographical summary, two overlaid radar charts (Claude's scored profile in one tone, Gemini's in another), and a short paragraph identifying where the administrations agree and diverge.

### Framing prose (before the cases)

> The aggregate statistics smooth over what individual disagreements actually look like. These four personas illustrate the range: one where the models agree closely, one near the typical midpoint, one where they diverge significantly, and one where the drift is consistent and directional rather than noisy.

### Case selection

Claude Code should pick the four cases at build time from the 150 shared personas based on these criteria:

1. **High-agreement case** (Euclidean distance ~0.5): pick a persona from a stable-democracy background with clear governance views.
2. **Typical case** (distance near the median, ~1.5): any persona that represents the middle of the distribution. Avoid regional/demographic outliers.
3. **High-disagreement case** (distance ≥ 2.5): likely a conflict-zone or authoritarian-state persona. Shows the failure mode honestly.
4. **Directional-drift case**: a persona where the two profiles are the same broad shape but Gemini reads more conservatively across multiple axes (particularly 6, 7, 10).

Each case's content (bio summary, prose paragraph) should be written by Claude Code based on the selected personas. Each bio summary is 2–3 sentences. Each analytical paragraph is 2–3 sentences identifying where they agree and disagree.

Each case also has a **"View full profile"** link opening the persona modal with that persona's full details.

### Layout

Four cases stacked vertically. Each case is full-width on desktop with:
- Left: bio summary
- Center: overlaid radar chart
- Right: analytical paragraph

On mobile, stack the three elements: bio → radar → analysis.

---

## Section 5 — What this means for the instrument

Closes the page. Prose-only, no visualization.

> The shared-persona comparison tells us something about the instrument and something about large language models as survey respondents. On the instrument: axes 1, 2, 4, and 8 produce the most consistent scoring across models, and are the ones readers can place the most weight on when interpreting individual results. Axes 10, 12, and 6 produce meaningfully more model-dependent scoring, and individual scores on those axes carry more noise.
>
> On LLMs as respondents: two frontier models, given the same persona description and the same instrument, will produce profiles that are broadly similar but meaningfully distinct. The model matters. This is worth naming when any claim is made about what "AI models think" on a given governance question — the answer depends on which model you asked. The 150-persona comparison here is small, and it's on synthetic personas rather than neutral responses, but the direction of the finding is clear enough to carry that caveat.
>
> For real users taking the Governance Compass, this analysis has limited direct relevance — the instrument administers to human respondents, not to LLMs. But if the tool is ever used by people to explore how language models would score hypothetical profiles (a use we don't endorse but can't prevent), knowing that model choice substantially affects the scoring for three axes is material.

This section is the "what do I do with this" closer. Short, honest, resists overclaiming.

---

## Page ends here

No summary, no takeaways. The page stops after Section 5.

---

## Visual conventions for this page

Claude and Gemini should be visually distinguishable throughout the page via two distinct color tones used consistently across all charts.

Suggested palette:
- **Claude:** a warm stone or clay tone — picks up on the site's primary cartographic palette
- **Gemini:** a cooler slate or sage tone

Tones should be color-blind-safe and distinguishable at a glance. Tokens should be defined as CSS variables (`--model-claude`, `--model-gemini`) so they're reusable across the modal, case studies, and drift callout.
