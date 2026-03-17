<script lang="ts">
  import BellIcon from "@lucide/svelte/icons/bell";
  import BoxIcon from "@lucide/svelte/icons/package";
  import BarcodeIcon from "@lucide/svelte/icons/scan-barcode";
  import * as Breadcrumb from "@repo/ui/breadcrumb";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Separator } from "@repo/ui/separator";
  import * as Sidebar from "@repo/ui/sidebar";

  import type { PageProps } from "./$types";

  const { params }: PageProps = $props();

  const quickActions = $derived([
    {
      title: "POS Checkout",
      description: "Process sales quickly",
      icon: BarcodeIcon,
      href: `/${params.slug}/admin/checkout`,
      variant: "default" as const,
    },
    {
      title: "View Products",
      description: "Manage inventory",
      icon: BoxIcon,
      href: `/${params.slug}/admin/products`,
      variant: "outline" as const,
    },
    {
      title: "Notifications",
      description: "Check alerts",
      icon: BellIcon,
      href: `/${params.slug}/admin/notifications`,
      variant: "outline" as const,
    },
  ]);
</script>

<div class="@container/main flex flex-1 flex-col gap-2">
  <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
    <!-- Header with Breadcrumb -->
    <div class="flex flex-col gap-2 px-4 lg:px-6">
      <div class="flex h-9 items-center justify-between">
        <div class="flex items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <Sidebar.Trigger class="-ms-1" />
          <Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb.Root>
            <Breadcrumb.List>
              <Breadcrumb.Item>
                <Breadcrumb.Page>Dashboard</Breadcrumb.Page>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb.Root>
          <!-- <p class="text-muted-foreground text-sm font-medium"> -->
          <!--   Overview of your shop performance -->
          <!-- </p> -->
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="px-4 lg:px-6">
      <h2 class="mb-4 text-lg font-semibold">Quick Actions</h2>
      <div class="grid grid-cols-1 gap-4 @sm:grid-cols-2 @lg:grid-cols-3">
        {#each quickActions as action (action.title)}
          <Card.Root class="group transition-all hover:shadow-sm">
            <Card.Content class="p-4">
              <div class="flex items-start gap-4">
                <div
                  class="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-lg"
                >
                  <action.icon class="size-5" />
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="truncate font-medium">{action.title}</h3>
                  <p class="text-muted-foreground text-sm">{action.description}</p>
                </div>
                <Button variant={action.variant} size="sm" href={action.href} class="shrink-0">
                  Open
                </Button>
              </div>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    </div>
  </div>
</div>
