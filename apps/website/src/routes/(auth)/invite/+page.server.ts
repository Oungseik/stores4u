import { error } from "@sveltejs/kit";
import { db, invite } from "$lib/server/db";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  const token = url.searchParams.get("token");
  if (!token) {
    error(400, "Missing invite token.");
  }
  const row = await db.query.invite.findFirst({
    where: { token },
    columns: { role: true, consumedAt: true, expiresAt: true },
  });
  if (!row) {
    error(404, "Invite not found.");
  }
  if (row.consumedAt || row.expiresAt < new Date()) {
    error(410, "This invite link has expired or already been used.");
  }
  return { role: row.role };
};
