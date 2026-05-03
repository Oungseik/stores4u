import { error } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ params, locals }) => {
  if (!locals.session || !locals.user) {
    return error(401, "Unauthorized");
  }

  const userId = locals.session.userId;

  const org = await db.query.organization.findFirst({
    where: { slug: params.slug },
    with: { shopInfo: true, members: true },
  });

  if (!org || !org.members.some((m) => m.userId === userId)) {
    return error(404, "Shop not found");
  }

  return {
    organization: org,
    user: locals.user,
  };
};
