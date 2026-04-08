<script lang="ts">
  import type { CountryCode } from "@repo/config";
  import type { MovementType } from "@repo/db";

  import Pricing from "$lib/components/Pricing.svelte";

  type Props = {
    movementType: MovementType;
    unitCostCents: number | null;
    unitPriceCents: number | null;
    country: CountryCode | null;
  };

  const { movementType, unitCostCents, unitPriceCents, country }: Props = $props();

  const cents = $derived(
    movementType === "SALE" || movementType === "RETURN" ? unitPriceCents : unitCostCents
  );
</script>

{#if cents !== null}
  <span class="font-medium">
    <Pricing {cents} {country} />
  </span>
{/if}
