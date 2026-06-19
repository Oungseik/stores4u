import { redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.session) {
    return redirect(303, `/signin?return_url=${url.pathname}`);
  }

  const shop = await db.query.shop.findFirst({
    where: { userId: locals.session.user.id },
    columns: { id: true },
  });

  if (shop) {
    return redirect(303, "/");
  }

  return { user: locals.session.user };
};
