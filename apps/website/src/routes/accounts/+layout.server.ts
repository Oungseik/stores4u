import { error, redirect } from "@sveltejs/kit";
import { isDashboardRole } from "$lib/server/auth";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (!locals.session) {
    return redirect(303, `/signin?return_url=${url.pathname}`);
  }
  if (!isDashboardRole(locals.session.user.role)) {
    throw error(403, "Dashboard access requires a staff role");
  }

  return {
    user: locals.session.user,
    session: locals.session.session,
  };
};
