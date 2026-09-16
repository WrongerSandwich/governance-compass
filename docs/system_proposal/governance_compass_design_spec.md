> **PARTIALLY OUTDATED:** The design philosophy, color system, and typography principles remain current. Specific changes: the logo is now a radar rose (was contour mark), the serif font is Source Serif 4 (was system Georgia), the budget exercise uses 7 ministries (was 10), and the results page leads with the archetype card (compass moved to bottom). Domain colors (Stone, Slate, Sage, Clay) have been added per `completed/governance_compass_domain_colors.md`.

# The Governance Compass — Design System & Theming Specification

## Design Philosophy

The Governance Compass looks like a well-made atlas crossed with a policy journal. It is serious without being cold, structured without being rigid, and information-dense without being overwhelming. The design draws from three traditions:

- **Cartographic surveying** — topographic contour lines, warm earth tones, monospace coordinates, the sense that you are mapping unknown terrain
- **Editorial publishing** — serif headings, layered surfaces for visual hierarchy, large typographic numbers as anchors, the authority of Foreign Affairs or a well-designed white paper
- **Swiss modernist data design** — strict grid alignment, alternating-row tables, dot-on-bar axis indicators, no decorative elements that don't carry information

The site should feel like a precision instrument wrapped in a warm, scholarly aesthetic. Every visual element either communicates data or establishes hierarchy — nothing is purely decorative except the subtle topographic contour lines on the compass plot, which serve as a thematic signature.

---

## Color System

### Primary Accent — "Cartographic Stone"

The site runs on a single warm neutral ramp plus a small set of semantic tokens aliased onto it. The ramp evokes aged paper, survey maps, and institutional brass — it reads as authoritative without being corporate.

```
--stone-900:  #3d2e1f      --stone-400:  #b5a594
--stone-800:  #5a4636      --stone-300:  #cdbfb2
--stone-700:  #6e5a48      --stone-200:  #e0d6cc
--stone-600:  #85735e      --stone-100:  #efe9e3
--stone-500:  #9d8b78      --stone-50:   #f7f4f0
```

The ramp is **frozen across modes.** Not one of these ten is redeclared in the dark block, so `--stone-600` is the same brown on a white panel and on a near-black one. That is the single most important fact about the color system, because it is why a mark or a rule cannot be spelled from a ramp literal at the call site: a frozen value cannot step, so it either goes muddy on one ground or vanishes on the other. Everything that has to adapt goes through a semantic token that the dark block redeclares.

**Stone 600's jobs.** The focus ring (`--focus-ring: var(--stone-600)`), the quiz progress fill, and the light-mode value of the data marks — plus small accents that take it directly, such as the nav's active underline and the choice card's hover border. It is **not** the primary button fill and it is not the brand color: design delta 03 moved the fill to Stone 900 ink, and delta 06 moved the marks onto tokens that step — though frozen Stone 600 literals do survive at unswept call sites (see *Known debt* below).

**The ink primary.** Three tokens, one per role:

```
--button-primary:       Stone 900   →   Stone 300  (dark)
--button-primary-hover: Stone 800   →   Stone 200  (dark)
--button-primary-fg:    Stone 50    →   Stone 900  (dark)
```

Stone 900 ink on a Stone 900 ground is invisible, so the primary button **inverts** in dark mode rather than darkening. The inversion is a token override, not a per-component branch — the component names the tokens and never asks what mode it is in.

### Surfaces and Text

Three surface levels carry depth, and they invert as a set rather than reordering: Surface 1 is the lightest of the three in both modes, so a card still rises off the band behind it.

```
--surface-1:  #ffffff   →   #2a2118     Cards and panels
--surface-2:  #f7f4f0   →   #1f1812     Hero regions, quiet bands, alternating rows
--surface-3:  #efe9e3   →   #17120d     The page ground
```

In light mode Surface 2 and Surface 3 are value-identical to Stone 50 and Stone 100, which is a trap rather than a shorthand: writing `bg-stone-50` for a surface renders correctly in light and then stays near-white in dark, and no light-mode screenshot will show it.

