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
