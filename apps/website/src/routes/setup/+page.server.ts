import { db } from "$lib/server/db";
import type { PageServerLoad } from "./$types";

// /setup reachability is owned by setupGate (hooks.server.ts). This load only
// decides which form fields to render: account fields when no owner exists yet,
// store-only fields when the OAuth-first owner is finishing setup.
export const load: PageServerLoad = async () => {
  const firstUser = await db.query.user.findFirst({ columns: { id: true } });
  return {
    needsAccount: !firstUser,
    defaultTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
};
