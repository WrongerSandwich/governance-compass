# Chancellor's Budget Revamp Spec

## Overview

This spec covers three changes to the Phase 3 budget exercise:

1. **Ministry consolidation** — 10 ministries → 7
2. **Scarcity adjustment** — total budget reduced so equal allocation is impossible
3. **Live consequence feedback** — each ministry displays a narrative consequence that updates as the slider moves

---

## 1. Ministry Consolidation

### Previous (10 ministries)

1. Defense
2. Social Services
3. Healthcare
4. Economic Development
5. Infrastructure
6. Education & Research
7. Environment
8. Civil Liberties & Justice
9. Foreign Affairs
10. Cultural Heritage

### New (7 ministries)

| # | Ministry | Merged from | Short description (shown to user) |
|---|---|---|---|
| 1 | Defense | Defense | Military capability, border security, and national defense |
| 2 | Public Welfare | Social Services + Healthcare | Healthcare, housing, unemployment support, disability, pensions, and social safety net |
| 3 | Economy & Growth | Economic Development + Infrastructure | Business development, trade, infrastructure, transportation, and job creation |
| 4 | Education & Research | Education & Research | Schools, universities, vocational training, and scientific research |
| 5 | Environment | Environment | Conservation, pollution control, climate policy, and natural resource management |
| 6 | Justice & Civil Liberties | Civil Liberties & Justice | Courts, legal aid, policing, constitutional rights protection, and civil liberties oversight |
| 7 | Foreign Affairs | Foreign Affairs | Diplomacy, international organizations, foreign aid, and treaty obligations |

### Removed

**Cultural Heritage** — absorbed into general governance. The diagnostic signal it provided for Axes 7 (Progressive ↔ Traditional) and 8 (Pluralism ↔ Cohesion) was weak: most respondents lack strong intuition about cultural heritage spending compared to core services, producing noisy data. Those axes have strong FC and SC coverage and don't need budget cross-check.

**Infrastructure** — absorbed into Economy & Growth. Infrastructure spending produced almost no variance between respondents (everyone wants roads) and had no clean axis mapping. Combining it with Economic Development creates a single "build and grow" ministry that maps clearly to the Market/Growth end of Axes 1 and 2.

**Social Services + Healthcare → Public Welfare** — these mapped to the same axis (Axis 1, Collective direction) from the same direction. Funding one generously predicted funding the other generously at near-perfect correlation. One slider captures the same signal with less cognitive load.

---

## 2. Scarcity Adjustment

### Previous model

- 10 ministries, each starting at 5
- Total budget: 100
- "Comfortable" baseline: 10 per ministry (100 total — exactly achievable)
- Problem: no forced tradeoffs; even distribution is always possible

### New model

- 7 ministries
- **Total budget: 50 points** (small enough that every single point feels meaningful)
- **Minimum per ministry: 1** (the ministry exists in name only — barely functional)
- **Starting position: all sliders at 1** (minimum) — 7 points committed, **43 points to distribute**
- **"Adequate" threshold: 8 per ministry** — this is the level at which a ministry is considered reasonably funded. Total to fund everything adequately: 56. **This is 6 more than the budget allows.**

The impossible math is the point. You cannot fund everything adequately. You must choose what to starve. With 50 points you can fund about 5 ministries adequately (40 points) with 10 left over — meaning 2 ministries are stuck near the bottom. That's a sharper tradeoff than a 100-point model, and sharper tradeoffs produce stronger signal.

The smaller number scale also makes every decision more visceral. Moving a slider from 4 to 7 is clearly a big commitment when the total is 50. The same proportional move (8 to 14) at 100 points feels incremental. Smaller numbers, heavier points, faster decisions.

### Slider behavior

- **Range:** 1–25 per ministry
- **Step size:** 1 point
- **Constraint:** total must equal exactly 50. When a slider is moved up, remaining unallocated points decrease. When all points are allocated, moving one slider up requires another to move down.
- **Starting state:** all sliders at 1, with 43 points shown as "unallocated." The user distributes from here.
- **Submission:** a "Confirm budget" button becomes active only when all 50 points are allocated (0 unallocated).

### UI for remaining points

Display a prominent counter: **"X points remaining"** that updates live. When it reaches 0, show a confirmation state. If the user tries to increase a slider with 0 remaining, either auto-decrease the last-adjusted other ministry or show a brief "Reduce another ministry first" prompt — test both and use whichever feels more fluid.

---

## 3. Live Consequence Feedback

Each ministry displays a short consequence string that updates as the slider value changes. These are the core of what makes the exercise feel like governing rather than number-crunching.

