# URL-Encoded Results with On-Demand Materialization

Replace the current "always write to database" quiz submission flow with URL-encoded results that are computed client-side. Database profiles are only created when a user explicitly needs persistence (saving to account, joining a group, creating an annotation). This eliminates ~97 database rows per anonymous quiz completion and makes results URLs deterministic — same answers produce the same URL.

## Encoding Format

82 response values packed into a compact, URL-safe string using bitpacking + base64url.

| Field | Values | Bits per item | Total bits |
|-------|--------|--------------|------------|
| Version | 1 byte prefix (currently `0x01`) | 8 | 8 |
| 36 FC responses | A/B/skip (3 states) | 2 | 72 |
| 36 SC responses | 1-5/skip (6 states) | 3 | 108 |
| 10 budget allocations | 5-95 range (91 values) | 7 | 70 |

**Total: 258 bits = 33 bytes = ~44 chars base64url.**

- FC encoding: `00` = skip, `01` = A, `10` = B
- SC encoding: `000` = skip, `001`-`101` = values 1-5
- Budget encoding: 7-bit unsigned integer, offset by -5 (so 5 encodes as 0, 95 as 90)
- Version byte enables future scoring algorithm changes — old URLs can be decoded and re-scored or flagged

URL format: `/results?r=AaF3x9Mk2pLs8nQ...` (~50 chars total with prefix).

**New module: `src/lib/response-codec.ts`** — pure functions:
- `encodeResponses(responses: QuizResponses): string`
- `decodeResponses(encoded: string): QuizResponses`
- No dependencies beyond `QuizResponses` type from `scoring-types.ts`

FC and SC items are encoded in axis order (axis 1 items first, then axis 2, etc.), matching the order in `forced-choice-items.ts` and `scaled-items.ts`. Budget allocations are encoded in ministry ID order (1-10). The decoder must use the same item ordering to reconstruct the `QuizResponses` object with correct item ID keys.

## Quiz Completion Flow

### Current flow (being replaced)
```
"Finalize budget" click
  → POST /api/quiz/submit (server scores + writes 97 DB rows)
  → Response: { profileId, anonymousToken }
  → localStorage.setItem("profileId", ...)
  → localStorage.setItem("anonymousToken", ...)
  → Navigate to /results/[profileId]
```

### New flow
```
"Finalize budget" click
  → encodeResponses(responses) client-side
  → localStorage.setItem("lastResults", encodedString)
  → Navigate to /results?r=<encoded>
  → Results page decodes + computeFullResults() client-side
```

The "Computing your results" loading screen (animated Stone 600 line, 1.5-2s) stays. It now represents client-side scoring via `computeFullResults()` rather than a network request. The scoring engine is already pure TypeScript with no DB dependencies.

`sessionStorage` quiz state persistence is unchanged — still needed for resume-on-refresh during the quiz. It should be cleared after successful navigation to results.

## Results Page — Dual Source

The results page accepts either source and renders identically.

**Two URL patterns:**
- `/results?r=<encoded>` — decode and compute client-side (common path)
- `/results/[profileId]` — fetch from DB via existing `GET /api/results/[profileId]` (materialized profiles)

**Loading logic:**
1. Check for `?r=` query param → decode, `computeFullResults()`, render
2. Check for `[profileId]` path param → `GET /api/results/[profileId]`, render
3. Neither → redirect to `/quiz`

In Next.js App Router, these are two route files: `/results/page.tsx` (handles `?r=` query param) and the existing `/results/[profileId]/page.tsx` (handles DB profiles). Both produce the same `QuizResults` shape and share the same rendering components. All existing results components (RadarChart, CompassPlot, ArchetypeCard, AxisBreakdownCard, ScoreBar) are unchanged.

**localStorage for the nav "Results" link:**
After results are loaded from either source, store a reference:
- URL-encoded source: `localStorage.setItem("lastResults", encodedString)`
- Materialized source: `localStorage.setItem("lastResults", "id:" + profileId)`

The NavBar and ReturningUserLink read `lastResults` and build the appropriate URL (`?r=...` or `/[profileId]`).

## Materialization — On-Demand DB Profile Creation

A single new endpoint converts URL-encoded responses into a persistent database profile.

