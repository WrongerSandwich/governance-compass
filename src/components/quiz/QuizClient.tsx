"use client";

import { useRouter } from "next/navigation";
import { QuizProvider, useQuiz } from "./QuizProvider";
import { TopicSection } from "./TopicSection";
import { ProgressBar } from "./ProgressBar";
import { ReviewScreen } from "./ReviewScreen";

interface Question {
  id: string;
  text: string;
  context: string | null;
  order: number;
}

interface Topic {
  id: string;
  name: string;
  description: string;
  questions: Question[];
}

function QuizInner({ topics }: { topics: Topic[] }) {
  const { state, dispatch } = useQuiz();
  const router = useRouter();

  const handleSubmit = async () => {
    dispatch({ type: "SUBMIT" });

    const answers = Object.entries(state.answers).map(([questionId, a]) => ({
      questionId,
      value: a.value,
      skipped: a.skipped,
    }));

    // Include unanswered questions as skipped
    const allQuestionIds = topics.flatMap((t) =>
      t.questions.map((q) => q.id)
    );
    const answeredIds = new Set(Object.keys(state.answers));
    const unanswered = allQuestionIds
      .filter((id) => !answeredIds.has(id))
      .map((id) => ({ questionId: id, value: null, skipped: true }));

    const token = localStorage.getItem("anonymousToken") || undefined;

    const res = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: [...answers, ...unanswered],
        anonymousToken: token,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("anonymousToken", data.anonymousToken);
      localStorage.setItem("profileId", data.profileId);
      router.push(`/results/${data.profileId}`);
    }
  };

  if (state.phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Discover Your Political Profile
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Answer questions across {topics.length} topics to build a detailed,
          multi-dimensional view of your political positions.
        </p>
        <p className="text-gray-500 mb-8">
          Takes about 15-20 minutes. You can skip questions you&apos;re unsure about.
        </p>
        <button
          onClick={() => dispatch({ type: "START_QUIZ" })}
          className="bg-indigo-600 text-white py-3 px-8 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Start Quiz
        </button>
      </div>
    );
  }

  if (state.phase === "review" || state.phase === "submitting") {
    return (
      <div className="max-w-2xl mx-auto py-8">
        {state.phase === "submitting" ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">Calculating your results...</p>
          </div>
        ) : (
          <ReviewScreen topics={topics} onSubmit={handleSubmit} />
        )}
      </div>
    );
  }

  const currentTopic = topics[state.currentTopicIndex];
  const isLastTopic = state.currentTopicIndex === topics.length - 1;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <ProgressBar
        currentIndex={state.currentTopicIndex}
        totalTopics={topics.length}
        topicNames={topics.map((t) => t.name)}
      />
      <TopicSection
        topicName={currentTopic.name}
        topicDescription={currentTopic.description}
        questions={currentTopic.questions}
      />
      <div className="flex justify-between mt-8">
        <button
          onClick={() => dispatch({ type: "PREV_TOPIC" })}
          disabled={state.currentTopicIndex === 0}
          className="px-6 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        {isLastTopic ? (
          <button
            onClick={() => dispatch({ type: "GO_TO_REVIEW" })}
            className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Review Answers
          </button>
        ) : (
          <button
            onClick={() => dispatch({ type: "NEXT_TOPIC" })}
            className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Next Topic
          </button>
        )}
      </div>
    </div>
  );
}

export function QuizClient({ topics }: { topics: Topic[] }) {
  return (
    <QuizProvider>
      <QuizInner topics={topics} />
    </QuizProvider>
  );
}
