# Governance Compass Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing topic-based quiz with The Governance Compass — a 12-axis, 3-modality political belief system assessment with forced-choice dilemmas, calibrated scales, a budget allocation simulator, and a 4-layer results display with archetype matching.

**Architecture:** Same Next.js full-stack app. New Prisma schema replaces Topic/Question/Answer/TopicScore with Axis/Item/Response/AxisScore models. Scoring engine is a 6-stage pipeline of pure functions. Quiz UI has 3 distinct phases. Results are 4 layers (compass plot, archetype card, radar chart, axis breakdown). Comparison and group features updated for -1.0 to +1.0 scoring.

**Tech Stack:** Same as v1 — Next.js 16, TypeScript, PostgreSQL, Prisma, NextAuth v5, Tailwind CSS, Recharts

**Specs:** All detailed specs live in `docs/system_proposal/`:
- `political_quiz_proposal.md` — Design philosophy, dimensional architecture, question design
- `governance_compass_question_bank.md` — Complete 72-question bank + budget exercise
- `governance_compass_scoring_engine.md` — 6-stage scoring pipeline with all constants
- `governance_compass_results_ui_spec.md` — Quiz flow UX and 4-layer results display

---

## Migration Strategy

This is a **pre-launch rebuild** with no real user data to preserve. The approach:
1. Create a fresh Prisma migration that drops old quiz tables and creates new ones
2. Auth tables (User, Account, Group, GroupMember) are kept as-is
3. Old quiz components are replaced, not incrementally modified
4. Existing UserProfile is repurposed (same structure, new response/score relations)

---

## File Structure (New & Modified Files)

```
src/
  data/
    axes.ts                                   # REPLACE topics.ts — 12 axis definitions
    forced-choice-items.ts                    # REPLACE questions.ts — 36 FC items
    scaled-items.ts                           # NEW — 36 SC items
    ministries.ts                             # NEW — 10 ministry definitions + axis mappings
    archetypes.ts                             # NEW — 12 archetype prototypes
  lib/
    scoring.ts                                # REPLACE — 6-stage scoring pipeline
    insights.ts                               # REMOVE (replaced by archetypes + tension narratives)
    comparison.ts                             # MODIFY — update for -1.0 to +1.0 range
    validation.ts                             # MODIFY — new quiz submission schemas
    scoring-types.ts                          # NEW — shared types for the scoring pipeline
  components/
    quiz/
      QuizFlow.tsx                            # REPLACE QuizClient.tsx — 3-phase orchestrator
      QuizProvider.tsx                        # REPLACE — new state for 3 modalities
      ForcedChoiceCard.tsx                    # NEW — binary A/B choice card
      ScaledQuestionCard.tsx                  # NEW — 5-point construct-specific scale
      BudgetSimulator.tsx                     # NEW — point-buy budget allocation
      PhaseTransition.tsx                     # NEW — interstitial between phases
      ProgressBar.tsx                         # MODIFY — 3-phase progress
      QuestionCard.tsx                        # REMOVE
      TopicSection.tsx                        # REMOVE
      ReviewScreen.tsx                        # REMOVE (skip summary replaces it)
    results/
      CompassPlot.tsx                         # NEW — 2D scatter plot
      ArchetypeCard.tsx                       # NEW — archetype match display
      RadarChart.tsx                          # REPLACE — bidirectional 12-spoke
      AxisBreakdownCard.tsx                   # NEW — per-axis detail with tension
      ScoreBar.tsx                            # NEW — -1.0 to +1.0 horizontal bar
      InsightCard.tsx                         # REMOVE
      SpectrumBar.tsx                         # REMOVE
      CompareButton.tsx                       # KEEP
    comparison/
      ComparisonRadar.tsx                     # MODIFY — bidirectional scoring
      ComparisonSpectrum.tsx                  # MODIFY → ComparisonScoreBar.tsx
      AlignmentScore.tsx                      # MODIFY — new formula
    groups/
      GroupSpectrum.tsx                        # MODIFY → GroupScoreBar.tsx
      GroupHeatMap.tsx                         # MODIFY — new spread calculation
      GroupRadar.tsx                           # MODIFY — bidirectional
  app/
    quiz/
      page.tsx                                # MODIFY — load axes + items, pass to QuizFlow
      [topic]/page.tsx                        # REMOVE (retake handled differently)
    results/
      [profileId]/
        page.tsx                              # REPLACE — 4-layer results
        [topic]/page.tsx                      # REPLACE → [axisId]/page.tsx — axis detail
    api/
      quiz/
        submit/route.ts                       # REPLACE — new response structure + scoring
        [profileId]/answers/route.ts          # REMOVE (no partial retake in new design)
      results/
        [profileId]/route.ts                  # REPLACE — new scoring output
      groups/
        [groupId]/compare/route.ts            # MODIFY — new score structure
      account/
        data/route.ts                         # MODIFY — axes replace topics for visibility
        visibility/route.ts                   # MODIFY — axisId replaces topicId
prisma/
  schema.prisma                               # REPLACE quiz-related models
  seed.ts                                     # REPLACE — seed new data
tests/
  unit/
    scoring-raw.test.ts                       # NEW — Stage 1-2 tests
    scoring-fusion.test.ts                    # NEW — Stage 3 tests
    scoring-contradiction.test.ts             # NEW — Stage 4 tests
    scoring-dimensions.test.ts                # NEW — Stage 5 tests
    scoring-archetypes.test.ts                # NEW — Stage 6 tests
    comparison.test.ts                        # MODIFY
    data-integrity.test.ts                    # REPLACE — new data validation
    scoring.test.ts                           # REMOVE
    insights.test.ts                          # REMOVE
  e2e/
    quiz-flow.spec.ts                         # REPLACE — 3-phase flow
```

