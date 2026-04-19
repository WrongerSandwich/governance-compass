> **PARTIALLY OUTDATED:** This spec describes the original scoring pipeline architecture, which remains correct in structure. However, specific constants have changed: the budget exercise now uses 7 ministries (was 10), 50 total points (was 100), k=6 (was 10), and axis weight profiles have been adjusted for 2 SC items per axis (was 3). Axes 7 and 8 no longer have budget signal. See `src/lib/scoring-types.ts` for current constants, `completed/scaled_item_reduction_spec.md` for the SC reduction, and `completed/chancellors_budget_revamp_spec.md` for the budget changes.

# The Governance Compass — Scoring Engine Specification

## Overview

This document specifies the complete scoring pipeline for The Governance Compass. It is intended as an implementation reference — everything a developer needs to turn raw responses into final results.

The pipeline has six stages:

1. **Raw Scoring** — Convert each response into a numeric value
2. **Axis Score Computation** — Combine items within each axis into a single score per modality
3. **Modality Fusion** — Weight and merge the three modality scores into a final axis score
4. **Contradiction Detection** — Flag axes where modalities disagree
5. **Hierarchical Dimension Reduction** — Compute super-dimension scores for the compass plot
6. **Archetype Assignment** — Match the 12-axis profile to the closest governance archetype

---

## Stage 1: Raw Scoring

### Forced-Choice Items (FC and PT)

Each forced-choice item produces a binary value:

| Response | Raw Score |
|---|---|
| Selected Statement A (Pole A) | -1.0 |
| Selected Statement B (Pole B) | +1.0 |

There is no partial credit and no neutral option. The portrait-method (PT) items are scored identically — selecting Person A = -1.0, selecting Person B = +1.0.

### Scaled Items (SC)

Each scaled item has 5 response options. Scoring maps left-to-right onto a symmetric scale:

| Position | Label Convention | Raw Score |
|---|---|---|
| Leftmost option | Strong Pole A | -2.0 |
| Second option | Moderate Pole A | -1.0 |
| Middle option | Midpoint / balanced | 0.0 |
| Fourth option | Moderate Pole B | +1.0 |
| Rightmost option | Strong Pole B | +2.0 |

**Important:** The scoring direction is determined by the axis definition, not the visual position. Each item in the question bank specifies which pole each end of the scale corresponds to. If an item is reverse-keyed (Pole B appears on the left), the scoring is inverted before any further computation. In the provided question bank, all items are already written with Pole A on the left and Pole B on the right, so no inversion is needed — but the engine should support it for future item revisions.

### Budget Allocation

The Chancellor's Budget produces 10 integer values (one per ministry) that sum to 100. These are not scored directly — they are transformed in Stage 2.

---

## Stage 2: Axis Score Computation (Per Modality)

### Forced-Choice Axis Score

For each axis, there are 3 FC items. The FC axis score is the arithmetic mean of the 3 raw scores:

```
fc_axis_score = mean(fc_item_1, fc_item_2, fc_item_3)
```

This produces a value in the range [-1.0, +1.0].

Possible values: -1.0, -0.33, +0.33, +1.0 (since each item is ±1 and there are 3 items).

### Scaled Axis Score

For each axis, there are 3 SC items. The SC axis score is the arithmetic mean of the 3 raw scores, normalized to the [-1.0, +1.0] range:

```
sc_axis_score = mean(sc_item_1, sc_item_2, sc_item_3) / 2.0
```

The division by 2 maps the raw [-2.0, +2.0] range onto [-1.0, +1.0] to make it commensurable with the FC score.

### Budget Axis Score

The budget exercise maps onto specific axes through the ministry-axis mapping table. The budget axis score requires more transformation because:

- Not all axes have budget data (some axes have no ministry mapping)
- Some ministries map to multiple axes
- The raw budget values are absolute allocations, not relative preferences

#### Step 2a: Compute budget deviation scores

Each ministry has a neutral baseline of 10 units (100 total / 10 ministries). The deviation from baseline captures the respondent's active prioritization:

```
ministry_deviation = ministry_allocation - 10.0
```

This produces values in the range [-5, +90] in theory, but practically [-5, +50] given the 50 discretionary units and 5-unit minimum.

#### Step 2b: Map deviations to axes

Each ministry maps to one or two axes with a specified direction (toward Pole A or Pole B). The mapping table from the question bank:

| Ministry | Axis | Direction | Sign |
|---|---|---|---|
| Social Welfare & Public Health | 1 | Pole A (Collective) | -1 |
| Economic Development & Trade | 1 | Pole B (Market) | +1 |
| Economic Development & Trade | 2 | Pole B (Growth) | +1 |
| Ecological Transition & Conservation | 2 | Pole A (Ecological) | -1 |
| Defense & Military | 11 | Pole B (Interventionism) | +1 |
| Domestic Security & Law Enforcement | 5 | Pole B (Security) | +1 |
| Education & Research | 4 | Pole B (Institutional Auth.) | +1 |
| Education & Research | 12 | Pole B (Innovation) | +1 |
| Cultural Heritage & National Identity | 7 | Pole B (Tradition) | +1 |
| Cultural Heritage & National Identity | 8 | Pole B (Cohesion) | +1 |
| Infrastructure & Technology | 2 | Pole B (Growth) | +1 |
| Infrastructure & Technology | 12 | Pole B (Innovation) | +1 |
| Foreign Affairs & Intl. Cooperation | 10 | Pole A (Internationalism) | -1 |
| Civil Liberties & Judicial Independence | 5 | Pole A (Liberty) | -1 |
| Civil Liberties & Judicial Independence | 6 | Pole A (Electoral) | -1 |

#### Step 2c: Compute raw budget axis scores

For each axis, collect all ministry deviations that map to it, apply their direction signs, and compute the mean:

```
budget_axis_raw = mean(deviation_1 * sign_1, deviation_2 * sign_2, ...)
```

For example, Axis 1 (Collective ↔ Market) has two mappings:
- Social Welfare deviation × (-1)
- Economic Development deviation × (+1)

If Social Welfare = 18 (deviation +8) and Economic Development = 7 (deviation -3):
```
budget_axis_1_raw = mean(8 * -1, -3 * +1) = mean(-8, -3) = -5.5
```

This would indicate a strong Collective Provision preference (negative = Pole A).

#### Step 2d: Normalize budget axis scores to [-1.0, +1.0]

The theoretical maximum deviation per ministry is +40 (allocating 50 to one ministry, minimum 5 baseline + 45 extra, deviation = +40). The theoretical minimum is -5 (reducing to the 5-unit floor). Since axes combine multiple ministries, the practical range varies.

Use a **sigmoid normalization** to map raw budget scores onto [-1.0, +1.0] with a sensitivity parameter that compresses extreme values:

```
budget_axis_score = tanh(budget_axis_raw / k)
```

Where `k` is a sensitivity constant. **Recommended k = 10.** This means:
- A raw score of ±5 maps to approximately ±0.46
- A raw score of ±10 maps to approximately ±0.76
- A raw score of ±20 maps to approximately ±0.96

The tanh function naturally bounds the output to (-1, +1) and handles the asymmetric range of budget deviations gracefully.

#### Axes without budget data

Axes 3 (Distributed ↔ Centralized), 4 (partial — Education maps here but only for one pole), and 9 (Constructivism ↔ Essentialism) have no or minimal budget mapping. For these axes, the budget modality weight is redistributed to the other two modalities (see Stage 3).

---

## Stage 3: Modality Fusion

### Default Weights

For axes with data from all three modalities:

| Modality | Weight | Rationale |
|---|---|---|
| Forced-Choice (FC) | 0.40 | Establishes direction; resistant to acquiescence bias |
| Scaled (SC) | 0.35 | Captures intensity and nuance |
| Budget (BG) | 0.25 | Reveals operational priorities; most resistant to social desirability |

```
final_axis_score = (0.40 × fc_axis_score) + (0.35 × sc_axis_score) + (0.25 × budget_axis_score)
```

### Adjusted Weights (No Budget Data)

For axes where no ministry maps (Axis 9) or the mapping is too indirect to be meaningful:

| Modality | Weight |
|---|---|
| Forced-Choice (FC) | 0.55 |
| Scaled (SC) | 0.45 |

```
final_axis_score = (0.55 × fc_axis_score) + (0.45 × sc_axis_score)
```

### Partial Budget Mapping

Some axes receive budget signal from only one ministry or only in one direction (e.g., Axis 4 gets signal from Education, but only toward Pole B). In these cases, use the partial budget data at a reduced weight:

| Modality | Weight |
|---|---|
| Forced-Choice (FC) | 0.45 |
| Scaled (SC) | 0.40 |
| Budget (BG) | 0.15 |

The implementation should maintain a configuration mapping each axis to a weight profile:

```
AXIS_WEIGHT_PROFILES = {
  1:  { fc: 0.40, sc: 0.35, bg: 0.25 },  // Full budget (2 ministries, both directions)
  2:  { fc: 0.40, sc: 0.35, bg: 0.25 },  // Full budget (3 ministries)
  3:  { fc: 0.55, sc: 0.45, bg: 0.00 },  // No budget mapping
  4:  { fc: 0.45, sc: 0.40, bg: 0.15 },  // Partial (Education, one direction)
  5:  { fc: 0.40, sc: 0.35, bg: 0.25 },  // Full budget (2 ministries, both directions)
  6:  { fc: 0.45, sc: 0.40, bg: 0.15 },  // Partial (Civil Liberties, one direction)
  7:  { fc: 0.45, sc: 0.40, bg: 0.15 },  // Partial (Cultural Heritage, one direction)
  8:  { fc: 0.45, sc: 0.40, bg: 0.15 },  // Partial (Cultural Heritage, one direction)
  9:  { fc: 0.55, sc: 0.45, bg: 0.00 },  // No budget mapping
  10: { fc: 0.45, sc: 0.40, bg: 0.15 },  // Partial (Foreign Affairs, one direction)
  11: { fc: 0.45, sc: 0.40, bg: 0.15 },  // Partial (Defense, one direction)
  12: { fc: 0.40, sc: 0.35, bg: 0.25 },  // Full budget (2 ministries + Education partial)
}
```

### Output

Stage 3 produces 12 final axis scores, each in the range [-1.0, +1.0]:
- Negative values = Pole A orientation
- Zero = genuine midpoint / ambivalence
- Positive values = Pole B orientation

---

## Stage 4: Contradiction Detection

### Purpose

The contradiction detection system identifies axes where the respondent's stated preferences (FC and SC) diverge meaningfully from their revealed preferences (Budget). This is reported to the user as a "Tension" — an area where their principles and practical priorities point in different directions.

### Algorithm

For each axis that has budget data (budget weight > 0):

#### Step 4a: Compute stated preference score

The stated preference is the weighted combination of FC and SC only, renormalized:

```
stated_score = (0.53 × fc_axis_score) + (0.47 × sc_axis_score)
```

(These weights are the FC and SC weights from the default profile, renormalized to sum to 1.0: 0.40/0.75 ≈ 0.53, 0.35/0.75 ≈ 0.47.)

#### Step 4b: Compute contradiction magnitude

```
contradiction = |stated_score - budget_axis_score|
```

#### Step 4c: Classify tension level

| Contradiction Magnitude | Tension Level | Display |
|---|---|---|
| 0.00 – 0.50 | None | No flag |
| 0.51 – 1.00 | Mild | Subtle indicator |
| 1.01 – 1.50 | Moderate | "Tension" badge with brief explanation |
| 1.51 – 2.00 | Strong | "Strong Tension" badge with detailed explanation |

Note: The maximum possible contradiction is 2.0 (stated = -1.0, budget = +1.0 or vice versa).

#### Step 4d: Determine tension direction

When a tension is flagged, determine which modality "wins" to inform the narrative explanation:

```
if stated_score < 0 and budget_axis_score > 0:
    tension_narrative = "principles_A_but_budget_B"
    // "Your stated values lean toward [Pole A], but when allocating 
    //  scarce resources, your priorities shifted toward [Pole B]."

if stated_score > 0 and budget_axis_score < 0:
    tension_narrative = "principles_B_but_budget_A"
    // "Your stated values lean toward [Pole B], but when allocating
    //  scarce resources, your priorities shifted toward [Pole A]."
```

### Tension Narrative Templates

Each axis should have a human-readable tension explanation. Examples:

**Axis 1 (Collective ↔ Market), direction: principles_A_but_budget_B:**
> "Your responses suggest a strong commitment to collective welfare, but when you had to allocate limited resources, you prioritized economic development over social spending. This is a common tension — many people value equality in principle but prioritize growth when forced to choose."

**Axis 2 (Ecological ↔ Growth), direction: principles_A_but_budget_B:**
> "Your responses suggest you take ecological limits seriously, but your budget prioritized growth-oriented spending over environmental protection. This tension often reflects a belief that prosperity is a prerequisite for sustainability — or simply that other priorities felt more urgent under scarcity."

**Axis 5 (Liberty ↔ Security), direction: principles_A_but_budget_B:**
> "Your responses strongly favor protecting individual liberty, but your budget allocated heavily toward security and law enforcement. This may reflect a distinction between the society you'd ideally want and the practical governance you'd actually fund."

---

## Stage 5: Hierarchical Dimension Reduction

### Purpose

The 12-axis profile is the instrument's full output. But for visualization and shareability, the profile is also reduced to two super-dimensions that produce a 2D compass plot.

### Super-Dimension Definitions

**Super-Dimension X: Economic Orientation**
Horizontal axis of the compass plot.
- Left (negative) = Collective / state-directed / limits-conscious
- Right (positive) = Market / growth-oriented / productivist

```
sd_economic = (0.65 × axis_1_score) + (0.35 × axis_2_score)
```

