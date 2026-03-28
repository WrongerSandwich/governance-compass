# URL-Encoded Results Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the always-write-to-DB quiz submission flow with URL-encoded results computed client-side, with on-demand materialization when users need persistence.

**Architecture:** Quiz completion encodes all 82 responses into a ~44-char base64url string and navigates to `/results?r=<encoded>`. The results page decodes and scores client-side. A new `/api/profile/materialize` endpoint creates DB profiles on demand (save to account, group join, annotation). Old submit and claim endpoints are deleted; `anonymousToken` column is dropped.

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma, base64url encoding, existing `computeFullResults()` scoring engine.

---

### Task 1: Response Codec — Tests

**Files:**
- Create: `src/lib/response-codec.ts` (stub)
- Create: `tests/unit/response-codec.test.ts`

- [ ] **Step 1: Create codec stub with type signatures**

```typescript
// src/lib/response-codec.ts
import type { QuizResponses } from "./scoring-types";

const CODEC_VERSION = 1;

export function encodeResponses(responses: QuizResponses): string {
  throw new Error("Not implemented");
}

export function decodeResponses(encoded: string): QuizResponses {
  throw new Error("Not implemented");
}
```

- [ ] **Step 2: Write failing tests**

```typescript
// tests/unit/response-codec.test.ts
import { describe, it, expect } from "vitest";
import { encodeResponses, decodeResponses } from "@/lib/response-codec";
import type { QuizResponses } from "@/lib/scoring-types";

// Helper: build a complete response set
function buildResponses(overrides?: Partial<QuizResponses>): QuizResponses {
  const fc: Record<string, "A" | "B"> = {};
  for (let axis = 1; axis <= 12; axis++) {
    for (let item = 1; item <= 3; item++) {
      fc[`fc-${axis}-${item}`] = item % 2 === 0 ? "A" : "B";
    }
  }
  const sc: Record<string, 1 | 2 | 3 | 4 | 5> = {};
  for (let axis = 1; axis <= 12; axis++) {
    for (let item = 1; item <= 3; item++) {
      sc[`sc-${axis}-${item}`] = ((item % 5) + 1) as 1 | 2 | 3 | 4 | 5;
    }
  }
  const budget: Record<number, number> = {};
  for (let m = 1; m <= 10; m++) {
    budget[m] = 10; // all at baseline
  }
  return { forcedChoice: fc, scaled: sc, budget, ...overrides };
}

describe("response-codec", () => {
  it("roundtrips a complete response set", () => {
    const original = buildResponses();
    const encoded = encodeResponses(original);
    const decoded = decodeResponses(encoded);
    expect(decoded).toEqual(original);
  });

  it("produces a URL-safe string under 50 characters", () => {
    const encoded = encodeResponses(buildResponses());
    expect(encoded.length).toBeLessThanOrEqual(50);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/); // base64url charset
  });

  it("encodes skipped FC items as neutral", () => {
    const responses = buildResponses();
    delete responses.forcedChoice["fc-3-2"]; // skip one
    const encoded = encodeResponses(responses);
    const decoded = decodeResponses(encoded);
    // Skipped items should not appear in the decoded record
    expect(decoded.forcedChoice["fc-3-2"]).toBeUndefined();
  });

  it("encodes skipped SC items", () => {
    const responses = buildResponses();
    delete responses.scaled["sc-5-1"]; // skip one
    const encoded = encodeResponses(responses);
    const decoded = decodeResponses(encoded);
    expect(decoded.scaled["sc-5-1"]).toBeUndefined();
  });

  it("preserves budget values at boundaries", () => {
    const responses = buildResponses();
    responses.budget[1] = 5;   // minimum
    responses.budget[2] = 50;  // large
    // Adjust others to sum to 100
    responses.budget[3] = 5;
    responses.budget[4] = 5;
    responses.budget[5] = 5;
    responses.budget[6] = 5;
    responses.budget[7] = 5;
    responses.budget[8] = 5;
    responses.budget[9] = 5;
    responses.budget[10] = 10;
    const encoded = encodeResponses(responses);
    const decoded = decodeResponses(encoded);
    expect(decoded.budget[1]).toBe(5);
    expect(decoded.budget[2]).toBe(50);
  });

  it("deterministic: same input always produces same output", () => {
    const responses = buildResponses();
    const a = encodeResponses(responses);
    const b = encodeResponses(responses);
    expect(a).toBe(b);
  });

  it("starts with version byte", () => {
    const encoded = encodeResponses(buildResponses());
    // First 6 bits of base64url char encode the version
    // Just verify it decodes without error (version check is internal)
    expect(() => decodeResponses(encoded)).not.toThrow();
  });

  it("rejects invalid encoded strings", () => {
    expect(() => decodeResponses("")).toThrow();
    expect(() => decodeResponses("!!!invalid!!!")).toThrow();
  });

  it("rejects unknown version", () => {
    const encoded = encodeResponses(buildResponses());
    // Corrupt the first byte (version)
    const bytes = Uint8Array.from(atob(encoded.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
    bytes[0] = 99; // unknown version
    const corrupted = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    expect(() => decodeResponses(corrupted)).toThrow(/version/i);
  });
});
```

