/**
 * The budget strip's seven ministry fills, in `MINISTRY_ORDER`.
 *
 * Pragmatic reuse of the cluster palette: seven segments need seven distinct
 * hues, and the cluster tokens happen to provide a coherent six-colour set
 * within the warm stone family. Nothing here is semantically tied to cluster
 * identity.
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
 *
 * Lives here because `PersonaModal`'s `BudgetStrip` and `CompareView`'s
 * `MiniBudgetStrip` each declared a byte-identical copy, and the modal's was
 * declared *inside* the component, so it was reallocated on every render.
 */
export const BUDGET_COLORS = [
  "var(--cluster-5)",
  "var(--cluster-4)",
  "var(--cluster-0)",
  "var(--cluster-3)",
  "var(--cluster-1)",
  "var(--cluster-2)",
  "var(--stone-400)",
];
