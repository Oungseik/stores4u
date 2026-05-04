import { createSearchParamsSchema, type StandardSchemaV1 } from "runed/kit";

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
  page: { type: "number", default: 1 },
  pageSize: { type: "number", default: 20 },
}) as StandardSchemaV1<
  unknown,
  { search: string; categories: string[]; view: ProductsView; page: number; pageSize: number }
>;
