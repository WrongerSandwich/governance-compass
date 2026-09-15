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
  COORD_PLACES,
  TOTAL_AXES,
  normaliseByAxisId,
  polarToCart,
  ringPoints,
  roundCoord,
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

describe("coordinate rounding", () => {
  // The hydration fix, and the ONLY guard on it. Reverting the rounding in
  // polarToCart left the whole suite green: every other assertion in this file
  // is a toBeCloseTo, which is blind to the last four decimal places by
  // construction. The defect being fixed is a *serialisation* one — React
  // compares the attribute string the server emitted against the number the
  // client recomputed — so these assertions read the emitted string, not the
  // value. A value-only assertion cannot fail for the reason this code exists.

  it("collapses two doubles that are geometrically the same point onto one string", () => {
    // This is the defect, reproducible in a single engine. RadarChart draws its
    // twelve labels at radius MAX_RADIUS + LABEL_PADDING = 192 about (290, 290).
    // Spokes 1 and 11 are mirror images, so their y is the same point — but the
    // trig reaches it by different routes and lands on different doubles:
    //
    //   spoke 1  -> 123.72312247338778
    //   spoke 11 -> 123.7231224733878
    //
    // One ulp apart. That is the same size of disagreement Node and Chromium
    // have with each other on a SINGLE spoke, which is what put
    // y="123.7231224733878" against y={123.72312247338783} in React's hydration
    // diff and logged "this won't be patched up" on every load of
    // /results/[profileId]. Rounding puts both on one grid point.
    const LABEL_R = 192;
    const y1 = polarToCart(spokeAngle(1, TOTAL_AXES), LABEL_R, 290, 290)[1];
    const y11 = polarToCart(spokeAngle(11, TOTAL_AXES), LABEL_R, 290, 290)[1];

    // Asserted as STRINGS, because the bug is a serialisation one: these values
    // become SVG attributes, and React compares the attribute text against the
    // client's number. `toBeCloseTo` — every other assertion in this file —
    // passes on both values with or without the fix.
    expect(y1.toString()).toBe("123.7231225");
    expect(y11.toString()).toBe("123.7231225");
    expect(y1.toString()).toBe(y11.toString());

    // And the mirror arm, where the raw value is 193.99999999999991 — an
    // integer coordinate that does not serialise as one until it is rounded.
    expect(polarToCart(spokeAngle(11, TOTAL_AXES), LABEL_R, 290, 290)[0].toString()).toBe("194");

    // A vertex on the chart proper, so the guard is not confined to the label
    // ring. Unrounded this reads "142.7756813566454".
    expect(polarToCart(spokeAngle(1, TOTAL_AXES), 170, 290, 290)[1].toString()).toBe(
      "142.7756814",
    );
  });

  it("never emits more fractional digits than COORD_PLACES", () => {
    // Swept rather than spot-checked: the failure mode is one coordinate in
    // seventy keeping a long tail, and a single hand-picked vertex would miss
    // it. Both charts' real dimensions, every spoke, three radii each.
    const frac = (n: number) => String(n).split(".")[1]?.length ?? 0;
    const offenders: string[] = [];

    for (const [radius, cx, cy] of [
      [170, 290, 290], // RadarChart: MAX_RADIUS about its centre
      [92, 100, 100], // MiniRadar: an off-grid radius about its centre
      [36, 100, 100], // MiniRadar: the fixture radius results-chrome pins
    ] as const) {
      for (let i = 0; i < TOTAL_AXES; i++) {
        for (const v of polarToCart(spokeAngle(i, TOTAL_AXES), radius, cx, cy)) {
          if (frac(v) > COORD_PLACES) offenders.push(`r=${radius} i=${i}: ${v}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("rounds through ringPoints too, which builds its own strings", () => {
    // ringPoints interpolates into a template rather than returning numbers,
    // so it could in principle bypass the rounding without any polarToCart
    // assertion noticing. It does not, because it calls polarToCart — this
    // pins that it keeps doing so.
    const frac = (pair: string) =>
      pair.split(",").map((n) => n.split(".")[1]?.length ?? 0);

    const long = ringPoints(170, TOTAL_AXES, 290, 290)
      .split(" ")
      .filter((pair) => frac(pair).some((d) => d > COORD_PLACES));

    expect(long).toEqual([]);
  });

  it("leaves a value that needs no rounding exactly alone", () => {
    // The rounding must not perturb the integers the exact-string assertions
    // below depend on, nor drag a clean value onto a neighbouring grid point.
    expect(roundCoord(100)).toBe(100);
    expect(roundCoord(-0.5)).toBe(-0.5);
    expect(roundCoord(456.2768775266122)).toBe(456.2768775);
  });

  it("keeps enough precision to stay inside the tolerances this file asserts", () => {
    // COORD_PLACES is a trade-off between two failure modes, and this pins the
    // side a future reader is likelier to get wrong. Lowering it to 6 puts the
    // worst-case radius error at 4.0e-7 against the 5e-7 that toBeCloseTo(_, 6)
    // allows — 1.2x, which is not headroom. At 7 the same error is 3.1e-8.
    let worst = 0;
    for (let i = 0; i < TOTAL_AXES; i++) {
      const [x, y] = polarToCart(spokeAngle(i, TOTAL_AXES), 36, 100, 100);
      worst = Math.max(worst, Math.abs(Math.hypot(x - 100, y - 100) - 36));
    }
    // An order of magnitude clear of the tightest tolerance in the file.
    expect(worst).toBeLessThan(5e-8);
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

import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { sourceFiles, stripComments } from "../helpers/source-files";

describe("radar geometry has one home (design delta phase 5)", () => {
  it("leaves no component with its own copy of the polar helpers", () => {
    // Five copies existed: RadarChart and MiniRadar (migrated in phase 4),
    // ComparisonRadar, GroupRadar, and the archetype page's own MiniRadar.
    // A local copy is not a style problem — each one re-inlines the trig that
    // Node and Chromium disagree about, so each one logs its own hydration
    // mismatch on a server-rendered page.
    const offenders = sourceFiles(resolve(process.cwd(), "src")).flatMap((file) => {
      if (file.endsWith("radar-geometry.ts")) return [];
      const text = readFileSync(file, "utf8");
      const match = text.match(/function (?:polarToCart|spokeAngle|scoreToRadius|ringPolygonPoints)\b/);
      return match ? [`${relative(process.cwd(), file)}: ${match[0]}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("keeps exactly one exported TOTAL_AXES", () => {
    const offenders = sourceFiles(resolve(process.cwd(), "src")).flatMap((file) => {
      if (file.endsWith("radar-geometry.ts")) return [];
      const text = readFileSync(file, "utf8");
      return /export const TOTAL_AXES/.test(text)
        ? [relative(process.cwd(), file)]
        : [];
    });

    expect(offenders).toEqual([]);
  });

  it("rounds every radar coordinate onto the shared decimal grid", () => {
    // The assertion that would have failed before the migration: a component
    // computing its own cos/sin emits an unrounded coordinate.
    const charts = [
      "src/components/comparison/ComparisonRadar.tsx",
      "src/components/groups/GroupRadar.tsx",
      "src/app/archetypes/page.tsx",
    ];

    for (const chart of charts) {
      const text = readFileSync(resolve(process.cwd(), chart), "utf8");
      expect(text).toContain('from "@/lib/radar-geometry"');
      expect(text).not.toMatch(/Math\.(?:cos|sin)\(/);
    }
  });

  it("draws every radar mark off a stepping token, never a fixed hex", () => {
    const charts = [
      "src/components/comparison/ComparisonRadar.tsx",
      "src/components/groups/GroupRadar.tsx",
      "src/app/archetypes/page.tsx",
      "src/app/page.tsx",
    ];

    for (const chart of charts) {
      const text = readFileSync(resolve(process.cwd(), chart), "utf8");
      expect(text).not.toContain("getDomainColor600");
    }
  });
});

describe("no component keeps its own polar helper", () => {
  it("leaves no private copy of the polar conversion anywhere in src", () => {
    // Phase 5 closed four of five. The fifth is /study's, spelled
    // `polarToXY` with the arguments in a different order, which is why a
    // grep for `polarToCart` did not find it. The consequence is not
    // stylistic: an unrounded coordinate serialises differently in Node and
    // in Chromium, and React logs a hydration mismatch on every render of
    // /study/patterns.
    const files = sourceFiles(resolve(process.cwd(), "src"));
    // A sweep whose file list resolved to nothing would report success.
    expect(files.length).toBeGreaterThan(50);

    const offenders = files.flatMap((file) => {
      const text = readFileSync(file, "utf8");
      if (file.endsWith("radar-geometry.ts")) return [];
      const match = text.match(/function polarTo[A-Za-z]*\(/);
      return match ? [`${relative(process.cwd(), file)}: ${match[0]}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("routes every file that does its own trig through the shared module", () => {
    // The case above asserts a NAME, and the premise of its own comment is
    // that the fifth copy hid BECAUSE it was spelled differently. A copy
    // written `const polarToXY = (…) =>`, or named `toXY` or `vertexAt`,
    // walks straight past it. So assert the property the name was only ever
    // a proxy for: a file that computes a polar coordinate at all has to get
    // the shared, ROUNDED conversion from one place.
    //
    // `radar-geometry.ts` is the one home and is exempt. Everything else
    // that reaches for the trig must import it — which is a weaker claim
    // than "must not use it" and a deliberately weaker one: `RadarChart`
    // legitimately nudges a label by a few pixels along the same angle the
    // module gave it, and banning the call outright would force that offset
    // into the shared module or into a magic constant.
    const files = sourceFiles(resolve(process.cwd(), "src"));
    expect(files.length).toBeGreaterThan(50);

    const offenders = files.flatMap((file) => {
      if (file.endsWith("radar-geometry.ts")) return [];
      const text = stripComments(readFileSync(file, "utf8"));
      if (!text.includes("Math.cos(")) return [];
      return text.includes('from "@/lib/radar-geometry"')
        ? []
        : [relative(process.cwd(), file)];
    });

    expect(offenders).toEqual([]);
  });

  it("rounds every coordinate the study radar emits", () => {
    // The mismatch is in the last binary place, so the assertion is on the
    // DECIMAL LENGTH, not on a value — a value assertion passes on an
    // unrounded number that happens to be short.
    const points = ringPoints(80, TOTAL_AXES, 120, 120).split(" ");

    expect(points).toHaveLength(TOTAL_AXES);
    for (const point of points) {
      for (const coord of point.split(",")) {
        const decimals = coord.split(".")[1] ?? "";
        expect(decimals.length, `${coord} is not rounded`).toBeLessThanOrEqual(COORD_PLACES);
      }
    }
  });
});
