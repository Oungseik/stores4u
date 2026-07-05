<script lang="ts">
  import PackageIcon from "@lucide/svelte/icons/package";
  import type { CurrencyCode } from "@repo/config";
  import * as Card from "@repo/ui/card";

  import MovementTypeCell from "./cells/MovementTypeCell.svelte";
  import QuantityCell from "./cells/QuantityCell.svelte";
  import type { MovementItem } from "./columns";
  import { formatDate, formatPrice } from "$lib/utils";

  interface Props {
    movement: MovementItem;
    currency: CurrencyCode;
  }

  let { movement, currency }: Props = $props();
</script>

<Card.Root class="overflow-hidden p-0">
  <Card.Content class="p-0">
    <div class="hover:bg-muted/50 flex w-full items-center gap-3 px-3 py-2.5">
      <div class="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
        <PackageIcon class="text-primary size-5" />
      </div>

      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium">{movement.productName}</p>
        <div class="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
          {#if movement.productSku}
            <span>{movement.productSku}</span>
            <span>•</span>
          {/if}
          <MovementTypeCell movementType={movement.movementType} />
          <span>•</span>
          <span>{formatDate(movement.occurredAt, true)}</span>
        </div>
        {#if movement.reason}
          <p class="text-muted-foreground mt-0.5 truncate text-xs">{movement.reason}</p>
        {/if}
      </div>

      <div class="shrink-0 text-right">
        <QuantityCell qty={movement.qty} uom={movement.productUom} />
        {#if movement.movementType === "SALE" || movement.movementType === "RETURN"}
          {#if movement.unitPriceCents !== null}
            <p class="text-muted-foreground text-xs">
              {formatPrice(movement.unitPriceCents, currency)}
            </p>
          {/if}
        {:else if movement.unitCostCents !== null}
          <p class="text-muted-foreground text-xs">
            {formatPrice(movement.unitCostCents, currency)}
          </p>
        {/if}
      </div>
    </div>
  </Card.Content>
</Card.Root>
