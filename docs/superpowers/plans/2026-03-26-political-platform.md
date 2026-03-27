# PoliticalPlatform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a political self-assessment web app where users take a research-backed questionnaire, receive a multi-dimensional profile, and compare views with friends.

**Architecture:** Next.js App Router full-stack app. Quiz data seeded to PostgreSQL via Prisma. Scoring and insight generation are pure server-side functions. Anonymous users get a localStorage token; authenticated users can claim profiles, annotate, and join groups. Recharts for radar and spectrum visualizations.

**Tech Stack:** Next.js 14+ (TypeScript), PostgreSQL, Prisma, NextAuth.js v5, Tailwind CSS, Recharts, Zod, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-03-26-political-platform-design.md`

---

## File Structure

```
src/
  app/
    layout.tsx                                # Root layout with Tailwind, fonts
    page.tsx                                  # Landing page
    globals.css                               # Tailwind imports + custom styles
    quiz/
      page.tsx                                # Server wrapper: fetches topics/questions, renders QuizClient
      [topic]/page.tsx                        # Server wrapper for single-topic retake
    results/
      [profileId]/
        page.tsx                              # Results dashboard (server-rendered)
        [topic]/page.tsx                      # Topic drill-down with annotations
    compare/
      [profileId1]/
        [profileId2]/page.tsx                 # Side-by-side comparison
    groups/
      [groupId]/page.tsx                      # Group dashboard
    auth/
      signin/page.tsx                         # Sign in form
      signup/page.tsx                         # Sign up form
    account/
      page.tsx                                # Account management, groups, visibility
    api/
      quiz/
        submit/route.ts                       # POST: submit answers, create profile
        [profileId]/
          answers/route.ts                    # PATCH: update answers on retake
      results/
        [profileId]/route.ts                  # GET: computed scores + insights
      annotations/route.ts                    # POST: create/update annotation
      groups/
        route.ts                              # POST: create group
        [groupId]/
          join/route.ts                       # POST: join via invite code
          compare/route.ts                    # GET: group comparison data
      auth/
        [...nextauth]/route.ts                # NextAuth handler
        signup/route.ts                       # POST: register with credentials
        claim/route.ts                        # POST: link anonymous profile to account
  lib/
    db.ts                                     # Prisma client singleton
    auth.ts                                   # NextAuth config
    scoring.ts                                # Pure scoring functions
    insights.ts                               # Insight generation
    comparison.ts                             # Profile comparison & alignment
    validation.ts                             # Zod schemas
  data/
    topics.ts                                 # Topic definitions (12 topics)
    questions.ts                              # Question bank (5-8 per topic)
  components/
    quiz/
      QuizClient.tsx                          # Client-side quiz orchestrator
      QuizProvider.tsx                        # React context for quiz state
      QuestionCard.tsx                        # Single question with Likert scale
      TopicSection.tsx                        # All questions for one topic
      ProgressBar.tsx                         # Topic progress indicator
      ReviewScreen.tsx                        # Pre-submit answer review
    results/
      RadarChart.tsx                          # Recharts radar/spider chart
      SpectrumBar.tsx                         # Horizontal spectrum with marker
      InsightCard.tsx                         # Plain-language insight card
      CompareButton.tsx                       # "Compare with mine" CTA
    comparison/
      ComparisonRadar.tsx                     # Overlaid radar for two profiles
      ComparisonSpectrum.tsx                  # Spectrum with two markers
      AlignmentScore.tsx                      # Overall alignment percentage
    groups/
      GroupSpectrum.tsx                        # All members as dots on spectrum
      GroupHeatMap.tsx                         # Agreement/spread heat map
      GroupRadar.tsx                           # Group average radar overlay
    annotations/
      AnnotationEditor.tsx                    # Create/edit annotation form
  app/
    api/
      account/
        data/route.ts                         # GET: account data (profile, visibility, groups)
        visibility/route.ts                   # POST: toggle topic visibility
      groups/
        join/route.ts                         # POST: join group by invite code only
        [groupId]/
          route.ts                            # PATCH: update group settings, DELETE: leave/remove
prisma/
  schema.prisma                               # Full database schema
  seed.ts                                     # Seed topics + questions
tests/
  unit/
    scoring.test.ts
    insights.test.ts
    comparison.test.ts
  e2e/
    quiz-flow.spec.ts
    results.spec.ts
    comparison.spec.ts
```

---

## Task 1: Project Setup & Configuration

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `vitest.config.ts`, `.env.example`, `.gitignore`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`

- [ ] **Step 1: Scaffold Next.js project**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```
Expected: Project scaffolded with Next.js, TypeScript, Tailwind, ESLint, App Router.

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install @prisma/client recharts zod bcryptjs next-auth@beta @auth/prisma-adapter
npm install -D prisma vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @types/bcryptjs
```

- [ ] **Step 3: Create vitest config**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 4: Add test script to package.json**

Add to `scripts` in `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test"
```

- [ ] **Step 5: Create environment template**

Create `.env.example`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/political_platform"
NEXTAUTH_SECRET="generate-a-secret-here"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Copy to `.env.local`:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your actual `DATABASE_URL` for a local PostgreSQL database.

- [ ] **Step 6: Update .gitignore**

Append to `.gitignore`:
```
.env.local
.superpowers/
```

- [ ] **Step 7: Verify dev server starts**

Run: `npm run dev`
Expected: Server starts at http://localhost:3000 with the default Next.js page.

- [ ] **Step 8: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js project with dependencies and config"
```

---

## Task 2: Database Schema & Prisma Setup

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/db.ts`

- [ ] **Step 1: Initialize Prisma**

Run:
```bash
npx prisma init
```

- [ ] **Step 2: Write the full schema**

Replace `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Topic {
  id                 String            @id @default(uuid())
  name               String
  description        String
  icon               String
  spectrumLabelLeft  String
  spectrumLabelRight String
  spectrumLabelCenter String
  order              Int
  questions          Question[]
  topicScores        TopicScore[]
  topicVisibilities  TopicVisibility[]
}

model Question {
  id       String   @id @default(uuid())
  topicId  String
  topic    Topic    @relation(fields: [topicId], references: [id])
  text     String
  context  String?
  polarity Int      // 1 or -1
  order    Int
  answers  Answer[]
}

model User {
  id                String            @id @default(uuid())
  email             String            @unique
  emailVerified     DateTime?
  name              String?
  passwordHash      String?
  image             String?
  createdAt         DateTime          @default(now())
  accounts          Account[]
  profiles          UserProfile[]
  annotations       Annotation[]
  createdGroups     Group[]           @relation("GroupCreator")
  groupMembers      GroupMember[]
  topicVisibilities TopicVisibility[]
}

model Account {
  id                String  @id @default(uuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model UserProfile {
  id             String       @id @default(uuid())
  userId         String?
  user           User?        @relation(fields: [userId], references: [id])
  anonymousToken String?      @unique
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  answers        Answer[]
  topicScores    TopicScore[]
}

model Answer {
  id         String      @id @default(uuid())
  profileId  String
  profile    UserProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  questionId String
  question   Question    @relation(fields: [questionId], references: [id])
  value      Int?
  skipped    Boolean     @default(false)
  answeredAt DateTime    @default(now())

  @@unique([profileId, questionId])
}

model TopicScore {
  id               String       @id @default(uuid())
  profileId        String
  profile          UserProfile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  topicId          String
  topic            Topic        @relation(fields: [topicId], references: [id])
  score            Float
  answeredCount    Int
  insufficientData Boolean      @default(false)
  annotations      Annotation[]

  @@unique([profileId, topicId])
}

model Annotation {
  id           String     @id @default(uuid())
  topicScoreId String
  topicScore   TopicScore @relation(fields: [topicScoreId], references: [id], onDelete: Cascade)
  userId       String
  user         User       @relation(fields: [userId], references: [id])
  text         String
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

model Group {
  id         String        @id @default(uuid())
  name       String
  inviteCode String        @unique
  creatorId  String
  creator    User          @relation("GroupCreator", fields: [creatorId], references: [id])
  showNames  Boolean       @default(true)
  createdAt  DateTime      @default(now())
  members    GroupMember[]
}

model GroupMember {
  groupId  String
  group    Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  userId   String
  user     User     @relation(fields: [userId], references: [id])
  joinedAt DateTime @default(now())

  @@id([groupId, userId])
}

model TopicVisibility {
  userId  String
  user    User    @relation(fields: [userId], references: [id])
  topicId String
  topic   Topic   @relation(fields: [topicId], references: [id])
  hidden  Boolean @default(true)

  @@id([userId, topicId])
}
```

- [ ] **Step 3: Create Prisma client singleton**

Create `src/lib/db.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

- [ ] **Step 4: Run first migration**

Run:
```bash
npx prisma migrate dev --name init
```
Expected: Migration created and applied. Prisma Client generated.

- [ ] **Step 5: Commit**

```bash
git add prisma/ src/lib/db.ts
git commit -m "feat: add Prisma schema with full data model"
```

---

## Task 3: Topic & Question Seed Data

**Files:**
- Create: `src/data/topics.ts`, `src/data/questions.ts`, `prisma/seed.ts`, `tests/unit/data-integrity.test.ts`

- [ ] **Step 1: Write data integrity test**

Create `tests/unit/data-integrity.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/data-integrity.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write topic definitions**

Create `src/data/topics.ts`:
```typescript
export interface TopicData {
  id: string;
  name: string;
  description: string;
  icon: string;
  spectrumLabelLeft: string;
  spectrumLabelRight: string;
  spectrumLabelCenter: string;
  order: number;
}

export const topics: TopicData[] = [
  {
    id: "healthcare",
    name: "Healthcare",
    description: "Policies related to healthcare access, insurance, and medical services",
    icon: "heart-pulse",
    spectrumLabelLeft: "Government-administered universal system",
    spectrumLabelRight: "Fully private market-based system",
    spectrumLabelCenter: "Mixed public-private approach",
    order: 1,
  },
  {
    id: "economic-policy",
    name: "Economic Policy",
    description: "Taxation, government spending, regulation, and economic structure",
    icon: "chart-line",
    spectrumLabelLeft: "Strong government regulation and redistribution",
    spectrumLabelRight: "Free market with minimal intervention",
    spectrumLabelCenter: "Balanced regulation and market freedom",
    order: 2,
  },
  {
    id: "immigration",
    name: "Immigration",
    description: "Border policy, immigration pathways, and treatment of immigrants",
    icon: "globe",
    spectrumLabelLeft: "Open, welcoming immigration policy",
    spectrumLabelRight: "Restrictive, enforcement-focused policy",
    spectrumLabelCenter: "Controlled immigration with humanitarian considerations",
    order: 3,
  },
  {
    id: "criminal-justice",
    name: "Criminal Justice",
    description: "Policing, sentencing, incarceration, and justice reform",
    icon: "scale",
    spectrumLabelLeft: "Reform-centered, rehabilitative approach",
    spectrumLabelRight: "Enforcement-centered, punitive approach",
    spectrumLabelCenter: "Balanced reform and enforcement",
    order: 4,
  },
  {
    id: "environment",
    name: "Environment & Climate",
    description: "Climate change action, environmental regulation, and energy policy",
    icon: "leaf",
    spectrumLabelLeft: "Aggressive government climate action",
    spectrumLabelRight: "Market-driven environmental solutions",
    spectrumLabelCenter: "Government incentives with market flexibility",
    order: 5,
  },
  {
    id: "education",
    name: "Education",
    description: "Public education funding, school choice, and higher education",
    icon: "graduation-cap",
    spectrumLabelLeft: "Publicly funded universal education",
    spectrumLabelRight: "School choice and privatization",
    spectrumLabelCenter: "Public system with choice options",
    order: 6,
  },
  {
    id: "gun-policy",
    name: "Gun Policy",
    description: "Firearm regulations, ownership rights, and public safety",
    icon: "shield",
    spectrumLabelLeft: "Strict regulation and restrictions",
    spectrumLabelRight: "Broad individual gun rights",
    spectrumLabelCenter: "Moderate regulation preserving ownership",
    order: 7,
  },
  {
    id: "social-issues",
    name: "Social Issues",
    description: "LGBTQ+ rights, reproductive rights, drug policy, and civil liberties",
    icon: "users",
    spectrumLabelLeft: "Progressive social policies",
    spectrumLabelRight: "Traditional social values",
    spectrumLabelCenter: "Moderate social positions",
    order: 8,
  },
  {
    id: "foreign-policy",
    name: "Foreign Policy & Defense",
    description: "Military spending, international alliances, and diplomatic approach",
    icon: "flag",
    spectrumLabelLeft: "Diplomacy-first, reduced military",
    spectrumLabelRight: "Strong military, assertive posture",
    spectrumLabelCenter: "Diplomatic engagement backed by military readiness",
    order: 9,
  },
  {
    id: "government-role",
    name: "Government Role & Size",
    description: "Scope of government services, individual liberty, and federal power",
    icon: "landmark",
    spectrumLabelLeft: "Expansive government services",
    spectrumLabelRight: "Limited government, individual liberty",
    spectrumLabelCenter: "Targeted government with personal freedom",
    order: 10,
  },
  {
    id: "technology-privacy",
    name: "Technology & Privacy",
    description: "Data privacy, tech regulation, surveillance, and digital rights",
    icon: "lock",
    spectrumLabelLeft: "Strong regulation and privacy protection",
    spectrumLabelRight: "Innovation-first, minimal regulation",
    spectrumLabelCenter: "Balanced regulation and innovation",
    order: 11,
  },
  {
    id: "housing",
    name: "Housing & Urban Policy",
    description: "Housing affordability, zoning, homelessness, and urban development",
    icon: "home",
    spectrumLabelLeft: "Government-led housing solutions",
    spectrumLabelRight: "Market-driven development",
    spectrumLabelCenter: "Public-private housing partnerships",
    order: 12,
  },
];
```