Borders are a matching trio — `--border-primary` (Stone 300 → Stone 800), `--border-secondary`, `--border-tertiary` — each stepping with the surface it sits on.

Text is a **trio plus one**:

```
--text-primary:    Stone 900   →   Stone 100
--text-secondary:  Stone 700   →   Stone 300
--text-tertiary:   Stone 500   →   Stone 500     (frozen)
--text-label:      Stone 700   →   Stone 500
```

`--text-label` is the fourth, and it colors the label layer. It steps by mode where `--text-tertiary` does not, and the reason is a measurement rather than a preference. Stone 500 measures 2.73:1 on the light page ground, 2.99:1 on Surface 2 and 3.28:1 on a white panel — all three under AA's 4.5:1 for small text, and the first two under even the 3:1 large-text floor — while clearing 4.81–5.67:1 on the three dark surfaces. No single value on the Stone ramp clears AA in both modes: Stone 600 fails every dark surface, and Stone 700 fails dark badly at 2.42–2.85:1. So the token steps, landing at 5.42:1 in light and 5.67:1 in dark on the page ground.

This is the delta's one knowing departure from the handoff, which states that Stone 500 holds as the label color in both modes and is the one token needing no dark variant. It is an accessibility departure rather than an aesthetic one, and it introduces no new color (spec decision D7).

`--text-tertiary` is what `--text-label` replaced. It keeps Stone 500 in both modes and therefore carries that same failure onto any light-mode label it still colors; the label layer takes `--text-label`, and the surviving `--text-tertiary` call sites are legacy rather than exemplary.

**Rules are a pair, not a border tone.**

```
--rule-strong:    Stone 900   →   Stone 100
--rule-hairline:  Stone 50    →   Stone 900
```

A panel's header rule is deliberate hard ink (13.05:1 on a Surface 1 panel) and its row separators are barely there (1.10:1). Both must invert with the surface, which is why neither can be written as `border-stone-900` or `border-stone-50` at the call site: the ramp is frozen, so those two literals swap roles in dark mode and you get near-white hairlines under a header rule that has disappeared. The dark values preserve the intent (~13:1 and ~1.2:1) rather than the value.

### Semantic Colors

**Domain marks.** There are four governance domains, and each has a 600 tone and a 400 tone. Three of the four hues are additional to the palette; the fourth, Economic, is the Stone accent itself, which is why the domain colors are sometimes named as the three that are not Stone.

```
economic   Stone   #85735e / #b5a594
power      Slate   #6b7d8a / #9daebb
society    Sage    #7a8b6e / #94a488
world      Clay    #96716b / #c1a7a1
```

`DOMAIN_COLORS` is the source: it carries the two tones, the domain's display `name`, the axis ids it covers, and a one-sentence `blurb` used wherever a domain has to be introduced to the reader.

Domain color is **data, not palette.** It encodes which axis domain a mark belongs to, and it is permitted wherever an axis is drawn — and nowhere else. It carries meaning, so it never appears as decoration and never on chrome. Outside that job the palette is Stone and the warning family.

Marks read the custom properties, never the hexes:

```
--domain-economic   Stone 600   →   Stone 400
--domain-power      Slate 600   →   Slate 400
--domain-society    Sage 600    →   Sage 400
--domain-world      Clay 600    →   Clay 400
--mark-primary      Stone 600   →   Stone 400
```

`getDomainColor600` returns a fixed hex, and a hex cannot invert, so it is correct only where the 600 tone is genuinely wanted in both modes — a condition nothing in the product now meets, and it has no remaining call sites. A domain mark takes `getDomainMarkVar` or `DOMAIN_MARK_VARS`, the static reference pages included, and `--mark-primary`'s canonical job is the single unified user shape (the radar polygon, the mini radar, the budget fill) — the exceptions are the frozen literals under *Known debt*. `--mark-primary` is value-identical to `--domain-economic` in both modes, so the two are indistinguishable by rendering and only the source says which one a mark meant.