### Consequence tiers

Each ministry has **5 tiers** of consequence text. The tier thresholds are based on the slider value:

| Tier | Range | Tone |
|---|---|---|
| Crisis | 1–2 | Severe, alarming — this ministry is barely functioning |
| Strained | 3–5 | Struggling, visible problems — services are degraded |
| Adequate | 6–8 | Functional, competent — the ministry does its job |
| Strong | 9–12 | Well-funded, effective — above-average performance |
| Dominant | 13–25 | Exceptional, world-class — this is clearly your priority |

### Consequence strings by ministry

**1. Defense**

| Tier | Text |
|---|---|
| Crisis (1–2) | Your nation cannot defend its borders without relying entirely on allied support. |
| Strained (3–5) | A small defensive force exists, but has no capacity to respond to serious threats. |
| Adequate (6–8) | A credible military that can defend borders and honor basic alliance commitments. |
| Strong (9–12) | A capable force that can project power regionally and lead coalition operations. |
| Dominant (13–25) | A global military presence with decisive superiority in your region. |

**2. Public Welfare**

| Tier | Text |
|---|---|
| Crisis (1–2) | No universal healthcare. Poverty rates soar. The elderly and disabled are unprotected. |
| Strained (3–5) | Basic emergency healthcare only. Long wait times. A thin safety net with major gaps. |
| Adequate (6–8) | Functional public healthcare and a reliable safety net for those in need. |
| Strong (9–12) | Comprehensive healthcare with short wait times. Robust support for vulnerable populations. |
| Dominant (13–25) | World-class universal healthcare. Generous pensions, housing support, and family services. |

**3. Economy & Growth**

| Tier | Text |
|---|---|
| Crisis (1–2) | Crumbling roads and bridges. Businesses leave. Unemployment rises steadily. |
| Strained (3–5) | Aging infrastructure. Slow economic growth. Limited support for new industries. |
| Adequate (6–8) | Maintained infrastructure and steady economic development. Competitive but not leading. |
| Strong (9–12) | Modern infrastructure. Strong business climate. Active investment in emerging industries. |
| Dominant (13–25) | Cutting-edge infrastructure. A global hub for commerce, innovation, and trade. |

**4. Education & Research**

| Tier | Text |
|---|---|
| Crisis (1–2) | Overcrowded classrooms. Teacher shortages. Scientific research effectively halted. |
| Strained (3–5) | Underfunded schools. Limited university access. Research funding restricted to essentials. |
| Adequate (6–8) | Functional public education system. Competitive universities. Steady research output. |
| Strong (9–12) | Well-resourced schools. Accessible higher education. Your nation attracts global researchers. |
| Dominant (13–25) | World-leading education at every level. A global center for scientific discovery. |

**5. Environment**

| Tier | Text |
|---|---|
| Crisis (1–2) | No enforcement of environmental standards. Pollution goes unchecked. Ecosystems degrade. |
| Strained (3–5) | Basic pollution controls only. Conservation is underfunded. Climate commitments are unmet. |
| Adequate (6–8) | Environmental standards are maintained and enforced. Steady progress on climate goals. |
| Strong (9–12) | Strong conservation programs. Ambitious climate policy. Clean energy investment accelerates. |
| Dominant (13–25) | Global leader in environmental protection. A model for sustainable development. |

**6. Justice & Civil Liberties**

| Tier | Text |
|---|---|
| Crisis (1–2) | Courts are backlogged for years. Legal aid is nonexistent. Civil liberties oversight collapses. |
| Strained (3–5) | Slow justice system. Limited public defense. Rights protections are inconsistently enforced. |
| Adequate (6–8) | Courts function reasonably. Citizens have access to legal aid. Rights are protected in practice. |
| Strong (9–12) | Efficient courts. Strong public defense. Active civil liberties monitoring and enforcement. |
| Dominant (13–25) | A gold-standard justice system. Rigorous rights protections. A model for rule of law globally. |

**7. Foreign Affairs**

| Tier | Text |
|---|---|
| Crisis (1–2) | Embassies close. Treaty obligations go unmet. Your nation is absent from international forums. |
| Strained (3–5) | Minimal diplomatic presence. Limited ability to negotiate or influence international policy. |
| Adequate (6–8) | A functional diplomatic corps. Your nation participates in major international institutions. |
| Strong (9–12) | Active diplomacy. Meaningful influence in international negotiations. Robust foreign aid program. |
| Dominant (13–25) | A dominant diplomatic force. Your nation shapes global policy and leads international coalitions. |

### Display

