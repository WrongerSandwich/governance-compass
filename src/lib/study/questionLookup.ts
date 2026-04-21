import { forcedChoiceItems } from "@/data/forced-choice-items";
import { scaledItems } from "@/data/scaled-items";

export interface QuestionItem {
  id: string;
  kind: "fc" | "sc";
  text: string;
  axis: number; // 1..12
  options?: { A: string; B: string }; // fc only
  scale?: Array<{ choice: number; label: string }>; // sc only (Likert)
}

// Build a flat registry on module init, keyed by item id.
const registry = new Map<string, QuestionItem>();
const byAxis = new Map<number, QuestionItem[]>();

function register(item: QuestionItem) {
  registry.set(item.id, item);
  const existing = byAxis.get(item.axis) ?? [];
  existing.push(item);
  byAxis.set(item.axis, existing);
}

// Register forced-choice items
for (const fc of forcedChoiceItems) {
  register({
    id: fc.id,
    kind: "fc",
    text: fc.headlineA, // use headlineA as the primary text
    axis: fc.axisId,
    options: { A: fc.headlineA, B: fc.headlineB },
  });
}

// Register scaled items
for (const sc of scaledItems) {
  register({
    id: sc.id,
    kind: "sc",
    text: sc.questionStem,
    axis: sc.axisId,
    scale: [
      { choice: 1, label: sc.option1Label },
      { choice: 2, label: sc.option2Label },
      { choice: 3, label: sc.option3Label },
      { choice: 4, label: sc.option4Label },
      { choice: 5, label: sc.option5Label },
    ],
  });
}

export function getQuestion(id: string): QuestionItem | null {
  return registry.get(id) ?? null;
}

export function getQuestionsForAxis(axis: number): QuestionItem[] {
  return byAxis.get(axis) ?? [];
}
