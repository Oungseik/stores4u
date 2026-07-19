<script lang="ts">
  import { localizePath } from "$lib/localize-path";
  import * as Breadcrumb from "@repo/ui/breadcrumb";
  import { Separator } from "@repo/ui/separator";
  import * as Sidebar from "@repo/ui/sidebar";
  import type { Snippet } from "svelte";

  type BreadcrumbItem = { label: string; href?: string };

  type Props = {
    breadcrumbs: BreadcrumbItem[];
    actions?: Snippet;
    hasPageHeading?: boolean;
  };

  const { breadcrumbs, actions, hasPageHeading = false }: Props = $props();
</script>

<header
  class="bg-background -mx-4 -mt-4 flex h-(--header-height) shrink-0 items-center gap-2 border-b px-4 md:-mx-6 md:-mt-6 md:px-6"
>
  {#if !hasPageHeading}
    <h1 class="sr-only">{breadcrumbs.at(-1)?.label}</h1>
  {/if}
  <Sidebar.Trigger class="-ms-1 shrink-0" />
  <Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
  <Breadcrumb.Root class="min-w-0 flex-1 overflow-hidden">
    <Breadcrumb.List class="flex-nowrap">
      {#each breadcrumbs as item, i (item.href ?? item.label)}
        <Breadcrumb.Item>
          {#if item.href}
            <Breadcrumb.Link
              class="max-w-[64px] truncate lg:max-w-none"
              href={localizePath(item.href)}>{item.label}</Breadcrumb.Link
            >
          {:else}
            <Breadcrumb.Page class="max-w-[64px] truncate lg:max-w-none">
              {item.label}
            </Breadcrumb.Page>
          {/if}
        </Breadcrumb.Item>
        {#if i < breadcrumbs.length - 1}
          <Breadcrumb.Separator />
        {/if}
      {/each}
    </Breadcrumb.List>
  </Breadcrumb.Root>
  {#if actions}
    <div class="flex shrink-0 items-center gap-2">
      {@render actions()}
    </div>
  {/if}
</header>
