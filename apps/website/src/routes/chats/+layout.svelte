<script lang="ts">
  import * as Sidebar from "@repo/ui/sidebar";
  import { createInfiniteQuery } from "@tanstack/svelte-query";

  import { page } from "$app/state";
  import { orpc } from "$lib/orpc_client";

  import type { LayoutProps } from "./$types";
  import ChatsSidebar from "./chats-sidebar.svelte";

  let { data, children }: LayoutProps = $props();

  let threadsQuery = createInfiniteQuery(() =>
    orpc.threads.list.infiniteOptions({
      initialPageParam: 0 as number | undefined,
      input: (pageParam) => ({
        page: pageParam,
      }),
      getNextPageParam: (lastPage, allPages) => (lastPage.hasMore ? allPages.length : undefined),
      refetchInterval: (query) => {
        const items = query.state.data?.pages.flatMap((p) => p.items) ?? [];
        if (items.some((t) => t.title === "New Chat")) return 3000;
        return false;
      },
    })
  );

  let allThreads = $derived(threadsQuery.data?.pages.flatMap((p) => p.items) ?? []);
</script>

<Sidebar.Provider
  style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
  class="h-dvh min-h-0 overflow-hidden"
>
  <ChatsSidebar
    variant="inset"
    shop={data.shop}
    user={data.user}
    currentPath={page.url.pathname}
    chats={allThreads}
    hasNextPage={threadsQuery.hasNextPage}
    fetchNextPage={threadsQuery.fetchNextPage}
    isFetchingNextPage={threadsQuery.isFetchingNextPage}
  />
  <Sidebar.Inset>
    <div class="flex h-full flex-1 flex-col overflow-hidden">
      <header class="flex h-14 items-center gap-2 border-b px-4">
        <Sidebar.Trigger class="-ms-1" />
        <h1 class="font-medium">Chats</h1>
      </header>
      {@render children()}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
