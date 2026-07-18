<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
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
  <h2 class="text-2xl font-bold">{msg.ui_performance_metrics()}</h2>
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
          title={msg.ui_units_sold()}
          value={stats.sales.totalUnitsSold}
          description={msg.ui_total_units_sold()}
          icon={PackageIcon}
          iconBgClass="bg-primary/10"
          iconTextClass="text-primary"
        />
      </div>
      <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
        <StatsCard
          title={msg.ui_total_revenue()}
          price={stats.sales.totalRevenueCents}
          {currency}
          description={msg.ui_total_revenue_generated()}
          icon={DollarSignIcon}
          iconBgClass="bg-emerald-500/10"
          iconTextClass="text-emerald-600"
        />
      </div>
      <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
        <StatsCard
          title={msg.ui_average_margin()}
          value={`${stats.profit.averageMarginPercent}%`}
          description={msg.ui_profit_margin()}
          icon={TrendingUpIcon}
          iconBgClass="bg-blue-500/10"
          iconTextClass="text-blue-600"
        />
      </div>
      <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
        <StatsCard
          title={msg.ui_total_movements()}
          value={stats.movements.total}
          description={msg.ui_inventory_movements_8e37e5b()}
          icon={ArrowUpDownIcon}
          iconBgClass="bg-amber-500/10"
          iconTextClass="text-amber-600"
        />
      </div>
      <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
        <StatsCard
          title={msg.ui_estimated_profit()}
          price={stats.profit.estimatedProfitCents}
          {currency}
          description={msg.ui_estimated_profit_f8a38c2()}
          icon={DollarSignIcon}
          iconBgClass="bg-purple-500/10"
          iconTextClass="text-purple-600"
        />
      </div>
      <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
        <StatsCard
          title={msg.ui_units_bought()}
          value={stats.purchases.totalUnitsPurchased}
          description={msg.ui_total_purchased()}
          icon={TruckIcon}
          iconBgClass="bg-cyan-500/10"
          iconTextClass="text-cyan-600"
        />
      </div>
    </div>
  {/if}
</section>
