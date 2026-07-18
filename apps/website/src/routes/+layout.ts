import { QueryClient } from "@tanstack/svelte-query";
import { browser } from "$app/environment";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        enabled: browser,
      },
    },
  });

  return { queryClient };
};
