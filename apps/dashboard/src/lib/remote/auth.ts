import { error } from "@sveltejs/kit";
import { getRequestEvent } from "$app/server";
import { db } from "$lib/server/db";
import type { member, organization } from "$lib/server/db/schema";

type AuthLocals = App.Locals & {
  session: NonNullable<App.Locals["session"]>;
  user: NonNullable<App.Locals["user"]>;
};

export function assertAuth(locals: App.Locals): asserts locals is AuthLocals {
  if (!locals.session || !locals.user) {
    error(401, "Unauthorized");
  }
}

type Role = "owner" | "admin" | "member";

const roleLevel = { owner: 3, admin: 2, member: 1 } satisfies Record<Role, number>;

export async function assertShopAccess(
  locals: App.Locals,
  slug: string,
  minimumRole?: Role,
): Promise<{ member: typeof member.$inferSelect; organization: typeof organization.$inferSelect }> {
  assertAuth(locals);

  const org = await db.query.organization.findFirst({ where: { slug } });
  if (!org) {
    error(404, "Shop not found");
  }

  const mem = await db.query.member.findFirst({
    where: { userId: locals.session.userId, organizationId: org.id },
  });

  if (!mem) {
    error(403, "Forbidden");
  }

  if (minimumRole && roleLevel[mem.role as Role] < roleLevel[minimumRole]) {
    error(403, "Forbidden");
  }

  return { member: mem, organization: org };
}

export async function assertShopAccessFromParams(
  locals: App.Locals,
  minimumRole?: Role,
) {
  const { params } = getRequestEvent();
  if (!params.slug) {
    error(400, "Missing shop slug");
  }
  return assertShopAccess(locals, params.slug, minimumRole);
}
