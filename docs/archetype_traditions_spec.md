# Archetype Traditions Section — Implementation Spec

**Context**: Each of the 12 archetypes gets a new "Traditions" section on its detail page, sitting beneath the characteristic tension. The section is 80–120 words of prose with 2–3 external Wikipedia links woven in. Final copy for all 12 archetypes is in `archetype_traditions_copy.md`.

**Scope**: Schema update, per-archetype content addition, external link component and styling, page layout insertion. No navigation, scoring, or quiz flow changes.

---

## 1. Schema changes

Add a new required field to each archetype object:

```typescript
interface Archetype {
  // existing fields...
  id: string;
  name: string;
  description: string;
  cardDescription: string;
  tension: string;
  vector: AxisVector;
  emergence: Emergence;

  // NEW
  traditions: string;  // Markdown prose with inline external links
}
```

The `traditions` field contains Markdown prose with inline links using standard syntax: `[link text](https://en.wikipedia.org/wiki/Article_Name)`. The Markdown needs to render to HTML at build or render time, which matches how the existing `description` and `tension` fields are presumably handled — follow whatever pattern those fields already use.

If `description` and `tension` are currently plain-text-only with no Markdown support, Markdown rendering needs to be enabled for the `traditions` field specifically. The simplest approach is to introduce a lightweight Markdown-to-HTML step for this one field using a standard library (e.g., `marked`, `react-markdown`) rather than expanding it across all text fields.

---

## 2. Content

Populate the `traditions` field for all 12 archetypes using the final copy in `archetype_traditions_copy.md`. Copy is ready to paste — no editing required.

Validation: every archetype must have a non-empty `traditions` string after the update. The verification checklist at the end of this spec covers this.

---

## 3. External link handling

External links (those pointing outside the `governance-compass.org` domain) should be visually distinguished from inline glossary terms, which use warm gold (`#8B6914`) + dotted underline.

### 3.1 Component

Create or reuse an `<ExternalLink>` component that:
- Renders an `<a>` tag with `target="_blank"` and `rel="noopener noreferrer"` for security and usability
- Applies a distinct visual treatment from glossary terms (see 3.2)
- Optionally includes a small external-link indicator icon

If the project already has an external-link component, reuse it. If not, this is the time to introduce one — it'll be useful beyond just this feature.

### 3.2 Styling

Pick one of these approaches and apply it consistently:

**Option A (recommended): Subtle icon + same warm palette, different treatment.**
- Link color: a muted version of the primary Stone palette (e.g., Stone 700 or a slightly desaturated accent)
- Underline: solid on hover, none by default, OR a very faint solid underline always
- Small external-link icon (↗ or the Lucide `external-link` icon at ~0.8em) positioned after the link text with a non-breaking space
- Clearly different from the glossary's warm-gold + always-dotted-underline pattern

**Option B: Different hue entirely.**
- A cooler neutral (e.g., a muted slate or a deeper ink tone) rather than the warm gold of the glossary
- Same underline-on-hover pattern, no icon needed

Option A is my recommendation because it preserves the cartographic/editorial aesthetic coherence (stay in the warm palette) while being unmistakably different from the glossary (icon + different underline behavior signals "leaves the page"). Option B is a valid alternative if the icon feels too busy.

