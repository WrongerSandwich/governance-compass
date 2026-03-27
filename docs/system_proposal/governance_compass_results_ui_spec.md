# The Governance Compass — Results & UI Specification

## Overview

This document specifies the complete user-facing experience: the quiz flow (how questions are presented), the budget simulator interface, and the four-layer results display. It is a design and implementation reference, not a wireframe — it describes structure, behavior, and content without prescribing specific visual styling, which should follow the host site's design system.

---

## Part 1: Quiz Flow

### Overall Structure

The quiz is presented as a three-phase linear flow. The respondent progresses through phases sequentially but can navigate freely within each phase. A persistent progress indicator shows overall completion.

```
[Phase 1: Governance Dilemmas] → [Phase 2: Calibrated Scales] → [Phase 3: Chancellor's Budget] → [Results]
```

### Phase Transitions

Between each phase, display a brief interstitial screen that:
1. Acknowledges completion of the previous phase ("Phase 1 complete — 36 of 73 interactions done")
2. Introduces the next phase's format with a 1-2 sentence explanation
3. Sets expectations for time ("This phase takes about 8 minutes")
4. Provides a "Continue" button — no auto-advance

### Phase 1: Governance Dilemmas (Forced-Choice)

**Layout:** One question per screen. The two statements are displayed as two cards/blocks, visually equal in weight and prominence. Neither statement should appear "above" the other in a way that implies hierarchy — side-by-side on desktop, stacked with equal visual treatment on mobile.

**Interaction:** Clicking/tapping a statement selects it. The selected statement receives a subtle visual confirmation (border highlight, check mark, background shift). The respondent can change their selection before advancing.

**Navigation:** "Next" button advances to the next item. "Back" button returns to the previous item. The respondent can change any previous answer by navigating back. No answer is required to advance (but unanswered items should be flagged at phase end — see below).

**Randomization:**
- Item order is randomized per respondent across all 36 FC items (not grouped by axis)
- For each item, which statement appears on the left/top (position 1) vs. right/bottom (position 2) is independently randomized per respondent
- The randomization seed should be stored so that if the respondent refreshes or returns, they see the same order

**Unanswered items:** If the respondent reaches the end of Phase 1 with unanswered items, display a summary: "You skipped 3 questions. Your results will be more accurate if you answer all of them. Go back and answer, or continue with partial data?" Allow them to jump directly to any skipped item.

**Phase 1 interstitial text (before Phase 1):**
> "This first section presents pairs of statements about how a society should be governed. For each pair, choose the statement that comes closer to your view — even if neither is a perfect match. There are no right answers, and you can't choose both. Don't overthink it — your instinct is valuable."

### Phase 2: Calibrated Scales

**Layout:** One question per screen. The question stem is displayed prominently, followed by 5 response options. On desktop, the 5 options should be displayed as a horizontal row of cards or a segmented bar, making the spectrum nature of the scale visually clear. On mobile, a vertical stack is acceptable but should still communicate the left-to-right continuum (using indentation, color gradient, or numbering).

**Interaction:** Clicking/tapping an option selects it. Only one option can be selected. Selection is visually confirmed. The respondent can change their selection before advancing.

**Navigation:** Same as Phase 1 — Next, Back, and end-of-phase skipped-item summary.

**Randomization:** Item order randomized per respondent across all 36 SC items. Response option order is NOT randomized — the scale always runs from Pole A (left/top) to Pole B (right/bottom), as the spatial arrangement communicates the continuum. However, per the question bank, roughly half the items have Pole A as the "stronger" or more "interventionist" position and half have Pole B, so there is no systematic left-right position bias.

**Phase 2 interstitial text:**
> "This section asks you to place yourself on a spectrum. Each question has five options ranging from one position to its opposite. Choose the point on the spectrum that best reflects your view. The middle option is a genuine position, not a cop-out — pick it if that's where you actually stand."

### Phase 3: The Chancellor's Budget

This phase is a single interactive exercise, not a series of questions. It requires a custom UI component.

