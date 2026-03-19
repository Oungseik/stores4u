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

<div class="flex flex-col gap-4">
  <div class="flex h-9 items-center justify-between">
    <div class="flex items-center gap-1 lg:gap-2">
      <Sidebar.Trigger class="-ms-1" />
      <Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
      <Breadcrumb.Root>
        <Breadcrumb.List>
          {#each breadcrumbs as item, i}
            <Breadcrumb.Item>
              {#if item.href}
                <Breadcrumb.Link href={item.href}>{item.label}</Breadcrumb.Link>
              {:else}
                <Breadcrumb.Page>{item.label}</Breadcrumb.Page>
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
      <div class="flex items-center gap-2">
        {@render actions()}
      </div>
    {/if}
  </div>
</div>
