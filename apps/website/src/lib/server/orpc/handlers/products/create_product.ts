import { ORPCError } from "@orpc/server";
import { connectShopDb, product } from "@repo/db";
import { z } from "zod";
import { SHOP_DATA_DIR } from "$env/static/private";
import { authMiddleware, os } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  image: z.string().max(500).optional(),
  uom: z.string().min(1).max(50),
  barcode: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
});

export const createProductHandler = os
  .use(authMiddleware)
  .input(input)
  .handler(async ({ input }) => {
    const shopDb = connectShopDb(input.slug, SHOP_DATA_DIR);

    const inserted = await shopDb
      .insert(product)
      .values({
        sku: input.sku,
        name: input.name,
        image: input.image,
        uom: input.uom,
        barcode: input.barcode,
        description: input.description,
      })
      .returning();

    const created = inserted.at(0);
    if (!created) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return created;
  });
