import { describe, it, expect } from "vitest";
import { topics } from "@/data/topics";
import { questions } from "@/data/questions";

describe("data integrity", () => {
  it("every question references a valid topic", () => {
    const topicIds = new Set(topics.map((t) => t.id));
    for (const q of questions) {
      expect(topicIds.has(q.topicId)).toBe(true);
    }
  });

  it("every topic has 5-8 questions", () => {
    for (const topic of topics) {
      const count = questions.filter((q) => q.topicId === topic.id).length;
      expect(count).toBeGreaterThanOrEqual(5);
      expect(count).toBeLessThanOrEqual(8);
    }
  });

  it("question polarity is 1 or -1", () => {
    for (const q of questions) {
      expect([1, -1]).toContain(q.polarity);
    }
  });

  it("topic order values are unique", () => {
    const orders = topics.map((t) => t.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("question order values are unique within each topic", () => {
    for (const topic of topics) {
      const orders = questions
        .filter((q) => q.topicId === topic.id)
        .map((q) => q.order);
      expect(new Set(orders).size).toBe(orders.length);
    }
  });

  it("all spectrum labels are non-empty", () => {
    for (const topic of topics) {
      expect(topic.spectrumLabelLeft.length).toBeGreaterThan(0);
      expect(topic.spectrumLabelRight.length).toBeGreaterThan(0);
      expect(topic.spectrumLabelCenter.length).toBeGreaterThan(0);
    }
  });
});
