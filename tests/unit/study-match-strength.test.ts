import { describe, it, expect } from "vitest";
import { bucketMatchStrength } from "@/lib/study/matchStrength";

describe("bucketMatchStrength", () => {
  it("returns 'strong' for distance < 1.0", () => {
    expect(bucketMatchStrength(0.0)).toBe("strong");
    expect(bucketMatchStrength(0.5)).toBe("strong");
    expect(bucketMatchStrength(0.99)).toBe("strong");
  });

  it("returns 'moderate' for distance 1.0–1.5 (exclusive)", () => {
    expect(bucketMatchStrength(1.0)).toBe("moderate");
    expect(bucketMatchStrength(1.1)).toBe("moderate");
    expect(bucketMatchStrength(1.49)).toBe("moderate");
  });

  it("returns 'close' for distance 1.5–2.0 (exclusive)", () => {
    expect(bucketMatchStrength(1.5)).toBe("close");
    expect(bucketMatchStrength(1.75)).toBe("close");
    expect(bucketMatchStrength(1.99)).toBe("close");
  });

  it("returns 'weak' for distance >= 2.0", () => {
    expect(bucketMatchStrength(2.0)).toBe("weak");
    expect(bucketMatchStrength(2.5)).toBe("weak");
    expect(bucketMatchStrength(10.0)).toBe("weak");
  });

  it("handles the exact boundary at 1.0", () => {
    expect(bucketMatchStrength(1.0)).toBe("moderate");
  });

  it("handles the exact boundary at 1.5", () => {
    expect(bucketMatchStrength(1.5)).toBe("close");
  });

  it("handles the exact boundary at 2.0", () => {
    expect(bucketMatchStrength(2.0)).toBe("weak");
  });
});
