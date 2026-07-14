import { redirect } from "@sveltejs/kit";

import type { LayoutServerLoad } from "./$types";

// Owner-only: the Team group (Members + Management) is owner-restricted (AGENTS.md).
// Parent (dashboard) layout already guarantees a dashboard-role session; this
// only enforces the owner gate for both /team and /team/members.
export const load: LayoutServerLoad = async ({ locals }) => {
  if (locals.session?.user.role !== "owner") {
    throw redirect(303, "/");
  }
};
