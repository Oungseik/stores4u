<script lang="ts">
  import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
  import ArrowDownIcon from "@lucide/svelte/icons/arrow-down";
  import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
  import DollarSignIcon from "@lucide/svelte/icons/dollar-sign";
  import BoxIcon from "@lucide/svelte/icons/package";
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
  import { Badge } from "@repo/ui/badge";
  import * as Breadcrumb from "@repo/ui/breadcrumb";
  import * as Card from "@repo/ui/card";
  import { Separator } from "@repo/ui/separator";
  import * as Sidebar from "@repo/ui/sidebar";
  import { createQuery } from "@tanstack/svelte-query";

  import Pricing from "$lib/components/Pricing.svelte";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();

  // Fetch products for stats
  const productsQuery = createQuery(() =>
    orpc.products.list.queryOptions({
      input: { slug: params.slug, pageSize: 100 },
      enabled: !!params.slug,
    })
  );

  // Mock stats for now - these would come from actual API
  const stats = $derived({
    todaySales: 125000, // cents
    totalProducts: productsQuery.data?.items.length ?? 0,
    lowStockItems:
      productsQuery.data?.items.filter((p) => p.stock > 0 && p.stock <= 10).length ?? 0,
    outOfStockItems: productsQuery.data?.items.filter((p) => p.stock === 0).length ?? 0,
  });

  interface KPICard {
    title: string;
    value: string | number;
    description: string;
    icon: typeof DollarSignIcon;
    trend?: {
      value: number;
      label: string;
      positive: boolean;
    };
    variant?: "default" | "warning" | "danger";
  }

  const kpiCards = $derived((): KPICard[] => [
    {
      title: "Today's Sales",
      value: "Sales Data",
      description: "Revenue today",
      icon: DollarSignIcon,
      trend: { value: 12.5, label: "vs yesterday", positive: true },
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      description: "Active products",
      icon: BoxIcon,
      trend: { value: 5, label: "new this week", positive: true },
    },
    {
      title: "Low Stock",
      value: stats.lowStockItems,
      description: "Items need restocking",
      icon: AlertTriangleIcon,
      variant: stats.lowStockItems > 0 ? "warning" : "default",
    },
    {
      title: "Out of Stock",
      value: stats.outOfStockItems,
      description: "Unavailable items",
      icon: ShoppingCartIcon,
      variant: stats.outOfStockItems > 0 ? "danger" : "default",
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
                <Breadcrumb.Link href={`/${shop.slug}/admin`}>Dashboard</Breadcrumb.Link>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Breadcrumb.Page>Analytics</Breadcrumb.Page>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb.Root>
          <!-- <p class="text-muted-foreground text-sm font-medium"> -->
          <!--   Overview of your shop performance -->
          <!-- </p> -->
        </div>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {#each kpiCards() as card (card.title)}
        <Card.Root
          class="@container/card {card.variant === 'warning'
            ? 'border-amber-500/20'
            : card.variant === 'danger'
              ? 'border-red-500/20'
              : ''}"
        >
          <Card.Header class="pb-2">
            <div class="flex items-center justify-between">
              <Card.Description>{card.title}</Card.Description>
              <div
                class="flex size-8 items-center justify-center rounded-md {card.variant ===
                'warning'
                  ? 'bg-amber-100 text-amber-700'
                  : card.variant === 'danger'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-muted'}"
              >
                <card.icon class="size-4" />
              </div>
            </div>
            <Card.Title class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {#if card.title === "Today's Sales"}
                <Pricing cents={stats.todaySales} country={shop.country} />
              {:else}
                {card.value}
              {/if}
            </Card.Title>
          </Card.Header>
          <Card.Footer class="flex-col items-start gap-1.5 pt-0 text-sm">
            {#if card.trend}
              <div class="flex items-center gap-1.5 font-medium">
                {#if card.trend.positive}
                  <ArrowUpIcon class="size-3.5 text-emerald-600" />
                  <span class="text-emerald-600">+{card.trend.value}%</span>
                {:else}
                  <ArrowDownIcon class="size-3.5 text-red-600" />
                  <span class="text-red-600">-{card.trend.value}%</span>
                {/if}
                <span class="text-muted-foreground">{card.trend.label}</span>
              </div>
            {:else if card.variant === "warning"}
              <Badge variant="outline" class="border-amber-500/30 text-amber-700">
                Attention needed
              </Badge>
            {:else if card.variant === "danger"}
              <Badge variant="outline" class="border-red-500/30 text-red-700">
                Restock required
              </Badge>
            {:else}
              <span class="text-muted-foreground">{card.description}</span>
            {/if}
          </Card.Footer>
        </Card.Root>
      {/each}
    </div>

    <!-- Recent Activity Placeholder -->
    <div class="px-4 lg:px-6">
      <Card.Root>
        <Card.Header>
          <Card.Title>Recent Activity</Card.Title>
          <Card.Description>Latest transactions and updates</Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="text-muted-foreground py-8 text-center text-sm">
            <p>No recent activity to display</p>
            <p class="mt-1 text-xs opacity-70">
              Activity will appear here once you start processing orders
            </p>
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  </div>
</div>