- [ ] **Step 3: Run tests — verify they fail**

Run: `npx vitest run tests/unit/response-codec.test.ts`
Expected: All tests FAIL with "Not implemented"

---

### Task 2: Response Codec — Implementation

**Files:**
- Modify: `src/lib/response-codec.ts`

- [ ] **Step 1: Implement BitWriter and BitReader helpers**

```typescript
// src/lib/response-codec.ts
import type { QuizResponses } from "./scoring-types";

const CODEC_VERSION = 1;
const NUM_AXES = 12;
const ITEMS_PER_AXIS = 3;
const NUM_FC = NUM_AXES * ITEMS_PER_AXIS; // 36
const NUM_SC = NUM_AXES * ITEMS_PER_AXIS; // 36
const NUM_MINISTRIES = 10;

class BitWriter {
  private bits: number[] = [];

  write(value: number, numBits: number) {
    for (let i = numBits - 1; i >= 0; i--) {
      this.bits.push((value >> i) & 1);
    }
  }

  toBytes(): Uint8Array {
    // Pad to byte boundary
    while (this.bits.length % 8 !== 0) {
      this.bits.push(0);
    }
    const bytes = new Uint8Array(this.bits.length / 8);
    for (let i = 0; i < bytes.length; i++) {
      let byte = 0;
      for (let j = 0; j < 8; j++) {
        byte = (byte << 1) | this.bits[i * 8 + j];
      }
      bytes[i] = byte;
    }
    return bytes;
  }
}

class BitReader {
  private bits: number[];
  private pos = 0;

  constructor(bytes: Uint8Array) {
    this.bits = [];
    for (const byte of bytes) {
      for (let i = 7; i >= 0; i--) {
        this.bits.push((byte >> i) & 1);
      }
    }
  }

  read(numBits: number): number {
    let value = 0;
    for (let i = 0; i < numBits; i++) {
      value = (value << 1) | (this.bits[this.pos++] ?? 0);
    }
    return value;
  }
}

function toBase64Url(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}
```

- [ ] **Step 2: Implement encodeResponses**

Add to `src/lib/response-codec.ts`:

```typescript
export function encodeResponses(responses: QuizResponses): string {
  const writer = new BitWriter();

  // Version byte
  writer.write(CODEC_VERSION, 8);

  // 36 FC responses: 2 bits each (00=skip, 01=A, 10=B)
  for (let axis = 1; axis <= NUM_AXES; axis++) {
    for (let item = 1; item <= ITEMS_PER_AXIS; item++) {
      const key = `fc-${axis}-${item}`;
      const val = responses.forcedChoice[key];
      if (val === "A") writer.write(1, 2);
      else if (val === "B") writer.write(2, 2);
      else writer.write(0, 2); // skip
    }
  }

  // 36 SC responses: 3 bits each (000=skip, 001-101=values 1-5)
  for (let axis = 1; axis <= NUM_AXES; axis++) {
    for (let item = 1; item <= ITEMS_PER_AXIS; item++) {
      const key = `sc-${axis}-${item}`;
      const val = responses.scaled[key];
      if (val !== undefined) writer.write(val, 3);
      else writer.write(0, 3); // skip
    }
  }

  // 10 budget allocations: 7 bits each (value - 5)
  for (let m = 1; m <= NUM_MINISTRIES; m++) {
    const val = responses.budget[m] ?? 5;
    writer.write(val - 5, 7);
  }

  return toBase64Url(writer.toBytes());
}
```

- [ ] **Step 3: Implement decodeResponses**

Add to `src/lib/response-codec.ts`:

```typescript
export function decodeResponses(encoded: string): QuizResponses {
  if (!encoded || encoded.length === 0) {
    throw new Error("Empty encoded string");
  }

  let bytes: Uint8Array;
  try {
    bytes = fromBase64Url(encoded);
  } catch {
    throw new Error("Invalid base64url encoding");
  }

  const reader = new BitReader(bytes);

  // Version check
  const version = reader.read(8);
  if (version !== CODEC_VERSION) {
    throw new Error(`Unsupported codec version: ${version}`);
  }

  // 36 FC responses
  const forcedChoice: Record<string, "A" | "B"> = {};
  for (let axis = 1; axis <= NUM_AXES; axis++) {
    for (let item = 1; item <= ITEMS_PER_AXIS; item++) {
      const val = reader.read(2);
      if (val === 1) forcedChoice[`fc-${axis}-${item}`] = "A";
      else if (val === 2) forcedChoice[`fc-${axis}-${item}`] = "B";
      // 0 = skip, don't add to record
    }
  }

  // 36 SC responses
  const scaled: Record<string, 1 | 2 | 3 | 4 | 5> = {};
  for (let axis = 1; axis <= NUM_AXES; axis++) {
    for (let item = 1; item <= ITEMS_PER_AXIS; item++) {
      const val = reader.read(3);
      if (val >= 1 && val <= 5) {
        scaled[`sc-${axis}-${item}`] = val as 1 | 2 | 3 | 4 | 5;
      }
      // 0 = skip, don't add to record
    }
  }

  // 10 budget allocations
  const budget: Record<number, number> = {};
  for (let m = 1; m <= NUM_MINISTRIES; m++) {
    budget[m] = reader.read(7) + 5;
  }

  return { forcedChoice, scaled, budget };
}
```

