/**
 * Ceiling on how many profiles one account may materialize.
 *
 * `POST /api/profile/materialize` writes a profile plus roughly eighty child
 * rows on every call and never reuses an existing one, so without a ceiling a
 * signed-in script can grow the database without bound. Saving results is a
 * deliberate, occasional act — a couple of dozen is far beyond ordinary use.
 */
export const MAX_PROFILES_PER_USER = 25;
