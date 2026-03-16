import { z } from "zod";

import { os, shopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
});

export const getShopHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(shopMiddleware)
  .handler(async ({ context }) => {
    const shop = context.shop;

    return {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      description: shop.description,
      address: shop.address,
      phone: shop.phone,
      country: shop.country,
      logo: shop.logo,
      heroImage: shop.heroImage,
      userId: shop.userId,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
    };
  });
