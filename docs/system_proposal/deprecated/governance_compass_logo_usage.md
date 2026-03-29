# The Governance Compass — Logo Usage Reference

## The Mark

The logo is a topographic contour mark — four concentric irregular curves with an elongated, ridge-like form and an off-center summit dot. It evokes a terrain map and, at a distance, reads like a fingerprint — both metaphors for a unique political identity.

The canonical SVG is `governance-compass-mark.svg` (56×56 viewBox). Scale uniformly for all sizes.

## Color Variants

The mark uses a single color at varying opacities. Swap the color value across all strokes and the fill to switch variants:

| Context | Color | Value |
|---|---|---|
| Light backgrounds | Stone 600 | `#85735e` |
| Dark backgrounds | Stone 400 | `#b5a594` |
| Monochrome/print | Black | `#1a1a1a` at same opacity values |

The opacity progression from outer to inner ring is: 0.20 → 0.35 → 0.50 → 0.65, with the summit dot at full opacity. This progression is part of the mark's identity — don't flatten it to a single opacity.

## Size Guidelines

| Usage | Size | Notes |
|---|---|---|
| Favicon | 16–32px | Drop to 2 visible rings (second + third contours) plus the summit dot. The outermost and innermost rings collapse at this scale. |
| Nav bar | 24–32px | Same 2-ring simplification, or use full mark if the rendering is crisp enough. |
| Lockup (with wordmark) | 32–40px | Full 4-ring mark alongside text. |
| Hero / landing page | 56–120px | Full mark at canonical detail. |
| Social sharing image | 40–56px | Full mark as watermark in corner of the shareable results image. |

## Lockup

The standard lockup is the mark to the left of the wordmark, vertically centered:

```
[mark]  The Governance Compass
        Map your political philosophy
```

- Wordmark: 17px equivalent, serif (Georgia or your serif stack), weight 500
- Tagline: 11px equivalent, sans-serif, letter-spacing 0.04em, text-tertiary color
- Gap between mark and text: roughly 40% of the mark's width
- The tagline is optional — the lockup works with just the wordmark

## Spacing / Clear Space

Maintain clear space around the mark equal to at least the summit dot's diameter on all sides. The contour lines have soft, transparent edges so they don't need as much breathing room as a hard-edged logo, but they should never overlap or touch adjacent text or UI elements.

## Implementation as a React Component

```tsx
interface LogoMarkProps {
  size?: number;       // px, default 32
  color?: string;      // hex, default '#85735e'
  className?: string;
}

function GovernanceCompassMark({ size = 32, color = '#85735e', className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      className={className}
    >
      <path
        d="M18,10 C30,7 44,12 48,22 C52,32 46,44 34,47 C22,50 10,42 8,30 C6,20 10,12 18,10"
        stroke={color} strokeWidth="0.8" opacity="0.2"
      />
      <path
        d="M20,16 C30,13 40,17 43,24 C46,31 42,40 33,42 C24,44 15,38 13,29 C11,22 14,17 20,16"
        stroke={color} strokeWidth="0.9" opacity="0.35"
      />
      <path
        d="M22,22 C29,19 37,22 39,27 C41,32 37,37 31,38 C25,39 19,35 18,29 C17,25 19,23 22,22"
        stroke={color} strokeWidth="1.0" opacity="0.5"
      />
      <path
        d="M24,26 C28,24 33,26 34,29 C35,32 32,35 28,35 C25,35 22,33 22,30 C22,27 23,26 24,26"
        stroke={color} strokeWidth="1.0" opacity="0.65"
      />
      <circle cx="26" cy="30" r="2" fill={color} />
    </svg>
  );
}
```

For the favicon specifically, use this simplified 2-ring version:

```tsx
function GovernanceCompassFavicon({ size = 16, color = '#85735e' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <path
        d="M22,22 C29,19 37,22 39,27 C41,32 37,37 31,38 C25,39 19,35 18,29 C17,25 19,23 22,22"
        stroke={color} strokeWidth="2.5" opacity="0.4"
      />
      <circle cx="26" cy="30" r="5" fill={color} />
    </svg>
  );
}
```

## Don'ts

- Don't rotate or skew the mark — the ridge orientation is part of its character
- Don't change the opacity progression or flatten it to uniform opacity
- Don't add drop shadows, glows, or outlines
- Don't place on busy backgrounds where the outer contour rings will disappear — the mark needs a relatively clean surface to read
- Don't rearrange the lockup (e.g., text above mark, mark to the right) — mark-left, text-right is the only approved layout
