import { error } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ params, locals }) => {
  if (!locals.session || !locals.user) {
    return error(401, "Unauthorized");
  }

  const shop = await db.query.shop.findFirst({
    where: { slug: params.slug, userId: locals.session.userId },
    with: { info: true },
  });

  if (!shop) {
    return error(404, "Shop not found");
  }

  return {
    shop,
    user: locals.user,
  };
};
