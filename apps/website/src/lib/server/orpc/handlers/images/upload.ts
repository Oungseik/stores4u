import { ORPCError } from "@orpc/server";
import sharp from "sharp";
import { z } from "zod";
import { db, image } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getObjectUrl, putObject } from "$lib/server/storage";
import { isAllowedImageType } from "$lib/server/utils/magic_bytes";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const input = z.object({
  file: z.file(),
});

export const uploadHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const file = input.file;

    if (file.size > MAX_FILE_SIZE) {
      throw new ORPCError("BAD_REQUEST", { data: { key: "error_file_size_exceeds_2mb_limit" } });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!isAllowedImageType(buffer)) {
      throw new ORPCError("BAD_REQUEST", {
        data: { key: "ui_invalid_image_type_accepted_jpeg_png_webp" },
      });
    }

    const objectKey = `images/${Bun.randomUUIDv7()}.webp`;
    const finalBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();

    await putObject(objectKey, finalBuffer);

    const objectPath = getObjectUrl(objectKey);

    await db.insert(image).values({
      objectPath,
      filename: file.name,
      type: "image/webp",
      size: finalBuffer.length,
    });

    return { objectPath };
  });
