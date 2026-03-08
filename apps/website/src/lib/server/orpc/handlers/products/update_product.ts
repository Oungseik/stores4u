import { ORPCError } from "@orpc/server";
import { connectShopDb, eq, product } from "@repo/db";
import { z } from "zod";
import { SHOP_DATA_DIR } from "$env/static/private";
import { authMiddleware, os } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  id: z.string().min(1),
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  image: z.string().max(500).nullable(),
  uom: z.string().min(1).max(50),
  barcode: z.string().max(100).nullable(),
  description: z.string().max(1000).nullable(),
});

export const updateProductHandler = os
  .use(authMiddleware)
  .input(input)
  .handler(async ({ input }) => {
    const shopDb = connectShopDb(input.slug, SHOP_DATA_DIR);

    const updated = await shopDb
      .update(product)
      .set({
        sku: input.sku,
        name: input.name,
        image: input.image,
        uom: input.uom,
        barcode: input.barcode,
        description: input.description,
      })
      .where(eq(product.id, input.id))
      .returning();

    const result = updated.at(0);
    if (!result) {
      throw new ORPCError("NOT_FOUND");
    }

    return result;
  });
