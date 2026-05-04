import { ORPCError } from "@orpc/server";
import { eq, image, product, productCategory, productImage } from "@repo/perstore-db";
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
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  image: z.string().max(500).nullable(),
  images: z.array(z.string().max(500)).nullable(),
  uom: z.string().min(1).max(50),
  barcode: z.string().max(100).nullable(),
  description: z.string().max(1000).nullable(),
  priceCents: z.number().int().positive(),
  lowStockThreshold: z.number().int().min(0).nullable(),
  categoryIds: z.array(z.string()).nullable(),
});

export const updateProductHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
    const existing = await shopDb
      .select({ image: product.image })
      .from(product)
      .where(eq(product.id, input.id))
      .limit(1);

    const oldImage = existing.at(0)?.image;

    const allImages = input.images ?? (input.image ? [input.image] : []);

    const updated = await shopDb
      .update(product)
      .set({
        sku: input.sku,
        name: input.name,
        image: allImages[0] ?? null,
        uom: input.uom,
        barcode: input.barcode,
        description: input.description,
        priceCents: input.priceCents,
        lowStockThreshold: input.lowStockThreshold,
      })
      .where(eq(product.id, input.id))
      .returning();

    const result = updated.at(0);
    if (!result) {
      throw new ORPCError("NOT_FOUND");
    }

    if (oldImage && oldImage !== result.image) {
      const oldImageKey = extractObjectKey(oldImage);
      if (oldImageKey) {
        await removeImage(oldImageKey).catch((e) => {
          logger.error(
            { err: e, objectPath: oldImage },
            "Failed to delete old primary image from storage",
          );
        });
      }
      await shopDb
        .delete(image)
        .where(eq(image.objectPath, oldImage))
        .catch((e) => {
          logger.error(
            { err: e, objectPath: oldImage },
            "Failed to delete old primary image from registry",
          );
        });
    }

    const existingImages = await shopDb
      .select({ id: productImage.id, objectPath: productImage.objectPath })
      .from(productImage)
      .where(eq(productImage.productId, input.id));

    const existingPaths = existingImages.map((img) => img.objectPath);
    const remainingPaths = new Set(allImages);
    const removedImages = existingImages.filter((img) => !remainingPaths.has(img.objectPath));
    const imagesChanged =
      removedImages.length > 0 ||
      existingPaths.length !== allImages.length ||
      existingPaths.some((path, i) => path !== allImages[i]);

    if (imagesChanged) {
      for (const img of removedImages) {
        const key = extractObjectKey(img.objectPath);
        if (key) {
          await removeImage(key).catch((e) => {
            logger.error(
              { err: e, objectPath: img.objectPath },
              "Failed to delete image from storage",
            );
          });
        }
        await shopDb
          .delete(image)
          .where(eq(image.objectPath, img.objectPath))
          .catch((e) => {
            logger.error(
              { err: e, objectPath: img.objectPath },
              "Failed to delete image from registry",
            );
          });
      }

      await shopDb.delete(productImage).where(eq(productImage.productId, input.id));

      if (allImages.length > 0) {
        await shopDb.insert(productImage).values(
          allImages.map((objectPath, index) => ({
            productId: input.id,
            objectPath,
            position: index,
          })),
        );
      }
    }

    await shopDb.delete(productCategory).where(eq(productCategory.productId, input.id));

    if (input.categoryIds && input.categoryIds.length > 0) {
      await shopDb.insert(productCategory).values(
        input.categoryIds.map((categoryId) => ({
          productId: input.id,
          categoryId,
        })),
      );
    }

    return result;
  });
