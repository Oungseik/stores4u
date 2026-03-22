<script lang="ts">
  import * as Sidebar from "@repo/ui/sidebar";

  import { page } from "$app/state";

  import type { LayoutProps } from "./$types";
  import AdminSidebar from "./admin-sidebar.svelte";

  let { children, data: shop }: LayoutProps = $props();
  const user = $derived(shop.user);
</script>

{#if shop}
  <Sidebar.Provider
    style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
  >
    <AdminSidebar variant="inset" {shop} {user} currentPath={page.url.pathname} />
    <Sidebar.Inset>
      <!-- <header -->
      <!--   class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear" -->
      <!-- > -->
      <!--   <div class="flex w-full items-center gap-1 lg:gap-2"> -->
      <!--     <Sidebar.Trigger class="-ms-1" /> -->
      <!--     <Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" /> -->
      <!--     <h1 class="text-base font-medium">Checkout</h1> -->
      <!--   </div> -->
      <!-- </header> -->
      <div class="flex flex-1 flex-col">
        {@render children?.()}
      </div>
    </Sidebar.Inset>
  </Sidebar.Provider>
{:else}
  <!-- Fallback while shop data is loading -->
  <div class="flex h-screen items-center justify-center">
    <div class="text-center">
      <div
        class="border-primary mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-t-transparent"
      ></div>
      <p class="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
{/if}
