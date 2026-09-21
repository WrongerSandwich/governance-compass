# The Governance Compass — Results & UI Specification

## Purpose and authority

This document describes the shipped assessment flow and results experience. It
specifies structure, behavior, and user-facing information rather than the
visual token system; for typography, colour, spacing, and component treatment,
see `governance_compass_design_spec.md`. Scoring formulas and thresholds live in
`src/lib/scoring.ts` and `src/lib/scoring-types.ts`.

The assessment has three phases:

1. 36 forced-choice governance dilemmas
2. 24 calibrated five-point scales
3. A 50-point budget across seven ministries

Answers are encoded in the browser and carried to `/results` in the `r` query
parameter. Completing the assessment does not require an account or a server
submission.

---

## Part 1: Assessment flow

### Shared behavior

The assessment is a linear three-phase flow with explicit interstitials between
phases. Each question screen includes a three-segment progress indicator. The
active segment reports the respondent's position within that phase to assistive
technology; the budget is reported as the single screen in phase three, not as
"100% complete" on arrival.

Questionnaire state is saved to `sessionStorage` while the assessment remains
resumable. Returning to `/quiz` in the same tab offers to continue or start
over. Invalid, stale, or structurally incomplete saved state is discarded. The
terminal computing and completed states are removed from storage so a later
visit cannot become trapped on the computing screen.

The question lists are shuffled from a persisted random seed. Previous and Next
allow navigation within a phase. Next is disabled until the current question
has a response, but a separate "Skip this question" action advances without
one. Returning to a skipped question is allowed; there is no end-of-phase skip
summary.

### Phase 1: Governance dilemmas

The introductory card explains the forced-choice format, the 36-question count,
the approximate eight-minute duration, and automatic progress saving.

Each item presents two equally weighted statements. They sit side by side from
560px upward and stack on narrower screens. The visual position of Pole A and
Pole B is deterministically swapped from the item ID, while the logical pole
stored for scoring never changes. Selecting a card marks it as selected and
dims its sibling; the choice can be changed before advancing.

The first question may show a one-time hint explaining glossary terms. Terms
inside question copy open plain-language definitions without taking over the
choice card's own control or focus treatment.

### Transition to phase 2

The interstitial reports how many dilemma responses were recorded, introduces
the calibrated scales, and gives an estimated time of about five minutes. It
does not advance automatically.

### Phase 2: Calibrated scales

Each of the 24 items presents a question and five ordered responses from one
governance pole to its counterpart. The response order is never randomized.

At 560px and above, the options form a horizontal segmented control. On smaller
screens, they become bordered rows. Selecting an option reveals its longer
description in a polite live region. Number keys 1–5 select the corresponding
option unless focus is inside a text input or modifier keys are held.

### Transition to phase 3

The interstitial reports the recorded scale responses and introduces the
Chancellor's Budget: 50 points, seven ministries, and deliberately insufficient
resources. It gives an estimated time of about three minutes and waits for an
explicit Continue action.

### Phase 3: The Chancellor's Budget

The seven ministries are:

- Defense
- Public Welfare
- Economy & Growth
- Education & Research
- Environment
- Justice & Civil Liberties
- Foreign Affairs

Every ministry begins at one point, leaving 43 points to allocate. A ministry
may receive between 1 and 25 points, and the total may not exceed 50. Minus and
plus buttons make single keyboard- or pointer-driven steps; holding a pointer
accelerates repeated steps and stops at a bound or on release, cancellation, or
window blur.

Each allocation maps to one of five consequence descriptions for that ministry.
Consequences appear after the respondent first changes an allocation and update
as it crosses a tier. They explain the implied tradeoff without blocking the
choice.

The remaining-point count stays visible. The Confirm budget action is enabled
only when all 50 points have been allocated. On small screens it remains in a
sticky bottom action area.

### Completion and encoding

Confirmation packs the current answers into response-codec version 3:

- 36 forced-choice values at two bits each
- 24 scale values at three bits each
- Seven budget allocations at five bits each

The result is an approximately 32-character base64url string. Encoding happens
before the computing state begins, so an encoding failure leaves the budget and
its retry action available. Storage failure does not block completion.

The computing screen announces its busy state, cycles through explanatory
messages, and redirects after about 1.8 seconds to `/results?r=<encoded>`.

---

## Part 2: Results display

The results page is a single scrollable report in this order:

1. Archetype
2. Twelve-axis radar
3. Tensions
4. Axis breakdown
5. Two-dimensional compass

A jump-navigation row links to all five sections. The report uses an 820px
maximum measure, with the same content order at every viewport width.

### Header

The header names the primary archetype and its match percentage. A profile that
has strong positions but does not map cleanly to one prototype is introduced as
"A distinctive profile" and names the nearest match in supporting copy.

### Archetype

The archetype panel shows:

- Primary archetype and match percentage
- A short summary
- The adjacent archetype and its match percentage
- A blended-type notice when the two closest prototypes are nearly tied
- An expandable description and characteristic tension
- A link to the archetype's entry in the reference page

Distinctive profiles use a dedicated explanation and compare the two nearest
archetypes rather than presenting either one as a definitive identity.

The panel also contains the shipped result actions:

- **Copy link** copies the current URL, with a legacy selection fallback when
  the Clipboard API is unavailable.
- **Compare with someone** accepts either another result URL or its raw encoded
  value, then opens `/compare?a=<mine>&b=<theirs>`.

Saving to an account is not exposed in the v1 results interface.

### Twelve-axis radar

The radar is the primary visualization of the full profile. The twelve spokes
are ordered by axis ID and therefore form four contiguous domain groups:

- Economic Organization: axes 1–2
- Power and Authority: axes 3–6
- Society and Identity: axes 7–9
- The State in the World: axes 10–12

For each spoke, the center represents −1.00 (Pole A), the dashed middle ring is
0.00, and the perimeter represents +1.00 (Pole B). One polygon connects the
twelve scores; domain-coloured dots mark the vertices. Pointer hover on a dot
shows the score magnitude and the pole it favors.

The SVG is decorative to assistive technology. A visually hidden table carries
the axis name and poles, domain, formatted score, and confidence for all twelve
axes.

### Tensions

A tension exists when stated responses and the budget signal pull toward
opposite poles on an axis strongly enough to cross the scoring threshold.

The section always renders so its jump link always has a destination. When
tensions exist, each panel names the level and axis and explains which pole the
questionnaire favors versus which pole the budget favors. When none exist, an
explicit empty state says that stated views and budget priorities point in the
same direction on all twelve axes.

### Axis breakdown

The twelve rows are grouped by the same four domains used by the radar. Every
row includes:

- Axis number, name, and tagline
- Pole labels and a dot-on-track scale
- Final score from −1.00 to +1.00
- High, moderate, low, or conflicted confidence
- A tension marker when applicable

"Show scoring details" reveals a disclosure for each row. Expanding it shows
the forced-choice, calibrated-scale, and budget component scores and the exact
axis-specific weighted equation. Axes without a budget signal display no
invented budget contribution.

### Compass plot

The compass is intentionally the last result because it compresses twelve axes
into two super-dimensions. Its horizontal direction runs from Collective to
Market; its vertical direction runs from Progressive at the bottom to
Traditional at the top.

The square plot includes:

- Crosshair and cartographic contour lines
- Reference positions for the archetypes, with collision-suppressed labels
- The respondent's position and coordinate readout
- The primary archetype emphasized when the profile is not distinctive

The compass is a summary and wayfinding aid, not a replacement for the radar or
axis breakdown.

---

## Part 3: Result sources and sharing

### Encoded results

`/results?r=...` decodes and scores entirely in the client. A missing payload
redirects to the quiz. Malformed or unsupported payloads render an error with a
route back to a new assessment.

Only quiz completion updates the browser's saved "last results" value, which
the navigation and returning-user link use. Opening someone else's shared link
does not replace the respondent's own result link.

### Materialized profiles

`/results/[profileId]` renders an account-backed, materialized profile through
the same `ResultsView`. The URL-encoded route remains the no-account sharing
path and does not require a database write.

### Deliberately absent exports

The shipped results interface does not generate a shareable image or raw-data
download. Those concepts belonged to the original proposal and are not current
product behavior.

---

## Part 4: Responsive behavior

The quiz column is capped at 672px and the results column at 820px. Page gutters
step from 18px to 28px at 560px.

At the same 560px breakpoint:

- Forced-choice cards change from stacked to two columns.
- Scale options change from vertical rows to a segmented bar.
- Axis-breakdown taglines move from below the scale into a third column.
- The budget confirmation area stops being sticky and returns to normal flow.

Result charts use responsive SVG view boxes. Labels and reference markers stay
inside their drawing areas, and the results page prevents horizontal overflow.

---

## Part 5: Accessibility and resilience

- All assessment choices and result disclosures are native buttons or links.
- Forced-choice cards expose pressed state through their direct button child.
- Scale options expose pressed state and support number-key selection.
- Budget steppers remain focusable at their bounds with `aria-disabled`, so
  allocating the last point does not throw focus elsewhere on the page.
- Question position, selected-option detail, computing state, and finalization
  failures use appropriate live regions.
- The progress indicator has a name, numeric range, and human-readable position.
- The radar has a complete hidden data table; dot-on-track scales have generated
  text descriptions; the compass includes a textual coordinate readout.
- Focus uses the shared `focus-ring` utilities, including the scoped wrapper
  form for forced-choice cards that contain glossary controls.
- Reduced-motion preferences collapse animation and transition durations.
- Storage, clipboard, malformed-link, and stale-session failures all have
  explicit fallbacks rather than trapping the respondent.
