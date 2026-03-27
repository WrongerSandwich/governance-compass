export interface QuestionInput {
  id: string;
  topicId: string;
  polarity: number;
}

export interface AnswerInput {
  questionId: string;
  value: number | null;
  skipped: boolean;
}

export interface TopicScoreResult {
  topicId: string;
  score: number;
  answeredCount: number;
  insufficientData: boolean;
}

const MIN_ANSWERS_PER_TOPIC = 2;

export function calculateTopicScore(
  topicId: string,
  answers: AnswerInput[],
  questions: QuestionInput[]
): TopicScoreResult {
  const topicQuestions = questions.filter((q) => q.topicId === topicId);
  const topicQuestionIds = new Set(topicQuestions.map((q) => q.id));
  const questionMap = new Map(topicQuestions.map((q) => [q.id, q]));

  const validAnswers = answers.filter(
    (a) => topicQuestionIds.has(a.questionId) && !a.skipped && a.value !== null
  );

  if (validAnswers.length < MIN_ANSWERS_PER_TOPIC) {
    return {
      topicId,
      score: 50,
      answeredCount: validAnswers.length,
      insufficientData: true,
    };
  }

  const directionalSum = validAnswers.reduce((acc, answer) => {
    const question = questionMap.get(answer.questionId)!;
    return acc + answer.value! * question.polarity;
  }, 0);

  const mean = directionalSum / validAnswers.length;
  // Positive mean = left-leaning, negative = right-leaning
  // Normalize: 0 = left (mean=+2), 100 = right (mean=-2)
  const score = ((2 - mean) / 4) * 100;

  return {
    topicId,
    score: Math.round(score * 100) / 100,
    answeredCount: validAnswers.length,
    insufficientData: false,
  };
}

export function calculateAllScores(
  answers: AnswerInput[],
  questions: QuestionInput[],
  topicIds: string[]
): TopicScoreResult[] {
  return topicIds.map((topicId) =>
    calculateTopicScore(topicId, answers, questions)
  );
}
