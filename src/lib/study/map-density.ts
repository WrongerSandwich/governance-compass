/** Minimum sample size required before country-level map data is shown. */
export const COUNTRY_DENSITY_THRESHOLD = 10;

/**
 * Bin the supported country-count range across the map's five density colors.
 * Country counts are much smaller than region counts, so they need their own
 * fixed breakpoints rather than reusing the region-count breakpoints.
 */
export function countryDensityBin(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count < 15) return 0;
  if (count < 20) return 1;
  if (count < 25) return 2;
  if (count < 30) return 3;
  return 4;
}

export function countryDensityFill(count: number): string {
  return `var(--map-density-${countryDensityBin(count)})`;
}
