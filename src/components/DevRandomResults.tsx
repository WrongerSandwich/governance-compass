"use client";

import { useRouter } from "next/navigation";
import { encodeResponses } from "@/lib/response-codec";
import { scaledItems } from "@/data/scaled-items";
import type { QuizResponses } from "@/lib/scoring-types";

function generateRandomResponses(): QuizResponses {
  // Give each axis a random lean (-1 to +1) so answers cluster
  // like a real user rather than averaging to zero
  const axisLean: number[] = [];
  for (let axis = 0; axis < 12; axis++) {
    axisLean.push(Math.random() * 2 - 1); // uniform [-1, +1]
  }

  const forcedChoice: Record<string, "A" | "B"> = {};
  for (let axis = 1; axis <= 12; axis++) {
    const pA = (1 - axisLean[axis - 1]) / 2; // lean toward A when negative
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

  // Budget: pick 3-4 ministries to favor, give them more
  const budget: Record<number, number> = {};
  for (let m = 1; m <= 10; m++) budget[m] = 5;
  const favorites = new Set<number>();
  while (favorites.size < 3) favorites.add(Math.floor(Math.random() * 10) + 1);
  let remaining = 50;
  while (remaining > 0) {
    // 70% chance of adding to a favorite ministry
    const pool = Math.random() < 0.7
      ? [...favorites]
      : Array.from({ length: 10 }, (_, i) => i + 1);
    const m = pool[Math.floor(Math.random() * pool.length)];
    budget[m]++;
    remaining--;
  }

  return { forcedChoice, scaled, budget };
}

export function DevRandomResults() {
  const router = useRouter();

  // TODO: re-enable this guard before launch
  // if (process.env.NODE_ENV === "production") return null;

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