---

## Task 1: Updated Prisma Schema & Migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update the schema**

Replace the quiz-related models (keep User, Account, Group, GroupMember, UserProfile). The new schema:

```prisma
// === KEEP UNCHANGED: User, Account, Group, GroupMember ===

// === REPLACE: Topic, Question, Answer, TopicScore, Annotation, TopicVisibility ===

model Axis {
  id          Int       @id                  // 1-12
  name        String                         // e.g., "Economic Model"
  poleALabel  String                         // e.g., "Collective Provision"
  poleBLabel  String                         // e.g., "Market Allocation"
  domain      String                         // e.g., "Economic Organization"
  domainOrder Int                            // ordering within domain
  order       Int                            // global display order 1-12
  forcedChoiceItems ForcedChoiceItem[]
  scaledItems       ScaledItem[]
  ministryMappings  MinistryAxisMapping[]
  axisScores        AxisScore[]
  axisVisibilities  AxisVisibility[]
}

model ForcedChoiceItem {
  id               String   @id              // e.g., "fc-1-1"
  axisId           Int
  axis             Axis     @relation(fields: [axisId], references: [id])
  itemNumber       Int                       // 1-3 within axis
  questionType     String                    // "FC" or "PT" (portrait method)
  abstractionLevel String                    // "P", "I", or "S"
  statementA       String                    // Pole A statement
  statementB       String                    // Pole B statement
  responses        ForcedChoiceResponse[]
}

model ScaledItem {
  id           String   @id                  // e.g., "sc-1-1"
  axisId       Int
  axis         Axis     @relation(fields: [axisId], references: [id])
  itemNumber   Int                           // 1-3 within axis
  questionStem String                        // The question text
  option1Text  String                        // Strong Pole A (-2)
  option2Text  String                        // Moderate Pole A (-1)
  option3Text  String                        // Midpoint (0)
  option4Text  String                        // Moderate Pole B (+1)
  option5Text  String                        // Strong Pole B (+2)
  responses    ScaledResponse[]
}

model Ministry {
  id                  Int     @id            // 1-10
  name                String
  description         String
  belowBaselineWarning String
  axisMappings        MinistryAxisMapping[]
  allocations         BudgetAllocation[]
}

model MinistryAxisMapping {
  ministryId  Int
  ministry    Ministry @relation(fields: [ministryId], references: [id])
  axisId      Int
  axis        Axis     @relation(fields: [axisId], references: [id])
  direction   Int                            // -1 (toward Pole A) or +1 (toward Pole B)

  @@id([ministryId, axisId])
}

model Archetype {
  id                   String  @id           // e.g., "civic-institutionalist"
  name                 String                // e.g., "The Civic Institutionalist"
  summary              String
  description          String
  characteristicTension String
  prototype            Float[]               // 12-element array, axis scores -1.0 to +1.0
  displayOrder         Int
}

// === RESPONSES (replace Answer) ===

model ForcedChoiceResponse {
  id         String            @id @default(uuid())
  profileId  String
  profile    UserProfile       @relation(fields: [profileId], references: [id], onDelete: Cascade)
  itemId     String
  item       ForcedChoiceItem  @relation(fields: [itemId], references: [id])
  selectedPole String          // "A" or "B"

  @@unique([profileId, itemId])
}

model ScaledResponse {
  id         String       @id @default(uuid())
  profileId  String
  profile    UserProfile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  itemId     String
  item       ScaledItem   @relation(fields: [itemId], references: [id])
  value      Int          // 1-5 (left to right)

  @@unique([profileId, itemId])
}

model BudgetAllocation {
  id         String       @id @default(uuid())
  profileId  String
  profile    UserProfile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  ministryId Int
  ministry   Ministry     @relation(fields: [ministryId], references: [id])
  amount     Int          // 5-95, must sum to 100 across all 10

  @@unique([profileId, ministryId])
}

// === COMPUTED RESULTS (replace TopicScore) ===

model AxisScore {
  id               String       @id @default(uuid())
  profileId        String
  profile          UserProfile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  axisId           Int
  axis             Axis         @relation(fields: [axisId], references: [id])
  fcScore          Float        // Forced-choice modality score [-1.0, +1.0]
  scScore          Float        // Scaled modality score [-1.0, +1.0]
  bgScore          Float?       // Budget modality score [-1.0, +1.0] or null
  finalScore       Float        // Weighted composite [-1.0, +1.0]
  confidence       String       // "high" | "moderate" | "low" | "conflicted"
  tensionLevel     String       @default("none")  // "none" | "mild" | "moderate" | "strong"
  tensionDirection String?      // "principles_A_but_budget_B" | "principles_B_but_budget_A"
  tensionNarrative String?
  annotations      Annotation[]

  @@unique([profileId, axisId])
}

model CompassScore {
  id         String       @id @default(uuid())
  profileId  String       @unique
  profile    UserProfile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  economic   Float        // Super-dimension X [-1.0, +1.0]
  cultural   Float        // Super-dimension Y [-1.0, +1.0]
}

model ArchetypeResult {
  id                    String      @id @default(uuid())
  profileId             String      @unique
  profile               UserProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  primaryArchetypeId    String
  primaryMatchPct       Float
  secondaryArchetypeId  String
  secondaryMatchPct     Float
  isBlended             Boolean     @default(false)
}

// === UPDATE: Annotation now references AxisScore ===

model Annotation {
  id           String     @id @default(uuid())
  axisScoreId  String
  axisScore    AxisScore  @relation(fields: [axisScoreId], references: [id], onDelete: Cascade)
  userId       String
  user         User       @relation(fields: [userId], references: [id])
  text         String
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

// === UPDATE: AxisVisibility replaces TopicVisibility ===

model AxisVisibility {
  userId  String
  user    User    @relation(fields: [userId], references: [id])
  axisId  Int
  axis    Axis    @relation(fields: [axisId], references: [id])
  hidden  Boolean @default(true)

  @@id([userId, axisId])
}

// === UPDATE: UserProfile relations ===
// Add to UserProfile model:
//   forcedChoiceResponses  ForcedChoiceResponse[]
//   scaledResponses        ScaledResponse[]
//   budgetAllocations      BudgetAllocation[]
//   axisScores             AxisScore[]
//   compassScore           CompassScore?
//   archetypeResult        ArchetypeResult?
// Remove: answers, topicScores
```

