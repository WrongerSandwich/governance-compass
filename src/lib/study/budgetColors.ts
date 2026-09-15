/**
 * The budget strip's seven ministries: their canonical order, their display
 * names, and their fills.
 *
 * The order and the fills live in one module because they are bound
 * POSITIONALLY — both consumers render `BUDGET_COLORS[i % length]` where `i`
 * is the index into `MINISTRY_ORDER`, so reordering one without the other
 * silently repaints every segment. They were previously two pairs of
 * byte-identical copies in two files with nothing tying them together.
 *
 * Fills: pragmatic reuse of the cluster palette. Seven segments need seven
 * distinct hues, and the cluster tokens happen to provide a coherent six-colour
 * set within the warm stone family. Nothing here is semantically tied to
 * cluster identity.
 *
 * `--stone-400` is the seventh fill deliberately, and it stays. It is declared
 * once in `:root` and never redefined in the dark block — `#b5a594` in both
 * modes, a mid tone that reads on `#ffffff` and on `#2a2118` alike. The
 * section's mark-tone guard bans 600 and 400 because those are the *mark*
 * tones, and a mark has to step in sympathy with every other mark on the page.
 * This is not a mark: it is one categorical fill among seven whose only job is
 * to differ from the six beside it — the same reasoning that already exempts
 * `--stone-900` and `--stone-50` as contrast ink. Growing the ramp by one
 * invented token to satisfy the guard would break the delta's opening
 * constraint, "no new colours".
 */

/** Render order of the seven ministry segments. Indexes `BUDGET_COLORS`. */
export const MINISTRY_ORDER = [
  "defense",
  "public_welfare",
  "economy_growth",
  "education_research",
  "environment",
  "justice_civil_liberties",
  "foreign_affairs",
] as const;

/** Budget key (snake_case) → ministry display name. */
export const BUDGET_LABELS: Record<string, string> = {
  defense: "Defense",
  public_welfare: "Public Welfare",
  economy_growth: "Economy & Growth",
  education_research: "Education & Research",
  environment: "Environment",
  justice_civil_liberties: "Justice & Civil Liberties",
  foreign_affairs: "Foreign Affairs",
};

/** Segment fills, positionally aligned with `MINISTRY_ORDER`. */
export const BUDGET_COLORS = [
  "var(--cluster-5)",
  "var(--cluster-4)",
  "var(--cluster-0)",
  "var(--cluster-3)",
  "var(--cluster-1)",
  "var(--cluster-2)",
  "var(--stone-400)",
] as const;
