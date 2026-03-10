import { randomUUID } from "node:crypto";
import { image } from "@repo/db";
import sharp from "sharp";
import z from "zod";
import { STORAGE_PUBLIC_URL } from "$env/static/private";

import { authMiddleware, os, shopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";
import { uploadImage } from "$lib/server/storage";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/svg+xml", "image/jpeg", "image/png", "image/webp"];

const input = z.object({
  slug: z.string(),
  file: z
    .file()
    .max(MAX_FILE_SIZE, "File size cannot exceed 2MB.")
    .mime(ACCEPTED_IMAGE_TYPES, "Only JPEG, PNG, and WebP images are allowed."),
});

export const uploadImageHandler = os
  .input(input)
  .use(shopMiddleware)
  .use(authMiddleware)
  .handler(async ({ input, context }) => {
    const buffer = await input.file.arrayBuffer();
    const result = await sharp(buffer).resize(900, 450).toBuffer();

    const name = input.file.name.split(".");
    name.pop();
    const filename = randomUUID() + "_" + name.join(".").concat(".webp");

    const objPath = await uploadImage(result, filename);
    const objectPath = `${STORAGE_PUBLIC_URL}/${objPath}`;

    const shopDb = getShopDb(context.shop);
    const data = {
      objectPath,
      filename,
      type: "image/webp",
      size: result.byteLength,
    };
    await shopDb.insert(image).values(data).returning();
    return data;
  });
