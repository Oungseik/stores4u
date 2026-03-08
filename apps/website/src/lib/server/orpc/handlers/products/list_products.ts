import { connectShopDb, eq, inventoryBatch, not } from "@repo/db";
import { z } from "zod";
import { SHOP_DATA_DIR } from "$env/static/private";
import { os } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  cursor: z.string().optional(),
  pageSize: z.number().int().positive().default(20),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const listProductsHandler = os
  .route({ method: "GET" })
  .input(input)
  .handler(async ({ input }) => {
    const shopDb = connectShopDb(input.slug, SHOP_DATA_DIR);

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

    const items = products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      image: product.image,
      uom: product.uom,
      priceCents: product.priceCents,
      categoryIds: product.productCategories.map((c) => c.categoryId),
      inStock: product.inStock > 0,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    return { items, pageSize: input.pageSize, nextCursor };
  });
