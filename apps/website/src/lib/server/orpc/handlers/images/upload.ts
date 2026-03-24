import { randomUUID } from "node:crypto";
import { image } from "@repo/db";
import sharp from "sharp";
import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";
import { getObjectUrl, putObject } from "$lib/server/storage";
import { ALLOWED_IMAGE_TYPES, detectImageType } from "$lib/server/utils/magic_bytes";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const input = z.object({
  slug: z.string(),
  file: z.file(),
});

export const uploadHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const file = input.file;

    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File size exceeds 2MB limit");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const detectedType = detectImageType(buffer);
    if (!detectedType || !ALLOWED_IMAGE_TYPES.includes(detectedType)) {
      throw new Error("Invalid image type. Accepted: JPEG, PNG, WebP, SVG");
    }

    const uuid = randomUUID();
    let objectKey: string;
    let finalBuffer: Buffer;
    let finalContentType: string;
    let finalSize: number;

    if (detectedType === "image/svg+xml") {
      objectKey = `${input.slug}/images/${uuid}.svg`;
      finalBuffer = buffer;
      finalContentType = "image/svg+xml";
      finalSize = buffer.length;
    } else {
      objectKey = `${input.slug}/images/${uuid}.webp`;
      finalBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
      finalContentType = "image/webp";
      finalSize = finalBuffer.length;
    }

    await putObject(objectKey, finalBuffer, finalContentType);

    const objectPath = getObjectUrl(objectKey);

    const shopDb = getShopDb(context.shop);
    await shopDb.insert(image).values({
      objectPath,
      filename: file.name,
      type: finalContentType,
      size: finalSize,
    });

    return { objectPath };
  });
