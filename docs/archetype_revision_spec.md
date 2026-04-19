# Archetype Revision Spec (v2)

**Context**: In April 2026, a synthetic population study administered the full Governance Compass instrument (36 forced-choice + 24 scaled + 7-ministry budget) to ~1,000 biographical personas across 10 regions using both Claude Sonnet 4.6 and Gemini 2.5 Flash. KMeans clustering at k=6 surfaced six empirical clusters. The interpretation pass recommended a revised `ARCHETYPE_PROTOTYPES` set: one new archetype derived empirically, four existing archetypes refined toward empirical centroids, two existing archetypes merged into one renamed archetype, and the rest kept as theoretically derived.

**Goal**: Update the codebase to reflect the revised archetype set, introduce an "emergence" tag on each archetype, and wire the new tag into the archetype detail and list UI. Content additions (descriptions, tensions, card copy) are in a companion file: `archetype_content_v2.md`.

**Total archetypes**: 12 (same count as before). Net change: removed Civic Institutionalist; renamed Pragmatic Centrist → Institutional Moderate (with new vector and content); added Popular Egalitarian.

---

## 1. Summary of changes

| # | Action | Archetype | Emergence | Notes |
|---|---|---|---|---|
| 1 | **ADD** | Popular Egalitarian | empirical | New. Derived from cluster C1 (n=178, 17.8% of synthetic population) |
| 2 | **REFINE** | Radical Egalitarian | refined | Vector updated toward C4 centroid (d=0.78, strongest match) |
| 3 | KEEP | Social Democrat | theoretical | No matching cluster; kept for theoretical coherence |
| 4 | KEEP | Green Communalist | theoretical | No matching cluster; kept for theoretical coherence |
| 5 | **REFINE** | Communitarian Steward | refined | Vector updated toward C3 centroid (d=1.09, clean match) |
| 6 | **RENAME + REFINE** | Institutional Moderate | refined | Was "Pragmatic Centrist"; vector updated toward C0 centroid |
| 7 | **REMOVE** | Civic Institutionalist | — | Absorbed into Institutional Moderate |
| 8 | KEEP | Cosmopolitan Technologist | theoretical | No matching cluster; kept for theoretical coherence |
| 9 | KEEP | Free Marketeer | theoretical | No matching cluster; kept for theoretical coherence |
| 10 | KEEP | Libertarian Individualist | theoretical | No matching cluster; kept for theoretical coherence |
| 11 | **REFINE** | Developmental Modernizer | refined | Vector updated toward C5 centroid (d=1.02) |
| 12 | **REFINE** | Nationalist Populist | refined | Vector significantly updated toward C2 centroid — notable structural change |
| 13 | KEEP | Authoritarian Traditionalist | theoretical | No matching cluster; kept for theoretical coherence |

Resulting count: 12 archetypes (5 refined, 1 empirical, 6 theoretical).

---

## 2. Schema changes

Two new fields on each archetype object.

### 2.1 `emergence` (required)

An enum indicating how the archetype's prototype vector was derived.

```typescript
type Emergence = 'empirical' | 'refined' | 'theoretical';

// Display labels (for UI)
const EMERGENCE_LABELS: Record<Emergence, string> = {
  empirical: 'Emerged from data',
  refined: 'Refined with data',
  theoretical: 'Theoretically derived',
};

// Tooltip text (for hover/tap explanation)
const EMERGENCE_TOOLTIPS: Record<Emergence, string> = {
  empirical: 'This archetype was identified through a synthetic population study in April 2026. Its prototype vector is centered on an empirical cluster rather than designed from comparative political philosophy.',
  refined: 'This archetype was originally hand-crafted from comparative political philosophy, then its prototype vector was adjusted toward the empirical centroid of the matching cluster in a synthetic population study (April 2026).',
  theoretical: 'This archetype is derived from comparative political philosophy. No strong empirical cluster matched it in the synthetic population study, but it represents a coherent and historically grounded tradition.',
};
```