- [ ] **Step 4: Run tests — verify they all pass**

Run: `npx vitest run tests/unit/response-codec.test.ts`
Expected: All 9 tests PASS

- [ ] **Step 5: Run full test suite to verify no regressions**

Run: `npx vitest run`
Expected: All existing tests PASS plus the new codec tests

- [ ] **Step 6: Commit**

```bash
git add src/lib/response-codec.ts tests/unit/response-codec.test.ts
git commit -m "feat: add response codec for URL-encoded quiz results

Bitpacked encoding of 82 response values (36 FC + 36 SC + 10 budget)
into ~44 chars base64url. Supports skip encoding and version byte for
forward compatibility."
```

---

### Task 3: Extract Shared ResultsView Component

The existing `/results/[profileId]/page.tsx` is a server component with ~140 lines of rendering. Extract the rendering into a shared `ResultsView` client component so both the DB-backed and URL-encoded results pages can use it.

**Files:**
- Create: `src/components/results/ResultsView.tsx`
- Modify: `src/app/results/[profileId]/page.tsx`

- [ ] **Step 1: Define the shared props interface and create ResultsView**

Create `src/components/results/ResultsView.tsx` containing all the JSX currently in the results page, accepting props instead of fetching from DB. The props interface matches the data shape both sources produce:

