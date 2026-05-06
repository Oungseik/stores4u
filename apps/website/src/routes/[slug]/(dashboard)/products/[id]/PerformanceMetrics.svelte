<script lang="ts">
  import ArrowUpDownIcon from "@lucide/svelte/icons/arrow-up-down";
  import DollarSignIcon from "@lucide/svelte/icons/dollar-sign";
  import PackageIcon from "@lucide/svelte/icons/package";
  import TrendingUpIcon from "@lucide/svelte/icons/trending-up";
  import TruckIcon from "@lucide/svelte/icons/truck";
  import { type CurrencyCode } from "@repo/config";
  import * as Card from "@repo/ui/card";
  import { Skeleton } from "@repo/ui/skeleton";

  import StatsCard from "$lib/components/cards/StatsCard.svelte";

  interface ProductStats {
    sales: {
      totalUnitsSold: number;
      totalRevenueCents: number;
    };
    purchases: {
      totalUnitsPurchased: number;
    };
    profit: {
      averageMarginPercent: number;
      estimatedProfitCents: number;
    };
    movements: {
      total: number;
    };
  }

  interface Props {
    isLoading: boolean;
    stats: ProductStats | undefined;
    currency: CurrencyCode;
  }

  let { isLoading, stats, currency }: Props = $props();
</script>

<section class="space-y-6">
  <h2 class="text-2xl font-bold">Performance Metrics</h2>
  {#if isLoading}
    <div
      class="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 xl:grid xl:grid-cols-3 xl:overflow-x-visible"
    >
      {#each { length: 6 } as _}
        <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
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
    </div>
  {:else if stats}
    <div
      class="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 xl:grid xl:grid-cols-3 xl:overflow-x-visible"
    >
      <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
        <StatsCard
          title="Units Sold"
          value={stats.sales.totalUnitsSold}
          description="Total units sold"
          icon={PackageIcon}
          iconBgClass="bg-primary/10"
          iconTextClass="text-primary"
        />
      </div>
      <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
        <StatsCard
          title="Total Revenue"
          price={stats.sales.totalRevenueCents}
          {currency}
          description="Total revenue generated"
          icon={DollarSignIcon}
          iconBgClass="bg-emerald-500/10"
          iconTextClass="text-emerald-600"
        />
      </div>
      <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
        <StatsCard
          title="Average Margin"
          value={`${stats.profit.averageMarginPercent}%`}
          description="Profit margin"
          icon={TrendingUpIcon}
          iconBgClass="bg-blue-500/10"
          iconTextClass="text-blue-600"
        />
      </div>
      <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
        <StatsCard
          title="Total Movements"
          value={stats.movements.total}
          description="Inventory movements"
          icon={ArrowUpDownIcon}
          iconBgClass="bg-amber-500/10"
          iconTextClass="text-amber-600"
        />
      </div>
      <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
        <StatsCard
          title="Estimated Profit"
          price={stats.profit.estimatedProfitCents}
          {currency}
          description="Estimated profit"
          icon={DollarSignIcon}
          iconBgClass="bg-purple-500/10"
          iconTextClass="text-purple-600"
        />
      </div>
      <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
        <StatsCard
          title="Units Bought"
          value={stats.purchases.totalUnitsPurchased}
          description="Total purchased"
          icon={TruckIcon}
          iconBgClass="bg-cyan-500/10"
          iconTextClass="text-cyan-600"
        />
      </div>
    </div>
  {/if}
</section>