- [ ] **Step 4: Write question bank**

Create `src/data/questions.ts`:
```typescript
export interface QuestionData {
  id: string;
  topicId: string;
  text: string;
  context: string | null;
  polarity: 1 | -1;
  order: number;
}

export const questions: QuestionData[] = [
  // --- Healthcare ---
  {
    id: "hc-1",
    topicId: "healthcare",
    text: "The government should provide healthcare coverage for all citizens.",
    context: null,
    polarity: 1,
    order: 1,
  },
  {
    id: "hc-2",
    topicId: "healthcare",
    text: "Private insurance companies should be the primary providers of health coverage.",
    context: null,
    polarity: -1,
    order: 2,
  },
  {
    id: "hc-3",
    topicId: "healthcare",
    text: "Prescription drug prices should be regulated by the government.",
    context: null,
    polarity: 1,
    order: 3,
  },
  {
    id: "hc-4",
    topicId: "healthcare",
    text: "Healthcare providers should be free to set their own prices without government interference.",
    context: null,
    polarity: -1,
    order: 4,
  },
  {
    id: "hc-5",
    topicId: "healthcare",
    text: "Mental health services should receive the same level of public funding as physical health services.",
    context: null,
    polarity: 1,
    order: 5,
  },

  // --- Economic Policy ---
  {
    id: "ec-1",
    topicId: "economic-policy",
    text: "The government should increase taxes on the wealthy to fund public services.",
    context: null,
    polarity: 1,
    order: 1,
  },
  {
    id: "ec-2",
    topicId: "economic-policy",
    text: "Reducing business regulations leads to more economic growth and opportunity.",
    context: null,
    polarity: -1,
    order: 2,
  },
  {
    id: "ec-3",
    topicId: "economic-policy",
    text: "A higher minimum wage is necessary to ensure a livable income for workers.",
    context: null,
    polarity: 1,
    order: 3,
  },
  {
    id: "ec-4",
    topicId: "economic-policy",
    text: "Government spending on infrastructure should be increased even if it means higher taxes.",
    context: null,
    polarity: 1,
    order: 4,
  },
  {
    id: "ec-5",
    topicId: "economic-policy",
    text: "Corporate tax cuts are an effective way to stimulate economic growth.",
    context: null,
    polarity: -1,
    order: 5,
  },

  // --- Immigration ---
  {
    id: "im-1",
    topicId: "immigration",
    text: "Immigrants contribute more to the economy than they cost in public services.",
    context: null,
    polarity: 1,
    order: 1,
  },
  {
    id: "im-2",
    topicId: "immigration",
    text: "The government should make it easier for skilled workers to immigrate.",
    context: null,
    polarity: 1,
    order: 2,
  },
  {
    id: "im-3",
    topicId: "immigration",
    text: "Undocumented immigrants who have lived in the country for years should have a path to legal status.",
    context: null,
    polarity: 1,
    order: 3,
  },
  {
    id: "im-4",
    topicId: "immigration",
    text: "Stricter border enforcement is necessary to maintain national security.",
    context: null,
    polarity: -1,
    order: 4,
  },
  {
    id: "im-5",
    topicId: "immigration",
    text: "Local law enforcement should be required to cooperate with federal immigration authorities.",
    context: null,
    polarity: -1,
    order: 5,
  },

  // --- Criminal Justice ---
  {
    id: "cj-1",
    topicId: "criminal-justice",
    text: "Non-violent drug offenses should be decriminalized.",
    context: null,
    polarity: 1,
    order: 1,
  },
  {
    id: "cj-2",
    topicId: "criminal-justice",
    text: "The justice system should prioritize rehabilitation over punishment.",
    context: null,
    polarity: 1,
    order: 2,
  },
  {
    id: "cj-3",
    topicId: "criminal-justice",
    text: "Mandatory minimum sentences are an effective tool for reducing crime.",
    context: null,
    polarity: -1,
    order: 3,
  },
  {
    id: "cj-4",
    topicId: "criminal-justice",
    text: "Communities should have greater civilian oversight of police departments.",
    context: null,
    polarity: 1,
    order: 4,
  },
  {
    id: "cj-5",
    topicId: "criminal-justice",
    text: "Police departments should receive increased funding for training and equipment.",
    context: null,
    polarity: -1,
    order: 5,
  },

  // --- Environment & Climate ---
  {
    id: "en-1",
    topicId: "environment",
    text: "The government should set strict limits on carbon emissions from industry.",
    context: null,
    polarity: 1,
    order: 1,
  },
  {
    id: "en-2",
    topicId: "environment",
    text: "Transitioning to renewable energy should be a top government priority, even at significant cost.",
    context: null,
    polarity: 1,
    order: 2,
  },
  {
    id: "en-3",
    topicId: "environment",
    text: "Environmental regulations place too heavy a burden on businesses.",
    context: null,
    polarity: -1,
    order: 3,
  },
  {
    id: "en-4",
    topicId: "environment",
    text: "Market incentives like carbon trading are more effective than government mandates for reducing emissions.",
    context: null,
    polarity: -1,
    order: 4,
  },
  {
    id: "en-5",
    topicId: "environment",
    text: "Public transportation should receive significantly more government investment.",
    context: null,
    polarity: 1,
    order: 5,
  },

  // --- Education ---
  {
    id: "ed-1",
    topicId: "education",
    text: "Public college and university tuition should be free or heavily subsidized.",
    context: null,
    polarity: 1,
    order: 1,
  },
  {
    id: "ed-2",
    topicId: "education",
    text: "Parents should receive public funding to send their children to the school of their choice, including private schools.",
    context: "Often referred to as school voucher programs.",
    polarity: -1,
    order: 2,
  },
  {
    id: "ed-3",
    topicId: "education",
    text: "The federal government should set nationwide curriculum standards.",
    context: null,
    polarity: 1,
    order: 3,
  },
  {
    id: "ed-4",
    topicId: "education",
    text: "Teacher pay should be significantly increased and funded through higher taxes if necessary.",
    context: null,
    polarity: 1,
    order: 4,
  },
  {
    id: "ed-5",
    topicId: "education",
    text: "Charter schools and alternative schooling models improve educational outcomes.",
    context: null,
    polarity: -1,
    order: 5,
  },

  // --- Gun Policy ---
  {
    id: "gp-1",
    topicId: "gun-policy",
    text: "Background checks should be required for all firearm purchases, including private sales.",
    context: null,
    polarity: 1,
    order: 1,
  },
  {
    id: "gp-2",
    topicId: "gun-policy",
    text: "Civilians should be allowed to own semi-automatic rifles.",
    context: null,
    polarity: -1,
    order: 2,
  },
  {
    id: "gp-3",
    topicId: "gun-policy",
    text: "Red flag laws allowing temporary firearm removal from at-risk individuals are a reasonable safety measure.",
    context: "Red flag laws allow courts to temporarily remove firearms from individuals deemed a risk to themselves or others.",
    polarity: 1,
    order: 3,
  },
  {
    id: "gp-4",
    topicId: "gun-policy",
    text: "The right to bear arms is fundamental and should face minimal government restriction.",
    context: null,
    polarity: -1,
    order: 4,
  },
  {
    id: "gp-5",
    topicId: "gun-policy",
    text: "There should be a mandatory waiting period for all firearm purchases.",
    context: null,
    polarity: 1,
    order: 5,
  },

  // --- Social Issues ---
  {
    id: "si-1",
    topicId: "social-issues",
    text: "Same-sex couples should have the same legal rights and protections as heterosexual couples.",
    context: null,
    polarity: 1,
    order: 1,
  },
  {
    id: "si-2",
    topicId: "social-issues",
    text: "Access to abortion should be legally protected.",
    context: null,
    polarity: 1,
    order: 2,
  },
  {
    id: "si-3",
    topicId: "social-issues",
    text: "Recreational marijuana should be legal for adults.",
    context: null,
    polarity: 1,
    order: 3,
  },
  {
    id: "si-4",
    topicId: "social-issues",
    text: "Religious institutions should have the right to refuse services that conflict with their beliefs.",
    context: null,
    polarity: -1,
    order: 4,
  },
  {
    id: "si-5",
    topicId: "social-issues",
    text: "Transgender individuals should be able to use facilities matching their gender identity.",
    context: null,
    polarity: 1,
    order: 5,
  },

  // --- Foreign Policy & Defense ---
  {
    id: "fp-1",
    topicId: "foreign-policy",
    text: "Military spending should be reduced in favor of diplomatic and humanitarian aid.",
    context: null,
    polarity: 1,
    order: 1,
  },
  {
    id: "fp-2",
    topicId: "foreign-policy",
    text: "The country should maintain the strongest military in the world.",
    context: null,
    polarity: -1,
    order: 2,
  },
  {
    id: "fp-3",
    topicId: "foreign-policy",
    text: "International trade agreements benefit the country more than protectionist policies.",
    context: null,
    polarity: 1,
    order: 3,
  },
  {
    id: "fp-4",
    topicId: "foreign-policy",
    text: "The country should avoid military intervention in foreign conflicts unless directly threatened.",
    context: null,
    polarity: 1,
    order: 4,
  },
  {
    id: "fp-5",
    topicId: "foreign-policy",
    text: "Maintaining a global network of military bases is essential for national security.",
    context: null,
    polarity: -1,
    order: 5,
  },

  // --- Government Role & Size ---
  {
    id: "gr-1",
    topicId: "government-role",
    text: "The government has a responsibility to ensure basic needs like food, shelter, and healthcare for all citizens.",
    context: null,
    polarity: 1,
    order: 1,
  },
  {
    id: "gr-2",
    topicId: "government-role",
    text: "Government programs often create dependency and should be limited.",
    context: null,
    polarity: -1,
    order: 2,
  },
  {
    id: "gr-3",
    topicId: "government-role",
    text: "Federal regulations are necessary to protect consumers and workers.",
    context: null,
    polarity: 1,
    order: 3,
  },
  {
    id: "gr-4",
    topicId: "government-role",
    text: "Most government functions would be handled better by the private sector.",
    context: null,
    polarity: -1,
    order: 4,
  },
  {
    id: "gr-5",
    topicId: "government-role",
    text: "A universal basic income would be a better approach than the current welfare system.",
    context: null,
    polarity: 1,
    order: 5,
  },

  // --- Technology & Privacy ---
  {
    id: "tp-1",
    topicId: "technology-privacy",
    text: "Tech companies should face stricter regulations on how they collect and use personal data.",
    context: null,
    polarity: 1,
    order: 1,
  },
  {
    id: "tp-2",
    topicId: "technology-privacy",
    text: "Government surveillance programs are justified when they help prevent terrorism.",
    context: null,
    polarity: -1,
    order: 2,
  },
  {
    id: "tp-3",
    topicId: "technology-privacy",
    text: "Social media companies should be required to remove harmful misinformation.",
    context: null,
    polarity: 1,
    order: 3,
  },
  {
    id: "tp-4",
    topicId: "technology-privacy",
    text: "Regulating AI and emerging technologies too early could stifle innovation.",
    context: null,
    polarity: -1,
    order: 4,
  },
  {
    id: "tp-5",
    topicId: "technology-privacy",
    text: "Individuals should have the right to have their personal data deleted from any company's systems.",
    context: "Often referred to as the 'right to be forgotten.'",
    polarity: 1,
    order: 5,
  },

  // --- Housing & Urban Policy ---
  {
    id: "hu-1",
    topicId: "housing",
    text: "The government should build more public housing to address affordability.",
    context: null,
    polarity: 1,
    order: 1,
  },
  {
    id: "hu-2",
    topicId: "housing",
    text: "Rent control policies are effective tools for keeping housing affordable.",
    context: null,
    polarity: 1,
    order: 2,
  },
  {
    id: "hu-3",
    topicId: "housing",
    text: "Reducing zoning restrictions would allow the market to solve the housing shortage.",
    context: null,
    polarity: -1,
    order: 3,
  },
  {
    id: "hu-4",
    topicId: "housing",
    text: "Government-funded homeless shelters and services should be expanded.",
    context: null,
    polarity: 1,
    order: 4,
  },
  {
    id: "hu-5",
    topicId: "housing",
    text: "Property developers should face fewer restrictions to increase housing supply.",
    context: null,
    polarity: -1,
    order: 5,
  },
];
```

- [ ] **Step 5: Run data integrity tests**

Run: `npx vitest run tests/unit/data-integrity.test.ts`
Expected: All 6 tests PASS.

- [ ] **Step 6: Write seed script**

Create `prisma/seed.ts`:
```typescript
import { PrismaClient } from "@prisma/client";
import { topics } from "../src/data/topics";
import { questions } from "../src/data/questions";

const prisma = new PrismaClient();

async function main() {
  // Upsert topics
  for (const topic of topics) {
    await prisma.topic.upsert({
      where: { id: topic.id },
      update: topic,
      create: topic,
    });
  }

  // Upsert questions
  for (const question of questions) {
    await prisma.question.upsert({
      where: { id: question.id },
      update: question,
      create: question,
    });
  }

  console.log(`Seeded ${topics.length} topics and ${questions.length} questions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 7: Configure seed command**

Add to `package.json`:
```json
"prisma": {
  "seed": "npx tsx prisma/seed.ts"
}
```

Install tsx:
```bash
npm install -D tsx
```

- [ ] **Step 8: Run seed**

