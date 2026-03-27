// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  calculateTopicScore,
  calculateAllScores,
  type QuestionInput,
  type AnswerInput,
} from "@/lib/scoring";

const makeQuestion = (
  id: string,
  topicId: string,
  polarity: number = 1
): QuestionInput => ({ id, topicId, polarity });

const makeAnswer = (
  questionId: string,
  value: number | null,
  skipped = false
): AnswerInput => ({ questionId, value, skipped });

describe("calculateTopicScore", () => {
  const topicId = "healthcare";
  const questions = [
    makeQuestion("q1", topicId, 1),
    makeQuestion("q2", topicId, -1),
    makeQuestion("q3", topicId, 1),
  ];

  it("returns 50 (center) when all answers are neutral", () => {
    const answers = [
      makeAnswer("q1", 0),
      makeAnswer("q2", 0),
      makeAnswer("q3", 0),
    ];
    const result = calculateTopicScore(topicId, answers, questions);
    expect(result.score).toBe(50);
    expect(result.insufficientData).toBe(false);
    expect(result.answeredCount).toBe(3);
  });

  it("returns 0 (left endpoint) when fully aligned with left spectrum", () => {
    // polarity 1: "Strongly Agree" aligns with the LEFT endpoint
    // directional = value * polarity = 2 * 1 = 2 (positive = left)
    // score = (2 - mean) / 4 * 100 = (2 - 2) / 4 * 100 = 0
    const questionsAllPos = [
      makeQuestion("q1", topicId, 1),
      makeQuestion("q2", topicId, 1),
      makeQuestion("q3", topicId, 1),
    ];
    const answers = [
      makeAnswer("q1", 2),
      makeAnswer("q2", 2),
      makeAnswer("q3", 2),
    ];
    const result = calculateTopicScore(topicId, answers, questionsAllPos);
    expect(result.score).toBe(0);
    expect(result.insufficientData).toBe(false);
  });

  it("returns 100 (right endpoint) when fully aligned with right spectrum", () => {
    // polarity 1, all strongly disagree (-2) → directional mean = -2
    // score = (2 - (-2)) / 4 * 100 = 100 (right)
    const questionsAllPos = [
      makeQuestion("q1", topicId, 1),
      makeQuestion("q2", topicId, 1),
      makeQuestion("q3", topicId, 1),
    ];
    const answers = [
      makeAnswer("q1", -2),
      makeAnswer("q2", -2),
      makeAnswer("q3", -2),
    ];
    const result = calculateTopicScore(topicId, answers, questionsAllPos);
    expect(result.score).toBe(100);
  });

  it("handles mixed polarity correctly", () => {
    // q1 polarity 1, agree(+2): directional = 2 (left-leaning)
    // q2 polarity -1, agree(+2): directional = -2 (right-leaning)
    // mean = (2 + -2) / 2 = 0
    // score = (2-0)/4*100 = 50
    const mixedQuestions = [
      makeQuestion("q1", topicId, 1),
      makeQuestion("q2", topicId, -1),
    ];
    const answers = [makeAnswer("q1", 2), makeAnswer("q2", 2)];
    const result = calculateTopicScore(topicId, answers, mixedQuestions);
    expect(result.score).toBe(50);
  });

  it("excludes skipped answers from calculation", () => {
    const answers = [
      makeAnswer("q1", 2),
      makeAnswer("q2", null, true), // skipped
      makeAnswer("q3", 2),
    ];
    const questionsAllPos = [
      makeQuestion("q1", topicId, 1),
      makeQuestion("q2", topicId, 1),
      makeQuestion("q3", topicId, 1),
    ];
    const result = calculateTopicScore(topicId, answers, questionsAllPos);
    expect(result.answeredCount).toBe(2);
    expect(result.score).toBe(0); // both answered strongly agree with polarity 1 → left
  });

  it("marks insufficient data when fewer than 2 answers", () => {
    const answers = [makeAnswer("q1", 2)];
    const result = calculateTopicScore(topicId, answers, questions);
    expect(result.insufficientData).toBe(true);
    expect(result.score).toBe(50); // default center
    expect(result.answeredCount).toBe(1);
  });

  it("ignores answers for questions in other topics", () => {
    const otherQuestion = makeQuestion("other-q", "other-topic", 1);
    const answers = [
      makeAnswer("q1", 2),
      makeAnswer("q2", 2),
      makeAnswer("other-q", -2), // different topic, should be ignored
    ];
    const allQuestions = [...questions, otherQuestion];
    const result = calculateTopicScore(topicId, answers, allQuestions);
    expect(result.answeredCount).toBe(2);
  });
});

describe("calculateAllScores", () => {
  it("returns scores for all requested topics", () => {
    const questions = [
      makeQuestion("q1", "topic-a", 1),
      makeQuestion("q2", "topic-a", 1),
      makeQuestion("q3", "topic-b", 1),
      makeQuestion("q4", "topic-b", 1),
    ];
    const answers = [
      makeAnswer("q1", 1),
      makeAnswer("q2", 1),
      makeAnswer("q3", -1),
      makeAnswer("q4", -1),
    ];
    const results = calculateAllScores(answers, questions, [
      "topic-a",
      "topic-b",
    ]);
    expect(results).toHaveLength(2);
    expect(results[0].topicId).toBe("topic-a");
    expect(results[1].topicId).toBe("topic-b");
    // topic-a: mean directional = (1+1)/2 = 1, score = (2-1)/4*100 = 25
    expect(results[0].score).toBe(25);
    // topic-b: mean directional = (-1+-1)/2 = -1, score = (2-(-1))/4*100 = 75
    expect(results[1].score).toBe(75);
  });
});
