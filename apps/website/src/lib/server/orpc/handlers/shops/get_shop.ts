import { z } from "zod";

import { os, shopMiddleware } from "$lib/server/orpc/base";

const input = z.object({});

export const getShopHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(shopMiddleware)
  .handler(async ({ context }) => {
    const shop = context.shop;
    const shopInfo = shop.shopInfo;

    return {
      id: shop.id,
      name: shop.name,
      logo: shop.logo,
      heroImage: shopInfo?.heroImage ?? null,
      title: shopInfo?.title ?? null,
      description: shopInfo?.description ?? null,
      address: shopInfo?.address ?? null,
      city: shopInfo?.city ?? null,
      state: shopInfo?.state ?? null,
      zipCode: shopInfo?.zipCode ?? null,
      country: shopInfo?.country ?? null,
      currency: shop.currency,
      phone: shopInfo?.phone ?? null,
      email: shopInfo?.email ?? null,
      taxId: shopInfo?.taxId ?? null,
      userId: shop.userId,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
    };
  });
