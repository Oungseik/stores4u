<script lang="ts">
  import * as Sidebar from "@repo/ui/sidebar";
  import { Spinner } from "@repo/ui/spinner";

  import { page } from "$app/state";

  import type { LayoutProps } from "./$types";
  import ChatsSidebar from "./chats-sidebar.svelte";

  let { children, data }: LayoutProps = $props();
  const user = $derived(data.user);
  const slug = $derived(data.slug);

  // Mock shop data - in real app, this would come from the load function
  const shop = $derived({
    id: "shop-1",
    name: "My Shop",
    slug: slug,
    logo: null as string | null,
  });
</script>

{#if user}
  <Sidebar.Provider
    style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
  >
    <ChatsSidebar variant="inset" {shop} {user} currentPath={page.url.pathname} />
    <Sidebar.Inset>
      <div class="flex h-screen flex-1 flex-col overflow-hidden">
        {@render children?.()}
      </div>
    </Sidebar.Inset>
  </Sidebar.Provider>
{:else}
  <!-- Fallback while user data is loading -->
  <div class="flex h-screen items-center justify-center">
    <div class="flex flex-col items-center gap-4">
      <Spinner class="size-8" />
      <p class="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
{/if}
