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
  cursor: { type: "string", default: undefined },
}) as StandardSchemaV1<
  unknown,
  { search: string; categories: string[]; view: ProductsView; cursor: string | undefined }
>;
