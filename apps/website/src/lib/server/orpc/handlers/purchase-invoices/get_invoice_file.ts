import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { extractObjectKey, presignDownload } from "$lib/server/storage";

const input = z.object({
  invoiceFileId: z.string().min(1),
});

export const getInvoiceFileHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const file = await db.query.purchaseInvoiceFile.findFirst({
      where: { id: input.invoiceFileId },
      with: {
        ocrResult: true,
      },
    });

    if (!file) {
      throw new ORPCError("NOT_FOUND", { data: { key: "error_invoice_file_not_found" } });
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
            createdAt: file.ocrResult.createdAt,
          }
        : null,
    };
  });
