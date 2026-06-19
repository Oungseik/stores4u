import { z } from "zod";
import { db, eq, image } from "$lib/server/db";
import { logger } from "$lib/server/logger";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { extractObjectKey, removeImage } from "$lib/server/storage";

const input = z.object({
  objectPath: z.string().min(1).max(500),
});

export const deleteImageHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const objectKey = extractObjectKey(input.objectPath);

    try {
      if (objectKey) {
        await removeImage(objectKey);
      }
    } catch (e) {
      logger.error({ err: e, objectPath: input.objectPath }, "Failed to delete image from storage");
    }

    try {
      await db.delete(image).where(eq(image.objectPath, input.objectPath));
    } catch (e) {
      logger.error(
        { err: e, objectPath: input.objectPath },
        "Failed to delete image from registry",
      );
    }
  });