**Warning — the advisory accent.** Four members, reserved for editorial notices and caution states (spoilers, unanswered-question flags, tension callouts, low-match warnings) and never decorative.

```
--warning:         #d97706                 The amber itself. Frozen across modes.
--warning-text:    #92400e   →   #fbbf24
--warning-bg:      #fffbeb   →   #451a03
--warning-border:  #fde68a   →   #92400e
```

`--warning-border` is exported into Tailwind's color namespace as `--color-warning-border`, so `border-warning-border` compiles. It was the one member declared with a dark inversion but never exposed — which is the setup for a bug this project has shipped repeatedly: reaching for a ramp literal because the inverting token appears not to exist.

**Info is vestigial.** `--info` and `--info-light` survive from the handoff and nothing draws with them. The archetype prototype overlay the old spec assigned to blue ships as a dashed Stone 500 line, and the comparison feature the blue was held in reserve for shipped without a second hue. Adding one would break the near-monochrome rule.

**Study-only families.** The Synthetic Study section declares four token families of its own, labelled study-only in the stylesheet. Nothing enforces that label, and the study's own cluster data module names the cluster tokens from outside `/study`. Read it as a convention rather than a guard: these are not general palette. A surface outside the study section reaching for one is almost certainly reaching for a domain mark or the Stone ramp instead.

```
--cluster-0 … --cluster-5        Categorical fills for the respondent clusters
--map-*                          Map density ramp, borders, hover, highlight
--axis-gradient-*                Diverging scale for axis means and correlations
--model-claude, --model-gemini   The two model tones in the agreement views
```

Each family is retuned by hand for dark mode rather than stepping like the domain marks, so never derive a study token's dark value from the 600 → 400 rule. None of them is exported into Tailwind's `--color-*` namespace; they are consumed as `var()` in inline styles and SVG attributes.

**Known debt.** Frozen `var(--stone-600)` mark tones survive in the comparison and groups components, where they stay dark brown on a dark ground instead of stepping with every other mark on the page. Tracked as issue #155 and held by a named `PHASE_5_INLINE_RAMP` exclusion in the design-system token guard; removing a file's entry from that set is how the guard records the debt as paid.

### Dark Mode

Dark mode is a single `prefers-color-scheme: dark` override on `:root` — the same token names with new values. No component branches on mode. The deltas' own token work introduced no new color — the `--domain-*` aliases and `--text-label` resolve to ramp values already declared in light — but the block as a whole does carry values of its own: the three dark surfaces, the inverted warning background and text, and the hand-lifted study tones.

- Surfaces, text and borders invert in value while keeping their order, so the card-rising-from-surface effect survives.
- The primary button inverts rather than darkens, for the reason given above.
- A data mark drawn through the tokens steps from its 600 tone to its 400: the 600 tones go muddy on a dark ground. This is the entire reason the `--domain-*` and `--mark-primary` tokens exist, and the frozen literals under *Known debt* are the marks that miss the step.
- The rule pair swaps ends, preserving contrast intent rather than value.
- Topographic contour lines on the compass drop from `--contour-opacity: 0.08` to `0.05`.
- The Stone ramp does not change, and neither does `--warning`.

### Color Rules

- **Never spell a mark or a rule from a ramp literal.** `--stone-NNN` is one value in both modes. Marks take `--mark-primary` or `--domain-*` — via `getDomainMarkVar` or `DOMAIN_MARK_VARS` — and rules take `--rule-strong` or `--rule-hairline`.
- **Never use a ramp value as a surface.** `bg-stone-50` is not `--surface-2`, however identical the two look in light mode.
- **The label layer takes `--text-label`.** Not `--text-tertiary`, not a ramp value.
- **Domain color is data.** Draw it wherever an axis is drawn and nowhere else — never on chrome, never as decoration.
- **Never derive a study token's dark value from the 600 → 400 step.** The cluster, map, axis-gradient and model families are retuned by hand, and they stay inside the study section.
- **The warning family is advisory, never decorative.** It is the only hue outside the data families: no blue, no new accent.

---

## Typography

