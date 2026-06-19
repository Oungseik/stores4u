import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db, purchaseInvoiceFile } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getObjectUrl, putObject } from "$lib/server/storage";

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
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

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Invalid file type. Accepted: JPEG, PNG, PDF",
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new ORPCError("BAD_REQUEST", { message: "File size exceeds 10MB limit" });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extension = file.name.split(".").pop() ?? "bin";
    const objectKey = `invoice-files/${Bun.randomUUIDv7()}.${extension}`;

    await putObject(objectKey, buffer, file.type);

    const objectPath = getObjectUrl(objectKey);
    const now = new Date();

    const result = (await db.insert(purchaseInvoiceFile).values({
      objectPath,
      filename: file.name,
      fileType: file.type,
      size: file.size,
      status: "UPLOADED",
      createdAt: now,
      updatedAt: now,
    })) as unknown as { changes: number };

    if (!result.changes) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create invoice file record",
      });
    }

    return { success: true };
  });
