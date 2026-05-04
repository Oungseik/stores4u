import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.session) {
    return redirect(303, `/signin?return_url=${url.pathname}`);
  }

  return {
    user: locals.session.user,
    session: locals.session.session,
  };
};