### Font Stack

```
Headings:     serif stack — use your framework's serif variable, or:
              Georgia, 'Times New Roman', 'Noto Serif', serif

Body/UI:      sans-serif stack — use your framework's sans variable, or:
              -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif

Data/Coords:  monospace stack — use your framework's mono variable, or:
              'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace
```

### Type Scale

```
Page title (h1):           22px, serif, weight 500
Section heading (h2):      18px, serif, weight 500  (used sparingly — "Radar", "Axis breakdown")
Archetype name:            17px, serif, weight 500
Body text:                 14px, sans, weight 400, line-height 1.6
Archetype description:     13px, sans, weight 400, line-height 1.6
Axis pole labels:          12px, sans, weight 400, color: text-secondary
Section/domain labels:     11px, sans, weight 400, letter-spacing 0.08-0.10em,
                           uppercase, color: stone 600 (for domain labels)
                           or text-tertiary (for generic section labels)
Match percentage:          36px, serif, weight 500 (the large number on archetype card)
Coordinates/scores:        10-11px, monospace, weight 400, color: text-secondary or stone 600
Confidence/meta text:      12px, sans, weight 400, color: text-tertiary, italic where appropriate
Footnote/framing text:     12px, serif, italic, color: text-tertiary
```

### Typography Rules

- **Serif is for headings and editorial framing only.** Never use serif for UI labels, button text, axis names, or data. The serif/sans contrast is what creates the "journal" feel — if everything is serif, you lose it.
- **Monospace is for numeric data only.** Coordinates on the compass plot, axis scores in the breakdown, the formula in the scoring expansion. Never for labels or body text.
- **Sentence case everywhere.** The only uppercase text is section/domain labels at 11px with letter-spacing — these are structural markers, not headings. Everything else (headings, archetype names, axis names, button labels) is sentence case.
- **Two weights only: 400 (regular) and 500 (medium).** Never use 600 or 700. The serif headings at 500 provide enough contrast. If something needs more emphasis, use the serif face or the stone accent color — not a heavier weight.

---

## Layout and Spacing

### Page Structure

The results page is a single vertical scroll with clear section breaks:

```
┌─────────────────────────────────────────────┐
│ Section label + Page title + Framing note   │  ← Standard padding
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │  HERO REGION (Surface 2)                │ │  ← 1.5rem padding
│ │  ┌──────────┐  ┌──────────────────────┐ │ │
│ │  │ Compass  │  │  Archetype card      │ │ │  ← 1:1 grid, 1.25rem gap
│ │  │ plot     │  │  (Surface 1 + border)│ │ │
│ │  │          │  │                      │ │ │
│ │  └──────────┘  └──────────────────────┘ │ │
│ │  [Share buttons row]                    │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Tension card(s) — if any detected           │  ← Surface 1 + border
├─────────────────────────────────────────────┤
│ Section label + "Radar" heading             │
│ ┌─────────────────────────────────────────┐ │
│ │  RADAR REGION (Surface 2)               │ │  ← 1.5rem padding
│ │  Spider chart + legend                  │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ "Axis breakdown" heading + framing note     │
│ Domain label ─────────────────────────────  │  ← Stone 600 + bottom border
│ Axis row (alternating surface)              │
│ Axis row                                    │
│ Domain label ─────────────────────────────  │
│ Axis row                                    │
│ ... (all 12 axes)                           │
├─────────────────────────────────────────────┤
│ Expandable scoring breakdown                │
└─────────────────────────────────────────────┘
```

### Grid

The hero region uses a 2-column grid: compass plot (1fr) and archetype card (1fr). On mobile (<560px), this stacks to a single column.

The axis breakdown uses a 3-column grid per row: Pole A label (82px fixed) | bar (fluid) | Pole B label (82px fixed). This ensures all bars align regardless of label length.

### Spacing Tokens

