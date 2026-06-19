import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db } from "$lib/server/db";
import { os, shopMiddleware } from "$lib/server/orpc/base";

const input = z
  .object({
    id: z.string().optional(),
    barcode: z.string().optional(),
    sku: z.string().optional(),
  })
  .refine((data) => data.id || data.barcode || data.sku, {
    message: "At least one of id, barcode,  or sku is required",
  });

export const getProductHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(shopMiddleware)
  .handler(async ({ input }) => {
    const product = await db.query.product.findFirst({
      where: { id: input.id, barcode: input.barcode, sku: input.sku },
      with: {
        productCategories: {
          with: {
            category: { columns: { id: true, name: true } },
          },
        },
        productImages: {
          orderBy: { position: "asc" },
          columns: { id: true, objectPath: true, position: true },
        },
        productAliases: {
          columns: { alias: true },
        },
      },
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
      images: product.productImages.map((img) => img.objectPath),
      aliases: product.productAliases.map((pa) => pa.alias),
      uom: product.uom,
      priceCents: product.priceCents,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      categories: product.productCategories
        .map((pc) => pc.category)
        .filter((c): c is NonNullable<typeof c> => c !== null),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  });