### 2.2 `cardDescription` (required)

A 2–3 sentence version of the description used on the archetypes list page card. The existing `description` field becomes the "detail view" description (used on the archetype detail page). Exact copy for each archetype is in `archetype_content_v2.md`.

If the current code uses a single `description` field for both contexts, split it: move the longer text to `description` and add the shorter `cardDescription`.

### 2.3 Updated TypeScript interface (proposed shape — adapt to actual schema)

```typescript
type Emergence = 'empirical' | 'refined' | 'theoretical';
type AxisVector = [
  number, number, number, number,  // axes 1–4
  number, number, number, number,  // axes 5–8
  number, number, number, number,  // axes 9–12
];

interface Archetype {
  id: string;                // slug, kebab-case
  name: string;              // display name, "The X" format
  description: string;       // detail-view description (~5–7 sentences)
  cardDescription: string;   // list-view description (~2–3 sentences) — NEW
  tension: string;           // "Characteristic tension"
  vector: AxisVector;        // 12-element axis vector, range [-1, 1]
  emergence: Emergence;      // NEW
}
```

---

## 3. Structural changes

### 3.1 Remove: Civic Institutionalist

- Delete the archetype object with id `civic-institutionalist` from `ARCHETYPE_PROTOTYPES`.
- Remove any static route/page keyed on that slug (e.g., `/archetypes/civic-institutionalist`).
- Remove any references in fixtures, tests, snapshots, mock data.
- No redirect is needed (site is pre-launch; no known shared links to that URL). If a redirect is desired as a belt-and-braces measure, redirect `/archetypes/civic-institutionalist` → `/archetypes/institutional-moderate`.

### 3.2 Rename: Pragmatic Centrist → Institutional Moderate

- Change the archetype's `id` from `pragmatic-centrist` to `institutional-moderate`.
- Change the `name` from `The Pragmatic Centrist` to `The Institutional Moderate`.
- Replace `description`, `cardDescription`, and `tension` with the new content from `archetype_content_v2.md`.
- Replace `vector` with the new prototype (see §4 below).
- Add `emergence: 'refined'`.
- Redirect `/archetypes/pragmatic-centrist` → `/archetypes/institutional-moderate` (301). Update sitemap.
- Update any test fixtures or example quiz-result JSON that refer to `pragmatic-centrist`.

### 3.3 Add: Popular Egalitarian

- Create a new archetype object with:
  - `id: 'popular-egalitarian'`
  - `name: 'The Popular Egalitarian'`
  - `description`, `cardDescription`, `tension` — from `archetype_content_v2.md`.
  - `vector`: see §4 below.
  - `emergence: 'empirical'`.
- Ensure it appears on the archetypes list page and has a detail route.
- Consider placing it adjacent to Radical Egalitarian in the list (see §6).

---

## 4. Prototype vector updates

All vectors are ordered [axis1, axis2, ..., axis12]. Values rounded to the nearest 0.05. Ranges: -1.0 to +1.0.

Axis reference (sign convention: negative pole → positive pole):
- 1: Collective Provision → Market Allocation
- 2: Ecological Limits → Growth Imperative
- 3: Distributed Governance → Centralized Governance
- 4: Popular Sovereignty → Institutional Authority
- 5: Liberty → Security
- 6: Electoral Process → Performance Outcomes
- 7: Progressive Change → Continuity and Tradition
- 8: Pluralism → Cohesion
- 9: Constructivism → Essentialism
- 10: Internationalism → Sovereignty
- 11: Non-Interventionism → Interventionism
- 12: Precautionary → Innovation-First

### 4.1 Popular Egalitarian — NEW (from C1 centroid)

```
vector: [-0.70, +0.40, -0.50, -0.35, -0.55, -0.45, -0.40, -0.20, -0.50, +0.25, -0.70, -0.35]
```

Rationale: directly seeds the prototype from the C1 cluster centroid (rounded). No prior prototype to compare against.

### 4.2 Institutional Moderate — RENAMED + REFINED (from C0 centroid)

