# The Governance Compass — Domain Color Extension

## Overview

This is an addendum to the main design spec. It extends the single-accent Stone palette with three additional muted tones, one per domain. The four colors are used exclusively on the results page to visually group the 12 axes into their four domains. They do not replace Stone as the primary brand color — they supplement it.

## The Four Domain Colors

All four tones sit at roughly the same saturation (~40-50%) and lightness (~50-55%). They read as a family of pigments mixed from the same mineral base — warm brown, cool blue-gray, dusty green, and terracotta.

### Stone — Economic Organization (Axes 1-2)

The existing primary accent. Unchanged from the base design spec.

```
Stone 900:  #3d2e1f
Stone 800:  #5a4636
Stone 700:  #6e5a48
Stone 600:  #85735e  ← primary
Stone 500:  #9d8b78
Stone 400:  #b5a594
Stone 300:  #cdbfb2
Stone 200:  #e0d6cc
Stone 100:  #efe9e3
Stone 50:   #f7f4f0
```

### Slate — Power and Authority (Axes 3-6)

A cool blue-gray. Reads as institutional, structural, slightly austere — appropriate for axes about governance architecture and the distribution of power.

```
Slate 900:  #2e3840
Slate 800:  #435059
Slate 700:  #576773
Slate 600:  #6b7d8a  ← primary
Slate 500:  #8597a3
Slate 400:  #9daebb
Slate 300:  #b8c5ce
Slate 200:  #d2dbe1
Slate 100:  #e8edf1
Slate 50:   #f3f5f7
```

### Sage — Society and Identity (Axes 7-9)

A dusty muted green. Reads as organic, grounded, living — appropriate for axes about culture, human nature, and social change.

```
Sage 900:   #2f3a28
Sage 800:   #46553c
Sage 700:   #5f7053
Sage 600:   #7a8b6e  ← primary
Sage 500:   #94a488
Sage 400:   #acbba2
Sage 300:   #c4cfbc
Sage 200:   #dae1d5
Sage 100:   #ecf0e9
Sage 50:    #f5f7f3
```

### Clay — The State in the World (Axes 10-12)

A warm terracotta/rose-brown. Reads as earthy, weathered, expansive — appropriate for axes about foreign policy, military posture, and technology governance.

```
Clay 900:   #452924
Clay 800:   #653d37
Clay 700:   #7e574f
Clay 600:   #96716b  ← primary
Clay 500:   #ad8d86
Clay 400:   #c1a7a1
Clay 300:   #d4c0bc
Clay 200:   #e5d7d4
Clay 100:   #f1eae8
Clay 50:    #f8f4f3
```

## Where Domain Colors Appear

Domain colors are used in exactly four places on the results page. Everywhere else — the compass plot, the archetype card, the hero region, the share buttons, navigation, quiz phases — continues to use Stone only.

### 1. Radar Chart

**Stroke segments:** The polygon outline connecting the 12 vertices is drawn as four separate path segments, one per domain, each in its domain color at ~55% opacity and 1.5-2px stroke width.

**Triangle fills:** Each wedge of the radar polygon (the triangle from center to two adjacent vertices) is filled with its domain color at ~6-8% opacity, alternating between 6% and 8% for adjacent wedges to create subtle visual separation.

**Vertex dots:** Each of the 12 vertex dots on the polygon uses the domain color of its axis. 3-3.5px radius, full domain color fill.

**Spoke labels:** The axis labels around the perimeter of the radar chart are colored with their respective domain color instead of the generic text-tertiary.

The archetype prototype overlay (dashed line) remains a single color (info-blue from the framework) and does not use domain colors. This keeps it visually distinct from the respondent's profile.

### 2. Domain Section Headers in the Axis Breakdown

The uppercase section labels that separate the four groups of axes:

```
ECONOMIC ORGANIZATION        ← Stone 600
POWER AND AUTHORITY          ← Slate 600
SOCIETY AND IDENTITY         ← Sage 600
THE STATE IN THE WORLD       ← Clay 600
```

These replace the previous single-color Stone 600 treatment. Each header still has a 0.5px bottom border in border-tertiary.

### 3. Axis Bar Fills and Dot Borders

In each axis row of the breakdown, the horizontal bar fill and the dot marker border use the domain color instead of Stone:

- Axes 1-2: Stone 600 fill at 0.45 opacity, Stone 600 dot border
- Axes 3-6: Slate 600 fill at 0.45 opacity, Slate 600 dot border
- Axes 7-9: Sage 600 fill at 0.45 opacity, Sage 600 dot border
- Axes 10-12: Clay 600 fill at 0.45 opacity, Clay 600 dot border

The dot marker's interior fill remains Surface 1 (white/primary background) in all cases — the domain color is the ring only.

### 4. Compass Plot Quadrant Tinting (Optional)

The 2D compass plot can receive barely-visible quadrant washes at 4% opacity:

```
Top-left quadrant:     Slate 600 at 4% opacity
Top-right quadrant:    Stone 600 at 4% opacity
Bottom-left quadrant:  Sage 600 at 4% opacity
Bottom-right quadrant: Clay 600 at 4% opacity
```

