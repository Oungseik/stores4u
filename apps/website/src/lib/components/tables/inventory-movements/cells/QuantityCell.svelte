<script lang="ts">
  import { formatUom } from "$lib/utils";

  type Props = {
    qty: number;
    uom?: string | null;
  };

  const { qty, uom }: Props = $props();
</script>

<span class="font-medium" class:text-emerald-600={qty > 0} class:text-red-600={qty < 0}>
  {qty > 0 ? "+" : ""}{qty}
</span>
{#if uom}
  <span class="text-muted-foreground ml-1 text-xs font-normal">{formatUom(uom)}</span>
{/if}
