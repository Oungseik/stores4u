import { SOCIAL_PLATFORMS } from "@repo/config";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, socialConnection } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
});

export const disconnectPlatformHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    await db
      .delete(socialConnection)
      .where(
        and(
          eq(socialConnection.shopId, context.shop.id),
          eq(socialConnection.platform, input.platform),
        ),
      );

    return { success: true };
  });
