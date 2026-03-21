import { error } from "@sveltejs/kit";
import { db } from "$lib/server/auth_db";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ params }) => {
  const shop = await db.query.shop.findFirst({ where: { slug: params.slug } });
  if (!shop) {
    return error(404);
  }

  return {
    ...shop,
    tursoDbUrl: undefined,
  };
};
