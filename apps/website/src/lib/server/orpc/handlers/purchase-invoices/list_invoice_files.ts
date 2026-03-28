import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
  cursor: z.string().optional(),
  pageSize: z.number().int().positive().default(20),
  status: z.enum(["UPLOADED", "PROCESSING", "PROCESSED", "FAILED", "REVIEWED"]).optional(),
});

export const listInvoiceFilesHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const files = await shopDb.query.purchaseInvoiceFile.findMany({
      where: {
        id: input.cursor ? { lte: input.cursor } : undefined,
        status: input.status,
      },
      with: {
        ocrResult: {
          columns: {
            confidenceScore: true,
          },
        },
      },
      limit: input.pageSize + 1,
      orderBy: { id: "desc" },
    });

    let nextCursor: string | undefined;
    if (files.length > input.pageSize) {
      const next = files.pop();
      nextCursor = next?.id;
    }

    const items = files.map((file) => ({
      id: file.id,
      objectPath: file.objectPath,
      filename: file.filename,
      fileType: file.fileType,
      size: file.size,
      status: file.status,
      confidenceScore: file.ocrResult?.confidenceScore ?? null,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    }));

    return { items, pageSize: input.pageSize, nextCursor };
  });
