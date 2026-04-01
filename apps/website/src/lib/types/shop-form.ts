import { COUNTRIES } from "@repo/config";
import { z } from "zod";

export const shopFormAiSchema = z.object({
  name: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
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
