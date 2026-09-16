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
- Topographic contour lines on the compass are the one thing here that does **not** step. `--contour-opacity` declares both modes — 0.08 light, 0.05 dark — and has no consumer; the plot paints the contours at a fixed opacity instead. See *The Compass Plot*.
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

One family is loaded; the other two are system stacks.

```
--font-serif:  var(--font-source-serif), Georgia, 'Times New Roman', serif
--font-sans:   system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
--font-mono:   ui-monospace, 'SF Mono', 'Fira Code', Menlo, Consolas, monospace
```

The serif is **Source Serif 4**, self-hosted through `next/font/local` rather than pulled from `next/font/google`, so the build never reaches the network — a font fetch at build time is a build that can fail for a reason unrelated to the change being built. It ships as a latin subset, variable across the 400–500 range the design system uses and no wider, with `display: swap`. A true italic face ships alongside the upright one — two files, not one — because the italic is doing editorial work rather than decorating: `caption-italic` and the archetype reference's serif italic lead-ins would otherwise render as a synthesized oblique.

`next/font/local` exposes the family as `--font-source-serif`, and `--font-serif` names it first with Georgia behind it. That fallback is load-bearing during `swap`, not a dead branch.

Sans and mono are system stacks and load nothing. The handoff's claim that the whole design runs on system fonts held until the serif landed; it no longer does, for the serif alone.

The `body` element is sans at 14px/1.5. That is the inherited default a role overrides — not itself a role, and not a size to reach for.

### Type Scale

The scale is a set of `@utility` roles, not a list of sizes to apply by hand. It is authored as `@utility` rather than as `--text-*` theme entries because the mono roles need `text-transform` and `font-family`, which the `--text-*` namespace cannot express; Tailwind variants still compile against `@utility` rules, so the two responsive pairs (`min-[560px]:display-xl`, `min-[560px]:wordmark`) work anyway.

Each role is **self-contained** — family, size, line-height, and whatever tracking, weight and case the role needs — and is named for its job rather than its size. Two roles may therefore share a size without being variants of one another: `display-s` and `body-lead` are both 17px in different families, and `body-s` and `caption-italic` are both 13.5px in different families and different styles. Roles that declare no weight inherit the document's 400.

Naming by job is also what makes the scale greppable. `body-s` replaced a `text-[13.5px] leading-[1.6]` pair that travelled by convention across the prose surfaces, where a guard could catch the two halves drifting apart but never catch one of them being deleted outright.

**Hard floor: 11px.** No role in the scale renders below it at any viewport; the smallest roles in the table below — the mono label family, `mono-meta` and `wordmark-sm` — all sit exactly on it. Pre-delta *call sites* below the floor survive in unswept components. Those are debt, not exceptions.

`text-wrap: pretty` is set on the three long-headline roles (`display-xl`, `display-page`, `display-l`) and on none of the others. That is deliberate — the rest of the scale sets short strings, where the property has nothing to balance — so do not "fix" it into consistency.

| Role | Size / line-height / tracking | Family | Use |
| --- | --- | --- | --- |
| `display-xl` | 58px / 1.04 / −0.021em | serif 500 | The home headline at 560px and above, capped at an 11em measure. |
| `display-page` | 40px / 1.06 / −0.02em | serif 500 | Interior page titles: the shared page header's title, and the h1 the results and comparison pages set for themselves. |
| `display-l` | 34px / 1.06 / −0.018em | serif 500 | The home headline below 560px; large numerals, including the archetype match percentage and the comparison alignment score. |
| `display-m` | 26px / 1.2 | serif 500 | Section headings on the results and compare pages, the page title on the account, group and auth pages, and the persona modal's title. **Not** the quiz prompt. |
| `display-entry` | 22px / 1.2 | serif 500 | The repeated section headings on the methodology and study pages, entry titles in long reference lists, and the quiz's interstitial titles. |
| `display-s` | 17px / 1.35 | serif 500 | Card titles, the quiz's question stem and its forced-choice option headlines, the archetype name. |
| `body-lead` | 17px / 1.62 | sans | Lead paragraph. |
| `body-s` | 13.5px / 1.6 | sans | The workhorse prose size. Declares no colour — it is layered with a `text-*` class everywhere it appears. |
| `body-xs` | 12px / 1.5 | sans | The meta column's subordinate prose: the axis row's tagline, one step under the axis name that `body-s` sets beside it. Declares no colour. |
| `label` | 11px / 1.4 / 0.12em, uppercase | mono | The default label: panel labels, the forced-choice instruction line and its selected marker, disclosure summaries. |
| `label-eyebrow` | 11px / 1.4 / 0.14em, uppercase | mono | Section eyebrows, including the shared page header's kicker. |
| `label-nav` | 11px / 1.4 / 0.1em, uppercase | mono | Nav links, in-page section navs and back links, and the `tertiary` button. |
| `label-tight` | 11px / 1.4 / 0.02em, uppercase | mono | Where a label sits under a data mark and the airy tracking would overflow its column: axis endpoints, the A/B legend. |
| `mono-meta` | 11px / 1.4 / 0.06em, **sentence case** | mono | Scores, counts, coordinates, the footer's provenance row. The one mono role that is not uppercase. |
| `control` | 12px / 1 / 0.12em, uppercase, 500 | mono | Button labels — the `primary` and `secondary` variants both take it. |
| `wordmark` | 12px / 1 / 0.16em, uppercase, 500 | mono | The brand wordmark. |
| `wordmark-sm` | 11px / 1 / 0.13em, uppercase, 500 | mono | The wordmark below 560px. |
| `caption-italic` | 13.5px / 1.5, italic | serif | Editorial framing notes. **Sets its own colour** (`--text-label`) — that colour is part of the role, not a default to override. |