**`POST /api/profile/materialize`**

Request body:
```json
{ "encoded": "AaF3x9Mk2pLs8nQ..." }
```

Processing:
1. Authenticate — the user must be signed in (return 401 if not)
2. Decode the encoded string via `decodeResponses()`
3. Compute results server-side via `computeFullResults()`
4. In a single transaction, create: `UserProfile` (linked to userId) + `ForcedChoiceResponse` rows + `ScaledResponse` rows + `BudgetAllocation` rows + `AxisScore` rows + `CompassScore` + `ArchetypeResult`
5. Return `{ profileId }`

**Three triggers call this endpoint transparently:**

| Trigger | Context | After materialization |
|---------|---------|----------------------|
| "Save to account" button on results page | User explicitly saves | URL switches to `/results/[profileId]`, localStorage updated |
| Joining a group | User joins via invite code | Profile added to group membership |
| Creating an annotation | User adds note to axis | Annotation attached to new profile |

All triggers require authentication. Materialization always produces an account-linked profile — no orphaned anonymous profiles.

After materialization, the client updates `localStorage.lastResults` from the encoded string to `"id:<profileId>"` so subsequent nav clicks use the DB-backed URL.

## Impact on Existing Code

### Unchanged
- `src/lib/scoring.ts` and `scoring-types.ts` — pure functions, used by both client and server
- All results visualization components
- `GET /api/results/[profileId]` endpoint
- Groups, annotations, comparison API routes — still operate on DB profiles
- Auth system (NextAuth, sign in/up pages)
- `src/data/` definitions

### Modified
- **`QuizFlow.tsx`** — replace async fetch submit with `encodeResponses()` + `router.push()`. Remove `submitError` state (no network request to fail). Clear sessionStorage after navigation.
- **Results page** — add `?r=` query param loading path alongside existing `[profileId]` path. Add "Save to account" button (visible when signed in and viewing URL-encoded results).
- **`NavBar.tsx`** — read `lastResults` from localStorage. Parse prefix to determine URL format.
- **`ReturningUserLink.tsx`** — same localStorage change as NavBar.
- **Account page** — remove "Claim anonymous profile" UI. Add link to saved profiles.
- **Group join flow** — before adding to group, materialize if the user's results are URL-encoded.
- **Annotation creation** — before saving, materialize if the user's results are URL-encoded.

### New
- **`src/lib/response-codec.ts`** — `encodeResponses()` / `decodeResponses()` pure functions
- **`POST /api/profile/materialize`** — on-demand DB write endpoint
- **Unit tests** for codec: encode-decode roundtrip, version byte handling, skip encoding, boundary values

### Removed
- **`POST /api/quiz/submit`** (`src/app/api/quiz/submit/route.ts`) — deleted
- **`POST /api/auth/claim`** (`src/app/api/auth/claim/route.ts`) — deleted (no anonymous profiles to claim)
- **`anonymousToken` column** on `UserProfile` — dropped via Prisma migration
- **`quizSubmitSchema`** from `src/lib/validation.ts`
- **Orphaned anonymous profiles** — existing profiles with no `userId` can be deleted in the migration

### Database Migration
- Drop `anonymousToken` column from `UserProfile` (nullable, no prod data at risk)
- Delete any `UserProfile` rows where `userId` is null (orphaned anonymous profiles from development)

### E2E Tests
- `quiz-flow.spec.ts` — update: quiz completion now navigates to `?r=` URL instead of `/results/[profileId]`
- `results.spec.ts` — add coverage for `?r=` param loading
- `comparison.spec.ts` — may need updates if comparison flow changes

## URL Behavior Summary

| Scenario | URL | Source |
|----------|-----|--------|
| Just completed quiz | `/results?r=AaF3x...` | Client-side decode + compute |
| Shared link from friend | `/results?r=AaF3x...` | Client-side decode + compute |
| Saved to account | `/results/[profileId]` | DB fetch |
| Returning user (not saved) | `/results?r=AaF3x...` | Rebuilt from localStorage |
| Group member viewing own | `/results/[profileId]` | DB fetch |
| Two users, same answers | `/results?r=AaF3x...` (identical URL) | Client-side, deterministic |
