import { product } from "@repo/perstore-db";
import { and, count, eq, sql, sum } from "drizzle-orm";
import { z } from "zod";
import { getRequestEvent, query } from "$app/server";
import { assertShopAccessFromParams } from "$lib/remote/auth";
import { getShopDb } from "$lib/server/shop_db";

const getProductStatsSchema = z.object({}).default({});

export const getProductStats = query(getProductStatsSchema, async () => {
  const { locals } = getRequestEvent();
  const { organization } = await assertShopAccessFromParams(locals);

  const shopDb = getShopDb({ slug: organization.slug });

  const [totalRow] = await shopDb.select({ count: count() }).from(product);

  const [lowStockRow] = await shopDb
    .select({ count: count() })
    .from(product)
    .where(and(sql`${product.stock} > 0`, sql`${product.stock} <= ${product.lowStockThreshold}`));

  const [outOfStockRow] = await shopDb
    .select({ count: count() })
    .from(product)
    .where(eq(product.stock, 0));

  const [inventoryValueRow] = await shopDb
    .select({
      total: sum(sql`${product.priceCents} * ${product.stock}`),
    })
    .from(product);

  return {
    total: totalRow.count,
    lowStock: lowStockRow.count,
    outOfStock: outOfStockRow.count,
    inventoryValueRetailCents: Number(inventoryValueRow.total ?? 0),
  };
});