```
Old (Pragmatic Centrist):
  [+0.10, +0.10, +0.10, +0.15, +0.05, -0.10, +0.10, +0.10, +0.05, -0.10, -0.10, +0.10]

New (Institutional Moderate):
  [-0.30, +0.50, +0.40, +0.55, -0.25, -0.35, -0.50, +0.25, -0.20, -0.15, -0.25, -0.10]
```

Rationale: Pragmatic Centrist was a null-vector placeholder. C0 shows the empirical center isn't ideologically null — it's institutionally-trusting, mildly progressive, growth-oriented, cautiously internationalist. The new vector is derived directly from the C0 centroid (rounded to 0.05). Note: this substantially changes the archetype's character, which is why it's being renamed rather than just refreshed.

### 4.3 Radical Egalitarian — REFINED (toward C4 centroid)

```
Old:
  [-0.90, -0.50, -0.50, -0.40, -0.30, -0.50, -0.80, -0.50, -0.80, -0.50, -0.50, -0.30]

New:
  [-0.85, -0.45, -0.45, -0.20, -0.55, -0.55, -0.70, -0.60, -0.75, -0.45, -0.60, -0.40]
```

Key shifts: axis 4 (-0.40 → -0.20) softens the popular-sovereignty claim — C4 is near-neutral on that axis, suggesting this tradition actually defers more to institutional process than the prototype implied. Axis 5 (-0.30 → -0.55) and axis 8 (-0.50 → -0.60) strengthen liberty and pluralism signals. Axis 11 (-0.50 → -0.60) strengthens non-intervention.

### 4.4 Communitarian Steward — REFINED (toward C3 centroid)

```
Old:
  [-0.40, -0.80, -0.70, -0.50, -0.20, -0.30, +0.50, +0.40, +0.30, +0.30, -0.60, -0.50]

New:
  [-0.55, -0.65, -0.75, -0.60, -0.40, -0.25, +0.60, +0.15, +0.30, +0.40, -0.70, -0.60]
```

Key shifts: axis 1 (-0.40 → -0.55) more collectivist. Axis 5 (-0.20 → -0.40) more liberty-oriented. Axis 8 (+0.40 → +0.15) significantly less cohesion-oriented — C3 empirically leans mildly *pluralist*, reflecting that real communitarian-steward personas (often traditional-culture minorities) experience "cultural cohesion" as *their community's* integrity rather than as universal social uniformity. Note: the description should acknowledge this.

### 4.5 Nationalist Populist — REFINED significantly (toward C2 centroid)

```
Old:
  [+0.00, +0.30, +0.30, -0.70, +0.40, +0.30, +0.50, +0.80, +0.50, +0.80, +0.20, +0.00]

New:
  [-0.20, +0.40, -0.20, -0.55, +0.00, +0.00, +0.60, +0.70, +0.60, +0.70, -0.10, -0.25]
```

**This is the most significant vector revision.** The original prototype described a state-authoritarian populism (Orbán/Modi type); the empirical C2 cluster is substantially more anti-institutional across the board — skeptical of centralized state power, of security/liberty tradeoffs, of performance legitimacy, *and* of markets. It's closer to Brexit / Five Star / Yellow Vests than to Hungary's Fidesz.

Key flips: axis 3 (+0.30 → -0.20), axis 5 (+0.40 → 0.00), axis 6 (+0.30 → 0.00), axis 11 (+0.20 → -0.10). All four flipped signs.

The description and characteristic tension both need significant updates — see `archetype_content_v2.md`.

### 4.6 Developmental Modernizer — REFINED (toward C5 centroid)

```
Old:
  [+0.30, +0.70, +0.70, +0.70, +0.40, +0.60, +0.00, +0.30, +0.20, +0.20, +0.30, +0.70]

New:
  [+0.00, +0.70, +0.75, +0.65, +0.60, +0.60, +0.15, +0.60, +0.20, +0.55, +0.20, +0.40]
```

