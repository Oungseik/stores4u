import { redirect } from "@sveltejs/kit";
import { localizePath } from "$lib/localize-path";
import type { PageServerLoad } from "./$types";

/** Public signup is closed; redirect stale links to sign in. */
export const load: PageServerLoad = () => {
  return redirect(303, localizePath("/signin"));
};
