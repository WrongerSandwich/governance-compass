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

The entire site runs on a single warm accent color and its tints/shades. This color evokes aged paper, survey maps, and institutional brass — it reads as authoritative without being corporate.

```
Stone 900 (darkest):  #3d2e1f    — text on stone backgrounds in light mode
Stone 800:            #5a4636    — primary accent text, headings on colored surfaces
Stone 700:            #6e5a48    — secondary accent text
Stone 600:            #85735e    — THE primary accent. Compass dot, radar polygon fill/stroke,
                                   axis bar fills, domain separator labels, dot markers.
                                   This is the "brand color."
Stone 500:            #9d8b78    — hover states, secondary indicators
Stone 400:            #b5a594    — disabled/muted accent elements
Stone 300:            #cdbfb2    — light borders on accent surfaces
Stone 200:            #e0d6cc    — light fills, tag backgrounds
Stone 100:            #efe9e3    — very light surface tint
Stone 50:             #f7f4f0    — barely-there warm tint for large surfaces
```

**Usage rules:**
- Stone 600 is the default for any accent element: dots, polygon fills (at reduced opacity), bar fills, section divider labels
- Stone 800/900 for text that sits on stone-tinted backgrounds
- Stone 200/100 for subtle surface tinting (optional — the site works fine with neutral surfaces too)
- Never use stone as a background for large areas — it's an accent, not a surface color

### Surfaces and Text

Use the host framework's semantic color system (CSS custom properties or your Next.js theme tokens). The design relies on three surface levels for depth:

```
Surface 1 (primary):     Background of cards, archetype card, axis breakdown rows (alternating)
Surface 2 (secondary):   Background of hero regions, radar chart container, alternating rows
Surface 3 (tertiary):    Page background (if distinct from Surface 2)
```

The hero region (compass + archetype card) sits on Surface 2. The archetype card sits on Surface 1 with a border, creating a "card rising from surface" effect. The axis breakdown uses alternating Surface 1 / Surface 2 rows.

Text colors follow the standard three-tier hierarchy:
```
Text primary:    Headings, axis scores, archetype name
Text secondary:  Body text, descriptions, axis pole labels
Text tertiary:   Section labels, coordinates, confidence notes, quadrant whisper labels
```

### Semantic Colors

Used sparingly for specific functional purposes only:

```
Warning (amber):   Tension indicators — badge background, icon, label text
                   Use the framework's warning background/text tokens
Info (blue):       Archetype prototype overlay on radar chart (dashed line)
                   Optional: used if you ever add a "compare with friend" feature
```

No other semantic colors appear in the default results. The design is deliberately near-monochrome with the stone accent.

### Dark Mode

The stone palette inverts naturally — Stone 600 remains the primary accent in both modes (it has sufficient contrast against both light and dark backgrounds). In dark mode:

- Surface layering reverses: Surface 2 becomes darker than Surface 1 (the card still "rises" visually)
- Stone-filled elements (compass dot, radar polygon, axis bars) remain Stone 600 — their opacity values handle the adaptation
- Topographic contour lines on the compass reduce to ~5% opacity (from ~8% in light mode)
- The axis dot markers switch: Stone 600 border remains, but the fill becomes the primary surface color (so the dot reads as a "hole" with a stone ring)

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
The civic institutionalist   ← 17px, serif, weight 500, text-primary
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
