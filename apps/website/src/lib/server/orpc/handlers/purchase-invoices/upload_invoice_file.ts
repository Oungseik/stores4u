import { purchaseInvoiceFile } from "@repo/db";
import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";
import { getObjectUrl, putObject } from "$lib/server/storage";

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const input = z.object({
  slug: z.string().min(1).max(100),
  file: z.file(),
});

export const uploadInvoiceFileHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const file = input.file;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error("Invalid file type. Accepted: JPEG, PNG, PDF");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File size exceeds 10MB limit");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extension = file.name.split(".").pop() ?? "bin";
    const objectKey = `${input.slug}/invoice-files/${Bun.randomUUIDv7()}.${extension}`;

    await putObject(objectKey, buffer, file.type);

    const objectPath = getObjectUrl(objectKey);
    const now = new Date();

    const shopDb = getShopDb(context.shop);
    const result = await shopDb.insert(purchaseInvoiceFile).values({
      objectPath,
      filename: file.name,
      fileType: file.type,
      size: file.size,
      status: "UPLOADED",
      createdAt: now,
      updatedAt: now,
    });

    if (!result.rowsAffected) {
      throw new Error("Failed to create invoice file record");
    }

    return { success: true };
  });