Update the `UserProfile` model to replace old relations with new ones.

- [ ] **Step 2: Run migration**

Since this is a destructive schema change with no production data:
```bash
npx prisma migrate dev --name governance-compass-rebuild
```

If migration fails due to data, reset:
```bash
npx prisma migrate reset
npx prisma migrate dev --name governance-compass-rebuild
```

- [ ] **Step 3: Commit**

```bash
git add prisma/
git commit -m "feat: replace quiz schema with Governance Compass data model"
```

---

## Task 2: Seed Data — Axes, Items, Ministries, Archetypes

**Files:**
- Create: `src/data/axes.ts`, `src/data/forced-choice-items.ts`, `src/data/scaled-items.ts`, `src/data/ministries.ts`, `src/data/archetypes.ts`
- Replace: `prisma/seed.ts`, `tests/unit/data-integrity.test.ts`
- Remove: `src/data/topics.ts`, `src/data/questions.ts`

All question text comes from `docs/system_proposal/governance_compass_question_bank.md`. Archetype prototypes come from `docs/system_proposal/governance_compass_scoring_engine.md` Stage 6.

- [ ] **Step 1: Write data integrity tests**

Create `tests/unit/data-integrity.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { axes } from "@/data/axes";
import { forcedChoiceItems } from "@/data/forced-choice-items";
import { scaledItems } from "@/data/scaled-items";
import { ministries, ministryAxisMappings } from "@/data/ministries";
import { archetypes } from "@/data/archetypes";

describe("data integrity", () => {
  it("has exactly 12 axes numbered 1-12", () => {
    expect(axes).toHaveLength(12);
    expect(axes.map((a) => a.id).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 12 }, (_, i) => i + 1)
    );
  });

  it("has exactly 36 forced-choice items (3 per axis)", () => {
    expect(forcedChoiceItems).toHaveLength(36);
    for (let axisId = 1; axisId <= 12; axisId++) {
      const items = forcedChoiceItems.filter((i) => i.axisId === axisId);
      expect(items).toHaveLength(3);
    }
  });

  it("has exactly 36 scaled items (3 per axis)", () => {
    expect(scaledItems).toHaveLength(36);
    for (let axisId = 1; axisId <= 12; axisId++) {
      const items = scaledItems.filter((i) => i.axisId === axisId);
      expect(items).toHaveLength(3);
    }
  });

  it("forced-choice items have valid types and abstraction levels", () => {
    for (const item of forcedChoiceItems) {
      expect(["FC", "PT"]).toContain(item.questionType);
      expect(["P", "I", "S"]).toContain(item.abstractionLevel);
    }
  });

  it("has exactly 10 ministries", () => {
    expect(ministries).toHaveLength(10);
  });

  it("ministry-axis mappings reference valid axes and ministries", () => {
    const axisIds = new Set(axes.map((a) => a.id));
    const ministryIds = new Set(ministries.map((m) => m.id));
    for (const mapping of ministryAxisMappings) {
      expect(axisIds.has(mapping.axisId)).toBe(true);
      expect(ministryIds.has(mapping.ministryId)).toBe(true);
      expect([-1, 1]).toContain(mapping.direction);
    }
  });

  it("has 12 archetypes with valid 12-element prototypes", () => {
    expect(archetypes).toHaveLength(12);
    for (const a of archetypes) {
      expect(a.prototype).toHaveLength(12);
      for (const score of a.prototype) {
        expect(score).toBeGreaterThanOrEqual(-1.0);
        expect(score).toBeLessThanOrEqual(1.0);
      }
    }
  });
});
```

