import { product } from "@repo/perstore-db";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { getRequestEvent, query } from "$app/server";
import { assertShopAccessFromParams } from "$lib/remote/auth";
import { getShopDb } from "$lib/server/shop_db";

const getProductStatsSchema = z.void();

export const getProductStats = query(getProductStatsSchema, async () => {
  const { locals } = getRequestEvent();
  const { organization } = await assertShopAccessFromParams(locals);
  const shopDb = await getShopDb({ slug: organization.slug });

  const [stats] = await shopDb.query.product.findMany({
    columns: { id: true },
    extras: {
      total: sql<number>`count(*) over()`.as("total"),
      lowStock:
        sql<number>`sum(case when ${product.stock} > 0 and ${product.stock} <= ${product.lowStockThreshold} then 1 else 0 end) over()`.as(
          "lowStock",
        ),
      outOfStock: sql<number>`sum(case when ${product.stock} = 0 then 1 else 0 end) over()`.as(
        "outOfStock",
      ),
      inventoryValueRetailCents:
        sql<number>`sum(${product.priceCents} * ${product.stock}) over()`.as(
          "inventoryValueRetailCents",
        ),
    },
    limit: 1,
  });

  return {
    total: stats?.total ?? 0,
    lowStock: stats?.lowStock ?? 0,
    outOfStock: stats?.outOfStock ?? 0,
    inventoryValueRetailCents: stats?.inventoryValueRetailCents ?? 0,
  };
});
