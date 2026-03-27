# PoliticalPlatform — Design Spec

A web-based political self-assessment tool where users take a research-backed questionnaire and receive a multi-dimensional profile of their political views. Users can refine their profile over time, annotate their positions with personal reasoning, and compare views with friends one-on-one or in private groups.

## Target Audience & Rollout

Initial launch to friends and family for testing and question refinement, then opened publicly. The system should support both anonymous casual users and registered users who want to persist and share their profiles.

## Stack

- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Database:** PostgreSQL (Vercel Postgres, Neon, or Railway)
- **ORM:** Prisma
- **Auth:** NextAuth.js v5 (credentials + Google OAuth)
- **Styling:** Tailwind CSS
- **Charts:** Recharts (radar chart, spectrum visualizations)
- **Validation:** Zod
- **Testing:** Vitest (unit/integration), Playwright (e2e)
- **Deployment:** Vercel (free tier for initial phase)

## Data Model

### Topic

A political domain with a defined spectrum.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | string | Display name (e.g., "Healthcare") |
| description | string | Brief explanation of what this topic covers |
| icon | string | Icon identifier for UI |
| spectrumLabelLeft | string | Left endpoint label (e.g., "Universal coverage") |
| spectrumLabelRight | string | Right endpoint label (e.g., "Free market") |
| spectrumLabelCenter | string | Midpoint label (e.g., "Mixed/hybrid approach") |
| order | int | Display ordering |

### Question

Belongs to a Topic. Multiple questions per topic to triangulate a nuanced position.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| topicId | UUID | Foreign key → Topic |
| text | string | The question text |
| context | string? | Optional explainer (e.g., "This refers to federal-level policy") |
| polarity | 1 or -1 | Whether "Strongly Agree" maps to the left (+) or right (-) of the spectrum |
| order | int | Ordering within the topic |

Answer options are a fixed 5-point Likert scale (Strongly Disagree, Disagree, Neutral, Agree, Strongly Agree) mapping to values -2, -1, 0, +1, +2. These are not stored as a separate entity — they're implicit in the UI and scoring logic.

### UserProfile

The result container for a quiz attempt.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key, used in URLs |
| userId | UUID? | Foreign key → User (null for anonymous) |
| anonymousToken | string? | UUID stored in localStorage for anonymous profiles |
| createdAt | timestamp | When the quiz was first taken |
| updatedAt | timestamp | Last modification |

### Answer

Individual question responses, belonging to a UserProfile.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| profileId | UUID | Foreign key → UserProfile |
| questionId | UUID | Foreign key → Question |
| value | int | -2 to +2 (or null if skipped) |
| skipped | boolean | Whether the user explicitly skipped |
| answeredAt | timestamp | When this answer was last set |

### TopicScore

Computed score per topic, belonging to a UserProfile. Recalculated when answers change.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| profileId | UUID | Foreign key → UserProfile |
| topicId | UUID | Foreign key → Topic |
| score | float | Normalized 0–100 (0 = left endpoint, 100 = right endpoint) |
| answeredCount | int | Number of questions answered in this topic |
| insufficientData | boolean | True if fewer than 2 questions answered |

### Annotation

User notes on a topic score. Requires an account.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| topicScoreId | UUID | Foreign key → TopicScore |
| userId | UUID | Foreign key → User |
| text | string | Free-text reasoning, caveats, context |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### User

Optional account for persistence and social features.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| email | string | Unique |
| name | string? | Display name |
| passwordHash | string? | For credential auth |
| oauthProvider | string? | e.g., "google" |
| oauthId | string? | Provider-specific ID |
| createdAt | timestamp | |

### Group

A private comparison circle.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | string | Group display name |
| inviteCode | string | Short shareable code (e.g., "ABCD-1234") |
| creatorId | UUID | Foreign key → User |
| showNames | boolean | Whether member names are visible (default true) |
| createdAt | timestamp | |

### GroupMember

Join table for Group ↔ User.

| Field | Type | Description |
|-------|------|-------------|
| groupId | UUID | Foreign key → Group |
| userId | UUID | Foreign key → User |
| joinedAt | timestamp | |

### TopicVisibility

Controls which topics a user hides from comparisons. Absence of a row means the topic is visible (default).

| Field | Type | Description |
|-------|------|-------------|
| userId | UUID | Foreign key → User |
| topicId | UUID | Foreign key → Topic |
| hidden | boolean | True = hidden from comparisons |

## Pages & Routes

