import { error, redirect } from "@sveltejs/kit";
import { isDashboardRole } from "$lib/server/auth";
import { db } from "$lib/server/db";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (!locals.session) {
    return redirect(303, `/signin?return_url=${url.pathname}`);
  }
  if (!isDashboardRole(locals.session.user.role)) {
    throw error(403, "Dashboard access requires a staff role");
  }

  const shop = await db.query.shop.findFirst({
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
