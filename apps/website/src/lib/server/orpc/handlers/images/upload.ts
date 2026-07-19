import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db, image } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getObjectUrl, putObject } from "$lib/server/storage";
import { detectImageFileType } from "$lib/server/utils/magic_bytes";

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

    const detectedType = detectImageFileType(buffer);
    if (!detectedType) {
      throw new ORPCError("BAD_REQUEST", {
        data: { key: "ui_invalid_image_type_accepted_jpeg_png_webp" },
      });
    }

    const objectKey = `images/${crypto.randomUUID()}.${detectedType.extension}`;
    await putObject(objectKey, buffer);

    const objectPath = getObjectUrl(objectKey);

    await db.insert(image).values({
      objectPath,
      filename: file.name,
      type: detectedType.mime,
      size: buffer.length,
    });

    return { objectPath };
  });