Key shifts: axis 1 (+0.30 → 0.00) — real developmental states are pragmatic about market vs collective, not ideologically market-oriented. Axis 5 (+0.40 → +0.60) and axis 8 (+0.30 → +0.60) strengthen security and cohesion signals — developmentalism in practice is more security-and-unity-forward than the prototype captured. Axis 10 (+0.20 → +0.55) strengthens sovereignty signal. Axis 12 (+0.70 → +0.40) softens innovation-first — developmental states use technology instrumentally rather than ideologically embracing it.

### 4.7 Archetypes with no vector change

These six archetypes keep their existing prototype vectors and descriptions; only the `emergence: 'theoretical'` tag is added:

- Social Democrat
- Free Marketeer
- Green Communalist
- Cosmopolitan Technologist
- Libertarian Individualist
- Authoritarian Traditionalist

The absence of matching empirical clusters is not treated as disconfirmation. LLM-generated biographical personas tend to under-represent ideologically sharp profiles in favor of narratively conflicted ones, and several of these archetypes (Free Marketeer, Libertarian Individualist) are well-attested in real political life. They are retained as theoretical archetypes with appropriate tagging.

---

## 5. Content updates

Full descriptions, card copy, and characteristic tensions for all affected archetypes are in `archetype_content_v2.md`. Unchanged archetypes keep their existing `description` and `tension` copy. For unchanged archetypes that do not yet have a `cardDescription` field, one should be added — suggested approach: condense the existing `description` to 2–3 sentences. This is a lightweight pass; the detail descriptions are authoritative.

---

## 6. UI / display changes

### 6.1 Emergence tag badge

Add a small badge component near each archetype's name on:
- Archetype detail page (prominent, near the header)
- Archetype list page cards (smaller, corner or under name)

Suggested styling (adapt to the existing cartographic/editorial aesthetic):
- Muted background colors, not saturated:
  - `empirical`: warm stone / primary palette (Stone 600 at low opacity) — strongest visual weight since it's the most "earned"
  - `refined`: a paler tone of the same palette, or a secondary warm tone
  - `theoretical`: neutral gray or very faint outline only
- Font: match other UI labels (system sans, small caps or regular)
- Hover / tap: tooltip with the full explanation (see `EMERGENCE_TOOLTIPS` in §2.1)

The visual hierarchy (empirical > refined > theoretical in weight) signals the grounding of the archetype without feeling like a tier/quality ranking. Avoid making `theoretical` look lesser — it's a valid provenance, just a different one.

### 6.2 List page ordering

Not mandatory, but suggested ordering for the archetypes list (groups related types visually):

1. The Radical Egalitarian (refined)
2. The Popular Egalitarian (empirical) ← **NEW, adjacent to Radical Egalitarian**
3. The Social Democrat (theoretical)
4. The Green Communalist (theoretical)
5. The Communitarian Steward (refined)
6. The Institutional Moderate (refined) ← replaces Pragmatic Centrist & Civic Institutionalist
7. The Cosmopolitan Technologist (theoretical)
8. The Free Marketeer (theoretical)
9. The Libertarian Individualist (theoretical)
10. The Developmental Modernizer (refined)
11. The Nationalist Populist (refined)
12. The Authoritarian Traditionalist (theoretical)

If the current list uses a different ordering principle (alphabetical, domain-grouped, etc.), keep that; just ensure all 12 appear and Civic Institutionalist is removed.

### 6.3 Archetype detail page — optional small addition

Beneath the tension section, consider adding a small line identifying the emergence status in prose form. Example for the Popular Egalitarian: *"This archetype was identified empirically through a synthetic population study in April 2026."* For theoretical archetypes: *"This archetype is theoretically derived — no distinct empirical cluster matched it in the April 2026 synthetic population study, but it represents a coherent tradition in comparative political philosophy."*

Optional — the badge + tooltip may be sufficient. The prose line is for people who want more context.

---

## 7. Methodology page updates

