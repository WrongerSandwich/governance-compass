/**
 * `POST /api/profile/materialize` writes whatever `decodeResponses` hands it
 * straight into Postgres, where no constraint enforces the quiz's own contract.
 * `toProfileRows` is the gate: it re-checks every row against the same zod
 * schemas the rest of the app validates against before anything is persisted.
 */
import { describe, it, expect } from "vitest";
import { ZodError } from "zod";
import { toProfileRows } from "@/lib/validation";
import type { QuizResponses } from "@/lib/scoring-types";

function buildResponses(overrides: Partial<QuizResponses> = {}): QuizResponses {
  return {
    forcedChoice: { "fc-1-1": "A", "fc-1-2": "B" },
    scaled: { "sc-1-1": 4 },
    budget: { 1: 8, 2: 7, 3: 7, 4: 7, 5: 7, 6: 7, 7: 7 },
    ...overrides,
  };
}

describe("toProfileRows", () => {
  it("maps decoded responses into the rows materialize persists", () => {
    const rows = toProfileRows(buildResponses());

    expect(rows.forcedChoice).toEqual([
      { itemId: "fc-1-1", selectedPole: "A" },
      { itemId: "fc-1-2", selectedPole: "B" },
    ]);
    expect(rows.scaled).toEqual([{ itemId: "sc-1-1", value: 4 }]);
    expect(rows.budget).toHaveLength(7);
    expect(rows.budget[0]).toEqual({ ministryId: 1, amount: 8 });
  });

  it("rejects a budget amount above the per-ministry ceiling", () => {
    const responses = buildResponses();
    responses.budget[1] = 32;

    expect(() => toProfileRows(responses)).toThrow(ZodError);
  });

  it("rejects a ministry id outside the seeded range", () => {
    const responses = buildResponses();
    responses.budget[99] = 5;

    expect(() => toProfileRows(responses)).toThrow(ZodError);
  });

  it("rejects a scaled value outside the Likert range", () => {
    const responses = buildResponses();
    responses.scaled["sc-1-1"] = 9 as 1 | 2 | 3 | 4 | 5;

    expect(() => toProfileRows(responses)).toThrow(ZodError);
  });

  it("rejects a forced-choice pole that is neither A nor B", () => {
    const responses = buildResponses();
    responses.forcedChoice["fc-1-1"] = "C" as "A" | "B";

    expect(() => toProfileRows(responses)).toThrow(ZodError);
  });
});
