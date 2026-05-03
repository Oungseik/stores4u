import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const session = locals.session;
  const pathname = url.pathname;

  if (["/signin", "/signup"].some((prefix) => pathname.startsWith(prefix)) && !session) {
    return;
  }

  if (!session) {
    return redirect(303, "/signin");
  }

  return redirect(303, "/");
};
