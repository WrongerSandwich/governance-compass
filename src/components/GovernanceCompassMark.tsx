/**
 * The Governance Compass radar rose mark — four directional petals with
 * different lengths, representing a measured governance profile. Each petal
 * corresponds to a domain: Stone/Economic (N), Slate/Power (E), Sage/Society (S),
 * Clay/World (W).
 *
 * See docs/system_proposal/governance_compass_logo_implementation.md
 */

interface RadarRoseProps {
  size?: number;
  variant?: "domain" | "mono";
  animate?: boolean;
  className?: string;
}

const TIERS = {
  full:    { halfWidth: 6,   dotR: 3,   minSize: 56 },
  nav:     { halfWidth: 7,   dotR: 3.5, minSize: 28 },
  favicon: { halfWidth: 8.5, dotR: 5,   minSize: 0  },
} as const;

const DOMAIN_COLORS_LIGHT = {
  north: { color: "#85735e", opacity: 0.70 },
  east:  { color: "#6b7d8a", opacity: 0.50 },
  south: { color: "#7a8b6e", opacity: 0.45 },
  west:  { color: "#96716b", opacity: 0.55 },
  dot:   "#85735e",
} as const;

const MONO_COLORS_LIGHT = {
  north: { color: "#85735e", opacity: 0.70 },
  east:  { color: "#85735e", opacity: 0.50 },
  south: { color: "#85735e", opacity: 0.35 },
  west:  { color: "#85735e", opacity: 0.55 },
  dot:   "#85735e",
} as const;

// Petal tip distances (fixed across all tiers)
const TIPS = { north: 27, east: 22, south: 17, west: 25 };
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

const PETALS = ["north", "east", "south", "west"] as const;
const PETAL_DELAYS = [0, 0.1, 0.2, 0.3]; // stagger in seconds

export function GovernanceCompassMark({
  size = 32,
  variant = "domain",
  animate = false,
  className,
}: RadarRoseProps) {
  const tier = getTier(size);
  const points = getPetalPoints(tier.halfWidth);
  const colors = variant === "mono" ? MONO_COLORS_LIGHT : DOMAIN_COLORS_LIGHT;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <g transform="translate(28,28)">
        {PETALS.map((dir, i) => (
          <polygon
            key={dir}
            points={points[dir]}
            fill={colors[dir].color}
            opacity={animate ? undefined : colors[dir].opacity}
            style={animate ? {
              transformOrigin: "0 0",
              ["--petal-opacity" as string]: colors[dir].opacity,
              animation: `petal-reveal 0.4s ease-out ${PETAL_DELAYS[i]}s both`,
            } : undefined}
          />
        ))}
        <circle
          cx={0} cy={0} r={tier.dotR} fill={colors.dot}
          style={animate ? {
            opacity: 0,
            animation: "fade-in-up 0.3s ease-out 0.45s both",
          } : undefined}
        />
      </g>
    </svg>
  );
}
