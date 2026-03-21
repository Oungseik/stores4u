import { randomUUID } from "node:crypto";
import z from "zod";
import { authMiddleware, os, shopMiddleware } from "$lib/server/orpc/base";
import { presignUpload } from "$lib/server/storage";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const input = z.object({
  slug: z.string(),
  filename: z.string().min(1).max(255),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]),
  size: z.number().int().positive().max(MAX_FILE_SIZE),
});

export const getUploadUrlHandler = os
  .input(input)
  .use(shopMiddleware)
  .use(authMiddleware)
  .handler(async ({ input }) => {
    const sanitizedName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectKey = `${input.slug}/images/${randomUUID()}_${sanitizedName}`;

    const uploadUrl = presignUpload(objectKey, input.contentType, 900);

    return {
      uploadUrl,
      objectKey,
    };
  });
