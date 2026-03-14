import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { os, shopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z
  .object({
    slug: z.string().min(1).max(100),
    barcode: z.string().optional(),
    name: z.string().optional(),
    sku: z.string().optional(),
  })
  .refine((data) => data.barcode || data.name || data.sku, {
    message: "At least one of barcode, name, or sku is required",
  });

export const getProductHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(shopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const product = await shopDb.query.product.findFirst({
      where: { barcode: input.barcode, sku: input.sku },
    });

    if (!product) {
      throw new ORPCError("NOT_FOUND", { message: "Product not found" });
    }

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      description: product.description,
      image: product.image,
      uom: product.uom,
      priceCents: product.priceCents,
      stock: product.stock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  });
