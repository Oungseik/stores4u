import { ORPCError } from "@orpc/server";
import { eq, shop } from "@repo/auth";
import { COUNTRIES } from "@repo/config";
import { z } from "zod";
import { db } from "$lib/server/auth_db";
import { authMiddleware, os, shopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(100).optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  phone: z.string().min(1).max(50),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  email: z.email().max(200).optional(),
  taxId: z.string().max(100).optional(),
  country: z.enum(COUNTRIES),
  logo: z.string().max(500).optional(),
  heroImage: z.string().max(500).optional(),
});

export const updateShopHandler = os
  .input(input)
  .use(shopMiddleware)
  .use(authMiddleware)
  .handler(async ({ input, context }) => {
    if (context.shop.userId !== context.session.user.id) {
      throw new ORPCError("FORBIDDEN", {
        message: "You do not have permission to update this shop",
      });
    }

    await db
      .update(shop)
      .set({
        name: input.name,
        title: input.title,
        description: input.description,
        address: input.address,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        country: input.country,
        phone: input.phone,
        email: input.email,
        taxId: input.taxId,
        logo: input.logo,
        heroImage: input.heroImage,
      })
      .where(eq(shop.id, context.shop.id));

    return { success: true };
  });
