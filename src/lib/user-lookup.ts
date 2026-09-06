import { db } from "./db";

/**
 * Email casing is not identity: `Foo@x.com` and `foo@x.com` are one person.
 * Every write path normalizes before storing — the signup route and the
 * NextAuth adapter (see ./auth-adapter) — so the `User.email` unique index
 * enforces one account per address.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Looks up a user by email. The match is exact against the normalized address
 * rather than case-insensitive: Prisma compiles `mode: "insensitive"` to
 * `ILIKE`, which would make `_` and `%` in an address behave as wildcards, so
 * `foo_bar@x.com` could resolve to a different person's `fooxbar@x.com`
 * account. Exact match also uses the unique index instead of a seq scan.
 */
export function findUserByEmail(email: string) {
  return db.user.findUnique({ where: { email: normalizeEmail(email) } });
}
