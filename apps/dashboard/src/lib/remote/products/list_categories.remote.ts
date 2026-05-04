import { z } from "zod";
import { getRequestEvent, query } from "$app/server";
import { assertShopAccessFromParams } from "$lib/remote/auth";
import { getShopDb } from "$lib/server/shop_db";

const listCategoriesSchema = z.object({}).default({});

export const listCategories = query(listCategoriesSchema, async () => {
  const { locals } = getRequestEvent();
  const { organization } = await assertShopAccessFromParams(locals);

  const shopDb = getShopDb({ slug: organization.slug });

  const categories = await shopDb.query.category.findMany({
    columns: { id: true, name: true },
    with: {
      productCategories: { columns: { productId: true } },
    },
  });

  const items = categories.map((c) => ({
    id: c.id,
    name: c.name,
    productCount: c.productCategories.length,
  }));

  return { items };
});