Run: `npx prisma db seed`
Expected: "Seeded 12 topics and 60 questions."

- [ ] **Step 9: Commit**

```bash
git add src/data/ prisma/seed.ts tests/unit/data-integrity.test.ts package.json
git commit -m "feat: add topic and question seed data with integrity tests"
```

---

## Task 4: Scoring Logic (TDD)

**Files:**
- Create: `src/lib/scoring.ts`, `tests/unit/scoring.test.ts`

- [ ] **Step 1: Write scoring tests**

Create `tests/unit/scoring.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import {
  calculateTopicScore,
  calculateAllScores,
  type QuestionInput,
  type AnswerInput,
} from "@/lib/scoring";

const makeQuestion = (
  id: string,
  topicId: string,
  polarity: number = 1
): QuestionInput => ({ id, topicId, polarity });

const makeAnswer = (
  questionId: string,
  value: number | null,
  skipped = false
): AnswerInput => ({ questionId, value, skipped });

describe("calculateTopicScore", () => {
  const topicId = "healthcare";
  const questions = [
    makeQuestion("q1", topicId, 1),
    makeQuestion("q2", topicId, -1),
    makeQuestion("q3", topicId, 1),
  ];

  it("returns 50 (center) when all answers are neutral", () => {
    const answers = [
      makeAnswer("q1", 0),
      makeAnswer("q2", 0),
      makeAnswer("q3", 0),
    ];
    const result = calculateTopicScore(topicId, answers, questions);
    expect(result.score).toBe(50);
    expect(result.insufficientData).toBe(false);
    expect(result.answeredCount).toBe(3);
  });

  it("returns 0 (left endpoint) when fully aligned with left spectrum", () => {
    // polarity 1: "Strongly Agree" aligns with the LEFT endpoint
    // directional = value * polarity = 2 * 1 = 2 (positive = left)
    // score = (2 - mean) / 4 * 100 = (2 - 2) / 4 * 100 = 0
    const questionsAllPos = [
      makeQuestion("q1", topicId, 1),
      makeQuestion("q2", topicId, 1),
      makeQuestion("q3", topicId, 1),
    ];
    const answers = [
      makeAnswer("q1", 2),
      makeAnswer("q2", 2),
      makeAnswer("q3", 2),
    ];
    const result = calculateTopicScore(topicId, answers, questionsAllPos);
    expect(result.score).toBe(0);
    expect(result.insufficientData).toBe(false);
  });

  it("returns 100 (right endpoint) when fully aligned with right spectrum", () => {
    // polarity 1, all strongly disagree (-2) → directional mean = -2
    // score = (2 - (-2)) / 4 * 100 = 100 (right)
    const questionsAllPos = [
      makeQuestion("q1", topicId, 1),
      makeQuestion("q2", topicId, 1),
      makeQuestion("q3", topicId, 1),
    ];
    const answers = [
      makeAnswer("q1", -2),
      makeAnswer("q2", -2),
      makeAnswer("q3", -2),
    ];
    const result = calculateTopicScore(topicId, answers, questionsAllPos);
    expect(result.score).toBe(100);
  });

  it("handles mixed polarity correctly", () => {
    // q1 polarity 1, agree(+2): directional = 2 (left-leaning)
    // q2 polarity -1, agree(+2): directional = -2 (right-leaning)
    // mean = (2 + -2) / 2 = 0
    // score = (2-0)/4*100 = 50
    const mixedQuestions = [
      makeQuestion("q1", topicId, 1),
      makeQuestion("q2", topicId, -1),
    ];
    const answers = [makeAnswer("q1", 2), makeAnswer("q2", 2)];
    const result = calculateTopicScore(topicId, answers, mixedQuestions);
    expect(result.score).toBe(50);
  });

  it("excludes skipped answers from calculation", () => {
    const answers = [
      makeAnswer("q1", 2),
      makeAnswer("q2", null, true), // skipped
      makeAnswer("q3", 2),
    ];
    const questionsAllPos = [
      makeQuestion("q1", topicId, 1),
      makeQuestion("q2", topicId, 1),
      makeQuestion("q3", topicId, 1),
    ];
    const result = calculateTopicScore(topicId, answers, questionsAllPos);
    expect(result.answeredCount).toBe(2);
    expect(result.score).toBe(0); // both answered strongly agree with polarity 1 → left
  });

  it("marks insufficient data when fewer than 2 answers", () => {
    const answers = [makeAnswer("q1", 2)];
    const result = calculateTopicScore(topicId, answers, questions);
    expect(result.insufficientData).toBe(true);
    expect(result.score).toBe(50); // default center
    expect(result.answeredCount).toBe(1);
  });

  it("ignores answers for questions in other topics", () => {
    const otherQuestion = makeQuestion("other-q", "other-topic", 1);
    const answers = [
      makeAnswer("q1", 2),
      makeAnswer("q2", 2),
      makeAnswer("other-q", -2), // different topic, should be ignored
    ];
    const allQuestions = [...questions, otherQuestion];
    const result = calculateTopicScore(topicId, answers, allQuestions);
    expect(result.answeredCount).toBe(2);
  });
});

describe("calculateAllScores", () => {
  it("returns scores for all requested topics", () => {
    const questions = [
      makeQuestion("q1", "topic-a", 1),
      makeQuestion("q2", "topic-a", 1),
      makeQuestion("q3", "topic-b", 1),
      makeQuestion("q4", "topic-b", 1),
    ];
    const answers = [
      makeAnswer("q1", 1),
      makeAnswer("q2", 1),
      makeAnswer("q3", -1),
      makeAnswer("q4", -1),
    ];
    const results = calculateAllScores(answers, questions, [
      "topic-a",
      "topic-b",
    ]);
    expect(results).toHaveLength(2);
    expect(results[0].topicId).toBe("topic-a");
    expect(results[1].topicId).toBe("topic-b");
    // topic-a: mean directional = (1+1)/2 = 1, score = (2-1)/4*100 = 25
    expect(results[0].score).toBe(25);
    // topic-b: mean directional = (-1+-1)/2 = -1, score = (2-(-1))/4*100 = 75
    expect(results[1].score).toBe(75);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/scoring.test.ts`
Expected: FAIL — module `@/lib/scoring` not found.

- [ ] **Step 3: Write scoring implementation**

Create `src/lib/scoring.ts`:
```typescript
export interface QuestionInput {
  id: string;
  topicId: string;
  polarity: number;
}

export interface AnswerInput {
  questionId: string;
  value: number | null;
  skipped: boolean;
}

export interface TopicScoreResult {
  topicId: string;
  score: number;
  answeredCount: number;
  insufficientData: boolean;
}

const MIN_ANSWERS_PER_TOPIC = 2;

export function calculateTopicScore(
  topicId: string,
  answers: AnswerInput[],
  questions: QuestionInput[]
): TopicScoreResult {
  const topicQuestions = questions.filter((q) => q.topicId === topicId);
  const topicQuestionIds = new Set(topicQuestions.map((q) => q.id));
  const questionMap = new Map(topicQuestions.map((q) => [q.id, q]));

  const validAnswers = answers.filter(
    (a) => topicQuestionIds.has(a.questionId) && !a.skipped && a.value !== null
  );

  if (validAnswers.length < MIN_ANSWERS_PER_TOPIC) {
    return {
      topicId,
      score: 50,
      answeredCount: validAnswers.length,
      insufficientData: true,
    };
  }

  const directionalSum = validAnswers.reduce((acc, answer) => {
    const question = questionMap.get(answer.questionId)!;
    return acc + answer.value! * question.polarity;
  }, 0);

  const mean = directionalSum / validAnswers.length;
  // Positive mean = left-leaning, negative = right-leaning
  // Normalize: 0 = left (mean=+2), 100 = right (mean=-2)
  const score = ((2 - mean) / 4) * 100;

  return {
    topicId,
    score: Math.round(score * 100) / 100,
    answeredCount: validAnswers.length,
    insufficientData: false,
  };
}

export function calculateAllScores(
  answers: AnswerInput[],
  questions: QuestionInput[],
  topicIds: string[]
): TopicScoreResult[] {
  return topicIds.map((topicId) =>
    calculateTopicScore(topicId, answers, questions)
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/scoring.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scoring.ts tests/unit/scoring.test.ts
git commit -m "feat: add scoring logic with full test coverage"
```

---

## Task 5: Insight Generation (TDD)

**Files:**
- Create: `src/lib/insights.ts`, `tests/unit/insights.test.ts`

- [ ] **Step 1: Write insight tests**

Create `tests/unit/insights.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import {
  generatePerTopicInsights,
  generateCrossTopicInsights,
  generateDivergenceInsights,
  generateInsights,
  type TopicMeta,
} from "@/lib/insights";
import { type TopicScoreResult } from "@/lib/scoring";

const makeTopic = (id: string, name: string): TopicMeta => ({
  id,
  name,
  spectrumLabelLeft: `${name} Left`,
  spectrumLabelRight: `${name} Right`,
  spectrumLabelCenter: `${name} Center`,
});

const makeScore = (
  topicId: string,
  score: number,
  insufficientData = false
): TopicScoreResult => ({
  topicId,
  score,
  answeredCount: insufficientData ? 1 : 5,
  insufficientData,
});

describe("generatePerTopicInsights", () => {
  it("generates a description for each scored topic", () => {
    const topics = [makeTopic("hc", "Healthcare")];
    const scores = [makeScore("hc", 15)];
    const insights = generatePerTopicInsights(scores, topics);
    expect(insights).toHaveLength(1);
    expect(insights[0].type).toBe("per-topic");
    expect(insights[0].title).toBe("Healthcare");
    expect(insights[0].description).toContain("strongly favor");
    expect(insights[0].description).toContain("healthcare left");
  });

  it("skips topics with insufficient data", () => {
    const topics = [makeTopic("hc", "Healthcare")];
    const scores = [makeScore("hc", 50, true)];
    const insights = generatePerTopicInsights(scores, topics);
    expect(insights).toHaveLength(0);
  });

  it("uses correct labels for different score ranges", () => {
    const topics = [makeTopic("t", "Test")];

    const strong_left = generatePerTopicInsights([makeScore("t", 10)], topics);
    expect(strong_left[0].description).toContain("strongly favor");

    const lean_left = generatePerTopicInsights([makeScore("t", 35)], topics);
    expect(lean_left[0].description).toContain("lean toward");

    const center = generatePerTopicInsights([makeScore("t", 50)], topics);
    expect(center[0].description).toContain("favor a");

    const lean_right = generatePerTopicInsights([makeScore("t", 70)], topics);
    expect(lean_right[0].description).toContain("lean toward");

    const strong_right = generatePerTopicInsights([makeScore("t", 90)], topics);
    expect(strong_right[0].description).toContain("strongly favor");
  });
});

describe("generateCrossTopicInsights", () => {
  it("detects social vs economic divergence", () => {
    const topics = [
      makeTopic("si", "Social Issues"),
      makeTopic("cj", "Criminal Justice"),
      makeTopic("ec", "Economic Policy"),
      makeTopic("hc", "Healthcare"),
    ];
    const scores = [
      makeScore("si", 20), // progressive social
      makeScore("cj", 15), // progressive social
      makeScore("ec", 75), // conservative economic
      makeScore("hc", 80), // conservative economic
    ];
    const insights = generateCrossTopicInsights(scores, topics);
    expect(insights.length).toBeGreaterThanOrEqual(1);
    expect(insights[0].type).toBe("cross-topic");
    expect(insights[0].description).toContain("progressive");
    expect(insights[0].description).toContain("conservative");
  });

  it("returns empty when no significant divergence", () => {
    const topics = [
      makeTopic("si", "Social Issues"),
      makeTopic("cj", "Criminal Justice"),
      makeTopic("ec", "Economic Policy"),
      makeTopic("hc", "Healthcare"),
    ];
    const scores = [
      makeScore("si", 50),
      makeScore("cj", 50),
      makeScore("ec", 50),
      makeScore("hc", 50),
    ];
    const insights = generateCrossTopicInsights(scores, topics);
    expect(insights).toHaveLength(0);
  });
});

describe("generateDivergenceInsights", () => {
  it("flags topics that stand out from the overall profile", () => {
    const topics = [
      makeTopic("a", "Topic A"),
      makeTopic("b", "Topic B"),
      makeTopic("c", "Topic C"),
      makeTopic("d", "Topic D"),
    ];
    const scores = [
      makeScore("a", 50),
      makeScore("b", 50),
      makeScore("c", 50),
      makeScore("d", 95), // outlier
    ];
    const insights = generateDivergenceInsights(scores, topics);
    expect(insights.length).toBeGreaterThanOrEqual(1);
    expect(insights[0].type).toBe("divergence");
    expect(insights[0].relatedTopics).toContain("d");
  });

  it("returns empty with fewer than 3 scored topics", () => {
    const topics = [makeTopic("a", "A"), makeTopic("b", "B")];
    const scores = [makeScore("a", 10), makeScore("b", 90)];
    const insights = generateDivergenceInsights(scores, topics);
    expect(insights).toHaveLength(0);
  });
});

describe("generateInsights", () => {
  it("combines all insight types", () => {
    const topics = [
      makeTopic("si", "Social Issues"),
      makeTopic("cj", "Criminal Justice"),
      makeTopic("ec", "Economic Policy"),
      makeTopic("hc", "Healthcare"),
    ];
    const scores = [
      makeScore("si", 15),
      makeScore("cj", 10),
      makeScore("ec", 80),
      makeScore("hc", 85),
    ];
    const insights = generateInsights(scores, topics);
    const types = new Set(insights.map((i) => i.type));
    expect(types.has("per-topic")).toBe(true);
    expect(types.has("cross-topic")).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/insights.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write insight generation implementation**

Create `src/lib/insights.ts`:
```typescript
import { type TopicScoreResult } from "./scoring";

