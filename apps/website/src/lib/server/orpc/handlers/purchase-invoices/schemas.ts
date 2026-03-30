import { z } from "zod";

export const purchaseInvoiceItemInput = z.object({
  productId: z.string().min(1),
  invoiceItemName: z.string().min(1).max(500),
  qty: z.number().positive(),
  unitCostCents: z.number().int().min(0),
  lineSubtotalCents: z.number().int().min(0),
  vatCents: z.number().int().min(0).default(0),
  discountCents: z.number().int().min(0).default(0),
  freightCents: z.number().int().min(0).default(0),
  lineTotalCents: z.number().int().min(0),
  expiryDate: z.string().optional(),
  batchNumber: z.string().max(100).optional(),
  saveAlias: z.boolean().optional(),
});

export const newSupplierInput = z.object({
  name: z.string().min(1).max(255),
  contactName: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().max(255).optional(),
  address: z.string().max(500).optional(),
  paymentTerms: z.string().max(100).optional(),
});

export const invoiceAmountFields = {
  subtotalCents: z.number().int().min(0),
  vatCents: z.number().int().min(0),
  discountCents: z.number().int().min(0),
  freightCents: z.number().int().min(0),
  totalCents: z.number().int().min(0),
  notes: z.string().max(1000).optional(),
};
