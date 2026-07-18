<script lang="ts">
  import { localizePath } from "$lib/localize-path";
  import * as msg from "$lib/paraglide/messages";
  import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
  import BanknoteIcon from "@lucide/svelte/icons/banknote";
  import DollarSignIcon from "@lucide/svelte/icons/dollar-sign";
  import PackageIcon from "@lucide/svelte/icons/package";
  import ScanBarcodeIcon from "@lucide/svelte/icons/scan-barcode";
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
  import TrendingDownIcon from "@lucide/svelte/icons/trending-down";
  import TrendingUpIcon from "@lucide/svelte/icons/trending-up";
  import { buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as Chart from "@repo/ui/chart";
  import { Separator } from "@repo/ui/separator";
  import { Skeleton } from "@repo/ui/skeleton";
  import { ToggleGroup, ToggleGroupItem } from "@repo/ui/toggle-group";
  import { createQuery } from "@tanstack/svelte-query";
  import { scaleTime } from "d3-scale";
  import { curveMonotoneX } from "d3-shape";
  import { Area, AreaChart, ChartClipPath } from "layerchart";
  import { cubicInOut } from "svelte/easing";

  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";
  import { formatPrice } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { data: shop }: PageProps = $props();

  let trendDays = $state(7);

  function formatTrendDate(dateInput: Date | string): string {
    const d = typeof dateInput === "string" ? new Date(dateInput + "T00:00:00Z") : dateInput;
    // The date key is already a store-tz day (backend bucketed it). Render it
    // faithfully in UTC so the label matches regardless of the browser tz.
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
  }

  const statsQuery = createQuery(() =>
    orpc.dashboard.stats.queryOptions({
      input: {},
      enabled: true,
    }),
  );

  const revenueTrendQuery = createQuery(() =>
    orpc.dashboard.revenueTrend.queryOptions({
      input: { days: trendDays },
      enabled: true,
    }),
  );

  const chartYDomain = $derived.by(() => {
    if (!revenueTrendQuery.data) return [0, null] as [number, number | null];
    const maxVal = Math.max(
      ...revenueTrendQuery.data.days.map((d) => Math.max(d.revenueCents, d.costCents)),
    );
    return [0, maxVal] as [number, number | null];
  });

  const isLoading = $derived(statsQuery.isLoading || revenueTrendQuery.isLoading);

  const revenueChartConfig = {
    revenue: { label: msg.ui_revenue(), color: "var(--chart-1)" },
    cost: { label: msg.ui_cost(), color: "var(--chart-3)" },
  } satisfies Chart.ChartConfig;

  function formatNumber(n: number): string {
    return n.toLocaleString();
  }
</script>

<div class="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
  <AdminDashboardHeader breadcrumbs={[{ label: msg.ui_dashboard() }]} />

  <div class="flex flex-col gap-6">
    <!-- KPI Cards -->
    <div
      class="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 xl:grid xl:grid-cols-4 xl:overflow-x-visible"
    >
      {#if isLoading}
        {#each { length: 4 } as _}
          <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
            <Card.Root class="h-[170px]">
              <Card.Header class="flex flex-row items-center justify-between space-y-0">
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
        <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
          <Card.Root>
            <Card.Header class="flex flex-row items-center justify-between space-y-0">
              <Card.Title class="text-sm font-medium">{msg.ui_revenue_today()}</Card.Title>
              <div class="bg-primary/10 rounded-md p-2">
                <DollarSignIcon class="text-primary size-5" />
              </div>
            </Card.Header>
            <Card.Content>
              <div class="text-2xl font-bold">
                {formatPrice(statsQuery.data.revenue.today.totalCents, shop.currency)}
              </div>
              <p class="text-muted-foreground text-xs">
                {formatNumber(statsQuery.data.revenue.today.count)} orders
              </p>
            </Card.Content>
          </Card.Root>
        </div>

        <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
          <Card.Root>
            <Card.Header class="flex flex-row items-center justify-between space-y-0">
              <Card.Title class="text-sm font-medium">{msg.ui_this_month()}</Card.Title>
              <div class="bg-primary/10 rounded-md p-2">
                <BanknoteIcon class="text-primary size-5" />
              </div>
            </Card.Header>
            <Card.Content>
              <div class="text-2xl font-bold">
                {formatPrice(statsQuery.data.revenue.thisMonth.totalCents, shop.currency)}
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

        <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
          <Card.Root>
            <Card.Header class="flex flex-row items-center justify-between space-y-0">
              <Card.Title class="text-sm font-medium">{msg.ui_gross_profit_today()}</Card.Title>
              <div class="rounded-md bg-emerald-500/10 p-2">
                <TrendingUpIcon class="size-5 text-emerald-600" />
              </div>
            </Card.Header>
            <Card.Content>
              <div class="text-2xl font-bold">
                {formatPrice(statsQuery.data.grossProfit.todayCents, shop.currency)}
              </div>
              <p class="text-muted-foreground text-xs">
                Month: {formatPrice(statsQuery.data.grossProfit.thisMonthCents, shop.currency)}
              </p>
            </Card.Content>
          </Card.Root>
        </div>

        <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
          <Card.Root>
            <Card.Header class="flex flex-row items-center justify-between space-y-0">
              <Card.Title class="text-sm font-medium">{msg.ui_inventory_value()}</Card.Title>
              <div class="bg-primary/10 rounded-md p-2">
                <PackageIcon class="text-primary size-5" />
              </div>
            </Card.Header>
            <Card.Content>
              <div class="text-2xl font-bold">
                {formatPrice(statsQuery.data.products.inventoryValueRetailCents, shop.currency)}
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
          <Card.Title>{msg.ui_revenue_trend()}</Card.Title>
          <Card.Description>{msg.ui_revenue_vs_cost_of_goods_sold()}</Card.Description>
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
          <Chart.Container config={revenueChartConfig} class="aspect-auto h-[250px] w-full">
            <AreaChart
              data={revenueTrendQuery.data.days.map((d) => ({
                ...d,
                date: new Date(d.date + "T00:00:00Z"),
              }))}
              x="date"
              y="revenueCents"
              xScale={scaleTime()}
              yDomain={chartYDomain}
              series={[
                { key: "revenueCents", label: msg.ui_revenue(), color: "var(--chart-1)" },
                { key: "costCents", label: msg.ui_cost(), color: "var(--chart-3)" },
              ]}
              seriesLayout="overlap"
              axis="x"
              tooltipContext
              props={{
                xAxis: {
                  ticks: trendDays === 7 ? 7 : undefined,
                  format: (d: Date | string) => formatTrendDate(d),
                },
                yAxis: {
                  format: (d: number) => formatPrice(d, shop.currency),
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
                <Chart.Tooltip labelFormatter={(d: Date | string) => formatTrendDate(d)}>
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
                          {formatPrice(value as number, shop.currency)}
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
    <section class="flex flex-col gap-4">
      <h2 class="text-lg font-semibold tracking-tight">{msg.ui_quick_actions()}</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <!-- Start Selling (primary) -->
        <Card.Root
          class="group relative justify-between overflow-hidden p-6 transition-shadow hover:shadow-md sm:col-span-2 lg:col-span-1"
        >
          <div class="flex flex-col gap-3">
            <div class="bg-primary/10 flex size-11 items-center justify-center rounded-lg">
              <ScanBarcodeIcon class="text-primary size-5" />
            </div>
            <div>
              <h3 class="text-base font-semibold">{msg.ui_start_selling()}</h3>
              <p class="text-muted-foreground text-sm leading-relaxed">
                {msg.ui_process_sales_with_barcode_scanner_or_product_search()}
              </p>
            </div>
          </div>
          <a href={localizePath("/cart")} class={buttonVariants({ class: "w-fit" })}>
            {msg.ui_open_point_of_sale()}
            <ArrowRightIcon class="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <div
            class="from-primary/[0.04] pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity group-hover:opacity-100"
          ></div>
        </Card.Root>

        <!-- Products -->
        <Card.Root class="group justify-between p-6 transition-shadow hover:shadow-md">
          <div class="flex flex-col gap-3">
            <div class="bg-muted flex size-11 items-center justify-center rounded-lg">
              <PackageIcon class="text-muted-foreground size-5" />
            </div>
            <div>
              <h3 class="text-base font-semibold">{msg.ui_products()}</h3>
              <p class="text-muted-foreground text-sm leading-relaxed">
                {msg.ui_manage_stock_levels_pricing_and_categories_across_your_()}
              </p>
            </div>
          </div>
          <a
            href={localizePath("/products")}
            class={buttonVariants({ variant: "outline", class: "w-fit" })}
          >
            {msg.ui_manage()}
            <ArrowRightIcon class="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </Card.Root>

        <!-- Orders -->
        <Card.Root class="group justify-between p-6 transition-shadow hover:shadow-md">
          <div class="flex flex-col gap-3">
            <div class="bg-muted flex size-11 items-center justify-center rounded-lg">
              <ShoppingCartIcon class="text-muted-foreground size-5" />
            </div>
            <div>
              <h3 class="text-base font-semibold">{msg.ui_orders()}</h3>
              <p class="text-muted-foreground text-sm leading-relaxed">
                {msg.ui_review_completed_sales_check_order_details_and_reprint_()}
              </p>
            </div>
          </div>
          <a
            href={localizePath("/orders")}
            class={buttonVariants({ variant: "outline", class: "w-fit" })}
          >
            {msg.ui_view()}
            <ArrowRightIcon class="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </Card.Root>
      </div>
    </section>
  </div>
</div>
