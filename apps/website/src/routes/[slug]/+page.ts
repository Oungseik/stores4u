import { ORPCError } from "@orpc/client";
import { error } from "@sveltejs/kit";
import { validateSearchParams } from "runed/kit";
import { orpc } from "$lib/orpc_client";
import { shopProductsFilterSchema } from "$lib/search_param";
import type { PageLoad } from "./$types";

export const load = (async ({ url, parent, params }) => {
  const { data } = validateSearchParams(url, shopProductsFilterSchema);
  const { queryClient } = await parent();
  const slug = params.slug;

  if (!slug) {
    error(400, { message: "Shop slug is required" });
  }

  try {
    await queryClient.ensureQueryData(
      orpc.products.list.queryOptions({
        input: {
          slug: params.slug,
          search: data.search ?? undefined,
          categories: data.categories?.length > 0 ? data.categories : undefined,
          inStockOnly: data.inStockOnly ?? undefined,
          minPriceCents: data.minPrice ?? undefined,
          maxPriceCents: data.maxPrice ?? undefined,
        },
      }),
    );
  } catch (e) {
    if (e instanceof ORPCError) {
      if (e.status === 404) {
        error(404, { message: "Shop not found" });
      }
      error(e.status ?? 500, { message: e.message });
    }
    throw e;
  }
}) satisfies PageLoad;
