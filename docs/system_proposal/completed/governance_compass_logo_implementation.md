# The Governance Compass — Logo Implementation Reference

*This replaces the previous contour mark logo spec.*

## The Mark

The logo is a radar rose — a compass rose where the four directional petals have different lengths, representing a measured governance profile. The four petals correspond to the four domains: Stone/Economic (north), Slate/Power (east), Sage/Society (south), Clay/World (west). The unequal petal lengths communicate "this measured something" — it's a compass that produces a result.

The canonical SVG is `governance-compass-radar-rose.svg` (56×56 viewBox). Scale uniformly for all sizes.

## Geometry

All four petals share three structural constants. Only the tip distance varies per petal.

```
Shared constants:
  waistDist  = 6    (center to widest point along petal axis)
  innerDist  = 9    (center to inner notch along petal axis)
  halfWidth  = 6    (half-width at widest point, perpendicular to axis)
  centerDot  = 3    (radius of center circle)

Petal tip distances (the "measurement"):
  North (Stone/Economic):  27
  East  (Slate/Power):     22
  South (Sage/Society):    17
  West  (Clay/World):      25

Derived coordinates (relative to center 0,0):
  North: (0,-27)  (halfW,-waistDist)   (0,-innerDist)  (-halfW,-waistDist)
  East:  (22,0)   (waistDist,halfW)    (innerDist,0)   (waistDist,-halfW)
  South: (0,17)   (-halfW,waistDist)   (0,innerDist)   (halfW,waistDist)
  West:  (-25,0)  (-waistDist,-halfW)  (-innerDist,0)  (-waistDist,halfW)
```

This means: `North: "0,-27 6,-6 0,-9 -6,-6"`, `East: "22,0 6,6 9,0 6,-6"`, `South: "0,17 -6,6 0,9 6,6"`, `West: "-25,0 -6,-6 -9,0 -6,6"`.

## Color Variants

### Domain colors (primary — used on website)

| Petal | Domain | Color | Opacity (light) | Opacity (dark) |
|---|---|---|---|---|
| North | Economic | Stone `#85735e` | 0.70 | 0.65 |
| East | Power | Slate `#6b7d8a` | 0.50 | 0.45 |
| South | Society | Sage `#7a8b6e` | 0.45 | 0.40 |
| West | World | Clay `#96716b` | 0.55 | 0.50 |
| Center dot | — | Stone `#85735e` / `#b5a594` | 1.0 | 1.0 |

### Dark mode colors

| Petal | Color |
|---|---|
| North | `#b5a594` |
| East | `#92a3af` |
| South | `#a0b093` |
| West | `#b5a094` |
| Center dot | `#b5a594` |

### Monochrome (for watermarks, print, favicons where 4 colors would muddy)

All petals use Stone `#85735e` (light) or `#b5a594` (dark), differentiated by opacity:

| Petal | Opacity (light) | Opacity (dark) |
|---|---|---|
| North | 0.70 | 0.65 |
| East | 0.50 | 0.45 |
| South | 0.35 | 0.30 |
| West | 0.55 | 0.50 |

## Size Tiers

The mark has three tiers. The geometry is identical — only `halfWidth` and `centerDot` change to maintain visual mass at smaller pixel counts.

| Tier | Rendered size | halfWidth | centerDot radius | Notes |
|---|---|---|---|---|
| Full | ≥56px | 6 | 3 | Canonical mark. Use for hero, landing page, lockup, share images. |
| Nav | 28–55px | 7 | 3.5 | Wider petals for nav bars and toolbar icons. |
| Favicon | ≤27px | 8.5 | 5 | Widest petals, largest dot. For favicon, tab icons, tiny contexts. |

The tip distances (27, 22, 17, 25), waistDist (6), and innerDist (9) are the same at every tier. Only halfWidth and centerDot change.

### Derived coordinates per tier

**Full (halfWidth=6):**
```
North: "0,-27 6,-6 0,-9 -6,-6"
East:  "22,0 6,6 9,0 6,-6"
South: "0,17 -6,6 0,9 6,6"
West:  "-25,0 -6,-6 -9,0 -6,6"
```

**Nav (halfWidth=7):**
```
North: "0,-27 7,-6 0,-9 -7,-6"
East:  "22,0 6,7 9,0 6,-7"
South: "0,17 -7,6 0,9 7,6"
West:  "-25,0 -6,-7 -9,0 -6,7"
```

**Favicon (halfWidth=8.5):**
```
North: "0,-27 8.5,-6 0,-9 -8.5,-6"
East:  "22,0 6,8.5 9,0 6,-8.5"
South: "0,17 -8.5,6 0,9 8.5,6"
West:  "-25,0 -6,-8.5 -9,0 -6,8.5"
```

## Lockup

The standard lockup is the mark to the left of the wordmark, vertically centered:

```
[mark]  The Governance Compass
        Map your political philosophy
```

- Wordmark: 17px equivalent, serif (Georgia or site serif stack), weight 500
- Tagline: 11px equivalent, sans-serif, letter-spacing 0.04em, text-tertiary color
- Gap between mark and text: roughly 40% of the mark's width
- The tagline is optional — the lockup works with just the wordmark