Each consequence string should appear **directly beneath its ministry's slider**, styled as secondary text (smaller, lighter color — maybe the same treatment as the body text on forced-choice questions). The text should **transition smoothly** when the tier changes — a brief crossfade rather than a hard swap, so the user sees the story change as they drag.

The consequence text should use Newsreader italic to differentiate it from UI labels and give it a narrative quality.

---

## 4. Scoring Engine Updates

### New budget-to-axis mapping

| Ministry | Axis | Direction | Signal interpretation |
|---|---|---|---|
| Defense | 5 | → Security | Higher = more Security-oriented |
| Defense | 11 | → Interventionism | Higher = more Interventionism |
| Public Welfare | 1 | → Collective | Higher = more Collective Provision |
| Economy & Growth | 1 | → Market | Higher = more Market Allocation |
| Economy & Growth | 2 | → Growth | Higher = more Growth Imperative |
| Education & Research | 4 | → Institutional Auth. | Higher = more Institutional Authority |
| Education & Research | 12 | → Innovation | Higher = more Innovation-First |
| Environment | 2 | → Ecological | Higher = more Ecological Limits |
| Justice & Civil Liberties | 5 | → Liberty | Higher = more Liberty |
| Justice & Civil Liberties | 6 | → Electoral | Higher = more Electoral Process |
| Foreign Affairs | 10 | → Internationalism | Higher = more Internationalism |

### Bidirectional axes in the budget

Three axes receive signal from **two opposing ministries**, which makes the budget data especially rich for those axes:

- **Axis 1** — Public Welfare (→ Collective) vs. Economy & Growth (→ Market)
- **Axis 2** — Environment (→ Ecological) vs. Economy & Growth (→ Growth)
- **Axis 5** — Justice & Civil Liberties (→ Liberty) vs. Defense (→ Security)

For these axes, the budget score should be computed as the **normalized difference** between the two opposing ministries:

```
budget_axis_1 = normalize(economy_growth_value - public_welfare_value)
budget_axis_2 = normalize(economy_growth_value - environment_value)
budget_axis_5 = normalize(defense_value - justice_civil_liberties_value)
```

Where `normalize()` maps the raw difference onto [-1.0, +1.0] using the same `tanh(raw / k)` sigmoid as before. The constant `k` should be recalibrated for the new slider range:

**Previous** (10 ministries, 0–100 range per ministry in theory): `k = 10`
**New** (7 ministries, 1–25 range, 50 total): the maximum realistic difference between two opposing ministries is about 15 (one at ~18, the other at ~3). Setting `k = 6` maps this range well:

- Difference of 0 → tanh(0/6) = 0.00 (neutral)
- Difference of 3 → tanh(3/6) = 0.46 (moderate lean)
- Difference of 6 → tanh(6/6) = 0.76 (strong lean)
- Difference of 10 → tanh(10/6) = 0.93 (very strong)
- Difference of 15 → tanh(15/6) = 0.99 (near-maximum)

This feels right — a 3-point gap between two ministries registers as a moderate preference, and you need a 6+ point gap for a strong signal. With a 50-point budget, these gaps represent meaningful commitments.

### Unidirectional axes in the budget

For axes with signal from only one ministry (Axes 4, 6, 10, 11, 12), use the **deviation from the mean allocation** as the raw score:

```
mean_allocation = 50 / 7 ≈ 7.1
raw_signal = ministry_value - mean_allocation
budget_axis_score = tanh(raw_signal / k)
```

Using the same `k = 6`:

- Ministry at 7 (≈ mean) → signal ≈ 0.00
- Ministry at 10 → signal = tanh(2.9/6) ≈ 0.45
- Ministry at 4 → signal = tanh(-3.1/6) ≈ -0.47
- Ministry at 15 → signal = tanh(7.9/6) ≈ 0.92

For unidirectional mappings, the sign convention:
- **Positive** raw signal (funded above mean) = leans toward the mapped pole
- **Negative** raw signal (funded below mean) = leans toward the opposite pole

Example: Foreign Affairs at 10 → positive signal → Internationalism direction. Foreign Affairs at 3 → negative signal → Sovereignty direction.

### Updated weight profiles

With the ministry consolidation, the budget signal quality changes slightly. Bidirectional axes (1, 2, 5) have the strongest budget signal. Unidirectional axes (4, 6, 10, 11, 12) have partial signal. Axes 3, 7, 8, 9 have no budget signal.

