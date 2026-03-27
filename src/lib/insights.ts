import { type TopicScoreResult } from "./scoring";

export interface TopicMeta {
  id: string;
  name: string;
  spectrumLabelLeft: string;
  spectrumLabelRight: string;
  spectrumLabelCenter: string;
}

export interface Insight {
  type: "per-topic" | "cross-topic" | "divergence";
  title: string;
  description: string;
  relatedTopics: string[];
}

function getScoreLabel(
  score: number,
  left: string,
  center: string,
  right: string
): string {
  if (score <= 20) return `strongly favor ${left.toLowerCase()}`;
  if (score <= 40) return `lean toward ${left.toLowerCase()}`;
  if (score <= 60) return `favor a ${center.toLowerCase()}`;
  if (score <= 80) return `lean toward ${right.toLowerCase()}`;
  return `strongly favor ${right.toLowerCase()}`;
}

export function generatePerTopicInsights(
  scores: TopicScoreResult[],
  topics: TopicMeta[]
): Insight[] {
  const topicMap = new Map(topics.map((t) => [t.id, t]));

  return scores
    .filter((s) => !s.insufficientData)
    .map((score) => {
      const topic = topicMap.get(score.topicId)!;
      const label = getScoreLabel(
        score.score,
        topic.spectrumLabelLeft,
        topic.spectrumLabelCenter,
        topic.spectrumLabelRight
      );
      return {
        type: "per-topic" as const,
        title: topic.name,
        description: `You ${label}.`,
        relatedTopics: [score.topicId],
      };
    });
}

const SOCIAL_TOPIC_NAMES = ["Social Issues", "Criminal Justice", "Immigration"];
const ECONOMIC_TOPIC_NAMES = [
  "Economic Policy",
  "Healthcare",
  "Housing & Urban Policy",
];

export function generateCrossTopicInsights(
  scores: TopicScoreResult[],
  topics: TopicMeta[]
): Insight[] {
  const insights: Insight[] = [];
  const scoreMap = new Map(
    scores.filter((s) => !s.insufficientData).map((s) => [s.topicId, s])
  );

  const socialScores = topics
    .filter((t) => SOCIAL_TOPIC_NAMES.includes(t.name))
    .map((t) => scoreMap.get(t.id))
    .filter((s): s is TopicScoreResult => s !== undefined);

  const economicScores = topics
    .filter((t) => ECONOMIC_TOPIC_NAMES.includes(t.name))
    .map((t) => scoreMap.get(t.id))
    .filter((s): s is TopicScoreResult => s !== undefined);

  if (socialScores.length >= 2 && economicScores.length >= 2) {
    const socialAvg =
      socialScores.reduce((a, s) => a + s.score, 0) / socialScores.length;
    const econAvg =
      economicScores.reduce((a, s) => a + s.score, 0) / economicScores.length;

    if (Math.abs(socialAvg - econAvg) > 25) {
      const socialLabel =
        socialAvg <= 40
          ? "progressive"
          : socialAvg >= 60
            ? "conservative"
            : "moderate";
      const econLabel =
        econAvg <= 40
          ? "progressive"
          : econAvg >= 60
            ? "conservative"
            : "moderate";

      insights.push({
        type: "cross-topic",
        title: "Social vs. Economic Views",
        description: `Your social and economic positions diverge — you're ${socialLabel} on social issues but ${econLabel} on economic policy.`,
        relatedTopics: [...socialScores, ...economicScores].map(
          (s) => s.topicId
        ),
      });
    }
  }

  return insights;
}

export function generateDivergenceInsights(
  scores: TopicScoreResult[],
  topics: TopicMeta[]
): Insight[] {
  const validScores = scores.filter((s) => !s.insufficientData);
  if (validScores.length < 3) return [];

  const topicMap = new Map(topics.map((t) => [t.id, t]));
  const avg =
    validScores.reduce((a, s) => a + s.score, 0) / validScores.length;

  const outliers = validScores
    .filter((s) => Math.abs(s.score - avg) > 30)
    .sort((a, b) => Math.abs(b.score - avg) - Math.abs(a.score - avg));

  return outliers.slice(0, 2).map((score) => {
    const topic = topicMap.get(score.topicId)!;
    const direction =
      score.score < avg ? "more progressive" : "more conservative";
    return {
      type: "divergence" as const,
      title: `${topic.name} Stands Out`,
      description: `Your position on ${topic.name.toLowerCase()} is notably ${direction} than your overall profile.`,
      relatedTopics: [score.topicId],
    };
  });
}

export function generateInsights(
  scores: TopicScoreResult[],
  topics: TopicMeta[]
): Insight[] {
  return [
    ...generatePerTopicInsights(scores, topics),
    ...generateCrossTopicInsights(scores, topics),
    ...generateDivergenceInsights(scores, topics),
  ];
}
