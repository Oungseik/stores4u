import { z } from "zod";
import { getRequestEvent, query } from "$app/server";
import { assertShopAccessFromParams } from "$lib/remote/auth";
import { getShopDb } from "$lib/server/shop_db";

const listProductsSchema = z
  .object({
    cursor: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    categories: z.array(z.string()).optional(),
  })
  .default({ limit: 20 });

export const listProducts = query(listProductsSchema, async (input) => {
  const { locals } = getRequestEvent();
  const { organization } = await assertShopAccessFromParams(locals);
  const shopDb = await getShopDb({ slug: organization.slug });

  const { cursor, limit = 20, search, categories } = input;

  const rows = await shopDb.query.product.findMany({
    columns: {
      id: true,
      sku: true,
      name: true,
      image: true,
      priceCents: true,
      stock: true,
      lowStockThreshold: true,
    },
    with: {
      productCategories: {
        with: {
          category: true,
        },
      },
    },
    where: {
      id: cursor ? { lt: cursor } : undefined,
      OR: search
        ? [{ name: { like: `%${search}%` } }, { sku: { like: `%${search}%` } }]
        : undefined,
      productCategories: categories?.length
        ? { category: { name: { in: categories } } }
        : undefined,
    },
    orderBy: { id: "desc" },
    limit: limit + 1,
  });

  let nextCursor: string | undefined;
  if (rows.length > limit) {
    rows.pop();
    nextCursor = rows[rows.length - 1]?.id;
  }

  const items = rows.map((r) => ({
    ...r,
    categories: r.productCategories
      .map((pc) => pc.category?.name)
      .filter((c): c is string => c !== undefined),
  }));

  return { items, nextCursor };
});
