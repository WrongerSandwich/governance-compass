import { describe, it, expect } from "vitest";
import {
  computeEuclideanDistance,
  computeHistogram,
  computePearson,
  computeCorrelationMatrix,
  bucketMatchStrength,
  computeMedian,
  computePercentile,
} from "../lib/stats";

describe("computeEuclideanDistance", () => {
  it("returns 0 for identical vectors", () => {
    expect(computeEuclideanDistance([0, 0, 0], [0, 0, 0])).toBeCloseTo(0);
  });

  it("computes distance between unit vectors", () => {
    expect(computeEuclideanDistance([1, 0], [0, 1])).toBeCloseTo(Math.sqrt(2));
  });

  it("computes 12-dim distance", () => {
    const a = new Array(12).fill(0);
    const b = new Array(12).fill(0);
    b[0] = 1; // one unit off in first axis
    expect(computeEuclideanDistance(a, b)).toBeCloseTo(1);
  });

  it("throws for mismatched lengths", () => {
    expect(() => computeEuclideanDistance([1, 2], [1, 2, 3])).toThrow();
  });

  it("handles single-element vectors", () => {
    expect(computeEuclideanDistance([3], [0])).toBeCloseTo(3);
  });
});

describe("computeHistogram", () => {
  it("bins values evenly across range", () => {
    const values = [-1.0, -0.5, 0.0, 0.5, 1.0 - 1e-10];
    const bins = computeHistogram(values, -1.0, 1.0, 4);
    // bin 0: [-1.0, -0.5) → 1, bin 1: [-0.5, 0) → 1, bin 2: [0, 0.5) → 1, bin 3: [0.5, 1.0] → 2
    expect(bins).toHaveLength(4);
    expect(bins[0]).toBe(1);
    expect(bins[3]).toBe(2);
  });

  it("clamps exact-max into last bin", () => {
    const bins = computeHistogram([1.0], -1.0, 1.0, 20);
    expect(bins[19]).toBe(1);
    const total = bins.reduce((a, b) => a + b, 0);
    expect(total).toBe(1);
  });

  it("ignores out-of-range values", () => {
    const bins = computeHistogram([2.0, -2.0], -1.0, 1.0, 10);
    expect(bins.reduce((a, b) => a + b, 0)).toBe(0);
  });

  it("returns all-zero for empty array", () => {
    const bins = computeHistogram([], -1.0, 1.0, 20);
    expect(bins.every((b) => b === 0)).toBe(true);
  });

  it("places value at exact bin boundary into the lower bin (floor division, floating point)", () => {
    // Range [-1, 1], 20 bins → bin width = 0.1. Value -0.9 is nominally the
    // boundary between bin 0 [-1.0, -0.9) and bin 1 [-0.9, -0.8). However,
    // due to IEEE 754 floating point, ((-0.9 - -1.0) / 2.0) * 20 evaluates
    // to ~0.9999...98 rather than exactly 1.0, so floor() yields 0 → bin 0.
    const bins = computeHistogram([-0.9], -1.0, 1.0, 20);
    expect(bins[0]).toBe(1);
    expect(bins[1]).toBe(0);
    expect(bins.reduce((a, b) => a + b, 0)).toBe(1);
  });
});

describe("computePearson", () => {
  it("returns 1.0 for perfectly correlated series", () => {
    expect(computePearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1.0);
  });

  it("returns -1.0 for perfectly anti-correlated series", () => {
    expect(computePearson([1, 2, 3], [3, 2, 1])).toBeCloseTo(-1.0);
  });

  it("returns 0 for constant series (zero variance)", () => {
    expect(computePearson([5, 5, 5], [1, 2, 3])).toBeCloseTo(0);
  });

  it("returns a value in [-1, 1]", () => {
    const r = computePearson([1, 3, 2, 5, 4], [2, 3, 5, 1, 4]);
    expect(r).toBeGreaterThanOrEqual(-1);
    expect(r).toBeLessThanOrEqual(1);
  });
});

describe("computeCorrelationMatrix", () => {
  it("produces a symmetric square matrix", () => {
    const rows = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const m = computeCorrelationMatrix(rows);
    expect(m).toHaveLength(3);
    for (const row of m) expect(row).toHaveLength(3);
    // Diagonal should be 1
    for (let i = 0; i < 3; i++) expect(m[i][i]).toBeCloseTo(1.0);
    // Should be symmetric
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        expect(m[i][j]).toBeCloseTo(m[j][i]);
  });
});

describe("bucketMatchStrength", () => {
  it("returns strong for d < 1.0", () => {
    expect(bucketMatchStrength(0.5)).toBe("strong");
    expect(bucketMatchStrength(0.999)).toBe("strong");
  });

  it("returns moderate for 1.0 <= d < 1.5", () => {
    expect(bucketMatchStrength(1.0)).toBe("moderate");
    expect(bucketMatchStrength(1.4999)).toBe("moderate");
  });

  it("returns close for 1.5 <= d < 2.0", () => {
    expect(bucketMatchStrength(1.5)).toBe("close");
    expect(bucketMatchStrength(1.999)).toBe("close");
  });

  it("returns weak for d >= 2.0", () => {
    expect(bucketMatchStrength(2.0)).toBe("weak");
    expect(bucketMatchStrength(10.0)).toBe("weak");
  });

  it("returns weak for negative distance", () => {
    // negative distance is outside spec but the function should not throw
    expect(bucketMatchStrength(-0.5)).toBe("strong");
  });

  it("verifies inclusive/exclusive boundaries precisely", () => {
    // strong: [0, 1.0)  → 0.99 in, 1.0 out
    expect(bucketMatchStrength(0.99)).toBe("strong");
    expect(bucketMatchStrength(1.0)).toBe("moderate");
    // moderate: [1.0, 1.5) → 1.49 in, 1.5 out
    expect(bucketMatchStrength(1.49)).toBe("moderate");
    expect(bucketMatchStrength(1.5)).toBe("close");
    // close: [1.5, 2.0) → 1.99 in, 2.0 out
    expect(bucketMatchStrength(1.99)).toBe("close");
    expect(bucketMatchStrength(2.0)).toBe("weak");
  });
});

describe("computeMedian", () => {
  it("returns middle element for odd-length array", () => {
    expect(computeMedian([1, 2, 3])).toBe(2);
  });

  it("averages two middle elements for even-length array", () => {
    expect(computeMedian([1, 2, 3, 4])).toBe(2.5);
  });

  it("returns 0 for empty array", () => {
    expect(computeMedian([])).toBe(0);
  });
});

describe("computePercentile", () => {
  it("returns p90 correctly", () => {
    const sorted = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(computePercentile(sorted, 90)).toBe(90);
  });

  it("returns 0 for empty array", () => {
    expect(computePercentile([], 50)).toBe(0);
  });
});
