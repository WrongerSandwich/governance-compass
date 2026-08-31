import { describe, expect, it } from "vitest";
import {
  COUNTRY_DENSITY_THRESHOLD,
  countryDensityBin,
  countryDensityFill,
} from "@/lib/study/map-density";

describe("country map density", () => {
  it("uses the documented minimum sample size", () => {
    expect(COUNTRY_DENSITY_THRESHOLD).toBe(10);
  });

  it.each([
    [10, 0],
    [14, 0],
    [15, 1],
    [19, 1],
    [20, 2],
    [24, 2],
    [25, 3],
    [29, 3],
    [30, 4],
    [35, 4],
  ] as const)("maps a count of %i to density bin %i", (count, bin) => {
    expect(countryDensityBin(count)).toBe(bin);
    expect(countryDensityFill(count)).toBe(`var(--map-density-${bin})`);
  });
});
