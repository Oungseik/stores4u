import { ORPCError } from "@orpc/server";
import { product, productCategory } from "@repo/db";
import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  image: z.string().max(500).optional(),
  uom: z.string().min(1).max(50),
  barcode: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  priceCents: z.number().int().positive(),
  categoryIds: z.array(z.string()).optional(),
});

export const createProductHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const inserted = await shopDb
      .insert(product)
      .values({
        sku: input.sku,
        name: input.name,
        image: input.image,
        uom: input.uom,
        barcode: input.barcode,
        description: input.description,
        priceCents: input.priceCents,
      })
      .returning();

    const created = inserted.at(0);
    if (!created) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    if (input.categoryIds && input.categoryIds.length > 0) {
      await shopDb.insert(productCategory).values(
        input.categoryIds.map((categoryId) => ({
          productId: created.id,
          categoryId,
        })),
      );
    }

    return created;
  });
