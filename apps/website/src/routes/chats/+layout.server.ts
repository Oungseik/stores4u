import { redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (!locals.session) {
    return redirect(303, `/signin?return_url=${url.pathname}`);
  }

  const shop = await db.query.shop.findFirst({
    where: { userId: locals.session.user.id },
    columns: { id: true, name: true, logo: true },
  });

  if (!shop) {
    return redirect(303, "/setup");
  }

  return {
    shop,
    user: locals.session.user,
  };
};
