/**
 * The Governance Compass contour mark — four concentric irregular curves
 * with an off-center summit dot. Evokes a terrain map / fingerprint.
 *
 * See docs/system_proposal/governance_compass_logo_usage.md for full guidelines.
 */

interface LogoMarkProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export function GovernanceCompassMark({ size = 32, className, animate = false }: LogoMarkProps) {
  // Contour ring data: path, stroke width, target opacity, animation delay
  const rings = [
    { d: "M18,10 C30,7 44,12 48,22 C52,32 46,44 34,47 C22,50 10,42 8,30 C6,20 10,12 18,10", sw: 0.8, op: 0.2, delay: 0 },
    { d: "M20,16 C30,13 40,17 43,24 C46,31 42,40 33,42 C24,44 15,38 13,29 C11,22 14,17 20,16", sw: 0.9, op: 0.35, delay: 0.12 },
    { d: "M22,22 C29,19 37,22 39,27 C41,32 37,37 31,38 C25,39 19,35 18,29 C17,25 19,23 22,22", sw: 1.0, op: 0.5, delay: 0.24 },
    { d: "M24,26 C28,24 33,26 34,29 C35,32 32,35 28,35 C25,35 22,33 22,30 C22,27 23,26 24,26", sw: 1.0, op: 0.65, delay: 0.36 },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {rings.map((ring, i) => (
        <path
          key={i}
          d={ring.d}
          className="stroke-stone-600"
          strokeWidth={ring.sw}
          opacity={animate ? undefined : ring.op}
          strokeDasharray={animate ? 200 : undefined}
          strokeDashoffset={animate ? 0 : undefined}
          style={animate ? {
            ['--contour-target-opacity' as string]: ring.op,
            animation: `contour-draw 0.6s ease-out ${ring.delay}s both`,
          } : undefined}
        />
      ))}
      <circle
        cx="26" cy="30" r="2" className="fill-stone-600"
        style={animate ? {
          transformOrigin: '26px 30px',
          animation: `dot-appear 0.3s ease-out 0.5s both`,
        } : undefined}
      />
    </svg>
  );
}

export function GovernanceCompassFavicon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M22,22 C29,19 37,22 39,27 C41,32 37,37 31,38 C25,39 19,35 18,29 C17,25 19,23 22,22"
        stroke="#85735e" strokeWidth="2.5" opacity="0.4"
      />
      <circle cx="26" cy="30" r="5" fill="#85735e" />
    </svg>
  );
}