```
Section gap:        2rem          (between major sections)
Component gap:      1.5rem        (between elements within a section)
Card padding:       1.25rem       (inside bordered cards)
Surface padding:    1.5rem        (inside Surface 2 regions)
Grid gap:           1.25rem       (between grid children in hero)
Axis row padding:   9px 12px      (inside each axis row)
Domain label margin: 1.25rem top, 0.5rem bottom, 6px padding-bottom (with bottom border)
```

### Border Radius

```
Surface regions (hero, radar):     12px  (large radius — these are containers)
Cards (archetype, tension):        12px  (matching container radius)
Axis rows (alternating):           8px   (subtle rounding)
Badges/pips (tension indicator):   8px   (pill-adjacent)
Buttons:                           8px
Compass plot inner:                6px   (the white rect inside the compass SVG)
Axis bar track:                    3px   (thin element, subtle rounding)
Axis bar fill:                     3px   (matching track)
```

---

## Component Specifications

### The Compass Plot

A square SVG rendered inside the hero region's left column.

**Background:** Surface 1 (white/primary) rect with 6px corner radius, filling the SVG viewBox.

**Grid lines:**
- Two primary axes (horizontal and vertical through center): 0.5px, border-tertiary color
- One dashed inner rect at 43% of the way from center to edge: 0.5px, border-tertiary, dash pattern 3,3, opacity 0.3. This marks the "moderate" zone.
- No concentric circles (that's the radar chart's pattern)

**Topographic contour lines (signature element):**
- 4-5 gently curving horizontal SVG paths
- Stroke: Stone 600, opacity 0.08 (light mode) / 0.05 (dark mode)
- Stroke-width: 0.5px
- These are purely decorative and should be subtle enough that you only notice them if you look for them. They establish the cartographic identity.

**Axis labels:**
- Four cardinal labels: "TRADITIONAL" (top), "PROGRESSIVE" (bottom), "COLLECTIVE" (left), "MARKET" (right)
- 10px, sans-serif, letter-spacing 0.08em, text-tertiary color
- Positioned at the edges of the plot area, centered on their axis

**Quadrant whisper labels (optional):**
- Very low opacity (0.12) labels in each quadrant corner: "Communitarian", "Conservative", "Libertarian left", "Classical liberal"
- 9px, sans-serif, text-tertiary color at 12% opacity
- These should be barely visible — orientation aids, not categories

**Respondent's position:**
- Filled circle, radius 5-6px, Stone 600 fill
- Concentric pulse rings: two additional circles at r=10 and r=16, Stone 600 stroke at 0.5px, opacity 0.45 and 0.2 respectively. These draw the eye without being loud.
- Leader line: 0.5px Stone 600 line at opacity 0.35, extending horizontally from the outermost ring to a coordinate label
- Coordinate label: monospace, 10px, Stone 600, displaying the two super-dimension scores separated by comma (e.g., "-0.34, +0.18")

### The Archetype Card

A Surface 1 card with border, sitting inside the hero region's right column.

**Structure (top to bottom):**
```
"PRIMARY ARCHETYPE"          ← 11px, uppercase, letter-spaced, Stone 600
87%                          ← 36px, serif, weight 500, text-primary
The institutional moderate   ← 17px, serif, weight 500, text-primary
Description paragraph        ← 13px, sans, text-secondary, line-height 1.6
─────────────────────────    ← 0.5px border, 12px padding-top, 14px margin-top
Adjacent: The social         ← 12px, sans, text-tertiary
democrat — 72% match...        "Adjacent:" label weight 500, text-secondary
```

The match percentage (87%) is the visual anchor — it should be the first thing your eye hits on the card. The serif face at 36px makes it feel like a data point, not a quiz result.

### The Tension Card

Appears between the hero and radar sections, only when tensions are detected. One card per flagged tension.

**Structure:**
```
┌──────────────────────────────────────────┐
│  [!] Moderate tension — Axis 6: ...      │  ← Icon + label row
│                                          │
│  Narrative explanation paragraph          │  ← 13px, text-secondary
│                                          │
│  Stated: -0.71    Budget: -0.22          │  ← 12px, monospace, text-tertiary
└──────────────────────────────────────────┘
```

