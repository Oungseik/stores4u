<script lang="ts">
  import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
  import ArrowDownIcon from "@lucide/svelte/icons/arrow-down";
  import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
  import DollarSignIcon from "@lucide/svelte/icons/dollar-sign";
  import BoxIcon from "@lucide/svelte/icons/package";
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
  import { Badge } from "@repo/ui/badge";
  import * as Card from "@repo/ui/card";
  import { createQuery } from "@tanstack/svelte-query";
  import StatsCard from "$lib/components/cards/StatsCard.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
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
    iconBgClass: string;
    iconTextClass: string;
    borderClass: string;
    trend?: {
      value: number;
      label: string;
      positive: boolean;
    };
  }

  const kpiCards = $derived((): KPICard[] => [
    {
      title: "Today's Sales",
      value: "Sales Data",
      description: "Revenue today",
      icon: DollarSignIcon,
      iconBgClass: "bg-emerald-500/10",
      iconTextClass: "text-emerald-600",
      borderClass: "from-emerald-500/20 to-emerald-500/5",
      trend: { value: 12.5, label: "vs yesterday", positive: true },
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      description: "Active products",
      icon: BoxIcon,
      iconBgClass: "bg-primary/10",
      iconTextClass: "text-primary",
      borderClass: "from-primary/20 to-primary/5",
      trend: { value: 5, label: "new this week", positive: true },
    },
    {
      title: "Low Stock",
      value: stats.lowStockItems,
      description: "Items need restocking",
      icon: AlertTriangleIcon,
      iconBgClass: "bg-amber-500/10",
      iconTextClass: "text-amber-600",
      borderClass: "from-amber-500/20 to-amber-500/5",
    },
    {
      title: "Out of Stock",
      value: stats.outOfStockItems,
      description: "Unavailable items",
      icon: ShoppingCartIcon,
      iconBgClass: "bg-red-500/10",
      iconTextClass: "text-red-600",
      borderClass: "from-red-500/20 to-red-500/5",
    },
  ]);
</script>

<div class="@container/main flex flex-1 flex-col gap-2 p-4 md:p-6">
  <div class="flex flex-col gap-4 md:gap-6">
    <AdminDashboardHeader
      breadcrumbs={[{ label: "Dashboard", href: `/${shop.slug}/admin` }, { label: "Analytics" }]}
    />

    <!-- Page Title & Description -->
    <div>
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p class="text-muted-foreground text-sm">Track sales trends, revenue, and key metrics</p>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {#each kpiCards() as card (card.title)}
        <StatsCard
          title={card.title}
          value={card.value}
          description={card.description}
          icon={card.icon}
          iconBgClass={card.iconBgClass}
          iconTextClass={card.iconTextClass}
          borderClass={card.borderClass}
          price={card.title === "Today's Sales" ? stats.todaySales : undefined}
          country={shop.country}
          priceClass="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
        />
      {/each}
    </div>

    <!-- Recent Activity Placeholder -->
    <div>
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
