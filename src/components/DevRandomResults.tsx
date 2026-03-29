"use client";

import { useRouter } from "next/navigation";
import { encodeResponses } from "@/lib/response-codec";
import type { QuizResponses } from "@/lib/scoring-types";

function generateRandomResponses(): QuizResponses {
  const forcedChoice: Record<string, "A" | "B"> = {};
  for (let axis = 1; axis <= 12; axis++) {
    for (let item = 1; item <= 3; item++) {
      forcedChoice[`fc-${axis}-${item}`] = Math.random() < 0.5 ? "A" : "B";
    }
  }

  const scaled: Record<string, 1 | 2 | 3 | 4 | 5> = {};
  for (let axis = 1; axis <= 12; axis++) {
    for (let item = 1; item <= 3; item++) {
      scaled[`sc-${axis}-${item}`] = (Math.floor(Math.random() * 5) + 1) as 1 | 2 | 3 | 4 | 5;
    }
  }

  // Budget: start at min (5 each = 50), distribute 50 remaining randomly
  const budget: Record<number, number> = {};
  for (let m = 1; m <= 10; m++) budget[m] = 5;
  let remaining = 50;
  while (remaining > 0) {
    const m = Math.floor(Math.random() * 10) + 1;
    budget[m]++;
    remaining--;
  }

  return { forcedChoice, scaled, budget };
}

export function DevRandomResults() {
  const router = useRouter();

  if (process.env.NODE_ENV === "production") return null;

  return (
    <button
      type="button"
      onClick={() => {
        const encoded = encodeResponses(generateRandomResponses());
        router.push(`/results?r=${encoded}`);
      }}
      className="fixed bottom-4 right-4 z-50 rounded-[8px] border border-border-primary bg-surface-1 px-3 py-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors duration-150"
    >
      Random results
    </button>
  );
}
