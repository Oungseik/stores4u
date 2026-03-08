import { connectShopDb } from "@repo/db";
import { z } from "zod";
import { SHOP_DATA_DIR } from "$env/static/private";
import { os } from "$lib/server/orpc/base";

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
  .handler(async ({ input }) => {
    const shopDb = connectShopDb(input.slug, SHOP_DATA_DIR);

    const products = await shopDb.query.product.findMany({
      orderBy: { sku: "asc" },
    });

    const headers = ["sku", "name", "barcode", "description", "uom"];
    const rows = products.map((p) =>
      [p.sku, p.name, p.barcode ?? "", p.description ?? "", p.uom].map(escapeCsvField).join(","),
    );

    const csv = [headers.join(","), ...rows].join("\n");
    return { csv, count: products.length };
  });
