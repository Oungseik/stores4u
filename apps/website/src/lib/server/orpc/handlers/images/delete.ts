import { eq, image } from "@repo/db";
import { z } from "zod";
import { logger } from "$lib/server/logger";
import {
  authMiddleware,
  os,
  protectedShopMiddleware,
  shopDbMiddleware,
} from "$lib/server/orpc/base";
import { extractObjectKey, removeImage } from "$lib/server/storage";

const input = z.object({
  slug: z.string().min(1).max(100),
  objectPath: z.string().min(1).max(500),
});

export const deleteImageHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
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
