import assert from "node:assert/strict";
import { ExtractedInvoiceDataSchema } from "@repo/database";

const invoice = {
  supplier: { name: "Supplier" },
  invoice: { totalCents: 100 },
  items: [
    {
      productName: "Item",
      quantity: 1,
      unitCostCents: 100,
      lineTotalCents: 100,
    },
  ],
};

assert(ExtractedInvoiceDataSchema.safeParse({ ...invoice, confidence: 1 }).success);
assert(!ExtractedInvoiceDataSchema.safeParse({ ...invoice, confidence: 1.1 }).success);
assert(
  !ExtractedInvoiceDataSchema.safeParse({
    ...invoice,
    confidence: 1,
    invoice: { totalCents: 100.5 },
  }).success,
);
