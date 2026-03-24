import { error, redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ parent, locals, url }) => {
  const { userId } = await parent();
  if (!locals.session) {
    return redirect(303, `/signin?return_url=${url.pathname}`);
  }

  if (userId !== locals.session.user.id) {
    throw error(404, "Shop not found");
  }

  return {
    user: locals.session.user,
    session: locals.session.session,
  };
};
