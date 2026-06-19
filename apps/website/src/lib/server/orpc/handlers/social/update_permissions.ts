import { ORPCError } from "@orpc/server";
import { SOCIAL_PLATFORMS } from "@repo/config";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, socialConnection } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const permissionsSchema = z.object({
  autoPostProducts: z.boolean(),
  manualPosting: z.boolean(),
  postPromotions: z.boolean(),
  postOrderUpdates: z.boolean(),
});

const input = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  permissions: permissionsSchema,
});

export const updatePermissionsHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const existing = await db.query.socialConnection.findFirst({
      where: { shopId: context.shop.id, platform: input.platform },
    });

    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: "Connection not found",
      });
    }

    await db
      .update(socialConnection)
      .set({
        permissions: input.permissions,
        updatedAt: new Date(),
      })
      .where(eq(socialConnection.id, existing.id));

    return { success: true };
  });
