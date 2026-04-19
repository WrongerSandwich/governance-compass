# Archetype Content v2 — Descriptions, Tensions, Card Copy

**Companion to**: `archetype_revision_spec.md`

Contains the final copy for all archetypes affected by the v2 revision. Each section specifies:
- `id` (slug)
- `name` (display name)
- `emergence` (enum value)
- `description` (detail view — 5–7 sentences)
- `cardDescription` (list view — 2–3 sentences)
- `tension` (characteristic tension, 1–2 sentences)
- `vector` (for reference; authoritative source is the spec)

Archetypes not appearing in this file keep their existing `description`, `cardDescription` (adding one if needed by condensing the existing description), and `tension` unchanged. Their only v2 update is adding `emergence: 'theoretical'`.

---

## 1. The Popular Egalitarian — NEW

```
id:         popular-egalitarian
name:       The Popular Egalitarian
emergence:  empirical
vector:     [-0.70, +0.40, -0.50, -0.35, -0.55, -0.45, -0.40, -0.20, -0.50, +0.25, -0.70, -0.35]
```

**Description** (detail view):

> Believes material equality is the foundation of freedom, and that ordinary people — not experts, elites, or international institutions — should determine how their society is organized. Strongly favors collective provision and redistribution, but grounded in a developmentalist rather than post-growth frame: prosperity is the goal, and the state's job is to spread it broadly rather than hoard it at the top. Skeptical of concentrated power in all its forms — domestic oligarchies, foreign capital, and international bodies that set terms without accountability. Moderately pluralist and cautiously progressive, but not driven by cultural transformation; dignity and self-determination matter more than identity politics. Non-interventionist abroad. Sees sovereignty and equality as complementary: a people cannot be equal among themselves if they are not free as a nation.

**Card description** (list view):

> Material equality grounded in popular self-determination rather than expert coordination. Favors redistribution and collective provision within a growth-oriented, nationally autonomous frame. Distrusts elites, experts, and international institutions in equal measure.

**Characteristic tension**:

> Universalist egalitarian commitments — every person deserves dignity, every society deserves self-determination — sit alongside a sovereigntist resistance to the international coordination that would be needed to make those commitments real at scale. Solidarity is demanded at home and declined abroad.

---

## 2. The Institutional Moderate — RENAMED + REFINED (was Pragmatic Centrist)

```
id:         institutional-moderate   (was: pragmatic-centrist)
name:       The Institutional Moderate   (was: The Pragmatic Centrist)
emergence:  refined
vector:     [-0.30, +0.50, +0.40, +0.55, -0.25, -0.35, -0.50, +0.25, -0.20, -0.15, -0.25, -0.10]
```

**Description** (detail view):

> Trusts institutions, expertise, and process as the foundations of good governance. Favors measured progress over radical transformation — progressive in general orientation, but skeptical of disruptive change from any direction. Prefers growth-oriented policy and targeted public investment to either market purism or sweeping redistribution. Internationalist in sympathy but pragmatic about national constraints. Comfortable with moderate centralization when it improves coordination and accountability. Less a defined ideology than a governing instinct: that competent, accountable administration is what democracy is actually for.

**Card description** (list view):

> Trusts institutions, expertise, and process. Favors measured progress and growth-oriented policy over radical reform in any direction. Internationalist in sympathy, pragmatic about national constraints.

**Characteristic tension**:

> Commitment to competent administration can shade into technocratic paternalism — valuing outcomes legitimately produced by institutions over outcomes directly endorsed by voters. Tends to mistake proceduralism for democratic responsiveness.

---

## 3. The Radical Egalitarian — REFINED

```
id:         radical-egalitarian
name:       The Radical Egalitarian
emergence:  refined
vector:     [-0.85, -0.45, -0.45, -0.20, -0.55, -0.55, -0.70, -0.60, -0.75, -0.45, -0.60, -0.40]
```

**Description** (detail view):

> Deeply committed to economic equality, progressive social transformation, and cosmopolitan pluralism. Favors strong collective provision, distributed governance, and expansive civil liberties. Internationalist in orientation and non-interventionist in practice. Sees most social hierarchies as constructed and unjust, and believes policy can and should dismantle them. Ecologically minded and precautionary toward technology that concentrates power or disrupts human relationships. More at home in cosmopolitan cities and diaspora networks than in nationally bounded political communities.

**Card description** (list view):

> Deeply committed to equality, progressive transformation, and cosmopolitan pluralism. Favors collective provision, distributed governance, and expansive civil liberties. Internationalist, non-interventionist, ecologically minded.

**Characteristic tension** (unchanged):

