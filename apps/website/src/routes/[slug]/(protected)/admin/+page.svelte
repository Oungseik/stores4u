<script lang="ts">
  import BellIcon from "@lucide/svelte/icons/bell";
  import BoxIcon from "@lucide/svelte/icons/package";
  import BarcodeIcon from "@lucide/svelte/icons/scan-barcode";
  import { buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";

  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";

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

<div class="@container/main flex flex-1 flex-col gap-2 p-4 md:p-6">
  <div class="flex flex-col gap-4 md:gap-6">
    <AdminDashboardHeader breadcrumbs={[{ label: "Dashboard" }]} />

    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p class="text-muted-foreground text-sm">
        Overview of your shop performance and quick actions
      </p>
    </div>

    <!-- Quick Actions -->
    <div>
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
                <a
                  class={["shrink-0", , buttonVariants({ variant: action.variant, size: "sm" })]}
                  href={action.href}
                >
                  Open
                </a>
              </div>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    </div>
  </div>
</div>
