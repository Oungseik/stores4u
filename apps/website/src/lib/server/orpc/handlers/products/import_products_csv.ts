import { ORPCError } from "@orpc/server";
import { connectShopDb, product, sql } from "@repo/db";
import { z } from "zod";
import { SHOP_DATA_DIR } from "$env/static/private";
import { authMiddleware, os } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  csv: z.string().min(1),
  overwriteOnSku: z.boolean().default(false),
});

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

export const importProductsCsvHandler = os
  .use(authMiddleware)
  .input(input)
  .handler(async ({ input }) => {
    const shopDb = connectShopDb(input.slug, SHOP_DATA_DIR);

    const lines = input.csv.trim().split("\n");
    if (lines.length < 2) {
      throw new ORPCError("BAD_REQUEST", {
        message: "CSV must have header and at least one data row",
      });
    }

    const headerLine = lines[0];
    const headers = parseCsvLine(headerLine).map((h) => h.trim().toLowerCase());

    const skuIdx = headers.indexOf("sku");
    const nameIdx = headers.indexOf("name");
    const imageIdx = headers.indexOf("image");
    const barcodeIdx = headers.indexOf("barcode");
    const descriptionIdx = headers.indexOf("description");
    const uomIdx = headers.indexOf("uom");

    if (skuIdx === -1 || nameIdx === -1 || uomIdx === -1) {
      throw new ORPCError("BAD_REQUEST", {
        message: "CSV must have sku, name, and uom columns",
      });
    }

    const records: {
      sku: string;
      name: string;
      image: string | null;
      barcode: string | null;
      description: string | null;
      uom: string;
    }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = parseCsvLine(line);
      const sku = fields[skuIdx]?.trim();
      const name = fields[nameIdx]?.trim();
      const image = imageIdx !== -1 ? fields[imageIdx]?.trim() || null : null;
      const barcode = barcodeIdx !== -1 ? fields[barcodeIdx]?.trim() || null : null;
      const description = descriptionIdx !== -1 ? fields[descriptionIdx]?.trim() || null : null;
      const uom = fields[uomIdx]?.trim();

      if (!sku || !name || !uom) {
        continue;
      }

      records.push({ sku, name, image, barcode, description, uom });
    }

    if (records.length === 0) {
      return { created: 0, updated: 0, skipped: 0, total: 0 };
    }

    const now = new Date();

    if (input.overwriteOnSku) {
      const result = await shopDb
        .insert(product)
        .values(records)
        .onConflictDoUpdate({
          target: product.sku,
          set: {
            name: sql`excluded.name`,
            image: sql`excluded.image`,
            barcode: sql`excluded.barcode`,
            description: sql`excluded.description`,
            uom: sql`excluded.uom`,
            updatedAt: now,
          },
        })
        .returning();

      return { created: 0, updated: result.length, skipped: 0, total: result.length };
    }
    const result = await shopDb
      .insert(product)
      .values(records)
      .onConflictDoNothing({ target: product.sku })
      .returning();

    const inserted = result.length;
    const skipped = records.length - inserted;

    return { created: inserted, updated: 0, skipped, total: records.length };
  });
