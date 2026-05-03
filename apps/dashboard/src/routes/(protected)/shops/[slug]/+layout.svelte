<script lang="ts">
  import * as Sidebar from "@repo/ui/sidebar";
  import { Spinner } from "@repo/ui/spinner";

  import { page } from "$app/state";

  import type { LayoutProps } from "./$types";
  import AdminSidebar from "./admin-sidebar.svelte";

  let { children, data: shopData }: LayoutProps = $props();
  const shop = $derived(shopData.shop);
  const user = $derived(shopData.user);
</script>

{#if shop}
  <Sidebar.Provider
    style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
  >
    <AdminSidebar variant="sidebar" {shop} {user} currentPath={page.url.pathname} />
    <Sidebar.Inset class="overflow-hidden">
      <div class="flex flex-1 flex-col overflow-hidden">
        {@render children?.()}
      </div>
    </Sidebar.Inset>
  </Sidebar.Provider>
{:else}
  <!-- Fallback while shop data is loading -->
  <div class="flex h-screen items-center justify-center">
    <div class="text-center">
      <Spinner class="mx-auto mb-4 size-8 text-primary" />
      <p class="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
{/if}
