import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";

import { db } from "./db";
import { normalizeEmail } from "./user-lookup";

/**
 * The Prisma adapter writes OAuth accounts directly, bypassing the signup
 * route's normalization. Lookups match the stored address exactly, so a row
 * written as `Foo@x.com` would be invisible to credentials login and could
 * sit alongside a `foo@x.com` account as a second identity for one person.
 * Normalizing here keeps every write path on the same rule.
 */
export function normalizingPrismaAdapter(): Adapter {
  // Auth.js currently types its Prisma adapter against Prisma Client v6 even
  // though its runtime contract is compatible with Prisma 7's generated client.
  const adapter = PrismaAdapter(
    db as unknown as Parameters<typeof PrismaAdapter>[0]
  );

  return {
    ...adapter,
    createUser: (user) =>
      adapter.createUser!({ ...user, email: normalizeEmail(user.email) }),
    getUserByEmail: (email) => adapter.getUserByEmail!(normalizeEmail(email)),
  };
}