## Spacing / Clear Space

Maintain clear space around the mark equal to at least the center dot's diameter on all sides. Because the north petal extends further than the south, the mark's visual center is slightly above its geometric center — this is intentional and should not be "corrected" by shifting the mark down.

## React Implementation

```tsx
interface RadarRoseProps {
  size?: number;
  variant?: 'domain' | 'mono';
  isDark?: boolean;
  className?: string;
}

const TIERS = {
  full:    { halfWidth: 6,   dotR: 3,   minSize: 56 },
  nav:     { halfWidth: 7,   dotR: 3.5, minSize: 28 },
  favicon: { halfWidth: 8.5, dotR: 5,   minSize: 0  },
} as const;

const DOMAIN_COLORS = {
  light: {
    north: { color: '#85735e', opacity: 0.70 },
    east:  { color: '#6b7d8a', opacity: 0.50 },
    south: { color: '#7a8b6e', opacity: 0.45 },
    west:  { color: '#96716b', opacity: 0.55 },
    dot:   '#85735e',
  },
  dark: {
    north: { color: '#b5a594', opacity: 0.65 },
    east:  { color: '#92a3af', opacity: 0.45 },
    south: { color: '#a0b093', opacity: 0.40 },
    west:  { color: '#b5a094', opacity: 0.50 },
    dot:   '#b5a594',
  },
} as const;

const MONO_COLORS = {
  light: {
    north: { color: '#85735e', opacity: 0.70 },
    east:  { color: '#85735e', opacity: 0.50 },
    south: { color: '#85735e', opacity: 0.35 },
    west:  { color: '#85735e', opacity: 0.55 },
    dot:   '#85735e',
  },
  dark: {
    north: { color: '#b5a594', opacity: 0.65 },
    east:  { color: '#b5a594', opacity: 0.45 },
    south: { color: '#b5a594', opacity: 0.30 },
    west:  { color: '#b5a594', opacity: 0.50 },
    dot:   '#b5a594',
  },
} as const;

// Petal tip distances (fixed across all tiers)
const TIPS = { north: 27, east: 22, south: 17, west: 25 };

// Shared structural constants (fixed across all tiers)
const WAIST = 6;
const INNER = 9;

function getPetalPoints(hw: number) {
  return {
    north: `0,-${TIPS.north} ${hw},-${WAIST} 0,-${INNER} -${hw},-${WAIST}`,
    east:  `${TIPS.east},0 ${WAIST},${hw} ${INNER},0 ${WAIST},-${hw}`,
    south: `0,${TIPS.south} -${hw},${WAIST} 0,${INNER} ${hw},${WAIST}`,
    west:  `-${TIPS.west},0 -${WAIST},-${hw} -${INNER},0 -${WAIST},${hw}`,
  };
}

function getTier(size: number) {
  if (size >= TIERS.full.minSize) return TIERS.full;
  if (size >= TIERS.nav.minSize) return TIERS.nav;
  return TIERS.favicon;
}

export function GovernanceCompassMark({
  size = 32,
  variant = 'domain',
  isDark = false,
  className,
}: RadarRoseProps) {
  const tier = getTier(size);
  const points = getPetalPoints(tier.halfWidth);
  const mode = isDark ? 'dark' : 'light';
  const colors = variant === 'mono' ? MONO_COLORS[mode] : DOMAIN_COLORS[mode];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      className={className}
    >
      <g transform="translate(28,28)">
        <polygon points={points.north} fill={colors.north.color} opacity={colors.north.opacity} />
        <polygon points={points.east}  fill={colors.east.color}  opacity={colors.east.opacity} />
        <polygon points={points.south} fill={colors.south.color} opacity={colors.south.opacity} />
        <polygon points={points.west}  fill={colors.west.color}  opacity={colors.west.opacity} />
        <circle cx={0} cy={0} r={tier.dotR} fill={colors.dot} />
      </g>
    </svg>
  );
}
```

### Usage Examples

```tsx
// Nav bar (auto-selects nav tier at 28px)
<GovernanceCompassMark size={28} />

// Nav bar, dark mode
<GovernanceCompassMark size={28} isDark />

// Landing page hero (auto-selects full tier at 80px)
<GovernanceCompassMark size={80} />

// Favicon (auto-selects favicon tier at 16px)
<GovernanceCompassMark size={16} />

// Watermark on share image (monochrome to avoid muddy colors on variable backgrounds)
<GovernanceCompassMark size={40} variant="mono" />
```

## Don'ts

- Don't rotate the mark — north (Stone/Economic) always points up
- Don't equalize the petal lengths — the asymmetry IS the concept
- Don't change the petal-to-domain color mapping
- Don't add outlines, shadows, or glows
- Don't place on busy backgrounds where the lower-opacity petals will disappear
- Don't change the petal order (always N/E/S/W clockwise = Stone/Slate/Sage/Clay)
- Don't use the domain-color variant at sizes where the colors would be indistinguishable (below ~20px) — switch to monochrome
