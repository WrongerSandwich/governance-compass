import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { selectHomeSamplePair, type SamplePersona } from "../lib/home-sample";

function persona(id: string, scores: number[], archetype: string): SamplePersona {
  return { id, averaged_axis_scores: scores, nearest_archetype_id: archetype, n_models: 2 };
}

const flat = (v: number) => new Array(12).fill(v);

describe("selectHomeSamplePair", () => {
  it("rejects personas scored by only one model", () => {
    const a = { ...persona("A", flat(0), "x"), n_models: 1 };
    const b = persona("B", flat(0.9), "y");

    expect(() => selectHomeSamplePair([a, b])).toThrow(/no qualifying pair/i);
  });

  it("rejects a pair sharing an archetype", () => {
    const scores = flat(0);
    const other = [...scores];
    for (const i of [0, 1, 2]) other[i] = 0.9;

    expect(() =>
      selectHomeSamplePair([persona("A", scores, "same"), persona("B", other, "same")]),
    ).toThrow(/no qualifying pair/i);
  });

  it("requires at least three strongly divergent and four closely agreeing axes", () => {
    const a = flat(0);
    const onlyTwoDiverge = [...a];
    onlyTwoDiverge[0] = 0.9;
    onlyTwoDiverge[1] = 0.9;

    expect(() =>
      selectHomeSamplePair([persona("A", a, "x"), persona("B", onlyTwoDiverge, "y")]),
    ).toThrow(/no qualifying pair/i);
  });

  // A pair can clear the divergence bar and still be the wrong illustration:
  // if the rest of the axes only half-agree, the two respondents read as
  // generally opposed rather than as "mostly aligned, apart from these three".
  it("rejects a pair that diverges enough but agrees closely on too few axes", () => {
    const a = flat(0);
    const b = [...a];
    for (const i of [0, 1, 2]) b[i] = 0.9; // three strong divergences
    for (const i of [3, 4, 5, 6, 7, 8]) b[i] = 0.4; // neither strong nor close
    // leaves only axes 10-12 agreeing within CLOSE, one short of the minimum

    expect(() =>
      selectHomeSamplePair([persona("A", a, "x"), persona("B", b, "y")]),
    ).toThrow(/no qualifying pair/i);
  });

  it("does not count a moderate gap as a strong divergence", () => {
    const a = flat(0);
    const b = [...a];
    for (const i of [0, 1, 2]) b[i] = 0.6; // wide, but below the strong bar

    expect(() =>
      selectHomeSamplePair([persona("A", a, "x"), persona("B", b, "y")]),
    ).toThrow(/no qualifying pair/i);
  });

  it("picks the closest qualifying pair, and orders the ids stably", () => {
    const base = flat(0);
    const near = [...base];
    for (const i of [0, 1, 2]) near[i] = 0.85;
    const far = [...base];
    for (const i of [0, 1, 2, 3]) far[i] = 1;

    const pair = selectHomeSamplePair([
      persona("P0002", far, "c"),
      persona("P0001", base, "a"),
      persona("P0003", near, "b"),
    ]);

    // closest qualifying, and A is the lower id regardless of input order
    expect([pair.a.id, pair.b.id]).toEqual(["P0001", "P0003"]);
    expect(pair.divergentAxisIds).toEqual([1, 2, 3]);
  });

  it("reports divergent axes as 1-based ids, widest gap first", () => {
    const a = flat(0);
    const b = [...a];
    b[4] = 0.85;
    b[9] = 0.95;
    b[2] = 0.9;

    const pair = selectHomeSamplePair([persona("A", a, "x"), persona("B", b, "y")]);

    expect(pair.divergentAxisIds).toEqual([10, 3, 5]);
  });

  // The four constants are the whole editorial judgement encoded in this
  // selector, so pin them at their exact boundaries rather than somewhere in
  // the middle of the band — a bar of 0.79 or 0.81 must fail these.
  it("verifies the STRONG boundary precisely: >= 0.8 diverges, 0.79 does not", () => {
    const a = flat(0);
    const atBar = [...a];
    for (const i of [0, 1, 2]) atBar[i] = 0.8; // exactly STRONG
    const belowBar = [...a];
    for (const i of [0, 1, 2]) belowBar[i] = 0.79; // a hair under

    const pair = selectHomeSamplePair([
      persona("A", a, "x"),
      persona("B", atBar, "y"),
    ]);
    expect(pair.divergentAxisIds).toEqual([1, 2, 3]);

    expect(() =>
      selectHomeSamplePair([persona("A", a, "x"), persona("B", belowBar, "y")]),
    ).toThrow(/no qualifying pair/i);
  });

  it("verifies the CLOSE boundary precisely: <= 0.15 agrees, 0.16 does not", () => {
    const a = flat(0);
    const withBarGaps = [...a];
    for (const i of [0, 1, 2]) withBarGaps[i] = 0.9; // three strong divergences
    for (const i of [3, 4, 5, 6]) withBarGaps[i] = 0.15; // exactly CLOSE, four of them
    for (const i of [7, 8, 9, 10, 11]) withBarGaps[i] = 0.4; // neither strong nor close

    const pair = selectHomeSamplePair([
      persona("A", a, "x"),
      persona("B", withBarGaps, "y"),
    ]);
    expect(pair.divergentAxisIds).toEqual([1, 2, 3]);

    // Nudge those same four gaps just past the bar and the pair no longer
    // agrees closely on enough axes.
    const pastBar = [...withBarGaps];
    for (const i of [3, 4, 5, 6]) pastBar[i] = 0.16;

    expect(() =>
      selectHomeSamplePair([persona("A", a, "x"), persona("B", pastBar, "y")]),
    ).toThrow(/no qualifying pair/i);
  });

  it("accepts exactly four closely agreeing axes, and rejects three", () => {
    const a = flat(0);
    const fourClose = [...a];
    for (const i of [0, 1, 2]) fourClose[i] = 0.9; // strong
    for (const i of [3, 4, 5, 6]) fourClose[i] = 0; // close — exactly MIN_CLOSE_AXES
    for (const i of [7, 8, 9, 10, 11]) fourClose[i] = 0.4; // neither

    expect(
      selectHomeSamplePair([persona("A", a, "x"), persona("B", fourClose, "y")])
        .divergentAxisIds,
    ).toEqual([1, 2, 3]);

    const threeClose = [...fourClose];
    threeClose[6] = 0.4; // one fewer close axis

    expect(() =>
      selectHomeSamplePair([persona("A", a, "x"), persona("B", threeClose, "y")]),
    ).toThrow(/no qualifying pair/i);
  });

  it("reports distance as the Euclidean norm of the gap vector", () => {
    const a = flat(0);
    const b = [...a];
    for (const i of [0, 1, 2]) b[i] = 0.85;

    const pair = selectHomeSamplePair([persona("A", a, "x"), persona("B", b, "y")]);

    // sqrt(3 * 0.85^2), not the squared distance — ranking is blind to the
    // difference, but the number is written into a committed artifact.
    expect(pair.distance).toBeCloseTo(Math.sqrt(3) * 0.85, 10);
    expect(pair.distance).toBeCloseTo(1.4722431864335457, 10);
  });
});

