import { eq, image } from "@repo/db";
import { z } from "zod";
import { logger } from "$lib/server/logger";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";
import { extractObjectKey, removeImage } from "$lib/server/storage";

const input = z.object({
  slug: z.string().min(1).max(100),
  objectPath: z.string().min(1).max(500),
});

export const deleteImageHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);
    const objectKey = extractObjectKey(input.objectPath);

    try {
      if (objectKey) {
        await removeImage(objectKey);
      }
    } catch (e) {
      logger.error({ err: e, objectPath: input.objectPath }, "Failed to delete image from storage");
    }

    try {
      await shopDb.delete(image).where(eq(image.objectPath, input.objectPath));
    } catch (e) {
      logger.error(
        { err: e, objectPath: input.objectPath },
        "Failed to delete image from registry",
      );
    }
  });
