<script lang="ts">
  import BellIcon from "@lucide/svelte/icons/bell";
  import PackageIcon from "@lucide/svelte/icons/package";
  import ScanLineIcon from "@lucide/svelte/icons/scan-line";
  import { buttonVariants } from "@repo/ui/button";

  import { page } from "$app/state";

  import { type LayoutProps } from "./$types";

  let { children, params }: LayoutProps = $props();

  const dockHeight = "72px";

  const items = $derived([
    { name: "Products", icon: PackageIcon, url: `/${params.slug}/admin` },
    { name: "Scanner", icon: ScanLineIcon, url: `/${params.slug}/admin/scanner` },
    { name: "Alerts", icon: BellIcon, url: `/${params.slug}/admin/notifications` },
  ]);
</script>

<div class="flex min-h-[calc(100dvh-72px)] flex-col">
  {@render children?.()}
</div>

<div
  class="bg-card sticky right-0 bottom-0 left-0 border-t shadow-lg md:hidden"
  style="height: {dockHeight};"
>
  <div class="flex items-center justify-between gap-2 px-4 py-2">
    {#each items as item (item.url)}
      {@const isActive =
        page.url.pathname === item.url ||
        (item.url !== `/${params.slug}/admin` && page.url.pathname.startsWith(item.url))}
      <div class="flex flex-1 shrink-0 flex-col items-center">
        <a
          href={item.url}
          aria-label={item.name}
          class={isActive
            ? buttonVariants({ variant: "secondary", class: "w-full" })
            : buttonVariants({ variant: "ghost", class: "w-full" })}
        >
          <item.icon class="size-4" />
        </a>
        <span class="text-xs">{item.name}</span>
      </div>
    {/each}
  </div>
</div>
