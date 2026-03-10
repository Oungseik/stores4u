import { z } from "zod";
import { authMiddleware, os, shopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
});

function escapeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export const exportProductsCsvHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(shopMiddleware)
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const shopDb = getShopDb(context.shop);

    const products = await shopDb.query.product.findMany({
      orderBy: { sku: "asc" },
    });

    const headers = ["sku", "name", "image", "barcode", "description", "uom"];
    const rows = products.map((p) =>
      [p.sku, p.name, p.image ?? "", p.barcode ?? "", p.description ?? "", p.uom]
        .map(escapeCsvField)
        .join(","),
    );

    const csv = [headers.join(","), ...rows].join("\n");
    return { csv, count: products.length };
  });
