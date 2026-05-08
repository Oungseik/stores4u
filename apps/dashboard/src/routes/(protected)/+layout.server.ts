import { redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.session || !locals.user) {
    return redirect(303, "/signin");
  }

  const shops = await db.query.organization.findMany({
    columns: { id: true, name: true, slug: true, logo: true },
    where: { members: { userId: locals.session.userId } },
    orderBy: { createdAt: "desc" },
  });

  return {
    shops,
    user: locals.user,
    session: locals.session,
  };
};
