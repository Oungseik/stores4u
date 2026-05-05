import { COUNTRIES, CURRENCIES } from "@repo/config";
import { z } from "zod";

export const shopCreateSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
});

export const shopUpdateSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  title: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  country: z.enum(COUNTRIES),
  currency: z.enum(CURRENCIES),
  phone: z.string().min(1),
  email: z.email(),
  taxId: z.string().optional(),
  organizationId: z.string(),
});

export type ShopUpdateInput = z.infer<typeof shopUpdateSchema>;
