# Scaled Item Reduction Spec — 72 → 60 Questions

## Overview

Remove one scaled item per axis (12 total) to reduce quiz length from 72 to 60 questions. This reduces Phase 2 from 36 items to 24, saving approximately 5–6 minutes of completion time. Phase 1 (36 forced-choice) and Phase 3 (Chancellor's Budget) are unchanged.

---

## Items to Remove

| Axis | Remove | Item text (question stem) | Reason |
|---|---|---|---|
| 1 | SC-1.2 | "When private companies become so large they dominate an entire sector, how should the state respond?" | Narrow (antitrust policy); core axis measured better by SC-1.1 (state role in distribution) and SC-1.3 (tax principles). Budget also provides signal via Social Services + Economic Development. |
| 2 | SC-2.3 | "When environmental protection requires economic sacrifice, who should bear the greatest cost?" | Measures distributional fairness more than ecological-growth tension; partially loads onto Axis 1. |
| 3 | SC-3.2 | "When a policy problem spans multiple regions, who should have primary authority to address it?" | Redundant with SC-3.1 (local autonomy level) from a slightly different angle. |
| 4 | SC-4.3 | "When a specialist government agency makes a decision that most citizens oppose, what should happen?" | Narrower version of SC-4.1 (expert vs. public disagreement); FC scenario items already cover applied cases. |
| 5 | SC-5.3 | "Which poses a greater long-term threat to a good society?" (too much state power vs. too much disorder) | Philosophical; FC items already cover principle level. SC-5.1 (law enforcement power) and SC-5.2 (restricting expression) add concrete policy granularity the FC items lack. |
| 6 | SC-6.2 | "How important is it that citizens can remove their leaders through elections?" | Softer version of SC-6.1 (legitimacy of unelected government); SC-6.1 is sharper and more diagnostic. |
| 7 | SC-7.3 | "How would you characterize the general trajectory of social change over the past century?" | Backward-looking perception item; measures view of history rather than governance preference. |
| 8 | SC-8.3 | "In a society with multiple ethnic or cultural groups, what level of distinctiveness is healthiest long-term?" | Abstract; overlaps with SC-8.1 (minority practices vs. majority norms) which asks the same question through a concrete lens. |
| 9 | SC-9.3 | "To what extent are social hierarchies an inevitable feature of human societies?" | Overlaps with SC-9.1 (can policy change human behavior); both ask "how fixed is human nature?" |
| 10 | SC-10.3 | "When a wealthier and a poorer nation negotiate a trade agreement, what principle should guide the terms?" | Indirect; measures international economic fairness, which partially loads onto Axis 1. |
| 11 | SC-11.1 | "How much should a nation spend on its military relative to other priorities?" | Directly duplicated by Chancellor's Budget Defense ministry allocation. SC-11.2 and SC-11.3 measure willingness to *use* force, which the budget can't capture. |
| 12 | SC-12.2 | "How should the state relate to technologies that could dramatically change human life?" | Broadest and least precise of the three; SC-12.1 (burden of proof) asks the same question more sharply. |

---

## Remaining Scaled Items Per Axis

After removal, each axis retains exactly **2 scaled items**. For reference:

| Axis | Remaining SC items |
|---|---|
| 1 | SC-1.1 (state role in wealth distribution), SC-1.3 (tax principles) |
| 2 | SC-2.1 (environment vs. growth priority), SC-2.2 (should state limit consumption) |
| 3 | SC-3.1 (local region autonomy), SC-3.3 (importance of uniform rules) |
| 4 | SC-4.1 (expert vs. public judgment), SC-4.2 (direct citizen control level) |
| 5 | SC-5.1 (law enforcement power), SC-5.2 (restricting expression) |
| 6 | SC-6.1 (legitimacy of unelected competent government), SC-6.3 (unpopular long-term decisions) |
| 7 | SC-7.1 (pace of norm change), SC-7.2 (state response to traditional institutions) |
| 8 | SC-8.1 (minority practices vs. majority norms), SC-8.2 (school curriculum: many cultures vs. national) |
| 9 | SC-9.1 (can policy change behavior), SC-9.2 (response to persistent group differences) |
| 10 | SC-10.1 (willingness to accept policy constraints), SC-10.2 (border openness) |
| 11 | SC-11.2 (when is force beyond borders acceptable), SC-11.3 (response to emerging military threats) |
| 12 | SC-12.1 (burden of proof for new tech), SC-12.3 (dual-use research policy) |

---

## Scoring Engine Adjustments

### Stage 2: Scaled Item Scoring

No change to how individual SC items are scored. Each still maps to [-2, -1, 0, +1, +2] and is normalized to [-1.0, +1.0].

The axis-level SC score is now the **average of 2 items** instead of 3:

```
sc_axis_score = (sc_item_a + sc_item_b) / 2
```

Previously:
```
sc_axis_score = (sc_item_a + sc_item_b + sc_item_c) / 3
```

### Stage 3: Composite Score Weights

The modality weights need adjustment. With fewer SC items, the SC modality carries slightly less statistical reliability per axis. Shift a small amount of weight from SC to FC.

**Previous weights (3 SC items per axis):**

```
AXIS_WEIGHT_PROFILES = {
  // Axes with full budget signal (weight 0.25)
  1:  { fc: 0.40, sc: 0.35, bg: 0.25 },
  2:  { fc: 0.40, sc: 0.35, bg: 0.25 },
  5:  { fc: 0.40, sc: 0.35, bg: 0.25 },
  12: { fc: 0.40, sc: 0.35, bg: 0.25 },

  // Axes with partial budget signal (weight 0.15)
  4:  { fc: 0.45, sc: 0.40, bg: 0.15 },
  6:  { fc: 0.45, sc: 0.40, bg: 0.15 },
  7:  { fc: 0.45, sc: 0.40, bg: 0.15 },
  8:  { fc: 0.45, sc: 0.40, bg: 0.15 },
  10: { fc: 0.45, sc: 0.40, bg: 0.15 },
  11: { fc: 0.45, sc: 0.40, bg: 0.15 },

  // Axes with no budget signal
  3:  { fc: 0.55, sc: 0.45, bg: 0.00 },
  9:  { fc: 0.55, sc: 0.45, bg: 0.00 },
}
```

**New weights (2 SC items per axis):**

```
AXIS_WEIGHT_PROFILES = {
  // Axes with full budget signal (weight 0.25)
  // SC loses 0.05 → FC gains 0.05
  1:  { fc: 0.45, sc: 0.30, bg: 0.25 },
  2:  { fc: 0.45, sc: 0.30, bg: 0.25 },
  5:  { fc: 0.45, sc: 0.30, bg: 0.25 },
  12: { fc: 0.45, sc: 0.30, bg: 0.25 },

  // Axes with partial budget signal (weight 0.15)
  // SC loses 0.05 → FC gains 0.05
  4:  { fc: 0.50, sc: 0.35, bg: 0.15 },
  6:  { fc: 0.50, sc: 0.35, bg: 0.15 },
  7:  { fc: 0.50, sc: 0.35, bg: 0.15 },
  8:  { fc: 0.50, sc: 0.35, bg: 0.15 },
  10: { fc: 0.50, sc: 0.35, bg: 0.15 },
  11: { fc: 0.50, sc: 0.35, bg: 0.15 },

  // Axes with no budget signal
  // SC loses 0.05 → FC gains 0.05
  3:  { fc: 0.60, sc: 0.40, bg: 0.00 },
  9:  { fc: 0.60, sc: 0.40, bg: 0.00 },
}
```

**Rationale:** A 0.05 shift is conservative. With 3 FC items and 2 SC items, the FC modality now has 60% of the non-budget data points, so giving it 60% of the non-budget weight (on axes with no budget) is proportional. On axes with budget data, the budget weight stays constant since that exercise is unchanged.

### Stage 4: Contradiction Detection

The stated preference score formula for contradiction detection also needs updating. Previously the FC and SC weights were renormalized from the composite weights:

**Previous:**
```
stated_score = (0.53 × fc_axis_score) + (0.47 × sc_axis_score)
```

**New (for axes with no budget):**
```
stated_score = (0.60 × fc_axis_score) + (0.40 × sc_axis_score)
```

**New (for axes with full budget):**
```
stated_score = (0.60 × fc_axis_score) + (0.40 × sc_axis_score)
```

**New (for axes with partial budget):**
```
stated_score = (0.59 × fc_axis_score) + (0.41 × sc_axis_score)
```

These are derived by renormalizing the FC and SC weights to sum to 1.0:
- Full budget: 0.45 / (0.45 + 0.30) = 0.60, 0.30 / 0.75 = 0.40
- Partial budget: 0.50 / (0.50 + 0.35) = 0.588 ≈ 0.59, 0.35 / 0.85 = 0.412 ≈ 0.41
- No budget: 0.60 / (0.60 + 0.40) = 0.60, 0.40 / 1.00 = 0.40

For simplicity, using **0.60 / 0.40 across all axes** is a reasonable approximation and avoids unnecessary branching in the code. The difference between 0.59 and 0.60 is negligible.

```
stated_score = (0.60 × fc_axis_score) + (0.40 × sc_axis_score)
```

### Confidence Scoring

No change to the confidence scoring logic. The system already handles missing items by computing from available data with a confidence penalty. With 2 SC items instead of 3, the baseline confidence is slightly lower per axis, but all axes are affected equally so relative confidence between axes is preserved. No threshold adjustments needed.

---

## UI Changes

### Phase 2 interstitial text

Update the pre-Phase-2 interstitial to reflect the new count:

**Previous:** "This section has 36 questions..."
**New:** "This section has 24 questions and moves faster — most people spend less time per question than in Phase 1."

### Time estimates

**Previous:** Phase 2 est. 7–10 min → **New:** Phase 2 est. 5–7 min
**Previous:** Total est. 18–24 min → **New:** Total est. 15–20 min

### Progress bar

The progress bar should reflect 60 total questions + 1 budget exercise = 61 interactions (previously 73). Ensure the bar calculation uses the new total.

---

## What Does NOT Change

- Phase 1 (all 36 forced-choice items) — unchanged
- Phase 3 (Chancellor's Budget) — unchanged
- Budget scoring and sigmoid normalization — unchanged
- Super-dimension formulas for compass plot — unchanged
- Archetype prototype vectors — unchanged (they reference final axis scores, not individual items)
- Archetype distance calculation — unchanged
- Radar chart visualization — unchanged
- Any axis labels, pole labels, or domain groupings — unchanged
