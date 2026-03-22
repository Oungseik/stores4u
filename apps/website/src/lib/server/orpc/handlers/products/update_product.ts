import { ORPCError } from "@orpc/server";
import { eq, product } from "@repo/db";
import { z } from "zod";
import { authMiddleware, os, shopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";
import { extractObjectKey, removeImage } from "$lib/server/storage";

const input = z.object({
  slug: z.string().min(1).max(100),
  id: z.string().min(1),
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  image: z.string().max(500).nullable(),
  uom: z.string().min(1).max(50),
  barcode: z.string().max(100).nullable(),
  description: z.string().max(1000).nullable(),
  priceCents: z.number().int().positive(),
});

export const updateProductHandler = os
  .input(input)
  .use(shopMiddleware)
  .use(authMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const existing = await shopDb
      .select({ image: product.image })
      .from(product)
      .where(eq(product.id, input.id))
      .limit(1);

    const oldImage = existing.at(0)?.image;

    const updated = await shopDb
      .update(product)
      .set({
        sku: input.sku,
        name: input.name,
        image: input.image,
        uom: input.uom,
        barcode: input.barcode,
        description: input.description,
        priceCents: input.priceCents,
      })
      .where(eq(product.id, input.id))
      .returning();

    const result = updated.at(0);
    if (!result) {
      throw new ORPCError("NOT_FOUND");
    }

    if (oldImage && oldImage !== input.image) {
      const oldImageKey = extractObjectKey(oldImage);
      if (oldImageKey) {
        await removeImage(oldImageKey).catch(() => {});
      }
    }

    return result;
  });