This is subtle enough to be subliminal — the user shouldn't consciously notice the tinting, but it creates a visual connection between the compass quadrants and the domain colors in the full profile below.

Note: The compass-to-domain mapping is imperfect (the compass is Economic × Cultural, not a clean 4-domain projection), so this is a visual rhyme rather than a precise data mapping. If it feels misleading, omit it — the results work without it.

## Where Domain Colors Do NOT Appear

- The logo mark (always Stone)
- The compass plot dot and coordinate label (always Stone)
- The archetype card and match percentage (always text-primary and Stone)
- The tension card (always warning-amber)
- Share buttons and navigation (always standard button styling)
- Phase 1, 2, and 3 quiz UI (always Stone for accents)
- The progress bar (always Stone)
- The "Begin Assessment" and "Finalize Budget" buttons (always Stone 600 background)

## Dark Mode Behavior

All four domain colors at the 600 stop have sufficient contrast against dark backgrounds for use as stroke and fill colors at the specified opacities. For the domain section header text, switch to the 400 stop:

| Domain | Light Mode Header | Dark Mode Header |
|---|---|---|
| Economic | Stone 600 (#85735e) | Stone 400 (#b5a594) |
| Power | Slate 600 (#6b7d8a) | Slate 400 (#9daebb) |
| Society | Sage 600 (#7a8b6e) | Sage 400 (#94a488) |  
| World | Clay 600 (#96716b) | Clay 400 (#c1a7a1) |

Radar chart strokes and bar fills don't need adjustment — the opacity values handle the adaptation naturally.

## Implementation: Domain-to-Axis Mapping

```typescript
const DOMAIN_COLORS = {
  economic: {
    name: 'Economic Organization',
    axes: [1, 2],
    color: {
      600: '#85735e',
      400: '#b5a594',
    },
  },
  power: {
    name: 'Power and Authority',
    axes: [3, 4, 5, 6],
    color: {
      600: '#6b7d8a',
      400: '#9daebb',
    },
  },
  society: {
    name: 'Society and Identity',
    axes: [7, 8, 9],
    color: {
      600: '#7a8b6e',
      400: '#94a488',
    },
  },
  world: {
    name: 'The State in the World',
    axes: [10, 11, 12],
    color: {
      600: '#96716b',
      400: '#c1a7a1',
    },
  },
} as const;

function getDomainForAxis(axisId: number): keyof typeof DOMAIN_COLORS {
  for (const [domain, config] of Object.entries(DOMAIN_COLORS)) {
    if (config.axes.includes(axisId)) {
      return domain as keyof typeof DOMAIN_COLORS;
    }
  }
  return 'economic'; // fallback
}

function getDomainColor(axisId: number, isDarkMode: boolean): string {
  const domain = getDomainForAxis(axisId);
  return DOMAIN_COLORS[domain].color[isDarkMode ? 400 : 600];
}
```

## Implementation: Radar Chart Domain Segments

The radar chart polygon is normally drawn as a single `<polygon>` element. With domain colors, it needs to be drawn as four separate `<path>` segments, one per domain arc. Each segment connects the vertices belonging to that domain, plus a bridge to the first vertex of the next domain.

With axes arranged clockwise from 12 o'clock:

```
12:00  Axis 1  (Economic - Stone)
 1:00  Axis 2  (Economic - Stone)
 2:00  Axis 3  (Power - Slate)      ← segment boundary
 3:00  Axis 4  (Power - Slate)
 4:00  Axis 5  (Power - Slate)
 5:00  Axis 6  (Power - Slate)
 6:00  Axis 7  (Society - Sage)     ← segment boundary
 7:00  Axis 8  (Society - Sage)
 8:00  Axis 9  (Society - Sage)
 9:00  Axis 10 (World - Clay)       ← segment boundary
10:00  Axis 11 (World - Clay)
11:00  Axis 12 (World - Clay)
                                     ← closes back to Axis 1
```

Each segment is a `<path>` with `fill="none"` that traces from the last vertex of the previous domain through the vertices of its own domain to the first vertex of the next domain. The four segments overlap at the boundary vertices by one vertex to ensure continuous line coverage with no gaps.

The triangle fills are separate `<polygon>` elements, one per pair of adjacent vertices, each forming a triangle with the center point (0,0 in the radar's coordinate system):

```
Triangle: center → vertex[n] → vertex[n+1]
Fill: domain color of axis n, opacity alternating 0.06/0.08
```

## Relationship to Main Design Spec

This extension does not modify any behavior or color specified in the main design spec. It adds four new color ramps (Slate, Sage, Clay — Stone already exists) and specifies their use in four specific locations on the results page. All other specs (scoring engine, question bank, UI spec, quiz phase theming) are unaffected.

If the domain colors create implementation complexity or visual clutter during development, the entire extension can be deferred — the results page works with Stone-only as originally specified. The domain colors are a refinement, not a structural requirement.
