import { eq, image, product, productImage } from "@repo/perstore-db";
import { z } from "zod";
import {
  authMiddleware,
  os,
  protectedShopMiddleware,
  shopDbMiddleware,
} from "$lib/server/orpc/base";
import { logger } from "$lib/server/logger";
import { extractObjectKey, removeImage } from "$lib/server/storage";

const input = z.object({
  slug: z.string().min(1).max(100),
  id: z.string().min(1),
});

export const deleteProductHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
    const [existingProduct, existingImages] = await Promise.all([
      shopDb
        .select({ image: product.image })
        .from(product)
        .where(eq(product.id, input.id))
        .limit(1),
      shopDb
        .select({ objectPath: productImage.objectPath })
        .from(productImage)
        .where(eq(productImage.productId, input.id)),
    ]);

    const allObjectPaths = [
      ...existingImages.map((img) => img.objectPath),
      ...(existingProduct.at(0)?.image ? [existingProduct.at(0)?.image] : []),
    ].filter((p): p is string => p !== null && p !== undefined);

    for (const objectPath of allObjectPaths) {
      const key = extractObjectKey(objectPath);
      if (key) {
        await removeImage(key).catch((e) => {
          logger.error(
            { err: e, objectPath },
            "Failed to delete image from storage during product deletion",
          );
        });
      }
      await shopDb
        .delete(image)
        .where(eq(image.objectPath, objectPath))
        .catch((e) => {
          logger.error(
            { err: e, objectPath },
            "Failed to delete image from registry during product deletion",
          );
        });
    }

    await shopDb.delete(product).where(eq(product.id, input.id));
  });
