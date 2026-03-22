import { createSearchParamsSchema, type StandardSchemaV1 } from "runed/kit";

type CheckoutMode = {
  mode: "scan" | "search";
};

export const checkoutModeSchema = createSearchParamsSchema({
  mode: { type: "string", default: "scan" },
}) as StandardSchemaV1<unknown, CheckoutMode>;

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
