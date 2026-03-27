"use client";

import { useQuiz } from "./QuizProvider";

const LIKERT_OPTIONS = [
  { value: -2, label: "Strongly Disagree" },
  { value: -1, label: "Disagree" },
  { value: 0, label: "Neutral" },
  { value: 1, label: "Agree" },
  { value: 2, label: "Strongly Agree" },
];

interface QuestionCardProps {
  questionId: string;
  text: string;
  context: string | null;
}

export function QuestionCard({ questionId, text, context }: QuestionCardProps) {
  const { state, dispatch } = useQuiz();
  const currentAnswer = state.answers[questionId];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-lg font-medium text-gray-900">{text}</p>
      {context && (
        <p className="mt-1 text-sm text-gray-500 italic">{context}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {LIKERT_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() =>
              dispatch({
                type: "SET_ANSWER",
                questionId,
                value: option.value,
              })
            }
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              currentAnswer?.value === option.value && !currentAnswer.skipped
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => dispatch({ type: "SKIP_QUESTION", questionId })}
        className={`mt-3 text-sm ${
          currentAnswer?.skipped
            ? "text-amber-600 font-medium"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        {currentAnswer?.skipped ? "Skipped" : "Skip this question"}
      </button>
    </div>
  );
}
