import { error, redirect } from "@sveltejs/kit";
import { isDashboardRole } from "$lib/server/auth";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (!locals.session) {
    return redirect(303, `/signin?return_url=${url.pathname}`);
  }
  if (!isDashboardRole(locals.session.user.role)) {
    throw error(403, "error_dashboard_staff_required");
  }

  return {
    user: locals.session.user,
    session: locals.session.session,
    language: locals.language,
  };
};