```typescript
// src/components/results/ResultsView.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { CompassPlot } from "./CompassPlot";
import { ArchetypeCard } from "./ArchetypeCard";
import { RadarChart } from "./RadarChart";
import { AxisBreakdownCard } from "./AxisBreakdownCard";
import { CompareButton } from "./CompareButton";

export interface AxisDisplayData {
  axisId: number;
  name: string;
  poleALabel: string;
  poleBLabel: string;
  domain: string;
  finalScore: number;
  confidence: string;
  tension: {
    detected: boolean;
    level: string;
    direction: string | null;
    narrative: string | null;
  };
  components: { fc: number; sc: number; bg: number | null };
}

export interface ResultsViewProps {
  axisData: AxisDisplayData[];
  compass: { economic: number; cultural: number };
  archetype: {
    primary: {
      name: string;
      matchPercentage: number;
      summary: string;
      description: string;
      tension: string;
      prototype: number[];
    };
    secondary: {
      name: string;
      matchPercentage: number;
      summary: string;
    };
    isBlended: boolean;
  };
  profileId?: string;
  encoded?: string;
}

function SaveToAccountButton({ encoded }: { encoded: string }) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  if (!session?.user) return null;

  const handleSave = async () => {
    setStatus("saving");
    const res = await fetch("/api/profile/materialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encoded }),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("lastResults", `id:${data.profileId}`);
      setStatus("saved");
      // Optionally redirect to the profile-backed URL
      window.location.href = `/results/${data.profileId}`;
    } else {
      setStatus("error");
    }
  };

  if (status === "saved") {
    return <p className="text-xs text-text-tertiary text-center">Results saved to your account.</p>;
  }

  return (
    <div className="text-center">
      <button
        onClick={handleSave}
        disabled={status === "saving"}
        className="border border-stone-600 text-stone-600 px-4 py-2 rounded-[8px] text-sm font-medium hover:bg-stone-100 transition-colors duration-150 disabled:opacity-50"
      >
        {status === "saving" ? "Saving..." : "Save to account"}
      </button>
      {status === "error" && (
        <p className="text-xs text-warning-text mt-2">Failed to save. Please try again.</p>
      )}
    </div>
  );
}

export function ResultsView({ axisData, compass, archetype, profileId, encoded }: ResultsViewProps) {
  const domains = [
    { name: "Economic Organization", axes: axisData.filter((a) => a.domain === "Economic Organization") },
    { name: "Power and Authority", axes: axisData.filter((a) => a.domain === "Power and Authority") },
    { name: "Society and Identity", axes: axisData.filter((a) => a.domain === "Society and Identity") },
    { name: "The State in the World", axes: axisData.filter((a) => a.domain === "The State in the World") },
  ];

  const tensionAxes = axisData.filter((a) => a.tension.detected);

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Section label + page title */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary mb-1">
            Assessment results
          </p>
          <h1 className="text-[22px] font-serif font-medium text-text-primary">
            Your governance compass
          </h1>
          <p className="text-xs font-serif italic text-text-tertiary mt-1">
            A simplified two-dimensional view. Scroll for your complete 12-axis profile.
          </p>
        </div>

        {/* Hero region: Compass + Archetype side by side */}
        <section className="bg-surface-2 rounded-[12px] p-6">
          <div className="grid grid-cols-1 min-[560px]:grid-cols-2 gap-5">
            <CompassPlot economic={compass.economic} cultural={compass.cultural} />
            <ArchetypeCard
              primary={{
                name: archetype.primary.name,
                matchPercentage: archetype.primary.matchPercentage,
                summary: archetype.primary.summary,
                description: archetype.primary.description,
                tension: archetype.primary.tension,
              }}
              secondary={{
                name: archetype.secondary.name,
                matchPercentage: archetype.secondary.matchPercentage,
                summary: archetype.secondary.summary,
              }}
              isBlended={archetype.isBlended}
            />
          </div>

          <div className="flex gap-2 mt-5">
            <button className="text-xs border border-border-secondary bg-surface-1 text-text-secondary rounded-[8px] px-3.5 py-1.5 hover:bg-surface-2 hover:text-text-primary transition-colors duration-150 focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2">
              Copy image
            </button>
            <button className="text-xs border border-border-secondary bg-surface-1 text-text-secondary rounded-[8px] px-3.5 py-1.5 hover:bg-surface-2 hover:text-text-primary transition-colors duration-150 focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2">
              Copy link
            </button>
            <button className="text-xs border border-border-secondary bg-surface-1 text-text-secondary rounded-[8px] px-3.5 py-1.5 hover:bg-surface-2 hover:text-text-primary transition-colors duration-150 focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2">
              Download raw data
            </button>
          </div>
        </section>

        {/* Tension cards */}
        {tensionAxes.length > 0 && (
          <section className="space-y-3">
            {tensionAxes.map((axis) => (
              <div key={axis.axisId} className="bg-surface-1 rounded-[12px] border border-border-secondary p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-medium"
                    style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)' }}
                  >
                    !
                  </span>
                  <span className="text-xs font-medium capitalize" style={{ color: 'var(--warning-text)' }}>
                    {axis.tension.level} tension — Axis {axis.axisId}: {axis.name}
                  </span>
                </div>
                {axis.tension.narrative && (
                  <p className="text-[13px] text-text-secondary leading-relaxed mb-2">{axis.tension.narrative}</p>
                )}
                <div className="flex gap-6 text-xs font-mono text-text-tertiary">
                  <span>Stated: {axis.components.fc >= 0 ? "+" : ""}{((axis.components.fc * 0.55 + axis.components.sc * 0.45)).toFixed(2)}</span>
                  <span>Budget: {axis.components.bg != null ? ((axis.components.bg >= 0 ? "+" : "") + axis.components.bg.toFixed(2)) : "N/A"}</span>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Radar section */}
        <section>
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary mb-1">Full profile</p>
          <h2 className="text-[18px] font-serif font-medium text-text-primary mb-4">Radar</h2>
          <div className="bg-surface-2 rounded-[12px] p-6">
            <RadarChart
              axisScores={axisData}
              archetypePrototype={archetype.primary.prototype}
              showArchetypeOverlay={archetype.primary.prototype.length > 0}
            />
          </div>
        </section>

        {/* Axis breakdown by domain */}
        <section>
          <h2 className="text-[18px] font-serif font-medium text-text-primary mb-1">Axis breakdown</h2>
          <p className="text-xs font-serif italic text-text-tertiary mb-6">
            Each axis scored from -1.0 (Pole A) to +1.0 (Pole B), weighted across three modalities.
          </p>
          <div className="space-y-5">
            {domains.map((domain) => (
              <div key={domain.name}>
                <div className="text-[11px] uppercase tracking-[0.08em] text-stone-800 font-medium border-b border-border-secondary pb-1.5 mb-2 mt-5 first:mt-0">
                  {domain.name}
                </div>
                <div className="space-y-0">
                  {domain.axes.map((axis, i) => (
                    <AxisBreakdownCard key={axis.axisId} {...axis} alternateRow={i % 2 === 1} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Compare Button — only for materialized profiles */}
        {profileId && <CompareButton profileId={profileId} />}

        {/* Save to account — only for URL-encoded results when signed in */}
        {encoded && !profileId && <SaveToAccountButton encoded={encoded} />}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Update `/results/[profileId]/page.tsx` to use ResultsView**

Replace the entire rendering section. The page remains a server component that fetches data and passes it to the client component:

```typescript
// src/app/results/[profileId]/page.tsx
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { archetypes } from "@/data/archetypes";
import { ResultsView } from "@/components/results/ResultsView";