- [ ] **Step 2: Create axis definitions**

Create `src/data/axes.ts` with 12 axes from the question bank. Each axis has: id (1-12), name, poleALabel, poleBLabel, domain, domainOrder, order.

- [ ] **Step 3: Create forced-choice items**

Create `src/data/forced-choice-items.ts` with all 36 FC/PT items from the question bank. Each item has: id, axisId, itemNumber, questionType, abstractionLevel, statementA, statementB.

- [ ] **Step 4: Create scaled items**

Create `src/data/scaled-items.ts` with all 36 SC items from the question bank. Each item has: id, axisId, itemNumber, questionStem, option1Text through option5Text.

- [ ] **Step 5: Create ministry definitions**

Create `src/data/ministries.ts` with 10 ministries and the ministry-axis mapping table from the scoring engine spec.

- [ ] **Step 6: Create archetype prototypes**

Create `src/data/archetypes.ts` with 12 archetypes from the scoring engine spec. Each has: id, name, summary, description, characteristicTension, prototype (12-element array), displayOrder.

- [ ] **Step 7: Update seed script**

Replace `prisma/seed.ts` to seed all new data: axes, forced-choice items, scaled items, ministries, ministry-axis mappings, archetypes.

- [ ] **Step 8: Run tests and seed**

```bash
npx vitest run tests/unit/data-integrity.test.ts
npx prisma db seed
```

- [ ] **Step 9: Remove old data files and commit**

```bash
rm src/data/topics.ts src/data/questions.ts
git add src/data/ prisma/seed.ts tests/unit/data-integrity.test.ts
git commit -m "feat: add Governance Compass seed data — 12 axes, 72 items, 10 ministries, 12 archetypes"
```

---

## Task 3: Scoring Types & Constants

**Files:**
- Create: `src/lib/scoring-types.ts`

- [ ] **Step 1: Define shared types and constants**

Create `src/lib/scoring-types.ts` with all types from the scoring engine spec's Appendix, plus the tuning constants and weight profiles. This file is imported by all scoring modules and the API routes.

Key types: `QuizResponses`, `AxisScoreResult`, `CompassResult`, `ArchetypeMatch`, `QuizResults`, `TensionInfo`, `AxisWeightProfile`.

Key constants: `BUDGET_BASELINE`, `BUDGET_MINIMUM`, `BUDGET_SIGMOID_K`, `AXIS_WEIGHT_PROFILES`, `TENSION_THRESHOLDS`, `SD_ECONOMIC_WEIGHTS`, `SD_CULTURAL_WEIGHTS`, `ARCHETYPE_PROTOTYPES`.

- [ ] **Step 2: Commit**

```bash
git add src/lib/scoring-types.ts
git commit -m "feat: add Governance Compass scoring types and constants"
```

---

## Task 4: Scoring Engine — Stages 1-2 (Raw & Per-Axis Scoring) [TDD]

**Files:**
- Create: `src/lib/scoring.ts` (replace), `tests/unit/scoring-raw.test.ts`

- [ ] **Step 1: Write tests for FC, SC, and budget raw scoring + per-axis computation**

Tests should cover:
- FC scoring: selected A → -1.0, selected B → +1.0, mean of 3 per axis
- SC scoring: values 1-5 mapped to -2.0 to +2.0, mean divided by 2 for normalization
- Budget scoring: deviation from baseline, ministry-axis mapping with direction signs, tanh normalization with k=10
- Edge cases: axes with no budget mapping return null

- [ ] **Step 2: Implement Stages 1-2**

Implement in `src/lib/scoring.ts`:
- `scoreForcedChoiceAxis(responses, items, axisId) → number` — returns [-1.0, +1.0]
- `scoreScaledAxis(responses, items, axisId) → number` — returns [-1.0, +1.0]
- `computeBudgetDeviations(allocations) → Map<number, number>` — raw deviations
- `scoreBudgetAxis(deviations, mappings, axisId) → number | null` — returns [-1.0, +1.0] or null
- `computeAllPerModalityScores(responses, items, mappings) → PerModalityScores`

- [ ] **Step 3: Verify tests pass, commit**

```bash
git commit -m "feat: add scoring stages 1-2 — raw and per-axis modality scoring"
```

---

## Task 5: Scoring Engine — Stage 3 (Modality Fusion) [TDD]

**Files:**
- Modify: `src/lib/scoring.ts`, Create: `tests/unit/scoring-fusion.test.ts`

- [ ] **Step 1: Write tests for weighted fusion**

