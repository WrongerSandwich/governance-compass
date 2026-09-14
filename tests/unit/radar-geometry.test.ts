/**
 * The polar geometry shared by `RadarChart` and `ArchetypeCard`'s `MiniRadar`.
 *
 * These are pure functions, so they are pinned here without a mount. Before
 * the extraction the only guard on this maths was Task 7's
 * `places the radar's vertices where the score and the radius put them`,
 * which reads `points` attributes off a rendered SVG — the hard way, and only
 * for one of the two charts. A rescale, a sign flip or a lost -90 degree
 * offset in either chart now reddens here first.
 */
import { describe, expect, it } from "vitest";
import {
  TOTAL_AXES,
  normaliseByAxisId,
  polarToCart,
  ringPoints,
  scoreToRadius,
  spokeAngle,
  type RadarAxisScore,
} from "@/lib/radar-geometry";

const axis = (axisId: number, finalScore: number): RadarAxisScore => ({
  axisId,
  name: `Axis ${axisId}`,
  poleALabel: `A${axisId}`,
  poleBLabel: `B${axisId}`,
  finalScore,
  confidence: "high",
});

describe("scoreToRadius", () => {
  it("maps the score domain onto the full radius, centre-out", () => {
    // The endpoints and the midpoint pin rescale, sign-flip and offset all at
    // once: any affine change to ((score + 1) / 2) * R breaks at least one.
    const R = 170;

    expect(scoreToRadius(-1, R)).toBe(0);
    expect(scoreToRadius(0, R)).toBe(R / 2);
    expect(scoreToRadius(1, R)).toBe(R);
  });

  it("scales with the radius it is handed, not a captured constant", () => {
    // The two charts differ only here: MAX_RADIUS 170 against MINI_R 80. A
    // helper that closed over one of them is how the duplication started.
    expect(scoreToRadius(0, 80)).toBe(40);
    expect(scoreToRadius(0.2, 170)).toBeCloseTo(0.6 * 170, 10);
  });
});

describe("spokeAngle", () => {
  it("starts straight up and closes the circle over `total`, not `total - 1`", () => {
    // At index 0 the divisor cancels, so an off-by-one is invisible there.
    // Index 3 of 12 is a quarter turn from -90 degrees, i.e. exactly 0; with a
    // `total - 1` divisor it lands at 0.1428 instead.
    expect(spokeAngle(0, TOTAL_AXES)).toBeCloseTo(-Math.PI / 2, 12);
    expect(spokeAngle(3, TOTAL_AXES)).toBeCloseTo(0, 12);
    expect(spokeAngle(6, TOTAL_AXES)).toBeCloseTo(Math.PI / 2, 12);
    // Spoke `total` would be spoke 0 again — the circle closes rather than
    // stopping one short of it.
    expect(spokeAngle(TOTAL_AXES, TOTAL_AXES)).toBeCloseTo(
      spokeAngle(0, TOTAL_AXES) + 2 * Math.PI,
      12,
    );
  });
});

describe("polarToCart", () => {
  it("places a point at the radius and angle given, about the centre given", () => {
    const [x, y] = polarToCart(spokeAngle(0, TOTAL_AXES), 80, 100, 100);
    expect(x).toBeCloseTo(100, 10);
    expect(y).toBeCloseTo(20, 10);

    // A non-zero angle, so a swapped cos/sin cannot pass.
    const [x3, y3] = polarToCart(spokeAngle(3, TOTAL_AXES), 80, 100, 100);
    expect(x3).toBeCloseTo(180, 10);
    expect(y3).toBeCloseTo(100, 10);
  });
});

describe("ringPoints", () => {
  it("reads its radius as absolute, not as a fraction of some maximum", () => {
    // `RadarChart` used to take a fraction (`ringPolygonPoints(0.5)`) and
    // `ArchetypeCard` an absolute radius. Unifying the two by name without
    // converting the call sites rescales every ring in one chart, and both
    // still render plausibly — there is no crash to catch it. A fraction
    // reaching here would put the first vertex at 99.5 rather than 60.
    const first = (points: string) => points.split(" ")[0];

    expect(first(ringPoints(80, TOTAL_AXES, 100, 100))).toBe("100,20");
    expect(first(ringPoints(80 * 0.5, TOTAL_AXES, 100, 100))).toBe("100,60");
    expect(first(ringPoints(170, TOTAL_AXES, 290, 290))).toBe("290,120");
  });

  it("puts its vertices on the spokes, not merely at the right radius", () => {
    // Every other assertion in this file reads ring vertex 0, where the
    // `/ total` divisor cancels — the blind spot spokeAngle's own docstring
    // names. A `total - 1` divisor reached through ringPoints throws BOTH
    // charts' rings out of angular alignment with their spokes and dots while
    // still drawing a closed, plausible twelve-sided figure. Index 3 of 12 is
    // a quarter turn from straight up, i.e. due east of the centre.
    expect(ringPoints(80, TOTAL_AXES, 100, 100).split(" ")[3]).toBe("180,100");
    expect(ringPoints(170, TOTAL_AXES, 290, 290).split(" ")[3]).toBe("460,290");
  });

  it("emits one vertex per spoke", () => {
    expect(ringPoints(80, TOTAL_AXES, 100, 100).split(" ")).toHaveLength(TOTAL_AXES);
  });
});

describe("normaliseByAxisId", () => {
  it("puts an out-of-order list back into axis-id order", () => {
    // A radar vertex is positional: vertex i means axis i + 1. The two results
    // routes build their axis lists differently (pipeline order against
    // `axis.order`) and agree only because `order === id` for all twelve rows
    // of src/data/axes.ts. If that stops holding, an un-normalised list draws
    // the right shape against the wrong spokes.
    const shuffled = [axis(3, 0.3), axis(1, 0.1), axis(12, 0.9), axis(2, 0.2)];
    const padded = normaliseByAxisId(shuffled);

    expect(padded.map((a) => a.axisId)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(padded[0].finalScore).toBe(0.1);
    expect(padded[1].finalScore).toBe(0.2);
    expect(padded[2].finalScore).toBe(0.3);
    expect(padded[11].finalScore).toBe(0.9);
  });

  it("reorders a list that is already twelve long", () => {
    // The case the addendum is actually about. A short list is obviously
    // wrong and takes the padding path; a complete-but-mis-ordered list is
    // the one that draws twelve plausible vertices against the wrong spokes,
    // and any "already the right length, nothing to do" shortcut lets it
    // straight through.
    const reversed = Array.from({ length: TOTAL_AXES }, (_, i) =>
      axis(TOTAL_AXES - i, (TOTAL_AXES - i) / 20),
    );
    const padded = normaliseByAxisId(reversed);

    expect(padded.map((a) => a.axisId)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(padded[0].finalScore).toBe(1 / 20);
    expect(padded[11].finalScore).toBe(12 / 20);
  });

  it("pads a missing axis with a neutral score rather than dropping a spoke", () => {
    const padded = normaliseByAxisId([axis(1, 0.5)]);

    expect(padded).toHaveLength(TOTAL_AXES);
    // Neutral, not absent: the scoring engine treats an unanswered item as 0,
    // and a short list would otherwise close the polygon across the gap.
    expect(padded[4].finalScore).toBe(0);
    expect(padded[4].axisId).toBe(5);
    expect(padded[4].confidence).toBe("low");
  });

  it("is a no-op on a list that is already twelve long and in order", () => {
    const complete = Array.from({ length: TOTAL_AXES }, (_, i) => axis(i + 1, i / 20));
    const padded = normaliseByAxisId(complete);

    expect(padded).toEqual(complete);
  });
});
