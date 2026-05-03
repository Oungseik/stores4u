import { z } from "zod";

export const shopCreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
});

export const shopInsertSchema = shopCreateSchema.extend({
  id: z.string(),
  userId: z.string(),
  tursoDbUrl: z.string().optional(),
  tursoDbToken: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ShopInsert = z.infer<typeof shopInsertSchema>;

export const actionResultSchema = z.object({
  type: z.string(),
  data: z
    .object({
      success: z.boolean().optional(),
      message: z.string().optional(),
      slug: z.string().optional(),
    })
    .optional(),
});
