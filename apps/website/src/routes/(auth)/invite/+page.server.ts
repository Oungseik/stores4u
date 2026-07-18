import { error } from "@sveltejs/kit";
import { db, invite } from "$lib/server/db";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  const token = url.searchParams.get("token");
  if (!token) {
    error(400, "error_missing_invite_token");
  }
  const row = await db.query.invite.findFirst({
    where: { token },
    columns: { role: true, consumedAt: true, expiresAt: true },
  });
  if (!row) {
    error(404, "error_invite_not_found");
  }
  if (row.consumedAt || row.expiresAt < new Date()) {
    error(410, "error_invite_expired");
  }
  return { role: row.role };
};