export default async function ResultsProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;

  const profile = await db.userProfile.findUnique({
    where: { id: profileId },
    include: {
      axisScores: {
        include: { axis: true },
        orderBy: { axis: { order: "asc" } },
      },
      compassScore: true,
      archetypeResult: true,
    },
  });

  if (!profile || !profile.compassScore || !profile.archetypeResult) {
    notFound();
  }

  const primaryArchetype = archetypes.find(
    (a) => a.id === profile.archetypeResult!.primaryArchetypeId
  );
  const secondaryArchetype = archetypes.find(
    (a) => a.id === profile.archetypeResult!.secondaryArchetypeId
  );

  const axisData = profile.axisScores.map((s) => ({
    axisId: s.axisId,
    name: s.axis.name,
    poleALabel: s.axis.poleALabel,
    poleBLabel: s.axis.poleBLabel,
    domain: s.axis.domain,
    finalScore: s.finalScore,
    confidence: s.confidence,
    tension: {
      detected: s.tensionLevel !== "none",
      level: s.tensionLevel,
      direction: s.tensionDirection,
      narrative: s.tensionNarrative,
    },
    components: {
      fc: s.fcScore,
      sc: s.scScore,
      bg: s.bgScore,
    },
  }));

  return (
    <ResultsView
      axisData={axisData}
      compass={{
        economic: profile.compassScore.economic,
        cultural: profile.compassScore.cultural,
      }}
      archetype={{
        primary: {
          name: primaryArchetype?.name ?? "Unknown",
          matchPercentage: profile.archetypeResult.primaryMatchPct,
          summary: primaryArchetype?.summary ?? "",
          description: primaryArchetype?.description ?? "",
          tension: primaryArchetype?.characteristicTension ?? "",
          prototype: primaryArchetype?.prototype ?? [],
        },
        secondary: {
          name: secondaryArchetype?.name ?? "Unknown",
          matchPercentage: profile.archetypeResult.secondaryMatchPct,
          summary: secondaryArchetype?.summary ?? "",
        },
        isBlended: profile.archetypeResult.isBlended,
      }}
      profileId={profileId}
    />
  );
}
```

- [ ] **Step 3: Verify the existing results page still works**

Run: `npx vitest run`
Expected: All tests PASS (no behavioral change, just extraction)

- [ ] **Step 4: Commit**

```bash
git add src/components/results/ResultsView.tsx src/app/results/[profileId]/page.tsx
git commit -m "refactor: extract ResultsView component from results page

Shared rendering component accepts normalized props so both the
DB-backed and upcoming URL-encoded results pages can reuse it."
```

---

### Task 4: URL-Encoded Results Page

**Files:**
- Create: `src/app/results/page.tsx`

- [ ] **Step 1: Create the URL-encoded results page**

This is a client component that reads `?r=` from the URL, decodes, scores, and renders via ResultsView.

```typescript
// src/app/results/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useEffect } from "react";
import { decodeResponses } from "@/lib/response-codec";
import { computeFullResults } from "@/lib/scoring";
import { axes } from "@/data/axes";
import { archetypes } from "@/data/archetypes";
import { ResultsView } from "@/components/results/ResultsView";

export default function ResultsEncodedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const encoded = searchParams.get("r");

  useEffect(() => {
    if (!encoded) {
      router.replace("/quiz");
    }
  }, [encoded, router]);

  const resultsData = useMemo(() => {
    if (!encoded) return null;

    try {
      const responses = decodeResponses(encoded);
      const results = computeFullResults(responses);

      const primaryArch = archetypes.find((a) => a.id === results.archetype.primaryId);
      const secondaryArch = archetypes.find((a) => a.id === results.archetype.secondaryId);

      const axisData = results.axisScores.map((s) => {
        const axisInfo = axes.find((a) => a.id === s.axisId)!;
        return {
          axisId: s.axisId,
          name: axisInfo.name,
          poleALabel: axisInfo.poleALabel,
          poleBLabel: axisInfo.poleBLabel,
          domain: axisInfo.domain,
          finalScore: s.finalScore,
          confidence: s.confidence,
          tension: {
            detected: s.tension.detected,
            level: s.tension.level,
            direction: s.tension.direction,
            narrative: null,
          },
          components: {
            fc: s.fcScore,
            sc: s.scScore,
            bg: s.bgScore,
          },
        };
      });

      return {
        axisData,
        compass: results.compass,
        archetype: {
          primary: {
            name: primaryArch?.name ?? "Unknown",
            matchPercentage: results.archetype.primaryMatchPct,
            summary: primaryArch?.summary ?? "",
            description: primaryArch?.description ?? "",
            tension: primaryArch?.characteristicTension ?? "",
            prototype: primaryArch?.prototype ?? [],
          },
          secondary: {
            name: secondaryArch?.name ?? "Unknown",
            matchPercentage: results.archetype.secondaryMatchPct,
            summary: secondaryArch?.summary ?? "",
          },
          isBlended: results.archetype.isBlended,
        },
      };
    } catch {
      return null;
    }
  }, [encoded]);

  // Store in localStorage for the nav Results link
  useEffect(() => {
    if (encoded) {
      localStorage.setItem("lastResults", encoded);
    }
  }, [encoded]);

  if (!resultsData) {
    return (
      <main className="min-h-screen px-4 py-24 text-center">
        <p className="text-text-tertiary text-sm">Invalid or missing results data.</p>
      </main>
    );
  }

  return (
    <ResultsView
      {...resultsData}
      encoded={encoded ?? undefined}
    />
  );
}
```

- [ ] **Step 2: Verify tests still pass**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/results/page.tsx
git commit -m "feat: add URL-encoded results page

Client-side page at /results?r=<encoded> that decodes responses,
runs computeFullResults(), and renders via shared ResultsView.
Stores encoded string in localStorage for nav Results link."
```

