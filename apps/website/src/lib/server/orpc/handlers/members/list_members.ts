import { db } from "$lib/server/db";
import { os, ownerMiddleware } from "$lib/server/orpc/base";

/**
 * Owner-only: lists every dashboard-staff account (owner/admin/member).
 * Read-only view backing /team/members. No pagination — small team (YAGNI).
 * Add role edit / ban / remove as Team grows into employee management.
 */
export const listMembersHandler = os.use(ownerMiddleware).handler(async () => {
  const members = await db.query.user.findMany({
    where: { role: { in: ["owner", "admin", "member"] } },
    columns: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      role: true,
      banned: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });
  return { items: members };
});
