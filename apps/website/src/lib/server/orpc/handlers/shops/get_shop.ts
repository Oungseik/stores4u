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
      title: shop.title,
      description: shop.description,
      address: shop.address,
      city: shop.city,
      state: shop.state,
      zipCode: shop.zipCode,
      country: shop.country,
      phone: shop.phone,
      email: shop.email,
      taxId: shop.taxId,
      logo: shop.logo,
      heroImage: shop.heroImage,
      userId: shop.userId,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
    };
  });
