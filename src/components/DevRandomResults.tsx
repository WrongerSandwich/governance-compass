"use client";

import { encodeResponses } from "@/lib/response-codec";
import { scaledItems } from "@/data/scaled-items";
import type { QuizResponses } from "@/lib/scoring-types";

function generateRandomResponses(): QuizResponses {
  const axisLean: number[] = [];
  for (let axis = 0; axis < 12; axis++) {
    axisLean.push(Math.random() * 2 - 1);
  }

  const forcedChoice: Record<string, "A" | "B"> = {};
  for (let axis = 1; axis <= 12; axis++) {
    const pA = (1 - axisLean[axis - 1]) / 2;
    for (let item = 1; item <= 3; item++) {
      forcedChoice[`fc-${axis}-${item}`] = Math.random() < pA ? "A" : "B";
    }
  }

  const scaled: Record<string, 1 | 2 | 3 | 4 | 5> = {};
  for (const item of scaledItems) {
    const center = 3 + axisLean[item.axisId - 1] * 2;
    const jittered = center + (Math.random() - 0.5);
    scaled[item.id] = Math.max(1, Math.min(5, Math.round(jittered))) as 1 | 2 | 3 | 4 | 5;
  }

  const budget: Record<number, number> = {};
  for (let m = 1; m <= 7; m++) budget[m] = 1;
  const favorites = new Set<number>();
  while (favorites.size < 2) favorites.add(Math.floor(Math.random() * 7) + 1);
  let remaining = 43;
  while (remaining > 0) {
    const pool = Math.random() < 0.7
      ? [...favorites]
      : Array.from({ length: 7 }, (_, i) => i + 1);
    const m = pool[Math.floor(Math.random() * pool.length)];
    if (budget[m] < 25) { budget[m]++; remaining--; }
  }

  return { forcedChoice, scaled, budget };
}

const btnClass = "rounded-[6px] border border-border-primary bg-surface-1 px-2.5 py-1 text-[10px] text-text-tertiary hover:text-text-secondary transition-colors duration-150";

export function DevRandomResults() {

  // TODO: re-enable this guard before launch
  // if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-1.5">
      <span className="text-[9px] uppercase tracking-[0.1em] text-text-tertiary opacity-50 font-medium">
        Testing
      </span>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => {
            const encoded = encodeResponses(generateRandomResponses());
            window.location.href = `/results?r=${encoded}`;
          }}
          className={btnClass}
        >
          Random results
        </button>
        <button
          type="button"
          onClick={() => {
            const a = encodeResponses(generateRandomResponses());
            const b = encodeResponses(generateRandomResponses());
            window.location.href = `/compare?a=${a}&b=${b}`;
          }}
          className={btnClass}
        >
          Random compare
        </button>
      </div>
    </div>
  );
}
