import { ORPCError } from "@orpc/client";
import { error } from "@sveltejs/kit";
import { orpc } from "$lib/orpc_client";
import type { PageLoad } from "./$types";

export const load = (async ({ parent, params }) => {
  const { queryClient } = await parent();
  const slug = params.slug;

  if (!slug) {
    error(400, { message: "Shop slug is required" });
  }

  try {
    await queryClient.ensureQueryData(orpc.products.list.queryOptions({ input: { slug } }));
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
