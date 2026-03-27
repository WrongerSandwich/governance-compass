"use client";

import { useQuiz } from "./QuizProvider";

const VALUE_LABELS = new Map<number, string>([
  [-2, "Strongly Disagree"],
  [-1, "Disagree"],
  [0, "Neutral"],
  [1, "Agree"],
  [2, "Strongly Agree"],
]);

interface Topic {
  id: string;
  name: string;
  questions: { id: string; text: string; order: number }[];
}

interface ReviewScreenProps {
  topics: Topic[];
  onSubmit: () => void;
}

export function ReviewScreen({ topics, onSubmit }: ReviewScreenProps) {
  const { state, dispatch } = useQuiz();

  const totalQuestions = topics.reduce(
    (sum, t) => sum + t.questions.length,
    0
  );
  const answeredCount = Object.values(state.answers).filter(
    (a) => !a.skipped && a.value !== null
  ).length;
  const skippedCount = Object.values(state.answers).filter(
    (a) => a.skipped
  ).length;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Review Your Answers
      </h2>
      <p className="text-gray-600 mb-6">
        {answeredCount} answered, {skippedCount} skipped,{" "}
        {totalQuestions - answeredCount - skippedCount} unanswered
      </p>

      {topics.map((topic, topicIndex) => (
        <div key={topic.id} className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">
              {topic.name}
            </h3>
            <button
              onClick={() =>
                dispatch({ type: "GO_TO_TOPIC", index: topicIndex })
              }
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Edit
            </button>
          </div>
          <div className="space-y-1">
            {topic.questions
              .sort((a, b) => a.order - b.order)
              .map((q) => {
                const answer = state.answers[q.id];
                const label = answer?.skipped
                  ? "Skipped"
                  : answer?.value !== undefined && answer?.value !== null
                    ? VALUE_LABELS.get(answer.value) ?? "Not answered"
                    : "Not answered";
                return (
                  <div
                    key={q.id}
                    className="flex justify-between text-sm py-1 border-b border-gray-100"
                  >
                    <span className="text-gray-700 truncate mr-4">
                      {q.text}
                    </span>
                    <span
                      className={`shrink-0 ${answer?.skipped ? "text-amber-600" : "text-gray-500"}`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      <button
        onClick={onSubmit}
        className="w-full mt-4 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
      >
        Submit &amp; See Results
      </button>
    </div>
  );
}
