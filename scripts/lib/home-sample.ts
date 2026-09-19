/**
 * Chooses the illustrative persona pair shown on the home page.
 *
 * The page's story is "two people who mostly agree, diverging on a few
 * things", so the criteria demand both: at least three axes that diverge
 * strongly enough to fill the divergence panel, and at least four that agree
 * closely. Among qualifying pairs the closest is chosen, because the more
 * distant ones read as caricatures rather than as two plausible respondents.
 *
 * Deterministic: candidates are scanned in id order and ties break on id, so
 * a rebuild on unchanged data always yields the same pair.
 */
import type { TensionLevel } from "../../src/lib/study/types";

export interface SamplePersona {
  id: string;
  averaged_axis_scores: number[];
  nearest_archetype_id: string;
  n_models: number;
}

export interface HomeSamplePair {
  a: SamplePersona;
  b: SamplePersona;
  distance: number;
  /** 1-based axis ids that diverge by >= STRONG, widest gap first. */
  divergentAxisIds: number[];
}

export interface TensionProfile {
  persona_id: string;
  model: string;
  tensions: readonly {
    axis: number;
    magnitude: number;
    level: TensionLevel;
  }[];
}

export interface HomeSampleTension {
  axis: number;
  respondent: "a" | "b";
}

const STRONG = 0.8;
const CLOSE = 0.15;
const MIN_STRONG_AXES = 3;
const MIN_CLOSE_AXES = 4;

function gaps(a: SamplePersona, b: SamplePersona): number[] {
  return a.averaged_axis_scores.map((score, i) =>
    Math.abs(score - b.averaged_axis_scores[i]),
  );
}

export function selectHomeSamplePair(personas: SamplePersona[]): HomeSamplePair {
  const pool = personas
    .filter((p) => p.n_models === 2 && p.averaged_axis_scores?.length === 12)
    // Plain codepoint order, not localeCompare: the scan below is the source of
    // the selector's determinism, so it must not depend on the host locale.
    .sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));

  let best: HomeSamplePair | null = null;

  for (let i = 0; i < pool.length; i += 1) {
    for (let j = i + 1; j < pool.length; j += 1) {
      const a = pool[i];
      const b = pool[j];
      if (a.nearest_archetype_id === b.nearest_archetype_id) continue;

      const g = gaps(a, b);
      const strong = g.filter((v) => v >= STRONG).length;
      const close = g.filter((v) => v <= CLOSE).length;
      if (strong < MIN_STRONG_AXES || close < MIN_CLOSE_AXES) continue;

      const distance = Math.sqrt(g.reduce((sum, v) => sum + v * v, 0));
      // Keep-first on an exact tie (`>=`, not `>`) is the whole tie-breaking
      // mechanism: the pool is id-sorted, so the incumbent is always the
      // lower-id pair and equal distances leave it in place. Swapping this to
      // `>` would make ties resolve to the *last* pair scanned.
      if (best && distance >= best.distance) continue;

      best = {
        a,
        b,
        distance,
        divergentAxisIds: g
          .map((gap, index) => ({ gap, id: index + 1 }))
          .filter((entry) => entry.gap >= STRONG)
          .sort((x, y) => y.gap - x.gap || x.id - y.id)
          .map((entry) => entry.id),
      };
    }
  }

  if (!best) {
    // A library, so this throws rather than calling process.exit. The numbers
    // are in the message because the only way to debug this from a CI log is
    // to know how big the pool was and which bar the data failed to clear.
    throw new Error(
      `home sample: no qualifying pair among ${pool.length} dual-model personas ` +
        `(need >=${MIN_STRONG_AXES} gaps >=${STRONG} and >=${MIN_CLOSE_AXES} gaps <=${CLOSE})`,
    );
  }
  return best;
}

function consensusTensions(
  profiles: readonly TensionProfile[],
  personaId: string,
): { axis: number; meanMagnitude: number }[] {
  const profilesByModel = new Map(
    profiles
      .filter((profile) => profile.persona_id === personaId)
      .map((profile) => [profile.model, profile] as const),
  );
  const modelProfiles = [...profilesByModel.values()];
  if (modelProfiles.length < 2) return [];

  return modelProfiles[0].tensions
    .filter((tension) => tension.level === "strong")
    .flatMap((tension) => {
      const magnitudes = modelProfiles.map(
        (profile) =>
          profile.tensions.find(
            (candidate) =>
              candidate.axis === tension.axis && candidate.level === "strong",
          )?.magnitude,
      );
      const completeMagnitudes = magnitudes.filter(
        (magnitude): magnitude is number => magnitude !== undefined,
      );
      if (completeMagnitudes.length !== modelProfiles.length) return [];

      return [{
        axis: tension.axis,
        meanMagnitude:
          completeMagnitudes.reduce((sum, magnitude) => sum + magnitude, 0) /
          completeMagnitudes.length,
      }];
    })
    .sort(
      (x, y) => y.meanMagnitude - x.meanMagnitude || x.axis - y.axis,
    );
}

export function selectHomeSampleTension(
  profiles: readonly TensionProfile[],
  respondentAId: string,
  respondentBId: string,
): HomeSampleTension | null {
  for (const [personaId, respondent] of [
    [respondentAId, "a"],
    [respondentBId, "b"],
  ] as const) {
    const strongest = consensusTensions(profiles, personaId)[0];
    if (strongest) return { axis: strongest.axis, respondent };
  }
  return null;
}
