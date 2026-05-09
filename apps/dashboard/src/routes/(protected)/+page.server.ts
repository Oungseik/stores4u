import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
  const { shops } = await parent();

  if (shops.length === 0) {
    return redirect(303, "/shops/setup");
  }

  return redirect(303, `/shops/${shops[0].slug}`);
};
