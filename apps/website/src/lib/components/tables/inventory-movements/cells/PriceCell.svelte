<script lang="ts">
  import type { CurrencyCode } from "@repo/config";
  import type { MovementType } from "@repo/perstore-db";

  import { formatPrice } from "$lib/utils";

  type Props = {
    movementType: MovementType;
    unitCostCents: number | null;
    unitPriceCents: number | null;
    currency: CurrencyCode;
  };

  const { movementType, unitCostCents, unitPriceCents, currency }: Props = $props();

  const cents = $derived(
    movementType === "SALE" || movementType === "RETURN" ? unitPriceCents : unitCostCents
  );
</script>

{#if cents !== null}
  <span class="font-medium">
    {formatPrice(cents, currency)}
  </span>
{/if}
