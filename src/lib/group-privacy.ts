import { createHmac, randomBytes } from "crypto";

let generatedKey: string | null = null;

/**
 * Key used to derive member handles. Deriving from the auth secret keeps
 * handles stable across server processes; when no secret is configured (local
 * dev) a per-process random key is generated instead, which is just as opaque.
 * Nothing persists a handle, so it only has to stay stable for one request.
 */
export function memberHandleKey(
  env: Record<string, string | undefined> = process.env
): string {
  const secret = env.NEXTAUTH_SECRET || env.AUTH_SECRET;
  if (secret) return secret;
  generatedKey ??= randomBytes(32).toString("hex");
  return generatedKey;
}

/**
 * Opaque per-group identifier for a group member.
 *
 * The compare view renders one row per member, so the client needs a key, but a
 * raw `userId` is stable across every group: publishing it lets anyone who
 * learns an id elsewhere de-anonymize that person's scores in every anonymous
 * group they share. Binding the id to the group (and to a server-side key)
 * keeps rows addressable within one group while making the same person's
 * handles unlinkable between groups.
 */
export function groupMemberHandle(
  key: string,
  groupId: string,
  userId: string
): string {
  return createHmac("sha256", key)
    .update(`${groupId} ${userId}`)
    .digest("base64url")
    .slice(0, 22);
}
