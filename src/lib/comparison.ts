import { type TopicScoreResult } from "./scoring";

export interface TopicDelta {
  topicId: string;
  scoreA: number;
  scoreB: number;
  delta: number;
}

export interface ComparisonResult {
  alignmentScore: number;
  perTopicDeltas: TopicDelta[];
  closestTopics: TopicDelta[];
  furthestTopics: TopicDelta[];
}

export function compareProfiles(
  scoresA: TopicScoreResult[],
  scoresB: TopicScoreResult[],
  hiddenTopicIds: Set<string> = new Set()
): ComparisonResult {
  const mapA = new Map(
    scoresA.filter((s) => !s.insufficientData).map((s) => [s.topicId, s])
  );
  const mapB = new Map(
    scoresB.filter((s) => !s.insufficientData).map((s) => [s.topicId, s])
  );

  const commonTopicIds = [...mapA.keys()].filter(
    (id) => mapB.has(id) && !hiddenTopicIds.has(id)
  );

  const perTopicDeltas: TopicDelta[] = commonTopicIds.map((topicId) => ({
    topicId,
    scoreA: mapA.get(topicId)!.score,
    scoreB: mapB.get(topicId)!.score,
    delta:
      Math.round(
        Math.abs(mapA.get(topicId)!.score - mapB.get(topicId)!.score) * 100
      ) / 100,
  }));

  const sorted = [...perTopicDeltas].sort((a, b) => a.delta - b.delta);
  const meanDelta =
    perTopicDeltas.length > 0
      ? perTopicDeltas.reduce((sum, d) => sum + d.delta, 0) /
        perTopicDeltas.length
      : 0;

  const alignmentScore = Math.max(
    0,
    Math.min(100, Math.round(100 - meanDelta))
  );

  return {
    alignmentScore,
    perTopicDeltas,
    closestTopics: sorted.slice(0, 3),
    furthestTopics: sorted.slice(-3).reverse(),
  };
}
