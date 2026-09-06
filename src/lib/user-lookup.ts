import { db } from "./db";

/**
 * Email casing is not identity: `Foo@x.com` and `foo@x.com` are one person.
 * Every write path normalizes before storing so the `User.email` unique index
 * actually enforces one account per address.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Looks up a user by email, ignoring case. Signup normalizes, so new rows are
 * always lowercase — the case-insensitive match is what lets accounts created
 * before normalization (stored as typed) still sign in.
 */
export function findUserByEmail(email: string) {
  return db.user.findFirst({
    where: { email: { equals: normalizeEmail(email), mode: "insensitive" } },
    orderBy: { createdAt: "asc" },
  });
}
