import { eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getRequestEvent, query } from "$app/server";
import { assertShopAccessFromParams } from "$lib/remote/auth";
import { getShopDb } from "$lib/server/shop_db";
import { category, product, productCategory } from "@repo/perstore-db";

const listProductsSchema = z
  .object({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    categories: z.array(z.string()).optional(),
  })
  .default({ page: 1, pageSize: 20 });

export const listProducts = query(listProductsSchema, async (input) => {
  const { locals } = getRequestEvent();
  const { organization } = await assertShopAccessFromParams(locals);
  const shopDb = getShopDb({ slug: organization.slug });

  const { page = 1, pageSize = 20, search, categories } = input;
  const offset = (page - 1) * pageSize;

  // Category early-exit optimization
  let matchingProductIds: string[] | undefined;
  if (categories && categories.length > 0) {
    const categoryRows = await shopDb
      .select({ productId: productCategory.productId })
      .from(productCategory)
      .innerJoin(category, eq(productCategory.categoryId, category.id))
      .where(inArray(category.name, categories));
    matchingProductIds = [...new Set(categoryRows.map((r) => r.productId))];
    if (matchingProductIds.length === 0) {
      return { items: [], total: 0, page, pageSize, totalPages: 0 };
    }
  }

  // Build where conditions
  const conditions = [];
  if (search) {
    conditions.push(
      sql`${product.name} LIKE ${"%" + search + "%"} OR ${product.sku} LIKE ${"%" + search + "%"}`
    );
  }
  if (matchingProductIds) {
    conditions.push(
      sql`${product.id} IN (${sql.join(matchingProductIds.map((id) => sql`${id}`), sql`, `)})`
    );
  }

  const whereClause =
    conditions.length > 0
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``;

  // Count total
  const [{ count }] = await shopDb
    .select({ count: sql<number>`count(*)` })
    .from(product)
    .where(whereClause);

  // Fetch page
  const rows = await shopDb
    .select({
      id: product.id,
      sku: product.sku,
      name: product.name,
      image: product.image,
      priceCents: product.priceCents,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
    })
    .from(product)
    .where(whereClause)
    .orderBy(sql`${product.createdAt} DESC`)
    .limit(pageSize)
    .offset(offset);

  // Fetch categories for the products on this page
  const productIds = rows.map((r) => r.id);
  const categoryRows = productIds.length
    ? await shopDb
        .select({
          productId: productCategory.productId,
          categoryName: category.name,
        })
        .from(productCategory)
        .innerJoin(category, eq(productCategory.categoryId, category.id))
        .where(inArray(productCategory.productId, productIds))
    : [];

  const categoriesByProduct = new Map<string, string[]>();
  for (const row of categoryRows) {
    const existing = categoriesByProduct.get(row.productId) ?? [];
    existing.push(row.categoryName);
    categoriesByProduct.set(row.productId, existing);
  }

  const items = rows.map((r) => ({
    ...r,
    categories: categoriesByProduct.get(r.id) ?? [],
  }));

  return {
    items,
    total: count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize),
  };
});
