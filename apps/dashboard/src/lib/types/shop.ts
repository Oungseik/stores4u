import { COUNTRIES } from "@repo/config";
import { z } from "zod";

export const shopFormAiSchema = z.object({
  name: z.string(),
  slug: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  address: z.string(),
  city: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.enum(COUNTRIES).optional(),
});

export const fillFormOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  fields: shopFormAiSchema,
});

export type ShopFormFields = z.infer<typeof shopFormAiSchema>;

export const shopFormSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  phone: z.string().min(1).max(50),
  email: z.email().max(200).optional(),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  country: z.enum(COUNTRIES),
});

export const shopInsertSchema = shopFormSchema.extend({
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

export type ActionResult = z.infer<typeof actionResultSchema>;
