import { image } from "@repo/db";
import z from "zod";
import { authMiddleware, os, shopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";
import { getObjectUrl, getPartialObject, removeImage, statObject } from "$lib/server/storage";
import { ALLOWED_IMAGE_TYPES, detectImageType } from "$lib/server/utils/magic_bytes";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const input = z.object({
  slug: z.string(),
  objectKey: z.string().min(1),
});

/**
 * @deprecated Use `images.upload` instead.
 * The new upload endpoint handles file processing server-side for better security and control.
 */
export const confirmUploadHandler = os
  .input(input)
  .use(shopMiddleware)
  .use(authMiddleware)
  .handler(async ({ input, context }) => {
    const stat = await statObject(input.objectKey);
    if (!stat.exists) {
      throw new Error("Upload not found");
    }

    if (stat.size && stat.size > MAX_FILE_SIZE) {
      await removeImage(input.objectKey);
      throw new Error("Image exceeds 2MB limit. Please upload a smaller image.");
    }

    const headerBytes = await getPartialObject(input.objectKey, 32);
    const detectedType = detectImageType(headerBytes);

    if (!detectedType || !ALLOWED_IMAGE_TYPES.includes(detectedType)) {
      throw new Error("Invalid image type");
    }

    const objectPath = getObjectUrl(input.objectKey);
    const filename = input.objectKey.split("/").pop() || "unknown";

    const shopDb = getShopDb(context.shop);
    const data = {
      objectPath,
      filename,
      type: detectedType,
      size: stat.size!,
    };

    await shopDb.insert(image).values(data).returning();

    return data;
  });
