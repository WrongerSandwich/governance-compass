import { describe, it, expect } from "vitest";
import { compareProfiles, type ComparisonResult } from "@/lib/comparison";
import { type TopicScoreResult } from "@/lib/scoring";

const makeScore = (
  topicId: string,
  score: number,
  insufficientData = false
): TopicScoreResult => ({
  topicId,
  score,
  answeredCount: insufficientData ? 1 : 5,
  insufficientData,
});

describe("compareProfiles", () => {
  it("returns 100% alignment for identical profiles", () => {
    const scoresA = [makeScore("t1", 50), makeScore("t2", 75)];
    const scoresB = [makeScore("t1", 50), makeScore("t2", 75)];
    const result = compareProfiles(scoresA, scoresB);
    expect(result.alignmentScore).toBe(100);
    expect(result.perTopicDeltas).toHaveLength(2);
    expect(result.perTopicDeltas.every((d) => d.delta === 0)).toBe(true);
  });

  it("returns 0% alignment for maximally divergent profiles", () => {
    const scoresA = [makeScore("t1", 0), makeScore("t2", 0)];
    const scoresB = [makeScore("t1", 100), makeScore("t2", 100)];
    const result = compareProfiles(scoresA, scoresB);
    expect(result.alignmentScore).toBe(0);
  });

  it("calculates correct per-topic deltas", () => {
    const scoresA = [makeScore("t1", 30), makeScore("t2", 80)];
    const scoresB = [makeScore("t1", 70), makeScore("t2", 60)];
    const result = compareProfiles(scoresA, scoresB);
    const t1Delta = result.perTopicDeltas.find((d) => d.topicId === "t1");
    expect(t1Delta?.delta).toBe(40);
    const t2Delta = result.perTopicDeltas.find((d) => d.topicId === "t2");
    expect(t2Delta?.delta).toBe(20);
  });

  it("identifies closest and furthest topics", () => {
    const scoresA = [
      makeScore("t1", 50),
      makeScore("t2", 30),
      makeScore("t3", 80),
    ];
    const scoresB = [
      makeScore("t1", 52), // delta 2 (closest)
      makeScore("t2", 80), // delta 50 (furthest)
      makeScore("t3", 60), // delta 20
    ];
    const result = compareProfiles(scoresA, scoresB);
    expect(result.closestTopics[0].topicId).toBe("t1");
    expect(result.furthestTopics[0].topicId).toBe("t2");
  });

  it("excludes hidden topics", () => {
    const scoresA = [makeScore("t1", 50), makeScore("t2", 50)];
    const scoresB = [makeScore("t1", 50), makeScore("t2", 100)];
    const hidden = new Set(["t2"]);
    const result = compareProfiles(scoresA, scoresB, hidden);
    expect(result.perTopicDeltas).toHaveLength(1);
    expect(result.alignmentScore).toBe(100); // only t1 compared, identical
  });

  it("excludes topics with insufficient data", () => {
    const scoresA = [makeScore("t1", 50), makeScore("t2", 50, true)];
    const scoresB = [makeScore("t1", 50), makeScore("t2", 100)];
    const result = compareProfiles(scoresA, scoresB);
    expect(result.perTopicDeltas).toHaveLength(1);
  });

  it("only compares topics present in both profiles", () => {
    const scoresA = [makeScore("t1", 50), makeScore("t2", 50)];
    const scoresB = [makeScore("t1", 75), makeScore("t3", 80)];
    const result = compareProfiles(scoresA, scoresB);
    expect(result.perTopicDeltas).toHaveLength(1);
    expect(result.perTopicDeltas[0].topicId).toBe("t1");
  });
});