> Transformative egalitarian goals often require concentrated state power to implement, conflicting with commitments to distributed governance and individual liberty.

---

## 4. The Nationalist Populist — REFINED significantly

```
id:         nationalist-populist
name:       The Nationalist Populist
emergence:  refined
vector:     [-0.20, +0.40, -0.20, -0.55, +0.00, +0.00, +0.60, +0.70, +0.60, +0.70, -0.10, -0.25]
```

**Description** (detail view):

> Strongly sovereignty-oriented and culturally cohesive. Deeply skeptical of both international institutions and domestic elites — trusts the common sense of ordinary people over credentialed expertise. Favors cultural continuity and traditional values over rapid progressive change. Ambivalent about both state power and markets: distrusts government and business establishments alike, and does not treat either as a natural ally. Non-interventionist abroad — "our people first" rather than expansionist. Cautious about technology that disrupts familiar ways of life.

**Card description** (list view):

> Sovereignty-oriented and culturally cohesive. Deeply skeptical of elites, experts, and international bodies — trusts ordinary people's common sense over credentialed authority. Ambivalent about both state power and markets; rejects concentrated power in most of its forms.

**Characteristic tension** (updated):

> Distrust of concentrated power cuts across all directions — state, market, expert, international — leaving few institutions intact to act through. A politics of suspicion is easier to sustain than a politics of construction.

> **Note on the change from v1**: The previous prototype (Orbán-style state-authoritarian populism) significantly diverged from where populist personas actually cluster in the synthetic data. The empirical C2 centroid points at a more anti-institutional, anti-elite populism (closer to Brexit, Five Star, Yellow Vests) than to Fidesz. Axes 3, 5, 6, and 11 all flipped sign in the refinement. The Authoritarian Traditionalist archetype continues to hold the state-authoritarian-traditionalist position.

---

## 5. The Communitarian Steward — REFINED

```
id:         communitarian-steward
name:       The Communitarian Steward
emergence:  refined
vector:     [-0.55, -0.65, -0.75, -0.60, -0.40, -0.25, +0.60, +0.15, +0.30, +0.40, -0.70, -0.60]
```

**Description** (detail view):

> Envisions small-scale, rooted, sustainable communities shaped by tradition and local self-determination. Favors ecological limits, distributed governance, and the preservation of inherited ways of life. Skeptical of centralized state power and of technology that erodes communal relationships. Populist in register — trusts community wisdom and elders over expert authority. Non-interventionist abroad and cautiously sovereigntist. The commitment is to communal integrity rather than to uniform national culture: the archetype protects each community's right to remain itself, which often means defending pluralism at the national or international scale while valuing cohesion within the community.

**Card description** (list view):

> Envisions small-scale, rooted communities shaped by tradition and local self-determination. Favors ecological limits, distributed governance, and cultural continuity. Non-interventionist and cautious about technology that disrupts community life.

**Characteristic tension** (slightly refined):

> Commitment to local autonomy means accepting that different communities will develop in directions the archetype itself disagrees with. Defense of one's own tradition and openness to others' traditions depend on the same principle but can be hard to hold together in practice.

> **Note on the change from v1**: The empirical cluster is notably *less* cohesion-oriented on axis 8 than the prototype implied. The updated description reframes cohesion as "within-community integrity" rather than national or universal uniformity — which matches the archetype's theoretical commitments better and aligns with the exemplar personas in the cluster (often traditional-culture minorities within larger states).

---

## 6. The Developmental Modernizer — REFINED

```
id:         developmental-modernizer
name:       The Developmental Modernizer
emergence:  refined
vector:     [+0.00, +0.70, +0.75, +0.65, +0.60, +0.60, +0.15, +0.60, +0.20, +0.55, +0.20, +0.40]
```

**Description** (detail view):

> Favors strong centralized state capacity directed toward rapid modernization and national ascent. Pro-growth, performance-legitimacy oriented, and security-forward. Comfortable with liberty-for-security tradeoffs in service of development and with cultural cohesion in service of social stability. Sovereignty-oriented — sees international institutions as constraints on national trajectories rather than as sources of legitimacy. Uses technology instrumentally rather than ideologically, adopting what works and regulating what threatens social order. Trusts institutional expertise and long-horizon state planning over popular input.

**Card description** (list view):

> Favors strong centralized state capacity directed toward rapid modernization and national ascent. Pro-growth, security-forward, performance-legitimacy oriented. Uses technology instrumentally and trusts institutional expertise over popular input.

**Characteristic tension** (unchanged):

> Performance-based legitimacy works while performance is strong — this archetype has no stable fallback when the developmental model hits limits or fails to deliver.

---

## 7. Other archetypes — tagging only

