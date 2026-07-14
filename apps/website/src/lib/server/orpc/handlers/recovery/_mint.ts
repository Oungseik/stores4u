import { db, verification } from "$lib/server/db";

/** Reset links live 1 hour (matches better-auth's default). */
export const RESET_TTL_MS = 60 * 60 * 1000;

/**
 * Insert a row into better-auth's `verification` table in the exact shape its
 * endpoints consume. We mint tokens ourselves (rather than calling better-auth's
 * /forget-password and /sign-in/magic-link request endpoints) so we can surface
 * both the offline (LAN) and online link pairs — better-auth's send callbacks
 * only ever see the single online URL.
 */
export async function mintVerification(opts: {
  identifier: string;
  value: string;
  ttlMs: number;
}): Promise<void> {
  const now = new Date();
  await db.insert(verification).values({
    id: Bun.randomUUIDv7(),
    identifier: opts.identifier,
    value: opts.value,
    expiresAt: new Date(now.getTime() + opts.ttlMs),
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Mint a password-reset token (`identifier: reset-password:<token>`,
 * `value: userId`). The reset landing POSTs to /api/auth/reset-password with
 * the bare token.
 */
export async function mintResetToken(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  await mintVerification({
    identifier: `reset-password:${token}`,
    value: userId,
    ttlMs: RESET_TTL_MS,
  });
  return token;
}