```
AXIS_WEIGHT_PROFILES = {
  // Bidirectional budget signal (strong — two opposing ministries)
  1:  { fc: 0.45, sc: 0.30, bg: 0.25 },
  2:  { fc: 0.45, sc: 0.30, bg: 0.25 },
  5:  { fc: 0.45, sc: 0.30, bg: 0.25 },

  // Unidirectional budget signal (partial — one ministry)
  4:  { fc: 0.50, sc: 0.35, bg: 0.15 },
  6:  { fc: 0.50, sc: 0.35, bg: 0.15 },
  10: { fc: 0.50, sc: 0.35, bg: 0.15 },
  11: { fc: 0.50, sc: 0.35, bg: 0.15 },
  12: { fc: 0.50, sc: 0.35, bg: 0.15 },

  // No budget signal
  3:  { fc: 0.60, sc: 0.40, bg: 0.00 },
  7:  { fc: 0.60, sc: 0.40, bg: 0.00 },
  8:  { fc: 0.60, sc: 0.40, bg: 0.00 },
  9:  { fc: 0.60, sc: 0.40, bg: 0.00 },
}
```

Note: Axes 7 and 8 move from partial budget (via Cultural Heritage) to no budget. Their weights shift from `{ fc: 0.50, sc: 0.35, bg: 0.15 }` to `{ fc: 0.60, sc: 0.40, bg: 0.00 }`. Axis 12 retains partial budget signal through Education & Research (same as before).

### Contradiction detection

No formula changes. The stated_score formula from the Scaled Item Reduction Spec applies:

```
stated_score = (0.60 × fc_axis_score) + (0.40 × sc_axis_score)
contradiction = |stated_score - budget_axis_score|
```

Contradiction detection only runs on axes with budget data (bg > 0): Axes 1, 2, 4, 5, 6, 10, 11, 12. Axes 3, 7, 8, 9 skip contradiction detection.

---

## 5. UI Layout

### Screen structure

```
┌─────────────────────────────────────────┐
│  THE CHANCELLOR'S BUDGET                │
│                                         │
│  You have 50 points to fund your        │
│  nation's government. Every choice has  │
│  consequences — there is not enough to  │
│  fund everything well.                  │
│                                         │
│  Points remaining: 21                   │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ DEFENSE                         │    │
│  │ ■■■■■■■■■■■■□□□□□□□□□□□□  6    │    │
│  │ A credible military that can    │    │
│  │ defend borders and honor basic  │    │
│  │ alliance commitments.           │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ PUBLIC WELFARE                   │    │
│  │ ■■■■■■■■■■■■■■■■□□□□□□□□  9    │    │
│  │ Comprehensive healthcare with   │    │
│  │ short wait times. Robust        │    │
│  │ support for vulnerable          │    │
│  │ populations.                    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ... (remaining ministries)             │
│                                         │
│  [Confirm Budget →]                     │
└─────────────────────────────────────────┘
```

### Visual treatment

- **Ministry name:** uppercase, small, letter-spaced (matching phase/question labels elsewhere)
- **Slider:** styled to match the site's warm palette. Filled portion in domain-appropriate color or the primary Stone 600.
- **Numeric value:** displayed at the right end of the slider, updating live
- **Consequence text:** Newsreader italic, secondary color, directly beneath the slider. Crossfade transition on tier change.
- **Points remaining counter:** prominent, fixed or sticky at the top of the exercise area. Should feel like a resource that's running out. Consider a subtle color shift as it approaches 0 (warm gold → the green of "all allocated" or similar).

### Ministry short descriptions

Each ministry should show its short description (from the table in Section 1) in a tooltip or as a subtitle on first view, so the user knows what falls under "Public Welfare" vs. "Economy & Growth." After the first interaction, the description can collapse to keep the screen clean.

---

## 6. Introductory Text

Update the Phase 3 interstitial to reflect the new framing:

> **The Chancellor's Budget**
>
> You're now head of state. You have 50 points to allocate across 7 government ministries. Every point represents a real commitment — and there isn't enough to fund everything well.
>
> Drag the sliders to build your budget. Watch what happens to each ministry as you decide what to prioritize — and what to sacrifice.
>
> This section takes about 3–4 minutes.
>
> [Begin →]

---

## 7. Time Estimates

The consolidated budget exercise with 7 sliders instead of 10 should be slightly faster:

**Previous:** 3–5 minutes
**New:** 3–4 minutes

Total quiz time with scaled item reduction + budget consolidation:
**Previous:** 18–24 minutes
**New:** 14–18 minutes

---

## What Does NOT Change

- Super-dimension formulas for compass plot (these use final axis scores, not budget data directly)
- Archetype prototype vectors
- Archetype distance calculation
- Radar chart visualization
- Confidence scoring logic (already handles missing budget data per axis)
- Phase 1 and Phase 2 content and flow