// The emitted artifact is committed to git and regenerated by `prebuild` on
// every CI build, so a selector change or a data regen silently rewrites what
// the home page renders. These assertions are the permanent version of the
// plan's one-time "stop if the pair is not P0252/P0420" eyeball.
describe("home_sample_pair.json (committed artifact)", () => {
  const artifactPath = path.join(
    process.cwd(),
    "public/study/derived/home_sample_pair.json",
  );

  type Respondent = {
    persona_id: string;
    archetype_id: string;
    axis_scores: number[];
  };
  type Artifact = {
    respondent_a: Respondent;
    respondent_b: Respondent;
    distance: number;
    divergent_axis_ids: number[];
    tension_axis_id: number;
  };

  const artifact = JSON.parse(
    fs.readFileSync(artifactPath, "utf8"),
  ) as Artifact;

  const gaps = artifact.respondent_a.axis_scores.map((score, i) =>
    Math.abs(score - artifact.respondent_b.axis_scores[i]),
  );

  it("pins the selected pair to P0252 / P0420", () => {
    expect(artifact.respondent_a.persona_id).toBe("P0252");
    expect(artifact.respondent_b.persona_id).toBe("P0420");
  });

  it("pairs two different archetypes", () => {
    expect(artifact.respondent_a.archetype_id).toBe("radical-egalitarian");
    expect(artifact.respondent_b.archetype_id).toBe("popular-egalitarian");
    expect(artifact.respondent_a.archetype_id).not.toBe(
      artifact.respondent_b.archetype_id,
    );
  });

  it("carries one score per axis for both respondents", () => {
    expect(artifact.respondent_a.axis_scores).toHaveLength(12);
    expect(artifact.respondent_b.axis_scores).toHaveLength(12);
  });

  it("pins the divergent axes and the tension axis", () => {
    expect(artifact.divergent_axis_ids).toEqual([6, 10, 3]);
    expect(artifact.tension_axis_id).toBeGreaterThanOrEqual(1);
    expect(artifact.tension_axis_id).toBeLessThanOrEqual(12);
    expect(artifact.tension_axis_id).toBe(12);
  });

  it("pins the distance", () => {
    expect(artifact.distance).toBeCloseTo(1.6879038812977474, 10);
  });

  // Everything above restates what the file says. These derive the claim from
  // the file's own scores instead, so an internally inconsistent artifact —
  // divergent_axis_ids or distance that the axis_scores do not support — fails
  // loudly rather than passing as a snapshot of itself.
  it("derives the same divergence claim from its own axis scores", () => {
    const strong = gaps
      .map((gap, index) => ({ gap, id: index + 1 }))
      .filter((entry) => entry.gap >= 0.8)
      .sort((x, y) => y.gap - x.gap || x.id - y.id);

    expect(strong).toHaveLength(3);
    expect(strong.map((entry) => entry.id)).toEqual(
      artifact.divergent_axis_ids,
    );
    expect(strong.map((entry) => entry.id)).toEqual([6, 10, 3]);
    expect(gaps.filter((gap) => gap <= 0.15).length).toBeGreaterThanOrEqual(4);
  });

  it("derives the same distance from its own axis scores", () => {
    const norm = Math.sqrt(gaps.reduce((sum, gap) => sum + gap * gap, 0));
    expect(norm).toBeCloseTo(artifact.distance, 12);
  });
});
