import bcrypt from "bcryptjs";

import { findUserByEmail } from "./user-lookup";

type Credentials = Partial<Record<"email" | "password", unknown>> | undefined;

/**
 * Verifies an email/password pair for the NextAuth credentials provider.
 * Lookup is case-insensitive: signup stores lowercase, but accounts created
 * before normalization kept whatever casing the user typed, and an exact match
 * would lock those people out of their own accounts.
 */
export async function authorizeCredentials(credentials: Credentials) {
  const email = credentials?.email;
  const password = credentials?.password;
  if (typeof email !== "string" || typeof password !== "string") return null;
  if (!email || !password) return null;

  const user = await findUserByEmail(email);
  if (!user?.passwordHash) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, email: user.email, name: user.name };
}