Tests should cover:
- Full budget axes (40/35/25 weights)
- No budget axes (55/45 weights)
- Partial budget axes (45/40/15 weights)
- Output range verification [-1.0, +1.0]

- [ ] **Step 2: Implement Stage 3**

`fuseModalityScores(fc, sc, bg, axisId) → number` — applies axis-specific weight profile from `AXIS_WEIGHT_PROFILES`.

`computeAllFinalScores(perModalityScores) → FinalAxisScore[]`

- [ ] **Step 3: Verify tests pass, commit**

```bash
git commit -m "feat: add scoring stage 3 — modality fusion with axis-specific weights"
```

---

## Task 6: Scoring Engine — Stage 4 (Contradiction Detection) [TDD]

**Files:**
- Modify: `src/lib/scoring.ts`, Create: `tests/unit/scoring-contradiction.test.ts`

- [ ] **Step 1: Write tests for contradiction detection**

Tests should cover:
- No tension when stated and budget scores agree (magnitude < 0.51)
- Mild tension (0.51-1.00)
- Moderate tension (1.01-1.50)
- Strong tension (1.51-2.00)
- Correct direction detection (principles_A_but_budget_B, principles_B_but_budget_A)
- No tension computed for axes without budget data

- [ ] **Step 2: Implement Stage 4**

`detectContradiction(fcScore, scScore, bgScore, axisId) → TensionInfo`

Stated score = renormalized FC+SC: `(0.53 × fc) + (0.47 × sc)`. Contradiction = `|stated - budget|`. Classify by threshold.

- [ ] **Step 3: Verify tests pass, commit**

```bash
git commit -m "feat: add scoring stage 4 — contradiction detection between stated and revealed preferences"
```

---

## Task 7: Scoring Engine — Stage 5 (Super-Dimensions) [TDD]

**Files:**
- Modify: `src/lib/scoring.ts`, Create: `tests/unit/scoring-dimensions.test.ts`

- [ ] **Step 1: Write tests for super-dimension computation**

Tests should cover:
- Economic super-dimension: 0.65 × axis1 + 0.35 × axis2
- Cultural super-dimension: 0.30 × axis7 + 0.20 × axis8 + 0.20 × axis9 + 0.15 × axis5 + 0.15 × axis4
- Output range [-1.0, +1.0]
- All zeros → (0, 0)

- [ ] **Step 2: Implement Stage 5**

`computeSuperDimensions(axisScores) → { economic: number, cultural: number }`

- [ ] **Step 3: Verify tests pass, commit**

```bash
git commit -m "feat: add scoring stage 5 — super-dimension reduction for compass plot"
```

---

## Task 8: Scoring Engine — Stage 6 (Archetype Matching) [TDD]

**Files:**
- Modify: `src/lib/scoring.ts`, Create: `tests/unit/scoring-archetypes.test.ts`

- [ ] **Step 1: Write tests for archetype matching**

Tests should cover:
- Perfect match to a prototype → 100% match
- Maximum divergence → 0% match
- Correct primary and secondary identification
- Blended type detection (top two within 10% distance)
- Low match threshold (below 55% → unusual profile)
- Pragmatic Centrist (all zeros) matches the centrist prototype

- [ ] **Step 2: Implement Stage 6**

`matchArchetype(axisScores, archetypes) → ArchetypeMatch`

Uses weighted Euclidean distance. Match percentage = `max(0, (1 - distance / maxDistance)) × 100` where `maxDistance = sqrt(48)`.

- [ ] **Step 3: Verify tests pass, commit**

```bash
git commit -m "feat: add scoring stage 6 — archetype matching with prototype vectors"
```

---

## Task 9: Full Scoring Pipeline Integration

**Files:**
- Modify: `src/lib/scoring.ts`

- [ ] **Step 1: Write the top-level orchestrator**

`computeFullResults(responses: QuizResponses) → QuizResults`

This function chains all 6 stages and assembles the complete results object matching the `QuizResults` type from the scoring spec.

- [ ] **Step 2: Write an integration test**

Test with a synthetic full response set (36 FC + 36 SC + 10 budget values) and verify the complete output structure.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add full scoring pipeline orchestrator"
```

---

## Task 10: Updated Validation Schemas

**Files:**
- Modify: `src/lib/validation.ts`

- [ ] **Step 1: Replace quiz-related schemas**

New schemas:
```typescript
export const forcedChoiceResponseSchema = z.object({
  itemId: z.string(),
  selectedPole: z.enum(["A", "B"]),
});

export const scaledResponseSchema = z.object({
  itemId: z.string(),
  value: z.number().int().min(1).max(5),
});

export const budgetAllocationSchema = z.object({
  ministryId: z.number().int().min(1).max(10),
  amount: z.number().int().min(5),
});