Axis 1 (Collective ↔ Market) is weighted more heavily because it is the more empirically robust dimension. Axis 2 (Ecological ↔ Growth) contributes because growth philosophy has a meaningful economic component, but it also has cultural and values dimensions that make it a less pure economic measure.

**Super-Dimension Y: Cultural-Authority Orientation**
Vertical axis of the compass plot.
- Bottom (negative) = Progressive / pluralist / constructivist / liberty-oriented
- Top (positive) = Traditional / cohesive / essentialist / authority-oriented

```
sd_cultural = (0.30 × axis_7_score) + (0.20 × axis_8_score) + (0.20 × axis_9_score) + (0.15 × axis_5_score) + (0.15 × axis_4_score)
```

The weighting reflects how cleanly each axis loads onto the cultural super-dimension:
- Axis 7 (Progressive ↔ Traditional) is the strongest single marker
- Axes 8 (Pluralism ↔ Cohesion) and 9 (Constructivism ↔ Essentialism) are core cultural axes
- Axis 5 (Liberty ↔ Security) has a meaningful cultural loading but also captures something distinct
- Axis 4 (Popular Sovereignty ↔ Institutional Authority) has a partial cultural loading (populism correlates with traditionalism empirically, though they're conceptually distinct)

### Compass Plot Output

The compass plot places the respondent at coordinates:
```
(x, y) = (sd_economic, sd_cultural)
```

Both values range from -1.0 to +1.0, producing a position in a 2×2 space.

**Quadrant labels** (for orientation, not as definitive categories):

| Quadrant | X | Y | Shorthand |
|---|---|---|---|
| Bottom-Left | Collective | Progressive | "Libertarian Left" terrain |
| Top-Left | Collective | Traditional | "Communitarian" terrain |
| Bottom-Right | Market | Progressive | "Liberal" terrain |
| Top-Right | Market | Traditional | "Conservative" terrain |

These labels are intentionally vague — the compass plot is the simplest view and should push users toward the full radar chart for real insight.

### Axes NOT Included in Super-Dimensions

Axes 3 (Distributed ↔ Centralized), 6 (Electoral ↔ Performance), 10 (Internationalism ↔ Sovereignty), 11 (Non-Interventionism ↔ Interventionism), and 12 (Precautionary ↔ Innovation) do not load cleanly onto either super-dimension. They are displayed only in the full 12-axis radar chart. This is by design — these dimensions are genuinely orthogonal to the two-dimensional left-right / progressive-traditional framework, which is precisely why a 2D compass is insufficient and the full profile is necessary.

---

## Stage 6: Archetype Assignment

### Approach

Without a large empirical reference population, archetype assignment uses a **rule-based prototype matching** system. Each archetype is defined as a 12-dimensional prototype vector — an idealized axis-score profile. The respondent is assigned to the archetype whose prototype is closest to their actual profile.

This is a pragmatic v1 approach. Once sufficient response data is collected (N > 500), the prototypes should be replaced with empirically derived cluster centroids using k-medoids or Latent Class Analysis.

### Distance Metric

Use **weighted Euclidean distance** between the respondent's 12-axis score vector and each archetype's prototype vector:

```
distance(respondent, archetype) = sqrt(
    sum over all 12 axes of:
        weight[axis] × (respondent_score[axis] - prototype_score[axis])²
)
```

Axis weights in the distance calculation allow certain axes to matter more for distinguishing between archetypes. Default: all weights = 1.0 (equal weighting). These can be tuned later based on empirical analysis of which axes contribute most to cluster separation.

### Match Score

Convert distance to a 0–100 match percentage for display:

```
max_possible_distance = sqrt(12 × (2.0)²) = sqrt(48) ≈ 6.93

match_percentage = max(0, (1 - distance / max_possible_distance)) × 100
```

This yields 100% for a perfect match and 0% for the maximum possible divergence.

### Archetype Assignment Rule

1. Compute distance to all archetypes
2. Assign the respondent to the archetype with the **smallest distance**
3. Also report the **second-closest** archetype as an "adjacent type"
4. If the closest and second-closest archetypes have distances within 10% of each other, flag the result as a **"blended type"** and present both

### Archetype Prototypes (v2)

The v2 set was finalized after the April 2026 synthetic population study. It removes the v1 Civic Institutionalist (absorbed into the renamed Institutional Moderate), adds the empirically-derived Popular Egalitarian, and refines five other vectors toward their matching empirical centroids. The full v1 → v2 rationale, vector deltas, and content rewrites live in `completed/archetype_revision_spec.md` and `completed/archetype_content_v2.md`.

Each archetype carries a provenance tag (`emergence`):

- **`empirical`** — prototype seeded directly from a synthetic-study cluster centroid (1 archetype: Popular Egalitarian)
- **`refined`** — hand-crafted prototype, then adjusted toward the matching empirical centroid (5 archetypes)
- **`theoretical`** — hand-crafted from comparative political philosophy; no matching empirical cluster surfaced (6 archetypes)

The list-page ordering below groups related types visually; it has no semantic effect on scoring.

Axis key for reference:
```
 1: Collective (-) ↔ Market (+)
 2: Ecological (-) ↔ Growth (+)
 3: Distributed (-) ↔ Centralized (+)
 4: Popular Sov. (-) ↔ Institutional Auth. (+)
 5: Liberty (-) ↔ Security (+)
 6: Electoral (-) ↔ Performance (+)
 7: Progressive (-) ↔ Traditional (+)
 8: Pluralism (-) ↔ Cohesion (+)
 9: Constructivism (-) ↔ Essentialism (+)
10: Internationalism (-) ↔ Sovereignty (+)
11: Non-Intervention (-) ↔ Interventionism (+)
12: Precautionary (-) ↔ Innovation (+)
```

---

#### 1. The Radical Egalitarian *(refined)*

```
Prototype: [-0.85, -0.45, -0.45, -0.20, -0.55, -0.55, -0.70, -0.60, -0.75, -0.45, -0.60, -0.40]
```

Deeply committed to economic equality, progressive social transformation, and cosmopolitan pluralism. Favors strong collective provision, distributed governance, and expansive civil liberties. Internationalist in orientation and non-interventionist in practice. Sees most social hierarchies as constructed and unjust, and believes policy can and should dismantle them. Ecologically minded and precautionary toward technology that concentrates power or disrupts human relationships. More at home in cosmopolitan cities and diaspora networks than in nationally bounded political communities.

*Characteristic tension:* Transformative egalitarian goals often require concentrated state power to implement, conflicting with commitments to distributed governance and individual liberty.

---

#### 2. The Popular Egalitarian *(empirical)*

```
Prototype: [-0.70, +0.40, -0.50, -0.35, -0.55, -0.45, -0.40, -0.20, -0.50, +0.25, -0.70, -0.35]
```

Believes material equality is the foundation of freedom, and that ordinary people — not experts, elites, or international institutions — should determine how their society is organized. Strongly favors collective provision and redistribution, but grounded in a developmentalist rather than post-growth frame: prosperity is the goal, and the state's job is to spread it broadly rather than hoard it at the top. Skeptical of concentrated power in all its forms — domestic oligarchies, foreign capital, and international bodies that set terms without accountability. Moderately pluralist and cautiously progressive, but not driven by cultural transformation; dignity and self-determination matter more than identity politics. Non-interventionist abroad. Sees sovereignty and equality as complementary: a people cannot be equal among themselves if they are not free as a nation.

*Characteristic tension:* Universalist egalitarian commitments — every person deserves dignity, every society deserves self-determination — sit alongside a sovereigntist resistance to the international coordination that would be needed to make those commitments real at scale. Solidarity is demanded at home and declined abroad.

---

#### 3. The Social Democrat *(theoretical)*

```
Prototype: [-0.7, -0.3, 0.0, +0.2, -0.2, -0.5, -0.5, -0.3, -0.4, -0.4, -0.2, 0.0]
```

Strongly favors collective provision, redistribution, and public services within a democratic framework. Progressive on cultural issues, moderately pluralist, leans constructivist. Internationalist but not radically so. Trusts institutions and expertise to implement an egalitarian agenda. Moderate on governance structure.

*Characteristic tension:* Desire for comprehensive public services requires centralized state capacity, which can conflict with progressive commitments to distributed power and individual autonomy.

---

#### 4. The Green Communalist *(theoretical)*

```
Prototype: [-0.6, -0.9, -0.8, -0.5, -0.3, -0.4, -0.4, -0.2, -0.3, -0.4, -0.7, -0.6]
```

Ecological sustainability is the organizing principle. Favors degrowth or post-growth economics, radical decentralization, local self-sufficiency, and collective provision at the community level. Non-interventionist, precautionary toward technology, and moderately progressive. Skeptical of both state and market as drivers of ecological destruction. Internationalist in sympathy but localist in practice.

*Characteristic tension:* Ecological goals at planetary scale require coordination that conflicts with deep commitment to local autonomy and anti-centralization.

---

#### 5. The Communitarian Steward *(refined)*

```
Prototype: [-0.55, -0.65, -0.75, -0.60, -0.40, -0.25, +0.60, +0.15, +0.30, +0.40, -0.70, -0.60]
```

Envisions small-scale, rooted, sustainable communities shaped by tradition and local self-determination. Favors ecological limits, distributed governance, and the preservation of inherited ways of life. Skeptical of centralized state power and of technology that erodes communal relationships. Populist in register — trusts community wisdom and elders over expert authority. Non-interventionist abroad and cautiously sovereigntist. The commitment is to communal integrity rather than to uniform national culture: the archetype protects each community's right to remain itself, which often means defending pluralism at the national or international scale while valuing cohesion within the community.

*Characteristic tension:* Commitment to local autonomy means accepting that different communities will develop in directions the archetype itself disagrees with. Defense of one's own tradition and openness to others' traditions depend on the same principle but can be hard to hold together in practice.

---

#### 6. The Institutional Moderate *(refined)*

```
Prototype: [-0.30, +0.50, +0.40, +0.55, -0.25, -0.35, -0.50, +0.25, -0.20, -0.15, -0.25, -0.10]
```

Trusts institutions, expertise, and process as the foundations of good governance. Favors measured progress over radical transformation — progressive in general orientation, but skeptical of disruptive change from any direction. Prefers growth-oriented policy and targeted public investment to either market purism or sweeping redistribution. Internationalist in sympathy but pragmatic about national constraints. Comfortable with moderate centralization when it improves coordination and accountability. Less a defined ideology than a governing instinct: that competent, accountable administration is what democracy is actually for.

*Characteristic tension:* Commitment to competent administration can shade into technocratic paternalism — valuing outcomes legitimately produced by institutions over outcomes directly endorsed by voters. Tends to mistake proceduralism for democratic responsiveness.

*v1 → v2 note:* This entry replaces v1's Pragmatic Centrist (a near-zero placeholder) and absorbs v1's Civic Institutionalist. The empirical center is institutionally-trusting, mildly progressive, and growth-oriented — not ideologically null.

---

#### 7. The Cosmopolitan Technologist *(theoretical)*

```
Prototype: [+0.2, +0.4, +0.2, +0.6, -0.2, -0.3, -0.6, -0.5, -0.4, -0.8, +0.2, +0.8]
```

Believes global coordination and technological progress can solve most problems. Strongly internationalist, pro-innovation, progressive, and pluralist. Trusts expert institutions and favors some centralization for coordination. Moderately market-oriented but comfortable with state investment in research and infrastructure. Leans constructivist.

*Characteristic tension:* Faith in expert governance can conflict with progressive values when technocratic recommendations cut against cultural inclusivity or individual autonomy.

---

#### 8. The Free Marketeer *(theoretical)*

```
Prototype: [+0.8, +0.5, -0.3, 0.0, -0.6, -0.3, 0.0, 0.0, +0.2, +0.2, 0.0, +0.6]
```

Strongly favors market allocation, economic growth, and individual economic liberty. Skeptical of state intervention in the economy. Strongly pro-innovation. Distributed governance as a check on state power. Moderate to neutral on cultural issues — economics is the primary lens. Leans slightly toward sovereignty over internationalism.

*Characteristic tension:* Belief in individual liberty can conflict with acceptance of the corporate power that unregulated markets produce — market dominance is its own form of centralized authority.

---

#### 9. The Libertarian Individualist *(theoretical)*

```
Prototype: [+0.6, +0.3, -0.7, -0.4, -0.9, -0.4, -0.2, 0.0, +0.2, +0.3, -0.5, +0.5]
```

Individual liberty is the paramount value. Deeply skeptical of state power in all forms — economic, security, cultural. Favors market allocation, distributed governance, minimal law enforcement, and strong constitutional constraints. Pro-innovation but wary of government-directed technology. Non-interventionist. Neutral to slightly progressive on cultural issues — not deeply invested in social transformation, but opposed to the state enforcing traditional norms. Slightly essentialist — skeptical of social engineering.

*Characteristic tension:* Radical decentralization and minimal state capacity can leave individuals vulnerable to private concentrations of power that function much like the state authority they oppose.

---

#### 10. The Developmental Modernizer *(refined)*

```
Prototype: [0.0, +0.70, +0.75, +0.65, +0.60, +0.60, +0.15, +0.60, +0.20, +0.55, +0.20, +0.40]
```

Favors strong centralized state capacity directed toward rapid modernization and national ascent. Pro-growth, performance-legitimacy oriented, and security-forward. Comfortable with liberty-for-security tradeoffs in service of development and with cultural cohesion in service of social stability. Sovereignty-oriented — sees international institutions as constraints on national trajectories rather than as sources of legitimacy. Uses technology instrumentally rather than ideologically, adopting what works and regulating what threatens social order. Trusts institutional expertise and long-horizon state planning over popular input.

*Characteristic tension:* Performance-based legitimacy works while performance is strong — this archetype has no stable fallback when the developmental model hits limits or fails to deliver.

---

#### 11. The Nationalist Populist *(refined)*

```
Prototype: [-0.20, +0.40, -0.20, -0.55, 0.0, 0.0, +0.60, +0.70, +0.60, +0.70, -0.10, -0.25]
```

Strongly sovereignty-oriented and culturally cohesive. Deeply skeptical of both international institutions and domestic elites — trusts the common sense of ordinary people over credentialed expertise. Favors cultural continuity and traditional values over rapid progressive change. Ambivalent about both state power and markets: distrusts government and business establishments alike, and does not treat either as a natural ally. Non-interventionist abroad — "our people first" rather than expansionist. Cautious about technology that disrupts familiar ways of life.

*Characteristic tension:* Distrust of concentrated power cuts across all directions — state, market, expert, international — leaving few institutions intact to act through. A politics of suspicion is easier to sustain than a politics of construction.

*v1 → v2 note:* The biggest substantive change in v2. The v1 prototype described state-authoritarian populism (Orbán/Modi type); the empirical C2 cluster is closer to Brexit / Five Star / Yellow Vests — anti-institutional across the board, including toward state power. Axes 3, 5, 6, and 11 all flipped sign. The state-authoritarian-traditionalist position remains held by the Authoritarian Traditionalist archetype below.

---

#### 12. The Authoritarian Traditionalist *(theoretical)*

```
Prototype: [0.0, +0.3, +0.8, -0.3, +0.8, +0.7, +0.9, +0.8, +0.8, +0.6, +0.4, -0.2]
```

Favors strong centralized authority, cultural cohesion, traditional values, and robust security. Essentialist view of human nature. Performance-legitimacy oriented — distrustful of democratic process as chaotic and corrosive to social order. Moderately interventionist and sovereignty-focused. Somewhat precautionary toward technology that disrupts social structures. Populist in rhetoric (claims to speak for "the people") but favors institutional authority in practice. Neutral to moderate on economics.

*Characteristic tension:* Claims to represent ordinary people's values while concentrating power in ways that limit ordinary people's agency.

---

**Note on low-match handling:** v2 has no catch-all/centrist archetype. Profiles that don't fit any prototype well are surfaced via two UI affordances rather than a synthetic match: a low-match warning (when `primaryMatchPct < 55`) and a "distinctive profile" mode (when match is low *and* axis-score variance is high, indicating opinionated-but-cross-cutting positions rather than absent positions). See `governance_compass_results_ui_spec.md`.

---

### Archetype Descriptions: Display Structure

Each archetype result should display:

1. **Name** — The archetype label
2. **Match percentage** — How closely the respondent's profile matches the prototype
3. **Summary** — 1-2 sentences capturing the core worldview (shown immediately)
4. **Expanded description** — 2-3 paragraphs explaining the internal logic, historical resonances, and characteristic tensions (expandable/collapsible)
5. **Adjacent type** — The second-closest archetype, with its match percentage and a brief note on what distinguishes it from the primary match
6. **Radar chart overlay** — The respondent's 12-axis shape superimposed on the archetype's prototype shape, making points of alignment and divergence immediately visible

---

## Results Display Summary

The full results package consists of four layers, presented in order from simplest to most detailed:

### Layer 1: Compass Plot (Super-Dimensions)
- 2D scatter plot, respondent as a dot
- Quadrant labels for orientation
- Derived from Stage 5

### Layer 2: Archetype Card
- Name, match %, summary, expandable detail
- Adjacent type
- Derived from Stage 6

### Layer 3: Radar Chart (Full 12-Axis Profile)
- 12-spoke spider chart
- Each spoke labeled with axis name and both pole labels
- Respondent's profile as a filled polygon
- Optional: archetype prototype overlay for comparison
- Score on each axis shown on hover/tap

### Layer 4: Detailed Axis Breakdown
- Each of the 12 axes listed individually
- Final score with visual bar indicator
- Tension flag (if applicable) with narrative explanation
- Confidence indicator based on modality agreement

### Confidence Indicator

For each axis, report a confidence level based on inter-modality agreement:

```
For axes with all 3 modalities:
    spread = max(fc_score, sc_score, bg_score) - min(fc_score, sc_score, bg_score)

For axes with 2 modalities:
    spread = |fc_score - sc_score|
```

| Spread | Confidence Label |
|---|---|
| 0.00 – 0.40 | High confidence |
| 0.41 – 0.80 | Moderate confidence |
| 0.81 – 1.20 | Low confidence |
| 1.21+ | Conflicted (tension flagged) |

---

## Appendix: Complete Data Model

### Response Data Structure

```typescript
interface QuizResponses {
    // Phase 1: Forced-choice items (36 items)
    // Key format: "fc_{axis}_{item}" e.g., "fc_1_1"
    // Value: "A" | "B"
    forcedChoice: Record<string, "A" | "B">;

    // Phase 2: Scaled items (36 items)
    // Key format: "sc_{axis}_{item}" e.g., "sc_1_1"
    // Value: 1 | 2 | 3 | 4 | 5 (left to right on scale)
    scaled: Record<string, 1 | 2 | 3 | 4 | 5>;

    // Phase 3: Budget allocation (10 ministries)
    // Key: ministry identifier
    // Value: integer allocation (must sum to 100, each >= 5)
    budget: Record<string, number>;
}
```

### Scored Output Structure

```typescript
interface QuizResults {
    // 12 axis scores
    axes: {
        id: number;              // 1-12
        name: string;            // e.g., "Collective Provision ↔ Market Allocation"
        poleA: string;           // e.g., "Collective Provision"
        poleB: string;           // e.g., "Market Allocation"
        score: number;           // -1.0 to +1.0
        confidence: "high" | "moderate" | "low" | "conflicted";
        tension: {
            detected: boolean;
            magnitude: number;    // 0.0 to 2.0
            level: "none" | "mild" | "moderate" | "strong";
            narrative: string;    // Human-readable explanation
            direction: "principles_A_but_budget_B" | "principles_B_but_budget_A" | null;
        };
        components: {
            fc: number;           // FC modality score for this axis
            sc: number;           // SC modality score for this axis
            bg: number | null;    // Budget modality score (null if no mapping)
        };
    }[];

    // Super-dimension scores for compass plot
    compass: {
        economic: number;         // -1.0 to +1.0
        cultural: number;         // -1.0 to +1.0
    };

    // Archetype assignment
    archetype: {
        primary: {
            id: string;
            name: string;
            matchPercentage: number;
            summary: string;
            description: string;
            tension: string;
            prototype: number[];   // 12-element array
        };
        secondary: {
            id: string;
            name: string;
            matchPercentage: number;
            summary: string;
        };
        isBlended: boolean;       // true if top two are within 10% distance
    };
}
```

---

## Appendix: Tuning Constants Reference

All magic numbers in one place for easy adjustment:

| Constant | Value | Used In | Purpose |
|---|---|---|---|
| Budget baseline | 10 | Stage 2 | Neutral allocation per ministry (100/10) |
| Budget minimum | 5 | Budget UI | Floor per ministry |
| Budget sigmoid k | 10 | Stage 2d | Sensitivity of budget score normalization |
| FC weight (full) | 0.40 | Stage 3 | FC contribution when all modalities present |
| SC weight (full) | 0.35 | Stage 3 | SC contribution when all modalities present |
| BG weight (full) | 0.25 | Stage 3 | Budget contribution when all modalities present |
| FC weight (no budget) | 0.55 | Stage 3 | FC contribution when budget unavailable |
| SC weight (no budget) | 0.45 | Stage 3 | SC contribution when budget unavailable |
| FC weight (partial budget) | 0.45 | Stage 3 | FC contribution with partial budget data |
| SC weight (partial budget) | 0.40 | Stage 3 | SC contribution with partial budget data |
| BG weight (partial budget) | 0.15 | Stage 3 | Budget contribution with partial data |
| Tension threshold (mild) | 0.51 | Stage 4 | Minimum contradiction to flag |
| Tension threshold (moderate) | 1.01 | Stage 4 | Moderate tension threshold |
| Tension threshold (strong) | 1.51 | Stage 4 | Strong tension threshold |
| SD Economic: Axis 1 weight | 0.65 | Stage 5 | Axis 1 contribution to economic super-dimension |
| SD Economic: Axis 2 weight | 0.35 | Stage 5 | Axis 2 contribution to economic super-dimension |
| SD Cultural: Axis 7 weight | 0.30 | Stage 5 | Axis 7 contribution to cultural super-dimension |
| SD Cultural: Axis 8 weight | 0.20 | Stage 5 | Axis 8 contribution to cultural super-dimension |
| SD Cultural: Axis 9 weight | 0.20 | Stage 5 | Axis 9 contribution to cultural super-dimension |
| SD Cultural: Axis 5 weight | 0.15 | Stage 5 | Axis 5 contribution to cultural super-dimension |
| SD Cultural: Axis 4 weight | 0.15 | Stage 5 | Axis 4 contribution to cultural super-dimension |
| Blended archetype threshold | 10% | Stage 6 | Distance margin for blended type flag |
| Low match threshold | 55% | Stage 6 | Below this, flag as "unusual profile" |
