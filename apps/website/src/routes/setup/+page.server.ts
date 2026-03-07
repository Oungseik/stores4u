import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;

  if (!session) {
    throw redirect(303, "/signin");
  }

  return {
    user: session.user,
  };
};
