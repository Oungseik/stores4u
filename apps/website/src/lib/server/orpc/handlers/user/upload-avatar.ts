import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { z } from "zod";
import { db, user } from "$lib/server/db";
import { authMiddleware, os } from "$lib/server/orpc/base";
import { getObjectUrl, putObject } from "$lib/server/storage";
import { ALLOWED_IMAGE_TYPES, detectImageType } from "$lib/server/utils/magic_bytes";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const input = z.object({
  file: z.file(),
});

export const uploadAvatarHandler = os
  .input(input)
  .use(authMiddleware)
  .handler(async ({ input, context }) => {
    const file = input.file;

    if (file.size > MAX_FILE_SIZE) {
      throw new ORPCError("BAD_REQUEST", { message: "File size exceeds 2MB limit" });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const detectedType = detectImageType(buffer);
    if (!detectedType || !ALLOWED_IMAGE_TYPES.includes(detectedType)) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Invalid image type. Accepted: JPEG, PNG, WebP",
      });
    }

    if (detectedType === "image/svg+xml") {
      throw new ORPCError("BAD_REQUEST", { message: "SVG is not supported for avatars" });
    }

    const userId = context.session.user.id;
    const uuid = Bun.randomUUIDv7();
    const objectKey = `avatars/${userId}/${uuid}.webp`;

    const finalBuffer = await sharp(buffer)
      .resize(256, 256, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();

    await putObject(objectKey, finalBuffer, "image/webp");
    const objectPath = getObjectUrl(objectKey);

    await db
      .update(user)
      .set({ image: objectPath, updatedAt: new Date() })
      .where(eq(user.id, userId));

    return { objectPath };
  });
