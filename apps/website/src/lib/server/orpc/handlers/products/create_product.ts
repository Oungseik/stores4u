import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db, product, productCategory, productImage } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  image: z.string().max(500).optional(),
  images: z.array(z.string().max(500)).optional(),
  uom: z.string().min(1).max(50),
  barcode: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  priceCents: z.number().int().positive(),
  lowStockThreshold: z.number().int().min(0).optional(),
  categoryIds: z.array(z.string()).optional(),
});

export const createProductHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const allImages = input.images ?? (input.image ? [input.image] : []);

    const inserted = await db
      .insert(product)
      .values({
        sku: input.sku,
        name: input.name,
        image: allImages[0] ?? null,
        uom: input.uom,
        barcode: input.barcode,
        description: input.description,
        priceCents: input.priceCents,
        lowStockThreshold: input.lowStockThreshold,
      })
      .returning();

    const created = inserted.at(0);
    if (!created) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    if (allImages.length > 0) {
      await db.insert(productImage).values(
        allImages.map((objectPath, index) => ({
          productId: created.id,
          objectPath,
          position: index,
        })),
      );
    }

    if (input.categoryIds && input.categoryIds.length > 0) {
      await db.insert(productCategory).values(
        input.categoryIds.map((categoryId) => ({
          productId: created.id,
          categoryId,
        })),
      );
    }

    return created;
  });
