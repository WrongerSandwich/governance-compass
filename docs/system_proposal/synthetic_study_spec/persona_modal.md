# Synthetic Study — Persona Modal

The persona modal is the deepest single view on the site. It shows everything the dataset contains about one persona, arranged to be read top-down at a glance or scrolled through for depth. Opened from the Personas page (click a card) or from individual case studies on the Model Agreement page.

## Design constraints

Four things shape the modal's structure:

1. **Everything fits.** The modal contains 24+ demographic/bio fields, a radar chart, 12 axis scores with confidence indicators, a budget allocation, axis-level tensions, and 60 raw responses — plus dual-model overlay for shared personas. The structure has to prevent this from feeling overwhelming.

2. **Mode-switching for shared personas.** The same modal supports single-model personas (one set of scores, one budget, one response set) and shared personas (two of each). The layout degrades gracefully — shared personas feel like a richer version of single-model personas, not a different UI.

3. **Shareable URLs.** Stable URL per persona (`?persona=<id>`) means the modal is an artifact someone might link to. The first screenful must convey who this persona is and what their profile looks like.

4. **Mobile.** Full-width modal on mobile. Radar charts remain legible. Side-by-side comparisons for shared personas become stacked.

---

## Layout, top to bottom

### Zone 1 — Header

What loads first, what shows in the share preview. Single-screen-width, ~120px tall on desktop.

