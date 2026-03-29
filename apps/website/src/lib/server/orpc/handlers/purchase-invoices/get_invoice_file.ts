import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";
import { extractObjectKey, presignDownload } from "$lib/server/storage";

const input = z.object({
  slug: z.string().min(1).max(100),
  invoiceFileId: z.string().min(1),
});

export const getInvoiceFileHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const file = await shopDb.query.purchaseInvoiceFile.findFirst({
      where: { id: input.invoiceFileId },
      with: {
        ocrResult: true,
      },
    });

    if (!file) {
      throw new ORPCError("NOT_FOUND", { message: "Invoice file not found" });
    }

    const objectKey = extractObjectKey(file.objectPath);
    const imageUrl = objectKey ? presignDownload(objectKey, 3600) : null;

    return {
      id: file.id,
      objectPath: file.objectPath,
      filename: file.filename,
      fileType: file.fileType,
      size: file.size,
      status: file.status,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      imageUrl,
      ocrResult: file.ocrResult
        ? {
            id: file.ocrResult.id,
            photoUrl: file.ocrResult.photoUrl,
            rawJson: file.ocrResult.rawJson,
            extractedText: file.ocrResult.extractedText,
            extractedData: file.ocrResult.extractedData,
            confidenceScore: file.ocrResult.confidenceScore,
            rejectionReason: file.ocrResult.rejectionReason,
            status: file.ocrResult.status,
            createdAt: file.ocrResult.createdAt,
          }
        : null,
    };
  });
