import { z } from "zod";
import { os, shopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
  cursor: z.string().optional(),
  pageSize: z.number().int().positive().default(12),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  stockThreshold: z.number().int().nonnegative().optional(),
  minPriceCents: z.number().int().nonnegative().optional(),
  maxPriceCents: z.number().int().nonnegative().optional(),
  uoms: z.array(z.string()).optional(),
});

export const listProductsHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(shopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const products = await shopDb.query.product.findMany({
      where: {
        id: input.order === "asc" ? { gte: input.cursor } : { lte: input.cursor },
        OR: input.search
          ? [
              { name: { ilike: `%${input.search}%` } },
              { sku: { ilike: `%${input.search}%` } },
              { barcode: input.search },
            ]
          : undefined,
        productCategories: input.categoryIds?.length
          ? { categoryId: { in: input.categoryIds } }
          : undefined,
        stock: input.stockThreshold && { lte: input.stockThreshold },
        priceCents: { gte: input.minPriceCents, lte: input.maxPriceCents },
        uom: input.uoms?.length ? { in: input.uoms } : undefined,
      },
      with: { productCategories: { with: { category: true } } },
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
      stock: p.stock,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return { items, pageSize: input.pageSize, nextCursor };
  });
