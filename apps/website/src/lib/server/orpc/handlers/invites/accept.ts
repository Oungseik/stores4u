import { getRequestEvent } from "$app/server";
import { ORPCError } from "@orpc/server";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "$lib/server/auth";
import { account, db, invite, user, type InviteRole } from "$lib/server/db";
import { os } from "$lib/server/orpc/base";

const input = z.object({
  token: z.string().min(1),
  name: z.string().min(1).max(100),
  email: z.email(),
  password: z.string().min(8).max(128),
});

/**
 * Consume an invite link. The token authorizes creating a dashboard account
 * with the role baked into the row. We insert user + credential account
 * directly (bypassing the user-create hook, which blocks all post-setup
 * signup), then sign in — sveltekitCookies applies the session cookie via
 * getRequestEvent().
 */
export const acceptInviteHandler = os.input(input).handler(async ({ input }) => {
  const now = new Date();
  const row = await db.query.invite.findFirst({ where: { token: input.token } });
  if (!row || row.consumedAt || row.expiresAt < now) {
    throw new ORPCError("BAD_REQUEST", { message: "Invite link is invalid or expired." });
  }

  const emailTaken = await db.query.user.findFirst({
    where: { email: input.email },
    columns: { id: true },
  });
  if (emailTaken) {
    throw new ORPCError("BAD_REQUEST", { message: "That email is already in use." });
  }

  const userId = Bun.randomUUIDv7();
  const passwordHash = await hashPassword(input.password);

  await db.insert(user).values({
    id: userId,
    name: input.name,
    email: input.email,
    emailVerified: true,
    role: row.role as InviteRole,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(account).values({
    id: Bun.randomUUIDv7(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: passwordHash,
    createdAt: now,
    updatedAt: now,
  });
  await db
    .update(invite)
    .set({ consumedAt: now, consumedById: userId })
    .where(eq(invite.token, input.token));

  await auth.api.signInEmail({
    body: { email: input.email, password: input.password },
    headers: getRequestEvent().request.headers,
  });

  return { role: row.role };
});
