import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db, purchaseInvoiceFile } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getObjectUrl, putObject } from "$lib/server/storage";
import { detectInvoiceFileType } from "$lib/server/utils/magic_bytes";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const input = z.object({
  file: z.file(),
});

export const uploadInvoiceFileHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const file = input.file;

    if (file.size > MAX_FILE_SIZE) {
      throw new ORPCError("BAD_REQUEST", { data: { key: "error_file_size_exceeds_10mb_limit" } });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const detectedType = detectInvoiceFileType(buffer);
    if (!detectedType) {
      throw new ORPCError("BAD_REQUEST", {
        data: { key: "error_invalid_file_type_accepted_jpeg_png_pdf" },
      });
    }

    const objectKey = `invoice-files/${crypto.randomUUID()}.${detectedType.extension}`;

    await putObject(objectKey, buffer);

    const objectPath = getObjectUrl(objectKey);
    const now = new Date();

    const result = await db.insert(purchaseInvoiceFile).values({
      objectPath,
      filename: file.name,
      fileType: detectedType.mime,
      size: buffer.length,
      status: "UPLOADED",
      createdAt: now,
      updatedAt: now,
    });

    if (!result.rowsAffected) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        data: { key: "error_failed_to_create_invoice_file_record" },
      });
    }

    return { success: true };
  });
