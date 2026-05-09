<script lang="ts">
  import * as Sidebar from "@repo/ui/sidebar";
  import { Spinner } from "@repo/ui/spinner";

  import { page } from "$app/state";

  import type { LayoutProps } from "./$types";
  import AdminSidebar from "./admin-sidebar.svelte";

  let { children, data }: LayoutProps = $props();
  const shops = $derived(data.shops);
  const user = $derived(data.user);
</script>

{#if data}
  <Sidebar.Provider
    style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
  >
    <AdminSidebar variant="sidebar" shop={data} {shops} {user} currentPath={page.url.pathname} />
    <Sidebar.Inset class="overflow-hidden">
      <!-- <header -->
      <!--   class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear" -->
      <!-- > -->
      <!--   <div class="flex w-full items-center gap-1 lg:gap-2"> -->
      <!--     <Sidebar.Trigger class="-ms-1" /> -->
      <!--     <Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" /> -->
      <!--     <h1 class="text-base font-medium">Checkout</h1> -->
      <!--   </div> -->
      <!-- </header> -->
      <div class="flex flex-1 flex-col overflow-hidden">
        {@render children?.()}
      </div>
    </Sidebar.Inset>
  </Sidebar.Provider>
{:else}
  <!-- Fallback while shop data is loading -->
  <div class="flex h-screen items-center justify-center">
    <div class="text-center">
      <Spinner class="text-primary mx-auto mb-4 size-8" />
      <p class="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
{/if}