**Contents:**
- **Persona name** (large, serif, prominent — matches site's heading typography)
- **One-line identity summary:** `Age 45 · Software developer · Leipzig, Germany · Western Europe`
- **Three badges on the right:**
  - Archetype badge
  - Cluster badge
  - Shared-persona indicator (if applicable)

#### Archetype badge

Archetype name in small caps, with emergence tag below in smaller text: "*refined*" or "*empirical*" or "*theoretical*". Colored by the cluster's color. Includes a match-strength indicator:

- **Strong match** — distance < 1.0
- **Moderate match** — 1.0 ≤ distance < 1.5
- **Close match** — 1.5 ≤ distance < 2.0
- **Weak match** — distance ≥ 2.0

Shown as a small text annotation below the archetype name, e.g., "The Pragmatic Centrist — *moderate match*".

Tappable — opens the Archetypes page scrolled to that archetype.

#### Cluster badge

Format: "**C2** — Toward sovereignty, tradition, and cohesion" in a small chip. Cluster color as background. Tappable:
- From Patterns page, scrolls to that cluster's card.
- From anywhere else, navigates to Patterns page and scrolls to the cluster card.

#### Shared-persona indicator

Only present for the 150 shared personas. Small icon + text: "Both models". Tappable — scrolls the modal down to the raw responses section where the Claude/Gemini toggle lives.

### Zone 2 — Biographical block

Below the header, full-width, ~400–500px tall.

**Desktop layout:** two columns.

**Left column (60% width):** The biographical narrative. This is Gemini's full `life_narrative` + `key_tensions` content, rendered as prose paragraphs. This is the most humanizing part of the profile — should render with enough typographic care that it reads as a bio, not as a data field.

**Right column (40% width):** Structured demographic fields, grouped into three small blocks:

- **Situation:** urban/rural, economic position + detail, family, religious tradition
- **Life context:** education, occupation
- **Governance experience:** the category (stable_democracy, flawed_democracy, etc.) + the detailed description

Field labels in small caps, values in regular weight. Compact but readable.

**Mobile layout:** Right column collapses into a "Show details" disclosure block below the narrative. Narrative is primary on mobile.

### Zone 3 — Scored profile

The visual centerpiece. Data-dense but immediately-parseable view of the persona's governance philosophy.

**Stacked, not tabs.** Tabs hide information and make comparison harder. The persona contains "everything" so everything is visible; scroll does the rest.

#### Layout

- **Top-left:** 12-axis radar chart (moderate size, ~300×300 on desktop). Axis labels at each vertex with short axis name.
- **Top-right:** 12 axis score rows. Each row: axis number, axis name, the signed score displayed numerically, a horizontal bar showing position on the -1 to +1 range, and a small confidence indicator.
- **Beneath both:** budget allocation strip — horizontal bar segmented into 7 ministries, each segment sized proportionally, labeled with allocation amount. Same cartographic style as the Chancellor's Budget on the main quiz. Absolute values shown (e.g., "Defense: 4 pts"), with total (50) indicated nearby for context.

#### Confidence indicators

Small dots or bars next to each axis score. Three levels (high / moderate / low) mapping to the confidence field in the scored profiles. Hover/tap reveals:

- **High:** "High confidence: all three modalities aligned"
- **Moderate:** "Moderate confidence: minor divergence between FC, SC, and Budget"
- **Low:** "Low confidence: forced-choice, scaled, and budget responses diverged"

This surfaces the internal consistency signal without cluttering the primary view.

#### Tensions as inline badges

Axes with tensions (mild/moderate/strong) get a small tension badge inside their score row. Clicking expands to show what the tension is: "Forced-choice answers lean collective provision (-1.0); budget allocation suggests market orientation (+0.93). Strong tension."

No separate tensions section — tensions live where they're contextual (in the axis score row).

#### Shared personas: dual-model overlay

For the 150 shared personas, this whole zone renders in an **interleaved** format rather than stacked:

- **Single radar chart** with two overlaid polygons: Claude's profile in warm stone/clay tone, Gemini's in cooler slate tone.
- **Single axis-scores table** with two values per axis side by side — one column for Claude's score, one for Gemini's. Makes axis-by-axis comparison possible without scrolling.
- **Two budget strips stacked** (Claude's, Gemini's) with model labels.
- **Tensions** appear as two separate badge sets per axis (one per model), since tension patterns are per-administration.

Model tones (`--model-claude`, `--model-gemini`) should match those used on the Model Agreement page for consistency across the section.

The overlaid radar especially earns its real estate — it makes agreement and disagreement visible at a glance.

**Mobile adaptation:** For shared personas, the axis scores table rows show Claude and Gemini values stacked within each row rather than side-by-side.

### Zone 4 — Raw responses (collapsible, closed by default)

At the bottom of the modal, a single **"View responses"** toggle expands a block containing all 60 raw responses.

#### Closed state

Single row, "View responses" + caret. Minimal vertical real estate.

#### Open state

Responses grouped by axis, not by modality. Each axis is a subsection:

```
Axis 1 — Economic Model
  FC-1-1: [question text] → A (toward Collective Provision)
  FC-1-2: [question text] → A
  FC-1-3: [question text] → B
  SC-1-1: [question text] → 3 (Agree)
  SC-1-3: [question text] → 2 (Disagree)
  Budget signal: Public Welfare (9) + Economy & Growth (11) → +0.93 toward Market
```

This makes the scored profile auditable. Someone who wants to understand why this persona scored -0.29 on Axis 1 can see the exact responses that produced it, axis by axis.

#### Shared personas

The raw responses section has a **Claude / Gemini toggle** at the top — tabs, not side-by-side, because the response content is dense enough that two full sets in view simultaneously becomes illegible. The toggle preserves the reader's axis scroll position when switched.

Question text pulls from the question bank via the existing ID lookup (dependency on the site's main question bank data). Choice labels ("A", "3") stay as-is but get the meaningful descriptor next to them so the reader isn't translating codes.

### Zone 5 — Footer

Minimal.

- **Left side:** "Share this persona" action, copies the stable URL to clipboard.
- **Right side:** navigation to next/previous persona within the current filter state — so readers can browse without closing and reopening the modal.

---

## Mobile adaptations

Desktop is 800–1000px wide; mobile is 360–400px. Compression notes:

- **Header:** Name on its own line, identity summary below, badges wrap to a second row.
- **Biographical block:** Right column collapses into "Show details" disclosure below narrative.
- **Scored profile:**
  - Radar chart at full mobile width (~340px), still legible.
  - Axis scores table becomes single-column: each row shows axis name, score bar, score value, tension badge, confidence indicator.
  - Budget strip full-width horizontal.
  - Shared personas: overlaid radar still works at mobile width; axis scores table rows show Claude and Gemini values stacked within each row.
- **Raw responses:** Same collapsible pattern, same axis grouping. The Claude/Gemini toggle becomes a full-width segmented control.
- **Footer:** Share action and prev/next remain; prev/next as full-width buttons rather than icons.

---

## Edge cases

- **Transnational personas:** Location field shows city + "Transnational" as the region rather than a geographic region. No map-related display changes — the modal doesn't render a map.
- **Personas with missing data:** Some budget allocations may have null values for a given ministry, some modality scores may be null. Render missing values as explicit "Not answered" rather than blank — honesty about the data's shape.
- **Non-binary / indigenous / edge-case demographics:** Render as-is without special treatment. Gender shows "non_binary" → "Non-binary" in the display. Religious traditions render the full string from the data.
- **Very long biographical narratives:** Some narratives are 200 words, some are 80. No truncation — the modal scrolls, and the narrative is the humanizing part of the profile.

---

## Animation and transitions

Minimal, not flashy.

- Soft fade-in on modal open (~200ms).
- Radar chart polygon draws in over ~400ms on open.
- No other animations. No bounce, no parallax, no content shuffling.

---

## Out of scope for v1

Explicitly not in this version:

- **Per-persona archetype distance chart** (showing distance to all 12 archetypes as a small bar chart). The archetype badge's match-strength indicator captures the relevant signal.
- **PDF or image export of individual personas.** Sharing via URL is sufficient for v1.
- **Comparison view triggered from within the modal.** The Personas page's pin-to-compare flow handles this.

---

## Data dependencies

For each persona, on modal open, load:

- Bio fields from `personas.json`
- Scored profile from `scored_profiles.json` (one or two administrations depending on shared status)
- Raw responses from `claude_responses.json` and/or `gemini_responses.json`
- Archetype data from `archetype_comparison.json` (via persona's cluster)
- Question text from the existing site question bank

Modal data loads on demand — preloading all 1,002 personas' full bios and responses would bloat the initial page payload.
