import { error, redirect } from "@sveltejs/kit";
import { db } from "$lib/server/auth_db";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ params, locals, url }) => {
  const shop = await db.query.shop.findFirst({ where: { slug: params.slug } });
  if (!shop) {
    return error(404);
  }

  if (!locals.session) {
    return redirect(303, `/signin?return_url=${url.pathname}`);
  }

  if (shop.userId !== locals.session.user.id) {
    throw error(404, "Shop not found");
  }

  return {
    ...shop,
    tursoDbUrl: undefined,
    user: locals.session.user,
    session: locals.session.session,
  };
};
