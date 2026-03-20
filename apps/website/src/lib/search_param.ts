import { createSearchParamsSchema, type StandardSchemaV1 } from "runed/kit";

export const returnUrlSchema = createSearchParamsSchema({
  return_url: { type: "string" },
});

export const productsFilterSchema = createSearchParamsSchema({
  search: { type: "string", default: "" },
  categoryIds: {
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
  categoryIds: string[];
  inStockOnly: boolean;
  minPrice: number | null;
  maxPrice: number | null;
};

export const shopProductsFilterSchema = createSearchParamsSchema({
  search: { type: "string" },
  categoryIds: { type: "array", arrayType: "", default: [] },
  inStockOnly: { type: "boolean", default: false },
  minPrice: { type: "number" },
  maxPrice: { type: "number" },
}) as StandardSchemaV1<unknown, ShopProductFilterSchema>;
