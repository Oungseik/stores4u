<script lang="ts">
  import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
  import BanknoteIcon from "@lucide/svelte/icons/banknote";
  import BotIcon from "@lucide/svelte/icons/bot";
  import DollarSignIcon from "@lucide/svelte/icons/dollar-sign";
  import PackageIcon from "@lucide/svelte/icons/package";
  import ScanBarcodeIcon from "@lucide/svelte/icons/scan-barcode";
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
  import TrendingDownIcon from "@lucide/svelte/icons/trending-down";
  import TrendingUpIcon from "@lucide/svelte/icons/trending-up";
  import * as Card from "@repo/ui/card";
  import * as Chart from "@repo/ui/chart";
  import { Separator } from "@repo/ui/separator";
  import { Skeleton } from "@repo/ui/skeleton";
  import { ToggleGroup, ToggleGroupItem } from "@repo/ui/toggle-group";
  import { createQuery } from "@tanstack/svelte-query";
  import { AreaChart, BarChart, PieChart } from "layerchart";

  import Pricing from "$lib/components/Pricing.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();

  type TrendPeriod = { days: number; months?: never } | { days?: never; months: number };

  let trendPeriod = $state<TrendPeriod>({ days: 7 });

  const trendToggleValue = $derived(
    "days" in trendPeriod && trendPeriod.days !== undefined
      ? String(trendPeriod.days)
      : "months" in trendPeriod
        ? String(trendPeriod.months) + "M"
        : "7"
  );

  function onTrendChange(v: string) {
    if (v.endsWith("M")) {
      trendPeriod = { months: parseInt(v) };
    } else {
      trendPeriod = { days: parseInt(v) };
    }
  }

  function formatTrendDate(dateStr: string): string {
    if (dateStr.length === 7) {
      const d = new Date(dateStr + "-01T00:00:00");
      return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
    }
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  const statsQuery = createQuery(() =>
    orpc.dashboard.stats.queryOptions({
      input: { slug: params.slug },
      enabled: !!params.slug,
    })
  );

  const revenueTrendQuery = createQuery(() =>
    orpc.dashboard.revenueTrend.queryOptions({
      input: { slug: params.slug, ...trendPeriod },
      enabled: !!params.slug,
    })
  );

  const topProductsQuery = createQuery(() =>
    orpc.dashboard.topProducts.queryOptions({
      input: { slug: params.slug, period: "week", limit: 8 },
      enabled: !!params.slug,
    })
  );

  const categoryQuery = createQuery(() =>
    orpc.dashboard.categoryBreakdown.queryOptions({
      input: { slug: params.slug },
      enabled: !!params.slug,
    })
  );

  const inventoryQuery = createQuery(() =>
    orpc.dashboard.inventorySummary.queryOptions({
      input: { slug: params.slug, period: "month" },
      enabled: !!params.slug,
    })
  );

  const customerQuery = createQuery(() =>
    orpc.dashboard.customerInsights.queryOptions({
      input: { slug: params.slug, topLimit: 5 },
      enabled: !!params.slug,
    })
  );

  const isLoading = $derived(
    statsQuery.isLoading ||
      revenueTrendQuery.isLoading ||
      topProductsQuery.isLoading ||
      categoryQuery.isLoading ||
      inventoryQuery.isLoading ||
      customerQuery.isLoading
  );

  const revenueChartConfig = {
    revenue: { label: "Revenue", color: "var(--chart-1)" },
    cost: { label: "Cost", color: "var(--chart-3)" },
  } satisfies Chart.ChartConfig;

  const topProductsChartConfig = {
    revenue: { label: "Revenue", color: "var(--chart-1)" },
  } satisfies Chart.ChartConfig;

  const categoryChartConfig = {
    revenue: { label: "Revenue", color: "var(--chart-1)" },
  } satisfies Chart.ChartConfig;

  const categoryColors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  function formatCents(cents: number): string {
    if (!shop?.country) return (cents / 100).toFixed(2);
    const code = shop.country;
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(cents / 100);
    } catch {
      return (cents / 100).toFixed(2);
    }
  }

  function formatNumber(n: number): string {
    return n.toLocaleString();
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function formatMovementType(type: string): string {
    const map: Record<string, string> = {
      PURCHASE: "Purchase",
      SALE: "Sale",
      RETURN: "Return",
      WASTAGE: "Wastage",
      ADJUSTMENT: "Adjustment",
      CORRECTION: "Correction",
    };
    return map[type] ?? type;
  }

  const categoryChartData = $derived(
    (categoryQuery.data?.categories ?? []).map((c, i) => ({
      name: c.name,
      value: c.revenueCents,
      fill: categoryColors[i % categoryColors.length],
    }))
  );

  const categoryConfig = $derived.by(() => {
    const cfg: Record<string, { label: string; color: string }> = {};
    for (const [i, cat] of (categoryQuery.data?.categories ?? []).entries()) {
      cfg[cat.name] = {
        label: cat.name,
        color: categoryColors[i % categoryColors.length],
      };
    }
    return cfg satisfies Chart.ChartConfig;
  });
</script>

<div class="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
  <div class="flex flex-col gap-6">
    <AdminDashboardHeader breadcrumbs={[{ label: "Dashboard" }]} />

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 gap-4 @lg/main:grid-cols-2 @xl/main:grid-cols-4">
      {#if isLoading}
        {#each { length: 4 } as _}
          <Card.Root>
            <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton class="h-4 w-24" />
              <Skeleton class="size-8 rounded-md" />
            </Card.Header>
            <Card.Content class="flex flex-col gap-2">
              <Skeleton class="h-7 w-28" />
              <Skeleton class="h-3 w-20" />
            </Card.Content>
          </Card.Root>
        {/each}
      {:else if statsQuery.data}
        <!-- Revenue Today -->
        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
            <Card.Title class="text-sm font-medium">Revenue Today</Card.Title>
            <div class="bg-primary/10 rounded-md p-2">
              <DollarSignIcon class="text-primary size-5" />
            </div>
          </Card.Header>
          <Card.Content>
            <div class="text-2xl font-bold">
              <Pricing cents={statsQuery.data.revenue.today.totalCents} country={shop.country} />
            </div>
            <p class="text-muted-foreground text-xs">
              {formatNumber(statsQuery.data.revenue.today.count)} orders
            </p>
          </Card.Content>
        </Card.Root>

        <!-- This Month -->
        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
            <Card.Title class="text-sm font-medium">This Month</Card.Title>
            <div class="bg-primary/10 rounded-md p-2">
              <BanknoteIcon class="text-primary size-5" />
            </div>
          </Card.Header>
          <Card.Content>
            <div class="text-2xl font-bold">
              <Pricing
                cents={statsQuery.data.revenue.thisMonth.totalCents}
                country={shop.country}
              />
            </div>
            <div class="text-muted-foreground flex items-center gap-1 text-xs">
              {#if statsQuery.data.revenue.vsLastWeek >= 0}
                <TrendingUpIcon class="size-3 text-emerald-600" />
                <span class="text-emerald-600">+{statsQuery.data.revenue.vsLastWeek}%</span>
              {:else}
                <TrendingDownIcon class="size-3 text-red-600" />
                <span class="text-red-600">{statsQuery.data.revenue.vsLastWeek}%</span>
              {/if}
              vs last week
            </div>
          </Card.Content>
        </Card.Root>

        <!-- Gross Profit Today -->
        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
            <Card.Title class="text-sm font-medium">Gross Profit Today</Card.Title>
            <div class="rounded-md bg-emerald-500/10 p-2">
              <TrendingUpIcon class="size-5 text-emerald-600" />
            </div>
          </Card.Header>
          <Card.Content>
            <div class="text-2xl font-bold">
              <Pricing cents={statsQuery.data.grossProfit.todayCents} country={shop.country} />
            </div>
            <p class="text-muted-foreground text-xs">
              Month: <Pricing
                cents={statsQuery.data.grossProfit.thisMonthCents}
                country={shop.country}
              />
            </p>
          </Card.Content>
        </Card.Root>

        <!-- Inventory Value -->
        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
            <Card.Title class="text-sm font-medium">Inventory Value</Card.Title>
            <div class="bg-primary/10 rounded-md p-2">
              <PackageIcon class="text-primary size-5" />
            </div>
          </Card.Header>
          <Card.Content>
            <div class="text-2xl font-bold">
              <Pricing
                cents={statsQuery.data.products.inventoryValueRetailCents}
                country={shop.country}
              />
            </div>
            <p class="text-muted-foreground text-xs">
              {statsQuery.data.products.total} products
              {#if statsQuery.data.products.outOfStock > 0}
                <span class="text-destructive">
                  &middot; {statsQuery.data.products.outOfStock} out of stock
                </span>
              {/if}
            </p>
          </Card.Content>
        </Card.Root>
      {/if}
    </div>

    <!-- Revenue Trend -->
    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between">
        <div>
          <Card.Title>Revenue Trend</Card.Title>
          <Card.Description>Revenue vs cost of goods sold</Card.Description>
        </div>
        <ToggleGroup
          type="single"
          value={trendToggleValue}
          onValueChange={(v) => {
            if (v) onTrendChange(v);
          }}
        >
          <ToggleGroupItem value="7">7D</ToggleGroupItem>
          <ToggleGroupItem value="30">30D</ToggleGroupItem>
          <ToggleGroupItem value="4M">4M</ToggleGroupItem>
          <ToggleGroupItem value="12M">1Y</ToggleGroupItem>
        </ToggleGroup>
      </Card.Header>
      <Card.Content>
        {#if revenueTrendQuery.isLoading}
          <Skeleton class="h-[250px] w-full" />
        {:else if revenueTrendQuery.data}
          <Chart.Container config={revenueChartConfig} class="!aspect-[32/9] min-h-[250px] w-full">
            <AreaChart
              data={revenueTrendQuery.data.days}
              x="date"
              y="revenueCents"
              series={[
                { key: "revenueCents", label: "Revenue", color: "var(--chart-1)" },
                { key: "costCents", label: "Cost", color: "var(--chart-3)" },
              ]}
              seriesLayout="overlap"
              axis="x"
              tooltipContext
              props={{
                xAxis: {
                  format: (d: string) => formatTrendDate(d),
                },
                yAxis: {
                  format: (d: number) => formatCents(d),
                },
              }}
            >
              {#snippet tooltip()}
                <Chart.Tooltip labelFormatter={(d: string) => formatTrendDate(d)} />
              {/snippet}
            </AreaChart>
          </Chart.Container>
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- Top Products + Category Breakdown -->
    <div class="grid grid-cols-1 gap-4 @xl/main:grid-cols-2">
      <!-- Top Products -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Top Products</Card.Title>
          <Card.Description>Best sellers this week by revenue</Card.Description>
        </Card.Header>
        <Card.Content>
          {#if topProductsQuery.isLoading}
            <Skeleton class="h-[250px] w-full" />
          {:else if topProductsQuery.data && topProductsQuery.data.items.length > 0}
            <Chart.Container config={topProductsChartConfig} class="min-h-[250px] w-full">
              <BarChart
                data={topProductsQuery.data.items}
                x="totalRevenueCents"
                y="name"
                orientation="horizontal"
                series={[{ key: "totalRevenueCents", label: "Revenue", color: "var(--chart-1)" }]}
                axis="y"
                tooltipContext
                props={{
                  xAxis: {
                    format: (d: number) => formatCents(d),
                  },
                }}
              >
                {#snippet tooltip()}
                  <Chart.Tooltip hideLabel />
                {/snippet}
              </BarChart>
            </Chart.Container>
          {:else}
            <p class="text-muted-foreground py-8 text-center text-sm">No sales data yet</p>
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Category Breakdown -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Category Breakdown</Card.Title>
          <Card.Description>Revenue by product category</Card.Description>
        </Card.Header>
        <Card.Content>
          {#if categoryQuery.isLoading}
            <Skeleton class="h-[250px] w-full" />
          {:else if categoryChartData.length > 0}
            <Chart.Container config={categoryConfig} class="min-h-[250px] w-full">
              <PieChart
                data={categoryChartData}
                key="name"
                value="value"
                label="name"
                innerRadius={0.55}
                tooltipContext
                legend
              >
                {#snippet tooltip()}
                  <Chart.Tooltip hideLabel />
                {/snippet}
              </PieChart>
            </Chart.Container>
          {:else}
            <p class="text-muted-foreground py-8 text-center text-sm">No category data yet</p>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Inventory Summary + Customer Insights -->
    <div class="grid grid-cols-1 gap-4 @xl/main:grid-cols-2">
      <!-- Inventory Summary -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Inventory Summary</Card.Title>
          <Card.Description>Wastage, adjustments & recent movements this month</Card.Description>
        </Card.Header>
        <Card.Content>
          {#if inventoryQuery.isLoading}
            <div class="flex flex-col gap-3">
              <Skeleton class="h-12 w-full" />
              <Skeleton class="h-12 w-full" />
              <Skeleton class="h-32 w-full" />
            </div>
          {:else if inventoryQuery.data}
            <div class="mb-4 grid grid-cols-2 gap-4">
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-muted-foreground text-xs font-medium">Wastage</p>
                <p class="text-destructive text-lg font-semibold">
                  <Pricing cents={inventoryQuery.data.wastage.totalCents} country={shop.country} />
                </p>
                <p class="text-muted-foreground text-xs">
                  {inventoryQuery.data.wastage.count} events &middot; {inventoryQuery.data.wastage
                    .totalUnits} units
                </p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-muted-foreground text-xs font-medium">Adjustments</p>
                <p class="text-lg font-semibold">
                  <Pricing
                    cents={inventoryQuery.data.adjustments.totalCents}
                    country={shop.country}
                  />
                </p>
                <p class="text-muted-foreground text-xs">
                  {inventoryQuery.data.adjustments.count} events &middot; {inventoryQuery.data
                    .adjustments.totalUnits} units
                </p>
              </div>
            </div>

            {#if inventoryQuery.data.recentMovements.length > 0}
              <div class="border-border divide-border divide-y overflow-hidden rounded-lg border">
                {#each inventoryQuery.data.recentMovements as movement (movement.id)}
                  <div class="flex items-center justify-between px-3 py-2">
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm">{movement.productName}</p>
                      <p class="text-muted-foreground text-xs">
                        {formatMovementType(movement.movementType)}
                        &middot;
                        {new Date(movement.occurredAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      class={movement.qty >= 0
                        ? "text-sm font-medium text-emerald-600"
                        : "text-destructive text-sm font-medium"}
                    >
                      {movement.qty >= 0 ? "+" : ""}{movement.qty}
                    </span>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="text-muted-foreground text-center text-sm">No recent movements</p>
            {/if}
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Customer Insights -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Customer Insights</Card.Title>
          <Card.Description>Customer behavior and top spenders</Card.Description>
        </Card.Header>
        <Card.Content>
          {#if customerQuery.isLoading}
            <div class="flex flex-col gap-3">
              <Skeleton class="h-12 w-full" />
              <Skeleton class="h-32 w-full" />
            </div>
          {:else if customerQuery.data}
            <div class="mb-4 grid grid-cols-3 gap-4">
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-muted-foreground text-xs font-medium">Unique</p>
                <p class="text-lg font-semibold">
                  {formatNumber(customerQuery.data.totalCustomers)}
                </p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-muted-foreground text-xs font-medium">Returning</p>
                <p class="text-lg font-semibold">
                  {formatNumber(customerQuery.data.returningCustomers)}
                </p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-muted-foreground text-xs font-medium">Avg Order</p>
                <p class="text-lg font-semibold">
                  <Pricing cents={customerQuery.data.avgOrderValueCents} country={shop.country} />
                </p>
              </div>
            </div>

            {#if customerQuery.data.topCustomers.length > 0}
              <p class="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                Top Customers
              </p>
              <div class="border-border divide-border divide-y overflow-hidden rounded-lg border">
                {#each customerQuery.data.topCustomers as customer (customer.phone ?? customer.name ?? customer.totalSpentCents)}
                  <div class="flex items-center justify-between px-3 py-2">
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-medium">
                        {customer.name ?? customer.phone ?? "Unknown"}
                      </p>
                      {#if customer.name && customer.phone}
                        <p class="text-muted-foreground text-xs">{customer.phone}</p>
                      {/if}
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-medium">
                        <Pricing cents={customer.totalSpentCents} country={shop.country} />
                      </p>
                      <p class="text-muted-foreground text-xs">
                        {customer.orderCount} order{customer.orderCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="text-muted-foreground text-center text-sm">No customer data yet</p>
            {/if}
          {/if}
        </Card.Content>
      </Card.Root>
    </div>

    <Separator />

    <!-- Quick Actions -->
    <div>
      <h2 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
        Quick actions
      </h2>
      <div class="grid grid-cols-1 gap-3 @lg/main:grid-cols-2">
        <a
          href={`/${params.slug}/admin/checkout`}
          class="group border-border bg-card relative flex flex-col justify-between overflow-hidden rounded-xl border p-6 transition-all duration-200 hover:shadow-md"
        >
          <div class="relative z-10">
            <div class="bg-primary/10 mb-4 flex size-12 items-center justify-center rounded-lg">
              <ScanBarcodeIcon class="text-primary size-6" />
            </div>
            <h3 class="mb-1 text-xl font-semibold">Start Selling</h3>
            <p class="text-muted-foreground max-w-sm text-sm leading-relaxed">
              Process sales with barcode scanner or product search. Fast checkout for your
              customers.
            </p>
          </div>
          <div class="relative z-10 mt-6">
            <span
              class="bg-primary text-primary-foreground group-hover:bg-primary/90 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all"
            >
              Open Checkout
              <ArrowRightIcon class="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
          <div
            class="from-primary/[0.03] absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity group-hover:opacity-100"
          ></div>
        </a>

        <a
          href={`/${params.slug}/admin/agents`}
          class="group border-border bg-card relative flex flex-col justify-between overflow-hidden rounded-xl border p-6 transition-all duration-200 hover:shadow-md"
        >
          <div class="relative z-10">
            <div class="bg-primary/10 mb-4 flex size-12 items-center justify-center rounded-lg">
              <BotIcon class="text-primary size-6" />
            </div>
            <h3 class="mb-1 text-xl font-semibold">AI Assistants</h3>
            <p class="text-muted-foreground max-w-sm text-sm leading-relaxed">
              Chat with your AI team — process invoices, manage inventory, draft content, and get
              reports.
            </p>
          </div>
          <div class="relative z-10 mt-6">
            <span
              class="bg-primary text-primary-foreground group-hover:bg-primary/90 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all"
            >
              Open Agents
              <ArrowRightIcon class="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
          <div
            class="from-primary/[0.03] absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity group-hover:opacity-100"
          ></div>
        </a>

        <a
          href={`/${params.slug}/admin/products`}
          class="group border-border bg-card flex flex-col rounded-xl border p-5 transition-all duration-200 hover:shadow-sm"
        >
          <div class="bg-muted mb-3 flex size-10 items-center justify-center rounded-lg">
            <PackageIcon class="text-muted-foreground size-5" />
          </div>
          <h3 class="mb-0.5 font-medium">Products</h3>
          <p class="text-muted-foreground text-sm">Browse & manage your inventory</p>
        </a>

        <a
          href={`/${params.slug}/admin/orders`}
          class="group border-border bg-card flex flex-col rounded-xl border p-5 transition-all duration-200 hover:shadow-sm"
        >
          <div class="bg-muted mb-3 flex size-10 items-center justify-center rounded-lg">
            <ShoppingCartIcon class="text-muted-foreground size-5" />
          </div>
          <h3 class="mb-0.5 font-medium">Orders</h3>
          <p class="text-muted-foreground text-sm">View recent transactions</p>
        </a>
      </div>
    </div>
  </div>
</div>