export const quizSubmitSchema = z.object({
  forcedChoiceResponses: z.array(forcedChoiceResponseSchema),
  scaledResponses: z.array(scaledResponseSchema),
  budgetAllocations: z.array(budgetAllocationSchema).length(10)
    .refine((a) => a.reduce((sum, x) => sum + x.amount, 0) === 100,
      "Budget must sum to 100"),
  anonymousToken: z.string().uuid().optional(),
});
```

Keep: annotationSchema, createGroupSchema, joinGroupSchema, claimProfileSchema, signupSchema.

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: update validation schemas for Governance Compass responses"
```

---

## Task 11: Quiz Submit API

**Files:**
- Replace: `src/app/api/quiz/submit/route.ts`

- [ ] **Step 1: Rewrite the submit route**

The new flow:
1. Validate with `quizSubmitSchema`
2. Verify all item IDs and ministry IDs exist
3. In a transaction:
   a. Create UserProfile
   b. Create ForcedChoiceResponse, ScaledResponse, BudgetAllocation records
   c. Run `computeFullResults()` with the raw responses
   d. Create AxisScore records (12), CompassScore record (1), ArchetypeResult record (1)
4. Return `{ profileId, anonymousToken }`

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: rewrite quiz submit API for Governance Compass 3-modality responses"
```

---

## Task 12: Results API

**Files:**
- Replace: `src/app/api/results/[profileId]/route.ts`

- [ ] **Step 1: Rewrite the results route**

Return the full `QuizResults` structure:
- 12 axis scores with per-modality components, confidence, tension
- Compass coordinates (economic, cultural)
- Archetype assignment (primary, secondary, blended flag)
- Axis metadata (names, pole labels, domain)

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: rewrite results API with full Governance Compass scoring output"
```

---

## Task 13: Quiz UI — Phase 1 (Forced-Choice Dilemmas)

**Files:**
- Create: `src/components/quiz/ForcedChoiceCard.tsx`, `src/components/quiz/PhaseTransition.tsx`

- [ ] **Step 1: Build ForcedChoiceCard**

Two statement cards, side-by-side on desktop, stacked on mobile. Visual confirmation on selection. Portrait-method items (PT type) show "Which person's view is closer to your own?" framing. Randomized statement position per respondent (seeded by profileId/session).

- [ ] **Step 2: Build PhaseTransition**

Interstitial screen between phases. Shows completion count, introduces next phase format, estimated time, "Continue" button.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add forced-choice dilemma card and phase transition components"
```

---

## Task 14: Quiz UI — Phase 2 (Calibrated Scales)

**Files:**
- Create: `src/components/quiz/ScaledQuestionCard.tsx`

- [ ] **Step 1: Build ScaledQuestionCard**

Question stem + 5 response options displayed as a horizontal segmented bar (desktop) or vertical list (mobile). Each option shows its construct-specific label text. Selection highlight. Scale always runs Pole A → Pole B (no randomization of option order).

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: add calibrated scale question card"
```

---

## Task 15: Quiz UI — Phase 3 (Budget Simulator)

**Files:**
- Create: `src/components/quiz/BudgetSimulator.tsx`

- [ ] **Step 1: Build BudgetSimulator**

Point-buy model (Option B from the spec):
- All 10 ministries displayed simultaneously
- Each shows: name, 1-sentence description, current allocation, +/- stepper buttons
- All start at baseline of 10 (50 committed, 50 discretionary)
- Treasury counter shows remaining discretionary points
- Floor of 5 per ministry; below-10 triggers inline warning text
- "Finalize Budget" button enabled only when all 100 units allocated
- Sticky total/remaining counter on mobile

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: add Chancellor's Budget point-buy simulator"
```

---

## Task 16: Quiz UI — Orchestrator & Quiz Page

**Files:**
- Create: `src/components/quiz/QuizFlow.tsx`
- Replace: `src/components/quiz/QuizProvider.tsx`, `src/components/quiz/ProgressBar.tsx`, `src/app/quiz/page.tsx`

- [ ] **Step 1: Rewrite QuizProvider**

New state shape:
- `phase`: "intro" | "phase1" | "transition1" | "phase2" | "transition2" | "phase3" | "computing" | "done"
- `forcedChoiceResponses`: `Record<string, "A" | "B">`
- `scaledResponses`: `Record<string, 1|2|3|4|5>`
- `budgetAllocations`: `Record<number, number>` (ministryId → amount)
- `currentQuestionIndex`: number (within current phase)
- `randomSeed`: number (for consistent randomization)

- [ ] **Step 2: Build QuizFlow orchestrator**

Manages the 3-phase linear flow:
1. Intro screen → Phase 1 (36 FC items, one per screen, randomized) → skip summary → transition
2. Phase 2 (36 SC items, one per screen, randomized) → skip summary → transition
3. Phase 3 (budget simulator, single screen) → "Finalize Budget" → submit

On submit: POST to `/api/quiz/submit`, store tokens in localStorage, redirect to results.

- [ ] **Step 3: Update ProgressBar**

3-segment progress bar showing current phase and within-phase progress.

- [ ] **Step 4: Update quiz page**

Server component loads axes, FC items, SC items, ministries from DB and passes to QuizFlow.

- [ ] **Step 5: Remove old quiz components and commit**

```bash
rm src/components/quiz/QuestionCard.tsx src/components/quiz/TopicSection.tsx src/components/quiz/ReviewScreen.tsx src/components/quiz/QuizClient.tsx
rm src/app/quiz/\[topic\]/page.tsx
git add src/components/quiz/ src/app/quiz/
git commit -m "feat: rebuild quiz UI with 3-phase flow — dilemmas, scales, budget simulator"
```

---

## Task 17: Results UI — Layer 1 (Compass Plot)

**Files:**
- Create: `src/components/results/CompassPlot.tsx`

- [ ] **Step 1: Build CompassPlot**

2D scatter plot using Recharts ScatterChart or custom SVG:
- Square canvas with crosshair at origin
- Respondent's dot at (economic, cultural) coordinates
- Cardinal labels: "Collective · Limits-Conscious" (left), "Market · Growth-Oriented" (right), "Progressive · Liberty-Oriented" (bottom), "Traditional · Authority-Oriented" (top)
- Subtle quadrant labels in corners
- Coordinate readout below
- Framing text: "This is a simplified view..."

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: add 2D compass plot for super-dimension visualization"
```

