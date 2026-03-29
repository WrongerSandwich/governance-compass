/**
 * Design tokens for use in SVG components where CSS var() is impractical
 * (e.g., gradient stop-colors). Prefer `style={{ fill: 'var(--stone-600)' }}`
 * in SVG elements for automatic dark mode support.
 */
export const tokens = {
  stone: {
    50: '#f7f4f0',
    100: '#efe9e3',
    200: '#e0d6cc',
    300: '#cdbfb2',
    400: '#b5a594',
    500: '#9d8b78',
    600: '#85735e',
    700: '#6e5a48',
    800: '#5a4636',
    900: '#3d2e1f',
  },
  info: '#2563eb',
  warning: '#d97706',
} as const;

/**
 * Domain color mapping — four muted tones for the four governance domains.
 * Used exclusively on the results page (radar chart, axis breakdown, score bars).
 * See docs/system_proposal/governance_compass_domain_colors.md
 */
export const DOMAIN_COLORS = {
  economic: {
    name: 'Economic Organization',
    axes: [1, 2] as number[],
    600: '#85735e', // Stone
    400: '#b5a594',
  },
  power: {
    name: 'Power and Authority',
    axes: [3, 4, 5, 6] as number[],
    600: '#6b7d8a', // Slate
    400: '#9daebb',
  },
  society: {
    name: 'Society and Identity',
    axes: [7, 8, 9] as number[],
    600: '#7a8b6e', // Sage
    400: '#94a488',
  },
  world: {
    name: 'The State in the World',
    axes: [10, 11, 12] as number[],
    600: '#96716b', // Clay
    400: '#c1a7a1',
  },
} as const;

export type DomainKey = keyof typeof DOMAIN_COLORS;

const AXIS_TO_DOMAIN: Record<number, DomainKey> = {};
for (const [key, config] of Object.entries(DOMAIN_COLORS)) {
  for (const axisId of config.axes) {
    AXIS_TO_DOMAIN[axisId] = key as DomainKey;
  }
}

export function getDomainForAxis(axisId: number): DomainKey {
  return AXIS_TO_DOMAIN[axisId] ?? 'economic';
}

export function getDomainColor600(axisId: number): string {
  return DOMAIN_COLORS[getDomainForAxis(axisId)][600];
}