The methodology page's archetypes section should be updated to reflect the revised set. Suggested changes:

1. **Count stays at 12.** Update any language implying a specific composition.
2. **Add a short subsection on archetype provenance.** Roughly: *"Archetypes in the Governance Compass fall into three categories, indicated by a small tag on each archetype: theoretically derived (hand-crafted from comparative political philosophy), refined (hand-crafted, then adjusted using empirical data), and empirical (identified through a synthetic population study and named after the fact). The April 2026 synthetic population study — in which roughly 1,000 biographical personas, generated by a separate language model, took the full Governance Compass instrument — surfaced one archetype (the Popular Egalitarian) that was not in the original hand-crafted set, and informed refinements to five others."*
3. **Carry the "explain, don't justify" principle:** describe what was done without defending the archetype set against alternatives.
4. **Be careful with validation claims.** The synthetic population study is informative but not a substitute for empirical validation with real humans. Do not claim "empirically validated" or similar. "Informed by synthetic data" is the honest framing.
5. **Note the limitation of synthetic personas.** A one-sentence acknowledgment that LLM-generated personas may under-represent ideologically sharp profiles is consistent with the AI-disclosure norm elsewhere in the methodology.

---

## 8. Scoring engine — no changes needed

The scoring engine consumes the `ARCHETYPE_PROTOTYPES` array and matches quiz-takers to the nearest prototype by Euclidean distance. No engine changes are required beyond updating the array itself. Users will automatically get matched to the new set.

Confirm: `docs/scoring-config.json` (or wherever the prototype data lives) is the single source of truth. If prototypes are duplicated in multiple places (TypeScript types, JSON config, tests), update all consistently.

---

## 9. Out of scope

The following are **not** part of this spec and should not be touched:

- The 12-axis definitions themselves (no axis renaming, reordering, or additions)
- The question bank (forced-choice, scaled, or budget items)
- The scoring algorithm (composite weights, contradiction detection, tension thresholds)
- The Chancellor's Budget ministry structure or tier logic
- The glossary
- The radar chart rendering or results page layout
- The Crisis Events feature (still deferred post-v1)

Two items flagged in the interpretation pass that are out of scope for this spec but may warrant separate follow-up specs:

- **Ministry-mapping audit for axes 4, 6, 12.** The synthetic study showed high tension rates (>55%) on these axes, suggesting the Chancellor's Budget ministry-to-axis mapping may be a weak proxy for the questionnaire signal. This is a separate investigation into the scoring config, not the archetype set.
- **Model-disagreement patterns.** Claude and Gemini agreed strongly on axes 1, 2, 4, 8 (r > 0.80) and more weakly on axis 10 (r = 0.62). Worth documenting in methodology or follow-up, not acted on in this spec.

---

## 10. Verification checklist

After implementation:

1. `ARCHETYPE_PROTOTYPES` contains exactly 12 entries.
2. No entry has `id: 'civic-institutionalist'`.
3. No entry has `id: 'pragmatic-centrist'` (replaced by `institutional-moderate`).
4. Entry with `id: 'popular-egalitarian'` exists and has `emergence: 'empirical'`.
5. Every archetype has a non-empty `emergence` field with a valid enum value.
6. Every archetype has a non-empty `cardDescription` field.
7. Every archetype has exactly 12 axis values in its vector, all in the range [-1.0, +1.0].
8. The archetype list page renders 12 cards with emergence badges visible.
9. The archetype detail page renders the badge and tooltip/hover text correctly for each emergence type.
10. Navigating to `/archetypes/pragmatic-centrist` redirects to `/archetypes/institutional-moderate`.
11. Navigating to `/archetypes/civic-institutionalist` returns a 404 or redirects to `/archetypes/institutional-moderate` (your call).
12. Taking a quiz still produces an archetype match; every possible quiz result now matches one of the 12 new archetypes.
13. No test fixtures, seed data, or example JSON still reference the removed or renamed IDs.
14. Methodology page renders with the updated archetypes section (if implementing §7).
