import { error } from "@sveltejs/kit";
import { getShopDb } from "$lib/server/shop_db";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ params }) => {
  const shopDb = getShopDb({ slug: params.slug });

  const result = await shopDb.query.product.findFirst({
    where: { id: params.id },
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
    },
  };
};
