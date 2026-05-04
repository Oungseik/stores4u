import type {
  MovementType,
  PurchaseInvoiceFileStatus,
  PurchaseInvoiceStatus,
} from "@repo/perstore-db";
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

export type ProductsView = "card" | "table";

export const productsFilterSchema = createSearchParamsSchema({
  search: { type: "string", default: "" },
  categories: {
    type: "array",
    arrayType: "",
    default: [],
  },
  view: { type: "string", default: "card" },
}) as StandardSchemaV1<unknown, { search: string; categories: string[]; view: ProductsView }>;

export const ordersFilterSchema = createSearchParamsSchema({
  search: { type: "string", default: "" },
  dateFrom: { type: "string", default: "" },
  dateTo: { type: "string", default: "" },
});

export const purchaseInvoicesFilterSchema = createSearchParamsSchema({
  search: { type: "string", default: "" },
  statuses: {
    type: "array",
    arrayType: "",
    default: [],
  },
}) as StandardSchemaV1<unknown, { search: string; statuses: PurchaseInvoiceStatus[] }>;

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

export type InvoiceFilesView = "card" | "table";

export const invoiceFilesFilterSchema = createSearchParamsSchema({
  search: { type: "string", default: "" },
  statuses: {
    type: "array",
    arrayType: "",
    default: [],
  },
  view: { type: "string", default: "card" },
}) as StandardSchemaV1<
  unknown,
  { search: string; statuses: PurchaseInvoiceFileStatus[]; view: InvoiceFilesView }
>;

type AccountsTab = {
  tab: "profile" | "security" | "sessions" | "connections" | "danger";
};

export const accountsTabSchema = createSearchParamsSchema({
  tab: { type: "string", default: "profile" },
}) as StandardSchemaV1<unknown, AccountsTab>;

export type InventoryMovementsView = "card" | "table";

type InventoryMovementsFilterSchema = {
  search: string;
  dateFrom: string;
  dateTo: string;
  view: InventoryMovementsView;
  movementTypes: MovementType[];
};

export const inventoryMovementsFilterSchema = createSearchParamsSchema({
  search: { type: "string", default: "" },
  dateFrom: { type: "string", default: "" },
  dateTo: { type: "string", default: "" },
  movementTypes: { type: "array", arrayType: "", default: [] },
  view: { type: "string", default: "card" },
}) as StandardSchemaV1<unknown, InventoryMovementsFilterSchema>;