**What the mono layer is for.** The pre-delta rule confined monospace to numeric data, and that is false of what shipped: `control` sets button labels, the `label*` family sets eyebrows, panel labels, nav links and axis endpoints, and `wordmark` sets the brand — none of them numeric. Mono is the **label layer**. It is what the eye reads as structure rather than as content, and the uppercase-plus-tracking treatment is the signal.

Numbers are split by role rather than by family, which is the part the old rule got backwards in both directions. The inline figure is mono — a score in a comparison row, a member count, a coordinate, all `mono-meta`. The headline numeral is serif: the archetype match percentage, the alignment score and the study's key figures all set `display-l`, the same role as the home headline. Serif sets an axis NAME where the name is a title; mono sets that axis's endpoint labels. Neither family owns numerals, and neither owns axes.

The counterpart is that the layer **frames prose and never enters it**. Archetype descriptions, tension paragraphs and traditions paragraphs stay sans, and the archetype reference's serif italic lead-ins (`Internal tension.`, `Traditions.`) survive on purpose. Replacing those with mono labels turns a reference page into a spec sheet, which is the opposite of the register the section is written in.

**Why roles get named siblings instead of overrides.** Layering a built-in utility over a role to vary one of its properties looks like it should work and is not reliable. Compiled against this repo's Tailwind, emitted order is decided by **property bucket first, then by class name within the bucket** — never by authoring order, and never by which rule is custom. The multi-property `label` lands *before* `tracking-*` and is silently overridden by it, while a single-property custom utility lands *after* `tracking-*` and wins. Two custom rules, opposite outcomes, decided by something no one should have to reason about at a call site.

So a variant of a role is a new role: `label-eyebrow`, `label-nav`, `label-tight` and `mono-meta` beside `label`, and `wordmark-sm` beside `wordmark`. The one safe kind of layering is a property the role does not declare at all — `label font-medium` is fine, because `label` sets no `font-weight` and the two rules never collide.

### Typography Rules

- **Serif is the display and editorial face.** Headlines, page and section titles, card and entry titles, axis names where the name is a title, the large numerals, and italic framing notes. Never UI labels, never button text.
- **Mono is the label layer, not a numeric layer.** Every label, eyebrow, axis endpoint, status and button label is mono, and so is the inline figure — running counts, scores and coordinates take `mono-meta`. The large numerals are the serif's.
- **Mono frames prose and never enters it.** Descriptions, tension and traditions paragraphs stay sans; the archetype reference's serif italic lead-ins stay serif italic.
- **Sentence case everywhere except the mono label layer.** `mono-meta` is the one mono role that is sentence case too.
- **Two weights only: 400 and 500.** Never 600 or 700. Emphasis comes from the serif face or from the scale, not from weight.
- **Never layer a built-in utility over an `@utility` role to override a property that role declares. Add a named sibling instead.**
- **Never hand-spell a size a role already names.** A fresh `text-[13.5px]` is a role that was not reached for.
- **Nothing below the 11px floor.** A layout that needs a smaller size needs less text.

---

## Layout and Spacing

### Page Structure

The results page is a single vertical column on `--container-results`. Delta 04 dissolved the nested surfaces the pre-delta diagram encoded — there is no hero region holding a compass and a card side by side, and no section sits inside another section. Every section is a panel on the page ground, and the compass moved from the top of the page to the bottom.

Above the sections sit a page header — eyebrow, serif title (the archetype name, or "A distinctive profile" where no archetype matches well), one framing sentence — and a five-item jump nav ruled top and bottom. Then, in order:

1. **Archetype.** The archetype card, its mini radar, and the copy-link and compare actions.
2. **Radar.** The twelve-axis radar in a panel of its own.
3. **Tensions.** Rendered unconditionally. With nothing detected the section says so: the absence of tension is itself a result, and an inert item in a rendered jump nav is worse than an empty state.
4. **Axis breakdown.** Four domain groups, twelve rows, and the section-level **Show scoring details** toggle. The scoring breakdown is no longer a section at the foot of the page; it is a control on this one, revealing a per-row disclosure.
5. **Compass plot.** Last, and framed as a simplified two-dimensional projection of the radar above rather than as the headline result.

### Page Measures

Five widths, declared as `--container-*` custom properties inside `@theme inline` so each compiles to a `max-w-*` utility and a page's own measure is never an incidental Tailwind size.

| Token | Width | Scope |
| --- | --- | --- |
| `--container-shell` | 1040px | The chrome shell — `NavBar`, `Footer`, and the home page. |
| `--container-results` | 820px | The results column, and the compare and group pages that reuse its shape. Narrower than the chrome around it. |
| `--container-reference` | 660px | The long-prose measure, and the one with the most consumers: the reference family, methodology, account, and the study section's prose. At the 15px intro size it runs about 84 characters to the line in the shipped sans stack, give or take a few as `system-ui` resolves differently per platform. `/archetypes` runs its zebra band full-bleed and re-applies this width inside each row, so the measure survives a full-bleed background. |
| `--container-quiz` | 672px | The quiz column. Value-identical to the `max-w-2xl` it replaced — a naming change, not a retune. |
| `--container-browse` | 1200px | `/study/personas`, and the only measure wider than the chrome shell. Earned rather than inherited: it is a two-column data browser with a filter sidebar, and at 1040px it loses a column of the persona grid at every breakpoint above 960px. |

The five cover a page's main column and nothing else, so the token layer is not a claim that no Tailwind size or inline `maxWidth` survives anywhere. Component caps are a separate question and still spell themselves: a chart's own maximum width, the quiz interstitial card, the auth forms, the results error and loading states. The study's wide visualization bands break out of the reference measure with inline `maxWidth` literals of their own. What the five settle is that a **page column** is one of them.

One page column is still unswept, recorded here rather than omitted: the per-axis detail page under `/results` caps itself at `max-w-2xl` — 672px, value-identical to `--container-quiz` — instead of naming a measure.

### Grid

Outside `/study`, a multi-column layout is a fixed column set — gated at a breakpoint where it has to collapse, never a track list that decides its own column count — and its columns are there to align data rather than to consume the available width. `/study` diverges on both counts, deliberately — see *Rules Carry Structure*.

The **axis breakdown row** is `[24px | minmax(0, 1fr) | 210px]` at 560px and above: axis number, paired scale, then a meta column carrying confidence, any tension flag, and the tagline. Below 560px the third column drops and the meta cell re-enters the grid beneath the scale rather than squeezing a 210px column onto a 320px screen. `minmax(0, 1fr)` rather than `1fr` is load-bearing — each row is its own grid, so a `1fr` column is floored at that row's own min-content and the widest endpoint pair pushes the row past the panel.

The pre-delta row was `[82px | fluid | 82px]`, a pole label on each side of the bar. The axis row asks `PairedAxisScale` for its endpoints below the track, so those two columns are gone rather than resized, and bars align because the scale is one component rather than because the labels are boxed. Endpoints are the caller's choice, not the component's: the default puts them above, and the study's persona modal asks for none at all.

The **home sample row** is the same idea at `[24px | 1fr | 158px]` above 560px, with the axis name ordered last so the row reads index, scale, name. The **home payoff block** is `[1fr | 356px]` above 900px and one column below it. On the results page the archetype card's `[minmax(0, 1fr) | 220px]` split for its mini radar is the only two-column region left.

### Spacing Tokens

Despite the heading, spacing is not a token family: the stylesheet declares no spacing custom properties, and the only custom lengths in the layout layer are the five page measures above. Spacing is Tailwind's scale, with arbitrary values where the mock's rhythm falls between steps.

The results column is the reference rhythm for a new section:

```
Between sections:     40px          (the first sits 32px under the jump nav)
Panel padding:        24–28px       (archetype 26, radar 28, compass 24)
Callout padding:      22px × 20px   (the tension panels)
Between domains:      26px          (2px rule above the label, 10px under it,
                                     6px before the first row)
Axis row:             12px top and bottom, 16px column gap
Page gutter:          18px below 560px, 28px above
```

Those are values rather than tokens. Reach for the nearest one; a new step in between is a rhythm nobody else is keeping.

### Border Radius

