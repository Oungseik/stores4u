import { eq, inventoryBatch, sql } from "@repo/db";
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
      with: { productCategories: { with: { category: true } } },
      extras: {
        inStock: (table) =>
          sql<number>`COALESCE((SELECT SUM(${inventoryBatch.remainingQty}) FROM ${inventoryBatch} WHERE ${inventoryBatch.productId} = ${table.id}), 0)`,
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
      categories: p.productCategories.map((c) => c.category?.name).filter(Boolean),
      inStock: Number(p.inStock),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return { items, pageSize: input.pageSize, nextCursor };
  });