- Card: Surface 1 background, standard border, 12px radius
- Icon: 16px circle, warning background color, "!" character in warning text color, centered in circle
- Label: 12px, weight 500, warning text color
- Narrative: 13px, sans, text-secondary, line-height 1.6
- Values row: 12px, monospace, text-tertiary, flex with 1.5rem gap

### The Radar Chart

Rendered inside a Surface 2 container with 1.5rem padding.

**Grid:**
- Three concentric 12-sided polygons at 33%, 67%, and 100% of radius
- 0.5px stroke, border-tertiary, opacity 0.4
- Six spoke lines (connecting opposing axis pairs) at 0.5px, border-tertiary, opacity 0.25
- The middle polygon (67% / neutral ring) can be very slightly more visible (opacity 0.5) to mark the zero line

**Respondent's polygon:**
- Fill: Stone 600 at ~12% opacity (0.12 fill-opacity)
- Stroke: Stone 600 at ~55% opacity, 1.5px width
- Vertex dots: 3px radius filled circles, Stone 600

**Archetype prototype overlay:**
- Stroke only (no fill): info-blue color (from framework), 1px width, dash pattern 4,3, opacity 0.45
- No vertex dots (keeps it visually subordinate to the respondent's polygon)

**Axis labels:**
- 10px, sans-serif, text-tertiary
- Positioned outside the outermost polygon, aligned to their spoke
- Labels show the Pole B name (the "outward" pole). Optionally show Pole A names in parentheses at lower opacity near the center, but only if space permits

**Legend:**
- Below the chart, simple inline legend: two items
- "[stone dot] Your profile" and "[blue dot] [Archetype name] prototype"
- 12px, sans, text-secondary
- Dots are 8px circles in the respective colors

### The Axis Breakdown

A vertical list of rows grouped by domain, with alternating row backgrounds (from Direction C).

**Domain headers:**
- 11px, sans, uppercase, letter-spacing 0.08-0.10em, Stone 600 text
- Bottom border: 0.5px, border-tertiary
- Margin: 1.25rem top (except first), 0.5rem bottom, 6px padding-bottom

**Axis rows:**
- 3-column grid: [Pole A label: 82px] [bar: fluid] [Pole B label: 82px]
- Padding: 9px 12px
- Alternating rows: even rows get Surface 2 background, odd rows are transparent. Both get 8px border-radius.
- Pole labels: 12px, sans, text-tertiary. Pole A right-aligned, Pole B left-aligned.

**The axis bar:**
- Track: 6px height, 3px border-radius, border-tertiary background (very subtle)
- Center zero mark: 0.5px vertical line, 12px tall (extends 3px above and below the track), border-secondary color
- Fill: Extends from center toward the respondent's score position. Stone 600, opacity 0.45. If score is negative, fill extends leftward from center. If positive, fill extends rightward.
- Dot marker: 12px diameter circle positioned at the score. 2px Stone 600 border, Surface 1 fill (so it reads as a ring). Positioned with its center at the score's location on the bar.
- Score value: 10px, monospace, text-secondary. Positioned above the dot marker, offset slightly to avoid overlap with the dot.

**Tension pip:** When an axis has a detected tension, display a small inline badge next to the Pole B label:
- Text: "! tension"
- Style: 10px, warning text color, warning background color, 8px border-radius, 2px 7px padding
- The "!" can be a text character, not a separate icon

### The Scoring Breakdown (Expandable)

A toggle at the bottom of the axis breakdown section.

**Toggle button:**
- Text: "▸ See how this was scored" (collapsed) / "▾ Hide scoring breakdown" (expanded)
- 13px, sans, text-secondary, no border, no background, cursor pointer
- Hover: text-primary

**Expanded content:**
- Brief explanatory paragraph: 13px, sans, text-secondary
- Per-axis breakdown (show one axis as the example, with a note that all axes follow the same pattern):
  - Domain label (same style as axis breakdown)
  - 2×2 grid of detail cards:
    - Each card: 12px, sans, text-secondary, Surface 2 background, 8px radius, 6px 10px padding
    - First line: modality name and score (e.g., "Forced-choice: -0.33")
    - Second line: brief context (e.g., "2 of 3 chose Collective") in 11px, text-tertiary
  - Formula line below the grid: monospace, 12px, text-tertiary
    - Shows the actual weighted calculation: "(0.40 × -0.33) + (0.35 × -0.50) + (0.25 × -0.22) = -0.34"

### Share Buttons Row

Positioned at the bottom of the hero region, inside the Surface 2 container.

- Horizontal flex row, 8px gap
- Each button: 12px sans, 6px 14px padding, 8px border-radius, border-secondary 0.5px border, Surface 1 background, text-secondary color
- Hover: Surface 2 background, text-primary color
- Three buttons: "Copy image", "Copy link", "Download raw data"
- No icons — text only, keeping with the typographic-first aesthetic

---

## Quiz Phase Theming

The results page is the most complex design surface, but the quiz phases need consistent treatment.

### Phase 1: Forced-Choice

- One question per screen, full width
- The two statements displayed as two equal cards (Surface 1, standard border, 12px radius)
- Side-by-side on desktop (2-column grid, 1.25rem gap), stacked on mobile
- Selected state: Stone 600 border (2px — the only place a 2px border is used), replacing the default 0.5px border. No other visual change — no background shift, no check mark. The heavier border is sufficient.
- "A" and "B" labels are NOT shown — the respondent chooses between statements, not letters
- Navigation: "Back" and "Next" buttons at the bottom, standard button style. "Next" is disabled until a selection is made.

### Phase 2: Scaled Items

- One question per screen
- Question stem: 16px, sans, weight 500, text-primary
- Five response options displayed as a horizontal segmented bar on desktop:
  - Each segment is a tappable/clickable region
  - Segments have 0.5px borders between them and 12px radius on the overall bar's outer edges
  - Unselected: Surface 1 background
  - Selected: Stone 100 background, Stone 600 text
  - Each segment shows its label text: 12-13px, sans, centered within the segment
- On mobile (<560px): vertical stack of 5 tappable rows, each with 12px radius, 0.5px border
- The option text should be the full label from the question bank — not abbreviated

### Phase 3: Chancellor's Budget

- All 10 ministries visible simultaneously (scrollable on mobile)
- Each ministry row: ministry name (14px, weight 500), description (12px, text-secondary, single line), and a +/- stepper control with the current value between them
- Stepper: minus button | value (16px, monospace, weight 500) | plus button
- Buttons: 32px square, standard button style, "−" and "+" characters
- Disabled state (at minimum 5): muted button, text-tertiary
- Treasury counter: sticky at the top of the phase, Surface 2 background, showing "Discretionary remaining: 23 of 50" in 14px sans with the number in monospace weight 500
- Below-baseline warning: when a ministry drops below 10, display the consequence text from the spec inline below the ministry name in 12px, warning text color, with the warning icon. Appears/disappears dynamically.
- "Finalize budget" button: full width at the bottom, Stone 600 background, white text, 12px radius, disabled (Stone 400 background) until allocations sum to 100

### Phase Transitions and Progress

- Progress bar: thin (3px), full width, at the very top of the quiz container
  - Three segments (one per phase), separated by 2px gaps
  - Completed segments: Stone 600 fill
  - Current segment: Stone 600 fill, proportional to progress within phase
  - Future segments: border-tertiary fill
- Phase interstitial screens: centered layout, serif heading for the phase name, sans body text for the description, single "Continue" button

### Pre-Quiz Introduction

- Centered layout, max-width 640px
- Title: "The governance compass" in h1 (22px serif)
- Description and phase list in body text (14px sans)
- Timing estimate: 12px, text-tertiary, italic serif
- "Begin assessment" button: same treatment as "Finalize budget" — Stone 600 background, white text, 12px radius. This is one of only two filled/primary buttons on the entire site (the other being "Finalize budget"). Every other button is outlined/ghost style.

---

## Responsive Breakpoints

```
Desktop (>768px):
  - Hero grid: 2 columns (compass + archetype card)
  - Forced-choice: side-by-side statement cards
  - Scaled items: horizontal segmented bar
  - Budget: all 10 ministries visible, 2-column grid
  - Radar chart: minimum 400px width
  - Axis breakdown: full 3-column rows

Tablet (560–768px):
  - Hero grid: 2 columns still, but tighter gap (1rem)
  - Everything else same as desktop
  - Radar chart: minimum 340px

Mobile (<560px):
  - Hero grid: single column (compass stacked above archetype card)
  - Compass plot: full width, maintains square aspect ratio
  - Forced-choice: stacked statement cards
  - Scaled items: vertical option list
  - Budget: single-column ministry list, sticky treasury counter
  - Radar chart: minimum 300px, consider offering a "switch to bar view"
    toggle that replaces the spider chart with a simple horizontal bar
    list (identical to the axis breakdown) for readability on small screens
  - Axis breakdown: Pole A/B labels shrink to 64px, or switch to a
    tooltip-on-tap pattern where the pole name appears above the bar
    when tapped
```

---

## Animation and Transitions

Keep animation minimal and purposeful. This is a serious instrument, not a playful app.

```
Selection state changes:     150ms ease — border color, background color
Hover states:                120ms ease — background color, text color
Expandable sections:         200ms ease — height reveal (use max-height transition or
                             a disclosure widget). No accordion bounce.
Phase transitions:           300ms fade — simple opacity crossfade between phases
Results loading:             1.5–2s artificial delay with a subtle loading indicator
                             (a thin Stone 600 line animating across the top,
                             matching the progress bar style). This creates a sense
                             that computation is happening.
Radar chart (optional):      On first render, the polygon can animate from the center
                             outward (each vertex extends from 0 to its final position)
                             over 600ms with a gentle ease-out. This is the ONE moment
                             of visual delight on the results page. If it adds
                             implementation complexity, skip it — the results work
                             fine without animation.
```

No parallax, no scroll-triggered animations, no particle effects, no physics-based springs. The design's authority comes from stillness and precision.

---

## Iconography

The site uses almost no icons. This is deliberate — the typographic-first aesthetic is cleaner without them.

**The exceptions:**
- Tension indicator: "!" character inside a 16px warning-colored circle. Not an SVG icon — a styled text character.
- Expand/collapse toggle: "▸" / "▾" text characters. Not chevron SVGs.
- Stepper buttons: "−" and "+" text characters.

If you need additional icons in the future (e.g., for share buttons), use a minimal line-icon set at 16px. Never filled icons, never colored icons, never icons larger than 16px.

---

## Accessibility Notes

- All Stone 600 text on Surface 1 backgrounds passes WCAG AA for normal text (contrast ratio ~4.8:1). For small text (under 14px), use Stone 800 instead.
- All Surface 2 on Surface 1 pairings and vice versa must maintain at least 3:1 contrast for borders and UI elements.
- The selected state in forced-choice (2px Stone 600 border) must be distinguishable without color — the border width change from 0.5px to 2px provides a non-color signal.
- The tension pip uses both color (warning amber) and a text character ("!") to indicate its presence — not color alone.
- The radar chart polygon's Stone 600 fill at 12% opacity is decorative; the actual data is communicated by the axis breakdown table below it. The radar chart is an at-a-glance visualization, not the primary data display.
- Focus rings on interactive elements: 2px Stone 600 outline with 2px offset. Visible on keyboard navigation, hidden on mouse/touch.

---

## File / Asset Summary

The entire design is achievable with zero image assets. Everything is CSS, SVG, and text:

- Topographic contour lines: inline SVG paths (4-5 gentle curves)
- Compass plot: inline SVG
- Radar chart: inline SVG (generated from score data)
- All icons: text characters
- All fills and patterns: CSS

The only external dependency is the font stack, and the design works with system fonts — no web font loading required. If you want to add a specific serif web font later (e.g., Newsreader, Source Serif, or Lora), it would enhance the editorial feel but is not necessary for v1.
