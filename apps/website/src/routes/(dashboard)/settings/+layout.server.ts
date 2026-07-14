import { redirect } from "@sveltejs/kit";

import type { LayoutServerLoad } from "./$types";

// Owner-only: Settings (Shop + Invoice) is owner-restricted (AGENTS.md).
// Parent (dashboard) layout already guarantees a dashboard-role session +
// loads the shop row; this only enforces the owner gate, returns no data.
export const load: LayoutServerLoad = async ({ locals }) => {
  if (locals.session?.user.role !== "owner") {
    throw redirect(303, "/");
  }
};
