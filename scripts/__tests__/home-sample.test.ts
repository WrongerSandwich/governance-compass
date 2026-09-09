import { describe, it, expect } from "vitest";
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
});
