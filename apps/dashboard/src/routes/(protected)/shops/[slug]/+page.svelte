<script lang="ts">
  import BanknoteIcon from "@lucide/svelte/icons/banknote";
  import DollarSignIcon from "@lucide/svelte/icons/dollar-sign";
  import PackageIcon from "@lucide/svelte/icons/package";
  import TrendingDownIcon from "@lucide/svelte/icons/trending-down";
  import TrendingUpIcon from "@lucide/svelte/icons/trending-up";
  import * as Card from "@repo/ui/card";
  import * as Chart from "@repo/ui/chart";
  import { Skeleton } from "@repo/ui/skeleton";
  import { ToggleGroup, ToggleGroupItem } from "@repo/ui/toggle-group";
  import { curveMonotoneX } from "d3-shape";
  import { Area, AreaChart, ChartClipPath } from "layerchart";

  import DashboardHeader from "$lib/components/dashboard-header.svelte";
  import { getRevenueTrend } from "$lib/remote/dashboard/get_revenue_trend.remote";
  import { getStats } from "$lib/remote/dashboard/get_stats.remote";
  import { formatPrice } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { params, data }: PageProps = $props();

  const country = $derived(data.organization.shopInfo?.country);

  let trendDays = $state(7);

  const statsQuery = $derived(getStats({ slug: params.slug }));
  const revenueTrendQuery = $derived(getRevenueTrend({ slug: params.slug, days: trendDays }));

  const chartYDomain = $derived.by(() => {
    if (!revenueTrendQuery.ready) return [0, null] as [number, number | null];
    const maxVal = Math.max(
      ...revenueTrendQuery.current.days.map((d) => Math.max(d.revenueCents, d.costCents))
    );
    return [0, maxVal] as [number, number | null];
  });

  const revenueChartConfig = {
    revenue: { label: "Revenue", color: "var(--chart-1)" },
    cost: { label: "Cost", color: "var(--chart-3)" },
  } satisfies Chart.ChartConfig;

  function formatTrendDate(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function formatNumber(n: number): string {
    return n.toLocaleString();
  }
</script>

<div class="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
  <div class="flex flex-col gap-6">
    <DashboardHeader
      breadcrumbs={[{ label: "Shops", href: "/shops" }, { label: data.organization.name }]}
    />

    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p class="text-sm text-muted-foreground">Overview of your store performance</p>
    </div>

    {#if !statsQuery.ready}
      <div
        class="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 xl:grid xl:grid-cols-4 xl:overflow-x-visible"
      >
        {#each { length: 4 } as _}
          <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
            <Card.Root class="h-[170px]">
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
      </div>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between">
          <div>
            <Skeleton class="h-5 w-32" />
            <Skeleton class="mt-1.5 h-4 w-48" />
          </div>
          <div class="flex gap-1">
            <Skeleton class="h-8 w-10" />
            <Skeleton class="h-8 w-10" />
          </div>
        </Card.Header>
        <Card.Content>
          <Skeleton class="aspect-[32/9] w-full" />
        </Card.Content>
      </Card.Root>
    {:else if statsQuery.error}
      <div class="flex min-h-[50vh] items-center justify-center">
        <div class="flex flex-col items-center gap-3 text-center">
          <p class="text-lg font-medium">Something went wrong</p>
          <p class="text-sm text-muted-foreground">Failed to load dashboard data</p>
          <button
            class="text-sm text-primary underline underline-offset-4"
            onclick={() => statsQuery.refresh()}
          >
            Try again
          </button>
        </div>
      </div>
    {:else}
      <!-- KPI Cards Section -->
      <div
        class="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 xl:grid xl:grid-cols-4 xl:overflow-x-visible"
      >
        <!-- Card 1: Revenue Today -->
        <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
          <Card.Root>
            <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
              <Card.Title class="text-sm font-medium">Revenue Today</Card.Title>
              <div class="rounded-md bg-primary/10 p-2">
                <DollarSignIcon class="size-5 text-primary" />
              </div>
            </Card.Header>
            <Card.Content>
              <div class="text-2xl font-bold">
                {formatPrice(statsQuery.current.revenue.today.totalCents, country)}
              </div>
              <p class="text-xs text-muted-foreground">
                {formatNumber(statsQuery.current.revenue.today.count)} orders
              </p>
            </Card.Content>
          </Card.Root>
        </div>

        <!-- Card 2: This Month -->
        <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
          <Card.Root>
            <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
              <Card.Title class="text-sm font-medium">This Month</Card.Title>
              <div class="rounded-md bg-primary/10 p-2">
                <BanknoteIcon class="size-5 text-primary" />
              </div>
            </Card.Header>
            <Card.Content>
              <div class="text-2xl font-bold">
                {formatPrice(statsQuery.current.revenue.thisMonth.totalCents, country)}
              </div>
              <div class="flex items-center gap-1 text-xs text-muted-foreground">
                {#if statsQuery.current.revenue.vsLastWeek >= 0}
                  <TrendingUpIcon class="size-3 text-emerald-600" />
                  <span class="text-emerald-600">+{statsQuery.current.revenue.vsLastWeek}%</span>
                {:else}
                  <TrendingDownIcon class="size-3 text-red-600" />
                  <span class="text-red-600">{statsQuery.current.revenue.vsLastWeek}%</span>
                {/if}
                vs last week
              </div>
            </Card.Content>
          </Card.Root>
        </div>

        <!-- Card 3: Gross Profit Today -->
        <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
          <Card.Root>
            <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
              <Card.Title class="text-sm font-medium">Gross Profit Today</Card.Title>
              <div class="rounded-md bg-emerald-500/10 p-2">
                <TrendingUpIcon class="size-5 text-emerald-600" />
              </div>
            </Card.Header>
            <Card.Content>
              <div class="text-2xl font-bold">
                {formatPrice(statsQuery.current.grossProfit.todayCents, country)}
              </div>
              <p class="text-xs text-muted-foreground">
                Month: {formatPrice(statsQuery.current.grossProfit.thisMonthCents, country)}
              </p>
            </Card.Content>
          </Card.Root>
        </div>

        <!-- Card 4: Inventory Value -->
        <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
          <Card.Root>
            <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
              <Card.Title class="text-sm font-medium">Inventory Value</Card.Title>
              <div class="rounded-md bg-primary/10 p-2">
                <PackageIcon class="size-5 text-primary" />
              </div>
            </Card.Header>
            <Card.Content>
              <div class="text-2xl font-bold">
                {formatPrice(statsQuery.current.products.inventoryValueRetailCents, country)}
              </div>
              <p class="text-xs text-muted-foreground">
                {statsQuery.current.products.total} products
                {#if statsQuery.current.products.outOfStock > 0}
                  <span class="text-destructive">
                    &middot; {statsQuery.current.products.outOfStock} out of stock
                  </span>
                {/if}
              </p>
            </Card.Content>
          </Card.Root>
        </div>
      </div>

      <!-- Revenue Trend Chart -->
      <svelte:boundary>
        {#snippet failed(_error, reset)}
          <Card.Root>
            <Card.Content class="flex aspect-[32/9] items-center justify-center">
              <div class="flex flex-col items-center gap-2 text-center">
                <p class="text-sm text-muted-foreground">Chart failed to render</p>
                <button class="text-sm text-primary underline underline-offset-4" onclick={reset}>
                  Try again
                </button>
              </div>
            </Card.Content>
          </Card.Root>
        {/snippet}

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
                if (v) {
                  trendDays = parseInt(v);
                }
              }}
            >
              <ToggleGroupItem value="7">7D</ToggleGroupItem>
              <ToggleGroupItem value="30">30D</ToggleGroupItem>
            </ToggleGroup>
          </Card.Header>
          <Card.Content>
            {#if !revenueTrendQuery.ready}
              <Skeleton class="aspect-[32/9] w-full" />
            {:else}
              <Chart.Container
                config={revenueChartConfig}
                class="!aspect-[32/9] w-full overflow-hidden"
              >
                <AreaChart
                  data={revenueTrendQuery.current.days}
                  x="date"
                  y="revenueCents"
                  yDomain={chartYDomain}
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
                      format: (d: number) => formatPrice(d, country),
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
                    <ChartClipPath>
                      {#each context.series.visibleSeries as s (s.key)}
                        <Area
                          seriesKey={s.key}
                          curve={curveMonotoneX}
                          fillOpacity={0.4}
                          line={{ class: "stroke-1" }}
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
                            <span class="font-mono font-medium text-foreground tabular-nums">
                              {formatPrice(value as number, country)}
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
      </svelte:boundary>
    {/if}
  </div>
</div>
