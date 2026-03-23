import { ORPCError } from "@orpc/server";
import { socialConnection } from "@repo/auth";
import { SOCIAL_PLATFORMS } from "@repo/config";
import { z } from "zod";
import { db } from "$lib/server/auth_db";
import { authMiddleware, os, shopMiddleware } from "$lib/server/orpc/base";

const permissionsSchema = z.object({
  autoPostProducts: z.boolean().default(false),
  manualPosting: z.boolean().default(true),
  postPromotions: z.boolean().default(false),
  postOrderUpdates: z.boolean().default(false),
});

const input = z.object({
  slug: z.string().min(1).max(100),
  platform: z.enum(SOCIAL_PLATFORMS),
  pageId: z.string().min(1),
  pageName: z.string().min(1),
  pageAccessToken: z.string().min(1),
  permissions: permissionsSchema.optional(),
});

export const connectPlatformHandler = os
  .input(input)
  .use(shopMiddleware)
  .use(authMiddleware)
  .handler(async ({ input, context }) => {
    const defaultPermissions = {
      autoPostProducts: false,
      manualPosting: true,
      postPromotions: false,
      postOrderUpdates: false,
    };

    const [connection] = await db
      .insert(socialConnection)
      .values({
        shopId: context.shop.id,
        platform: input.platform,
        providerAccountId: input.pageId,
        pageId: input.pageId,
        pageName: input.pageName,
        pageAccessToken: input.pageAccessToken,
        permissions: input.permissions || defaultPermissions,
      })
      .onConflictDoUpdate({
        target: [socialConnection.shopId, socialConnection.platform],
        set: {
          pageId: input.pageId,
          pageName: input.pageName,
          pageAccessToken: input.pageAccessToken,
          permissions: input.permissions || defaultPermissions,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!connection) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to save connection",
      });
    }

    return { success: true, connectionId: connection.id };
  });
