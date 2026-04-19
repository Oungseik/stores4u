import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";
import { extractObjectKey, presignDownload } from "$lib/server/storage";

const input = z.object({
  slug: z.string().min(1).max(100),
  fileId: z.string().min(1),
});

export const downloadInvoiceFileHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const file = await shopDb.query.purchaseInvoiceFile.findFirst({
      where: { id: input.fileId },
    });

    if (!file) {
      throw new ORPCError("NOT_FOUND", { message: "Invoice file not found" });
    }

    const objectKey = extractObjectKey(file.objectPath);
    if (!objectKey) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Invalid file path" });
    }

    const downloadUrl = presignDownload(objectKey);

    return {
      downloadUrl,
      filename: file.filename,
    };
  });
