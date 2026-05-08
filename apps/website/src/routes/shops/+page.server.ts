import { redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.session) {
    return redirect(303, `/signin?return_url=${url.pathname}`);
  }

  const shops = await db.query.shop.findMany({
    where: { userId: locals.session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return {
    shops,
    user: locals.session.user,
    session: locals.session.session,
  };
};
