import { error } from "@sveltejs/kit";
import { db } from "$lib/server/auth_db";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ params }) => {
  const shop = await db.query.shop.findFirst({ where: { slug: params.slug } });
  if (!shop) {
    return error(404);
  }

  return {
    id: shop.id,
    name: shop.name,
    slug: shop.slug,
    logo: shop.logo,
    heroImage: shop.heroImage,
    description: shop.description,
    address: shop.address,
    phone: shop.phone,
    country: shop.country,
  };
};
