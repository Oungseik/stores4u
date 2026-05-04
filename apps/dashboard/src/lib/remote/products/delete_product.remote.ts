import { product } from "@repo/perstore-db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { command, getRequestEvent } from "$app/server";
import { assertShopAccessFromParams } from "$lib/remote/auth";
import { getShopDb } from "$lib/server/shop_db";

const deleteProductSchema = z.object({ id: z.string() });

export const deleteProduct = command(deleteProductSchema, async (input) => {
  const { locals } = getRequestEvent();
  const { organization } = await assertShopAccessFromParams(locals);

  const shopDb = await getShopDb({ slug: organization.slug });
  await shopDb.delete(product).where(eq(product.id, input.id));

  return { success: true };
});
