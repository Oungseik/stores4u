import { error } from "@sveltejs/kit";
import { getShopDb } from "$lib/server/shop_db";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ params }) => {
  const shopDb = getShopDb({ slug: params.slug });

  const result = await shopDb.query.product.findFirst({
    where: { id: params.id },
    with: {
      productCategories: {
        with: {
          category: { columns: { id: true, name: true } },
        },
      },
    },
  });

  if (!result) {
    error(404, { message: "Product not found" });
  }

  return {
    product: {
      id: result.id,
      name: result.name,
      sku: result.sku,
      priceCents: result.priceCents,
      uom: result.uom,
      description: result.description,
      image: result.image,
      barcode: result.barcode,
      categoryIds: result.productCategories
        .map((pc) => pc.category?.id)
        .filter((id): id is string => id !== undefined),
    },
  };
};