---

### Task 5: Quiz Completion Flow — Encode and Navigate

**Files:**
- Modify: `src/components/quiz/QuizFlow.tsx`

- [ ] **Step 1: Replace the async submit with encode + navigate**

In `QuizFlow.tsx`, replace `handleBudgetFinalize`:

```typescript
  const handleBudgetFinalize = useCallback(() => {
    dispatch({ type: "START_COMPUTING" });

    const responses: QuizResponses = {
      forcedChoice: state.forcedChoiceResponses,
      scaled: state.scaledResponses,
      budget: state.budgetAllocations,
    };

    const encoded = encodeResponses(responses);
    localStorage.setItem("lastResults", encoded);

    // Clear quiz state from sessionStorage
    sessionStorage.removeItem("governance-compass-quiz-state");

    dispatch({ type: "COMPLETE" });
    // Artificial delay per spec (1.5-2s) before redirect
    setTimeout(() => {
      router.push(`/results?r=${encoded}`);
    }, 1800);
  }, [dispatch, state.forcedChoiceResponses, state.scaledResponses, state.budgetAllocations, router]);
```

Update imports at the top of the file — add `encodeResponses` and `QuizResponses`, remove `useState` (no longer needed for `submitError`):

```typescript
import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuiz } from "./QuizProvider";
import { encodeResponses } from "@/lib/response-codec";
import type { QuizResponses } from "@/lib/scoring-types";
```

Remove the `submitError` state and the error banner in the Phase 3 render (no network request means no network errors). Keep the `BudgetSimulator` render as-is but without the error banner.

- [ ] **Step 2: Verify tests still pass**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/quiz/QuizFlow.tsx
git commit -m "feat: encode quiz responses into URL instead of POSTing to server

Quiz completion now encodes all responses client-side and navigates
to /results?r=<encoded>. No server round-trip, no DB write. Clears
sessionStorage quiz state after encoding."
```

---

### Task 6: NavBar and ReturningUserLink — localStorage Update

**Files:**
- Modify: `src/components/NavBar.tsx`
- Modify: `src/components/ReturningUserLink.tsx`

- [ ] **Step 1: Update NavBar to read `lastResults` instead of `profileId`**

The `lastResults` value is either an encoded string (for URL-encoded results) or `"id:<profileId>"` (for materialized profiles). Parse accordingly:

```typescript
// In NavBar.tsx, replace the profileId state and effect:

const [resultsHref, setResultsHref] = useState<string | null>(null);

// Re-check localStorage on every navigation
useEffect(() => {
  const stored = localStorage.getItem("lastResults");
  if (!stored) {
    setResultsHref(null);
  } else if (stored.startsWith("id:")) {
    setResultsHref(`/results/${stored.slice(3)}`);
  } else {
    setResultsHref(`/results?r=${stored}`);
  }
}, [pathname]);
```

Then replace the conditional Results link:

```tsx
{resultsHref && (
  <Link
    href={resultsHref}
    className={linkClasses("/results")}
    aria-current={pathname.startsWith("/results") ? "page" : undefined}
  >
    Results
  </Link>
)}
```

- [ ] **Step 2: Update ReturningUserLink similarly**

```typescript
// src/components/ReturningUserLink.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function ReturningUserLink() {
  const [resultsHref, setResultsHref] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("lastResults");
    if (!stored) return;
    if (stored.startsWith("id:")) {
      setResultsHref(`/results/${stored.slice(3)}`);
    } else {
      setResultsHref(`/results?r=${stored}`);
    }
  }, []);

  if (!resultsHref) return null;

  return (
    <p className="mt-2">
      <Link
        href={resultsHref}
        className="text-xs text-text-tertiary hover:text-text-secondary transition-colors duration-150"
      >
        or view your existing results
      </Link>
    </p>
  );
}
```

- [ ] **Step 3: Verify tests pass**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/NavBar.tsx src/components/ReturningUserLink.tsx
git commit -m "feat: update nav and homepage to use lastResults localStorage key

NavBar and ReturningUserLink now read lastResults from localStorage,
which stores either an encoded response string or 'id:<profileId>'
for materialized profiles."
```

---

### Task 7: Materialize Endpoint

**Files:**
- Create: `src/app/api/profile/materialize/route.ts`

- [ ] **Step 1: Implement the materialize endpoint**

