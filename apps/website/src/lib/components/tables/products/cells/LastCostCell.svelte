<script lang="ts">
  import type { CountryCode } from "@repo/config";
  import { Badge } from "@repo/ui/badge";

  import { formatPrice } from "$lib/utils";

  type Props = {
    lastCostCents: number | null;
    priceCents: number;
    country: CountryCode | null;
  };

  const { lastCostCents, priceCents, country }: Props = $props();

  const marginPercent = $derived(
    lastCostCents && lastCostCents > 0
      ? Math.round(((priceCents - lastCostCents) / lastCostCents) * 100)
      : null
  );
</script>

{#if lastCostCents != null}
  <div class="flex items-center gap-1.5">
    <span class="text-muted-foreground text-sm">{formatPrice(lastCostCents, country)}</span>
    {#if marginPercent != null}
      <Badge
        variant="outline"
        class={marginPercent > 0
          ? "border-emerald-200 bg-emerald-500/10 text-emerald-600"
          : "border-red-200 bg-red-500/10 text-red-600"}
      >
        {marginPercent > 0 ? "+" : ""}{marginPercent}%
      </Badge>
    {/if}
  </div>
{:else}
  <span class="text-muted-foreground">—</span>
{/if}
