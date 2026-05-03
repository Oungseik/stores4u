<script lang="ts">
  import * as Breadcrumb from "@repo/ui/breadcrumb";
  import { Separator } from "@repo/ui/separator";
  import * as Sidebar from "@repo/ui/sidebar";
  import type { Snippet } from "svelte";

  type BreadcrumbItem = { label: string; href?: string };

  type Props = {
    breadcrumbs: BreadcrumbItem[];
    actions?: Snippet;
  };

  const { breadcrumbs, actions }: Props = $props();
</script>

<div class="flex flex-col gap-4 p-4 md:px-6">
  <div class="flex h-9 items-center justify-between">
    <div class="flex min-w-0 flex-1 items-center gap-1 lg:gap-2">
      <Sidebar.Trigger class="-ms-1 shrink-0" />
      <Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
      <Breadcrumb.Root class="min-w-0 overflow-hidden">
        <Breadcrumb.List class="flex-nowrap">
          {#each breadcrumbs as item, i}
            <Breadcrumb.Item>
              {#if item.href}
                <Breadcrumb.Link class="max-w-[64px] truncate lg:max-w-none" href={item.href}
                  >{item.label}</Breadcrumb.Link
                >
              {:else}
                <Breadcrumb.Page class="max-w-[64px] truncate lg:max-w-none"
                  >{item.label}</Breadcrumb.Page
                >
              {/if}
            </Breadcrumb.Item>
            {#if i < breadcrumbs.length - 1}
              <Breadcrumb.Separator />
            {/if}
          {/each}
        </Breadcrumb.List>
      </Breadcrumb.Root>
    </div>
    {#if actions}
      <div class="ml-auto flex items-center gap-2">
        {@render actions()}
      </div>
    {/if}
  </div>
</div>
