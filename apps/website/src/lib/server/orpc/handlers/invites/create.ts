import { z } from "zod";
import { getRequestEvent } from "$app/server";
import { db, type InviteRole, invite } from "$lib/server/db";
import { buildLinks, type LinkPair } from "$lib/server/links";
import { os, ownerMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  role: z.enum(["admin", "member"]).meta({ description: "Role the accepted invite grants." }),
});

/** Invite links live 15 minutes (Q8.1). */
export const INVITE_TTL_MS = 15 * 60 * 1000;

export const createInviteHandler = os
  .use(ownerMiddleware)
  .input(input)
  .handler(async ({ input, context }) => {
    const token = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + INVITE_TTL_MS);

    await db.insert(invite).values({
      token,
      role: input.role as InviteRole,
      createdById: context.session.user.id,
      createdAt: now,
      expiresAt,
    });

    // Build both the offline (request origin = LAN) and online (BETTER_AUTH_URL)
    // versions so the owner can hand over whichever network is reachable.
    const origin = getRequestEvent().url.origin;
    const links: LinkPair = buildLinks({ token, path: "/invite", requestOrigin: origin });

    return { role: input.role, links, expiresAt };
  });
