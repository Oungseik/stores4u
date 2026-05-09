import { db, socialConnection } from "$lib/server/db";
import { and, eq } from "drizzle-orm";
import { SOCIAL_PLATFORMS } from "@repo/config";
import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
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
