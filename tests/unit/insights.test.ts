import { describe, it, expect } from "vitest";
import {
  generatePerTopicInsights,
  generateCrossTopicInsights,
  generateDivergenceInsights,
  generateInsights,
  type TopicMeta,
} from "@/lib/insights";
import { type TopicScoreResult } from "@/lib/scoring";

const makeTopic = (id: string, name: string): TopicMeta => ({
  id,
  name,
  spectrumLabelLeft: `${name} Left`,
  spectrumLabelRight: `${name} Right`,
  spectrumLabelCenter: `${name} Center`,
});

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

describe("generatePerTopicInsights", () => {
  it("generates a description for each scored topic", () => {
    const topics = [makeTopic("hc", "Healthcare")];
    const scores = [makeScore("hc", 15)];
    const insights = generatePerTopicInsights(scores, topics);
    expect(insights).toHaveLength(1);
    expect(insights[0].type).toBe("per-topic");
    expect(insights[0].title).toBe("Healthcare");
    expect(insights[0].description).toContain("strongly favor");
    expect(insights[0].description).toContain("healthcare left");
  });

  it("skips topics with insufficient data", () => {
    const topics = [makeTopic("hc", "Healthcare")];
    const scores = [makeScore("hc", 50, true)];
    const insights = generatePerTopicInsights(scores, topics);
    expect(insights).toHaveLength(0);
  });

  it("uses correct labels for different score ranges", () => {
    const topics = [makeTopic("t", "Test")];

    const strong_left = generatePerTopicInsights([makeScore("t", 10)], topics);
    expect(strong_left[0].description).toContain("strongly favor");

    const lean_left = generatePerTopicInsights([makeScore("t", 35)], topics);
    expect(lean_left[0].description).toContain("lean toward");

    const center = generatePerTopicInsights([makeScore("t", 50)], topics);
    expect(center[0].description).toContain("favor a");

    const lean_right = generatePerTopicInsights([makeScore("t", 70)], topics);
    expect(lean_right[0].description).toContain("lean toward");

    const strong_right = generatePerTopicInsights([makeScore("t", 90)], topics);
    expect(strong_right[0].description).toContain("strongly favor");
  });
});

describe("generateCrossTopicInsights", () => {
  it("detects social vs economic divergence", () => {
    const topics = [
      makeTopic("si", "Social Issues"),
      makeTopic("cj", "Criminal Justice"),
      makeTopic("ec", "Economic Policy"),
      makeTopic("hc", "Healthcare"),
    ];
    const scores = [
      makeScore("si", 20), // progressive social
      makeScore("cj", 15), // progressive social
      makeScore("ec", 75), // conservative economic
      makeScore("hc", 80), // conservative economic
    ];
    const insights = generateCrossTopicInsights(scores, topics);
    expect(insights.length).toBeGreaterThanOrEqual(1);
    expect(insights[0].type).toBe("cross-topic");
    expect(insights[0].description).toContain("progressive");
    expect(insights[0].description).toContain("conservative");
  });

  it("returns empty when no significant divergence", () => {
    const topics = [
      makeTopic("si", "Social Issues"),
      makeTopic("cj", "Criminal Justice"),
      makeTopic("ec", "Economic Policy"),
      makeTopic("hc", "Healthcare"),
    ];
    const scores = [
      makeScore("si", 50),
      makeScore("cj", 50),
      makeScore("ec", 50),
      makeScore("hc", 50),
    ];
    const insights = generateCrossTopicInsights(scores, topics);
    expect(insights).toHaveLength(0);
  });
});

describe("generateDivergenceInsights", () => {
  it("flags topics that stand out from the overall profile", () => {
    const topics = [
      makeTopic("a", "Topic A"),
      makeTopic("b", "Topic B"),
      makeTopic("c", "Topic C"),
      makeTopic("d", "Topic D"),
    ];
    const scores = [
      makeScore("a", 50),
      makeScore("b", 50),
      makeScore("c", 50),
      makeScore("d", 95), // outlier
    ];
    const insights = generateDivergenceInsights(scores, topics);
    expect(insights.length).toBeGreaterThanOrEqual(1);
    expect(insights[0].type).toBe("divergence");
    expect(insights[0].relatedTopics).toContain("d");
  });

  it("returns empty with fewer than 3 scored topics", () => {
    const topics = [makeTopic("a", "A"), makeTopic("b", "B")];
    const scores = [makeScore("a", 10), makeScore("b", 90)];
    const insights = generateDivergenceInsights(scores, topics);
    expect(insights).toHaveLength(0);
  });
});

describe("generateInsights", () => {
  it("combines all insight types", () => {
    const topics = [
      makeTopic("si", "Social Issues"),
      makeTopic("cj", "Criminal Justice"),
      makeTopic("ec", "Economic Policy"),
      makeTopic("hc", "Healthcare"),
    ];
    const scores = [
      makeScore("si", 15),
      makeScore("cj", 10),
      makeScore("ec", 80),
      makeScore("hc", 85),
    ];
    const insights = generateInsights(scores, topics);
    const types = new Set(insights.map((i) => i.type));
    expect(types.has("per-topic")).toBe(true);
    expect(types.has("cross-topic")).toBe(true);
  });
});
