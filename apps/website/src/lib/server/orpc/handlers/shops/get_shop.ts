import { ORPCError } from "@orpc/server";
import { count, product } from "@repo/db";
import { z } from "zod";
import { logger } from "$lib/server/logger";
import { os, shopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
});

export const getShopHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(shopMiddleware)
  .handler(async ({ context }) => {
    const shopDb = getShopDb(context.shop);

    const settings = await shopDb.query.setting.findFirst();
    if (!settings) {
      logger.error(
        { shopSlug: context.shop.slug },
        "shop settings should have already configure during setup",
      );
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    const [productCountResult] = await shopDb.select({ count: count() }).from(product);

    return {
      id: context.shop.id,
      name: context.shop.name,
      slug: context.shop.slug,
      logo: settings.logo,
      heroImage: settings.heroImage,
      description: settings.description,
      address: settings.address,
      phone: settings.phone,
      productCount: productCountResult.count,
    };
  });