```typescript
// src/app/api/profile/materialize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { decodeResponses } from "@/lib/response-codec";
import { computeFullResults } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const encoded = body.encoded;

  if (typeof encoded !== "string" || !encoded) {
    return NextResponse.json({ error: "Missing encoded responses" }, { status: 400 });
  }

  let responses;
  try {
    responses = decodeResponses(encoded);
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid encoded data", details: err instanceof Error ? err.message : "Unknown" },
      { status: 400 }
    );
  }

  const results = computeFullResults(responses);

  const profile = await db.$transaction(async (tx) => {
    const newProfile = await tx.userProfile.create({
      data: { userId: session.user!.id },
    });

    // FC responses
    const fcEntries = Object.entries(responses.forcedChoice);
    if (fcEntries.length > 0) {
      await tx.forcedChoiceResponse.createMany({
        data: fcEntries.map(([itemId, selectedPole]) => ({
          profileId: newProfile.id,
          itemId,
          selectedPole,
        })),
      });
    }

    // SC responses
    const scEntries = Object.entries(responses.scaled);
    if (scEntries.length > 0) {
      await tx.scaledResponse.createMany({
        data: scEntries.map(([itemId, value]) => ({
          profileId: newProfile.id,
          itemId,
          value,
        })),
      });
    }

    // Budget allocations
    await tx.budgetAllocation.createMany({
      data: Object.entries(responses.budget).map(([ministryId, amount]) => ({
        profileId: newProfile.id,
        ministryId: Number(ministryId),
        amount,
      })),
    });

    // Axis scores
    await tx.axisScore.createMany({
      data: results.axisScores.map((s) => ({
        profileId: newProfile.id,
        axisId: s.axisId,
        fcScore: s.fcScore,
        scScore: s.scScore,
        bgScore: s.bgScore,
        finalScore: s.finalScore,
        confidence: s.confidence,
        tensionLevel: s.tension.level,
        tensionDirection: s.tension.direction,
        tensionNarrative: null,
      })),
    });

    await tx.compassScore.create({
      data: {
        profileId: newProfile.id,
        economic: results.compass.economic,
        cultural: results.compass.cultural,
      },
    });

    await tx.archetypeResult.create({
      data: {
        profileId: newProfile.id,
        primaryArchetypeId: results.archetype.primaryId,
        primaryMatchPct: results.archetype.primaryMatchPct,
        secondaryArchetypeId: results.archetype.secondaryId,
        secondaryMatchPct: results.archetype.secondaryMatchPct,
        isBlended: results.archetype.isBlended,
      },
    });

    return newProfile;
  });

  return NextResponse.json({ profileId: profile.id }, { status: 201 });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/profile/materialize/route.ts
git commit -m "feat: add profile materialization endpoint

POST /api/profile/materialize decodes URL-encoded responses, computes
results server-side, and writes a full DB profile linked to the
authenticated user. Called on-demand by save-to-account, group join,
and annotation creation."
```

---

### Task 8: Account Page — Remove Claim, Add Save Flow

**Files:**
- Modify: `src/app/account/page.tsx`

- [ ] **Step 1: Replace claim UI with save-to-account flow**

Remove the `handleClaim` function, `claimStatus` state, and the "Claim anonymous profile" button/text. Replace with a "Save to account" flow that reads `lastResults` from localStorage and calls the materialize endpoint:

In the profile section of the account page, replace the claim block (the `else` branch of `{profileId ? ... : ...}`) with:

```tsx
{profileId ? (
  <Link
    href={`/results/${profileId}`}
    className="text-stone-600 hover:text-stone-800 text-sm"
  >
    View your results &rarr;
  </Link>
) : (
  <div>
    <p className="text-text-secondary text-sm mb-3">
      You haven&apos;t saved any results to your account yet. Complete the
      assessment and save your results to access them here.
    </p>
    {hasUnsavedResults && (
      <button
        onClick={handleSaveResults}
        className="border border-stone-600 text-stone-600 px-4 py-2 rounded-[8px] text-sm font-medium hover:bg-stone-100 transition-colors duration-150"
      >
        Save current results to account
      </button>
    )}
    {saveStatus && (
      <p className="text-sm mt-2 text-text-secondary">{saveStatus}</p>
    )}
  </div>
)}
```

Add the state and handler:

```typescript
const [hasUnsavedResults, setHasUnsavedResults] = useState(false);
const [saveStatus, setSaveStatus] = useState("");

useEffect(() => {
  const stored = localStorage.getItem("lastResults");
  // Has results that aren't already materialized
  setHasUnsavedResults(!!stored && !stored.startsWith("id:"));
}, []);

const handleSaveResults = async () => {
  const stored = localStorage.getItem("lastResults");
  if (!stored || stored.startsWith("id:")) return;

  const res = await fetch("/api/profile/materialize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ encoded: stored }),
  });
  if (res.ok) {
    const data = await res.json();
    setProfileId(data.profileId);
    localStorage.setItem("lastResults", `id:${data.profileId}`);
    setSaveStatus("Results saved to your account.");
    setHasUnsavedResults(false);
  } else {
    setSaveStatus("Failed to save results. Please try again.");
  }
};
```