One value. `--radius: 2px` in `:root`, exposed to Tailwind as `rounded-sharp` through `--radius-sharp` in `@theme inline`. Panels, cards, inputs, badges and the `primary` and `secondary` buttons all take it — delta 02 collapsed the former 12px and 8px literals onto the token, and the guard now covers every spelling a scan can see: the class, the quoted and the unquoted `borderRadius` style prop, and `border-radius` inside a template-literal style block.

Two exemptions, named in the guard rather than pattern-matched, because a circle is not a rounded rectangle and a pill is not either: `50%` and `999px`. Dots, the compass mark and avatars are unaffected.

Use `rounded-sharp` in classes and `var(--radius)` in inline styles. The compass plot's inner frame is neither an exemption nor a client of the token: the 6px corner the pre-delta spec prescribed for it is gone rather than retuned, and the rect ships square.

**Known unswept spellings**, recorded rather than omitted. Bare `rounded` compiles to Tailwind's default 4px and sits off-system next to swept 2px neighbours; it is issue #139, which pairs the sweep with a lockdown of the radius namespace so that an off-system corner becomes unwritable rather than merely discouraged. SVG `rx` attributes are the other spelling — two in `TensionMatrix`, one each in `HorizontalBarChart`, `ComparisonRadar` and `RadarChart`, all small numeric literals — and they are issue #154. At a 2px token, "leave them and say so here" is a legitimate resolution for the `rx` sites; what is not legitimate is a spec that implies they were swept. The backlog records that an `rx="var(--radius)"` attribute does not resolve and needs `style={{ rx: … }}`; measured today in current Chromium and Firefox the attribute form does resolve and paints the corner, so if those sites ever move onto the token, either spelling will do.

### Rules Carry Structure

Sections separate by full-bleed rules and alternating surfaces, not by gaps between rounded floating panels. `/archetypes` is the clearest case: the entries band runs edge to edge, alternates Surface 1 and Surface 2 per row, and re-applies the reference measure inside each row.

Delta 04 caps a page at **two surface switches.** The quiz spends both on its Surface 3 ground and its Surface 1 cards and has none left, which is why its detail panel is a `border-t` rule rather than a third fill. The cap is a design rule, not a machine-checked one — nothing counts surfaces at build time — so it holds only as long as it is read.

Three weights, used consistently:

| Weight | Token | Job |
| --- | --- | --- |
| 1px strong | `--rule-strong` | Under a panel's own eyebrow header; on the quiz's sticky budget header and footer edges; as the selected border on a forced-choice or scale option. Hard ink — 13.05:1 on a white panel. |
| 2px domain / warning | `--domain-*`, `--warning` | Above a domain block in the axis breakdown, and on a tension callout's left edge. |
| 1px / hairline | `--border-secondary`, `--rule-hairline` | Panel borders and section boundaries take `--border-secondary`; row separators inside a list, and the compass plot's grid, take `--rule-hairline` at 1.10:1. |

Both rule tokens invert with the surface rather than holding a value, which is why neither can be spelled from a ramp literal at the call site — see *Color System* for the measurement.