---

## Task 18: Results UI — Layer 2 (Archetype Card)

**Files:**
- Create: `src/components/results/ArchetypeCard.tsx`

- [ ] **Step 1: Build ArchetypeCard**

Displays:
- Archetype name (large), match percentage
- Summary (always visible, 1-2 sentences)
- Expandable full description + characteristic tension
- Adjacent type with match % and divergence note
- Blended type indicator (if applicable)
- Low-match handling (below 55%)

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: add archetype card with match percentage and expandable description"
```

---

## Task 19: Results UI — Layer 3 (Redesigned Radar Chart)

**Files:**
- Replace: `src/components/results/RadarChart.tsx`

- [ ] **Step 1: Rebuild RadarChart**

Bidirectional 12-spoke radar:
- Center = -1.0 (strong Pole A), middle ring = 0.0 (neutral), perimeter = +1.0 (strong Pole B)
- 12 spokes arranged clockwise by domain (Economic → Power → Society → World)
- Domain separator arcs
- Perimeter labels (Pole B names), inner labels (Pole A names, shown on hover)
- Respondent's profile as a filled polygon
- Archetype overlay toggle
- Spoke confidence indicators (solid/dashed/tension icon)

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: rebuild radar chart with bidirectional scoring and domain grouping"
```

---

## Task 20: Results UI — Layer 4 (Axis Breakdown)

**Files:**
- Create: `src/components/results/AxisBreakdownCard.tsx`, `src/components/results/ScoreBar.tsx`

- [ ] **Step 1: Build ScoreBar**

Horizontal bar from -1.0 to +1.0 with center mark, Pole A/B labels, positioned marker, numeric readout.

- [ ] **Step 2: Build AxisBreakdownCard**

Per-axis card showing:
- Axis name and number
- ScoreBar with final score
- Confidence indicator with explanatory text
- Tension block (when detected): icon, level, narrative, stated vs. budget scores
- Expandable scoring breakdown: FC responses, SC responses, budget signal, weights applied

Grouped by domain with domain headers.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add axis breakdown cards with tension detection and scoring transparency"
```

---

## Task 21: Results Page (All 4 Layers)

**Files:**
- Replace: `src/app/results/[profileId]/page.tsx`
- Remove: `src/components/results/InsightCard.tsx`, `src/components/results/SpectrumBar.tsx`

- [ ] **Step 1: Rebuild results page**

Single scrollable page with all 4 layers in order:
1. CompassPlot (hero element)
2. ArchetypeCard
3. RadarChart with archetype overlay toggle
4. AxisBreakdownCards grouped by domain

Fetch profile with all axis scores, compass score, archetype result from DB.
Keep CompareButton.

- [ ] **Step 2: Remove old components, commit**

```bash
rm src/components/results/InsightCard.tsx src/components/results/SpectrumBar.tsx
rm src/lib/insights.ts tests/unit/insights.test.ts
git add src/app/results/ src/components/results/ src/lib/ tests/
git commit -m "feat: rebuild results page with 4-layer Governance Compass display"
```

---

## Task 22: Update Comparison Logic & Page

**Files:**
- Modify: `src/lib/comparison.ts`, `src/components/comparison/`, `src/app/compare/`

- [ ] **Step 1: Update comparison.ts**

Score range changes from 0-100 to -1.0 to +1.0. Max delta is now 2.0.

Updated alignment score: `100 * (1 - meanDelta / 2.0)`, clamped to [0, 100].

Update `compareProfiles` to work with `AxisScore` records and hidden `AxisVisibility`.

- [ ] **Step 2: Update comparison components**

- ComparisonRadar → bidirectional radar with two overlaid profiles
- ComparisonSpectrum → ScoreBar with two markers (-1.0 to +1.0)
- AlignmentScore → same display, new formula

- [ ] **Step 3: Update comparison page**

Load AxisScores instead of TopicScores. Use AxisVisibility instead of TopicVisibility.

- [ ] **Step 4: Update comparison tests**

```bash
npx vitest run tests/unit/comparison.test.ts
```

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: update comparison for -1.0 to +1.0 axis scoring"
```

