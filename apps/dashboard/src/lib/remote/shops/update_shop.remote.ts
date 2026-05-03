import { eq } from "drizzle-orm";
import { form, getRequestEvent } from "$app/server";
import { assertAuth, assertShopAccess } from "$lib/remote/auth";
import { db } from "$lib/server/db";
import { organization, shopInfo } from "$lib/server/db/schema";
import { shopUpdateSchema } from "$lib/types/shop";

export const updateShop = form(shopUpdateSchema, async (input) => {
  const { locals } = getRequestEvent();
  assertAuth(locals);
  assertShopAccess(locals, input.slug, "admin");

  const existingSlug = await db.query.organization.findFirst({
    where: {
      slug: input.slug,
      id: { ne: input.organizationId },
    },
    columns: { id: true },
  });
  if (existingSlug) {
    return { success: false, message: "Slug already taken" };
  }

  await db
    .update(organization)
    .set({ name: input.name, slug: input.slug })
    .where(eq(organization.id, input.organizationId));

  const infoFields = {
    title: input.title,
    address: input.address,
    city: input.city,
    state: input.state,
    zipCode: input.zipCode,
    country: input.country,
    phone: input.phone,
    email: input.email,
    taxId: input.taxId,
  };

  await db
    .insert(shopInfo)
    .values({
      organizationId: input.organizationId,
      ...infoFields,
    })
    .onConflictDoUpdate({
      target: shopInfo.organizationId,
      set: infoFields,
    });

  return { success: true };
});
