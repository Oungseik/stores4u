import { eq, inventoryBatch, not } from "@repo/db";
import { z } from "zod";
import { os, shopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
  cursor: z.string().optional(),
  pageSize: z.number().int().positive().default(20),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const listProductsHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(shopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const products = await shopDb.query.product.findMany({
      where: { id: input.order === "asc" ? { gte: input.cursor } : { lte: input.cursor } },
      with: { productCategories: true, inventoryBatches: true },
      extras: {
        inStock: shopDb.$count(inventoryBatch, not(eq(inventoryBatch.remainingQty, 0))),
      },
      limit: input.pageSize + 1,
      orderBy: { id: input.order },
    });

    let nextCursor: string | undefined;
    if (products.length > input.pageSize) {
      const next = products.pop();
      nextCursor = next?.id;
    }

    if (products.length === 0) {
      return { items: [], pageSize: input.pageSize, nextCursor };
    }

    const items = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      description: p.description,
      image: p.image,
      uom: p.uom,
      priceCents: p.priceCents,
      categoryIds: p.productCategories.map((c) => c.categoryId),
      inStock: p.inStock > 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return { items, pageSize: input.pageSize, nextCursor };
  });