**`/study` has not adopted this delta** (issue #154). It is the one part of the six-part delta the synthetic study section has not taken, because it asks for bespoke layout work and spec decision D6 defers bespoke layout on screens the handoff never drew. If `/study`'s panels still float, that was a decision.

Its grids are the product's only fluid ones for the same reason. Several `/study` sections lay out on `repeat(auto-fit, …)` or `repeat(auto-fill, minmax(…, 1fr))`, which fill the available width by construction rather than aligning a fixed column set — and the choice of `auto-fit` over `auto-fill` is argued in place, so this is a different idiom rather than drift from the one above.

### Layout Rules

- **A page column takes one of the five `--container-*` measures.** A fresh `max-w-3xl` or an inline `maxWidth` on a page's main column is a measure that was not reached for. Component caps are a different question.
- **One radius.** `rounded-sharp` in classes, `var(--radius)` in inline styles. `50%` and `999px` are the only exemptions, and a new value is not one.
- **Sections separate by rules, not by gaps between floating cards.** Two surface switches per page, maximum.
- **Rules are tokens, never ramp literals.** `--rule-strong` and `--rule-hairline` invert with the surface; `border-stone-900` and `border-stone-50` do not.
- **A 2px domain rule is data.** It marks a domain block or a callout's edge; it never rules a section for decoration.

---

## Component Specifications

### PairedAxisScale

One row renders one axis for one or two respondents. It is the shared primitive behind the home page's sample pair, the results axis breakdown and the per-axis detail page, `/compare` (through `ComparisonScoreBar`), the group view, and `/study`'s persona modal.

**How the convergence actually landed**, because it is not the clean merge delta 05 predicted. `ScoreBar` is retired — deleted outright, and guarded in both directions: one assertion fails if the file returns, a second scans source for any import still reaching for it. Its two distinguishing features, a centre-out fill and a score readout floating above the marker, are both things the delta removes, so restyling it would have left two primitives drawing one thing.

`ComparisonScoreBar` **survives**, as row chrome *around* the primitive rather than as a second implementation of it. It owns the axis name, the gap badge, and the two named readouts with their swatches, and hands the scale itself down. Saying the two components converged into one sends a reader looking for a component that is still there and still rendering rows.

One consequence is recorded because it reversed a shipped behaviour: the dot roles are the primitive's, not `ComparisonScoreBar`'s former ones. **Respondent A is the filled domain dot and respondent B the outlined one** — the reverse of what shipped before. The home page's sample pair carries the A/B legend that names them in the new order. `/compare` names them per row instead, with a swatch inside each readout, because its two-profile route passes real names and has no legend for a dot to appear in.

**It renders only the scale** — endpoints, track, midline, dots. Callers own the surrounding row, because the consumers wrap it in different grids: a three-column breakdown row, a two-column home row, a comparison row with a gap badge above it, a group row with an aria-hidden member-scatter strip above it, positioned by the same `scoreToTrackPercent` so the two align, and a modal column too narrow for pole labels at all.

```
Row height       14px
Track            2px, the domain's 400 tone at 50% opacity
Midline          1px, --border-secondary, full row height, centred
Respondent A     10px filled disc, the axis's domain mark
Respondent B     12px ring, 1.5px --text-label edge on a --surface-1 fill
```

The track is the one place the scale spells a hex instead of a token, and the reason is that there is nothing to step: the mark moves from its 600 tone to its 400 on a dark ground and arrives where the track already sits, so a custom property here would hold one value in both modes. The dot beside it does have to step, and takes `getDomainMarkVar`. The one override is `markVar`, for the study's model-agreement view, where a Claude row and a Gemini row sit under one axis name and colour is the only thing separating them; it takes the same wrapped `var(--x)` shape the helper returns, because a bare name wrapped twice gives `var(var(--x))` — valid syntax that resolves to nothing and paints an invisible mark.

**The mapping is `−1…1` → `6%…94%`, computed as `50 + score * 44` by `scoreToTrackPercent`.** The 6% inset is not taste: across the full `0…100%` a dot at either pole sits half off the end of the track it is meant to be on.

**Accessibility.** The root is `role="img"`, which makes the entire subtree presentational — the visible endpoint text never reaches the accessibility tree, and both dots are `aria-hidden`. Everything the scale communicates therefore has to survive in the `aria-label`, and `describePosition` and `describeGap` are what build it:

```
describePosition   |score| < 0.15            near the midpoint
                   < 0.45 / < 0.75 / else    slightly / moderately / strongly toward <pole>
describeGap        gap <= 0.3                close agreement
                   <= 0.7 / <= 1.2 / else    some distance / significant gap / far apart
```

Two respondents join with a semicolon rather than an em dash: most synthesizers speak nothing for U+2014 and do not reliably pause on it, so the relationship phrase ran straight onto the end of respondent B's position, and at higher punctuation verbosity it is spoken as "dash" once per axis, twelve times down the page.

Because `role="img"` already suppressed the endpoints, an `endpoints="none"` caller loses a **visual affordance only** — the announced string is byte-identical with the row present or absent. Note the corollary, which is easy to get backwards: the description does not replace the labels. `describePosition` names at most one pole, and none at all within 0.15 of the midpoint.

### The Compass Plot

A square SVG in the **last** section on the results page. Phase 4 moved it from the top of the page to the bottom and frames it as a simplified projection of the radar above; there is no hero region for it to sit in, and no section on the page sits inside another.

At a 400-unit viewBox with 50 units of margin, the plot square is 300 units, capped at 400 CSS px by its wrapper:

```
Frame            300 units square, --surface-1 fill, 1px --border-secondary stroke
Grid             six columns and six rows, --rule-hairline at 1px
Crosshairs       1px --border-secondary on the two centre lines
Respondent dot   r=6, --text-primary
Leader line      0.6px --text-label
Readout          11px mono, --text-label
```

The frame ships **square**. The 6px corner the pre-delta spec prescribed is gone rather than retuned, and it is not an exemption from the radius token — the rect carries no `rx` attribute at all.

The grid is a six-step division of the square, not a single dashed ring marking a "moderate" zone. It draws on `--rule-hairline` and explicitly **not** on `stroke-stone-50`: the ramp is frozen across modes, so a Stone 50 hairline reads as near-white wire on a dark ground.

The dot is `--text-primary`, not a Stone 900 literal, for the same reason — ink on an ink ground is invisible, and the text token is already the pair that inverts.

**Pole labels sit inside the square**, at 11px mono on `--text-label`, inset one dot radius plus two units from the frame so that a dot parked hard against an edge cannot cover one. Collective is left, Market right, Traditional top, Progressive bottom. The vertical pair follows the engine's cultural weights, where +1 is traditional; swapping those two labels would invert the meaning of every plotted point without touching a line of scoring code.

**Coordinate readout.** A leader line runs from the dot — flipping to the inboard side when the dot sits right of centre — and ends just short of the two super-dimension scores, set in mono. Moving the pole labels inside the square opened a collision the outside-the-square labels could not have: the readout renders on the dot's own baseline, so a dot sitting on the horizontal axis drives it straight through "Collective" or "Market". It is nudged clear of the axis, and always away from centre, so the nudge can never carry it onto the label it is avoiding.

**Archetype positions** are plotted as reference marks, derived from the twelve-axis prototypes through the same super-dimension weights the respondent's own position uses. Each is a small `--text-secondary` dot labelled with the last word of the archetype's name; the primary match draws larger and at higher opacity and always keeps its label, while the rest suppress theirs when they would land within 18 units of a label already placed. Those labels are SVG `fontSize` attributes rather than scale roles — 7.5 units for the primary and 6.5 for the others, which is 7.5 and 6.5 CSS px at the plot's 400px cap.

**Contour lines** survive as the product's one decorative element, protected in `CLAUDE.md` as the cartographic signature: gentle quadratic curves at 0.6px stroke width. They do **not** currently read the token. `--contour-opacity` is declared in both modes (0.08 light, 0.05 dark) and has no consumer; the paths ship at a literal opacity of 0.15 over `var(--stone-500)`, and because the ramp is frozen they do not step with the mode. Recorded as debt rather than described as though the token were wired.

Two pre-delta prescriptions are gone and were not replaced: the concentric pulse rings around the respondent's dot, and the quadrant whisper labels.

### The Archetype Card

The first panel on the results page, at 26px padding on the page ground — not a card inside a two-column hero.

```
Primary archetype        label-eyebrow, --text-label, over a --rule-strong bottom border
87%                      display-l (34px serif)
The Institutional …      display-s, the archetype name as an h2
Summary paragraph        body-s, --text-secondary
[ Copy link ] [ Compare with someone ] [ Learn more ]
─────────────────────    --rule-hairline top border
Adjacent · The Social Democrat — 72% match     mono-meta, --text-label
```

**The match percentage is the visual anchor** — the first thing the eye should hit. That intent survived the delta; the number did not. It is `display-l`, which is **34px**, not the 36px the pre-delta spec named, and it is a scale role rather than a hand-spelled size. The serif face at that scale is what makes it read as a data point rather than as a quiz result.

The eyebrow sits over a `--rule-strong` bottom border and the adjacent-archetype row under a `--rule-hairline` top border, so the card opens and closes on the two ends of the rule hierarchy. The adjacent row is `mono-meta`, one line, naming the second archetype and its match.

Above 560px a **mini radar occupies a 220px right column**, the only two-column region left on the results page. Below that the grid collapses to one column and the radar stacks under the copy. It draws two rings, the respondent's twelve-axis polygon in `--mark-primary`, and — this is the attribution the pre-delta spec put on the wrong chart — **the archetype prototype, as a dashed `var(--stone-500)` line**. The two-item legend beneath it names exactly those two shapes. Both the SVG and the legend are `aria-hidden`: the accessible reading of these twelve scores is the radar section's table, and a second, wordless copy of the same data adds nothing.

Three conditional states share the card and are stated here so they are not mistaken for variants of one another:

- **Blended** — a `mono-meta` note that the profile draws nearly equally from two archetypes.
- **Low match** — the same role in `--warning-text`, the advisory accent doing exactly its job.
- **Distinctive** — a different card entirely. The eyebrow reads "Distinctive profile", there is no percentage and no mini radar, and the closing row becomes a two-line "Nearest archetypes" list. "Describe, don't prescribe": a profile that matches nothing is reported as a finding, not as a failure to classify.

### The Tension Callout

**There is no `TensionCard` component.** Tensions render inline in the results view as a callout, and the pre-delta card prescription — 12px radius, an icon disc, a stated-versus-budget values row — describes none of what ships.

The section heads with the eyebrow **Detected tensions** over the title **Principles against priorities**, and it renders **unconditionally**. With nothing detected it says so in one sentence on a plain panel. The absence of tension is itself a result, and an inert item in a rendered jump nav is worse than an empty state.

Each detected tension is one panel:

```
Panel      --surface-1, 1px --border-secondary, rounded-sharp
Left edge  2px --warning
Padding    22px horizontal, 20px vertical
Title      label + font-medium, --warning-text: "Moderate tension · Decision Authority"
Narrative  body-s, --text-secondary
```

The left edge is the entire visual signal. There is no icon disc, no amber fill behind the panel, and no numeric row — the numbers live in the axis breakdown below, where the scale that produced them is drawn.

The title's grade is sentence-cased **in JavaScript**, not by a `capitalize` class, for two independent reasons: `text-transform` does not touch `textContent`, so a CSS-only capital is invisible to a screen reader and to anything the respondent copies out of the page; and the title already carries the `label` role, which sets `text-transform` itself, so a second one layered on it would leave the rendered case decided by Tailwind's emitted order. `label font-medium` is the safe kind of layering — `label` declares no weight.

The narrative names which side the questionnaire leaned and which side the budget suggested. Both directions are spelled out explicitly rather than derived by negation, because a swapped pair renders the exact opposite of what the respondent answered and renders it plausibly.

### The Radar Chart

Twelve axes in a panel of its own, at 28px padding, under an eyebrow/title/caption head. The SVG caps itself at its own maximum width rather than at a page measure.

```
SIZE             580 (viewBox units)
MAX_RADIUS       170
Outer ring       12-sided polygon, --border-secondary, 0.8px
Neutral ring     at half radius, dashed 3 3, --border-primary, 0.8px
Spokes           twelve, from the centre, --border-secondary, 0.6px
Polygon          --mark-primary, fillOpacity 0.1, 1.6px stroke, round joins
Vertex dots      r=4, r=5.5 hovered, filled from getDomainMarkVar
Labels           at r + 22, 11px mono, --text-label
```

The ring set collapsed to two. The neutral ring is the mark the caption describes; the intermediate rings carried no meaning and are gone. Twelve spokes from the centre rather than six diameters, because a spoke has to be present even where the mapping puts its own vertex at the origin.

**The vertex dots are per-axis domain colour, not a single Stone 600.** That is the chart's one added variable, and it is the reason the label ring closed up from `r + 38` to `r + 22`: the old padding was sized for two-line domain-coloured *labels*, and once domain moved onto the dots the labels went to one line of 11px mono.

**A hover tooltip** the pre-delta spec does not mention: a `--surface-1` box on a hairline stroke, carrying the axis's magnitude and the pole it leans toward in 11px mono, pushed outward along the spoke and clamped inside the viewBox so a vertex near the perimeter cannot render its tooltip off the edge. The dots take the hover through a larger transparent hit circle; the visible radius eases over 150ms, which is the selection interval.

**The archetype prototype overlay was dropped.** The pre-delta spec prescribed it here in dashed info-blue; this chart draws no second polygon, and `--info` is vestigial across the whole product. A prototype overlay *is* still drawn — in the archetype card's mini radar, as a dashed `var(--stone-500)` line. Do not go looking for it on this chart.

**Accessibility.** The SVG is `aria-hidden`, so an `sr-only` table is the entire accessible chart. It carries one row per axis: the axis name with both poles, the domain name, the score, and the confidence. Domain is a column rather than an omission precisely because this chart made domain the job of twelve dots, which a screen reader cannot see — without it, the one variable the chart gained is the one variable AT loses. It is derived from the axis id, exactly as the dot beside it is, rather than read off a caller-supplied string the two could disagree about.

**Below the chart** is a four-item legend keyed to the domains — a dot in each domain's mark colour beside the domain's name, in `mono-meta`. It is not the two-item respondent-versus-prototype legend the pre-delta spec described, which went with the overlay. It is `aria-hidden` like the SVG it annotates: exposed, it reads as four loose domain names with no referent, describing a chart AT cannot perceive, and the table above already carries the same information in rows.

### The Axis Breakdown

Four domain groups, twelve rows, under a heading that shares its baseline with the section-level **Show scoring details** toggle.

A domain group opens on a 2px rule in that domain's mark colour, with the domain name in `label font-medium` at the same colour and an axis count in `mono-meta` at the far end. That 2px rule is data — it marks a domain block, and it is not available for ruling a section decoratively.

Each row is its own grid, `[24px | minmax(0, 1fr) | 210px]` at 560px and above:

```
24px           index, mono-meta, zero-padded
minmax(0,1fr)  axis name in body-s with the score in mono-meta tabular-nums
               on the same baseline, and PairedAxisScale below them
210px          confidence, any tension flag, then the tagline in body-xs
```

Below 560px the third column drops and the meta cell re-enters the grid beneath the scale rather than squeezing a 210px column onto a 320px screen. The row's boundary is a `border-b` on `--border-secondary` — a rule, not an alternating fill and not a rounded floating card.

Items the pre-delta spec prescribed and that the delta settled differently:

- **The scale is `PairedAxisScale`.** It is not a bar with a centre-out fill, a ring marker, and a floating score readout. See that subsection; do not respecify a bar here.
- **Endpoints go below the track**, which is why the old `[82px | fluid | 82px]` pole-label columns are gone rather than resized. Bars align because the scale is one component, not because the labels are boxed.
- **Tension is a line, not a pill.** `mono-meta` in `--warning-text` reading "Tension detected", in the meta column. The row says only that a tension exists; the callouts above spell it out, and duplicating the narrative in a 210px column would mean setting it twice.
- **Rows are ruled, not striped.** No alternating surface, no 8px corner.
- **`items-start`, not centred.** Every real tagline wraps in a 210px column, and centring detaches the axis index from the name it labels by more than a line's worth of offset. A deliberate divergence from a static prototype.

### The Scoring Breakdown (Expandable)

Not a section at the foot of the page. It is a **section-level `tertiary` toggle** on the axis breakdown heading, which reveals a per-row disclosure inside every one of the twelve rows.

Each per-row control is a **disclosure toggle, not a disclosure summary**: a `<button type="button">` carrying `aria-expanded`, in `label-nav` with a `focus-ring`. It is not a `<summary>`, and it does not take the `label` role the document's real summaries take.

Its **accessible name is the visible label plus an `sr-only` axis name** — "See how this was scored" (or "Hide scoring breakdown"), then " for Decision Authority". This is WCAG 2.5.3, Label in Name: the accessible name has to *contain* the visible label, and the retired `aria-label` shared no words at all with the visible text, so it replaced the name outright and voice control stopped matching the control. The axis name is still worth carrying, because twelve identically-labelled disclosures are indistinguishable in a control list, so it extends the name instead of replacing it. Expanded/collapsed state is deliberately absent from the name: `aria-expanded` already carries it. The caret is `aria-hidden` — it is decoration sitting inside an accessible name, and AT announces U+25B8 by its Unicode name.

The expanded panel sits over a `--rule-hairline` top border:

```
Forced choice     Calibrated scale     Budget          three columns, mono-meta,
-0.33             -0.50                -0.22           values tabular-nums

(0.50 × -0.33) + (0.35 × -0.50) + (0.15 × -0.22) = -0.37
```

The formula is the row's own weights against the row's own components, read from that axis's own weight profile rather than from a default — the fallback that stood there invented a weight profile matching none of the real ones. The grid always shows all three columns, with the budget cell reading `N/A` on an axis that carries no budget signal, while the formula drops the budget term outright rather than multiplying by a zero weight. There are no detail cards, no 2×2 grid, and no second "context" line under each modality.

### Share and Compare Actions

There is no separate share row, and nothing on the results page sits at the bottom of a hero region. The two actions live **inside the archetype panel**, on the same line as the card's own "Learn more" control.

Both take **`Button variant="secondary"`** — a `--border-primary` hairline outline, `--text-secondary`, the `control` label role, and the one shared radius. They are not hand-rolled chips with an 8px corner and a bespoke hover, and they are not filled: the `primary` ink fill is reserved for the page's own call to action, which the results page does not have.

- **Copy link** writes the current URL to the clipboard and swaps its own label to "Copied!" for two seconds. The label is the entire feedback; there is no toast.
- **Compare with someone** expands in place into a text field plus a `secondary` Compare and a `tertiary` Cancel. It accepts either a pasted results URL or the bare encoded string, extracting the `r` parameter from the former.

The pre-delta trio is gone: there is no "Copy image" and no "Download raw data" on the results page. The study section's public dataset download is a different surface with a different purpose.

### Component Rules

- **One axis is one `PairedAxisScale`.** A new surface that draws an axis reaches for the primitive and supplies its own row; it does not draw a track.
- **Respondent A is the filled dot, respondent B the ring.** Any legend, swatch or readout naming them follows that order.
- **A `role="img"` root makes everything under it presentational.** Every value a chart or scale communicates has to be reachable from the `aria-label` or from an adjacent `sr-only` table — never from the visible text inside it.
- **Domain colour goes on marks, never on chrome.** Dots, the axis track, the domain rule. Not borders, not panels, not headings outside a domain block.
- **A disclosure is a `<button aria-expanded>` whose accessible name contains its visible label.** An `aria-label` that replaces the visible text breaks voice control.
- **Corrections belong in the section, not in a note beside it.** Where the delta dropped something the pre-delta spec prescribed — the prototype overlay, the pulse rings, the tension icon, the share trio — this section says it was dropped. A prescription for an absent element reads as authoritative.

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