The following archetypes receive `emergence: 'theoretical'` and no content changes. For archetypes that don't yet have a `cardDescription` field, add one by condensing the existing `description` to 2–3 sentences (examples below are optional starting drafts, not authoritative).

### The Social Democrat

- `emergence: 'theoretical'`
- Keep existing `description`, `tension`, `vector`.
- Suggested card description (if one is needed):
  > Strongly favors collective provision, public services, and redistribution within a democratic framework. Progressive on cultural issues, moderately pluralist, constructivist. Internationalist but not radically so; trusts institutions to implement an egalitarian agenda.

### The Free Marketeer

- `emergence: 'theoretical'`
- Keep existing `description`, `tension`, `vector`.
- Suggested card description:
  > Strongly favors market allocation, economic growth, and individual economic liberty. Skeptical of state intervention and strongly pro-innovation. Treats distributed governance as a check on state power.

### The Green Communalist

- `emergence: 'theoretical'`
- Keep existing `description`, `tension`, `vector`.
- Suggested card description:
  > Ecological sustainability as the organizing principle of politics. Favors degrowth or post-growth economics, radical decentralization, and local self-sufficiency. Skeptical of both state and market; internationalist in sympathy, localist in practice.

### The Cosmopolitan Technologist

- `emergence: 'theoretical'`
- Keep existing `description`, `tension`, `vector`.
- Suggested card description:
  > Believes global coordination and technological progress can address most governance problems. Strongly internationalist, pro-innovation, progressive, and pluralist. Trusts expert institutions and favors coordination-oriented centralization.

### The Libertarian Individualist

- `emergence: 'theoretical'`
- Keep existing `description`, `tension`, `vector`.
- Suggested card description:
  > Individual liberty as the paramount value. Deeply skeptical of state power in all its forms — economic, security, and cultural. Favors markets, distributed governance, and minimal state. Non-interventionist abroad.

### The Authoritarian Traditionalist

- `emergence: 'theoretical'`
- Keep existing `description`, `tension`, `vector`.
- Suggested card description:
  > Favors strong centralized authority, cultural cohesion, traditional values, and robust security. Performance-oriented; distrustful of democratic process as chaotic. Sovereignty-focused and moderately interventionist.

---

## 8. Editorial notes

A few notes on the content pass, in case you want to iterate:

- **"Popular Egalitarian" naming.** Chosen over "Global South Egalitarian," "Liberational Democrat," and "Grassroots Redistributivist" because it avoids regional labeling, avoids overly-specific political-theory branding, and pairs cleanly with "Radical Egalitarian" as a sibling archetype. If it reads too similarly to "Nationalist Populist" in practice, an alternative is "The Sovereign Egalitarian" — emphasizing the distinctive axis 10 signal.

- **"Institutional Moderate" naming.** Chosen to replace "Pragmatic Centrist" because the empirical centroid isn't ideologically null — it's institutionally-committed. Alternatives considered: "The Technocratic Progressive," "The Liberal Institutionalist," "The Reform Centrist." "Institutional Moderate" is the most neutral and country-agnostic; it describes the governing posture rather than naming a political tradition. Worth a second look if it feels flat.

- **Radical vs Popular Egalitarian contrast.** The two are intentionally paired. The Radical version is cosmopolitan, internationalist, pluralist, ecologically minded, and constructivist. The Popular version is nationally rooted, growth-oriented, moderately pluralist, and suspicious of international institutions. Both favor redistribution and collective provision and share strong non-interventionism. Users reading both should be able to see themselves in one or the other, or recognize which axes push them toward each.

- **Nationalist Populist rewrite.** This is the biggest substantive change in the content. The v1 prototype described a state-authoritarian populism that the empirical data does not support as the modal populist pattern. If you prefer to keep the older framing, the Authoritarian Traditionalist archetype is the better home for it, and Nationalist Populist can take the anti-institutional, anti-establishment form fully. Flagging this in case you'd like to push back.

- **"Populist in register" vs "anti-elite populism".** I've used "populist" in a few descriptions (Communitarian Steward, Nationalist Populist). The word is overloaded in contemporary discourse; the archetype descriptions use it in the specific sense of "trusts ordinary people's judgment over credentialed expertise" rather than the pejorative sense. If a later pass wants to remove the term and substitute something more neutral ("grassroots-oriented," "anti-elite," "distrustful of credentialed authority"), that's a small change.

- **"Developmentalist rather than post-growth frame".** This phrase in the Popular Egalitarian detail description may read as jargon to non-political-theory readers. An alternative: "believes prosperity should be grown and shared, not reduced and redistributed." Consider whether to swap.
