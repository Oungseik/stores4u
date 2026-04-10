import { z } from "zod";

import { os, shopDbMiddleware, shopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  cursor: z.string().optional(),
  pageSize: z.number().int().positive().default(12),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  categories: z.array(z.string()).optional(),
  inStockOnly: z.boolean().optional(),
  stockThreshold: z.number().int().nonnegative().optional(),
  minPriceCents: z.number().int().nonnegative().optional(),
  maxPriceCents: z.number().int().nonnegative().optional(),
  uoms: z.array(z.string()).optional(),
});

export const listProductsHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(shopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
    const products = await shopDb.query.product.findMany({
      where: {
        id: input.order === "asc" ? { gte: input.cursor } : { lte: input.cursor },
        OR: input.search
          ? [
              { name: { like: `%${input.search}%` } },
              { sku: { like: `%${input.search}%` } },
              { barcode: input.search },
            ]
          : undefined,
        productCategories: input.categories?.length
          ? { category: { name: { in: input.categories } } }
          : undefined,
        stock: input.inStockOnly
          ? { gt: 0 }
          : input.stockThreshold
            ? { lte: input.stockThreshold }
            : undefined,
        priceCents: { gte: input.minPriceCents, lte: input.maxPriceCents },
        uom: input.uoms?.length ? { in: input.uoms } : undefined,
      },
      with: {
        productCategories: { with: { category: true } },
        productAliases: { columns: { alias: true } },
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
      barcode: p.barcode,
      description: p.description,
      image: p.image,
      uom: p.uom,
      priceCents: p.priceCents,
      categories: p.productCategories
        .map((c) => c.category?.name)
        .filter((c): c is string => c !== undefined),
      aliases: p.productAliases.map((a) => a.alias),
      stock: p.stock,
      lowStockThreshold: p.lowStockThreshold,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return { items, pageSize: input.pageSize, nextCursor };
  });
