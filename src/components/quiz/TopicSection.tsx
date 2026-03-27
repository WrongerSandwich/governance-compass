"use client";

import { QuestionCard } from "./QuestionCard";

interface Question {
  id: string;
  text: string;
  context: string | null;
  order: number;
}

interface TopicSectionProps {
  topicName: string;
  topicDescription: string;
  questions: Question[];
}

export function TopicSection({
  topicName,
  topicDescription,
  questions,
}: TopicSectionProps) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{topicName}</h2>
        <p className="mt-1 text-gray-600">{topicDescription}</p>
      </div>
      <div className="space-y-4">
        {questions
          .sort((a, b) => a.order - b.order)
          .map((q) => (
            <QuestionCard
              key={q.id}
              questionId={q.id}
              text={q.text}
              context={q.context}
            />
          ))}
      </div>
    </div>
  );
}
