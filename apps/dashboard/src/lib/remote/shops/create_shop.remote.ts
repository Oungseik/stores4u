import { redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { form, getRequestEvent } from "$app/server";
import { assertAuth } from "$lib/remote/auth";
import { db } from "$lib/server/db";
import { member, organization } from "$lib/server/db/schema";
import { createShopDatabase, deleteShopDatabase } from "$lib/server/shop_db";
import { shopCreateSchema } from "$lib/types/shop";

export const createShop = form(shopCreateSchema, async (input) => {
  const { locals } = getRequestEvent();
  assertAuth(locals);

  if (input.slug === "parent") {
    return { success: false, message: 'Slug "parent" is reserved' };
  }

  const existingSlug = await db.query.organization.findFirst({
    where: { slug: input.slug },
    columns: { id: true },
  });
  if (existingSlug) {
    return { success: false, message: `Slug "${input.slug}" is already taken` };
  }

  const orgId = Bun.randomUUIDv7();
  await db.insert(organization).values({
    id: orgId,
    name: input.name,
    slug: input.slug,
  });

  await db.insert(member).values({
    id: Bun.randomUUIDv7(),
    organizationId: orgId,
    userId: locals.session.userId,
    role: "owner",
  });

  try {
    const url = await createShopDatabase(input.slug);
    await db.update(organization).set({ tursoDbUrl: url }).where(eq(organization.id, orgId));
  } catch {
    await db.delete(organization).where(eq(organization.id, orgId));
    await deleteShopDatabase(input.slug).catch(() => {});
    return { success: false, message: "Failed to create shop database. Please try again." };
  }

  redirect(303, `/shops/${input.slug}`);
});