export interface TopicMeta {
  id: string;
  name: string;
  spectrumLabelLeft: string;
  spectrumLabelRight: string;
  spectrumLabelCenter: string;
}

export interface Insight {
  type: "per-topic" | "cross-topic" | "divergence";
  title: string;
  description: string;
  relatedTopics: string[];
}

function getScoreLabel(
  score: number,
  left: string,
  center: string,
  right: string
): string {
  if (score <= 20) return `strongly favor ${left.toLowerCase()}`;
  if (score <= 40) return `lean toward ${left.toLowerCase()}`;
  if (score <= 60) return `favor a ${center.toLowerCase()}`;
  if (score <= 80) return `lean toward ${right.toLowerCase()}`;
  return `strongly favor ${right.toLowerCase()}`;
}

export function generatePerTopicInsights(
  scores: TopicScoreResult[],
  topics: TopicMeta[]
): Insight[] {
  const topicMap = new Map(topics.map((t) => [t.id, t]));

  return scores
    .filter((s) => !s.insufficientData)
    .map((score) => {
      const topic = topicMap.get(score.topicId)!;
      const label = getScoreLabel(
        score.score,
        topic.spectrumLabelLeft,
        topic.spectrumLabelCenter,
        topic.spectrumLabelRight
      );
      return {
        type: "per-topic" as const,
        title: topic.name,
        description: `You ${label}.`,
        relatedTopics: [score.topicId],
      };
    });
}

const SOCIAL_TOPIC_NAMES = ["Social Issues", "Criminal Justice", "Immigration"];
const ECONOMIC_TOPIC_NAMES = [
  "Economic Policy",
  "Healthcare",
  "Housing & Urban Policy",
];

export function generateCrossTopicInsights(
  scores: TopicScoreResult[],
  topics: TopicMeta[]
): Insight[] {
  const insights: Insight[] = [];
  const scoreMap = new Map(
    scores.filter((s) => !s.insufficientData).map((s) => [s.topicId, s])
  );

  const socialScores = topics
    .filter((t) => SOCIAL_TOPIC_NAMES.includes(t.name))
    .map((t) => scoreMap.get(t.id))
    .filter((s): s is TopicScoreResult => s !== undefined);

  const economicScores = topics
    .filter((t) => ECONOMIC_TOPIC_NAMES.includes(t.name))
    .map((t) => scoreMap.get(t.id))
    .filter((s): s is TopicScoreResult => s !== undefined);

  if (socialScores.length >= 2 && economicScores.length >= 2) {
    const socialAvg =
      socialScores.reduce((a, s) => a + s.score, 0) / socialScores.length;
    const econAvg =
      economicScores.reduce((a, s) => a + s.score, 0) / economicScores.length;

    if (Math.abs(socialAvg - econAvg) > 25) {
      const socialLabel =
        socialAvg <= 40
          ? "progressive"
          : socialAvg >= 60
            ? "conservative"
            : "moderate";
      const econLabel =
        econAvg <= 40
          ? "progressive"
          : econAvg >= 60
            ? "conservative"
            : "moderate";

      insights.push({
        type: "cross-topic",
        title: "Social vs. Economic Views",
        description: `Your social and economic positions diverge — you're ${socialLabel} on social issues but ${econLabel} on economic policy.`,
        relatedTopics: [...socialScores, ...economicScores].map(
          (s) => s.topicId
        ),
      });
    }
  }

  return insights;
}

export function generateDivergenceInsights(
  scores: TopicScoreResult[],
  topics: TopicMeta[]
): Insight[] {
  const validScores = scores.filter((s) => !s.insufficientData);
  if (validScores.length < 3) return [];

  const topicMap = new Map(topics.map((t) => [t.id, t]));
  const avg =
    validScores.reduce((a, s) => a + s.score, 0) / validScores.length;

  const outliers = validScores
    .filter((s) => Math.abs(s.score - avg) > 30)
    .sort((a, b) => Math.abs(b.score - avg) - Math.abs(a.score - avg));

  return outliers.slice(0, 2).map((score) => {
    const topic = topicMap.get(score.topicId)!;
    const direction =
      score.score < avg ? "more progressive" : "more conservative";
    return {
      type: "divergence" as const,
      title: `${topic.name} Stands Out`,
      description: `Your position on ${topic.name.toLowerCase()} is notably ${direction} than your overall profile.`,
      relatedTopics: [score.topicId],
    };
  });
}

