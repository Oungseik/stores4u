<script lang="ts">
  import type { CountryCode } from "@repo/config";
  import type { MovementType } from "@repo/perstore-db";

  import { formatPrice } from "$lib/utils";

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
    {formatPrice(cents, country)}
  </span>
{/if}
