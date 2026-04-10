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
  import { curveMonotoneX } from "d3-shape";
  import { Area, AreaChart, ChartClipPath } from "layerchart";
  import { cubicInOut } from "svelte/easing";

  import Pricing from "$lib/components/Pricing.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();

  let trendDays = $state(7);

  function formatTrendDate(dateStr: string): string {
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
      input: { slug: params.slug, days: trendDays },
      enabled: !!params.slug,
    })
  );

  const isLoading = $derived(statsQuery.isLoading || revenueTrendQuery.isLoading);

  const revenueChartConfig = {
    revenue: { label: "Revenue", color: "var(--chart-1)" },
    cost: { label: "Cost", color: "var(--chart-3)" },
  } satisfies Chart.ChartConfig;

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
</script>

<div class="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
  <div class="flex flex-col gap-6">
    <AdminDashboardHeader breadcrumbs={[{ label: "Dashboard" }]} />

    <!-- KPI Cards -->
    <div
      class="flex snap-x gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4"
    >
      {#if isLoading}
        {#each { length: 4 } as _}
          <div class="min-w-[280px] flex-shrink-0 snap-center sm:min-w-0">
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
          </div>
        {/each}
      {:else if statsQuery.data}
        <div class="min-w-[280px] flex-shrink-0 snap-center sm:min-w-0">
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
        </div>

        <div class="min-w-[280px] flex-shrink-0 snap-center sm:min-w-0">
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
        </div>

        <div class="min-w-[280px] flex-shrink-0 snap-center sm:min-w-0">
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
        </div>

        <div class="min-w-[280px] flex-shrink-0 snap-center sm:min-w-0">
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
        </div>
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
          value={String(trendDays)}
          onValueChange={(v) => {
            if (v) trendDays = parseInt(v);
          }}
        >
          <ToggleGroupItem value="7">7D</ToggleGroupItem>
          <ToggleGroupItem value="30">30D</ToggleGroupItem>
        </ToggleGroup>
      </Card.Header>
      <Card.Content>
        {#if revenueTrendQuery.isLoading}
          <Skeleton class="aspect-[32/9] w-full" />
        {:else if revenueTrendQuery.data}
          <Chart.Container config={revenueChartConfig} class="!aspect-[32/9] w-full">
            <AreaChart
              data={revenueTrendQuery.data.days}
              x="date"
              y="revenueCents"
              yDomain={[0, null]}
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
              {#snippet marks({ context })}
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stop-color="var(--chart-1)" stop-opacity={1.0} />
                    <stop offset="95%" stop-color="var(--chart-1)" stop-opacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stop-color="var(--chart-3)" stop-opacity={0.8} />
                    <stop offset="95%" stop-color="var(--chart-3)" stop-opacity={0.1} />
                  </linearGradient>
                </defs>
                <ChartClipPath
                  initialWidth={0}
                  motion={{
                    width: { type: "tween", duration: 1000, easing: cubicInOut },
                  }}
                >
                  {#each context.series.visibleSeries as s (s.key)}
                    <Area
                      seriesKey={s.key}
                      curve={curveMonotoneX}
                      fillOpacity={0.4}
                      line={{ class: "stroke-1" }}
                      motion="tween"
                      {...s.props}
                      fill={s.key === "revenueCents" ? "url(#fillRevenue)" : "url(#fillCost)"}
                    />
                  {/each}
                </ChartClipPath>
              {/snippet}
              {#snippet tooltip()}
                <Chart.Tooltip labelFormatter={(d: string) => formatTrendDate(d)}>
                  {#snippet formatter({ value, name, item })}
                    <div
                      style="--color-bg: {item.color}; --color-border: {item.color};"
                      class="flex w-full items-center gap-2"
                    >
                      <div
                        class="size-2.5 shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)"
                      ></div>
                      <div class="flex flex-1 justify-between leading-none">
                        <span class="text-muted-foreground">{name}</span>
                        <span class="text-foreground font-mono font-medium tabular-nums">
                          {formatCents(value as number)}
                        </span>
                      </div>
                    </div>
                  {/snippet}
                </Chart.Tooltip>
              {/snippet}
            </AreaChart>
          </Chart.Container>
        {/if}
      </Card.Content>
    </Card.Root>

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
