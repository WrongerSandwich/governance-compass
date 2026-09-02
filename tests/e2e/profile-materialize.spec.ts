import { test, expect } from "@playwright/test";
import { forcedChoiceItems } from "@/data/forced-choice-items";
import { scaledItems } from "@/data/scaled-items";
import { MAX_PROFILES_PER_USER } from "@/lib/profile-limits";
import { encodeResponses } from "@/lib/response-codec";
import { setRawBudgetBits } from "../helpers/codec-bits";
import { materialize, signUp } from "./helpers";

/**
 * `POST /api/profile/materialize` is the only path from an encoded response
 * string into the database, and nothing in Postgres constrains what it writes.
 * These tests come at it the way an attacker would: a hand-edited payload, and
 * a loop that just keeps calling.
 */

const VALID = encodeResponses({
  forcedChoice: Object.fromEntries(forcedChoiceItems.map((item) => [item.id, "A" as const])),
  scaled: Object.fromEntries(scaledItems.map((item) => [item.id, 3 as const])),
  budget: { 1: 8, 2: 7, 3: 7, 4: 7, 5: 7, 6: 7, 7: 7 },
});

test.describe("Profile materialize", () => {
  test("rejects a payload whose budget breaks the quiz contract", async ({ browser }) => {
    const { context } = await signUp(browser, "budget");
    // Raw field 31 decodes to an allocation of 32 — above the per-ministry
    // maximum of 25, and only reachable by editing the URL by hand.
    const tampered = setRawBudgetBits(VALID, 1, 31);

    const response = await context.request.post("/api/profile/materialize", {
      data: { encoded: tampered },
    });

    expect(response.status()).toBe(400);
    await context.close();
  });

  test("stops creating profiles once the per-user cap is reached", async ({ browser }) => {
    const { context } = await signUp(browser, "cap");
    for (let i = 0; i < MAX_PROFILES_PER_USER; i++) {
      await materialize(context, VALID);
    }

    const response = await context.request.post("/api/profile/materialize", {
      data: { encoded: VALID },
    });

    expect(response.status()).toBe(429);
    await context.close();
  });
});