Whatever is chosen, it must be:
- Visually distinct from the glossary term treatment (so users don't expect a tooltip)
- Consistent across all external links on the page (not just traditions — any external link the site has, present or future)
- Accessible: sufficient color contrast, keyboard-navigable, screen-reader-friendly (the `target="_blank"` + `rel` attributes matter here)

### 3.3 Internal vs. external detection

Simple heuristic: if the href starts with `https://` or `http://` and the hostname doesn't match `governance-compass.org`, treat as external. Otherwise, internal. No more sophisticated logic needed.

---

## 4. Page layout

### 4.1 Placement

The Traditions section sits **beneath the characteristic tension** on the archetype detail page. Order on the page:

1. Archetype name and emergence badge (existing)
2. Description (existing)
3. Characteristic tension (existing)
4. **Traditions section (new)**
5. Anything else currently below tension (e.g., navigation to other archetypes)

### 4.2 Section structure

```html
<section class="archetype-traditions">
  <h2>Traditions</h2>
  <p class="traditions-intro">
    Governance traditions and movements that express this orientation,
    globally and historically:
  </p>
  <div class="traditions-body">
    <!-- rendered Markdown from the traditions field -->
  </div>
</section>
```

- **Section header**: Use `<h2>Traditions</h2>` — matches the heading hierarchy of the existing description and tension sections (assuming those use h2; adjust to h3 if they use h3).
- **Intro sentence**: Use the exact wording above (*Governance traditions and movements that express this orientation, globally and historically:*). This appears on every archetype page, same wording, so it's a reliable signal to the reader that these are illustrations of the orientation rather than defining examples.
- **Body**: Rendered Markdown from the `traditions` field. No further structure beyond a single paragraph.

### 4.3 Spacing

Match the vertical rhythm used elsewhere on the page — same section-to-section spacing as between description and tension. Don't visually isolate the new section; it should feel like part of the same flow.

---

## 5. Methodology page — small update

Add a short sentence to the archetypes provenance subsection (being added per `archetype_revision_spec.md` §7) acknowledging the Traditions feature:

> *Each archetype's detail page includes a short section describing governance traditions and movements that express the orientation, with links to further reading. These are illustrations, not defining examples — individual movements rarely align perfectly with any single archetype, and many traditions sit across two or more.*

Placement: after the provenance description, before (or as part of) the "what the synthetic study can and cannot tell us" paragraph.

---

## 6. Out of scope

- **Methodology / about / homepage changes** beyond the single sentence in §5.
- **Card-level changes** (archetypes list page) — the Traditions field only appears on detail pages, not on list cards.
- **Cross-archetype linking** — no need to link "African socialism" in the Popular Egalitarian page to "Popular Egalitarian" anywhere else. These are external links to Wikipedia, not internal cross-references.
- **Translations** — English copy only. If the site plans to support other languages later, the `traditions` field structure supports it (same shape, different content per locale), but that's a separate project.
- **Rich media** — no images, embedded maps, or other media in the Traditions section. Prose + links only.

---

## 7. Verification checklist

After implementation:

1. `ARCHETYPE_PROTOTYPES` (or wherever archetypes live) has a non-empty `traditions` field for all 12 archetypes.
2. Each archetype's Traditions section renders on the detail page beneath the tension.
3. The intro sentence appears on all 12 archetype pages, identical wording.
4. External links render with the new external-link treatment, not the glossary treatment.
5. External links open in a new tab (`target="_blank"`) with appropriate `rel` attributes.
6. Wikipedia URLs with parentheses (Podemos, People's Party, Confucian political philosophy, Social ecology) render correctly — parenthesis escaping in the Markdown source is handled.
7. No external link uses the warm-gold glossary styling.
8. Glossary tooltips still work correctly on question and content pages — no regression from the external-link styling work.
9. Methodology page has the single new sentence describing the Traditions feature.
10. Mobile rendering: links remain legible and tappable, text wraps cleanly, the section doesn't break the vertical rhythm.
11. Screen-reader test: external links are announced with appropriate context (e.g., "link, opens in new tab" or similar).
12. Color contrast of the external-link styling meets WCAG AA.

---

## 8. Content provenance note for future edits

The final copy in `archetype_traditions_copy.md` was produced through a research pass that specifically prioritized:

- Movement/tradition-level references over individual leaders (individuals named only as anchors for their traditions)
- Honest treatment of Nationalist Populist and Authoritarian Traditionalist in their adherents' own terms
- Global balance where the archetype admits it (Popular Egalitarian, Communitarian Steward, Developmental Modernizer, Authoritarian Traditionalist are genuinely global; Social Democrat, Free Marketeer, Radical Egalitarian are honestly Western-concentrated because that's where those traditions consolidated)
- Wikipedia-linkable anchors for every claim

If future edits add, remove, or substantially revise traditions, the same principles should apply. The full research document with alternate options per archetype is in `archetype_parallels_research.md`.