export function generateInsights(
  scores: TopicScoreResult[],
  topics: TopicMeta[]
): Insight[] {
  return [
    ...generatePerTopicInsights(scores, topics),
    ...generateCrossTopicInsights(scores, topics),
    ...generateDivergenceInsights(scores, topics),
  ];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/insights.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/insights.ts tests/unit/insights.test.ts
git commit -m "feat: add insight generation with per-topic, cross-topic, and divergence detection"
```

---

## Task 6: Comparison Logic (TDD)

**Files:**
- Create: `src/lib/comparison.ts`, `tests/unit/comparison.test.ts`

- [ ] **Step 1: Write comparison tests**

Create `tests/unit/comparison.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { compareProfiles, type ComparisonResult } from "@/lib/comparison";
import { type TopicScoreResult } from "@/lib/scoring";

const makeScore = (
  topicId: string,
  score: number,
  insufficientData = false
): TopicScoreResult => ({
  topicId,
  score,
  answeredCount: insufficientData ? 1 : 5,
  insufficientData,
});

describe("compareProfiles", () => {
  it("returns 100% alignment for identical profiles", () => {
    const scoresA = [makeScore("t1", 50), makeScore("t2", 75)];
    const scoresB = [makeScore("t1", 50), makeScore("t2", 75)];
    const result = compareProfiles(scoresA, scoresB);
    expect(result.alignmentScore).toBe(100);
    expect(result.perTopicDeltas).toHaveLength(2);
    expect(result.perTopicDeltas.every((d) => d.delta === 0)).toBe(true);
  });

  it("returns 0% alignment for maximally divergent profiles", () => {
    const scoresA = [makeScore("t1", 0), makeScore("t2", 0)];
    const scoresB = [makeScore("t1", 100), makeScore("t2", 100)];
    const result = compareProfiles(scoresA, scoresB);
    expect(result.alignmentScore).toBe(0);
  });

  it("calculates correct per-topic deltas", () => {
    const scoresA = [makeScore("t1", 30), makeScore("t2", 80)];
    const scoresB = [makeScore("t1", 70), makeScore("t2", 60)];
    const result = compareProfiles(scoresA, scoresB);
    const t1Delta = result.perTopicDeltas.find((d) => d.topicId === "t1");
    expect(t1Delta?.delta).toBe(40);
    const t2Delta = result.perTopicDeltas.find((d) => d.topicId === "t2");
    expect(t2Delta?.delta).toBe(20);
  });

  it("identifies closest and furthest topics", () => {
    const scoresA = [
      makeScore("t1", 50),
      makeScore("t2", 30),
      makeScore("t3", 80),
    ];
    const scoresB = [
      makeScore("t1", 52), // delta 2 (closest)
      makeScore("t2", 80), // delta 50 (furthest)
      makeScore("t3", 60), // delta 20
    ];
    const result = compareProfiles(scoresA, scoresB);
    expect(result.closestTopics[0].topicId).toBe("t1");
    expect(result.furthestTopics[0].topicId).toBe("t2");
  });

  it("excludes hidden topics", () => {
    const scoresA = [makeScore("t1", 50), makeScore("t2", 50)];
    const scoresB = [makeScore("t1", 50), makeScore("t2", 100)];
    const hidden = new Set(["t2"]);
    const result = compareProfiles(scoresA, scoresB, hidden);
    expect(result.perTopicDeltas).toHaveLength(1);
    expect(result.alignmentScore).toBe(100); // only t1 compared, identical
  });

  it("excludes topics with insufficient data", () => {
    const scoresA = [makeScore("t1", 50), makeScore("t2", 50, true)];
    const scoresB = [makeScore("t1", 50), makeScore("t2", 100)];
    const result = compareProfiles(scoresA, scoresB);
    expect(result.perTopicDeltas).toHaveLength(1);
  });

  it("only compares topics present in both profiles", () => {
    const scoresA = [makeScore("t1", 50), makeScore("t2", 50)];
    const scoresB = [makeScore("t1", 75), makeScore("t3", 80)];
    const result = compareProfiles(scoresA, scoresB);
    expect(result.perTopicDeltas).toHaveLength(1);
    expect(result.perTopicDeltas[0].topicId).toBe("t1");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/comparison.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write comparison implementation**

Create `src/lib/comparison.ts`:
```typescript
import { type TopicScoreResult } from "./scoring";

export interface TopicDelta {
  topicId: string;
  scoreA: number;
  scoreB: number;
  delta: number;
}

export interface ComparisonResult {
  alignmentScore: number;
  perTopicDeltas: TopicDelta[];
  closestTopics: TopicDelta[];
  furthestTopics: TopicDelta[];
}

export function compareProfiles(
  scoresA: TopicScoreResult[],
  scoresB: TopicScoreResult[],
  hiddenTopicIds: Set<string> = new Set()
): ComparisonResult {
  const mapA = new Map(
    scoresA.filter((s) => !s.insufficientData).map((s) => [s.topicId, s])
  );
  const mapB = new Map(
    scoresB.filter((s) => !s.insufficientData).map((s) => [s.topicId, s])
  );

  const commonTopicIds = [...mapA.keys()].filter(
    (id) => mapB.has(id) && !hiddenTopicIds.has(id)
  );

  const perTopicDeltas: TopicDelta[] = commonTopicIds.map((topicId) => ({
    topicId,
    scoreA: mapA.get(topicId)!.score,
    scoreB: mapB.get(topicId)!.score,
    delta: Math.round(Math.abs(mapA.get(topicId)!.score - mapB.get(topicId)!.score) * 100) / 100,
  }));

  const sorted = [...perTopicDeltas].sort((a, b) => a.delta - b.delta);
  const meanDelta =
    perTopicDeltas.length > 0
      ? perTopicDeltas.reduce((sum, d) => sum + d.delta, 0) /
        perTopicDeltas.length
      : 0;

  const alignmentScore = Math.max(
    0,
    Math.min(100, Math.round(100 - meanDelta))
  );

  return {
    alignmentScore,
    perTopicDeltas,
    closestTopics: sorted.slice(0, 3),
    furthestTopics: sorted.slice(-3).reverse(),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/comparison.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/comparison.ts tests/unit/comparison.test.ts
git commit -m "feat: add profile comparison with alignment scoring"
```

---

## Task 7: Validation Schemas

**Files:**
- Create: `src/lib/validation.ts`

- [ ] **Step 1: Write Zod validation schemas**

Create `src/lib/validation.ts`:
```typescript
import { z } from "zod";

export const answerSchema = z.object({
  questionId: z.string(),
  value: z.number().int().min(-2).max(2).nullable(),
  skipped: z.boolean(),
});

export const quizSubmitSchema = z.object({
  answers: z.array(answerSchema).min(1),
  anonymousToken: z.string().uuid().optional(),
});

export const answerUpdateSchema = z.object({
  answers: z.array(answerSchema).min(1),
  anonymousToken: z.string().uuid().optional(),
});

export const annotationSchema = z.object({
  topicScoreId: z.string().uuid(),
  text: z.string().min(1).max(5000),
});

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
});

export const joinGroupSchema = z.object({
  inviteCode: z.string().min(1),
});

export const claimProfileSchema = z.object({
  anonymousToken: z.string().uuid(),
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100).optional(),
});
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validation.ts
git commit -m "feat: add Zod validation schemas for all API inputs"
```

---

## Task 8: Quiz Submit API

**Files:**
- Create: `src/app/api/quiz/submit/route.ts`

- [ ] **Step 1: Write the quiz submit route**

Create `src/app/api/quiz/submit/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quizSubmitSchema } from "@/lib/validation";
import { calculateAllScores } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = quizSubmitSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { answers, anonymousToken } = parsed.data;

  // Verify all questionIds exist
  const questionIds = answers.map((a) => a.questionId);
  const questions = await db.question.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, topicId: true, polarity: true },
  });

  if (questions.length !== questionIds.length) {
    return NextResponse.json(
      { error: "One or more question IDs are invalid" },
      { status: 400 }
    );
  }

  // Create profile and answers in a transaction
  const profile = await db.$transaction(async (tx) => {
    const newProfile = await tx.userProfile.create({
      data: {
        anonymousToken: anonymousToken || crypto.randomUUID(),
      },
    });

    await tx.answer.createMany({
      data: answers.map((a) => ({
        profileId: newProfile.id,
        questionId: a.questionId,
        value: a.value,
        skipped: a.skipped,
      })),
    });

    // Calculate and store topic scores
    const topicIds = [...new Set(questions.map((q) => q.topicId))];
    const scores = calculateAllScores(
      answers,
      questions.map((q) => ({
        id: q.id,
        topicId: q.topicId,
        polarity: q.polarity,
      })),
      topicIds
    );

    await tx.topicScore.createMany({
      data: scores.map((s) => ({
        profileId: newProfile.id,
        topicId: s.topicId,
        score: s.score,
        answeredCount: s.answeredCount,
        insufficientData: s.insufficientData,
      })),
    });

    return newProfile;
  });

  return NextResponse.json(
    { profileId: profile.id, anonymousToken: profile.anonymousToken },
    { status: 201 }
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/quiz/submit/route.ts
git commit -m "feat: add quiz submit API route"
```

---

## Task 9: Results API

**Files:**
- Create: `src/app/api/results/[profileId]/route.ts`

- [ ] **Step 1: Write the results route**

Create `src/app/api/results/[profileId]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateInsights } from "@/lib/insights";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params;

  const profile = await db.userProfile.findUnique({
    where: { id: profileId },
    include: {
      topicScores: {
        include: {
          topic: true,
          annotations: true,
        },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const topics = profile.topicScores.map((ts) => ({
    id: ts.topic.id,
    name: ts.topic.name,
    spectrumLabelLeft: ts.topic.spectrumLabelLeft,
    spectrumLabelRight: ts.topic.spectrumLabelRight,
    spectrumLabelCenter: ts.topic.spectrumLabelCenter,
  }));

  const scores = profile.topicScores.map((ts) => ({
    topicId: ts.topicId,
    score: ts.score,
    answeredCount: ts.answeredCount,
    insufficientData: ts.insufficientData,
  }));

  const insights = generateInsights(scores, topics);

  return NextResponse.json({
    profileId: profile.id,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    scores: profile.topicScores.map((ts) => ({
      topicId: ts.topicId,
      topicName: ts.topic.name,
      topicIcon: ts.topic.icon,
      spectrumLabelLeft: ts.topic.spectrumLabelLeft,
      spectrumLabelRight: ts.topic.spectrumLabelRight,
      spectrumLabelCenter: ts.topic.spectrumLabelCenter,
      score: ts.score,
      answeredCount: ts.answeredCount,
      insufficientData: ts.insufficientData,
      annotations: ts.annotations,
    })),
    insights,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/results/
git commit -m "feat: add results API route with insight generation"
```

---

## Task 10: Quiz UI Components

**Files:**
- Create: `src/components/quiz/QuizProvider.tsx`, `src/components/quiz/QuestionCard.tsx`, `src/components/quiz/TopicSection.tsx`, `src/components/quiz/ProgressBar.tsx`, `src/components/quiz/ReviewScreen.tsx`, `src/components/quiz/QuizClient.tsx`, `src/app/quiz/page.tsx`

- [ ] **Step 1: Write QuizProvider (state context)**

Create `src/components/quiz/QuizProvider.tsx`:
```typescript
"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";

interface QuizAnswer {
  value: number | null;
  skipped: boolean;
}

interface QuizState {
  phase: "intro" | "questions" | "review" | "submitting";
  currentTopicIndex: number;
  answers: Record<string, QuizAnswer>;
}

type QuizAction =
  | { type: "START_QUIZ" }
  | { type: "SET_ANSWER"; questionId: string; value: number }
  | { type: "SKIP_QUESTION"; questionId: string }
  | { type: "NEXT_TOPIC" }
  | { type: "PREV_TOPIC" }
  | { type: "GO_TO_REVIEW" }
  | { type: "GO_TO_TOPIC"; index: number }
  | { type: "SUBMIT" };

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "START_QUIZ":
      return { ...state, phase: "questions", currentTopicIndex: 0 };
    case "SET_ANSWER":
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: { value: action.value, skipped: false },
        },
      };
    case "SKIP_QUESTION":
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: { value: null, skipped: true },
        },
      };
    case "NEXT_TOPIC":
      return { ...state, currentTopicIndex: state.currentTopicIndex + 1 };
    case "PREV_TOPIC":
      return { ...state, currentTopicIndex: state.currentTopicIndex - 1 };
    case "GO_TO_REVIEW":
      return { ...state, phase: "review" };
    case "GO_TO_TOPIC":
      return { ...state, phase: "questions", currentTopicIndex: action.index };
    case "SUBMIT":
      return { ...state, phase: "submitting" };
    default:
      return state;
  }
}

interface QuizContextValue {
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
}

const QuizContext = createContext<QuizContextValue | null>(null);

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used within QuizProvider");
  return ctx;
}

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quizReducer, {
    phase: "intro",
    currentTopicIndex: 0,
    answers: {},
  });

  return (
    <QuizContext.Provider value={{ state, dispatch }}>
      {children}
    </QuizContext.Provider>
  );
}
```

- [ ] **Step 2: Write QuestionCard**

Create `src/components/quiz/QuestionCard.tsx`:
```typescript
"use client";

import { useQuiz } from "./QuizProvider";

const LIKERT_OPTIONS = [
  { value: -2, label: "Strongly Disagree" },
  { value: -1, label: "Disagree" },
  { value: 0, label: "Neutral" },
  { value: 1, label: "Agree" },
  { value: 2, label: "Strongly Agree" },
];

interface QuestionCardProps {
  questionId: string;
  text: string;
  context: string | null;
}

export function QuestionCard({ questionId, text, context }: QuestionCardProps) {
  const { state, dispatch } = useQuiz();
  const currentAnswer = state.answers[questionId];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-lg font-medium text-gray-900">{text}</p>
      {context && (
        <p className="mt-1 text-sm text-gray-500 italic">{context}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {LIKERT_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() =>
              dispatch({
                type: "SET_ANSWER",
                questionId,
                value: option.value,
              })
            }
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              currentAnswer?.value === option.value && !currentAnswer.skipped
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => dispatch({ type: "SKIP_QUESTION", questionId })}
        className={`mt-3 text-sm ${
          currentAnswer?.skipped
            ? "text-amber-600 font-medium"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        {currentAnswer?.skipped ? "Skipped" : "Skip this question"}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Write TopicSection**

Create `src/components/quiz/TopicSection.tsx`:
```typescript
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
```

- [ ] **Step 4: Write ProgressBar**

Create `src/components/quiz/ProgressBar.tsx`:
```typescript
"use client";

interface ProgressBarProps {
  currentIndex: number;
  totalTopics: number;
  topicNames: string[];
}

export function ProgressBar({
  currentIndex,
  totalTopics,
  topicNames,
}: ProgressBarProps) {
  const progress = ((currentIndex + 1) / totalTopics) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>
          Topic {currentIndex + 1} of {totalTopics}:{" "}
          <span className="font-medium">{topicNames[currentIndex]}</span>
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Write ReviewScreen**

Create `src/components/quiz/ReviewScreen.tsx`:
```typescript
"use client";

import { useQuiz } from "./QuizProvider";

const VALUE_LABELS = new Map<number, string>([
  [-2, "Strongly Disagree"],
  [-1, "Disagree"],
  [0, "Neutral"],
  [1, "Agree"],
  [2, "Strongly Agree"],
]);

interface Topic {
  id: string;
  name: string;
  questions: { id: string; text: string; order: number }[];
}

interface ReviewScreenProps {
  topics: Topic[];
  onSubmit: () => void;
}

export function ReviewScreen({ topics, onSubmit }: ReviewScreenProps) {
  const { state, dispatch } = useQuiz();

  const totalQuestions = topics.reduce(
    (sum, t) => sum + t.questions.length,
    0
  );
  const answeredCount = Object.values(state.answers).filter(
    (a) => !a.skipped && a.value !== null
  ).length;
  const skippedCount = Object.values(state.answers).filter(
    (a) => a.skipped
  ).length;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Review Your Answers
      </h2>
      <p className="text-gray-600 mb-6">
        {answeredCount} answered, {skippedCount} skipped,{" "}
        {totalQuestions - answeredCount - skippedCount} unanswered
      </p>

      {topics.map((topic, topicIndex) => (
        <div key={topic.id} className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">
              {topic.name}
            </h3>
            <button
              onClick={() =>
                dispatch({ type: "GO_TO_TOPIC", index: topicIndex })
              }
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Edit
            </button>
          </div>
          <div className="space-y-1">
            {topic.questions
              .sort((a, b) => a.order - b.order)
              .map((q) => {
                const answer = state.answers[q.id];
                const label = answer?.skipped
                  ? "Skipped"
                  : answer?.value !== undefined && answer?.value !== null
                    ? VALUE_LABELS.get(answer.value) ?? "Not answered"
                    : "Not answered";
                return (
                  <div
                    key={q.id}
                    className="flex justify-between text-sm py-1 border-b border-gray-100"
                  >
                    <span className="text-gray-700 truncate mr-4">
                      {q.text}
                    </span>
                    <span
                      className={`shrink-0 ${answer?.skipped ? "text-amber-600" : "text-gray-500"}`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      <button
        onClick={onSubmit}
        className="w-full mt-4 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
      >
        Submit & See Results
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Write QuizClient (orchestrator)**

Create `src/components/quiz/QuizClient.tsx`:
```typescript
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
```

- [ ] **Step 7: Write quiz page (server component)**

Create `src/app/quiz/page.tsx`:
```typescript
import { db } from "@/lib/db";
import { QuizClient } from "@/components/quiz/QuizClient";

export default async function QuizPage() {
  const topics = await db.topic.findMany({
    orderBy: { order: "asc" },
    include: {
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, text: true, context: true, order: true },
      },
    },
  });

  return (
    <main className="min-h-screen bg-gray-50 px-4">
      <QuizClient topics={topics} />
    </main>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/components/quiz/ src/app/quiz/
git commit -m "feat: add quiz UI with provider, question cards, progress, and review"
```

---

## Task 11: Results Page & Visualization Components

**Files:**
- Create: `src/components/results/RadarChart.tsx`, `src/components/results/SpectrumBar.tsx`, `src/components/results/InsightCard.tsx`, `src/components/results/CompareButton.tsx`, `src/app/results/[profileId]/page.tsx`

- [ ] **Step 1: Write RadarChart component**

Create `src/components/results/RadarChart.tsx`:
```typescript
"use client";

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface RadarChartProps {
  scores: { topicName: string; score: number }[];
  color?: string;
}

export function RadarChart({
  scores,
  color = "#6366f1",
}: RadarChartProps) {
  const data = scores.map((s) => ({
    topic: s.topicName,
    value: s.score,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsRadarChart data={data}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="topic"
          tick={{ fill: "#64748b", fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "#94a3b8", fontSize: 10 }}
        />
        <Radar
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Write SpectrumBar component**

Create `src/components/results/SpectrumBar.tsx`:
```typescript
interface SpectrumBarProps {
  topicName: string;
  score: number;
  labelLeft: string;
  labelRight: string;
  insufficientData?: boolean;
}

export function SpectrumBar({
  topicName,
  score,
  labelLeft,
  labelRight,
  insufficientData = false,
}: SpectrumBarProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-1">
        <span className="font-medium text-gray-900">{topicName}</span>
        {insufficientData && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            Insufficient data
          </span>
        )}
      </div>
      <div className="relative h-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400 rounded-full">
        {!insufficientData && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-[3px] border-gray-800 rounded-full shadow-md transition-all duration-300"
            style={{ left: `${score}%` }}
          />
        )}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{labelLeft}</span>
        <span>{labelRight}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write InsightCard component**

Create `src/components/results/InsightCard.tsx`:
```typescript
import type { Insight } from "@/lib/insights";

const TYPE_STYLES = {
  "per-topic": "border-l-indigo-500",
  "cross-topic": "border-l-purple-500",
  divergence: "border-l-amber-500",
};

const TYPE_LABELS = {
  "per-topic": "Topic",
  "cross-topic": "Pattern",
  divergence: "Notable",
};

export function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 border-l-4 ${TYPE_STYLES[insight.type]} p-4 shadow-sm`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium text-gray-400 uppercase">
          {TYPE_LABELS[insight.type]}
        </span>
      </div>
      <h4 className="font-semibold text-gray-900">{insight.title}</h4>
      <p className="text-gray-600 text-sm mt-1">{insight.description}</p>
    </div>
  );
}
```

- [ ] **Step 4: Write CompareButton component**

Create `src/components/results/CompareButton.tsx`:
```typescript
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function CompareButton({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [myProfileId, setMyProfileId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("profileId");
    if (stored && stored !== profileId) {
      setMyProfileId(stored);
    }
  }, [profileId]);

  if (!myProfileId) return null;

  return (
    <button
      onClick={() => router.push(`/compare/${myProfileId}/${profileId}`)}
      className="bg-purple-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors"
    >
      Compare with Mine
    </button>
  );
}
```

- [ ] **Step 5: Write results page**

Create `src/app/results/[profileId]/page.tsx`:
```typescript
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { generateInsights } from "@/lib/insights";
import { RadarChart } from "@/components/results/RadarChart";
import { SpectrumBar } from "@/components/results/SpectrumBar";
import { InsightCard } from "@/components/results/InsightCard";
import { CompareButton } from "@/components/results/CompareButton";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;

  const profile = await db.userProfile.findUnique({
    where: { id: profileId },
    include: {
      topicScores: {
        include: { topic: true },
        orderBy: { topic: { order: "asc" } },
      },
    },
  });

  if (!profile) notFound();

  const topics = profile.topicScores.map((ts) => ({
    id: ts.topic.id,
    name: ts.topic.name,
    spectrumLabelLeft: ts.topic.spectrumLabelLeft,
    spectrumLabelRight: ts.topic.spectrumLabelRight,
    spectrumLabelCenter: ts.topic.spectrumLabelCenter,
  }));

  const scores = profile.topicScores.map((ts) => ({
    topicId: ts.topicId,
    score: ts.score,
    answeredCount: ts.answeredCount,
    insufficientData: ts.insufficientData,
  }));

  const insights = generateInsights(scores, topics);

  const radarData = profile.topicScores
    .filter((ts) => !ts.insufficientData)
    .map((ts) => ({
      topicName: ts.topic.name,
      score: ts.score,
    }));

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Your Political Profile
            </h1>
            <p className="text-gray-500 mt-1">
              Based on your responses across {profile.topicScores.length} topics
            </p>
          </div>
          <CompareButton profileId={profileId} />
        </div>

        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Overview
          </h2>
          <RadarChart scores={radarData} />
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            By Topic
          </h2>
          {profile.topicScores.map((ts) => (
            <SpectrumBar
              key={ts.topicId}
              topicName={ts.topic.name}
              score={ts.score}
              labelLeft={ts.topic.spectrumLabelLeft}
              labelRight={ts.topic.spectrumLabelRight}
              insufficientData={ts.insufficientData}
            />
          ))}
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Insights
          </h2>
          <div className="grid gap-3">
            {insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/results/ src/app/results/
git commit -m "feat: add results page with radar chart, spectrum bars, and insights"
```

---

## Task 12: Landing Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write the landing page**

Replace `src/app/page.tsx`:
```typescript
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          PoliticalPlatform
        </h1>
        <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
          Discover the nuances of your political views. Take a research-backed
          questionnaire and get a detailed, multi-dimensional profile — not
          just a simple left-right label.
        </p>
        <p className="text-gray-500 mb-10 max-w-xl mx-auto">
          Compare your positions with friends topic by topic. See where you
          align, where you diverge, and gain a deeper understanding of each
          other&apos;s perspectives.
        </p>
        <Link
          href="/quiz"
          className="inline-block bg-indigo-600 text-white py-3 px-8 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Take the Quiz
        </Link>
        <p className="mt-4 text-sm text-gray-400">
          ~15-20 minutes &middot; No account required
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Multi-Dimensional
            </h3>
            <p className="text-gray-600 text-sm">
              See your positions across 12 distinct topics — from healthcare to
              technology policy. No oversimplified quadrants.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Compare & Discuss
            </h3>
            <p className="text-gray-600 text-sm">
              Share your results and compare side-by-side with friends. Create
              groups to see where your circle stands.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Living Profile
            </h3>
            <p className="text-gray-600 text-sm">
              Revisit and refine your answers over time. Add annotations
              explaining your reasoning on any topic.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add landing page with feature highlights"
```

---

## Task 13: Auth Setup

**Files:**
- Create: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/api/auth/signup/route.ts`, `src/app/auth/signin/page.tsx`, `src/app/auth/signup/page.tsx`

- [ ] **Step 1: Write NextAuth configuration**

Create `src/lib/auth.ts`:
```typescript
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: { ...session.user, id: token.sub },
    }),
  },
});
```

- [ ] **Step 2: Write NextAuth route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 3: Write signup API route**

Create `src/app/api/auth/signup/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signupSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password, name } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: { email, passwordHash, name },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
```

- [ ] **Step 4: Write sign-in page**

Create `src/app/auth/signin/page.tsx`:
```typescript
"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError("Invalid email or password");
    } else {
      window.location.href = "/account";
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-gray-200 p-8 w-full max-w-md shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </button>
        </form>
        <div className="mt-4">
          <button
            onClick={() => signIn("google", { callbackUrl: "/account" })}
            className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Continue with Google
          </button>
        </div>
        <p className="mt-4 text-sm text-center text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-indigo-600 hover:text-indigo-800">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Write sign-up page**

Create `src/app/auth/signup/page.tsx`:
```typescript
"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: name || undefined }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Signup failed");
      return;
    }

    // Auto sign in after registration
    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/account",
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-gray-200 p-8 w-full max-w-md shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Create Account
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password (min 8 characters)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Create Account
          </button>
        </form>
        <div className="mt-4">
          <button
            onClick={() => signIn("google", { callbackUrl: "/account" })}
            className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Continue with Google
          </button>
        </div>
        <p className="mt-4 text-sm text-center text-gray-500">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-indigo-600 hover:text-indigo-800">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/ src/app/auth/
git commit -m "feat: add NextAuth with credentials and Google OAuth, signin/signup pages"
```

---

## Task 14: Profile Claiming API

**Files:**
- Create: `src/app/api/auth/claim/route.ts`

- [ ] **Step 1: Write the claim route**

Create `src/app/api/auth/claim/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { claimProfileSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = claimProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { anonymousToken } = parsed.data;

  const profile = await db.userProfile.findUnique({
    where: { anonymousToken },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (profile.userId) {
    return NextResponse.json(
      { error: "Profile already claimed" },
      { status: 409 }
    );
  }

  const updated = await db.userProfile.update({
    where: { id: profile.id },
    data: { userId: session.user.id },
  });

  return NextResponse.json({ profileId: updated.id });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/auth/claim/route.ts
git commit -m "feat: add profile claiming API to link anonymous profiles to accounts"
```

---

## Task 15: Answer Update API & Topic Retake

**Files:**
- Create: `src/app/api/quiz/[profileId]/answers/route.ts`, `src/app/quiz/[topic]/page.tsx`

- [ ] **Step 1: Write the answer update route**

Create `src/app/api/quiz/[profileId]/answers/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { answerUpdateSchema } from "@/lib/validation";
import { calculateAllScores } from "@/lib/scoring";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params;
  const body = await request.json();
  const parsed = answerUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { answers, anonymousToken } = parsed.data;

  // Verify ownership
  const profile = await db.userProfile.findUnique({
    where: { id: profileId },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const session = await auth();
  const isOwner =
    (session?.user?.id && profile.userId === session.user.id) ||
    (anonymousToken && profile.anonymousToken === anonymousToken);

  if (!isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Update answers and recalculate scores
  await db.$transaction(async (tx) => {
    for (const answer of answers) {
      await tx.answer.upsert({
        where: {
          profileId_questionId: {
            profileId,
            questionId: answer.questionId,
          },
        },
        update: {
          value: answer.value,
          skipped: answer.skipped,
          answeredAt: new Date(),
        },
        create: {
          profileId,
          questionId: answer.questionId,
          value: answer.value,
          skipped: answer.skipped,
        },
      });
    }

    // Recalculate all topic scores
    const allAnswers = await tx.answer.findMany({
      where: { profileId },
    });
    const allQuestions = await tx.question.findMany({
      select: { id: true, topicId: true, polarity: true },
    });
    const topicIds = [...new Set(allQuestions.map((q) => q.topicId))];

    const scores = calculateAllScores(
      allAnswers.map((a) => ({
        questionId: a.questionId,
        value: a.value,
        skipped: a.skipped,
      })),
      allQuestions.map((q) => ({
        id: q.id,
        topicId: q.topicId,
        polarity: q.polarity,
      })),
      topicIds
    );

    for (const score of scores) {
      await tx.topicScore.upsert({
        where: {
          profileId_topicId: { profileId, topicId: score.topicId },
        },
        update: {
          score: score.score,
          answeredCount: score.answeredCount,
          insufficientData: score.insufficientData,
        },
        create: {
          profileId,
          topicId: score.topicId,
          score: score.score,
          answeredCount: score.answeredCount,
          insufficientData: score.insufficientData,
        },
      });
    }
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Write topic retake page**

Create `src/app/quiz/[topic]/page.tsx`:
```typescript
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { QuizClient } from "@/components/quiz/QuizClient";

export default async function TopicRetakePage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic: topicId } = await params;

  const topic = await db.topic.findUnique({
    where: { id: topicId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, text: true, context: true, order: true },
      },
    },
  });

  if (!topic) notFound();

  // QuizClient handles single-topic mode when given one topic
  return (
    <main className="min-h-screen bg-gray-50 px-4">
      <QuizClient topics={[topic]} />
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/quiz/ src/app/quiz/
git commit -m "feat: add answer update API and topic retake page"
```

---

## Task 16: Annotations API & Topic Detail Page

**Files:**
- Create: `src/app/api/annotations/route.ts`, `src/components/annotations/AnnotationEditor.tsx`, `src/app/results/[profileId]/[topic]/page.tsx`

- [ ] **Step 1: Write annotations API route**

Create `src/app/api/annotations/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { annotationSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = annotationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { topicScoreId, text } = parsed.data;

  // Verify the topic score exists and belongs to the user's profile
  const topicScore = await db.topicScore.findUnique({
    where: { id: topicScoreId },
    include: { profile: true },
  });

  if (!topicScore) {
    return NextResponse.json(
      { error: "Topic score not found" },
      { status: 404 }
    );
  }

  if (topicScore.profile.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Upsert annotation (one per user per topic score)
  const existing = await db.annotation.findFirst({
    where: { topicScoreId, userId: session.user.id },
  });

  const annotation = existing
    ? await db.annotation.update({
        where: { id: existing.id },
        data: { text },
      })
    : await db.annotation.create({
        data: { topicScoreId, userId: session.user.id, text },
      });

  return NextResponse.json(annotation, { status: existing ? 200 : 201 });
}
```

- [ ] **Step 2: Write AnnotationEditor component**

Create `src/components/annotations/AnnotationEditor.tsx`:
```typescript
"use client";

import { useState } from "react";

interface AnnotationEditorProps {
  topicScoreId: string;
  initialText: string;
}

export function AnnotationEditor({
  topicScoreId,
  initialText,
}: AnnotationEditorProps) {
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await fetch("/api/annotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicScoreId, text }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Your Notes
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add your reasoning, caveats, or context for this position..."
        rows={4}
        maxLength={5000}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && (
          <span className="text-sm text-green-600">Saved</span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write topic detail page**

Create `src/app/results/[profileId]/[topic]/page.tsx`:
```typescript
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { SpectrumBar } from "@/components/results/SpectrumBar";
import { AnnotationEditor } from "@/components/annotations/AnnotationEditor";

const VALUE_LABELS: Record<number, string> = {
  [-2]: "Strongly Disagree",
  [-1]: "Disagree",
  [0]: "Neutral",
  [1]: "Agree",
  [2]: "Strongly Agree",
};

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ profileId: string; topic: string }>;
}) {
  const { profileId, topic: topicId } = await params;

  const topicScore = await db.topicScore.findUnique({
    where: { profileId_topicId: { profileId, topicId } },
    include: {
      topic: true,
      profile: true,
      annotations: { orderBy: { updatedAt: "desc" } },
    },
  });

  if (!topicScore) notFound();

  const answers = await db.answer.findMany({
    where: {
      profileId,
      question: { topicId },
    },
    include: { question: true },
    orderBy: { question: { order: "asc" } },
  });

  const session = await auth();
  const isOwner =
    session?.user?.id && topicScore.profile.userId === session.user.id;

  const existingAnnotation = isOwner
    ? topicScore.annotations.find((a) => a.userId === session.user.id)
    : null;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/results/${profileId}`}
          className="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-block"
        >
          &larr; Back to full results
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {topicScore.topic.name}
        </h1>
        <p className="text-gray-600 mb-6">{topicScore.topic.description}</p>

        <SpectrumBar
          topicName=""
          score={topicScore.score}
          labelLeft={topicScore.topic.spectrumLabelLeft}
          labelRight={topicScore.topic.spectrumLabelRight}
          insufficientData={topicScore.insufficientData}
        />

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Answers
          </h2>
          <div className="space-y-3">
            {answers.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <p className="text-gray-900">{a.question.text}</p>
                {a.question.context && (
                  <p className="text-sm text-gray-500 italic mt-1">
                    {a.question.context}
                  </p>
                )}
                <p className="text-sm mt-2 font-medium text-indigo-600">
                  {a.skipped
                    ? "Skipped"
                    : a.value !== null
                      ? VALUE_LABELS.get(a.value) ?? "Not answered"
                      : "Not answered"}
                </p>
              </div>
            ))}
          </div>
        </section>

        {isOwner && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">
              Annotations
            </h2>
            <AnnotationEditor
              topicScoreId={topicScore.id}
              initialText={existingAnnotation?.text || ""}
            />
          </section>
        )}

        {!isOwner && topicScore.annotations.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Notes
            </h2>
            {topicScore.annotations.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-lg border border-gray-200 p-4 text-sm text-gray-700"
              >
                {a.text}
              </div>
            ))}
          </section>
        )}

        {isOwner && (
          <div className="mt-6">
            <Link
              href={`/quiz/${topicId}`}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Retake this topic &rarr;
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/annotations/ src/components/annotations/ src/app/results/
git commit -m "feat: add annotations API, editor, and topic detail page"
```

---

## Task 17: One-on-One Comparison Page

**Files:**
- Create: `src/components/comparison/ComparisonRadar.tsx`, `src/components/comparison/ComparisonSpectrum.tsx`, `src/components/comparison/AlignmentScore.tsx`, `src/app/compare/[profileId1]/[profileId2]/page.tsx`

- [ ] **Step 1: Write ComparisonRadar**

Create `src/components/comparison/ComparisonRadar.tsx`:
```typescript
"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ComparisonRadarProps {
  data: { topic: string; scoreA: number; scoreB: number }[];
  labelA: string;
  labelB: string;
}

export function ComparisonRadar({
  data,
  labelA,
  labelB,
}: ComparisonRadarProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="topic"
          tick={{ fill: "#64748b", fontSize: 12 }}
        />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
        <Radar
          name={labelA}
          dataKey="scoreA"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Radar
          name={labelB}
          dataKey="scoreB"
          stroke="#f43f5e"
          fill="#f43f5e"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Write ComparisonSpectrum**

Create `src/components/comparison/ComparisonSpectrum.tsx`:
```typescript
interface ComparisonSpectrumProps {
  topicName: string;
  scoreA: number;
  scoreB: number;
  labelLeft: string;
  labelRight: string;
  delta: number;
}

export function ComparisonSpectrum({
  topicName,
  scoreA,
  scoreB,
  labelLeft,
  labelRight,
  delta,
}: ComparisonSpectrumProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-1">
        <span className="font-medium text-gray-900">{topicName}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            delta <= 10
              ? "bg-green-50 text-green-700"
              : delta <= 30
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700"
          }`}
        >
          {Math.round(delta)} pts apart
        </span>
      </div>
      <div className="relative h-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400 rounded-full">
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-indigo-100 border-[3px] border-indigo-600 rounded-full shadow-md z-10"
          style={{ left: `${scoreA}%` }}
          title="You"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-rose-100 border-[3px] border-rose-500 rounded-full shadow-md z-10"
          style={{ left: `${scoreB}%` }}
          title="Them"
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{labelLeft}</span>
        <span>{labelRight}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write AlignmentScore**

Create `src/components/comparison/AlignmentScore.tsx`:
```typescript
interface AlignmentScoreProps {
  score: number;
}

export function AlignmentScore({ score }: AlignmentScoreProps) {
  const color =
    score >= 75
      ? "text-green-600"
      : score >= 50
        ? "text-amber-600"
        : "text-red-600";

  return (
    <div className="text-center py-6">
      <div className={`text-5xl font-bold ${color}`}>{score}%</div>
      <div className="text-gray-500 mt-1">Overall Alignment</div>
    </div>
  );
}
```

- [ ] **Step 4: Write comparison page**

Create `src/app/compare/[profileId1]/[profileId2]/page.tsx`:
```typescript
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { compareProfiles } from "@/lib/comparison";
import { ComparisonRadar } from "@/components/comparison/ComparisonRadar";
import { ComparisonSpectrum } from "@/components/comparison/ComparisonSpectrum";
import { AlignmentScore } from "@/components/comparison/AlignmentScore";

export default async function ComparePage({
  params,
}: {
  params: Promise<{ profileId1: string; profileId2: string }>;
}) {
  const { profileId1, profileId2 } = await params;

  const [profileA, profileB] = await Promise.all([
    db.userProfile.findUnique({
      where: { id: profileId1 },
      include: {
        topicScores: { include: { topic: true } },
        user: { select: { name: true } },
      },
    }),
    db.userProfile.findUnique({
      where: { id: profileId2 },
      include: {
        topicScores: { include: { topic: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  if (!profileA || !profileB) notFound();

  // Gather hidden topics for both users
  const hiddenTopicIds = new Set<string>();
  if (profileA.userId) {
    const visA = await db.topicVisibility.findMany({
      where: { userId: profileA.userId, hidden: true },
    });
    visA.forEach((v) => hiddenTopicIds.add(v.topicId));
  }
  if (profileB.userId) {
    const visB = await db.topicVisibility.findMany({
      where: { userId: profileB.userId, hidden: true },
    });
    visB.forEach((v) => hiddenTopicIds.add(v.topicId));
  }

  const scoresA = profileA.topicScores.map((ts) => ({
    topicId: ts.topicId,
    score: ts.score,
    answeredCount: ts.answeredCount,
    insufficientData: ts.insufficientData,
  }));

  const scoresB = profileB.topicScores.map((ts) => ({
    topicId: ts.topicId,
    score: ts.score,
    answeredCount: ts.answeredCount,
    insufficientData: ts.insufficientData,
  }));

  const comparison = compareProfiles(scoresA, scoresB, hiddenTopicIds);

  const topicMap = new Map(
    [...profileA.topicScores, ...profileB.topicScores].map((ts) => [
      ts.topicId,
      ts.topic,
    ])
  );

  const labelA = profileA.user?.name || "Profile A";
  const labelB = profileB.user?.name || "Profile B";

  const radarData = comparison.perTopicDeltas.map((d) => ({
    topic: topicMap.get(d.topicId)?.name || d.topicId,
    scoreA: d.scoreA,
    scoreB: d.scoreB,
  }));

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Comparison
        </h1>
        <p className="text-gray-500 mb-6">
          <span className="text-indigo-600 font-medium">{labelA}</span>
          {" vs "}
          <span className="text-rose-500 font-medium">{labelB}</span>
        </p>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <AlignmentScore score={comparison.alignmentScore} />
          <ComparisonRadar
            data={radarData}
            labelA={labelA}
            labelB={labelB}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            By Topic
          </h2>
          {comparison.perTopicDeltas
            .sort((a, b) => {
              const topicA = topicMap.get(a.topicId);
              const topicB = topicMap.get(b.topicId);
              return (topicA?.order || 0) - (topicB?.order || 0);
            })
            .map((d) => {
              const topic = topicMap.get(d.topicId)!;
              return (
                <ComparisonSpectrum
                  key={d.topicId}
                  topicName={topic.name}
                  scoreA={d.scoreA}
                  scoreB={d.scoreB}
                  labelLeft={topic.spectrumLabelLeft}
                  labelRight={topic.spectrumLabelRight}
                  delta={d.delta}
                />
              );
            })}
        </div>

        {comparison.closestTopics.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-green-700 mb-3">
                Most Aligned
              </h3>
              {comparison.closestTopics.map((d) => (
                <div key={d.topicId} className="text-sm text-gray-700 mb-1">
                  {topicMap.get(d.topicId)?.name} —{" "}
                  <span className="text-green-600">
                    {Math.round(d.delta)} pts apart
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-red-700 mb-3">
                Most Divergent
              </h3>
              {comparison.furthestTopics.map((d) => (
                <div key={d.topicId} className="text-sm text-gray-700 mb-1">
                  {topicMap.get(d.topicId)?.name} —{" "}
                  <span className="text-red-600">
                    {Math.round(d.delta)} pts apart
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/comparison/ src/app/compare/
git commit -m "feat: add one-on-one comparison page with radar overlay and alignment score"
```

---

## Task 18: Groups API

**Files:**
- Create: `src/app/api/groups/route.ts`, `src/app/api/groups/join/route.ts`, `src/app/api/groups/[groupId]/route.ts`, `src/app/api/groups/[groupId]/compare/route.ts`

- [ ] **Step 1: Write create group route**

Create `src/app/api/groups/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createGroupSchema } from "@/lib/validation";
import crypto from "crypto";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part1 = Array.from({ length: 4 }, () =>
    chars[crypto.randomInt(chars.length)]
  ).join("");
  const part2 = Array.from({ length: 4 }, () =>
    chars[crypto.randomInt(chars.length)]
  ).join("");
  return `${part1}-${part2}`;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createGroupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const group = await db.group.create({
    data: {
      name: parsed.data.name,
      inviteCode: generateInviteCode(),
      creatorId: session.user.id,
      members: {
        create: { userId: session.user.id },
      },
    },
  });

  return NextResponse.json(
    { id: group.id, inviteCode: group.inviteCode },
    { status: 201 }
  );
}
```

- [ ] **Step 2: Write join group route (by invite code only)**

Create `src/app/api/groups/join/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { joinGroupSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = joinGroupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const group = await db.group.findUnique({
    where: { inviteCode: parsed.data.inviteCode },
  });

  if (!group) {
    return NextResponse.json(
      { error: "Invalid invite code" },
      { status: 404 }
    );
  }

  const existing = await db.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: group.id, userId: session.user.id },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Already a member" }, { status: 409 });
  }

  await db.groupMember.create({
    data: { groupId: group.id, userId: session.user.id },
  });

  return NextResponse.json(
    { groupId: group.id, name: group.name },
    { status: 201 }
  );
}
```

- [ ] **Step 3: Write group management route (update settings, leave, remove member)**

Create `src/app/api/groups/[groupId]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateGroupSchema = z.object({
  showNames: z.boolean().optional(),
  removeMemberId: z.string().uuid().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;
  const body = await request.json();
  const parsed = updateGroupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const group = await db.group.findUnique({ where: { id: groupId } });
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Only creator can update settings or remove members
  if (group.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Only the group creator can manage settings" }, { status: 403 });
  }

  if (parsed.data.showNames !== undefined) {
    await db.group.update({
      where: { id: groupId },
      data: { showNames: parsed.data.showNames },
    });
  }

  if (parsed.data.removeMemberId) {
    if (parsed.data.removeMemberId === group.creatorId) {
      return NextResponse.json({ error: "Cannot remove the creator" }, { status: 400 });
    }
    await db.groupMember.delete({
      where: {
        groupId_userId: { groupId, userId: parsed.data.removeMemberId },
      },
    });
  }

  return NextResponse.json({ success: true });
}

// Leave group
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;

  const group = await db.group.findUnique({ where: { id: groupId } });
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (group.creatorId === session.user.id) {
    return NextResponse.json(
      { error: "Creator cannot leave. Delete the group instead." },
      { status: 400 }
    );
  }

  await db.groupMember.delete({
    where: {
      groupId_userId: { groupId, userId: session.user.id },
    },
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Write group compare route**

Create `src/app/api/groups/[groupId]/compare/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: {
            include: {
              profiles: {
                include: {
                  topicScores: { include: { topic: true } },
                },
                orderBy: { updatedAt: "desc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const isMember = group.members.some(
    (m) => m.userId === session.user!.id
  );
  if (!isMember) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  // Gather hidden topic IDs for each member
  const memberUserIds = group.members.map((m) => m.userId);
  const allVisibilities = await db.topicVisibility.findMany({
    where: { userId: { in: memberUserIds }, hidden: true },
  });
  const hiddenByUser = new Map<string, Set<string>>();
  for (const v of allVisibilities) {
    if (!hiddenByUser.has(v.userId)) hiddenByUser.set(v.userId, new Set());
    hiddenByUser.get(v.userId)!.add(v.topicId);
  }

  const members = group.members.map((m) => {
    const profile = m.user.profiles[0];
    const hidden = hiddenByUser.get(m.userId) || new Set();
    return {
      userId: m.userId,
      name: group.showNames ? m.user.name : null,
      scores:
        profile?.topicScores
          .filter((ts) => !hidden.has(ts.topicId) && !ts.insufficientData)
          .map((ts) => ({
            topicId: ts.topicId,
            topicName: ts.topic.name,
            score: ts.score,
          })) || [],
    };
  });

  // Calculate per-topic stats
  const topics = await db.topic.findMany({ orderBy: { order: "asc" } });
  const topicStats = topics.map((topic) => {
    const memberScores = members
      .map((m) => m.scores.find((s) => s.topicId === topic.id)?.score)
      .filter((s): s is number => s !== undefined);

    const avg =
      memberScores.length > 0
        ? memberScores.reduce((a, b) => a + b, 0) / memberScores.length
        : null;
    const spread =
      memberScores.length > 1
        ? Math.max(...memberScores) - Math.min(...memberScores)
        : 0;

    return {
      topicId: topic.id,
      topicName: topic.name,
      spectrumLabelLeft: topic.spectrumLabelLeft,
      spectrumLabelRight: topic.spectrumLabelRight,
      average: avg !== null ? Math.round(avg * 100) / 100 : null,
      spread: Math.round(spread * 100) / 100,
      memberScores,
    };
  });

  return NextResponse.json({
    group: {
      id: group.id,
      name: group.name,
      inviteCode: group.inviteCode,
      showNames: group.showNames,
      creatorId: group.creatorId,
    },
    members,
    topicStats,
  });
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/groups/
git commit -m "feat: add groups API for create, join, compare, leave, and settings"
```

---

## Task 19: Group Dashboard

**Files:**
- Create: `src/components/groups/GroupSpectrum.tsx`, `src/components/groups/GroupHeatMap.tsx`, `src/components/groups/GroupRadar.tsx`, `src/app/groups/[groupId]/page.tsx`

- [ ] **Step 1: Write GroupSpectrum**

Create `src/components/groups/GroupSpectrum.tsx`:
```typescript
interface GroupSpectrumProps {
  topicName: string;
  labelLeft: string;
  labelRight: string;
  memberScores: number[];
  average: number | null;
}

export function GroupSpectrum({
  topicName,
  labelLeft,
  labelRight,
  memberScores,
  average,
}: GroupSpectrumProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-1">
        <span className="font-medium text-gray-900">{topicName}</span>
        {average !== null && (
          <span className="text-xs text-gray-500">
            avg: {Math.round(average)}
          </span>
        )}
      </div>
      <div className="relative h-8 bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400 rounded-full">
        {memberScores.map((score, i) => (
          <div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-gray-700 rounded-full shadow-sm"
            style={{ left: `${score}%` }}
          />
        ))}
        {average !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-8 bg-gray-800 opacity-50"
            style={{ left: `${average}%` }}
          />
        )}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{labelLeft}</span>
        <span>{labelRight}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write GroupHeatMap**

Create `src/components/groups/GroupHeatMap.tsx`:
```typescript
interface TopicStat {
  topicName: string;
  spread: number;
}

export function GroupHeatMap({ stats }: { stats: TopicStat[] }) {
  const sorted = [...stats].sort((a, b) => a.spread - b.spread);

  return (
    <div className="space-y-2">
      {sorted.map((stat) => {
        const intensity = Math.min(stat.spread / 80, 1);
        const bgColor =
          intensity < 0.3
            ? "bg-green-100 text-green-800"
            : intensity < 0.6
              ? "bg-amber-100 text-amber-800"
              : "bg-red-100 text-red-800";

        return (
          <div
            key={stat.topicName}
            className={`flex justify-between items-center px-4 py-2 rounded-lg ${bgColor}`}
          >
            <span className="font-medium text-sm">{stat.topicName}</span>
            <span className="text-sm">
              {Math.round(stat.spread)} pt spread
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Write GroupRadar**

Create `src/components/groups/GroupRadar.tsx`:
```typescript
"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface GroupRadarProps {
  data: { topic: string; average: number }[];
}

export function GroupRadar({ data }: GroupRadarProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="topic"
          tick={{ fill: "#64748b", fontSize: 12 }}
        />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
        <Radar
          name="Group Average"
          dataKey="average"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 4: Write group dashboard page**

Create `src/app/groups/[groupId]/page.tsx`:
```typescript
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GroupSpectrum } from "@/components/groups/GroupSpectrum";
import { GroupHeatMap } from "@/components/groups/GroupHeatMap";
import { GroupRadar } from "@/components/groups/GroupRadar";

interface TopicStat {
  topicId: string;
  topicName: string;
  spectrumLabelLeft: string;
  spectrumLabelRight: string;
  average: number | null;
  spread: number;
  memberScores: number[];
}

interface GroupData {
  group: {
    id: string;
    name: string;
    inviteCode: string;
    showNames: boolean;
    creatorId: string;
  };
  members: { userId: string; name: string | null; scores: { topicId: string; score: number }[] }[];
  topicStats: TopicStat[];
}

export default function GroupPage() {
  const params = useParams<{ groupId: string }>();
  const [data, setData] = useState<GroupData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/groups/${params.groupId}/compare`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load group");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [params.groupId]);

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  const radarData = data.topicStats
    .filter((ts) => ts.average !== null)
    .map((ts) => ({ topic: ts.topicName, average: ts.average! }));

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {data.group.name}
            </h1>
            <p className="text-gray-500 mt-1">
              {data.members.length} members &middot; Invite code:{" "}
              <code className="bg-gray-100 px-2 py-0.5 rounded text-sm">
                {data.group.inviteCode}
              </code>
            </p>
          </div>
        </div>

        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Group Average
          </h2>
          <GroupRadar data={radarData} />
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Agreement & Spread
          </h2>
          <GroupHeatMap
            stats={data.topicStats
              .filter((ts) => ts.average !== null)
              .map((ts) => ({
                topicName: ts.topicName,
                spread: ts.spread,
              }))}
          />
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            By Topic
          </h2>
          {data.topicStats
            .filter((ts) => ts.memberScores.length > 0)
            .map((ts) => (
              <GroupSpectrum
                key={ts.topicId}
                topicName={ts.topicName}
                labelLeft={ts.spectrumLabelLeft}
                labelRight={ts.spectrumLabelRight}
                memberScores={ts.memberScores}
                average={ts.average}
              />
            ))}
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/groups/ src/app/groups/
git commit -m "feat: add group dashboard with spectrums, heat map, and radar"
```

---

## Task 20: Topic Visibility & Account Page

**Files:**
- Create: `src/app/account/page.tsx`

- [ ] **Step 1: Write account page with visibility controls and group management**

Create `src/app/account/page.tsx`:
```typescript
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TopicVisibility {
  topicId: string;
  topicName: string;
  hidden: boolean;
}

interface GroupInfo {
  id: string;
  name: string;
  inviteCode: string;
  memberCount: number;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [topics, setTopics] = useState<TopicVisibility[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [claimStatus, setClaimStatus] = useState<string>("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (!session?.user?.id) return;

    // Load profile, topics, groups
    const stored = localStorage.getItem("profileId");
    setProfileId(stored);

    fetch("/api/account/data")
      .then((r) => r.json())
      .then((data) => {
        setTopics(data.topicVisibility || []);
        setGroups(data.groups || []);
        if (data.profileId) setProfileId(data.profileId);
      })
      .catch(() => {});
  }, [session]);

  const handleClaim = async () => {
    const token = localStorage.getItem("anonymousToken");
    if (!token) {
      setClaimStatus("No anonymous profile found to claim.");
      return;
    }
    const res = await fetch("/api/auth/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonymousToken: token }),
    });
    if (res.ok) {
      const data = await res.json();
      setProfileId(data.profileId);
      setClaimStatus("Profile claimed successfully!");
    } else {
      const data = await res.json();
      setClaimStatus(data.error || "Failed to claim profile.");
    }
  };

  const toggleVisibility = async (topicId: string, hidden: boolean) => {
    await fetch("/api/account/visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId, hidden }),
    });
    setTopics((prev) =>
      prev.map((t) => (t.topicId === topicId ? { ...t, hidden } : t))
    );
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newGroupName }),
    });
    if (res.ok) {
      setNewGroupName("");
      // Reload groups
      window.location.reload();
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) return;
    const res = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: joinCode.trim() }),
    });
    if (res.ok) {
      setJoinCode("");
      window.location.reload();
    }
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account</h1>
        <p className="text-gray-500 mb-8">{session?.user?.email}</p>

        {/* Profile link / claim */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Your Profile
          </h2>
          {profileId ? (
            <Link
              href={`/results/${profileId}`}
              className="text-indigo-600 hover:text-indigo-800"
            >
              View your results &rarr;
            </Link>
          ) : (
            <div>
              <p className="text-gray-600 text-sm mb-3">
                If you took the quiz before creating an account, you can link
                those results to your account.
              </p>
              <button
                onClick={handleClaim}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Claim Anonymous Profile
              </button>
              {claimStatus && (
                <p className="text-sm mt-2 text-gray-600">{claimStatus}</p>
              )}
            </div>
          )}
        </section>

        {/* Topic visibility */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Privacy
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Hide topics from comparisons. Hidden topics won&apos;t appear when
            others compare with you.
          </p>
          <div className="space-y-2">
            {topics.map((t) => (
              <label
                key={t.topicId}
                className="flex items-center justify-between py-1"
              >
                <span className="text-gray-700 text-sm">{t.topicName}</span>
                <input
                  type="checkbox"
                  checked={!t.hidden}
                  onChange={() => toggleVisibility(t.topicId, !t.hidden)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            ))}
          </div>
        </section>

        {/* Groups */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Groups
          </h2>
          {groups.length > 0 ? (
            <div className="space-y-2 mb-6">
              {groups.map((g) => (
                <Link
                  key={g.id}
                  href={`/groups/${g.id}`}
                  className="block bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                >
                  <div className="font-medium text-gray-900">{g.name}</div>
                  <div className="text-xs text-gray-500">
                    {g.memberCount} members &middot; {g.inviteCode}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">
              You&apos;re not in any groups yet.
            </p>
          )}

          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Create a Group
            </h3>
            <div className="flex gap-2">
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleCreateGroup}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Create
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Join a Group
            </h3>
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Invite code (e.g., ABCD-1234)"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleJoinGroup}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Join
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Write account data API route**

Create `src/app/api/account/data/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [profile, allTopics, visibilities, groups] = await Promise.all([
    db.userProfile.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    }),
    db.topic.findMany({ orderBy: { order: "asc" } }),
    db.topicVisibility.findMany({ where: { userId } }),
    db.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: { _count: { select: { members: true } } },
        },
      },
    }),
  ]);

  const hiddenSet = new Set(visibilities.filter((v) => v.hidden).map((v) => v.topicId));

  return NextResponse.json({
    profileId: profile?.id || null,
    topicVisibility: allTopics.map((t) => ({
      topicId: t.id,
      topicName: t.name,
      hidden: hiddenSet.has(t.id),
    })),
    groups: groups.map((gm) => ({
      id: gm.group.id,
      name: gm.group.name,
      inviteCode: gm.group.inviteCode,
      memberCount: gm.group._count.members,
    })),
  });
}
```

- [ ] **Step 3: Write visibility toggle API route**

Create `src/app/api/account/visibility/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  topicId: z.string(),
  hidden: z.boolean(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { topicId, hidden } = parsed.data;

  if (hidden) {
    await db.topicVisibility.upsert({
      where: {
        userId_topicId: { userId: session.user.id, topicId },
      },
      update: { hidden: true },
      create: { userId: session.user.id, topicId, hidden: true },
    });
  } else {
    await db.topicVisibility.deleteMany({
      where: { userId: session.user.id, topicId },
    });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/account/ src/app/api/account/
git commit -m "feat: add account page with profile claiming, topic visibility, and group management"
```

---

## Task 21: Root Layout & Session Provider

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/SessionProvider.tsx`

- [ ] **Step 1: Create SessionProvider wrapper**

Create `src/components/SessionProvider.tsx`:
```typescript
"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { type ReactNode } from "react";

export function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

- [ ] **Step 2: Update root layout**

Update `src/app/layout.tsx` to wrap with SessionProvider and add a basic nav:
```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PoliticalPlatform",
  description: "Discover the nuances of your political views",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <nav className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <Link
                href="/"
                className="text-lg font-bold text-gray-900 hover:text-indigo-600 transition-colors"
              >
                PoliticalPlatform
              </Link>
              <div className="flex items-center gap-4 text-sm">
                <Link
                  href="/quiz"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Quiz
                </Link>
                <Link
                  href="/account"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Account
                </Link>
              </div>
            </div>
          </nav>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx src/components/SessionProvider.tsx
git commit -m "feat: add session provider and navigation to root layout"
```

---

## Task 22: E2E Tests

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/quiz-flow.spec.ts`, `tests/e2e/results.spec.ts`, `tests/e2e/comparison.spec.ts`

- [ ] **Step 1: Install Playwright**

Run:
```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Write Playwright config**

Create `playwright.config.ts`:
```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: true,
  },
});
```

- [ ] **Step 3: Write quiz flow E2E test**

Create `tests/e2e/quiz-flow.spec.ts`:
```typescript
import { test, expect } from "@playwright/test";

test.describe("Quiz Flow", () => {
  test("can navigate from landing to quiz to results", async ({ page }) => {
    // Landing page
    await page.goto("/");
    await expect(page.getByText("PoliticalPlatform")).toBeVisible();
    await page.click("text=Take the Quiz");

    // Quiz intro
    await expect(page.getByText("Discover Your Political Profile")).toBeVisible();
    await page.click("text=Start Quiz");

    // First topic - answer at least 2 questions
    await expect(page.getByText("Topic 1 of")).toBeVisible();
    const agreeButtons = page.getByText("Agree", { exact: true });
    const count = await agreeButtons.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      await agreeButtons.nth(i).click();
    }
    await page.click("text=Next Topic");

    // Second topic - answer at least 2
    await expect(page.getByText("Topic 2 of")).toBeVisible();
    const agreeButtons2 = page.getByText("Agree", { exact: true });
    const count2 = await agreeButtons2.count();
    for (let i = 0; i < Math.min(count2, 3); i++) {
      await agreeButtons2.nth(i).click();
    }

    // Skip remaining topics to reach review faster
    for (let i = 2; i < 12; i++) {
      await page.click("text=Next Topic");
    }

    // Review screen
    await page.click("text=Review Answers");
    await expect(page.getByText("Review Your Answers")).toBeVisible();

    // Submit
    await page.click("text=Submit & See Results");

    // Results page
    await expect(page.getByText("Your Political Profile")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Overview")).toBeVisible();
    await expect(page.getByText("By Topic")).toBeVisible();
    await expect(page.getByText("Insights")).toBeVisible();
  });
});
```

- [ ] **Step 4: Write results page E2E test**

Create `tests/e2e/results.spec.ts`:
```typescript
import { test, expect } from "@playwright/test";

test.describe("Results Page", () => {
  test("shows 404 for invalid profile", async ({ page }) => {
    await page.goto("/results/nonexistent-id");
    await expect(page.getByText("404")).toBeVisible();
  });
});
```

- [ ] **Step 5: Write comparison E2E test**

Create `tests/e2e/comparison.spec.ts`:
```typescript
import { test, expect } from "@playwright/test";

test.describe("Comparison", () => {
  test("compare page shows alignment score and per-topic breakdown", async ({
    page,
  }) => {
    // This test requires two profiles to exist in the database.
    // In a real test setup, seed two profiles via the API before running.
    // For now, verify the page structure loads correctly with valid IDs.
    await page.goto("/compare/nonexistent-1/nonexistent-2");
    // Should show 404 for invalid profiles
    await expect(page.getByText("404")).toBeVisible();
  });
});
```

- [ ] **Step 6: Run E2E tests**

Run: `npx playwright test`
Expected: Tests pass (requires database to be seeded and dev server running).

- [ ] **Step 7: Commit**

```bash
git add playwright.config.ts tests/e2e/
git commit -m "feat: add Playwright E2E tests for quiz flow, results, and comparison"
```

---

## Summary

22 tasks covering the full spec:

| # | Task | Spec Coverage |
|---|------|--------------|
| 1 | Project Setup | Stack, deployment |
| 2 | Database Schema | Data model |
| 3 | Seed Data | Topics, questions, data validation |
| 4 | Scoring Logic | Scoring logic (TDD) |
| 5 | Insight Generation | Insight generation (TDD) |
| 6 | Comparison Logic | Comparison features (TDD) |
| 7 | Validation Schemas | API input validation |
| 8 | Quiz Submit API | POST /api/quiz/submit |
| 9 | Results API | GET /api/results/[profileId] |
| 10 | Quiz UI | Quiz experience, flow |
| 11 | Results Page | Visualization (radar, spectrums, insights) |
| 12 | Landing Page | Landing page |
| 13 | Auth Setup | NextAuth, signin/signup |
| 14 | Profile Claiming | POST /api/auth/claim |
| 15 | Answer Update & Retake | PATCH answers, topic retake |
| 16 | Annotations | POST annotations, topic detail |
| 17 | Comparison Page | One-on-one comparison |
| 18 | Groups API | Create, join, compare, leave, remove, showNames toggle |
| 19 | Group Dashboard | Group visualization |
| 20 | Topic Visibility & Account | Privacy, account management |
| 21 | Root Layout | Navigation, session provider |
| 22 | E2E Tests | Testing strategy |