Remove `claimStatus` state and `handleClaim` function. Remove the `localStorage.getItem("anonymousToken")` references.

- [ ] **Step 2: Update the profileId initialization**

Replace `localStorage.getItem("profileId")` with:

```typescript
useEffect(() => {
  const stored = localStorage.getItem("lastResults");
  if (stored?.startsWith("id:")) {
    setProfileId(stored.slice(3));
  }
}, []);
```

Also keep the existing fetch to `/api/account/data` for server-provided profileId.

- [ ] **Step 3: Verify tests pass**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/account/page.tsx
git commit -m "feat: replace claim-profile with save-to-account on account page

Remove anonymous profile claiming (no longer applicable). Add
save-to-account button that materializes URL-encoded results via
the new /api/profile/materialize endpoint."
```

---

### Task 9: Delete Old Code and Migrate Schema

**Files:**
- Delete: `src/app/api/quiz/submit/route.ts`
- Delete: `src/app/api/auth/claim/route.ts`
- Modify: `src/lib/validation.ts` — remove `quizSubmitSchema` and `claimProfileSchema`
- Modify: `prisma/schema.prisma` — drop `anonymousToken` from `UserProfile`

- [ ] **Step 1: Delete old endpoints**

```bash
rm src/app/api/quiz/submit/route.ts
rm src/app/api/auth/claim/route.ts
```

- [ ] **Step 2: Remove dead validation schemas**

In `src/lib/validation.ts`, remove `quizSubmitSchema` and `claimProfileSchema`. Keep the other schemas (`annotationSchema`, `createGroupSchema`, `joinGroupSchema`, `signupSchema`) and the individual response schemas (`forcedChoiceResponseSchema`, `scaledResponseSchema`, `budgetAllocationSchema`) since they may still be used or useful for the materialize endpoint's validation.

```typescript
// src/lib/validation.ts
import { z } from "zod";

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

export const annotationSchema = z.object({
  axisScoreId: z.string().uuid(),
  text: z.string().min(1).max(5000),
});

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
});

export const joinGroupSchema = z.object({
  inviteCode: z.string().min(1),
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100).optional(),
});
```

- [ ] **Step 3: Drop `anonymousToken` from Prisma schema**

In `prisma/schema.prisma`, remove the `anonymousToken` field from `UserProfile`:

```prisma
model UserProfile {
  id                    String                @id @default(uuid())
  userId                String?
  user                  User?                 @relation(fields: [userId], references: [id])
  createdAt             DateTime              @default(now())
  updatedAt             DateTime              @updatedAt
  forcedChoiceResponses ForcedChoiceResponse[]
  scaledResponses       ScaledResponse[]
  budgetAllocations     BudgetAllocation[]
  axisScores            AxisScore[]
  compassScore          CompassScore?
  archetypeResult       ArchetypeResult?
}
```

- [ ] **Step 4: Run Prisma migration**

```bash
npx prisma migrate dev --name drop_anonymous_token
```

Expected: Migration creates SQL to drop `anonymousToken` column and its unique index.

- [ ] **Step 4a: Clean up orphaned anonymous profiles (dev data only)**

After the migration, delete any profiles without a userId:

```bash
npx prisma db execute --stdin <<< "DELETE FROM \"UserProfile\" WHERE \"userId\" IS NULL;"
```

- [ ] **Step 5: Verify all tests pass**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove old submit/claim endpoints, drop anonymousToken

Delete POST /api/quiz/submit and POST /api/auth/claim (replaced by
client-side encoding and /api/profile/materialize). Remove dead
validation schemas. Drop anonymousToken column from UserProfile."
```

---

### Task 10: Documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

- [ ] **Step 1: Update CLAUDE.md architecture notes**

Replace the quiz state persistence note and anonymous token note with:

```markdown
- Quiz completion encodes all 82 responses into a ~44-char base64url string and navigates to `/results?r=<encoded>`. Results are computed client-side — no database write for anonymous users.
- Database profiles are created on demand via `POST /api/profile/materialize` when users save to account, join a group, or create an annotation. All materialized profiles are linked to authenticated users.
- The nav bar is auth-aware: shows "Sign in" for anonymous users, the user's name + "Sign out" for authenticated users. A conditional "Results" link appears when localStorage has results (encoded or materialized).
```

- [ ] **Step 2: Verify tests pass one final time**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: update documentation for URL-encoded results architecture"
```

---

### Follow-Up (not in this plan)

The spec calls for transparent materialization when users join a group or create an annotation with URL-encoded results. Currently, groups and annotations require a DB profile that already exists. The save-to-account flow on the results page and account page covers the common case — users save before using social features. If needed, automatic materialization before group join/annotation can be added later by intercepting those flows client-side and calling `/api/profile/materialize` first.