| Route | Description | Rendering |
|-------|-------------|-----------|
| `/` | Landing page with CTA to start quiz | Server |
| `/quiz` | Full questionnaire, grouped by topic | Client |
| `/quiz/[topic]` | Deep-link to retake a specific topic | Client |
| `/results/[profileId]` | Results dashboard: radar chart, spectrums, insights | Server (shareable) |
| `/results/[profileId]/[topic]` | Single topic drill-down: answers, spectrum, annotations | Server + Client |
| `/compare/[profileId1]/[profileId2]` | Side-by-side comparison of two profiles | Server |
| `/groups/[groupId]` | Group comparison dashboard | Server + Client |
| `/auth/signin` | Sign in | Server |
| `/auth/signup` | Create account | Server |
| `/account` | Profile management, groups, link anonymous results | Client |

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/quiz/submit` | Submit all answers, creates UserProfile, returns profileId |
| PATCH | `/api/quiz/[profileId]/answers` | Update individual answers on retake |
| GET | `/api/results/[profileId]` | Fetch computed scores and insights |
| POST | `/api/annotations` | Create or update an annotation on a topic score |
| POST | `/api/groups` | Create a new group |
| POST | `/api/groups/[groupId]/join` | Join group via invite code |
| GET | `/api/groups/[groupId]/compare` | Aggregated group comparison data |
| POST | `/api/auth/claim` | Link anonymous profile to a new or existing account |

## Quiz Experience

### Flow

1. Landing page → "Start Quiz" CTA
2. Brief intro explaining what they'll get and estimated time (~15-20 min)
3. Questions presented one topic at a time, with a progress bar showing topics completed
4. Each question: text, optional context, 5-point Likert scale (Strongly Disagree → Strongly Agree)
5. Users can skip questions (scored as neutral, flagged as skipped)
6. After all topics: review screen showing all answers before submission
7. Submit → scoring → redirect to results page

### Question Design

- 10-12 topics initially, 5-8 questions per topic (~50-90 questions total)
- Questions target concrete policy positions, not abstract values
- No loaded language, false dichotomies, or unnecessarily US-centric framing
- Each topic's question set covers the full range of the issue's spectrum

### Research Sources

- Pew Political Typology
- 8values framework
- ISideWith question bank (for reference, not copying)
- Political science literature on issue dimensionality

## Scoring Logic

All scoring is server-side, implemented as pure functions.

1. Each answer maps to a raw value: Strongly Disagree (-2), Disagree (-1), Neutral (0), Agree (+1), Strongly Agree (+2)
2. Multiply by the question's polarity flag (+1 or -1) to normalize direction on the spectrum
3. Per-topic score = mean of all answered (non-skipped) questions in that topic
4. Normalize the mean from the [-2, +2] range to a 0–100 scale (0 = left endpoint, 100 = right endpoint)
5. If fewer than 2 questions answered in a topic, mark as "insufficient data" instead of showing a potentially misleading score
6. Skipped questions are excluded from the average

## Insight Generation

Rules-based pattern matching on computed scores:

- **Per-topic descriptions:** Map score ranges to plain-language descriptions (e.g., score 0-20: "You strongly favor government-administered universal healthcare")
- **Cross-topic patterns:** Detect combinations (e.g., progressive on social + moderate on fiscal → "socially liberal, fiscally moderate")
- **Notable divergences:** Flag when a user's positions on related topics diverge significantly

Insights are descriptive, not prescriptive. No "you are a liberal" labels — just observations about where positions cluster.

## Comparison Features

### One-on-One

- Share results URL → recipient sees a "Compare with mine" button (if they have a local or logged-in profile)
- Comparison page shows:
  - Radar chart with both profiles overlaid (two colors)
  - Per-topic spectrums with both markers
  - Overall alignment score: 100 minus the mean of absolute per-topic score differences (so 100% = identical, 0% = maximally divergent on every topic). Topics hidden by either user are excluded.
  - Per-topic deltas highlighting closest and furthest-apart topics

### Groups

- Logged-in user creates a group → receives a short invite code
- Group dashboard shows:
  - Per-topic view: all members' positions as dots on each spectrum
  - Heat map: topics with high agreement vs. wide spread
  - Group average overlaid on radar chart
- Creator controls "show names" vs. "anonymous mode" toggle
- Members can leave; creator can remove members

## Privacy

- Anonymous profiles are accessible only via their URL (UUID) — no discovery mechanism
- Group membership requires an account
- Users can hide specific topics from comparisons
- No public directory of profiles or groups

## Visualization

### Radar Chart (Overview)

All topics plotted on a single radar/spider chart. Provides an instant "shape" of the political profile. Supports overlaying multiple profiles for comparison.

### Spectrum Bars (Per-Topic)

Horizontal bars with labeled endpoints for each topic. User's position marked with a dot/marker. In comparison mode, multiple markers on the same spectrum.

### Insight Cards

Plain-language summary cards below the charts. Describe the user's positions in readable terms and highlight notable patterns.

## Testing Strategy

- **Scoring logic:** Unit tests (pure functions, comprehensive edge cases)
- **API routes:** Integration tests against a test database
- **User flows:** Playwright e2e tests for quiz completion, results viewing, comparison
- **Data validation:** Build-time checks ensuring no orphaned questions, all topics have sufficient questions, spectrum labels exist

## Out of Scope (for now)

- Email notifications
- Admin dashboard for managing questions (edit data files directly)
- Public profile discovery or search
- Adaptive/dynamic question logic
- Mobile app (responsive web is sufficient)
- Social login providers beyond Google
