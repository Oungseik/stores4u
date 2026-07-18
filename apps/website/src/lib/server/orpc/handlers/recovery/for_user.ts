import { getRequestEvent } from "$app/server";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db } from "$lib/server/db";
import { buildLinks, type LinkPair } from "$lib/server/links";
import { os, ownerMiddleware } from "$lib/server/orpc/base";
import { mintResetToken } from "./_mint";

const input = z.object({ email: z.email() });

/**
 * Owner reset-for-user (Q9-C): the owner generates a reset-link pair for a
 * specific user (by email) and copies it manually (offline + online) to hand
 * over — works when the user is locked out and email/internet is down.
 */
export const resetForUserHandler = os
  .use(ownerMiddleware)
  .input(input)
  .handler(async ({ input }) => {
    const found = await db.query.user.findFirst({
      where: { email: input.email },
      columns: { id: true },
    });
    if (!found) {
      throw new ORPCError("NOT_FOUND", { data: { key: "error_no_user_with_that_email" } });
    }

    const token = await mintResetToken(found.id);
    const links: LinkPair = buildLinks({ token, path: "/reset-password", requestOrigin: getRequestEvent().url.origin });
    return { links };
  });