---

## Task 23: Update Group Comparison API & Dashboard

**Files:**
- Modify: `src/app/api/groups/[groupId]/compare/route.ts`, `src/components/groups/`, `src/app/groups/[groupId]/page.tsx`

- [ ] **Step 1: Update group compare API**

Return per-axis member scores (from AxisScore), respect AxisVisibility. Compute group average and spread per axis on -1.0 to +1.0 scale.

- [ ] **Step 2: Update group components**

- GroupSpectrum → ScoreBar with member dots (-1.0 to +1.0)
- GroupHeatMap → spread on 0-2.0 scale
- GroupRadar → bidirectional

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: update group dashboard for Governance Compass scoring"
```

---

## Task 24: Update Account Page & Visibility

**Files:**
- Modify: `src/app/account/page.tsx`, `src/app/api/account/data/route.ts`, `src/app/api/account/visibility/route.ts`

- [ ] **Step 1: Update account data API**

Return axes (not topics) for visibility toggles. Use AxisVisibility model.

- [ ] **Step 2: Update visibility API**

Toggle AxisVisibility instead of TopicVisibility.

- [ ] **Step 3: Update account page**

Display 12 axes grouped by domain for visibility toggles. Remove topic retake links.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: update account page for axis-based visibility"
```

---

## Task 25: Update Annotations & Axis Detail Page

**Files:**
- Modify: `src/app/api/annotations/route.ts`, `src/app/results/[profileId]/[topic]/page.tsx` → rename to `[axisId]/page.tsx`

- [ ] **Step 1: Update annotations API**

Reference AxisScore instead of TopicScore.

- [ ] **Step 2: Rebuild axis detail page**

Show: axis name, score bar, individual FC/SC/Budget responses for this axis, scoring breakdown, annotations.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: update annotations and axis detail page for Governance Compass"
```

---

## Task 26: Update Landing Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update copy**

Rename to "The Governance Compass." Update description to reflect the new assessment format — 12 governance dimensions, 3 question modalities, ~20 minutes.

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: update landing page for The Governance Compass"
```

---

## Task 27: Cleanup & Remove Old Code

**Files:**
- Remove: old quiz/scoring files that weren't already removed

- [ ] **Step 1: Remove any remaining old files**

```bash
rm -f src/lib/insights.ts tests/unit/insights.test.ts tests/unit/scoring.test.ts
rm -f src/app/api/quiz/[profileId]/answers/route.ts
```

Verify no imports reference removed files.

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: remove legacy topic-based quiz code"
```

---

## Task 28: E2E Tests

**Files:**
- Replace: `tests/e2e/quiz-flow.spec.ts`

- [ ] **Step 1: Rewrite quiz flow E2E test**

Test the full 3-phase flow:
1. Landing → Start Assessment
2. Phase 1: Answer several FC items, navigate with Next/Back
3. Phase transition → Phase 2: Answer several SC items
4. Phase transition → Phase 3: Allocate budget
5. Finalize → Results page with all 4 layers visible

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: rewrite E2E tests for Governance Compass quiz flow"
```

---

## Summary

28 tasks covering the full Governance Compass rebuild:

| # | Task | Category |
|---|------|----------|
| 1 | Prisma schema migration | Data Model |
| 2 | Seed data (axes, items, ministries, archetypes) | Data Model |
| 3 | Scoring types & constants | Scoring Engine |
| 4 | Stages 1-2: Raw & per-axis scoring (TDD) | Scoring Engine |
| 5 | Stage 3: Modality fusion (TDD) | Scoring Engine |
| 6 | Stage 4: Contradiction detection (TDD) | Scoring Engine |
| 7 | Stage 5: Super-dimensions (TDD) | Scoring Engine |
| 8 | Stage 6: Archetype matching (TDD) | Scoring Engine |
| 9 | Full scoring pipeline integration | Scoring Engine |
| 10 | Validation schemas | API |
| 11 | Quiz submit API | API |
| 12 | Results API | API |
| 13 | Phase 1 UI: Forced-choice cards | Quiz UI |
| 14 | Phase 2 UI: Calibrated scales | Quiz UI |
| 15 | Phase 3 UI: Budget simulator | Quiz UI |
| 16 | Quiz orchestrator & page | Quiz UI |
| 17 | Layer 1: Compass plot | Results UI |
| 18 | Layer 2: Archetype card | Results UI |
| 19 | Layer 3: Radar chart (bidirectional) | Results UI |
| 20 | Layer 4: Axis breakdown cards | Results UI |
| 21 | Results page (all 4 layers) | Results UI |
| 22 | Update comparison logic & page | Social Features |
| 23 | Update group dashboard | Social Features |
| 24 | Update account page & visibility | Social Features |
| 25 | Update annotations & axis detail | Social Features |
| 26 | Update landing page | Polish |
| 27 | Cleanup old code | Cleanup |
| 28 | E2E tests | Testing |
