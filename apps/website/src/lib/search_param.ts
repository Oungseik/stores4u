import { createSearchParamsSchema, type StandardSchemaV1 } from "runed/kit";

type CheckoutMode = {
  mode: "scan" | "search";
};

export const checkoutModeSchema = createSearchParamsSchema({
  mode: { type: "string", default: "scan" },
}) as StandardSchemaV1<unknown, CheckoutMode>;

type SettingsTab = {
  tab: "profile" | "business" | "payment" | "receipt" | "tax" | "notifications" | "team";
};

export const settingsTabSchema = createSearchParamsSchema({
  tab: { type: "string", default: "profile" },
}) as StandardSchemaV1<unknown, SettingsTab>;

export const returnUrlSchema = createSearchParamsSchema({
  return_url: { type: "string" },
});

export const productsFilterSchema = createSearchParamsSchema({
  search: { type: "string", default: "" },
  categories: {
    type: "array",
    arrayType: "",
    default: [],
  },
});

export const ordersFilterSchema = createSearchParamsSchema({
  search: { type: "string", default: "" },
  dateFrom: { type: "string", default: "" },
  dateTo: { type: "string", default: "" },
});

export const invoicesFilterSchema = createSearchParamsSchema({
  search: { type: "string", default: "" },
  status: { type: "string", default: "" },
}) as StandardSchemaV1<unknown, { search: string; status: InvoiceStatus | "" }>;

export const suppliersFilterSchema = createSearchParamsSchema({
  search: { type: "string", default: "" },
});

type ShopProductFilterSchema = {
  search: string | null;
  categories: string[];
  inStockOnly: boolean;
  minPrice: number | null;
  maxPrice: number | null;
};

export const shopProductsFilterSchema = createSearchParamsSchema({
  search: { type: "string" },
  categories: { type: "array", arrayType: "", default: [] },
  inStockOnly: { type: "boolean", default: false },
  minPrice: { type: "number" },
  maxPrice: { type: "number" },
}) as StandardSchemaV1<unknown, ShopProductFilterSchema>;

export type InvoiceStatus = "PENDING" | "VALIDATED" | "REJECTED" | "AUTO_ACCEPTED";
