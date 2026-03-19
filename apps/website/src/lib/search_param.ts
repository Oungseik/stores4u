import { createSearchParamsSchema } from "runed/kit";

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
