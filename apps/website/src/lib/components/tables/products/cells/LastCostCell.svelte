<script lang="ts">
  import type { CurrencyCode } from "@repo/config";

  import { formatPrice } from "$lib/utils";

  type Props = {
    lastCostCents: number | null;
    priceCents: number;
    currency: CurrencyCode;
  };

  const { lastCostCents, priceCents, currency }: Props = $props();

  const marginPercent = $derived(
    lastCostCents && lastCostCents > 0
      ? Math.round(((priceCents - lastCostCents) / lastCostCents) * 100)
      : null,
  );

  const marginClass = $derived(
    marginPercent != null
      ? marginPercent > 0
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        : marginPercent === 0
          ? "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      : "",
  );
</script>

{#if lastCostCents != null}
  <div class="flex items-center gap-1.5">
    <span class="text-muted-foreground text-sm">{formatPrice(lastCostCents, currency)}</span>
    {#if marginPercent != null}
      <span
        class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {marginClass}"
      >
        {marginPercent > 0 ? "+" : ""}{marginPercent}%
      </span>
    {/if}
  </div>
{:else}
  <span class="text-muted-foreground">—</span>
{/if}
