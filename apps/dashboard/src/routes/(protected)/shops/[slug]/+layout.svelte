<script lang="ts">
  import * as Sidebar from "@repo/ui/sidebar";
  import { Spinner } from "@repo/ui/spinner";

  import { page } from "$app/state";

  import type { LayoutProps } from "./$types";
  import AdminSidebar from "./admin-sidebar.svelte";

  let { children, data }: LayoutProps = $props();
</script>

{#if data.organization}
  <Sidebar.Provider
    style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
  >
    <AdminSidebar
      variant="sidebar"
      organization={data.organization}
      user={data.user}
      shops={data.shops}
      currentPath={page.url.pathname}
    />
    <Sidebar.Inset class="overflow-hidden">
      <div class="flex flex-1 flex-col overflow-hidden">
        {@render children?.()}
      </div>
    </Sidebar.Inset>
  </Sidebar.Provider>
{:else}
  <div class="flex h-screen items-center justify-center">
    <div class="text-center">
      <Spinner class="mx-auto mb-4 size-8 text-primary" />
      <p class="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
{/if}