**Layout:** Display all 10 ministries simultaneously. Each ministry shows:
- Name
- Brief description (1 sentence — from the question bank's ministry descriptions)
- Current allocation (numeric, prominently displayed)
- Allocation control (slider, stepper buttons, or direct numeric input)

Additionally, display persistently:
- **Total allocated** (must always equal 100)
- **Discretionary remaining** (50 minus sum of all above-baseline allocations)
- **Minimum warning** (if any ministry is at or near the 5-unit floor)

**Interaction model — two viable approaches:**

*Option A: Slider model.* Each ministry has a horizontal slider ranging from 5 to 50. Moving one slider automatically redistributes from the "discretionary pool." When the pool is empty, increasing one ministry requires decreasing another — the UI should make this constraint visible (grayed-out increase buttons, "0 discretionary units remaining" warning). This is more intuitive but harder to implement with good UX.

*Option B: Point-buy model.* Start with all ministries at the 10-unit baseline. The respondent has 50 points in a visible "treasury." They click +/- buttons to add or remove points from ministries one unit at a time. The treasury decrements/increments in real time. They can also reduce ministries below 10 (to a floor of 5), freeing additional points. This is simpler to implement and makes the scarcity constraint extremely tangible.

**Recommendation:** Option B (point-buy) is easier to implement, more explicit about scarcity, and works well on mobile. Use +/- stepper buttons with the current value displayed between them.

**Constraint enforcement:**
- No ministry can go below 5
- Total must always equal 100
- The "Finalize Budget" button is only enabled when exactly 100 units are allocated

**Below-baseline warning:** If a ministry is reduced below 10, display a brief, neutral consequence description inline:

| Ministry | Below-Baseline Warning |
|---|---|
| Social Welfare | "Reduced social safety net — increased poverty and health crises likely" |
| Economic Development | "Reduced economic support — slower growth and higher unemployment likely" |
| Ecological Transition | "Reduced environmental protection — accelerated ecological degradation likely" |
| Defense | "Reduced military readiness — decreased deterrence capability" |
| Domestic Security | "Reduced law enforcement capacity — increased crime and disorder likely" |
| Education | "Reduced education funding — declining human capital and research output" |
| Cultural Heritage | "Reduced cultural investment — erosion of national identity and heritage" |
| Infrastructure | "Reduced infrastructure spending — deteriorating transportation and utilities" |
| Foreign Affairs | "Reduced diplomatic capacity — weakened international relationships" |
| Civil Liberties | "Reduced judicial independence — weakened rights protections and oversight" |

These warnings are informational, not punitive. They should be concise and appear/disappear dynamically as the allocation changes. They should NOT prevent the respondent from making the allocation — the whole point is to let them make hard choices.

**Phase 3 interstitial text:**
> "In this final section, you'll take on the role of head of state. You have 100 units of national budget to distribute across 10 government ministries. Each ministry needs at least 5 units to function, and all 10 start at a baseline of 10 — leaving you 50 units to distribute according to your priorities. There's not enough to fully fund everything. That's the point."

**Completion:** When the respondent clicks "Finalize Budget" (with all 100 units allocated), display a brief confirmation ("Budget finalized") and enable the "See Results" button.

---

## Part 2: Results Display

Results are presented as a single scrollable page with four sections (layers), ordered from simplest to most detailed. The respondent sees all four layers on one page — no tabs, no hidden content (except expandable archetype descriptions). The first thing they see should be visually striking and immediately shareable.

### Layer 1: The Compass Plot

**Position:** Top of results page. This is the hero element.

**Visualization:** A 2D scatter plot on a square canvas.

```
                    Traditional / Authority
                           (+1.0)
                             |
                             |
    Collective    −−−−−−−−−−−+−−−−−−−−−−−    Market
    (-1.0)                   |               (+1.0)
                             |
                             |
                    Progressive / Liberty
                           (-1.0)
```

**Elements:**
- **Canvas:** Square, with a subtle grid or crosshair at the origin. Light background. The four quadrants can have very subtle background tinting to aid orientation, but this should be understated — the plot is not about quadrants, it's about precise position.
- **Respondent's dot:** A prominent, filled circle at coordinates (sd_economic, sd_cultural). This is the visual anchor of the entire results page.
- **Axis labels:** The four cardinal directions are labeled with the pole names, not "Left/Right/Up/Down." Use the full pole names:
  - Top: "Traditional · Authority-Oriented"
  - Bottom: "Progressive · Liberty-Oriented"  
  - Left: "Collective · Limits-Conscious"
  - Right: "Market · Growth-Oriented"
- **Quadrant labels (optional, subtle):** In each quadrant corner, a very small, low-contrast label can provide orientation. These are NOT definitive categories — they're rough landmarks:
  - Top-left: "Communitarian"
  - Top-right: "Conservative"
  - Bottom-left: "Libertarian Left"
  - Bottom-right: "Classical Liberal"
- **Coordinate readout:** Below the plot, display the exact coordinates: "Economic: -0.34 | Cultural: +0.18"

**Interactivity:**
- Hovering/tapping the respondent's dot shows a tooltip with the exact coordinates
- Optional: a toggle to overlay reference points (archetype prototype positions, labeled with archetype names) as small, labeled, semi-transparent dots. This helps the respondent understand where they sit relative to known governance philosophies. Off by default to keep the initial view clean.

**Sharing:** Include a "Share" or "Copy Image" button that captures the compass plot as a standalone image with the respondent's dot, axis labels, and a small "The Governance Compass" watermark. This is the primary viral/social sharing mechanic.

**Important framing text** (displayed directly above or below the plot):
> "This is a simplified view. Your full profile has 12 dimensions — the compass compresses them into two. Scroll down for the complete picture."

This framing is essential. The entire instrument exists because 2D plots are insufficient. The compass plot is a concession to shareability, not the real output.

---

### Layer 2: Archetype Card

**Position:** Directly below the compass plot.

**Layout:** A prominent card component with:

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Your Governance Archetype                           │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │                                              │    │
│  │  THE CIVIC INSTITUTIONALIST                  │    │
│  │  87% match                                   │    │
│  │                                              │    │
│  │  Believes in democratic process above all.   │    │
│  │  Favors moderate redistribution, distributed │    │
│  │  governance, and strong civil liberties.     │    │
│  │                                              │    │
│  │  [▼ Read full description]                   │    │
│  │                                              │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  Adjacent type: The Social Democrat (72% match)      │
│  Your profile shares significant common ground       │
│  with this archetype as well.                        │
│                                                      │
│  ○ Blended type indicator (if applicable)            │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Archetype name:** Large, prominent. This is the most "quotable" part of the results — the thing someone would put in a social media bio.

**Match percentage:** Displayed next to the name. Helps calibrate expectations — an 87% match means something different from a 58% match.

**Summary:** 1-2 sentences, always visible. From the archetype definitions in the scoring spec.

**Expanded description:** Behind a "Read full description" toggle. Includes:
- The full 2-3 paragraph archetype narrative
- The "Characteristic tension" paragraph
- Optionally: historical or contemporary examples of governance traditions that resemble this archetype (phrased carefully and non-judgmentally, e.g., "This archetype shares features with Nordic social democratic governance models and with postwar European welfare state design")

**Adjacent type:** The second-closest archetype. Show name and match percentage. Include one sentence on the key difference: "Where you diverge: The Social Democrat places more emphasis on collective economic provision, while your profile balances this with stronger institutional trust."

**Blended type:** If the respondent's top two archetypes are within 10% distance of each other, display a "Blended Type" indicator: "Your profile sits between two archetypes — you share significant elements of both, and neither fully captures your worldview. This is common and reflects a genuinely complex set of governance preferences."

**Low-match handling:** If the best archetype match is below 55%, display: "Your profile is unusually distributed and doesn't map neatly onto any single governance philosophy. This may mean you hold a genuinely distinctive combination of views, or that your priorities don't align with the major ideological traditions this instrument measures. The detailed breakdown below will give you a more complete picture."

---

### Layer 3: Radar Chart (Full 12-Axis Profile)

**Position:** Below the archetype card. This is the instrument's signature visualization.

**Visualization:** A 12-spoke radar (spider) chart.

**Spoke arrangement:** The 12 axes are arranged around the circle, grouped by domain for visual coherence. Going clockwise from the top:

```
Position  Axis  Name
12:00     1     Collective ↔ Market
 1:00     2     Ecological ↔ Growth
 2:00     3     Distributed ↔ Centralized
 3:00     4     Popular Sov. ↔ Institutional Auth.
 4:00     5     Liberty ↔ Security
 5:00     6     Electoral ↔ Performance
 6:00     7     Progressive ↔ Traditional
 7:00     8     Pluralism ↔ Cohesion
 8:00     9     Constructivism ↔ Essentialism
 9:00    10     Internationalism ↔ Sovereignty
10:00    11     Non-Intervention ↔ Interventionism
11:00    12     Precautionary ↔ Innovation
```

This groups the four domains in contiguous arcs:
- 12:00–1:00: Economic (Axes 1-2)
- 2:00–5:00: Power & Authority (Axes 3-6)
- 6:00–8:00: Society & Identity (Axes 7-9)
- 9:00–11:00: State in the World (Axes 10-12)

**Domain separators:** Subtle visual separators (faint lines or background color shifts) between domain arcs help the respondent read the chart in meaningful chunks rather than as 12 undifferentiated spokes.

**Score mapping onto the chart:**

The radar chart has a center and a perimeter. The critical design decision is what the center and edges represent.

**Recommended approach: Bidirectional from center.**
- The center ring (innermost circle) represents the midpoint (score = 0) on all axes
- Each spoke extends in both directions from the center: inward toward Pole A, outward toward Pole B
- The respondent's data point on each spoke is placed according to their score: negative scores (Pole A) pull inward from center, positive scores (Pole B) push outward from center

In practice, this means the radar chart has a "neutral ring" at 50% of the spoke length, and values range from the chart's center (strong Pole A, -1.0) to the perimeter (strong Pole B, +1.0).

```
Perimeter = +1.0 (strong Pole B)
    ↑
Middle ring = 0.0 (neutral)
    ↑
Center = -1.0 (strong Pole A)
```

**Spoke labels:** Each spoke is labeled at the perimeter with the Pole B name and at the center region with the Pole A name. This means the chart reads intuitively: "farther out = more Pole B, farther in = more Pole A."

Concretely, the perimeter labels would be:
```
Market, Growth, Centralized, Institutional, Security, 
Performance, Traditional, Cohesion, Essentialism, 
Sovereignty, Interventionism, Innovation
```

And the corresponding inner/center labels:
```
Collective, Ecological, Distributed, Popular, Liberty,
Electoral, Progressive, Pluralism, Constructivism,
Internationalism, Non-Intervention, Precautionary
```

Given space constraints, the inner labels may need to be shown only on hover/tap or in a legend rather than directly on the chart.

**Respondent's profile:** Drawn as a filled polygon connecting the 12 data points, with semi-transparent fill and a solid border. The fill color should be a single accent color from the site's palette.

**Reference rings:** Concentric circles at -0.5, 0.0 (the neutral ring, slightly more prominent), and +0.5 provide scale reference.

**Interactivity:**
- **Hover/tap on a spoke** shows a tooltip with: axis name, both pole names, the respondent's score, and the confidence level
- **Archetype overlay toggle:** A control (checkbox or toggle button) that superimposes the matched archetype's prototype polygon on the chart in a different color with reduced opacity. This makes alignment and divergence immediately visible. When active, hovering a spoke shows both the respondent's score and the archetype's prototype score.
- **Optional: second overlay** for the adjacent archetype or for a custom comparison (if the site supports sharing/comparing profiles between users)

**Color coding by confidence:** The border of each spoke segment can be color-coded by confidence level:
- High confidence: solid line
- Moderate confidence: standard line
- Low confidence: dashed line
- Conflicted: dashed line with a tension indicator icon

This subtly communicates where the profile is firm and where it's uncertain without cluttering the chart.

**Framing text** (above the radar chart):
> "Your full governance profile across all 12 dimensions. The middle ring represents a neutral position; outward means stronger alignment with the outer-labeled pole, inward means stronger alignment with the inner-labeled pole."

---

### Layer 4: Detailed Axis Breakdown

**Position:** Below the radar chart. This is the deep-dive section for respondents who want to understand each dimension.

**Layout:** A vertical list of 12 axis cards, grouped by domain. Each domain has a header.

**Domain headers:**
```
ECONOMIC ORGANIZATION
  Axis 1, Axis 2

POWER AND AUTHORITY
  Axis 3, Axis 4, Axis 5, Axis 6

SOCIETY AND IDENTITY
  Axis 7, Axis 8, Axis 9

THE STATE IN THE WORLD
  Axis 10, Axis 11, Axis 12
```

**Individual axis card layout:**

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Axis 1: Economic Model                              │
│                                                      │
│  Collective          ●━━━━━━━━━━━●━━━━○━━━━  Market  │
│  Provision          -1.0        0.0   ↑     Alloc.   │
│                                     +0.34            │
│                                                      │
│  Confidence: High                                    │
│                                                      │
│  ┌ Tension: None ─────────────────────────────────┐  │
│  │ (no tension block displayed when none detected) │  │
│  └─────────────────────────────────────────────────┘  │
│                                                      │
│  [▼ See how this was scored]                         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Elements of each axis card:**

1. **Axis name and number**

2. **Score bar:** A horizontal bar from -1.0 to +1.0 with:
   - Pole A label on the left
   - Pole B label on the right
   - A marker at the respondent's score position
   - A center mark at 0.0
   - The numeric score displayed near the marker

3. **Confidence indicator:** "High," "Moderate," "Low," or "Conflicted" — with a brief inline explanation for anything below High:
   - High: no additional text needed
   - Moderate: "Your responses across question types were somewhat varied on this axis"
   - Low: "Your responses varied significantly across question types — this score is less certain"
   - Conflicted: "Your stated preferences and budget priorities pointed in different directions on this axis" (and the tension block below provides detail)

4. **Tension block** (only displayed when tension is detected, i.e., magnitude > 0.50):

```
┌ Tension Detected ────────────────────────────────────┐
│                                                      │
│  ⚡ Moderate Tension                                  │
│                                                      │
│  Your responses suggest a strong commitment to       │
│  collective welfare, but when you had to allocate    │
│  limited resources, you prioritized economic         │
│  development over social spending.                   │
│                                                      │
│  This is a common tension — many people value        │
│  equality in principle but prioritize growth when    │
│  forced to choose.                                   │
│                                                      │
│  Stated preference: -0.61 (Collective Provision)     │
│  Budget preference: +0.23 (Market Allocation)        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

The tension block should be visually distinct from the rest of the card (different background color, icon, or border treatment) to draw attention without being alarming. The tone is curious and neutral, never judgmental.

5. **Scoring breakdown** (behind an expandable toggle "See how this was scored"):

```
┌ Scoring Breakdown ───────────────────────────────────┐
│                                                      │
│  Forced-Choice responses:                            │
│    Q1: Selected A (Collective)                       │
│    Q2: Selected A (Collective)                       │
│    Q3: Selected B (Market)                           │
│    → FC score: -0.33                                 │
│                                                      │
│  Scaled responses:                                   │
│    Q1: Position 2 of 5 (leaning Collective)          │
│    Q2: Position 1 of 5 (strong Collective)           │
│    Q3: Position 3 of 5 (midpoint)                    │
│    → SC score: -0.50                                 │
│                                                      │
│  Budget signal:                                      │
│    Social Welfare: 18 units (+8 above baseline)      │
│    Economic Development: 7 units (-3 below baseline) │
│    → Budget score: -0.46                             │
│                                                      │
│  Weights applied: FC 40% / SC 35% / Budget 25%      │
│  Final score: -0.41                                  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

This radical transparency is a deliberate design choice and a direct response to the Political Compass's opaque scoring. Any respondent who cares enough to expand this section can see exactly how their answer on every single item contributed to their score. No black boxes.

---

## Part 3: Supplementary UI Elements

### Progress Indicator

A persistent element (top bar, sidebar, or bottom bar depending on layout) showing:
- Current phase (1, 2, or 3)
- Progress within current phase (e.g., "Question 14 of 36")
- Overall progress (e.g., a segmented progress bar with three sections)

The progress indicator should be compact and non-intrusive. It provides reassurance ("I'm making progress") without creating anxiety ("I still have so many to go").

### Navigation Controls

**Within phases:** Back/Next buttons on every question screen. Keyboard shortcuts (left/right arrows, or 1/2 for forced-choice) are a worthwhile accessibility addition.

**Between phases:** Forward movement only (can't go back to Phase 1 from Phase 2). This is a practical constraint — going back and changing Phase 1 answers after seeing Phase 2 questions would undermine the modality independence that makes contradiction detection work. If a respondent wants to redo the quiz, they start over.

**Skip handling:** Respondents are allowed to skip any individual question. At the end of each phase, skipped questions are flagged and the respondent is given one chance to go back and answer them. If they proceed without answering, those items are excluded from scoring (the axis score is computed from fewer items, with a confidence penalty).

### Pre-Quiz Introduction Screen

Before Phase 1 begins:

> **The Governance Compass**
>
> This assessment maps your political worldview across 12 dimensions of governance — from economics and authority to culture, international relations, and technology.
>
> It takes about 20 minutes and has three sections:
> 1. **Governance Dilemmas** — Choose between competing principles (≈8 min)
> 2. **Calibrated Scales** — Place yourself on a spectrum (≈8 min)
> 3. **The Chancellor's Budget** — Allocate a national budget under scarcity (≈4 min)
>
> There are no right or wrong answers. Every position in this assessment represents a view held by thoughtful people in real governance traditions around the world.
>
> Your results are computed entirely in your browser. No responses are stored unless you choose to share them.
>
> [Begin Assessment →]

### Post-Budget / Pre-Results Interstitial

After the budget is finalized and before results are computed:

> "Computing your governance profile..."
>
> [Brief loading animation — even if computation is instant, a 1-2 second artificial delay with an animation creates a sense that something meaningful is being calculated. This is a standard UX pattern for increasing perceived value of results.]

---

## Part 4: Sharing and Export

### Shareable Image

A "Share Your Results" button generates a composite image containing:
1. The compass plot with the respondent's dot
2. The archetype name and match percentage
3. The radar chart
4. A "The Governance Compass" watermark and URL

**Aspect ratio:** Optimized for social media — 1200×630 (landscape, Facebook/Twitter/LinkedIn preview) with a square (1080×1080) variant for Instagram.

**Implementation:** Canvas-based rendering (html2canvas or similar) or server-side image generation. The image should be downloadable and also copyable to clipboard.

### Shareable Link (Optional, Requires Server)

If the site supports it, a "Copy Link" button generates a URL that encodes the respondent's 12 axis scores as URL parameters. Anyone opening the link sees the results page pre-populated with those scores. This does not require storing any data server-side — the scores are encoded in the URL itself.

**URL encoding scheme:**
```
https://[site]/results?v=1&s=-41,23,-30,18,-62,45,-28,12,-55,34,-20,67
```

Where the `s` parameter is a comma-separated list of 12 axis scores multiplied by 100 and rounded to integers (so -0.41 becomes -41, +0.23 becomes 23, etc.). The `v` parameter is a version identifier so the decoding logic can handle future changes to the axis definitions.

This is compact enough to fit in a tweet or text message and contains the full 12-axis profile.

### Raw Data Export

A "Download Raw Data" button exports a JSON file containing:
- All 72 item responses
- All 10 budget allocations
- All 12 axis scores with components and confidence
- Super-dimension scores
- Archetype assignment with match percentages

This serves users who want to analyze their own data and, if the site ever collects aggregate data with consent, enables data portability.

---

## Part 5: Responsive Design Considerations

### Desktop (>1024px)

- Forced-choice statements displayed side-by-side (two equal columns)
- Scaled items displayed as a horizontal segmented bar
- Budget simulator as a single-screen grid or table with all 10 ministries visible
- Radar chart displayed at full size (minimum 500×500px)
- Compass plot and archetype card can sit side-by-side above the radar chart

### Tablet (768–1024px)

- Forced-choice statements stack vertically with equal card treatment
- Scaled items remain horizontal if space permits, otherwise switch to a vertical radio-button list with labels
- Budget simulator may need to scroll vertically but should show at least 5 ministries without scrolling
- Radar chart at medium size (400×400px minimum)

### Mobile (<768px)

- Everything stacks vertically
- Forced-choice statements as stacked cards — ensure both cards are fully visible without scrolling on most screen sizes (keep statement text concise)
- Scaled items as a vertical list of 5 tappable options
- Budget simulator as a scrollable list of ministries with +/- stepper buttons — the "total remaining" counter should be sticky/fixed at the top or bottom of the screen so it's always visible
- Radar chart at minimum 300×300px — consider offering an alternative "bar chart" view for the 12 axes if the radar chart is too small to read on compact screens
- Axis breakdown cards at full width
- Scoring breakdown expandable sections are especially important on mobile since the radar chart may be hard to read in detail

---

## Part 6: Accessibility

### Keyboard Navigation

- All interactive elements (statement selection, scale options, budget steppers, navigation buttons) must be keyboard-accessible
- Forced-choice: Tab between the two statements, Enter/Space to select
- Scaled: Arrow keys to move between the 5 options, Enter/Space to confirm
- Budget: Tab between ministries, arrow keys to increment/decrement

### Screen Readers

- Forced-choice items: Each statement should have an aria-label that includes the axis context, e.g., "Statement A for economic model question: [statement text]"
- Scaled items: Each option should have an aria-label that includes its position, e.g., "Option 2 of 5, leaning toward collective provision: [option text]"
- Radar chart: Provide an accessible text alternative that lists all 12 axis scores with pole names — a screen reader should be able to convey the full profile without the visual
- Compass plot: Provide an accessible text alternative with the coordinates and quadrant

### Color

- Do not rely on color alone to convey information (confidence levels, tension indicators, domain groupings)
- Ensure sufficient contrast between the radar chart polygon fill and the background
- The tension block should use an icon (⚡ or similar) in addition to color to indicate its presence

---

## Appendix: Content Reference — All Framing and Explanatory Text

This appendix collects every piece of user-facing explanatory text specified in this document, for easy review and editing.

### Pre-Quiz

**Main introduction:**
"This assessment maps your political worldview across 12 dimensions of governance — from economics and authority to culture, international relations, and technology. It takes about 20 minutes and has three sections..."

### Phase Intros

**Phase 1:**
"This first section presents pairs of statements about how a society should be governed. For each pair, choose the statement that comes closer to your view — even if neither is a perfect match. There are no right answers, and you can't choose both. Don't overthink it — your instinct is valuable."

**Phase 2:**
"This section asks you to place yourself on a spectrum. Each question has five options ranging from one position to its opposite. Choose the point on the spectrum that best reflects your view. The middle option is a genuine position, not a cop-out — pick it if that's where you actually stand."

**Phase 3:**
"In this final section, you'll take on the role of head of state. You have 100 units of national budget to distribute across 10 government ministries. Each ministry needs at least 5 units to function, and all 10 start at a baseline of 10 — leaving you 50 units to distribute according to your priorities. There's not enough to fully fund everything. That's the point."

### Results

**Compass plot framing:**
"This is a simplified view. Your full profile has 12 dimensions — the compass compresses them into two. Scroll down for the complete picture."

**Radar chart framing:**
"Your full governance profile across all 12 dimensions. The middle ring represents a neutral position; outward means stronger alignment with the outer-labeled pole, inward means stronger alignment with the inner-labeled pole."

**Blended type:**
"Your profile sits between two archetypes — you share significant elements of both, and neither fully captures your worldview. This is common and reflects a genuinely complex set of governance preferences."

**Low match:**
"Your profile is unusually distributed and doesn't map neatly onto any single governance philosophy. This may mean you hold a genuinely distinctive combination of views, or that your priorities don't align with the major ideological traditions this instrument measures. The detailed breakdown below will give you a more complete picture."

**Tension block intro (per axis, when applicable):**
Dynamic — uses the narrative templates from the scoring engine spec, customized by axis and direction.

### Confidence Labels

**High:** (no additional text)
**Moderate:** "Your responses across question types were somewhat varied on this axis"
**Low:** "Your responses varied significantly across question types — this score is less certain"  
**Conflicted:** "Your stated preferences and budget priorities pointed in different directions on this axis"
