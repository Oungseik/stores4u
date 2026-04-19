<script lang="ts">
  import * as Sidebar from "@repo/ui/sidebar";
  import { createQuery } from "@tanstack/svelte-query";

  import { page } from "$app/state";
  import { orpc } from "$lib/orpc_client";

  import type { LayoutProps } from "./$types";
  import ChatsSidebar from "./chats-sidebar.svelte";

  let { data, children }: LayoutProps = $props();

  let threadsQuery = createQuery(() =>
    orpc.threads.list.queryOptions({
      input: { slug: data.slug },
    })
  );
</script>

<Sidebar.Provider
  style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
  class="h-dvh min-h-0 overflow-hidden"
>
  <ChatsSidebar
    variant="inset"
    shop={{ id: data.id, name: data.name, slug: data.slug, logo: data.logo }}
    user={data.user}
    currentPath={page.url.pathname}
    chats={threadsQuery.data?.items ?? []}
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
