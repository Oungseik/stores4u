import { ORPCError } from "@orpc/server";
import { eq, socialConnection } from "@repo/auth";
import { SOCIAL_PLATFORMS } from "@repo/config";
import { z } from "zod";
import { db } from "$lib/server/auth_db";
import { authMiddleware, os, shopMiddleware } from "$lib/server/orpc/base";

const permissionsSchema = z.object({
  autoPostProducts: z.boolean(),
  manualPosting: z.boolean(),
  postPromotions: z.boolean(),
  postOrderUpdates: z.boolean(),
});

const input = z.object({
  slug: z.string().min(1).max(100),
  platform: z.enum(SOCIAL_PLATFORMS),
  permissions: permissionsSchema,
});

export const updatePermissionsHandler = os
  .input(input)
  .use(shopMiddleware)
  .use(authMiddleware)
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
