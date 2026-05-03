import { eq } from "drizzle-orm";
import { form, getRequestEvent } from "$app/server";
import { assertAuth } from "$lib/remote/auth";
import { db } from "$lib/server/db";
import { shop } from "$lib/server/db/schema";
import { createShopDatabase, deleteShopDatabase } from "$lib/server/shop_db";
import { shopFormSchema } from "$lib/types/shop";

export const createShop = form(shopFormSchema, async (input) => {
  const { locals } = getRequestEvent();
  assertAuth(locals);

  if (input.slug === "parent") {
    return { success: false, message: 'Slug "parent" is reserved' };
  }

  const existingSlug = await db.query.shop.findFirst({
    where: { slug: input.slug },
    columns: { id: true },
  });
  if (existingSlug) {
    return { success: false, message: `Slug "${input.slug}" is already taken` };
  }

  const existingUserShop = await db.query.shop.findFirst({
    where: { userId: locals.session.userId },
    columns: { id: true },
  });
  if (existingUserShop) {
    return { success: false, message: "You can only own one shop" };
  }

  const shopId = Bun.randomUUIDv7();
  await db.insert(shop).values({
    ...input,
    id: shopId,
    userId: locals.session.userId,
  });

  try {
    const url = await createShopDatabase(input.slug);
    await db.update(shop).set({ tursoDbUrl: url }).where(eq(shop.id, shopId));
  } catch {
    await db.delete(shop).where(eq(shop.id, shopId));
    await deleteShopDatabase(input.slug).catch(() => {});
    return { success: false, message: "Failed to create shop database. Please try again." };
  }

  return { success: true, message: "Shop created successfully", slug: input.slug };
});
