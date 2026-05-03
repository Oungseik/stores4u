import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.session || !locals.user) {
    return redirect(303, "/signin");
  }

  return {
    user: locals.user,
    session: locals.session,
  };
};
