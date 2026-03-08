import { ORPCError, os } from "@orpc/server";
import { connectShopDb, count, product } from "@repo/db";
import { z } from "zod";
import { SHOP_DATA_DIR } from "$env/static/private";
import { db } from "$lib/server/auth_db";
import { logger } from "$lib/server/logger";

const input = z.object({
  slug: z.string().min(1).max(100),
});

export const getShopHandler = os.input(input).handler(async ({ input }) => {
  const shopData = await db.query.shop.findFirst({
    where: { slug: input.slug },
  });

  if (!shopData) {
    throw new ORPCError("NOT_FOUND", {
      message: `Shop with slug "${input.slug}" not found`,
    });
  }

  const shopDb = connectShopDb(input.slug, SHOP_DATA_DIR);

  const settings = await shopDb.query.shopSetting.findFirst();
  if (!settings) {
    logger.error(
      { shopSlug: input.slug },
      "shop settings should have already configure during setup",
    );
    throw new ORPCError("INTERNAL_SERVER_ERROR");
  }

  const [productCountResult] = await shopDb.select({ count: count() }).from(product);

  return {
    id: shopData.id,
    name: shopData.name,
    slug: shopData.slug,
    logo: settings.logo,
    heroImage: settings.heroImage,
    description: settings.description,
    address: settings.address,
    phone: settings.phone,
    productCount: productCountResult.count,
  };
});
